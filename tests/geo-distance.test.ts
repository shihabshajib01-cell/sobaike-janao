import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidGeoPoint,
  calculateDistanceMeters,
  calculateDistanceKm,
} from '../src/utils/geoDistance.ts';

test('isValidGeoPoint validates coordinates defensively', () => {
  assert.equal(isValidGeoPoint({ lat: 23.8103, lng: 90.4125 }), true);
  assert.equal(isValidGeoPoint(null), false);
  assert.equal(isValidGeoPoint({ lat: 0, lng: 0 }), false);
  assert.equal(isValidGeoPoint({ lat: 100, lng: 90 }), false);
  assert.equal(isValidGeoPoint({ lat: 23, lng: 200 }), false);
});

test('calculateDistanceMeters returns zero for identical valid points', () => {
  const point = { lat: 23.8103, lng: 90.4125 };
  assert.equal(calculateDistanceMeters(point, point), 0);
});

test('calculateDistanceMeters returns null for invalid points', () => {
  assert.equal(calculateDistanceMeters({ lat: 0, lng: 0 }, { lat: 23, lng: 90 }), null);
  assert.equal(calculateDistanceMeters(undefined, { lat: 23, lng: 90 }), null);
});

test('calculateDistanceMeters is symmetric and positive', () => {
  const dhaka = { lat: 23.8103, lng: 90.4125 };
  const chattogram = { lat: 22.3569, lng: 91.7832 };
  const forward = calculateDistanceMeters(dhaka, chattogram);
  const reverse = calculateDistanceMeters(chattogram, dhaka);
  assert.ok(forward !== null && forward > 0);
  assert.ok(reverse !== null && reverse > 0);
  assert.ok(Math.abs(forward - reverse) < 0.001);
});

test('kilometer distance is derived consistently from meter distance', () => {
  const a = { lat: 23.8103, lng: 90.4125 };
  const b = { lat: 24.8949, lng: 91.8687 };
  const meters = calculateDistanceMeters(a, b);
  const kilometers = calculateDistanceKm(a, b);
  assert.ok(meters !== null && kilometers !== null);
  assert.ok(Math.abs(kilometers - meters / 1000) < 1e-9);
});
