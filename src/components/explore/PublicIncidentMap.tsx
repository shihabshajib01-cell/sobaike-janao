import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
// Ensure global Leaflet is set before leaflet.heat evaluates in browser
if (typeof window !== 'undefined' && !(window as any).L) {
  (window as any).L = L;
}
import 'leaflet.heat';

import { ReportItem } from '../../types/report';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { HEATMAP_TOKENS } from '../../theme/data-viz-tokens';
import { BANGLADESH_DISTRICTS, DistrictInfo } from '../../data/districts';
import { toBanglaDigits } from '../../utils/formatters';
import { MapIcon } from './MapIcon';
import { HeatmapLegend } from './HeatmapLegend';

export interface PublicIncidentMapProps {
  reports: ReportItem[];
  language: 'bn' | 'en';
  selectedSection: SectionKey | 'all';
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  onResetFilters?: () => void;
}

type MapLayerMode = 'density' | 'districts' | 'points';

interface DistrictAggregate {
  district: DistrictInfo;
  count: number;
  categoryCounts: Partial<Record<SectionKey, number>>;
}

const CATEGORY_KEYS = Object.keys(SECTIONS) as SectionKey[];

const BANGLADESH_CENTER: [number, number] = [23.685, 90.3563];
const BANGLADESH_BOUNDS: L.LatLngBoundsExpression = [
  [20.7, 88.0],
  [26.6, 92.7],
];

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

const getTopCategory = (counts: Partial<Record<SectionKey, number>>) => {
  return CATEGORY_KEYS.map((key) => ({
    key,
    count: counts[key] || 0,
  })).sort((a, b) => b.count - a.count)[0] || null;
};

