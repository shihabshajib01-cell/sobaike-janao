import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
// Ensure global Leaflet is set before leaflet.heat evaluates in browser
if (typeof window !== 'undefined' && !(window as any).L) {
  (window as any).L = L;
}
import 'leaflet.heat';

import { ReportItem } from '../../types/report';
import { SectionKey } from '../../theme/tokens';
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

const BANGLADESH_CENTER: [number, number] = [23.8103, 90.4125];
const BANGLADESH_BOUNDS: L.LatLngBoundsExpression = [
  [20.5, 88.0],
  [26.7, 92.8],
];

export const PublicIncidentMap: React.FC<PublicIncidentMapProps> = ({
  reports,
  language,
  selectedDistrict,
  onSelectDistrict,
  onResetFilters,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [isMapReady, setIsMapReady] = useState(false);

  const isInitialMount = useRef(true);

  // 1. Filter reports with real incident coordinates
  const reportsWithRealCoords = useMemo(() => {
    return reports.filter((r) => {
      if (!r || !r.coordinates) return false;
      const lat = Number(r.coordinates.lat);
      const lng = Number(r.coordinates.lng);
      return (
        !isNaN(lat) &&
        !isNaN(lng) &&
        isFinite(lat) &&
        isFinite(lng) &&
        lat >= 20.0 &&
        lat <= 27.5 &&
        lng >= 88.0 &&
        lng <= 93.0
      );
    });
  }, [reports]);

  // 2. Aggregate reports by district for fallback & top district insight
  const { districtCounts, topDistrict, totalMappedInDistricts } = useMemo(() => {
    const map = new Map<string, { district: DistrictInfo; count: number }>();
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
      if (found && !isNaN(Number(found.lat)) && !isNaN(Number(found.lng))) {
        mappedInDist += 1;
        if (!map.has(found.id)) {
          map.set(found.id, { district: found, count: 0 });
        }
        map.get(found.id)!.count += 1;
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => b.count - a.count);

    return {
      districtCounts: list,
      topDistrict: list.length > 0 ? list[0].district : null,
      totalMappedInDistricts: mappedInDist,
    };
  }, [reports]);

  // 3. Determine resolution mode: 'incident' (real coords) vs 'district' (fallback)
  const hasRealCoords = reportsWithRealCoords.length > 0;
  const isDistrictFallback = !hasRealCoords && reports.length > 0;

  const totalReportsCount = reports.length;
  const mappedCount = hasRealCoords
    ? reportsWithRealCoords.length
    : isDistrictFallback
    ? totalMappedInDistricts
    : 0;

  // 4. Compute heat points and max intensity
  const { heatPoints, maxHeatWeight } = useMemo(() => {
    if (hasRealCoords) {
      // Case 1: Build heat layer ONLY from real incident coordinates (base weight = 1)
      const pts: Array<[number, number, number]> = [];
      for (const r of reportsWithRealCoords) {
        const lat = Number(r.coordinates?.lat);
        const lng = Number(r.coordinates?.lng);
        if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
          pts.push([lat, lng, 1]);
        }
      }
      const maxVal = Math.max(2, Math.min(8, Math.ceil(reportsWithRealCoords.length / 5)));
      return { heatPoints: pts, maxHeatWeight: maxVal };
    }

    if (isDistrictFallback) {
      // Case 2: District-level fallback heatmap (ONE point per district, weighted by count)
      const pts: Array<[number, number, number]> = [];
      for (const dc of districtCounts) {
        if (dc.district) {
          const lat = Number(dc.district.lat);
          const lng = Number(dc.district.lng);
          const count = Number(dc.count) || 1;
          if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
            pts.push([lat, lng, count]);
          }
        }
      }
      const maxVal = districtCounts.length > 0 ? Math.max(...districtCounts.map((dc) => dc.count)) : 1;
      return { heatPoints: pts, maxHeatWeight: Math.max(maxVal, 2) };
    }

    return { heatPoints: [], maxHeatWeight: 1 };
  }, [hasRealCoords, isDistrictFallback, reportsWithRealCoords, districtCounts]);

  // Check dark mode
  const isDarkMode =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: BANGLADESH_CENTER,
      zoom: 7,
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

    const tileUrl = isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

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
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
    };
  }, [isDarkMode]);

  // Update Heatmap Layer whenever heatPoints change
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    const map = mapInstanceRef.current;

    // Clean up existing heat layer
    if (heatLayerRef.current) {
      try {
        map.removeLayer(heatLayerRef.current);
      } catch {}
      heatLayerRef.current = null;
    }

    const safePoints = heatPoints.filter(
      (p) =>
        Array.isArray(p) &&
        typeof p[0] === 'number' &&
        typeof p[1] === 'number' &&
        !isNaN(p[0]) &&
        !isNaN(p[1]) &&
        isFinite(p[0]) &&
        isFinite(p[1])
    );

    if (safePoints.length > 0 && typeof (L as any).heatLayer === 'function') {
      try {
        const heatLayer = (L as any).heatLayer(safePoints, {
          radius: hasRealCoords ? 24 : 32,
          blur: hasRealCoords ? 15 : 22,
          maxZoom: 14,
          max: maxHeatWeight || 2,
          minOpacity: 0.4,
          gradient: {
            0.2: '#2563EB',
            0.4: '#06B6D4',
            0.6: '#10B981',
            0.8: '#F59E0B',
            1.0: '#EF4444',
          },
        });

        heatLayer.addTo(map);
        heatLayerRef.current = heatLayer;
      } catch (err) {
        console.warn('[PublicIncidentMap] Heatmap layer creation error:', err);
      }
    }
  }, [heatPoints, maxHeatWeight, hasRealCoords, isMapReady]);

  // Center on Selected District when changed from dropdown or district panel
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    const map = mapInstanceRef.current;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (selectedDistrict === 'all') {
        return; // Already cleanly centered at BANGLADESH_CENTER, zoom 7
      }
    }

    if (selectedDistrict === 'all') {
      try {
        const size = map.getSize();
        if (!size || size.x <= 50 || size.y <= 50) {
          map.invalidateSize();
          map.setView(BANGLADESH_CENTER, 7);
        } else {
          map.flyToBounds(BANGLADESH_BOUNDS, {
            padding: [24, 24],
            duration: 0.8,
          });
        }
      } catch (err) {
        console.warn('[PublicIncidentMap] flyToBounds error:', err);
        try {
          map.setView(BANGLADESH_CENTER, 7);
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
        typeof found.lat === 'number' &&
        typeof found.lng === 'number' &&
        !isNaN(found.lat) &&
        !isNaN(found.lng) &&
        isFinite(found.lat) &&
        isFinite(found.lng)
      ) {
        try {
          const size = map.getSize();
          if (!size || size.x <= 50 || size.y <= 50) {
            map.invalidateSize();
          }
          map.flyTo([found.lat, found.lng], 10, {
            duration: 0.9,
          });
        } catch (err) {
          console.warn('[PublicIncidentMap] flyTo error:', err);
          try {
            map.setView([found.lat, found.lng], 10);
          } catch {}
        }
      }
    }
  }, [selectedDistrict, isMapReady]);

  // Map Controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.zoomIn();
      } catch {}
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.zoomOut();
      } catch {}
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      try {
        const map = mapInstanceRef.current;
        const size = map.getSize();
        if (!size || size.x <= 50 || size.y <= 50) {
          map.invalidateSize();
          map.setView(BANGLADESH_CENTER, 7);
        } else {
          map.flyToBounds(BANGLADESH_BOUNDS, {
            padding: [24, 24],
            duration: 0.8,
          });
        }
      } catch {
        mapInstanceRef.current?.setView(BANGLADESH_CENTER, 7);
      }
    }
    onSelectDistrict('all');
  };

  // Generate accessible summary text
  const accessibleSummary = useMemo(() => {
    if (totalReportsCount === 0) {
      return language === 'bn'
        ? 'বর্তমান ফিল্টারে কোনো প্রতিবেদন নেই।'
        : 'No reports match the current filters.';
    }

    const selectedDistrictObj =
      selectedDistrict !== 'all'
        ? BANGLADESH_DISTRICTS.find(
            (d) =>
              d.nameEn.toLowerCase() === selectedDistrict.toLowerCase() ||
              d.nameBn === selectedDistrict ||
              d.id === selectedDistrict.toLowerCase()
          )
        : null;

    const topDistrictName = topDistrict
      ? language === 'bn'
        ? topDistrict.nameBn
        : topDistrict.nameEn
      : null;

    if (selectedDistrictObj) {
      if (language === 'bn') {
        return `${selectedDistrictObj.nameBn} জেলা: ${toBanglaDigits(totalReportsCount)}টি প্রতিবেদনের মধ্যে ${toBanglaDigits(mappedCount)}টি মানচিত্রে দেখানো হয়েছে।`;
      }
      return `${selectedDistrictObj.nameEn}: ${mappedCount} of ${totalReportsCount} reports mapped.`;
    }

    if (isDistrictFallback) {
      if (language === 'bn') {
        const totalBn = toBanglaDigits(totalReportsCount);
        const mappedBn = toBanglaDigits(mappedCount);
        return topDistrictName
          ? `জেলা-ভিত্তিক: ${totalBn}টি প্রতিবেদনের ${mappedBn}টি মানচিত্রে। সর্বাধিক প্রতিবেদন ${topDistrictName} জেলায়।`
          : `জেলা-ভিত্তিক: ${totalBn}টি প্রতিবেদনের মধ্যে ${mappedBn}টি মানচিত্রে দেখানো হয়েছে।`;
      }
      return topDistrictName
        ? `District-level: ${mappedCount} of ${totalReportsCount} reports mapped. Most in ${topDistrictName}.`
        : `District-level: ${mappedCount} of ${totalReportsCount} reports mapped.`;
    }

    if (language === 'bn') {
      const totalBn = toBanglaDigits(totalReportsCount);
      const mappedBn = toBanglaDigits(mappedCount);
      return topDistrictName
        ? `${totalBn}টি প্রতিবেদনের মধ্যে ${mappedBn}টি মানচিত্রে দেখানো হয়েছে। সবচেয়ে বেশি প্রতিবেদন ${topDistrictName} জেলায়।`
        : `${totalBn}টি প্রতিবেদনের মধ্যে ${mappedBn}টি মানচিত্রে দেখানো হয়েছে।`;
    } else {
      return topDistrictName
        ? `${mappedCount} of ${totalReportsCount} reports are mapped. ${topDistrictName} has the most reports.`
        : `${mappedCount} of ${totalReportsCount} reports are mapped.`;
    }
  }, [totalReportsCount, mappedCount, topDistrict, isDistrictFallback, selectedDistrict, language]);

  // Keep Leaflet properly sized when container dimensions change
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;
    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [isMapReady]);

  return (
    <div className="space-y-2">
      {/* 1. Accessible Text Summary (Above map) */}
      <div
        role="status"
        aria-live="polite"
        className="px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle text-[12px] sm:text-[13px] text-ui-content-secondary flex items-start sm:items-center justify-between gap-2 shadow-2xs"
      >
        <div className="flex items-start sm:items-center gap-2 min-w-0 w-full">
          <MapIcon name="info" size="xs" className="text-ui-content-muted shrink-0 mt-0.5 sm:mt-0" ariaHidden={true} />
          <span className="break-words leading-snug md:truncate md:leading-normal">{accessibleSummary}</span>
        </div>
      </div>

      {/* 2. Map Container & Visual Overlays */}
      <div
        id="public-heatmap-card"
        role="region"
        aria-label={language === 'bn' ? 'প্রতিবেদন হিটম্যাপ' : 'Reports heatmap'}
        className="relative rounded-2xl border border-ui-stroke-subtle bg-ui-surface shadow-xs overflow-hidden flex flex-col h-[330px] sm:h-[370px] md:h-[520px] md:min-h-[520px]"
      >
        {/* Zoom & Recenter Controls (Top-Right) */}
        <div className="absolute top-3.5 right-3.5 z-[500] flex flex-col gap-1.5 shadow-sm">
          <button
            type="button"
            onClick={handleZoomIn}
            title={language === 'bn' ? 'জুম ইন' : 'Zoom In'}
            aria-label={language === 'bn' ? 'জুম ইন' : 'Zoom In'}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-ui-surface/95 backdrop-blur-md border border-ui-stroke-subtle text-ui-content-primary flex items-center justify-center cursor-pointer transition-all shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
          >
            <MapIcon name="plus" size="sm" />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            title={language === 'bn' ? 'জুম আউট' : 'Zoom Out'}
            aria-label={language === 'bn' ? 'জুম আউট' : 'Zoom Out'}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-ui-surface/95 backdrop-blur-md border border-ui-stroke-subtle text-ui-content-primary flex items-center justify-center cursor-pointer transition-all shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
          >
            <MapIcon name="minus" size="sm" />
          </button>

          <button
            type="button"
            onClick={handleResetView}
            title={language === 'bn' ? 'সারাদেশ ভিউ' : 'Reset View'}
            aria-label={language === 'bn' ? 'সারাদেশ ভিউ' : 'Reset View'}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-ui-surface/95 backdrop-blur-md border border-ui-stroke-subtle text-ui-content-primary flex items-center justify-center cursor-pointer transition-all shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
          >
            <MapIcon name="reset" size="sm" />
          </button>
        </div>

        {/* Heatmap Legend (Top-Left) */}
        {totalReportsCount > 0 && (
          <div className="absolute top-3.5 left-3.5 z-[500]">
            <HeatmapLegend language={language} />
          </div>
        )}

        {/* District-Level Fallback Notification (Top-Center / Below Top-Left on mobile) */}
        {isDistrictFallback && (
          <div className="absolute top-3 sm:top-3.5 left-3 sm:left-1/2 sm:-translate-x-1/2 mt-16 sm:mt-0 z-[500] max-w-[240px] xs:max-w-[270px] sm:max-w-md bg-ui-surface/95 backdrop-blur-md border border-ui-stroke-subtle rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xs text-left">
            <div className="flex items-start gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
              <div className="space-y-0.5">
                <div className="text-[11px] sm:text-[12px] font-bold text-ui-content-primary">
                  {language === 'bn' ? 'জেলা-ভিত্তিক হিটম্যাপ' : 'District-level heatmap'}
                </div>
                <div className="text-[10px] sm:text-[11px] text-ui-content-secondary leading-tight sm:leading-snug">
                  {language === 'bn'
                    ? 'সুনির্দিষ্ট অবস্থান না থাকায় জেলা অনুযায়ী প্রতিবেদন দেখানো হচ্ছে।'
                    : 'Reports are shown by district because precise incident locations are unavailable.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Coverage Indicator (Bottom-Left) */}
        {totalReportsCount > 0 && (
          <div className="absolute bottom-3 sm:bottom-3.5 left-3 sm:left-3.5 z-[500] bg-ui-surface/95 backdrop-blur-md border border-ui-stroke-subtle rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-2xs flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[12px] font-medium text-ui-content-primary select-none max-w-[calc(100%-65px)]">
            <MapIcon name="map-pin" size="xs" className="text-ui-content-muted shrink-0" ariaHidden={true} />
            <span className="truncate sm:overflow-visible">
              {language === 'bn' ? (
                <>
                  <span className="sm:hidden">{toBanglaDigits(mappedCount)} / {toBanglaDigits(totalReportsCount)}টি প্রতিবেদন মানচিত্রে</span>
                  <span className="hidden sm:inline">{toBanglaDigits(mappedCount)}টি প্রতিবেদন মানচিত্রে দেখানো হয়েছে (মোট {toBanglaDigits(totalReportsCount)}টির মধ্যে)</span>
                </>
              ) : (
                `${mappedCount} of ${totalReportsCount} reports are shown on the map`
              )}
            </span>
          </div>
        )}

        {/* Real Leaflet Map Container */}
        <div
          ref={mapContainerRef}
          className="w-full flex-1 z-10 h-[330px] sm:h-[370px] md:h-[520px]"
          style={{ backgroundColor: 'var(--ui-surface-subtle)' }}
        />

        {/* Empty State Banner if 0 reports match active filters */}
        {totalReportsCount === 0 && (
          <div className="absolute inset-0 z-[550] bg-ui-surface/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
            <MapIcon name="alert-circle" size="xl" className="text-ui-content-muted" />
            <h4 className="text-[17px] font-bold text-ui-content-primary">
              {language === 'bn' ? 'এই ফিল্টারে কোনো প্রতিবেদন নেই' : 'No reports match these filters'}
            </h4>
            <p className="text-[13px] text-ui-content-muted max-w-xs">
              {language === 'bn'
                ? 'বর্তমান অনুসন্ধান বা ফিল্টারের সাথে কোনো তথ্যের মিল পাওয়া যায়নি।'
                : 'No reports found matching your current filter selection.'}
            </p>
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="btn-primary-action px-4 py-2 rounded-xl text-[13px] font-semibold min-h-[44px] cursor-pointer mt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
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
