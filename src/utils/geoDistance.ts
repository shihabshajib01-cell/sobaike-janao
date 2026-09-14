import { isValidIncidentCoordinates } from '../services/types';

export interface GeoPoint {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_METERS = 6371e3; // 6,371,000 meters

/**
 * Validates whether a given point has valid geographic coordinates.
 * Defensively rejects non-numeric values, NaN, Infinity, out-of-bound coordinates (-90..90, -180..180),
 * and the placeholder (0, 0) point.
 */
export function isValidGeoPoint(point?: GeoPoint | null): boolean {
  if (!point || typeof point !== 'object') return false;
  return isValidIncidentCoordinates(point.lat, point.lng);
}

/**
 * Calculates the great-circle distance between two geographic points in meters
 * using the standard Haversine formula.
 *
 * Returns:
 * - `0` if pointA and pointB represent the exact same valid coordinates
 * - A positive finite number representing distance in meters
 * - `null` if either coordinate point is missing or invalid
 */
export function calculateDistanceMeters(
  pointA?: GeoPoint | null,
  pointB?: GeoPoint | null
): number | null {
  if (!isValidGeoPoint(pointA) || !isValidGeoPoint(pointB)) {
    return null;
  }

  const { lat: lat1, lng: lon1 } = pointA!;
  const { lat: lat2, lng: lon2 } = pointB!;

  // Identical valid points return 0 directly without floating point inaccuracies
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_METERS * c;

  if (!Number.isFinite(distance) || Number.isNaN(distance)) {
    return null;
  }

  return distance;
}

/**
 * Calculates the great-circle distance between two geographic points in kilometers.
 * Consistently derived from `calculateDistanceMeters(pointA, pointB) / 1000`.
 *
 * Returns:
 * - `0` if pointA and pointB represent the exact same valid coordinates
 * - A positive finite number representing distance in kilometers
 * - `null` if either coordinate point is missing or invalid
 */
export function calculateDistanceKm(
  pointA?: GeoPoint | null,
  pointB?: GeoPoint | null
): number | null {
  const meters = calculateDistanceMeters(pointA, pointB);
  if (meters === null) {
    return null;
  }
  return meters / 1000;
}
