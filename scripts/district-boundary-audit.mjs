// Regression check for the versioned local 2020 district boundary asset.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const data = readFileSync('public/geo/bangladesh-districts-2020.geojson');
const geo = JSON.parse(data.toString('utf8'));
assert.equal(geo.type, 'FeatureCollection');
assert.equal(geo.metadata.reference_valid_on, '2020-11-13');
assert.equal(geo.features.length, 64);
const ids = new Set();
const pcodes = new Set();
for (const f of geo.features) {
  const { district_id: id, ADM2_PCODE: pcode } = f.properties;
  assert.match(id, /^[a-z]+$/);
  assert.match(pcode, /^BD[0-9]{4}$/);
  assert(!ids.has(id) && !pcodes.has(pcode), 'Duplicate district or P-code');
  ids.add(id); pcodes.add(pcode);
  assert(['Polygon', 'MultiPolygon'].includes(f.geometry.type));
  const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const polygon of polygons) for (const ring of polygon) {
    assert(ring.length >= 4, 'Invalid ring length');
    assert.deepEqual(ring[0], ring.at(-1), 'Open geographic ring');
    for (const [lng, lat] of ring) {
      assert(lng >= 87 && lng <= 94 && lat >= 19 && lat <= 28, 'Outside Bangladesh extent');
    }
  }
}
assert(gzipSync(data).length < 90000, 'Lazy boundary asset exceeds 90kb gzip budget');
// Geometry IDs must agree with the app canonical names; spellings and translations are never join keys.
import { existsSync } from 'node:fs';
if (existsSync('src/data/districts.ts')) {
  const source = readFileSync('src/data/districts.ts', 'utf8');
  const section = source.split('export const BANGLADESH_DISTRICTS:')[1]?.split('\n];')[0];
  assert(section, 'Missing canonical districts');
  const canonical = new Set([...section.matchAll(/\{ id: '([a-z]+)'/g)].map(x => x[1]));
  assert.equal(canonical.size, 64, 'Canonical district count changed');
  assert.deepEqual([...ids].sort(), [...canonical].sort(), 'Boundary/SQL canonical district identity drift');
}
console.log('PASS: 64 mapped districts, unique P-codes, closed polygon rings, lazy gzip budget');

const publicMapSource = 'src/components/explore/PublicIncidentMap.tsx';
if (existsSync(publicMapSource)) {
  const map = readFileSync(publicMapSource, 'utf8');
  const css = readFileSync('src/index.css', 'utf8');
  assert.match(map, /useState<MapLayerMode>\('districts'\)/, 'Default map must expose district geography');
  assert.doesNotMatch(map, /L\.tileLayer\(/, 'Public map must render Bangladesh only; no world raster tiles');
  assert.match(map, /countryBounds\.pad\(0\.05\)/, 'Country geography must constrain the map viewport');
  assert.match(map, /window\.matchMedia\('\(hover: hover\) and \(pointer: fine\)'\)/, 'Desktop wheel zoom must be restricted to precision-pointer devices');
  assert.match(map, /scrollWheelZoom: desktopPointer\.matches/, 'Desktop mouse wheel must zoom the map');
  assert.match(map, /desktopPointer\.addEventListener\('change', syncWheelZoom\)/, 'Wheel zoom must update when pointer capability changes');
  assert.match(map, /desktopPointer\.removeEventListener\('change', syncWheelZoom\)/, 'Remove pointer listener during map teardown');
  assert.match(map, /map\.scrollWheelZoom\.disable\(\)/, 'Touch-first devices must retain normal page scrolling');
  assert.match(map, /attributionControl: false/, 'Leaflet attribution must not obscure the mobile map canvas');
  assert.match(map, /bangladesh-map-label/, 'Bangladesh-only map must retain internal geographic labels');
  assert.match(map, /DIVISIONS/, 'National view must provide division-level context');
  assert.match(map, /bounds\.pad\(mobile \? 1\.15 : 0\.75\)/, 'Selected district must retain neighboring geographic context');
  assert.match(map, /Map: Leaflet · District boundaries: BBS\/OCHA 2020/, 'Compact source attribution must remain outside the canvas');
  assert.match(map, /district-map-legend/, 'District color legend must be visible outside the canvas');
  assert.doesNotMatch(map, /Larger bubbles mean more reports|বড় বৃত্ত মানে বেশি/, 'Old bubble copy must not describe polygon mode');
  assert.doesNotMatch(map, /basemaps\.cartocdn\.com/, 'Never reintroduce unkeyed CARTO raster tiles');
  assert.match(map, /addDistrictOutlines\(\)/, 'District outlines must remain visible in Density and Points');
  assert.match(map, /resolvedTheme,\s*\n\s*activeUpazilaFeatures,/, 'Vector map styles must update after theme changes');
  assert.match(css, /\.public-bangladesh-map-canvas\.leaflet-container/, 'The country-only canvas needs a theme-aware background');
  assert.match(map, /mapLayerMode === 'density'/, 'Density mode must remain available');
  assert.match(map, /mapLayerMode === 'points'/, 'Points mode must remain available');
  const shell = readFileSync('src/components/layout/AppShell.tsx', 'utf8');
  assert.match(shell, /isExploreRoute \? 'justify-start' : 'justify-between'/, 'Mobile Explore footer must not have excess flex spacing');
  assert.match(shell, /pb-\[calc\(10rem\+env\(safe-area-inset-bottom,0px\)\)\]/, 'Explore page must clear the fixed bottom navigation');
  const explore = readFileSync('src/pages/ExplorePage.tsx', 'utf8');
  assert.match(explore, /mb-\[calc\(5\.5rem\+env\(safe-area-inset-bottom,0px\)\)\]/, 'Selected-area action must clear mobile bottom navigation');
  assert.match(css, /\.bangladesh-map-label\.is-district/, 'District label styling must be present');
}

// Canonical 8/64/601 coverage and verified polygon contract.
const locationSource = readFileSync('src/data/upazilas.ts', 'utf8');
const locationSection = locationSource.split('export const BANGLADESH_UPAZILAS:')[1]?.split('\n];')[0];
assert(locationSection, 'Canonical upazila/thana registry missing');
const locationRows = [...locationSection.matchAll(/\{ id: '([^']+)', nameBn: '[^']+', nameEn: (?:'[^']+'|"[^"]+"), districtId: '([^']+)'/g)]
  .map(match => ({ id: match[1], districtId: match[2] }));
const locationIDs = new Set(locationRows.map(row => row.id));
assert.equal(locationIDs.size, 601, 'Every canonical upazila/thana must remain available');
assert.equal(locationRows.length, 601, 'Duplicate or dropped upazila/thana entry');
assert(locationRows.every(row => ids.has(row.districtId)), 'Every upazila/thana must reference a canonical district');

const reconciliation = JSON.parse(readFileSync('docs/upazila-map-coverage-crosswalk.json', 'utf8'));
assert.equal(reconciliation.registry_total, 601);
assert.equal(reconciliation.verified_polygon_registry_matches, 544);
assert.equal(reconciliation.registry_without_verified_polygons_count, 57);
assert.equal(reconciliation.records.length, 601);
const verified = reconciliation.records.filter(row => row.status === 'verified_polygon');
const unsupported = reconciliation.records.filter(row => row.status === 'no_verified_polygon');
assert.equal(verified.length, 544);
assert.equal(unsupported.length, 57);
assert.equal(new Set(reconciliation.records.map(row => row.id)).size, 601);
assert(reconciliation.records.every(row => locationIDs.has(row.id)));

const manifest = JSON.parse(readFileSync('public/geo/upazilas/manifest.json', 'utf8'));
assert.equal(manifest.canonical_registry_count, 601);
assert.equal(manifest.division_count, 8);
assert.equal(manifest.district_count, 64);
assert.equal(manifest.published_verified_polygon_count, 544);
assert.equal(manifest.registry_without_verified_polygon_count, 57);
assert.equal(manifest.geoBoundaries_source_feature_count, 544);
const districtCodes = new Map(geo.features.map(f => [f.properties.ADM2_PCODE, f.properties.district_id]));
const polygonIDs = new Set();
const geometryKeys = new Set();
let polygonTotal = 0;
for (const [division, path] of Object.entries(manifest.division_files)) {
  const source = readFileSync('public/' + path, 'utf8');
  assert(gzipSync(source).length < 180000, 'Lazy upazila division asset exceeded 180KB gzip: ' + division);
  const section = JSON.parse(source);
  assert.equal(section.type, 'FeatureCollection');
  assert.equal(section.metadata.division, division);
  for (const item of section.features) {
    const p = item.properties;
    assert.equal(typeof p.canonical_id, 'string');
    assert(locationIDs.has(p.canonical_id), 'Polygon references non-canonical location');
    assert(!polygonIDs.has(p.canonical_id), 'Duplicate canonical polygon');
    polygonIDs.add(p.canonical_id);
    assert.equal(districtCodes.get(p.parent_pcode), p.district_id);
    assert.equal(typeof p.pcode, 'string');
    assert(p.pcode.length > 0);
    assert(!geometryKeys.has(p.pcode), 'Duplicate source geometry key');
    geometryKeys.add(p.pcode);
    assert.equal(typeof p.name_bn, 'string');
    assert(p.name_bn.length > 0);
    assert(item.geometry && ['Polygon', 'MultiPolygon'].includes(item.geometry.type));
    polygonTotal += 1;
  }
}
assert.equal(polygonTotal, 544);
assert.equal(polygonIDs.size, 544);
assert([...polygonIDs].every(id => verified.some(row => row.id === id)));
assert(unsupported.every(row => !polygonIDs.has(row.id)));

if (existsSync(publicMapSource)) {
  const map = readFileSync(publicMapSource, 'utf8');
  const explore = readFileSync('src/pages/ExplorePage.tsx', 'utf8');
  assert(map.includes('getUpazilasByDistrict'), 'Map must list every canonical registry location by district');
  assert(map.includes('map-upazila-select'), 'Upazila/thana navigation must remain accessible');
  assert(map.includes('boundary not verified'), 'Unsupported boundaries must be visibly disclosed');
  assert(map.includes('map-division-select') && map.includes('map-district-select'), 'Map must expose complete three-level navigation');
  assert(map.includes('geo/upazilas/'), 'Map must lazily load verified upazila/thana geometry');
  assert(map.includes('containsCoordinate'), 'Only precise-coordinate reports may be counted by polygon');
  assert(map.includes("onSelectDistrict('all')"), 'Map must retain back navigation');
  assert(!map.includes('Math.random('), 'Never display demo data as report counts');
  assert(explore.includes('onSelectDivision={(division) =>'), 'Map and Explore division filter must stay synchronized');
}
console.log('PASS: 8 divisions / 64 districts / 601 canonical locations; 544 verified polygons + 57 explicit no-polygon statuses');
