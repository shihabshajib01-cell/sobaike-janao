import { ReportLocationData } from './types';
import { BANGLADESH_DISTRICTS, DIVISIONS, DistrictInfo, DivisionInfo } from '../data/districts';

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface ResolvedPlaceResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  placeId: string;
  name?: string;
  area?: string;
  road?: string;
  upazilaOrThana?: string;
  landmark?: string;
  division?: string;
  district?: string;
}

const SCRIPT_ID = 'google-maps-places-script';
let scriptLoadPromise: Promise<boolean> | null = null;
let placesServiceInstance: any = null;
let autocompleteServiceInstance: any = null;

/**
 * Checks if a Google Maps API Key is provided via environment variables.
 */
export function getGoogleMapsApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (typeof key === 'string' && key.trim().length > 0) {
    return key.trim();
  }
  return '';
}

/**
 * Loads the Google Maps JavaScript API with places library dynamically.
 * Resolves to true if loaded successfully, false if key is missing or load fails.
 */
export function loadGooglePlacesScript(): Promise<boolean> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.resolve(false);
  }

  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  // If already loaded and places library is ready
  const g = (window as any).google;
  if (g?.maps?.places?.AutocompleteService) {
    return Promise.resolve(true);
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise<boolean>((resolve) => {
    // Intercept Google Maps auth failure callback
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('[GooglePlaces] Google Maps authentication failure detected (gm_authFailure).');
      if (typeof prevAuthFailure === 'function') {
        try {
          prevAuthFailure();
        } catch (_) {
          // ignore
        }
      }
      resolve(false);
    };

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        const hasPlaces = Boolean((window as any).google?.maps?.places?.AutocompleteService);
        resolve(hasPlaces);
      });
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&region=BD&language=bn`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const hasPlaces = Boolean((window as any).google?.maps?.places?.AutocompleteService);
      resolve(hasPlaces);
    };

    script.onerror = () => {
      console.warn('[GooglePlaces] Script failed to load from Google servers.');
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Queries Google Places Autocomplete restricted strictly to Bangladesh.
 */
export async function searchBangladeshPlaces(
  query: string,
  biasCoords?: { lat: number; lng: number }
): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 3) {
    return [];
  }

  const isReady = await loadGooglePlacesScript();
  if (!isReady) {
    throw new Error('Google Places is not available');
  }

  const g = (window as any).google;
  if (!autocompleteServiceInstance) {
    autocompleteServiceInstance = new g.maps.places.AutocompleteService();
  }

  const request: any = {
    input: trimmed,
    componentRestrictions: { country: 'bd' },
  };

  if (biasCoords && typeof biasCoords.lat === 'number' && typeof biasCoords.lng === 'number') {
    request.location = new g.maps.LatLng(biasCoords.lat, biasCoords.lng);
    request.radius = 35000; // 35km radius bias
  }

  return new Promise<PlaceSuggestion[]>((resolve, reject) => {
    autocompleteServiceInstance.getPlacePredictions(
      request,
      (predictions: any[], status: string) => {
        if (status === g.maps.places.PlacesServiceStatus.OK && predictions) {
          const results: PlaceSuggestion[] = predictions.map((pred) => ({
            placeId: pred.place_id,
            description: pred.description,
            mainText: pred.structured_formatting?.main_text || pred.description,
            secondaryText: pred.structured_formatting?.secondary_text || '',
          }));
          resolve(results);
        } else if (
          status === g.maps.places.PlacesServiceStatus.ZERO_RESULTS ||
          status === 'ZERO_RESULTS'
        ) {
          resolve([]);
        } else {
          console.warn('[GooglePlaces] Autocomplete status:', status);
          reject(new Error(`Autocomplete failed with status: ${status}`));
        }
      }
    );
  });
}

/**
 * Normalizes text for matching Bangladesh divisions and districts.
 */
function normalizeName(input: string): string {
  return input
    .toLowerCase()
    .replace(/(division|district|বিভাগ|জেলা|zila|zillah|city|town)/gi, '')
    .replace(/['’.\-_]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * Matches a candidate name or address component against canonical BANGLADESH_DISTRICTS.
 */
export function findCanonicalDistrict(candidate: string): DistrictInfo | null {
  if (!candidate || !candidate.trim()) return null;
  const norm = normalizeName(candidate);
  if (!norm) return null;

  // Direct check against nameEn, nameBn, id
  for (const d of BANGLADESH_DISTRICTS) {
    if (normalizeName(d.nameEn) === norm || normalizeName(d.nameBn) === norm || d.id === norm) {
      return d;
    }
  }

  // Alias dictionary for common English / transliteration variants in Google Maps
  const districtAliases: Record<string, string> = {
    chittagong: 'chattogram',
    comilla: 'cumilla',
    barisal: 'barishal',
    jessore: 'jashore',
    bogra: 'bogura',
    coxsbazar: 'coxsbazar',
    moulvibazar: 'moulvibazar',
    maulvibazar: 'moulvibazar',
    netrakona: 'netrokona',
    chapainawabganj: 'chapainawabganj',
    nawabganj: 'chapainawabganj',
    brahmanbaria: 'brahmanbaria',
    munshigonj: 'munshiganj',
    narayongonj: 'narayanganj',
    sunamgonj: 'sunamganj',
    habigonj: 'habiganj',
    sirajgonj: 'sirajganj',
    gopalgonj: 'gopalganj',
    manikgonj: 'manikganj',
    jhalakathi: 'jhalokati',
  };

  const aliasTarget = districtAliases[norm];
  if (aliasTarget) {
    const found = BANGLADESH_DISTRICTS.find(
      (d) => normalizeName(d.nameEn) === aliasTarget || d.id === aliasTarget
    );
    if (found) return found;
  }

  return null;
}

/**
 * Matches a candidate name or address component against canonical DIVISIONS.
 */
export function findCanonicalDivision(candidate: string): DivisionInfo | null {
  if (!candidate || !candidate.trim()) return null;
  const norm = normalizeName(candidate);
  if (!norm) return null;

  for (const div of DIVISIONS) {
    if (normalizeName(div.nameEn) === norm || normalizeName(div.nameBn) === norm || div.id === norm) {
      return div;
    }
  }

  const divisionAliases: Record<string, string> = {
    chittagong: 'chittagong',
    barisal: 'barisal',
  };

  const aliasTarget = divisionAliases[norm];
  if (aliasTarget) {
    const found = DIVISIONS.find((d) => d.id === aliasTarget);
    if (found) return found;
  }

  return null;
}

/**
 * Retrieves full details for a selected place from Google Places API.
 */
export async function getPlaceDetails(placeId: string): Promise<ResolvedPlaceResult | null> {
  const isReady = await loadGooglePlacesScript();
  if (!isReady) {
    return null;
  }

  const g = (window as any).google;
  if (!placesServiceInstance) {
    const dummyDiv = document.createElement('div');
    placesServiceInstance = new g.maps.places.PlacesService(dummyDiv);
  }

  return new Promise<ResolvedPlaceResult | null>((resolve) => {
    placesServiceInstance.getDetails(
      {
        placeId,
        fields: ['geometry', 'formatted_address', 'address_components', 'name', 'place_id'],
      },
      (place: any, status: string) => {
        if (status === g.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const lat = Number(place.geometry.location.lat().toFixed(6));
          const lng = Number(place.geometry.location.lng().toFixed(6));
          const formattedAddress = place.formatted_address || place.name || '';
          const components: any[] = Array.isArray(place.address_components)
            ? place.address_components
            : [];

          let road = '';
          let area = '';
          let upazilaOrThana = '';
          let matchedDistrict: DistrictInfo | null = null;
          let matchedDivision: DivisionInfo | null = null;
          let landmark = '';

          if (place.name && place.name !== formattedAddress && !formattedAddress.startsWith(place.name)) {
            landmark = place.name;
          }

          for (const comp of components) {
            const types: string[] = comp.types || [];
            const longName: string = comp.long_name || '';

            // Route / Road
            if (types.includes('route')) {
              road = longName;
            }

            // Area / Neighborhood / Sublocality
            if (
              !area &&
              (types.includes('sublocality_level_1') ||
                types.includes('sublocality') ||
                types.includes('neighborhood'))
            ) {
              area = longName;
            }

            // Upazila / Thana
            if (
              !upazilaOrThana &&
              (types.includes('administrative_area_level_3') ||
                types.includes('sublocality_level_2'))
            ) {
              upazilaOrThana = longName;
            }

            // Check if this component matches a canonical district
            if (!matchedDistrict) {
              const matched = findCanonicalDistrict(longName);
              if (matched) {
                matchedDistrict = matched;
              }
            }

            // Check if this component matches a canonical division
            if (!matchedDivision) {
              const matchedDiv = findCanonicalDivision(longName);
              if (matchedDiv) {
                matchedDivision = matchedDiv;
              }
            }
          }

          // If district matched, its divisionEn is always the canonical division
          let finalDivision = '';
          let finalDistrict = '';

          if (matchedDistrict) {
            finalDistrict = matchedDistrict.nameEn;
            finalDivision = matchedDistrict.divisionEn;
          } else if (matchedDivision) {
            finalDivision = matchedDivision.nameEn;
          }

          resolve({
            lat,
            lng,
            formattedAddress,
            placeId,
            name: place.name,
            area: area || undefined,
            road: road || undefined,
            upazilaOrThana: upazilaOrThana || undefined,
            landmark: landmark || undefined,
            division: finalDivision || undefined,
            district: finalDistrict || undefined,
          });
        } else {
          console.warn('[GooglePlaces] getDetails failed with status:', status);
          resolve(null);
        }
      }
    );
  });
}

/**
 * Merges a resolved Google Place with the existing ReportLocationData atomically.
 * Preserves user's current division/district if Google did not return a reliable match.
 * Never fabricates fields.
 */
export function buildResolvedLocationData(
  currentLocation: ReportLocationData,
  placeResult: ResolvedPlaceResult
): ReportLocationData {
  return {
    formattedAddress: placeResult.formattedAddress || currentLocation.formattedAddress || '',
    division: placeResult.division || currentLocation.division || '',
    district: placeResult.district || currentLocation.district || '',
    area: placeResult.area || currentLocation.area || '',
    upazilaOrThana: placeResult.upazilaOrThana || currentLocation.upazilaOrThana || '',
    road: placeResult.road || currentLocation.road || '',
    landmark: placeResult.landmark || currentLocation.landmark || '',
    lat: placeResult.lat,
    lng: placeResult.lng,
    placeId: placeResult.placeId,
  };
}
