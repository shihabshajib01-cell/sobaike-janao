import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { ReportItem } from '../../types/report';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { BANGLADESH_DISTRICTS, DistrictInfo } from '../../data/districts';
import { useApp } from '../../context/AppContext';
import { toBanglaDigits } from '../../utils/formatters';
import { FeatureIcon } from '../branding/FeatureIcon';
import { CategoryBadge } from '../ui/CategoryBadge';
import { MapIcon } from './MapIcon';

export interface PublicIncidentMapProps {
  reports: ReportItem[];
  language: 'bn' | 'en';
  selectedSection: SectionKey | 'all';
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  onCenterChange?: (district: string) => void;
}

const BANGLADESH_CENTER: [number, number] = [23.8103, 90.4125];
const BANGLADESH_BOUNDS: L.LatLngBoundsExpression = [
  [20.5, 88.0],
  [26.7, 92.8],
];

export const PublicIncidentMap: React.FC<PublicIncidentMapProps> = ({
  reports,
  language,
  selectedSection,
  selectedDistrict,
  onSelectDistrict,
}) => {
  const { navigateTo } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Group reports by district to compute district clusters and coordinates
  const { mappedPoints, districtClusters } = useMemo(() => {
    const points: Array<{
      report: ReportItem;
      lat: number;
      lng: number;
      district: DistrictInfo | null;
    }> = [];

    const clusterMap = new Map<
      string,
      {
        district: DistrictInfo;
        count: number;
        harassmentCount: number;
        rickshawCount: number;
        extortionCount: number;
        reports: ReportItem[];
      }
    >();

    // Map each report to district coordinates
    reports.forEach((rep, idx) => {
      if (selectedSection !== 'all' && rep.segment !== selectedSection) return;

      const dEn = (rep.districtEn || '').toLowerCase().trim();
      const dBn = (rep.districtBn || '').trim();

      const foundDistrict = BANGLADESH_DISTRICTS.find(
        (d) =>
          d.nameEn.toLowerCase() === dEn ||
          d.nameBn === dBn ||
          d.id === dEn
      );

      if (foundDistrict) {
        // Add subtle deterministic jitter so multiple reports in the same district don't overlap exactly
        const seed = (idx * 17 + rep.id.charCodeAt(0)) % 100;
        const jitterLat = ((seed % 10) - 5) * 0.012;
        const jitterLng = (((seed / 10) | 0) - 5) * 0.012;

        const lat = foundDistrict.lat + jitterLat;
        const lng = foundDistrict.lng + jitterLng;

        points.push({
          report: rep,
          lat,
          lng,
          district: foundDistrict,
        });

        // Update district cluster
        if (!clusterMap.has(foundDistrict.id)) {
          clusterMap.set(foundDistrict.id, {
            district: foundDistrict,
            count: 0,
            harassmentCount: 0,
            rickshawCount: 0,
            extortionCount: 0,
            reports: [],
          });
        }
        const cl = clusterMap.get(foundDistrict.id)!;
        cl.count += 1;
        if (rep.segment === 'harassment') cl.harassmentCount += 1;
        if (rep.segment === 'rickshaw') cl.rickshawCount += 1;
        if (rep.segment === 'extortion') cl.extortionCount += 1;
        cl.reports.push(rep);
      }
    });

    return {
      mappedPoints: points,
      districtClusters: Array.from(clusterMap.values()),
    };
  }, [reports, selectedSection]);

  // Determine current theme for tiles
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

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
      zoomControl: false, // We use custom accessible zoom controls
      attributionControl: true,
    });

    // Use high-contrast clean tiles
    const tileUrl = isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    setIsMapReady(true);

    // Clean up on unmount
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      tileLayerRef.current = null;
    };
  }, [isDarkMode]);

  // Update Markers whenever mappedPoints or selectedDistrict changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !isMapReady) return;

    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    mappedPoints.forEach((pt) => {
      const isSelected = activeReport?.id === pt.report.id;
      const secConf = SECTIONS[pt.report.segment];
      const color = secConf.primaryColor;

      // Icon SVG inside marker
      const markerHtml = `
        <div class="custom-leaflet-marker ${isSelected ? 'is-selected' : ''}" style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: ${color};
          border: 2.5px solid #FFFFFF;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          ${isSelected ? 'transform: scale(1.3); box-shadow: 0 0 0 4px rgba(58,124,165,0.45); z-index: 1000;' : ''}
        ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            ${
              pt.report.segment === 'harassment'
                ? '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />'
                : pt.report.segment === 'rickshaw'
                ? '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />'
                : '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
            }
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'leaflet-custom-marker-wrapper',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: customIcon });

      // Click handler
      marker.on('click', () => {
        setActiveReport(pt.report);
        if (pt.district) {
          onSelectDistrict(pt.district.nameEn);
        }
      });

      // Hover tooltip
      const title = language === 'bn' ? pt.report.titleBn : pt.report.titleEn;
      const districtLabel = language === 'bn' ? pt.report.districtBn : pt.report.districtEn;
      marker.bindTooltip(
        `<div style="font-family: inherit; font-size: 13px; font-weight: 700; color: #050505;">${title}</div><div style="font-size: 11px; color: #65676B;">${districtLabel}</div>`,
        { direction: 'top', offset: [0, -12], opacity: 0.95 }
      );

      marker.addTo(markersLayer);
    });
  }, [mappedPoints, activeReport, isMapReady, language, onSelectDistrict]);

  // Center on Selected District when changed from dropdown or district panel
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    if (selectedDistrict === 'all') {
      mapInstanceRef.current.flyToBounds(BANGLADESH_BOUNDS, {
        padding: [24, 24],
        duration: 0.8,
      });
    } else {
      const found = BANGLADESH_DISTRICTS.find(
        (d) =>
          d.nameEn.toLowerCase() === selectedDistrict.toLowerCase() ||
          d.nameBn === selectedDistrict ||
          d.id === selectedDistrict.toLowerCase()
      );
      if (found) {
        mapInstanceRef.current.flyTo([found.lat, found.lng], 10, {
          duration: 0.9,
        });
      }
    }
  }, [selectedDistrict, isMapReady]);

  // Map Controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyToBounds(BANGLADESH_BOUNDS, {
        padding: [24, 24],
        duration: 0.8,
      });
    }
    onSelectDistrict('all');
    setActiveReport(null);
  };

  return (
    <div
      id="public-incident-map-card"
      className="relative rounded-2xl border border-subtle bg-surface shadow-xs overflow-hidden flex flex-col"
      style={{ minHeight: '520px' }}
    >
      {/* Map Control Bar Top-Right */}
      <div className="absolute top-3.5 right-3.5 z-[500] flex flex-col gap-1.5 shadow-sm">
        <button
          type="button"
          onClick={handleZoomIn}
          title={language === 'bn' ? 'জুম ইন' : 'Zoom In'}
          aria-label={language === 'bn' ? 'জুম ইন' : 'Zoom In'}
          className="w-9 h-9 rounded-xl bg-surface/95 backdrop-blur-xs border border-subtle hover:bg-surface-elevated text-primary flex items-center justify-center cursor-pointer transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)]"
        >
          <MapIcon name="plus" size="sm" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          title={language === 'bn' ? 'জুম আউট' : 'Zoom Out'}
          aria-label={language === 'bn' ? 'জুম আউট' : 'Zoom Out'}
          className="w-9 h-9 rounded-xl bg-surface/95 backdrop-blur-xs border border-subtle hover:bg-surface-elevated text-primary flex items-center justify-center cursor-pointer transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)]"
        >
          <MapIcon name="minus" size="sm" />
        </button>

        <button
          type="button"
          onClick={handleResetView}
          title={language === 'bn' ? 'সারাদেশ ভিউ' : 'Reset View'}
          aria-label={language === 'bn' ? 'সারাদেশ ভিউ' : 'Reset View'}
          className="w-9 h-9 rounded-xl bg-surface/95 backdrop-blur-xs border border-subtle hover:bg-surface-elevated text-primary flex items-center justify-center cursor-pointer transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)]"
        >
          <MapIcon name="reset" size="sm" />
        </button>
      </div>

      {/* Map Legend Overlay Top-Left */}
      <div className="absolute top-3.5 left-3.5 z-[500] bg-surface/90 backdrop-blur-xs border border-subtle rounded-xl p-2.5 shadow-2xs flex flex-col gap-1.5 text-[12px] max-w-[220px]">
        <span className="font-bold text-primary text-[11px] uppercase tracking-wider">
          {language === 'bn' ? 'মানচিত্র নির্দেশিকা' : 'Map Legend'}
        </span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[var(--sec-harassment-primary)] border border-white shrink-0" />
          <span className="text-secondary truncate">
            {language === 'bn' ? SECTIONS.harassment.shortNameBn : SECTIONS.harassment.shortNameEn}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[var(--sec-rickshaw-primary)] border border-white shrink-0" />
          <span className="text-secondary truncate">
            {language === 'bn' ? SECTIONS.rickshaw.shortNameBn : SECTIONS.rickshaw.shortNameEn}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[var(--sec-extortion-primary)] border border-white shrink-0" />
          <span className="text-secondary truncate">
            {language === 'bn' ? SECTIONS.extortion.shortNameBn : SECTIONS.extortion.shortNameEn}
          </span>
        </div>
      </div>

      {/* Total Mapped Indicator Bottom-Left */}
      <div className="absolute bottom-3.5 left-3.5 z-[500] bg-surface/95 backdrop-blur-xs border border-subtle rounded-xl px-3 py-1.5 shadow-2xs flex items-center gap-2 text-[12px] font-bold text-primary">
        <MapIcon name="map-pin" size="xs" className="text-primary" />
        <span>
          {language === 'bn'
            ? `${toBanglaDigits(mappedPoints.length)}টি স্থান প্রদর্শিত`
            : `${mappedPoints.length} locations mapped`}
        </span>
      </div>

      {/* Real Leaflet Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full flex-1 z-10"
        style={{ minHeight: '520px', backgroundColor: 'var(--ui-surface-subtle)' }}
      />

      {/* Empty State Banner if 0 reports match */}
      {mappedPoints.length === 0 && (
        <div className="absolute inset-0 z-[550] bg-surface/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
          <MapIcon name="alert-circle" size="xl" className="text-muted" />
          <h4 className="text-[17px] font-bold text-primary">
            {language === 'bn' ? 'কোনো প্রতিবেদন পাওয়া যায়নি' : 'No Mapped Reports'}
          </h4>
          <p className="text-[13px] text-muted max-w-xs">
            {language === 'bn'
              ? 'বর্তমান ফিল্টারের অধীনে কোনো তথ্য নেই। ফিল্টার পরিবর্তন করে দেখুন।'
              : 'No reports found for the selected category or area.'}
          </p>
        </div>
      )}

      {/* Active Selected Report Details Popup Card (Desktop floating / Mobile bottom sheet) */}
      {activeReport && (
        <div className="absolute bottom-3.5 right-3.5 left-3.5 sm:left-auto sm:max-w-sm z-[600] bg-surface border border-theme rounded-2xl p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-subtle">
            <div className="flex items-center gap-2 min-w-0">
              <CategoryBadge section={activeReport.segment} language={language} size="sm" />
              <span className="text-[12px] font-mono text-muted">#{activeReport.id}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveReport(null)}
              aria-label={language === 'bn' ? 'বন্ধ করুন' : 'Close card'}
              className="text-muted hover:text-primary cursor-pointer p-1 rounded-lg hover:bg-surface-subtle"
            >
              <MapIcon name="close" size="xs" />
            </button>
          </div>

          <div className="py-2.5 space-y-1.5 text-left">
            <h4 className="text-[15px] font-bold text-primary leading-snug line-clamp-2">
              {language === 'bn' ? activeReport.titleBn : activeReport.titleEn}
            </h4>
            <p className="text-[12px] text-secondary line-clamp-2 leading-relaxed">
              {language === 'bn' ? activeReport.shortDescriptionBn : activeReport.shortDescriptionEn}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-muted pt-1">
              <span className="flex items-center gap-1 truncate">
                <MapIcon name="map-pin" size="xs" />
                <span className="truncate">
                  {language === 'bn' ? activeReport.locationBn : activeReport.locationEn}
                </span>
              </span>
              <span className="shrink-0">
                {language === 'bn' ? activeReport.publishedDateBn : activeReport.publishedDateEn}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-subtle flex items-center justify-end">
            <button
              type="button"
              onClick={() => navigateTo(`/report-detail/${activeReport.id}`)}
              className="btn-primary-action px-3.5 py-1.5 rounded-xl text-[13px] font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs hover:brightness-105"
            >
              <span>{language === 'bn' ? 'সম্পূর্ণ প্রতিবেদন দেখুন' : 'View Full Report'}</span>
              <MapIcon name="arrow-right" size="xs" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicIncidentMap;
