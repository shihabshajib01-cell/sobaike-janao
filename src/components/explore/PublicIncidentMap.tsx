import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
// Ensure global Leaflet is set before leaflet.heat evaluates in browser
if (typeof window !== 'undefined' && !(window as any).L) {
  (window as any).L = L;
}
import 'leaflet.heat';

import { ReportItem } from '../../types/report';
import { SectionKey } from '../../theme/tokens';
import { useTaxonomy } from '../../services/taxonomyService';
import { HEATMAP_TOKENS } from '../../theme/data-viz-tokens';
import { BANGLADESH_DISTRICTS, DIVISIONS, DistrictInfo } from '../../data/districts';
import { getUpazilasByDistrict } from '../../data/upazilas';
import { toBanglaDigits } from '../../utils/formatters';
import { MapIcon } from './MapIcon';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { HeatmapLegend } from './HeatmapLegend';

export interface PublicIncidentMapProps {
  reports: ReportItem[];
  language: 'bn' | 'en';
  selectedSection: SectionKey | 'all';
  selectedDivision: string;
  onSelectDivision: (division: string) => void;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  onResetFilters?: () => void;
}

type MapLayerMode = 'density' | 'districts' | 'points';

interface DistrictAggregate {
  district: DistrictInfo;
  count: number;
  categoryCounts: Partial<Record<string, number>>;
}

const BANGLADESH_CENTER: [number, number] = [23.685, 90.3563];
const BANGLADESH_BOUNDS: L.LatLngBoundsExpression = [
  [20.3, 87.75],
  [26.85, 92.85],
];

// The existing design-system density palette also applies to district shading.
const DISTRICT_SHADES = [
  HEATMAP_TOKENS.colors.low,
  HEATMAP_TOKENS.colors.lowMedium,
  HEATMAP_TOKENS.colors.medium,
  HEATMAP_TOKENS.colors.mediumHigh,
  HEATMAP_TOKENS.colors.high,
];

// Coordinate-based matches are evidence of location; text-only locations are not
// silently assigned to upazilas. Holes and MultiPolygons are respected.
const containsCoordinate = (geometry: any, lat: number, lng: number): boolean => {
  const inRing = (ring: number[][]) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [ax, ay] = ring[i], [bx, by] = ring[j];
      if ((ay > lat) !== (by > lat) &&
          lng < ((bx - ax) * (lat - ay)) / (by - ay) + ax) inside = !inside;
    }
    return inside;
  };
  const inPolygon = (rings: number[][][]) =>
    rings.length > 0 && inRing(rings[0]) && !rings.slice(1).some(inRing);
  if (geometry?.type === 'Polygon') return inPolygon(geometry.coordinates);
  if (geometry?.type === 'MultiPolygon') return geometry.coordinates.some(inPolygon);
  return false;
};

const EMPTY_UPAZILA_FEATURES: any[] = [];

const UPAZILA_DIVISION_ASSETS: Record<string, string> = {
  barisal: 'barisal', chittagong: 'chittagong', dhaka: 'dhaka',
  khulna: 'khulna', mymensingh: 'mymensingh', rajshahi: 'rajshahi',
  rangpur: 'rangpur', sylhet: 'sylhet',
};

const isValidCoordinate = (report: ReportItem) => {
  const lat = Number(report.coordinates?.lat);
  const lng = Number(report.coordinates?.lng);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 20 &&
    lat <= 27.5 &&
    lng >= 88 &&
    lng <= 93
  );
};

const getTopCategory = (
  counts: Partial<Record<string, number>>,
  categoryKeys: SectionKey[]
) => {
  return categoryKeys.map((key) => ({
    key,
    count: counts[key] || 0,
  })).sort((a, b) => b.count - a.count)[0] || null;
};

