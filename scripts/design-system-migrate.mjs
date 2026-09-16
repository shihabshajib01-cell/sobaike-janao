import fs from 'node:fs';
import path from 'node:path';

const ROOTS = [path.resolve('src/components'), path.resolve('src/pages')];
const EXTRA_FILES = [path.resolve('src/App.tsx')];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith('.tsx')) files.push(full);
  }
  return files;
}

const files = [...ROOTS.flatMap(walk), ...EXTRA_FILES.filter(fs.existsSync)];

const fontSizes = [
  ['9.5', '095'],
  ['10', '10'],
  ['10.5', '105'],
  ['11', '11'],
  ['11.5', '115'],
  ['12', '12'],
  ['12.5', '125'],
  ['13', '13'],
  ['13.5', '135'],
  ['14', '14'],
  ['14.5', '145'],
  ['15', '15'],
  ['15.5', '155'],
  ['16', '16'],
  ['17', '17'],
  ['18', '18'],
  ['19', '19'],
  ['20', '20'],
  ['22', '22'],
  ['24', '24'],
  ['26', '26'],
  ['28', '28'],
  ['30', '30'],
  ['32', '32'],
];

const lineHeights = [
  ['20px', '20'],
  ['22px', '22'],
  ['24px', '24'],
  ['26px', '26'],
  ['28px', '28'],
  ['30px', '30'],
  ['32px', '32'],
  ['34px', '34'],
  ['38px', '38'],
  ['42px', '42'],
  ['1.25', 'ratio-125'],
  ['1.3', 'ratio-130'],
  ['1.38', 'ratio-138'],
  ['1.4', 'ratio-140'],
  ['1.5', 'ratio-150'],
  ['1.55', 'ratio-155'],
  ['1.6', 'ratio-160'],
];

const replacements = new Map();
for (const [size, token] of fontSizes) {
  replacements.set(`text-[${size}px]`, `text-[var(--type-fixed-${token})]`);
}
replacements.set('text-xs', 'text-[var(--type-fixed-12)]');
replacements.set('text-sm', 'text-[var(--type-fixed-14)]');
replacements.set('text-lg', 'text-[var(--type-fixed-18)]');

for (const [value, token] of lineHeights) {
  replacements.set(`leading-[${value}]`, `leading-[var(--type-line-${token})]`);
}

replacements.set('rounded-sm', 'rounded-[var(--radius-compact)]');
replacements.set('rounded-md', 'rounded-[var(--radius-badge-sm)]');
replacements.set('rounded-lg', 'rounded-[var(--radius-badge-md)]');
replacements.set('rounded-xl', 'rounded-[var(--radius-control)]');
replacements.set('rounded-2xl', 'rounded-[var(--radius-card)]');
replacements.set('rounded-3xl', 'rounded-[var(--radius-modal)]');
replacements.set('rounded-full', 'rounded-[var(--radius-pill)]');
replacements.set('rounded-[12px]', 'rounded-[var(--radius-control)]');

replacements.set('shadow-2xs', 'shadow-[var(--elevation-2xs)]');
replacements.set('shadow-xs', 'shadow-[var(--elevation-xs)]');
replacements.set('shadow-sm', 'shadow-[var(--elevation-sm)]');
replacements.set('shadow-md', 'shadow-[var(--elevation-md)]');
replacements.set('shadow-lg', 'shadow-[var(--elevation-lg)]');
replacements.set('shadow-xl', 'shadow-[var(--elevation-xl)]');
replacements.set('shadow-2xl', 'shadow-[var(--elevation-2xl)]');

replacements.set('font-mono', 'tabular-nums');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceClassToken(source, from, to) {
  const pattern = new RegExp(`(?<![A-Za-z0-9_-])${escapeRegExp(from)}(?![A-Za-z0-9_-])`, 'g');
  let count = 0;
  const next = source.replace(pattern, () => {
    count += 1;
    return to;
  });
  return { next, count };
}

const counts = new Map();
let changedFiles = 0;

for (const file of files) {
  let source = fs.readFileSync(file, 'utf8');
  const original = source;

  for (const [from, to] of replacements) {
    const result = replaceClassToken(source, from, to);
    source = result.next;
    if (result.count) counts.set(from, (counts.get(from) || 0) + result.count);
  }

  // Guard against accidental duplicate numeric-feature utilities after replacing font-mono.
  source = source.replace(/\btabular-nums\s+tabular-nums\b/g, 'tabular-nums');

  if (source !== original) {
    fs.writeFileSync(file, source);
    changedFiles += 1;
  }
}

const mainPath = path.resolve('src/main.tsx');
let mainSource = fs.readFileSync(mainPath, 'utf8');
if (!mainSource.includes("./theme/design-system-extensions.css")) {
  const anchor = "import './index.css';\n";
  if (!mainSource.includes(anchor)) throw new Error('Could not locate index.css import in src/main.tsx');
  mainSource = mainSource.replace(anchor, `${anchor}import './theme/design-system-extensions.css';\n`);
  fs.writeFileSync(mainPath, mainSource);
}

const heatmapLegendPath = path.resolve('src/components/explore/HeatmapLegend.tsx');
let legendSource = fs.readFileSync(heatmapLegendPath, 'utf8');
if (!legendSource.includes("../../theme/data-viz-tokens")) {
  legendSource = legendSource.replace(
    "import React from 'react';\n",
    "import React from 'react';\nimport { HEATMAP_TOKENS } from '../../theme/data-viz-tokens';\n"
  );
}
const oldLegendGradient = "'linear-gradient(to right, #2563EB 0%, #06B6D4 30%, #10B981 55%, #F59E0B 80%, #EF4444 100%)'";
if (legendSource.includes(oldLegendGradient)) {
  legendSource = legendSource.replace(oldLegendGradient, 'HEATMAP_TOKENS.cssGradient');
}
fs.writeFileSync(heatmapLegendPath, legendSource);

const incidentMapPath = path.resolve('src/components/explore/PublicIncidentMap.tsx');
let mapSource = fs.readFileSync(incidentMapPath, 'utf8');
if (!mapSource.includes("../../theme/data-viz-tokens")) {
  const importAnchor = "import { SectionKey } from '../../theme/tokens';\n";
  if (!mapSource.includes(importAnchor)) throw new Error('Could not locate token import in PublicIncidentMap.tsx');
  mapSource = mapSource.replace(
    importAnchor,
    `${importAnchor}import { HEATMAP_TOKENS } from '../../theme/data-viz-tokens';\n`
  );
}
const oldLeafletGradient = `gradient: {\n            0.2: '#2563EB',\n            0.4: '#06B6D4',\n            0.6: '#10B981',\n            0.8: '#F59E0B',\n            1.0: '#EF4444',\n          },`;
if (mapSource.includes(oldLeafletGradient)) {
  mapSource = mapSource.replace(oldLeafletGradient, 'gradient: HEATMAP_TOKENS.leafletGradient,');
}
fs.writeFileSync(incidentMapPath, mapSource);

console.log(`Migrated ${changedFiles} public UI source file(s) to central design-system tokens.`);
for (const [token, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${token}: ${count}`);
}
