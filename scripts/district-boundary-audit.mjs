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

// Geographic coverage is partial, but the selected location registry must
// provide 100% of the existing SQL contract's 601 canonical names/IDs.
const locationSource = readFileSync('src/data/upazilas.ts', 'utf8');
const locationSection = locationSource.split('export const BANGLADESH_UPAZILAS:')[1]?.split('\n];')[0];
assert(locationSection, 'Canonical upazila/thana registry missing');
const locationRows = [...locationSection.matchAll(/\{ id: '([^']+)', nameBn: '[^']+', nameEn: (?:'[^']+'|"[^"]+"), districtId: '([^']+)'/g)]
  .map(match => ({ id: match[1], districtId: match[2] }));
const locationIDs = new Set(locationRows.map(row => row.id));
assert.equal(locationIDs.size, 601, 'Every existing canonical upazila/thana must remain available');
assert.equal(locationRows.length, 601, 'Duplicate or dropped upazila/thana entry');
assert(locationRows.every(row => ids.has(row.districtId)), 'Every upazila must reference a canonical district');
const reconciliation = JSON.parse(readFileSync('docs/upazila-map-coverage-crosswalk.json', 'utf8'));
assert.equal(reconciliation.registry_total, 601);
assert.equal(reconciliation.verified_polygon_registry_matches, 351);
assert.equal(reconciliation.registry_without_verified_polygons_count, 250);
assert.equal(reconciliation.historic_polygons_without_verified_registry_matches_count, 147);
const matchedIDs = new Set(reconciliation.verified.map(row => row.id));
const missingIDs = new Set(reconciliation.registry_without_verified_polygons.map(row => row.id));
assert.equal(matchedIDs.size, 351);
assert.equal(missingIDs.size, 250);
assert([...matchedIDs].every(id => locationIDs.has(id) && !missingIDs.has(id)));
assert([...missingIDs].every(id => locationIDs.has(id)));
assert.equal(new Set([...matchedIDs, ...missingIDs]).size, 601,
  'Every canonical location must have an explicit verified or unverified boundary status');
if (existsSync(publicMapSource)) {
  const map = readFileSync(publicMapSource, 'utf8');
  const explore = readFileSync('src/pages/ExplorePage.tsx', 'utf8');
  assert(map.includes('getUpazilasByDistrict'), 'Map must list every canonical registry location by district');
  assert(map.includes('map-upazila-select'), 'Upazila navigation must remain accessible');
  assert(map.includes('boundary not verified'), 'Missing boundaries must be visibly disclosed');
  assert(map.includes('map-division-select') && map.includes('map-district-select'), 'Map must expose complete three-level navigation');
  assert(explore.includes('onSelectDivision={(division) =>'), 'Map and Explore division filter must stay synchronized');
}
const manifest = JSON.parse(readFileSync('public/geo/upazilas/manifest.json', 'utf8'));
assert.equal(manifest.source_feature_count, 498);
assert.equal(manifest.sql_canonical_row_count_at_audit, 601);
assert.equal(manifest.uniquely_matched_sql_names, 351);
assert.equal(manifest.unmatched_sql_names, 147);
const districtCodes = new Map(geo.features.map(f => [f.properties.ADM2_PCODE, f.properties.district_id]));
const upazilaCodes = new Set();
let verifiedUpazilas = 0;
for (const [division, path] of Object.entries(manifest.division_files)) {
  const source = readFileSync('public/' + path, 'utf8');
  assert(gzipSync(source).length < 115000, 'Lazy upazila division asset exceeded 115KB gzip: ' + division);
  const section = JSON.parse(source);
  assert.equal(section.type, 'FeatureCollection');
  assert.equal(section.metadata.division, division);
  for (const item of section.features) {
    const p = item.properties;
    assert.match(p.pcode, /^BD[0-9]{6}$/);
    assert.equal(p.parent_pcode, p.pcode.slice(0, 6));
    assert.equal(districtCodes.get(p.parent_pcode), p.district_id);
    assert(!upazilaCodes.has(p.pcode), 'Duplicate upazila P-code');
    upazilaCodes.add(p.pcode);
    assert(item.geometry && ['Polygon', 'MultiPolygon'].includes(item.geometry.type));
    if (p.canonical_id) {
      assert.equal(typeof p.name_bn, 'string');
      assert(p.name_bn.length > 0);
      verifiedUpazilas += 1;
    } else {
      assert(!p.name_bn, 'Unverified translation must not be invented');
    }
  }
}
assert.equal(upazilaCodes.size, 498);
assert.equal(verifiedUpazilas, 351, 'Name-verified upazila identity coverage changed');
if (existsSync(publicMapSource)) {
  const map = readFileSync(publicMapSource, 'utf8');
  assert(map.includes('geo/upazilas/'), 'Map must lazily load real upazila geometry');
  assert(map.includes('containsCoordinate'), 'Only precise-coordinate reports may be counted by upazila');
  assert(map.includes("onSelectDistrict('all')"), 'Map must retain back navigation');
  assert(!map.includes('Math.random('), 'Never display demo data as report counts');
}
console.log('PASS: Historical upazila dataset (498), 351 verified names / 147 unmatched, 64 parent P-codes, lazy asset budgets');