export const PublicIncidentMap: React.FC<PublicIncidentMapProps> = ({
  reports,
  language,
  selectedSection,
  selectedDivision,
  onSelectDivision,
  selectedDistrict,
  onSelectDistrict,
  onResetFilters,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerRef = useRef<L.GeoJSON | null>(null);
  const labelLayerRef = useRef<L.LayerGroup | null>(null);
  const upazilaLayerRef = useRef<L.GeoJSON | null>(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const { navigateTo } = useApp();
  const { resolvedTheme } = useTheme();
  const { segments } = useTaxonomy();
  const categoryKeys = useMemo(
    () => Object.keys(segments) as SectionKey[],
    [segments]
  );
  // The new district geography is the initial view; Density and Points remain available.
  const [mapLayerMode, setMapLayerMode] = useState<MapLayerMode>('districts');
  // Fetch only within the Explore map chunk; retaining the existing marker fallback on failure.
  // A failed load leaves the existing district markers available as a safe fallback.
  const [districtGeometry, setDistrictGeometry] = useState<any | null>(null);
  const [upazilaData, setUpazilaData] = useState<{ districtId: string; features: any[] } | null>(null);
  const [upazilaLoadState, setUpazilaLoadState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [selectedUpazila, setSelectedUpazila] = useState<string | null>(null);
  const districtForUpazilas = BANGLADESH_DISTRICTS.find(
    d => selectedDistrict !== 'all' &&
      (d.id === selectedDistrict.toLowerCase() ||
       d.nameEn.toLowerCase() === selectedDistrict.toLowerCase() || d.nameBn === selectedDistrict)
  );
  const activeUpazilaFeatures = upazilaData && upazilaData.districtId === districtForUpazilas?.id
    ? upazilaData.features
    : EMPTY_UPAZILA_FEATURES;
  // All 601 canonical location choices remain accessible regardless of the
  // historical geometry asset's incomplete coverage.
  const canonicalUpazilaOptions = useMemo(
    () => districtForUpazilas ? getUpazilasByDistrict(districtForUpazilas.id) : [],
    [districtForUpazilas?.id]
  );
  const matchedCanonicalIDs = useMemo(
    () => new Set(activeUpazilaFeatures
      .map(feature => feature.properties.canonical_id as string | undefined)
      .filter((id): id is string => Boolean(id))),
    [activeUpazilaFeatures]
  );
  const selectedCanonicalUpazila = canonicalUpazilaOptions.find(item => item.id === selectedUpazila);
  const activeDivision = DIVISIONS.find(item =>
    item.id === selectedDivision.toLowerCase() ||
    item.nameEn.toLowerCase() === selectedDivision.toLowerCase() ||
    item.nameBn === selectedDivision
  );
  const availableMapDistricts = selectedDivision === 'all' || !activeDivision
    ? BANGLADESH_DISTRICTS
    : BANGLADESH_DISTRICTS.filter(item => item.divisionId === activeDivision.id);

  // Existing district selection controls the drilldown. The new geography is
  // lazily fetched only after a user chooses a district; no 498-feature bundle
  // is loaded on the national initial view.
  useEffect(() => {
    setSelectedUpazila(null);
    setUpazilaData(null);
    if (!districtForUpazilas || mapLayerMode !== 'districts' || !districtGeometry) {
      setUpazilaLoadState('idle');
      return;
    }
    const districtFeature = districtGeometry.features.find(
      (f: any) => f?.properties?.district_id === districtForUpazilas.id
    );
    const division = UPAZILA_DIVISION_ASSETS[districtForUpazilas.divisionId];
    if (!districtFeature || !division) {
      setUpazilaLoadState('error');
      return;
    }
    const controller = new AbortController();
    setUpazilaLoadState('loading');
    const load = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}geo/upazilas/${division}-2020.geojson`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error('Upazila geography HTTP ' + response.status);
        const result = await response.json();
        if (result?.type !== 'FeatureCollection' || !Array.isArray(result.features)) {
          throw new Error('Invalid upazila geography collection');
        }
        const features = result.features.filter((feature: any) =>
          feature?.properties?.parent_pcode === districtFeature.properties.ADM2_PCODE &&
          feature?.properties?.district_id === districtForUpazilas.id &&
          typeof feature?.properties?.name_en === 'string' && feature.geometry
        );
        if (!features.length || new Set(features.map((feature: any) => feature.properties.pcode)).size !== features.length) {
          throw new Error('Upazila geography failed district/P-code verification');
        }
        if (!controller.signal.aborted) {
          setUpazilaData({ districtId: districtForUpazilas.id, features });
          setUpazilaLoadState('idle');
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setUpazilaLoadState('error');
          console.warn('[PublicIncidentMap] Upazila layer unavailable; retaining district map:', error);
        }
      }
    };
    void load();
    return () => controller.abort();
  }, [selectedDistrict, districtGeometry, mapLayerMode]);

  const selectedUpazilaFeature = activeUpazilaFeatures.find(
    feature => feature.properties.canonical_id === selectedUpazila ||
      feature.properties.pcode === selectedUpazila
  );

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}geo/bangladesh-districts-2020.geojson`, { signal: controller.signal });
        if (!response.ok) throw new Error(`District asset HTTP ${response.status}`);
        const result = await response.json();
        const features: any[] = result?.features;
        if (result?.type !== 'FeatureCollection' || !Array.isArray(features) || features.length !== 64 ||
            new Set(features.map(f => f?.properties?.district_id)).size !== 64 ||
            features.some(f => !f?.properties?.district_id || !f?.properties?.ADM2_PCODE || !f?.geometry)) {
          throw new Error('District asset failed 64-district validation');
        }
        if (!controller.signal.aborted) setDistrictGeometry(result);
      } catch (error) {
        if (!controller.signal.aborted) console.warn('[PublicIncidentMap] Retaining district marker fallback:', error);
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  const isInitialMount = useRef(true);
  const countryBounds = useMemo(() => {
    if (!districtGeometry) return L.latLngBounds(BANGLADESH_BOUNDS);
    const bounds = L.geoJSON(districtGeometry as any).getBounds();
    return bounds.isValid() ? bounds : L.latLngBounds(BANGLADESH_BOUNDS);
  }, [districtGeometry]);

  const reportsWithRealCoords = useMemo(
    () => reports.filter(isValidCoordinate),
    [reports]
  );
  const selectedUpazilaReports = useMemo(() => {
    if (!selectedUpazilaFeature ||
      !selectedUpazilaFeature.properties.canonical_id ||
      selectedUpazilaFeature.properties.invalid_source_geometry) return [];
    return reportsWithRealCoords.filter(report =>
      containsCoordinate(selectedUpazilaFeature.geometry,
        Number(report.coordinates?.lat), Number(report.coordinates?.lng))
    );
  }, [reportsWithRealCoords, selectedUpazilaFeature]);

  const { districtCounts, totalMappedInDistricts } = useMemo(() => {
    const map = new Map<string, DistrictAggregate>();
    let mappedInDist = 0;

    reports.forEach((rep) => {
      const dEn = (rep.districtEn || '').toLowerCase().trim();
      const dBn = (rep.districtBn || '').trim();
      const found = BANGLADESH_DISTRICTS.find(
        (d) =>
          d.nameEn.toLowerCase() === dEn ||
          d.nameBn === dBn ||
          d.id === dEn
      );
      if (found && Number.isFinite(Number(found.lat)) && Number.isFinite(Number(found.lng))) {
        mappedInDist += 1;
        if (!map.has(found.id)) {
          map.set(found.id, {
            district: found,
            count: 0,
            categoryCounts: {},
          });
        }
        const entry = map.get(found.id)!;
        entry.count += 1;
        entry.categoryCounts[rep.segment] =
          (entry.categoryCounts[rep.segment] || 0) + 1;
      }
    });

    const list = Array.from(map.values()).sort((a, b) => b.count - a.count);

    return {
      districtCounts: list,
      totalMappedInDistricts: mappedInDist,
    };
  }, [reports]);

  const hasRealCoords = reportsWithRealCoords.length > 0;
  const isDistrictFallback = !hasRealCoords && reports.length > 0;

  const totalReportsCount = reports.length;
  const mappedCount = hasRealCoords
    ? reportsWithRealCoords.length
    : isDistrictFallback
      ? totalMappedInDistricts
      : 0;

  const { heatPoints, maxHeatWeight } = useMemo(() => {
    if (hasRealCoords) {
      const pts: Array<[number, number, number]> = reportsWithRealCoords.map((report) => [
        Number(report.coordinates?.lat),
        Number(report.coordinates?.lng),
        1,
      ]);
      const maxVal =
        reportsWithRealCoords.length <= 3
          ? 1
          : Math.max(2, Math.min(6, Math.ceil(reportsWithRealCoords.length / 4)));
      return { heatPoints: pts, maxHeatWeight: maxVal };
    }

    if (isDistrictFallback) {
      const pts: Array<[number, number, number]> = districtCounts.map((item) => [
        Number(item.district.lat),
        Number(item.district.lng),
        Math.max(1, item.count),
      ]);
      const rawMax =
        districtCounts.length > 0
          ? Math.max(...districtCounts.map((item) => item.count))
          : 1;
      return { heatPoints: pts, maxHeatWeight: Math.max(rawMax, 1) };
    }

    return { heatPoints: [], maxHeatWeight: 1 };
  }, [
    hasRealCoords,
    isDistrictFallback,
    reportsWithRealCoords,
    districtCounts,
  ]);

  // Geography-only canvas: there is no world map, commercial tile dependency,
  // surrounding country layer, or other geography outside the 64 districts.
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // A precision mouse/trackpad should zoom the desktop map with its wheel.
    // Keep wheel capture disabled for touch-first devices so page scrolling stays
    // natural; Leaflet's pinch and explicit +/- controls remain unchanged.
    const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const map = L.map(mapContainerRef.current, {
      center: BANGLADESH_CENTER,
      zoom: 6,
      minZoom: 5,
      maxZoom: 12,
      maxBounds: BANGLADESH_BOUNDS,
      maxBoundsViscosity: 1,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: desktopPointer.matches,
    });

    // A mouse can be connected or disconnected without reinitializing the map
    // or discarding its current district/upazila selection and zoom level.
    const syncWheelZoom = () => {
      if (desktopPointer.matches) map.scrollWheelZoom.enable();
      else map.scrollWheelZoom.disable();
    };
    desktopPointer.addEventListener('change', syncWheelZoom);
    mapInstanceRef.current = map;
    setIsMapReady(true);

    return () => {
      desktopPointer.removeEventListener('change', syncWheelZoom);
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      if (markerLayerRef.current) {
        map.removeLayer(markerLayerRef.current);
        markerLayerRef.current = null;
      }
      if (polygonLayerRef.current) {
        map.removeLayer(polygonLayerRef.current);
        polygonLayerRef.current = null;
      }
      if (upazilaLayerRef.current) {
        map.removeLayer(upazilaLayerRef.current);
        upazilaLayerRef.current = null;
      }
      if (labelLayerRef.current) {
        map.removeLayer(labelLayerRef.current);
        labelLayerRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    const map = mapInstanceRef.current;

    if (heatLayerRef.current) {
      try {
        map.removeLayer(heatLayerRef.current);
      } catch {}
      heatLayerRef.current = null;
    }

    if (markerLayerRef.current) {
      try {
        map.removeLayer(markerLayerRef.current);
      } catch {}
      markerLayerRef.current = null;
    }

    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }
    if (upazilaLayerRef.current) {
      map.removeLayer(upazilaLayerRef.current);
      upazilaLayerRef.current = null;
    }

    const resolveCategoryColor = (section: SectionKey) => {
      if (typeof window === 'undefined') return 'currentColor';
      const rootStyle = window.getComputedStyle(document.documentElement);
      const categoryColor = rootStyle
        .getPropertyValue(`--category-${section}-primary`)
        .trim();
      const fallbackColor = rootStyle.getPropertyValue('--md-secondary').trim();
      return categoryColor || fallbackColor || rootStyle.color;
    };

    const safePoints = heatPoints.filter(
      (point) =>
        Array.isArray(point) &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1])
    );

    const addDistrictOutlines = () => {
      if (!districtGeometry) return;
      const rootStyle = window.getComputedStyle(document.documentElement);
      const outline = rootStyle.getPropertyValue('--md-outline').trim() || HEATMAP_TOKENS.colors.mediumHigh;
      const polygons = L.geoJSON(districtGeometry as any, {
        style: {
          color: outline,
          weight: 1.1,
          opacity: 0.85,
          fillOpacity: 0,
          interactive: false,
        },
      });
      polygons.addTo(map);
      polygonLayerRef.current = polygons;
    };

    if (mapLayerMode === 'density') {
      if (safePoints.length > 0 && typeof (L as any).heatLayer === 'function') {
        try {
          const heatLayer = (L as any).heatLayer(safePoints, {
            radius: hasRealCoords ? 28 : 36,
            blur: hasRealCoords ? 18 : 24,
            maxZoom: 14,
            max: maxHeatWeight || 1,
            minOpacity: 0.55,
            gradient: HEATMAP_TOKENS.leafletGradient,
          });

          heatLayer.addTo(map);
          heatLayerRef.current = heatLayer;
        } catch (err) {
          console.warn('[PublicIncidentMap] Heatmap layer creation error:', err);
        }
      }
      addDistrictOutlines();
      return;
    }

    if (mapLayerMode === 'districts' && activeUpazilaFeatures.length > 0) {
      // The selected district remains visible behind the historic upazila
      // polygons, including where older source boundaries have gaps.
      const parent = districtGeometry?.features.find((feature: any) =>
        feature?.properties?.district_id === districtForUpazilas?.id
      );
      if (parent) {
        const outline = L.geoJSON(parent as any, {
          style: { color: HEATMAP_TOKENS.colors.mediumHigh, weight: 1.7,
            opacity: 0.8, fillOpacity: 0, interactive: false },
        }).addTo(map);
        polygonLayerRef.current = outline;
      }
      const rootStyle = getComputedStyle(document.documentElement);
      const outline = rootStyle.getPropertyValue('--md-outline').trim() ||
        HEATMAP_TOKENS.colors.mediumHigh;
      const normalFill = rootStyle.getPropertyValue('--md-surface-container').trim() ||
        rootStyle.getPropertyValue('--md-surface').trim() || HEATMAP_TOKENS.colors.low;
      const polygons = L.geoJSON({
        type: 'FeatureCollection',
        features: activeUpazilaFeatures,
      } as any, {
        style: (feature: any) => {
          const active = selectedUpazila !== null &&
            (feature?.properties?.canonical_id === selectedUpazila ||
              feature?.properties?.pcode === selectedUpazila);
          return {
            color: active ? HEATMAP_TOKENS.colors.high : outline,
            weight: active ? 2.8 : 1.25,
            opacity: 0.95,
            fillColor: active ? HEATMAP_TOKENS.colors.high : normalFill,
            fillOpacity: active ? 0.8 : 0.44,
            interactive: true,
          };
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const properties = feature.properties;
          const label = language === 'bn'
            ? properties.name_bn || properties.name_en
            : properties.name_en;
          const validBoundary = Boolean(properties.canonical_id) &&
            !properties.invalid_source_geometry;
          const preciseCount = validBoundary ? reportsWithRealCoords.filter(report =>
            containsCoordinate(feature.geometry,
              Number(report.coordinates?.lat), Number(report.coordinates?.lng))
          ).length : null;
          const tooltip = document.createElement('div');
          const title = document.createElement('strong');
          title.textContent = label;
          const note = document.createElement('div');
          note.textContent = !validBoundary
            ? properties.invalid_source_geometry
              ? language === 'bn'
                ? 'সীমানার উৎসে জ্যামিতিক ত্রুটি আছে; অবস্থানভিত্তিক গণনা উপলব্ধ নয়'
                : 'Source polygon needs repair; precise-location counts unavailable'
              : language === 'bn'
                ? 'এটি ঐতিহাসিক সীমানা; বর্তমান উপজেলা/থানা তালিকার সাথে পরিচয় নিশ্চিত নয়'
                : 'Historical polygon not yet matched to a verified registry location'
            : reportsWithRealCoords.length === 0
              ? language === 'bn'
                ? 'উপজেলা অনুযায়ী প্রতিবেদনের সংখ্যা উপলব্ধ নয়; প্রকাশিত ডেটায় সুনির্দিষ্ট স্থানাঙ্ক নেই'
                : 'Upazila report counts unavailable: precise coordinates are not in the public feed'
              : language === 'bn'
                ? `সুনির্দিষ্ট অবস্থানযুক্ত ${toBanglaDigits(preciseCount!)}টি প্রতিবেদন; অন্যগুলোর অবস্থান অনিশ্চিত`
                : `${preciseCount} precisely located reports; other locations unconfirmed`;
          tooltip.append(title, note);
          const path = layer as L.Path;
          path.bindTooltip(tooltip, { direction: 'top', opacity: 0.97 });
          const select = () => {
            setSelectedUpazila(properties.canonical_id || properties.pcode);
            const bounds = L.geoJSON(feature as any).getBounds();
            if (bounds.isValid()) {
              map.flyToBounds(bounds.pad(0.38), {
                padding: [30, 32],
                maxZoom: 10,
                duration: 0.5,
              });
            }
          };
          layer.on('click', select);
          layer.on('add', () => {
            const element = path.getElement();
            if (!element) return;
            element.setAttribute('tabindex', '0');
            element.setAttribute('role', 'button');
            element.setAttribute('aria-label', language === 'bn'
              ? `${label} উপজেলা নির্বাচন করুন`
              : `Select ${label} upazila`);
            element.addEventListener('keydown', (event: Event) => {
              const keyboard = event as KeyboardEvent;
              if (keyboard.key === 'Enter' || keyboard.key === ' ') {
                keyboard.preventDefault();
                select();
              }
            });
          });
        },
      });
      // Do not add any other country or unverified upazila choropleth values.
      polygons.addTo(map);
      upazilaLayerRef.current = polygons;
      return;
    }

    if (mapLayerMode === 'districts' && districtGeometry) {
      const counts = new Map(districtCounts.map(entry => [entry.district.id, entry]));
      const maxCount = Math.max(1, ...districtCounts.map(entry => entry.count));
      const style = getComputedStyle(document.documentElement);
      const outline = style.getPropertyValue('--md-outline-variant').trim() ||
        style.getPropertyValue('--md-outline').trim() || HEATMAP_TOKENS.colors.mediumHigh;
      const emptyFill = style.getPropertyValue('--md-surface-container').trim() ||
        style.getPropertyValue('--md-surface').trim() || HEATMAP_TOKENS.colors.low;

      const polygons = L.geoJSON(districtGeometry as any, {
        style: (feature: any) => {
          const id = feature?.properties?.district_id as string;
          const count = counts.get(id)?.count || 0;
          const selected = selectedDistrict.toLowerCase() === id ||
            BANGLADESH_DISTRICTS.some(d => d.id === id && d.nameEn.toLowerCase() === selectedDistrict.toLowerCase());
          const intensity = count > 0
            ? Math.min(4, Math.floor(4 * Math.log1p(count) / Math.log1p(maxCount)))
            : 0;
          return {
            color: selected ? HEATMAP_TOKENS.colors.high : outline,
            weight: selected ? 2.6 : 1,
            opacity: selected ? 1 : 0.85,
            fillColor: count > 0 ? DISTRICT_SHADES[intensity] : emptyFill,
            fillOpacity: count > 0 ? 0.88 : 0.5,
            interactive: true,
          };
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const id = feature?.properties?.district_id as string;
          const district = BANGLADESH_DISTRICTS.find(d => d.id === id);
          if (!district) return;
          const entry = counts.get(id);
          const content = document.createElement('div');
          content.className = 'space-y-1';
          const heading = document.createElement('strong');
          heading.textContent = language === 'bn' ? district.nameBn : district.nameEn;
          const total = document.createElement('div');
          total.textContent = language === 'bn'
            ? `${toBanglaDigits(entry?.count || 0)}টি প্রতিবেদন`
            : `${entry?.count || 0} reports`;
          content.append(heading, total);
          const polygonPath = layer as L.Path;
          polygonPath.bindTooltip(content, { direction: 'top', opacity: 0.96 });
          layer.on('click', () => onSelectDistrict(district.nameEn));
          // Preserve click interaction and make the same 64 districts reachable
          // by keyboard. District filters remain the alternative accessible route.
          layer.on('add', () => {
            const element = polygonPath.getElement();
            if (!element) return;
            element.setAttribute('data-district-id', district.id);
            element.setAttribute('tabindex', '0');
            element.setAttribute('role', 'button');
            element.setAttribute(
              'aria-label',
              language === 'bn'
                ? `${district.nameBn} জেলা, ${toBanglaDigits(entry?.count || 0)}টি প্রতিবেদন। নির্বাচন করুন`
                : `${district.nameEn} district, ${entry?.count || 0} reports. Select district`
            );
            element.addEventListener('keydown', (event: Event) => {
              const keyboard = event as KeyboardEvent;
              if (keyboard.key === 'Enter' || keyboard.key === ' ') {
                keyboard.preventDefault();
                onSelectDistrict(district.nameEn);
              }
            });
          });
        },
      });
      polygons.addTo(map);
      polygonLayerRef.current = polygons;
      return;
    }

    // Points and coordinate-less fallbacks retain their original markers.
    // Non-interactive geography stays visible without intercepting marker clicks.
    addDistrictOutlines();
    const layerGroup = L.layerGroup();

    if (mapLayerMode === 'districts' || !hasRealCoords) {
      districtCounts.forEach((item) => {
        const lat = Number(item.district.lat);
        const lng = Number(item.district.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const topCategory = getTopCategory(item.categoryCounts, categoryKeys);
        const color = topCategory
          ? resolveCategoryColor(topCategory.key)
          : resolveCategoryColor('public_safety');
        const radius = Math.max(9, Math.min(26, 8 + Math.sqrt(item.count) * 2.5));

        const marker = L.circleMarker([lat, lng], {
          radius,
          color,
          weight: 2,
          opacity: 0.95,
          fillColor: color,
          fillOpacity: 0.72,
        });

        const tooltip = document.createElement('div');
        tooltip.className = 'space-y-1';
        const name = document.createElement('strong');
        name.textContent =
          language === 'bn' ? item.district.nameBn : item.district.nameEn;
        tooltip.appendChild(name);

        const total = document.createElement('div');
        total.textContent =
          language === 'bn'
            ? `${toBanglaDigits(item.count)}টি প্রতিবেদন`
            : `${item.count} reports`;
        tooltip.appendChild(total);

        if (topCategory && topCategory.count > 0) {
          const category = document.createElement('div');
          const categoryMeta = segments[topCategory.key];
          const label =
            language === 'bn'
              ? categoryMeta?.shortNameBn || topCategory.key
              : categoryMeta?.shortNameEn || topCategory.key;
          category.textContent =
            language === 'bn'
              ? `শীর্ষ বিষয়: ${label} (${toBanglaDigits(topCategory.count)})`
              : `Top topic: ${label} (${topCategory.count})`;
          tooltip.appendChild(category);
        }

        marker.bindTooltip(tooltip, {
          direction: 'top',
          opacity: 0.96,
        });
        marker.on('click', () => onSelectDistrict(item.district.nameEn));
        marker.addTo(layerGroup);
      });
    } else {
      reportsWithRealCoords.forEach((report) => {
        const lat = Number(report.coordinates?.lat);
        const lng = Number(report.coordinates?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const color = resolveCategoryColor(report.segment);
        const marker = L.circleMarker([lat, lng], {
          radius: 7,
          color,
          weight: 2,
          opacity: 1,
          fillColor: color,
          fillOpacity: 0.82,
        });

        const tooltip = document.createElement('div');
        tooltip.className = 'space-y-1 max-w-[240px]';

        const category = document.createElement('div');
        const section = segments[report.segment];
        category.textContent =
          language === 'bn'
            ? section?.shortNameBn || report.segment
            : section?.shortNameEn || report.segment;
        tooltip.appendChild(category);

        const title = document.createElement('strong');
        title.textContent =
          language === 'bn' ? report.titleBn : report.titleEn;
        tooltip.appendChild(title);

        const location = document.createElement('div');
        location.textContent =
          language === 'bn' ? report.locationBn : report.locationEn;
        tooltip.appendChild(location);

        const date = document.createElement('div');
        date.textContent =
          language === 'bn' ? report.publishedDateBn : report.publishedDateEn;
        tooltip.appendChild(date);

        marker.bindTooltip(tooltip, {
          direction: 'top',
          opacity: 0.96,
        });
        marker.on('click', () => navigateTo(`/report-detail/${report.id}`));
        marker.addTo(layerGroup);
      });
    }

    layerGroup.addTo(map);
    markerLayerRef.current = layerGroup;
  }, [
    districtCounts,
    hasRealCoords,
    heatPoints,
    isMapReady,
    language,
    mapLayerMode,
    maxHeatWeight,
    navigateTo,
    onSelectDistrict,
    reportsWithRealCoords,
    districtGeometry,
    selectedDistrict,
    resolvedTheme,
    activeUpazilaFeatures,
    selectedUpazila,
  ]);

  // Bangladesh-only geographic context: division labels at country scale,
  // district labels when zoomed in. Labels never intercept polygon taps.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    const renderLabels = () => {
      if (labelLayerRef.current) map.removeLayer(labelLayerRef.current);
      const layer = L.layerGroup();
      const showDistricts = map.getZoom() >= 6.65 ||
        selectedDistrict !== 'all' || selectedDivision !== 'all';
      const items = showDistricts
        ? availableMapDistricts.map((item) => ({
            label: language === 'bn' ? item.nameBn : item.nameEn,
            lat: item.lat,
            lng: item.lng,
            selected:
              selectedDistrict !== 'all' &&
              (item.id === selectedDistrict.toLowerCase() ||
               item.nameEn.toLowerCase() === selectedDistrict.toLowerCase() ||
               item.nameBn === selectedDistrict),
          }))
        : DIVISIONS.map((item) => ({
            label: language === 'bn' ? item.nameBn : item.nameEn,
            lat: item.lat,
            lng: item.lng,
            selected: false,
          }));

      const viewport = map.getBounds().pad(0.08);
      for (const item of items) {
        if (!viewport.contains([item.lat, item.lng])) continue;
        L.marker([item.lat, item.lng], {
          interactive: false,
          keyboard: false,
          icon: L.divIcon({
            className: 'bangladesh-map-label-host',
            html: `<span class="bangladesh-map-label ${showDistricts ? 'is-district' : 'is-division'} ${item.selected ? 'is-selected' : ''}">${item.label}</span>`,
          }),
        }).addTo(layer);
      }
      layer.addTo(map);
      labelLayerRef.current = layer;
    };

    renderLabels();
    map.on('zoomend moveend', renderLabels);
    return () => {
      map.off('zoomend moveend', renderLabels);
      if (labelLayerRef.current) {
        map.removeLayer(labelLayerRef.current);
        labelLayerRef.current = null;
      }
    };
  }, [isMapReady, language, selectedDistrict, selectedDivision]);

  // Fit the actual district geometry, not a wider world-map rectangle.
  // Selected districts fit their true polygon bounds; the full-country view
  // is restored whenever the selection is cleared or reset.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;
    map.setMaxBounds(countryBounds.pad(0.05));
    const mobile = map.getSize().x < 600;
    const padding: L.PointTuple = mobile ? [2, 4] : [18, 18];
    const fitCountry = (animate: boolean) => {
      const fitZoom = map.getBoundsZoom(countryBounds, false, L.point(...padding));
      map.setMinZoom(Math.max(4, fitZoom - 0.02));
      const center = countryBounds.getCenter();
      if (animate) map.flyTo(center, fitZoom, { duration: 0.45 });
      else map.setView(center, fitZoom, { animate: false });
    };

    if (selectedDistrict === 'all') {
      const divisionDistricts = activeDivision
        ? BANGLADESH_DISTRICTS.filter(item => item.divisionId === activeDivision.id)
        : [];
      const divisionFeatures = districtGeometry?.features.filter((feature: any) =>
        divisionDistricts.some(item => item.id === feature?.properties?.district_id)
      ) || [];
      if (divisionFeatures.length > 0) {
        const bounds = L.geoJSON({
          type: 'FeatureCollection',
          features: divisionFeatures,
        } as any).getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds.pad(mobile ? 0.11 : 0.09), {
            padding: mobile ? [12, 18] : [24, 30],
            maxZoom: mobile ? 7.1 : 8,
            duration: isInitialMount.current ? 0 : 0.45,
          });
          isInitialMount.current = false;
          return;
        }
      }
      fitCountry(!isInitialMount.current);
      isInitialMount.current = false;
      return;
    }
    isInitialMount.current = false;
    const district = BANGLADESH_DISTRICTS.find((d) =>
      d.nameEn.toLowerCase() === selectedDistrict.toLowerCase() ||
      d.nameBn === selectedDistrict || d.id === selectedDistrict.toLowerCase()
    );
    const feature = districtGeometry?.features.find(
      (item: any) => item?.properties?.district_id === district?.id
    );
    if (feature) {
      const bounds = L.geoJSON(feature as any).getBounds();
      if (bounds.isValid()) {
        const contextualBounds = bounds.pad(mobile ? 1.15 : 0.75);
        map.flyToBounds(contextualBounds, {
          padding: mobile ? [18, 26] : [42, 42],
          maxZoom: mobile ? 7.35 : 8,
          duration: 0.5,
        });
        return;
      }
    }
    if (district) {
      map.flyTo([district.lat, district.lng], 8, { duration: 0.55 });
    }
  }, [selectedDistrict, selectedDivision, isMapReady, countryBounds, districtGeometry]);


  const handleSelectUpazila = (locationKey: string | null) => {
    setSelectedUpazila(locationKey);
    const showDistrict = () => {
      const district = districtGeometry?.features?.find((feature: any) =>
        feature?.properties?.district_id === districtForUpazilas?.id
      );
      if (!district) return;
      const bounds = L.geoJSON(district as any).getBounds();
      if (!bounds.isValid()) return;
      mapInstanceRef.current?.flyToBounds(bounds.pad(0.3), {
        padding: [20, 30],
        maxZoom: 8,
        duration: 0.45,
      });
    };
    // Never leave the map zoomed into a different upazila when the newly
    // selected canonical entry does not have an independently matched polygon.
    if (!locationKey) {
      showDistrict();
      return;
    }
    const feature = activeUpazilaFeatures.find(item =>
      item.properties.canonical_id === locationKey ||
      item.properties.pcode === locationKey
    );
    if (!feature) {
      showDistrict();
      return;
    }
    const bounds = L.geoJSON(feature as any).getBounds();
    if (bounds.isValid()) {
      mapInstanceRef.current?.flyToBounds(bounds.pad(0.38), {
        padding: [30, 32],
        maxZoom: 10,
        duration: 0.5,
      });
    }
  };

  const handleZoomIn = () => {
    try {
      mapInstanceRef.current?.zoomIn();
    } catch {}
  };

  const handleZoomOut = () => {
    try {
      mapInstanceRef.current?.zoomOut();
    } catch {}
  };

  const handleResetView = () => {
    // Reset selection through the existing Explore filter handler; the bounds
    // effect restores the Bangladesh-only viewport without competing flyTo calls.
    if (selectedDistrict === 'all') {
      const map = mapInstanceRef.current;
      if (map) {
        const padding: L.PointTuple = map.getSize().x < 600 ? [2, 4] : [18, 18];
        const fitZoom = map.getBoundsZoom(countryBounds, false, L.point(...padding));
        map.flyTo(countryBounds.getCenter(), fitZoom, { duration: 0.45 });
      }
    }
    onSelectDivision('all');
    onSelectDistrict('all');
  };

  const selectedDistrictObj =
    selectedDistrict !== 'all'
      ? BANGLADESH_DISTRICTS.find(
          (district) =>
            district.nameEn.toLowerCase() === selectedDistrict.toLowerCase() ||
            district.nameBn === selectedDistrict ||
            district.id === selectedDistrict.toLowerCase()
        )
      : null;

  const selectedSectionMeta =
    selectedSection !== 'all' ? segments[selectedSection] : null;

  const scopeLabel = selectedDistrictObj
    ? language === 'bn'
      ? `${selectedDistrictObj.nameBn} জেলা`
      : selectedDistrictObj.nameEn
    : activeDivision
      ? language === 'bn' ? `${activeDivision.nameBn} বিভাগ` : `${activeDivision.nameEn} Division`
      : selectedSectionMeta
      ? language === 'bn'
        ? selectedSectionMeta.shortNameBn
        : selectedSectionMeta.shortNameEn
      : language === 'bn'
        ? 'সারাদেশ'
        : 'Bangladesh';

  const accessibleSummary = useMemo(() => {
    if (totalReportsCount === 0) {
      return language === 'bn'
        ? 'বর্তমান ফিল্টারে কোনো প্রতিবেদন নেই।'
        : 'No reports match the current filters.';
    }

    if (mapLayerMode === 'districts' && districtGeometry) {
      const mapped = totalMappedInDistricts;
      return language === 'bn'
        ? `জেলা অনুযায়ী ${toBanglaDigits(totalReportsCount)}টি প্রকাশিত প্রতিবেদনের মধ্যে ${toBanglaDigits(mapped)}টি মানচিত্রে দেখানো হয়েছে।`
        : `${mapped} of ${totalReportsCount} published reports are mapped by district.`;
    }

    if (selectedDistrictObj) {
      const fallbackSuffix = isDistrictFallback
        ? language === 'bn'
          ? ' সুনির্দিষ্ট অবস্থান না থাকায় জেলা অনুযায়ী প্রতিবেদন দেখানো হচ্ছে।'
          : ' Reports are shown by district because precise incident locations are unavailable.'
        : '';

      if (language === 'bn') {
        return `${selectedDistrictObj.nameBn} জেলা: ${toBanglaDigits(totalReportsCount)}টি প্রতিবেদনের মধ্যে ${toBanglaDigits(mappedCount)}টি মানচিত্রে দেখানো হয়েছে।${fallbackSuffix}`;
      }
      return `${selectedDistrictObj.nameEn}: ${mappedCount} of ${totalReportsCount} reports mapped.${fallbackSuffix}`;
    }

    if (isDistrictFallback) {
      if (language === 'bn') {
        return `জেলা-ভিত্তিক: ${toBanglaDigits(totalReportsCount)}টি প্রতিবেদনের মধ্যে ${toBanglaDigits(mappedCount)}টি মানচিত্রে দেখানো হয়েছে। সুনির্দিষ্ট অবস্থান না থাকায় জেলা অনুযায়ী প্রতিবেদন দেখানো হচ্ছে।`;
      }
      return `District-level: ${mappedCount} of ${totalReportsCount} reports are mapped. Reports are shown by district because precise incident locations are unavailable.`;
    }

    if (language === 'bn') {
      return `${toBanglaDigits(totalReportsCount)}টি প্রতিবেদনের মধ্যে ${toBanglaDigits(mappedCount)}টি সুনির্দিষ্ট অবস্থান মানচিত্রে দেখানো হয়েছে।`;
    }
    return `${mappedCount} of ${totalReportsCount} reports have precise map locations.`;
  }, [
    isDistrictFallback,
    language,
    mappedCount,
    selectedDistrictObj,
    totalReportsCount,
    mapLayerMode,
    districtGeometry,
    totalMappedInDistricts,
  ]);

  useEffect(() => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;
    const observer = new ResizeObserver(() => {
      const map = mapInstanceRef.current;
      map?.invalidateSize();
      if (map && selectedDistrict === 'all' && countryBounds.isValid()) {
        const padding: L.PointTuple = map.getSize().x < 600 ? [2, 4] : [18, 18];
        const fitZoom = map.getBoundsZoom(countryBounds, false, L.point(...padding));
        map.setView(countryBounds.getCenter(), fitZoom, { animate: false });
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [isMapReady, selectedDistrict, countryBounds]);

  const modeDescription =
    mapLayerMode === 'density'
      ? language === 'bn'
        ? 'ঘনত্ব দিয়ে হটস্পট তুলনা করুন'
        : 'Compare hotspots by density'
      : mapLayerMode === 'districts'
        ? language === 'bn'
          ? districtGeometry ? 'জেলার সীমানায় প্রতিবেদন তুলনা করুন' : 'বৃত্তের আকারে জেলা অনুযায়ী প্রতিবেদন তুলনা করুন'
          : districtGeometry ? 'Compare reports across district boundaries' : 'Compare districts by report-volume bubbles'
        : hasRealCoords
          ? language === 'bn'
            ? 'সুনির্দিষ্ট অবস্থানের প্রতিবেদন পয়েন্ট দেখুন'
            : 'Inspect reports with precise locations'
          : language === 'bn'
            ? 'সুনির্দিষ্ট অবস্থান নেই—জেলা অবস্থান দেখানো হচ্ছে'
            : 'No precise locations—showing district locations';

  const modes: Array<{
    key: MapLayerMode;
    labelBn: string;
    labelEn: string;
    icon: 'flame' | 'layers' | 'map-pin';
  }> = [
    { key: 'density', labelBn: 'ঘনত্ব', labelEn: 'Density', icon: 'flame' },
    { key: 'districts', labelBn: 'জেলা', labelEn: 'Districts', icon: 'layers' },
    { key: 'points', labelBn: 'পয়েন্ট', labelEn: 'Points', icon: 'map-pin' },
  ];

  return (
    <div className="space-y-2.5">
      <div
        id="map-layer-toolbar"
        className="bg-ui-surface border border-ui-stroke-subtle ui-radius-control p-3 sm:p-3.5 shadow-[var(--elevation-2xs)] flex flex-col md:flex-row md:items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MapIcon name="layers" size="sm" className="text-ui-content-primary" ariaHidden={true} />
            <h3 className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary">
              {language === 'bn' ? 'মানচিত্র ভিউ' : 'Map view'}
            </h3>
            <span className="inline-flex items-center min-h-[28px] px-2 py-1 ui-radius-badge-md bg-ui-surface-subtle border border-ui-stroke-subtle type-compact font-[var(--font-weight-semibold)] text-ui-content-secondary truncate max-w-[180px]">
              {scopeLabel}
            </span>
          </div>
          <p className="type-compact text-ui-content-secondary mt-1">
            {modeDescription}
          </p>
        </div>

        <div
          role="group"
          aria-label={language === 'bn' ? 'মানচিত্রের স্তর' : 'Map layers'}
          className="inline-flex items-center self-start md:self-center bg-ui-surface-subtle p-1 ui-radius-control border border-ui-stroke-subtle"
        >
          {modes.map((mode) => {
            const active = mapLayerMode === mode.key;
            return (
              <button
                key={mode.key}
                id={`map-layer-${mode.key}`}
                type="button"
                aria-pressed={active}
                onClick={() => setMapLayerMode(mode.key)}
                className={`min-h-[44px] px-3 py-2 ui-radius-badge-md type-compact font-[var(--font-weight-semibold)] inline-flex items-center gap-1.5 border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                  active
                    ? 'bg-ui-surface text-ui-content-primary border-ui-stroke-subtle shadow-[var(--elevation-2xs)]'
                    : 'bg-transparent border-transparent text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface-hover'
                }`}
              >
                <MapIcon name={mode.icon} size="sm" ariaHidden={true} />
                <span>{language === 'bn' ? mode.labelBn : mode.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {mapLayerMode === 'districts' && (
        <div className="bg-ui-surface border border-ui-stroke-subtle ui-radius-control p-3 space-y-2"
          role="region"
          aria-label={language === 'bn' ? 'বিভাগ ও জেলা নির্বাচন' : 'Division and district navigation'}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label htmlFor="map-division-select"
                className="block type-compact font-[var(--font-weight-semibold)] text-ui-content-primary">
                {language === 'bn' ? 'বিভাগ (৮)' : 'Division (8)'}
              </label>
              <select id="map-division-select" value={activeDivision?.nameEn || 'all'}
                onChange={event => {
                  onSelectDivision(event.target.value);
                  onSelectDistrict('all');
                }}
                className="w-full min-h-[44px] border border-ui-stroke-default bg-ui-surface text-ui-content-primary ui-radius-control px-3 type-body focus-visible:ring-2 focus-visible:ring-ui-focus">
                <option value="all">{language === 'bn' ? 'সকল বিভাগ' : 'All divisions'}</option>
                {DIVISIONS.map(division => (
                  <option key={division.id} value={division.nameEn}>
                    {language === 'bn' ? division.nameBn : division.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="map-district-select"
                className="block type-compact font-[var(--font-weight-semibold)] text-ui-content-primary">
                {language === 'bn' ? 'জেলা (৬৪)' : 'District (64)'}
              </label>
              <select id="map-district-select" value={districtForUpazilas?.nameEn || 'all'}
                onChange={event => onSelectDistrict(event.target.value)}
                className="w-full min-h-[44px] border border-ui-stroke-default bg-ui-surface text-ui-content-primary ui-radius-control px-3 type-body focus-visible:ring-2 focus-visible:ring-ui-focus">
                <option value="all">{language === 'bn' ? 'সকল জেলা' : 'All districts'}</option>
                {availableMapDistricts.map(district => (
                  <option key={district.id} value={district.nameEn}>
                    {language === 'bn'
                      ? `${district.nameBn} (${district.divisionBn})`
                      : `${district.nameEn} (${district.divisionEn})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="type-meta text-ui-content-muted">
            {language === 'bn'
              ? 'এই বিভাগ ও জেলার নিয়ন্ত্রণ বিদ্যমান প্রতিবেদন ফিল্টারের সাথেও সংযুক্ত।'
              : 'These division and district controls use the existing report filters.'}
          </p>
        </div>
      )}

      {mapLayerMode === 'districts' && districtForUpazilas && (
        <div className="bg-ui-surface-subtle border border-ui-stroke-subtle ui-radius-control p-3 space-y-2" role="region"
          aria-label={language === 'bn' ? 'জেলা ও উপজেলার মানচিত্র' : 'District and upazila navigation'}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={() => onSelectDistrict('all')}
              className="min-h-[44px] px-2 text-ui-content-primary type-compact font-[var(--font-weight-semibold)] underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ui-focus">
              {language === 'bn'
                ? (activeDivision ? '← নির্বাচিত বিভাগে ফিরুন' : '← সব জেলায় ফিরুন')
                : (activeDivision ? '← Back to division' : '← Back to all districts')}
            </button>
            <strong className="type-compact text-ui-content-primary">
              {language === 'bn' ? districtForUpazilas.nameBn : districtForUpazilas.nameEn}
              {' · '}
              {language === 'bn' ? 'উপজেলা মানচিত্র' : 'Upazila map'}
            </strong>
          </div>
          {upazilaLoadState === 'loading' && (
            <p role="status" className="type-meta text-ui-content-secondary">
              {language === 'bn' ? 'উপজেলার সীমানা লোড হচ্ছে…' : 'Loading upazila boundaries…'}
            </p>
          )}
          {upazilaLoadState === 'error' && (
            <p role="status" className="type-meta text-ui-content-secondary">
              {language === 'bn' ? 'এই জেলার উপজেলার সীমানা এখন পাওয়া যাচ্ছে না। জেলার মানচিত্র চালু আছে।'
                : 'Upazila boundaries are unavailable for this district. District map remains available.'}
            </p>
          )}
          <label htmlFor="map-upazila-select"
            className="block type-compact font-[var(--font-weight-semibold)] text-ui-content-primary">
            {language === 'bn'
              ? `উপজেলা / থানা (${toBanglaDigits(canonicalUpazilaOptions.length)})`
              : `Upazila / Thana (${canonicalUpazilaOptions.length})`}
          </label>
          <select id="map-upazila-select" value={selectedUpazila || ''}
            onChange={event => handleSelectUpazila(event.target.value || null)}
            className="w-full min-h-[44px] border border-ui-stroke-default bg-ui-surface text-ui-content-primary ui-radius-control px-3 type-body focus-visible:ring-2 focus-visible:ring-ui-focus">
            <option value="">{language === 'bn' ? 'সকল উপজেলা / থানা' : 'All upazilas / thanas'}</option>
            <optgroup label={language === 'bn' ? 'প্রকল্পের বর্তমান উপজেলা / থানা তালিকা' : 'Current project upazila / thana registry'}>
              {[...canonicalUpazilaOptions]
                .sort((first, second) => (language === 'bn' ? first.nameBn : first.nameEn)
                  .localeCompare(language === 'bn' ? second.nameBn : second.nameEn))
                .map(item => (
                  <option key={item.id} value={item.id}>
                    {language === 'bn' ? item.nameBn : item.nameEn}
                    {!matchedCanonicalIDs.has(item.id)
                      ? (language === 'bn' ? ' — যাচাইকৃত সীমানা নেই' : ' — boundary not verified')
                      : ''}
                  </option>
                ))}
            </optgroup>
            {activeUpazilaFeatures.some(item => !item.properties.canonical_id) && (
              <optgroup label={language === 'bn'
                ? 'ঐতিহাসিক সীমানা — বর্তমান তালিকার সাথে পরিচয় যাচাই হয়নি'
                : 'Historical polygons — unmatched to current registry'}>
                {activeUpazilaFeatures.filter(item => !item.properties.canonical_id)
                  .sort((first, second) => first.properties.name_en.localeCompare(second.properties.name_en))
                  .map(feature => (
                    <option key={feature.properties.pcode} value={feature.properties.pcode}>
                      {feature.properties.name_en} — {language === 'bn' ? 'যাচাই হয়নি' : 'unverified'}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
          <p className="type-meta text-ui-content-secondary">
            {language === 'bn'
              ? '৬০১টি বর্তমান রেকর্ডই তাদের নিজ নিজ জেলায় নির্বাচন করা যায়। সীমানা না মিললে তা স্পষ্টভাবে চিহ্নিত থাকবে; প্রতিবেদন ফিল্টার জেলা পর্যন্ত সীমিত।'
              : 'All 601 project records are selectable within their districts. Unmatched boundaries are explicitly marked; public report filtering remains district-level.'}
          </p>
          {upazilaLoadState === 'idle' && upazilaData?.districtId === districtForUpazilas.id && (
            <p className="type-meta text-ui-content-muted">
              {language === 'bn'
                ? `এই জেলার ${toBanglaDigits(matchedCanonicalIDs.size)}টি রেকর্ডের ঐতিহাসিক সীমানার পরিচয় নিশ্চিত হয়েছে।`
                : `${matchedCanonicalIDs.size} records in this district have matched historical polygon identities.`}
            </p>
          )}
          {selectedCanonicalUpazila && !matchedCanonicalIDs.has(selectedCanonicalUpazila.id) &&
            upazilaLoadState !== 'loading' && (
            <p role="status" className="type-compact text-ui-content-secondary">
              {language === 'bn'
                ? 'এই উপজেলা / থানার জন্য বর্তমান তালিকার সাথে নিশ্চিত সীমানা এখনো পাওয়া যায়নি। জেলার মানচিত্র দেখানো হচ্ছে।'
                : 'No verified polygon matches this upazila / thana. The district map remains available.'}
            </p>
          )}
        </div>
      )}

      <div
        role="status"
        aria-live="polite"
        className="px-3 py-2 sm:px-3.5 sm:py-2 rounded-[var(--radius-control)] bg-ui-surface-subtle border border-ui-stroke-subtle type-compact text-ui-content-secondary flex items-start sm:items-center justify-between gap-2 shadow-[var(--elevation-2xs)]"
      >
        <div className="flex items-start sm:items-center gap-2 min-w-0 w-full">
          <MapIcon
            name="info"
            size="xs"
            className="text-ui-content-muted shrink-0 mt-0.5 sm:mt-0"
            ariaHidden={true}
          />
          <span className="break-words leading-snug">{accessibleSummary}</span>
        </div>
      </div>

      <div
        id="public-heatmap-card"
        role="region"
        aria-label={
          language === 'bn'
            ? 'প্রতিবেদন মানচিত্র'
            : 'Reports map'
        }
        className="relative isolate z-0 rounded-[var(--radius-card)] border border-ui-stroke-subtle bg-ui-surface shadow-[var(--elevation-xs)] overflow-hidden flex flex-col h-[460px] sm:h-[490px] md:h-[540px] md:min-h-[540px]"
      >
        <div className="absolute top-3 right-3 z-[500] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            title={language === 'bn' ? 'জুম ইন' : 'Zoom In'}
            aria-label={language === 'bn' ? 'জুম ইন' : 'Zoom In'}
            className="min-w-[44px] min-h-[44px] rounded-[var(--radius-control)] bg-ui-surface/95 backdrop-blur-md border border-ui-stroke-subtle text-ui-content-primary flex items-center justify-center cursor-pointer transition-all shadow-[var(--elevation-2xs)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
          >
            <MapIcon name="plus" size="sm" />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            title={language === 'bn' ? 'জুম আউট' : 'Zoom Out'}
            aria-label={language === 'bn' ? 'জুম আউট' : 'Zoom Out'}
            className="min-w-[44px] min-h-[44px] rounded-[var(--radius-control)] bg-ui-surface/95 backdrop-blur-md border border-ui-stroke-subtle text-ui-content-primary flex items-center justify-center cursor-pointer transition-all shadow-[var(--elevation-2xs)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
          >
            <MapIcon name="minus" size="sm" />
          </button>

          <button
            type="button"
            onClick={handleResetView}
            title={language === 'bn' ? 'সারাদেশ ভিউ' : 'Reset View'}
            aria-label={language === 'bn' ? 'সারাদেশ ভিউ' : 'Reset View'}
            className="min-w-[44px] min-h-[44px] rounded-[var(--radius-control)] bg-ui-surface/95 backdrop-blur-md border border-ui-stroke-subtle text-ui-content-primary flex items-center justify-center cursor-pointer transition-all shadow-[var(--elevation-2xs)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
          >
            <MapIcon name="reset" size="sm" />
          </button>
        </div>


        <div
          ref={mapContainerRef}
          className="public-bangladesh-map-canvas w-full flex-1 z-10 h-[460px] sm:h-[490px] md:h-[540px]"
        />


      </div>

      {mapLayerMode === 'districts' && selectedUpazila &&
        (selectedUpazilaFeature || selectedCanonicalUpazila) && (
        <section className="bg-ui-surface border border-ui-stroke-subtle ui-radius-card p-3.5 space-y-2.5"
          aria-labelledby="selected-upazila-heading">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 id="selected-upazila-heading" className="type-h4 text-ui-content-primary">
              {selectedCanonicalUpazila
                ? (language === 'bn' ? selectedCanonicalUpazila.nameBn : selectedCanonicalUpazila.nameEn)
                : selectedUpazilaFeature
                  ? (language === 'bn'
                    ? selectedUpazilaFeature.properties.name_bn || selectedUpazilaFeature.properties.name_en
                    : selectedUpazilaFeature.properties.name_en)
                  : ''}
            </h4>
            <button type="button" onClick={() => handleSelectUpazila(null)}
              className="min-h-[44px] px-2 type-compact underline underline-offset-4 text-ui-content-primary focus-visible:ring-2 focus-visible:ring-ui-focus">
              {language === 'bn' ? 'উপজেলা নির্বাচন মুছুন' : 'Clear upazila'}
            </button>
          </div>
          <p className="type-compact text-ui-content-secondary">
            {!selectedUpazilaFeature || !selectedUpazilaFeature.properties.canonical_id
              ? language === 'bn'
                ? 'বর্তমান উপজেলা / থানা রেজিস্ট্রির সাথে এই ঐতিহাসিক সীমানার নিশ্চিত মিল নেই। ভুল তথ্য এড়াতে এখানে প্রতিবেদন গণনা বা অনুমানভিত্তিক সীমানা দেখানো হচ্ছে না।'
                : 'This location does not have a confirmed polygon match in the current registry. No boundary or report count is inferred.'
              : selectedUpazilaFeature.properties.invalid_source_geometry
                ? language === 'bn'
                  ? 'এই উপজেলার মূল সীমানায় জ্যামিতিক ত্রুটি আছে। নির্ভুল অবস্থান যাচাই না হওয়া পর্যন্ত এখানে কোনো প্রতিবেদন গণনা করা হচ্ছে না।'
                  : 'This source polygon has a geometry defect. Reports are not assigned until an independently validated boundary is available.'
                : reportsWithRealCoords.length === 0
                  ? language === 'bn'
                    ? 'উপজেলার ঐতিহাসিক সীমানা দেখা যাচ্ছে, তবে গোপনীয়তার কারণে প্রকাশিত প্রতিবেদনে সুনির্দিষ্ট স্থানাঙ্ক নেই। উপজেলা অনুযায়ী প্রতিবেদন গণনা বর্তমানে উপলব্ধ নয়।'
                    : 'A historical boundary match is shown, but the public feed intentionally omits precise coordinates. Upazila report counts are unavailable.'
                  : language === 'bn'
                    ? `সুনির্দিষ্ট অবস্থান যাচাইযোগ্য ${toBanglaDigits(selectedUpazilaReports.length)}টি প্রতিবেদন। অন্য জেলা-ভিত্তিক প্রতিবেদনগুলো অনুমান করে এখানে দেখানো হয়নি।`
                    : `${selectedUpazilaReports.length} published reports with precise coordinates inside this boundary. Other district-level reports are not assigned by guesswork.`}
          </p>
          {selectedUpazilaReports.length > 0 && (
            <ul className="space-y-1.5">
              {selectedUpazilaReports.map(report => (
                <li key={report.id}>
                  <button type="button" onClick={() => navigateTo(`/report-detail/${report.id}`)}
                    className="min-h-[44px] w-full text-left type-compact font-[var(--font-weight-semibold)] text-ui-content-primary underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-ui-focus">
                    {language === 'bn' ? report.titleBn : report.titleEn}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="type-meta text-ui-content-muted">
            {language === 'bn'
              ? 'ঐতিহাসিক সীমানার সাথে বর্তমান উপজেলা / থানার পূর্ণ মিল এখনো সম্পূর্ণ নয়।'
              : 'Historical polygons do not yet provide complete current upazila / thana boundary coverage.'}
          </p>
        </section>
      )}

      {/* Explanations sit outside the map, leaving every district selectable on a phone. */}
      {mapLayerMode === 'districts' && districtGeometry && activeUpazilaFeatures.length === 0 && (
        <div
          id="district-map-legend"
          role="region"
          aria-label={language === 'bn' ? 'জেলা রঙের নির্দেশিকা' : 'District color legend'}
          className="bg-ui-surface-subtle border border-ui-stroke-subtle ui-radius-control px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2.5"
        >
          <span className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary">
            {language === 'bn' ? 'জেলা অনুযায়ী প্রকাশিত প্রতিবেদন' : 'Published reports by district'}
          </span>
          <div className="flex flex-wrap items-center gap-2.5 type-meta text-ui-content-secondary">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-3 w-3 border border-ui-stroke-default ui-radius-badge-md bg-ui-surface" />
              {language === 'bn' ? 'প্রতিবেদন নেই' : 'No reports'}
            </span>
            <span className="flex items-center gap-1.5">
              {language === 'bn' ? 'কম' : 'Low'}
              <span className="inline-flex overflow-hidden ui-radius-badge-md border border-ui-stroke-subtle" aria-hidden="true">
                {DISTRICT_SHADES.map((shade) => (
                  <span key={shade} className="h-3 w-5" style={{ backgroundColor: shade }} />
                ))}
              </span>
              {language === 'bn' ? 'বেশি' : 'High'}
            </span>
          </div>
          <span className="type-meta text-ui-content-muted">
            {language === 'bn' ? 'শুধু বর্তমান ফিল্টারের প্রতিবেদন; ঘটনার প্রকৃত হার নয়।' : 'Current filtered reports only; not incident prevalence.'}
          </span>
        </div>
      )}
      {mapLayerMode === 'districts' && activeUpazilaFeatures.length > 0 && (
        <p className="type-meta text-ui-content-secondary">
          {language === 'bn'
            ? 'উপজেলার রূপরেখা ঐতিহাসিক ভৌগোলিক তথ্য; রঙ দিয়ে প্রতিবেদনের সংখ্যা বোঝানো হচ্ছে না।'
            : 'Upazila outlines are historical geography, not a report-count choropleth.'}
        </p>
      )}
      {mapLayerMode === 'density' && totalReportsCount > 0 && (
        <HeatmapLegend language={language} className="!max-w-none" />
      )}
      {mapLayerMode === 'points' && (
        <p className="type-meta text-ui-content-secondary">
          {language === 'bn'
            ? hasRealCoords ? 'বিন্দুগুলো সুনির্দিষ্ট অবস্থানের প্রকাশিত প্রতিবেদন দেখায়।' : 'সুনির্দিষ্ট অবস্থান না থাকায় জেলা অনুযায়ী প্রতিবেদন দেখানো হচ্ছে।'
            : hasRealCoords ? 'Dots represent published reports with precise locations.' : 'District locations are shown because precise coordinates are unavailable.'}
        </p>
      )}
      <p className="type-small text-ui-content-muted leading-snug">
        {language === 'bn' ? 'মানচিত্র: Leaflet · জেলা সীমানা: BBS/OCHA 2020' : 'Map: Leaflet · District boundaries: BBS/OCHA 2020'} ·{' '}
        <a href="https://creativecommons.org/licenses/by/3.0/igo/" target="_blank" rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-ui-content-primary">CC BY 3.0 IGO</a>
        {activeUpazilaFeatures.length > 0 && (
          <span className="ml-1">
            {language === 'bn'
              ? '· উপজেলা সীমানা: সরবরাহকৃত ঐতিহাসিক তথ্য, বর্তমান বৈধতা যাচাইসাপেক্ষ'
              : '· Upazila boundaries: provided historical geometry; current validity unverified'}
          </span>
        )}
      </p>

      {totalReportsCount === 0 && (
        <div className="bg-ui-surface-subtle border border-ui-stroke-subtle ui-radius-control p-3 flex flex-wrap items-center gap-3">
          <span role="status" className="type-meta text-ui-content-secondary">
            {language === 'bn' ? 'বর্তমান ফিল্টারে কোনো প্রতিবেদন নেই।' : 'No reports match the current filters.'}
          </span>
          {onResetFilters && (
            <button type="button" onClick={onResetFilters}
              className="btn-primary-action px-3 min-h-[44px] ui-radius-control type-compact focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus">
              {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset filters'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicIncidentMap;
