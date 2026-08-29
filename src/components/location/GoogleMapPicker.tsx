import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapPin, Search, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ReportLocationData } from '../../services/types';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../../data/districts';

interface GoogleMapPickerProps {
  location: ReportLocationData;
  onChange: (updated: ReportLocationData) => void;
  language: 'bn' | 'en';
}

export const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  location,
  onChange,
  language,
}) => {
  const rawApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const apiKey =
    typeof rawApiKey === 'string' &&
    rawApiKey.trim() !== '' &&
    rawApiKey !== 'undefined' &&
    rawApiKey !== 'null'
      ? rawApiKey.trim()
      : null;

  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<boolean>(!apiKey);
  const [searchQuery, setSearchQuery] = useState<string>(location.formattedAddress || '');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);

  // Default coordinates (Dhaka center)
  const defaultLat = location.lat || 23.8103;
  const defaultLng = location.lng || 90.4125;

  // Filter districts based on selected division
  const filteredDistricts = useMemo(() => {
    if (!location.division) {
      return BANGLADESH_DISTRICTS;
    }
    const cleanDiv = location.division.toLowerCase().trim();
    return BANGLADESH_DISTRICTS.filter((d) => {
      return (
        d.divisionBn.toLowerCase() === cleanDiv ||
        d.divisionEn.toLowerCase() === cleanDiv ||
        d.divisionId.toLowerCase() === cleanDiv
      );
    });
  }, [location.division]);

  useEffect(() => {
    if (!apiKey) {
      setMapError(true);
      return;
    }

    // Capture Google Maps auth failure
    (window as any).gm_authFailure = () => {
      setMapError(true);
    };

    // Check if Google script already injected and ready
    if ((window as any).google?.maps) {
      initMap();
      return;
    }

    const existingScript = document.getElementById('google-maps-script') as HTMLScriptElement | null;
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initMap();
      };
      script.onerror = () => {
        setMapError(true);
      };
      document.head.appendChild(script);
    } else {
      if ((window as any).google?.maps) {
        initMap();
      } else {
        existingScript.addEventListener('load', initMap);
        existingScript.addEventListener('error', () => setMapError(true));
      }
    }

    function initMap() {
      if (!mapContainerRef.current || !(window as any).google?.maps) return;

      try {
        const google = (window as any).google;
        const initialPos = { lat: defaultLat, lng: defaultLng };

        const map = new google.maps.Map(mapContainerRef.current, {
          center: initialPos,
          zoom: location.lat ? 15 : 12,
          mapId: 'DEMO_MAP_ID',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          restriction: {
            latLngBounds: {
              north: 26.7,
              south: 20.5,
              west: 87.8,
              east: 92.8,
            },
            strictBounds: false,
          },
        });

        let marker: any = null;
        if (google.maps.marker?.AdvancedMarkerElement) {
          try {
            const pinDiv = document.createElement('div');
            pinDiv.style.width = '28px';
            pinDiv.style.height = '28px';
            pinDiv.style.borderRadius = '50%';
            pinDiv.style.backgroundColor = '#dc2626';
            pinDiv.style.border = '3px solid #ffffff';
            pinDiv.style.boxShadow = '0 3px 6px rgba(0,0,0,0.35)';
            pinDiv.style.cursor = 'grab';

            marker = new google.maps.marker.AdvancedMarkerElement({
              position: initialPos,
              map: map,
              gmpDraggable: true,
              title: language === 'bn' ? 'ঘটনাস্থল পিন' : 'Incident Location',
              content: pinDiv,
            });
          } catch {
            // graceful fallback if AdvancedMarkerElement initialization fails
          }
        }

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;

        // Map click to reposition pin
        map.addListener('click', (e: any) => {
          try {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            if (marker) {
              if (marker.position) {
                marker.position = { lat, lng };
              } else if (marker.setPosition) {
                marker.setPosition({ lat, lng });
              }
            }
            reverseGeocode(lat, lng);
          } catch {
            // ignore click handler error
          }
        });

        // Marker drag end
        if (marker && marker.addListener) {
          marker.addListener('dragend', (e: any) => {
            try {
              const lat = typeof e.latLng?.lat === 'function' ? e.latLng.lat() : marker.position?.lat;
              const lng = typeof e.latLng?.lng === 'function' ? e.latLng.lng() : marker.position?.lng;
              if (lat && lng) {
                reverseGeocode(lat, lng);
              }
            } catch {
              // ignore drag handler error
            }
          });
        }

        // Place search / Geocoder forward search integration
        setMapLoaded(true);
      } catch {
        setMapError(true);
      }
    }
  }, [apiKey]);

  const searchLocation = (query: string) => {
    if (!query || !query.trim()) return;
    const google = (window as any).google;
    if (!google?.maps?.Geocoder || !mapInstanceRef.current) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      {
        address: query,
        componentRestrictions: { country: 'bd' },
      },
      (results: any, status: any) => {
        if (status === 'OK' && results && results[0] && results[0].geometry?.location) {
          const loc = results[0].geometry.location;
          const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
          const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;

          mapInstanceRef.current.setCenter({ lat, lng });
          mapInstanceRef.current.setZoom(16);

          const marker = markerInstanceRef.current;
          if (marker) {
            if (marker.position) {
              marker.position = { lat, lng };
            } else if (marker.setPosition) {
              marker.setPosition({ lat, lng });
            }
          }

          parsePlaceComponents(results[0], lat, lng);
        }
      }
    );
  };

  const reverseGeocode = (lat: number, lng: number) => {
    const google = (window as any).google;
    if (!google?.maps?.Geocoder) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
      if (status === 'OK' && results && results[0]) {
        parsePlaceComponents(results[0], lat, lng);
      } else {
        onChange({
          ...location,
          lat,
          lng,
        });
      }
    });
  };

  const parsePlaceComponents = (place: any, lat: number, lng: number) => {
    let formatted = place.formatted_address || place.name || '';
    let division = location.division;
    let district = location.district;
    let thana = location.upazilaOrThana;
    let area = location.area;
    let road = location.road;

    if (place.address_components) {
      for (const comp of place.address_components) {
        const types = comp.types;
        if (types.includes('administrative_area_level_1')) {
          division = comp.long_name.replace(' Division', '');
        } else if (types.includes('administrative_area_level_2')) {
          district = comp.long_name.replace(' District', '');
        } else if (types.includes('administrative_area_level_3') || types.includes('sublocality_level_1')) {
          thana = comp.long_name;
        } else if (types.includes('sublocality') || types.includes('neighborhood')) {
          area = comp.long_name;
        } else if (types.includes('route')) {
          road = comp.long_name;
        }
      }
    }

    // Try to match division with our standardized names
    if (district) {
      const matchDist = BANGLADESH_DISTRICTS.find(
        (d) =>
          d.nameEn.toLowerCase() === district.toLowerCase() ||
          d.nameBn === district ||
          d.id === district.toLowerCase()
      );
      if (matchDist) {
        district = language === 'bn' ? matchDist.nameBn : matchDist.nameEn;
        division = language === 'bn' ? matchDist.divisionBn : matchDist.divisionEn;
      }
    }

    setSearchQuery(formatted);

    onChange({
      ...location,
      formattedAddress: formatted || `${area}, ${district}`,
      division: division || location.division,
      district: district || location.district,
      upazilaOrThana: thana || location.upazilaOrThana,
      area: area || location.area,
      road: road || location.road,
      lat,
      lng,
      placeId: place.place_id,
    });
  };

  const handleDivisionChange = (newDivision: string) => {
    let newDistrict = location.district;
    // Check if current district is valid for new division
    if (newDivision && newDistrict) {
      const isValid = BANGLADESH_DISTRICTS.some(
        (d) =>
          (d.divisionBn === newDivision || d.divisionEn === newDivision) &&
          (d.nameBn === newDistrict || d.nameEn === newDistrict)
      );
      if (!isValid) {
        newDistrict = '';
      }
    }

    const parts = [location.area, location.upazilaOrThana, newDistrict, newDivision].filter(Boolean);
    onChange({
      ...location,
      division: newDivision,
      district: newDistrict,
      formattedAddress: parts.join(', '),
    });
  };

  const handleDistrictChange = (newDistrict: string) => {
    let autoDivision = location.division;
    if (newDistrict) {
      const found = BANGLADESH_DISTRICTS.find(
        (d) => d.nameBn === newDistrict || d.nameEn === newDistrict || d.id === newDistrict
      );
      if (found) {
        autoDivision = language === 'bn' ? found.divisionBn : found.divisionEn;
      }
    }

    const parts = [location.area, location.upazilaOrThana, newDistrict, autoDivision].filter(Boolean);
    onChange({
      ...location,
      district: newDistrict,
      division: autoDivision,
      formattedAddress: parts.join(', '),
    });
  };

  const handleFieldChange = (field: keyof ReportLocationData, val: string) => {
    const updated = {
      ...location,
      [field]: val,
    };
    if (!updated.formattedAddress || field === 'area' || field === 'road') {
      const parts = [updated.area, updated.upazilaOrThana, updated.district, updated.division].filter(Boolean);
      updated.formattedAddress = parts.join(', ');
    }
    onChange(updated);
  };

  return (
    <div className="space-y-5 text-left">
      {/* Top Search Input / Autocomplete */}
      <div className="space-y-1.5">
        <label className="block text-[14px] font-semibold text-secondary">
          {language === 'bn'
            ? 'লোকেশন খুঁজুন'
            : 'Search location'}
        </label>

        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-muted absolute left-3.5 pointer-events-none" />
          <input
            ref={autocompleteInputRef}
            type="text"
            value={searchQuery}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                searchLocation(searchQuery);
              }
            }}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleFieldChange('formattedAddress', e.target.value);
            }}
            placeholder={
              language === 'bn'
                ? 'স্থান বা এলাকার নাম লিখুন (উদাঃ মিরপুর-১০, ধানমন্ডি ২৭, চকবাজার)'
                : 'Search place or road (e.g. Mirpur-10, Dhanmondi 27, Chawkbazar)'
            }
            className="w-full pl-10 pr-24 py-2.5 bg-surface border border-subtle focus:border-accent focus:ring-1 focus:ring-accent rounded-xl text-[16px] text-primary placeholder:text-muted transition-colors min-h-[44px]"
          />
          <button
            type="button"
            onClick={() => searchLocation(searchQuery)}
            className="absolute right-1.5 px-3.5 py-1.5 bg-[var(--ui-primary-action-bg)] hover:bg-[var(--ui-primary-action-hover)] text-inverse rounded-lg text-[14px] font-semibold cursor-pointer min-h-[36px]"
          >
            {language === 'bn' ? 'খুঁজুন' : 'Search'}
          </button>
        </div>
      </div>

      {/* Interactive Map View */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[14px] text-secondary">
          <span className="font-medium flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-muted" />
            <span>{language === 'bn' ? 'ম্যাপে পিন নির্বাচন' : 'Map Pin Selection'}</span>
          </span>
          {location.lat && location.lng && (
            <span className="text-emerald-600 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'bn' ? 'কোঅর্ডিনেট সংরক্ষিত' : 'Pin Positioned'}</span>
            </span>
          )}
        </div>

        {apiKey && !mapError ? (
          <div
            ref={mapContainerRef}
            className="w-full h-56 sm:h-72 rounded-xl border border-subtle bg-surface-subtle overflow-hidden shadow-2xs relative"
          >
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-subtle text-muted text-[14px] gap-2">
                <Navigation className="w-4 h-4 animate-spin text-primary" />
                <span>{language === 'bn' ? 'গুগল ম্যাপ লোড হচ্ছে...' : 'Loading Google Maps...'}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-[14px] text-amber-600">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-primary">
                {language === 'bn'
                  ? 'সরাসরি এলাকা ও ঠিকানা নির্বাচন'
                  : 'Manual Address Input Mode'}
              </p>
              <p className="text-secondary text-[14px]">
                {language === 'bn'
                  ? 'নিচের ঘরে আপনার বিভাগ, জেলা, থানা এবং সুনির্দিষ্ট এলাকার বিবরণ উল্লেখ করুন।'
                  : 'Specify your division, district, thana and landmark details directly in the fields below.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Structured Bangladesh Administrative Fields */}
      <div className="pt-2 border-t border-subtle space-y-4">
        <h4 className="text-[14px] font-bold uppercase tracking-wider text-muted">
          {language === 'bn' ? 'সুনির্দিষ্ট এলাকার তথ্য (প্রশাসনিক ক্রম)' : 'Administrative Hierarchy'}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Division */}
          <div className="space-y-1.5">
            <label className="block text-[14px] font-semibold text-secondary">
              {language === 'bn' ? 'বিভাগ *' : 'Division *'}
            </label>
            <select
              value={location.division}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface border border-subtle focus:border-accent focus:ring-1 focus:ring-accent rounded-xl text-[16px] text-primary min-h-[44px] cursor-pointer"
            >
              <option value="">{language === 'bn' ? 'বিভাগ নির্বাচন করুন' : 'Select Division'}</option>
              {DIVISIONS.map((d) => (
                <option key={d.id} value={language === 'bn' ? d.nameBn : d.nameEn}>
                  {language === 'bn' ? d.nameBn : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div className="space-y-1.5">
            <label className="block text-[14px] font-semibold text-secondary">
              {language === 'bn' ? 'জেলা *' : 'District *'}
            </label>
            <select
              value={location.district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface border border-subtle focus:border-accent focus:ring-1 focus:ring-accent rounded-xl text-[16px] text-primary min-h-[44px] cursor-pointer"
            >
              <option value="">{language === 'bn' ? 'জেলা নির্বাচন করুন' : 'Select District'}</option>
              {filteredDistricts.map((dist) => (
                <option key={dist.id} value={language === 'bn' ? dist.nameBn : dist.nameEn}>
                  {language === 'bn' ? dist.nameBn : dist.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Thana / Upazila */}
          <div className="space-y-1.5">
            <label className="block text-[14px] font-semibold text-secondary">
              {language === 'bn' ? 'থানা / উপজেলা / সিটি কর্পোরেশন' : 'Thana / Upazila / City Corp'}
            </label>
            <input
              type="text"
              value={location.upazilaOrThana}
              onChange={(e) => handleFieldChange('upazilaOrThana', e.target.value)}
              placeholder={language === 'bn' ? 'উদাঃ মিরপুর, মোহাম্মদপুর, কোতোয়ালি' : 'e.g. Mirpur, Mohammadpur, Kotwali'}
              className="w-full px-3 py-2.5 bg-surface border border-subtle focus:border-accent focus:ring-1 focus:ring-accent rounded-xl text-[16px] text-primary min-h-[44px]"
            />
          </div>

          {/* Area / Locality */}
          <div className="space-y-1.5">
            <label className="block text-[14px] font-semibold text-secondary">
              {language === 'bn' ? 'এলাকা / মহল্লা *' : 'Area / Neighborhood *'}
            </label>
            <input
              type="text"
              value={location.area}
              onChange={(e) => handleFieldChange('area', e.target.value)}
              placeholder={language === 'bn' ? 'উদাঃ বাঁশবাড়ি, সেক্টর-৭, লালমাটিয়া' : 'e.g. Banshbari, Sector 7, Lalmatia'}
              className="w-full px-3 py-2.5 bg-surface border border-subtle focus:border-accent focus:ring-1 focus:ring-accent rounded-xl text-[16px] text-primary min-h-[44px]"
            />
          </div>

          {/* Road / Street */}
          <div className="space-y-1.5">
            <label className="block text-[14px] font-semibold text-secondary">
              {language === 'bn' ? 'রাস্তা / রোড নং (যদি থাকে)' : 'Road / Street (Optional)'}
            </label>
            <input
              type="text"
              value={location.road}
              onChange={(e) => handleFieldChange('road', e.target.value)}
              placeholder={language === 'bn' ? 'উদাঃ রোড নং-৪, মেইন রোড' : 'e.g. Road 4, Main Road'}
              className="w-full px-3 py-2.5 bg-surface border border-subtle focus:border-accent focus:ring-1 focus:ring-accent rounded-xl text-[16px] text-primary min-h-[44px]"
            />
          </div>

          {/* Landmark */}
          <div className="space-y-1.5">
            <label className="block text-[14px] font-semibold text-secondary">
              {language === 'bn' ? 'পরিচিত ল্যান্ডমার্ক / মোড়' : 'Nearby Landmark / Junction'}
            </label>
            <input
              type="text"
              value={location.landmark}
              onChange={(e) => handleFieldChange('landmark', e.target.value)}
              placeholder={language === 'bn' ? 'উদাঃ সোনালী ব্যাংকের বিপরীতে, স্কুলের সামনে' : 'e.g. Opposite Sonali Bank, Near School'}
              className="w-full px-3 py-2.5 bg-surface border border-subtle focus:border-accent focus:ring-1 focus:ring-accent rounded-xl text-[16px] text-primary min-h-[44px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
