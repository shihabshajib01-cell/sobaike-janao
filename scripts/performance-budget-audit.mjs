import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const indexPath = path.join(distDir, 'index.html');

const fail = (message) => {
  console.error(`[performance-budget] ${message}`);
  process.exitCode = 1;
};

if (!fs.existsSync(indexPath)) {
  fail('dist/index.html is missing. Run the production build first.');
  process.exit();
}

const html = fs.readFileSync(indexPath, 'utf8');

if (/Material\+Symbols|Material%20Symbols|Material Symbols/i.test(html)) {
  fail('Unused Material Symbols font must not be loaded by the initial document.');
}

const mainSourcePath = path.join(root, 'src', 'main.tsx');
if (fs.existsSync(mainSourcePath)) {
  const mainSource = fs.readFileSync(mainSourcePath, 'utf8');
  if (mainSource.includes("leaflet/dist/leaflet.css")) {
    fail('Leaflet CSS must stay route-scoped and out of the initial entry.');
  }
}

const reportCardSourcePath = path.join(
  root,
  'src',
  'components',
  'report',
  'ReportCard.tsx'
);
if (fs.existsSync(reportCardSourcePath)) {
  const reportCardSource = fs.readFileSync(reportCardSourcePath, 'utf8');
  if (reportCardSource.includes('ReportMediaGrid')) {
    fail('ReportCard must not import or mount hidden media-grid code.');
  }
}
const toLocalPath = (url) => {
  const clean = url.split('?')[0].split('#')[0].replace(/^\.?\//, '').replace(/^\//, '');
  return path.join(distDir, clean);
};
const gzipBytes = (file) => zlib.gzipSync(fs.readFileSync(file), { level: 9 }).length;
const kb = (bytes) => (bytes / 1024).toFixed(1);

const moduleMatch = html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["']/i);
if (!moduleMatch) {
  fail('Could not find the production module entry in dist/index.html.');
} else {
  const entryPath = toLocalPath(moduleMatch[1]);
  if (!fs.existsSync(entryPath)) {
    fail(`Entry chunk is missing: ${moduleMatch[1]}`);
  } else {
    const raw = fs.statSync(entryPath).size;
    const gzip = gzipBytes(entryPath);
    const maxRaw = 550 * 1024;
    const maxGzip = 180 * 1024;
    console.log(`[performance-budget] entry: ${kb(raw)} KB raw / ${kb(gzip)} KB gzip`);
    if (raw > maxRaw) fail(`Entry chunk exceeds ${kb(maxRaw)} KB raw budget.`);
    if (gzip > maxGzip) fail(`Entry chunk exceeds ${kb(maxGzip)} KB gzip budget.`);
  }
}

const cssMatches = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi)];
let cssGzipTotal = 0;
for (const match of cssMatches) {
  const cssPath = toLocalPath(match[1]);
  if (fs.existsSync(cssPath)) cssGzipTotal += gzipBytes(cssPath);
}
const maxCssGzip = 35 * 1024;
console.log(`[performance-budget] critical CSS: ${kb(cssGzipTotal)} KB gzip`);
if (cssGzipTotal > maxCssGzip) {
  fail(`Critical CSS exceeds ${kb(maxCssGzip)} KB gzip budget.`);
}

const heroDir = path.join(root, 'public', 'illustrations', 'services');
if (fs.existsSync(heroDir)) {
  const heroFiles = fs.readdirSync(heroDir)
    .filter((name) => /\.(?:avif|webp|jpe?g|png)$/i.test(name))
    .map((name) => ({
      name,
      bytes: fs.statSync(path.join(heroDir, name)).size,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  const maxHeroBytes = 250 * 1024;
  const largest = heroFiles[0];
  if (largest) {
    console.log(`[performance-budget] largest service hero: ${largest.name} (${kb(largest.bytes)} KB)`);
  }
  for (const hero of heroFiles) {
    if (hero.bytes > maxHeroBytes) {
      fail(`Service hero ${hero.name} exceeds ${kb(maxHeroBytes)} KB asset budget.`);
    }
  }
}

if (!process.exitCode) {
  console.log('[performance-budget] PASS');
}
