export interface ApproximateIpLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  source: 'ip';
  city?: string;
  region?: string;
  country?: string;
}

const IP_LOCATION_MAX_AGE_MS = 60 * 60 * 1000;
let cachedLocation: ApproximateIpLocation | null = null;
let inFlight: Promise<ApproximateIpLocation | null> | null = null;

function isValidCoordinate(latitude: unknown, longitude: unknown): latitude is number {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

/**
 * Best-effort approximate browse location derived from the public IP.
 * This is browse-only. It must never be used as reporter/submission evidence.
 * No IP address is stored by the client.
 */
export const IpLocationService = {
  async getApproximateLocation(): Promise<ApproximateIpLocation | null> {
    if (
      cachedLocation &&
      Date.now() - cachedLocation.timestamp <= IP_LOCATION_MAX_AGE_MS
    ) {
      return cachedLocation;
    }

    if (inFlight) return inFlight;

    inFlight = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 4500);
        const response = await fetch('https://ipwho.is/', {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
          cache: 'no-store',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
        });
        window.clearTimeout(timeoutId);

        if (!response.ok) return null;
        const data = await response.json();
        if (data?.success === false || !isValidCoordinate(data?.latitude, data?.longitude)) {
          return null;
        }

        // IP geolocation is intentionally marked coarse. It is suitable for
        // regional feed ranking, never for report verification.
        cachedLocation = {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 25000,
          timestamp: Date.now(),
          source: 'ip',
          city: typeof data.city === 'string' ? data.city : undefined,
          region: typeof data.region === 'string' ? data.region : undefined,
          country: typeof data.country === 'string' ? data.country : undefined,
        };
        return cachedLocation;
      } catch {
        return null;
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  },

  clear(): void {
    cachedLocation = null;
    inFlight = null;
  },
};
