import fs from 'node:fs';
import path from 'node:path';

const DIST_ASSETS = path.resolve('dist/assets');
const kib = (value) => value * 1024;

if (!fs.existsSync(DIST_ASSETS)) {
  console.error('Bundle budget failed: dist/assets does not exist. Run npm run build first.');
  process.exit(1);
}

const files = fs.readdirSync(DIST_ASSETS).map((name) => {
  const full = path.join(DIST_ASSETS, name);
  return { name, bytes: fs.statSync(full).size };
});

const jsFiles = files.filter((file) => file.name.endsWith('.js'));
const cssFiles = files.filter((file) => file.name.endsWith('.css'));
const entry = jsFiles.find((file) => /^index-[^.]+\.js$/.test(file.name));
const composerChunk = jsFiles.find((file) => file.name.startsWith('ReportComposerModal-'));

const limits = {
  entry: kib(850),
  lazyJsChunk: kib(400),
  css: kib(160),
  totalJs: kib(1800),
};

const failures = [];
if (!entry) failures.push('main Vite entry chunk was not found');
if (!composerChunk) failures.push('ReportComposerModal is not emitted as a lazy production chunk');
if (entry && entry.bytes > limits.entry) {
  failures.push(`main entry ${entry.name} is ${(entry.bytes / 1024).toFixed(1)} KiB; budget is 850 KiB`);
}
for (const file of jsFiles) {
  if (entry && file.name === entry.name) continue;
  if (file.bytes > limits.lazyJsChunk) {
    failures.push(`lazy JS chunk ${file.name} is ${(file.bytes / 1024).toFixed(1)} KiB; budget is 400 KiB`);
  }
}
for (const file of cssFiles) {
  if (file.bytes > limits.css) {
    failures.push(`CSS asset ${file.name} is ${(file.bytes / 1024).toFixed(1)} KiB; budget is 160 KiB`);
  }
}
const totalJs = jsFiles.reduce((sum, file) => sum + file.bytes, 0);
if (totalJs > limits.totalJs) {
  failures.push(`total JS is ${(totalJs / 1024).toFixed(1)} KiB; budget is 1800 KiB`);
}

console.log('Production bundle inventory:');
for (const file of [...jsFiles, ...cssFiles].sort((a, b) => b.bytes - a.bytes)) {
  console.log(`  ${file.name}: ${(file.bytes / 1024).toFixed(1)} KiB`);
}

if (failures.length) {
  console.error('\nBundle budget failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`\nBundle budget passed. Main entry: ${(entry.bytes / 1024).toFixed(1)} KiB; composer is code-split and every lazy chunk is <= 400 KiB.`);