export const PublicIncidentMap: React.FC<PublicIncidentMapProps> = ({
  reports,
  language,
  selectedSection,
  selectedDistrict,
  onSelectDistrict,
  onResetFilters,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [mapLayerMode, setMapLayerMode] = useState<MapLayerMode>('density');

  const isInitialMount = useRef(true);

  const reportsWithRealCoords = useMemo(
    () => reports.filter(isValidCoordinate),
    [reports]
  );

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

  const isDarkMode =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: BANGLADESH_CENTER,
      zoom: 7.2,
      minZoom: 6,
      maxZoom: 16,
      maxBounds: [
        [19.5, 86.5],
        [27.5, 94.0],
      ],
      maxBoundsViscosity: 0.85,
      zoomControl: false,
      attributionControl: true,
    });

    const tileUrl =
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;
    setIsMapReady(true);

    return () => {
      if (heatLayerRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeLayer(heatLayerRef.current);
        } catch {}
        heatLayerRef.current = null;
      }
      if (markerLayerRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeLayer(markerLayerRef.current);
        } catch {}
        markerLayerRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
    };
  }, [isDarkMode]);

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
      return;
    }

    const layerGroup = L.layerGroup();

    if (mapLayerMode === 'districts' || !hasRealCoords) {
      districtCounts.forEach((item) => {
        const lat = Number(item.district.lat);
        const lng = Number(item.district.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const topCategory = getTopCategory(item.categoryCounts);
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
          const categoryMeta = SECTIONS[topCategory.key];
          const label =
            language === 'bn'
              ? categoryMeta.shortNameBn
              : categoryMeta.shortNameEn;
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
        const section = SECTIONS[report.segment];
        category.textContent =
          language === 'bn' ? section.shortNameBn : section.shortNameEn;
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
    onSelectDistrict,
    reportsWithRealCoords,
  ]);

  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    const map = mapInstanceRef.current;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (selectedDistrict === 'all') {
        try {
          const size = map.getSize();
          if (!size || size.x <= 50 || size.y <= 50) {
            map.invalidateSize();
          }
          map.fitBounds(BANGLADESH_BOUNDS, {
            padding: [16, 16],
            animate: false,
          });
        } catch (err) {
          console.warn('[PublicIncidentMap] initial fitBounds error:', err);
          try {
            map.fitBounds(BANGLADESH_BOUNDS, { animate: false });
          } catch {
            try {
              map.setView(BANGLADESH_CENTER, 7.2);
            } catch {}
          }
        }
        return;
      }
    }

    if (selectedDistrict === 'all') {
      try {
        const size = map.getSize();
        if (!size || size.x <= 50 || size.y <= 50) {
          map.invalidateSize();
          map.setView(BANGLADESH_CENTER, 7.2);
        } else {
          map.flyToBounds(BANGLADESH_BOUNDS, {
            padding: [16, 16],
            duration: 0.8,
          });
        }
      } catch (err) {
        console.warn('[PublicIncidentMap] flyToBounds error:', err);
        try {
          map.setView(BANGLADESH_CENTER, 7.2);
        } catch {}
      }
    } else {
      const found = BANGLADESH_DISTRICTS.find(
        (d) =>
          d.nameEn.toLowerCase() === selectedDistrict.toLowerCase() ||
          d.nameBn === selectedDistrict ||
          d.id === selectedDistrict.toLowerCase()
      );
      if (
        found &&
        Number.isFinite(Number(found.lat)) &&
        Number.isFinite(Number(found.lng))
      ) {
        try {
          const size = map.getSize();
          if (!size || size.x <= 50 || size.y <= 50) {
            map.invalidateSize();
          }
          map.flyTo([Number(found.lat), Number(found.lng)], 10, {
            duration: 0.9,
          });
        } catch (err) {
          console.warn('[PublicIncidentMap] flyTo error:', err);
          try {
            map.setView([Number(found.lat), Number(found.lng)], 10);
          } catch {}
        }
      }
    }
  }, [selectedDistrict, isMapReady]);

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
    if (mapInstanceRef.current) {
      try {
        const map = mapInstanceRef.current;
        const size = map.getSize();
        if (!size || size.x <= 50 || size.y <= 50) {
          map.invalidateSize();
          map.setView(BANGLADESH_CENTER, 7.2);
        } else {
          map.flyToBounds(BANGLADESH_BOUNDS, {
            padding: [16, 16],
            duration: 0.8,
          });
        }
      } catch {
        mapInstanceRef.current?.setView(BANGLADESH_CENTER, 7.2);
      }
    }
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
    selectedSection !== 'all' ? SECTIONS[selectedSection] : null;

  const scopeLabel = selectedDistrictObj
    ? language === 'bn'
      ? `${selectedDistrictObj.nameBn} জেলা`
      : selectedDistrictObj.nameEn
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
  ]);

  useEffect(() => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;
    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [isMapReady]);

  const modeDescription =
    mapLayerMode === 'density'
      ? language === 'bn'
        ? 'ঘনত্ব দিয়ে হটস্পট তুলনা করুন'
        : 'Compare hotspots by density'
      : mapLayerMode === 'districts'
        ? language === 'bn'
          ? 'বৃত্তের আকারে জেলা অনুযায়ী প্রতিবেদন তুলনা করুন'
          : 'Compare districts by report-volume bubbles'
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
        className="relative isolate z-0 rounded-[var(--radius-card)] border border-ui-stroke-subtle bg-ui-surface shadow-[var(--elevation-xs)] overflow-hidden flex flex-col h-[350px] sm:h-[390px] md:h-[540px] md:min-h-[540px]"
      >
        <div className="absolute top-3.5 right-3.5 z-[500] flex flex-col gap-1.5 shadow-[var(--elevation-sm)]">
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

        {totalReportsCount > 0 && mapLayerMode === 'density' && (
          <div className="absolute top-3.5 left-3.5 z-[500]">
            <HeatmapLegend language={language} />
          </div>
        )}

        {totalReportsCount > 0 && mapLayerMode !== 'density' && (
          <div className="absolute top-3.5 left-3.5 z-[500] max-w-[220px] rounded-[var(--radius-control)] bg-ui-surface/95 backdrop-blur-md border border-ui-stroke-subtle px-3 py-2.5 shadow-[var(--elevation-sm)]">
            <div className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary">
              {mapLayerMode === 'districts'
                ? language === 'bn'
                  ? 'জেলা তুলনা'
                  : 'District comparison'
                : language === 'bn'
                  ? 'প্রতিবেদন অবস্থান'
                  : 'Report locations'}
            </div>
            <p className="type-compact text-ui-content-secondary mt-0.5 leading-snug">
              {mapLayerMode === 'districts'
                ? language === 'bn'
                  ? 'বড় বৃত্ত মানে বেশি প্রতিবেদন। রঙ শীর্ষ বিষয় দেখায়।'
                  : 'Larger bubbles mean more reports. Color shows the top topic.'
                : hasRealCoords
                  ? language === 'bn'
                    ? 'প্রতিটি বিন্দু একটি সুনির্দিষ্ট প্রতিবেদন অবস্থান।'
                    : 'Each point represents a report with a precise location.'
                  : language === 'bn'
                    ? 'সুনির্দিষ্ট পয়েন্ট না থাকায় জেলা অবস্থান দেখানো হচ্ছে।'
                    : 'District locations are shown because precise points are unavailable.'}
            </p>
          </div>
        )}

        <div
          ref={mapContainerRef}
          className="w-full flex-1 z-10 h-[350px] sm:h-[390px] md:h-[540px]"
          style={{ backgroundColor: 'var(--ui-surface-subtle)' }}
        />

        {totalReportsCount === 0 && (
          <div className="absolute inset-0 z-[550] bg-ui-surface/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
            <MapIcon name="alert-circle" size="xl" className="text-ui-content-muted" />
            <h4 className="type-h3 font-[var(--font-weight-bold)] text-ui-content-primary">
              {language === 'bn'
                ? 'এই ফিল্টারে কোনো প্রতিবেদন নেই'
                : 'No reports match these filters'}
            </h4>
            <p className="type-compact text-ui-content-muted max-w-xs">
              {language === 'bn'
                ? 'বর্তমান অনুসন্ধান বা ফিল্টারের সাথে কোনো তথ্যের মিল পাওয়া যায়নি।'
                : 'No reports found matching your current filter selection.'}
            </p>
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="btn-primary-action px-4 py-2 rounded-[var(--radius-control)] type-compact font-[var(--font-weight-semibold)] min-h-[44px] cursor-pointer mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset filters'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicIncidentMap;
