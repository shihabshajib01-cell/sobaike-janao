import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const UI_ROOTS = [path.join(ROOT, 'src', 'components'), path.join(ROOT, 'src', 'pages')];
const APP_FILE = path.join(ROOT, 'src', 'App.tsx');
const MAIN_FILE = path.join(ROOT, 'src', 'main.tsx');
const AUTHORITY_FILE = path.join(ROOT, 'src', 'theme', 'design-system.css');

const failures = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(tsx?|jsx?)$/.test(entry.name) ? [full] : [];
  });
}

function rel(file) {
  return path.relative(ROOT, file).replaceAll('\\', '/');
}

function lineOf(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

const uiFiles = [...UI_ROOTS.flatMap(walk), APP_FILE].filter((file) => fs.existsSync(file));
const RAW_COLOR_RE = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\s*\(/g;
const PALETTE_CLASS_RE = /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\d+)?\b/g;
const INLINE_FONT_RE = /\bfontFamily\s*:/g;

// Cartographic heatmap colors are data-visualization values, not UI theme colors.
const DATA_VIZ_EXCEPTIONS = new Set(['src/components/explore/PublicIncidentMap.tsx']);

for (const file of uiFiles) {
  const relative = rel(file);
  const source = fs.readFileSync(file, 'utf8');

  if (!DATA_VIZ_EXCEPTIONS.has(relative)) {
    for (const match of source.matchAll(RAW_COLOR_RE)) {
      failures.push(`${relative}:${lineOf(source, match.index ?? 0)} raw UI color ${match[0]}`);
    }
  }

  for (const match of source.matchAll(PALETTE_CLASS_RE)) {
    failures.push(`${relative}:${lineOf(source, match.index ?? 0)} palette utility ${match[0]}`);
  }

  for (const match of source.matchAll(INLINE_FONT_RE)) {
    failures.push(`${relative}:${lineOf(source, match.index ?? 0)} inline font-family override`);
  }
}

if (!fs.existsSync(AUTHORITY_FILE)) {
  failures.push('src/theme/design-system.css is missing');
} else {
  const css = fs.readFileSync(AUTHORITY_FILE, 'utf8');

  const semanticTokens = [
    '--ui-page', '--ui-surface', '--ui-surface-subtle', '--ui-surface-elevated', '--ui-surface-hover',
    '--ui-text-primary', '--ui-text-secondary', '--ui-text-muted',
    '--ui-border-subtle', '--ui-border', '--ui-border-strong',
    '--ui-input', '--ui-input-placeholder', '--ui-disabled-bg', '--ui-disabled-text',
  ];

  for (const token of semanticTokens) {
    const count = css.split(`${token}:`).length - 1;
    if (count < 2) failures.push(`design-system.css must define light + dark ${token}`);
  }

  const categoryKeys = [
    'harassment', 'extortion', 'public_safety', 'road_transport',
    'load_shedding', 'illegal_occupation', 'rickshaw',
  ];
  const categoryRoles = ['primary', 'hover', 'bg', 'border', 'text', 'on-primary'];
  for (const key of categoryKeys) {
    for (const role of categoryRoles) {
      const token = `--sec-${key}-${role}:`;
      if (css.split(token).length - 1 < 2) {
        failures.push(`design-system.css must define light + dark ${token}`);
      }
    }
  }

  const authorityMarkers = [
    ':where(h1)',
    ':where(h2)',
    ':where(h3)',
    ':where(h4, h5)',
    ':where(p)',
    ':where(label)',
    ':where(button)',
    'min-height: var(--touch-target-min) !important;',
    'font-family: var(--font-ui) !important;',
    '.font-mono',
    '.font-semibold',
    '.rounded-xl',
    '.rounded-2xl',
    '.rounded-full',
    '.shadow-sm',
    '.shadow-lg',
  ];
  for (const marker of authorityMarkers) {
    if (!css.includes(marker)) failures.push(`design-system.css missing authority marker: ${marker}`);
  }
}

if (!fs.existsSync(MAIN_FILE)) {
  failures.push('src/main.tsx is missing');
} else {
  const main = fs.readFileSync(MAIN_FILE, 'utf8');
  const baseIndex = main.indexOf("./index.css");
  const authority = main.indexOf("./theme/design-system.css");
  if (baseIndex < 0 || authority < 0) {
    failures.push('main.tsx must import index.css and design-system.css');
  } else if (authority < baseIndex) {
    failures.push('design-system.css must load after index.css so it is the final runtime authority');
  }
}

if (failures.length) {
  console.error(`Public design-system authority audit failed with ${failures.length} violation(s):`);
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`Public design-system authority audit passed across ${uiFiles.length} UI source file(s).`);
console.log('Semantic colors, category themes, typography, touch targets, fonts, radii and elevation resolve through the central authority layer.');
