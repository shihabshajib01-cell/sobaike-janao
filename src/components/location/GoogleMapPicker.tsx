import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MapPin, CheckCircle2, AlertCircle, Crosshair } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ReportLocationData, isValidIncidentCoordinates } from '../../services/types';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../../data/districts';

export interface GoogleMapPickerProps {
  location: ReportLocationData;
  onChange?: (updated: ReportLocationData) => void;
  onMapPointChange?: (lat: number, lng: number) => void;
  language: 'bn' | 'en';
  error?: string;
}

export const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  location,
  onChange,
  onMapPointChange,
  language,
  error,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pinMarkerRef = useRef<L.CircleMarker | null>(null);
  const haloMarkerRef = useRef<L.CircleMarker | null>(null);
  const lastCenteredDistrictOrDivisionRef = useRef<string>('');

  const hasValidCoordinates = isValidIncidentCoordinates(location.lat, location.lng);

  // Unified point selection handler
  const handleSelectPoint = useCallback(
    (lat: number, lng: number) => {
      // Round to 6 decimal places for clean storage
      const cleanLat = Number(lat.toFixed(6));
      const cleanLng = Number(lng.toFixed(6));

      if (onMapPointChange) {
        onMapPointChange(cleanLat, cleanLng);
      } else if (onChange) {
        onChange({
          ...location,
          lat: cleanLat,
          lng: cleanLng,
        });
      }
    },
    [location, onMapPointChange, onChange]
  );

  // Keep ref to latest point selection handler to prevent stale closures in Leaflet event listeners
  const latestSelectPointRef = useRef(handleSelectPoint);
  useEffect(() => {
    latestSelectPointRef.current = handleSelectPoint;
  }, [handleSelectPoint]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Determine initial center
    let initialLat = 23.6850;
    let initialLng = 90.3563;
    let initialZoom = 7;

    if (hasValidCoordinates && location.lat !== undefined && location.lng !== undefined) {
      initialLat = location.lat;
      initialLng = location.lng;
      initialZoom = 15;
    } else if (location.district) {
      const matchDistrict = BANGLADESH_DISTRICTS.find(
        (d) =>
          d.nameEn.toLowerCase() === location.district.toLowerCase() ||
          d.nameBn === location.district ||
          d.id === location.district.toLowerCase()
      );
      if (matchDistrict) {
        initialLat = matchDistrict.lat;
        initialLng = matchDistrict.lng;
        initialZoom = 12;
      }
    } else if (location.division) {
      const matchDivision = DIVISIONS.find(
        (d) =>
          d.nameEn.toLowerCase() === location.division.toLowerCase() ||
          d.nameBn === location.division ||
          d.id === location.division.toLowerCase()
      );
      if (matchDivision) {
        initialLat = matchDivision.lat;
        initialLng = matchDivision.lng;
        initialZoom = 9;
      }
    }

    // Enable wheel / trackpad zoom for desktop fine-pointer devices while protecting mobile page scroll
    const isFinePointer =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      minZoom: 6,
      maxZoom: 18,
      scrollWheelZoom: isFinePointer,
      keyboard: true,
      maxBounds: L.latLngBounds([19.5, 87.0], [27.5, 93.5]),
      maxBoundsViscosity: 0.5,
    });

    // Add OpenStreetMap tile layer with visible attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Map click event to select incident point
    map.on('click', (e: L.LeafletMouseEvent) => {
      latestSelectPointRef.current(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    // Ensure map tiles render properly after container mounts
    const timer1 = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      map.remove();
      mapInstanceRef.current = null;
      pinMarkerRef.current = null;
      haloMarkerRef.current = null;
    };
  }, []);

  // Update or clear pin marker when coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (hasValidCoordinates && location.lat !== undefined && location.lng !== undefined) {
      const latLng: [number, number] = [location.lat, location.lng];

      // Update or create outer halo
      if (!haloMarkerRef.current) {
        haloMarkerRef.current = L.circleMarker(latLng, {
          radius: 16,
          fillColor: '#dc2626',
          fillOpacity: 0.22,
          color: '#dc2626',
          weight: 1.5,
          opacity: 0.7,
          interactive: false,
        }).addTo(map);
      } else {
        haloMarkerRef.current.setLatLng(latLng);
      }

      // Update or create center pin point
      if (!pinMarkerRef.current) {
        pinMarkerRef.current = L.circleMarker(latLng, {
          radius: 8,
          fillColor: '#dc2626',
          fillOpacity: 1,
          color: '#ffffff',
          weight: 2.5,
          opacity: 1,
          interactive: false,
        }).addTo(map);
      } else {
        pinMarkerRef.current.setLatLng(latLng);
      }
    } else {
      // Coordinates missing or invalidated - remove marker from map
      if (haloMarkerRef.current) {
        haloMarkerRef.current.remove();
        haloMarkerRef.current = null;
      }
      if (pinMarkerRef.current) {
        pinMarkerRef.current.remove();
        pinMarkerRef.current = null;
      }
    }
  }, [hasValidCoordinates, location.lat, location.lng]);

  // Adjust map viewport center based on District / Division changes when no pin is selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // If user has already chosen a valid pin, do not force-move the map away from it
    if (hasValidCoordinates && location.lat !== undefined && location.lng !== undefined) {
      return;
    }

    const currentGeoKey = `${location.division || ''}::${location.district || ''}`;
    if (lastCenteredDistrictOrDivisionRef.current === currentGeoKey) {
      return;
    }
    lastCenteredDistrictOrDivisionRef.current = currentGeoKey;

    if (location.district) {
      const matchDistrict = BANGLADESH_DISTRICTS.find(
        (d) =>
          d.nameEn.toLowerCase() === location.district.toLowerCase() ||
          d.nameBn === location.district ||
          d.id === location.district.toLowerCase()
      );
      if (matchDistrict) {
        map.setView([matchDistrict.lat, matchDistrict.lng], 12, { animate: true });
        return;
      }
    }

    if (location.division) {
      const matchDivision = DIVISIONS.find(
        (d) =>
          d.nameEn.toLowerCase() === location.division.toLowerCase() ||
          d.nameBn === location.division ||
          d.id === location.division.toLowerCase()
      );
      if (matchDivision) {
        map.setView([matchDivision.lat, matchDivision.lng], 9, { animate: true });
        return;
      }
    }
  }, [location.division, location.district, hasValidCoordinates, location.lat, location.lng]);

  // ResizeObserver to handle container layout changes
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Accessible center-pin selector
  const handleSetPointAtCenter = () => {
    if (!mapInstanceRef.current) return;
    const center = mapInstanceRef.current.getCenter();
    latestSelectPointRef.current(center.lat, center.lng);
  };

  return (
    <div className="space-y-2 text-left">
      {/* Header & Status Indicator */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-[13px] font-bold text-primary flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-accent" />
          <span>
            {language === 'bn' ? 'ম্যাপে ঘটনার সুনির্দিষ্ট স্থান *' : 'Incident Location on Map *'}
          </span>
        </label>

        {hasValidCoordinates ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[12px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>
              {language === 'bn' ? 'ঘটনাস্থলের পয়েন্ট নির্বাচন করা হয়েছে' : 'Incident point selected'}
            </span>
            <span className="text-secondary text-[11px] font-normal">
              ({location.lat?.toFixed(4)}, {location.lng?.toFixed(4)})
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-[12px] font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              {language === 'bn' ? 'ম্যাপে ট্যাপ করে পয়েন্ট দিন' : 'Tap map to place point'}
            </span>
          </div>
        )}
      </div>

      <p className="text-[12.5px] text-secondary leading-relaxed">
        {language === 'bn'
          ? 'ম্যাপের মধ্যে ঘটনার সঠিক স্থানে ক্লিক বা স্পর্শ করে লাল মার্কার বসান।'
          : 'Click or tap on the map to place the incident marker at the exact location.'}
      </p>

      {/* Interactive Map Container */}
      <div
        className={`w-full h-60 sm:h-72 rounded-2xl border overflow-hidden bg-surface-subtle relative shadow-2xs transition-colors ${
          error ? 'border-red-500 ring-1 ring-red-500' : 'border-subtle'
        }`}
      >
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>

      {/* Accessible Action & Coordinate Info */}
      <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
        <button
          type="button"
          onClick={handleSetPointAtCenter}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-subtle hover:border-accent hover:bg-surface-subtle text-[12.5px] font-medium text-primary rounded-lg shadow-2xs transition-colors cursor-pointer min-h-[36px]"
          title={
            language === 'bn'
              ? 'ম্যাপের কেন্দ্রকে ঘটনাস্থল হিসেবে নির্বাচন করুন'
              : 'Set point at map center'
          }
        >
          <Crosshair className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>
            {language === 'bn'
              ? 'ম্যাপের কেন্দ্রকে ঘটনাস্থল হিসেবে নির্বাচন করুন'
              : 'Set point at map center'}
          </span>
        </button>

        {hasValidCoordinates && (
          <span className="text-[11.5px] text-muted">
            Lat: {location.lat} | Lng: {location.lng}
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-[12px] text-red-500 font-semibold flex items-center gap-1.5 pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
