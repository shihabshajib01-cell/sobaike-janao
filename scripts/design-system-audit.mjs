import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_ROOTS = [path.join(ROOT, 'src', 'components'), path.join(ROOT, 'src', 'pages')];
const CATEGORY_TOKEN_FILE = path.join(ROOT, 'src', 'theme', 'category-tokens.css');
const SEMANTIC_TOKEN_FILE = path.join(ROOT, 'src', 'theme', 'semantic-tokens.css');
const MAIN_FILE = path.join(ROOT, 'src', 'main.tsx');

const CATEGORY_KEYS = [
  'harassment',
  'extortion',
  'public_safety',
  'road_transport',
  'load_shedding',
  'illegal_occupation',
  'rickshaw',
];

const CATEGORY_ROLES = ['primary', 'hover', 'bg', 'border', 'text', 'on-primary'];
const REQUIRED_SEMANTIC_TOKENS = [
  '--ui-page',
  '--ui-surface',
  '--ui-surface-subtle',
  '--ui-surface-elevated',
  '--ui-surface-hover',
  '--ui-text-primary',
  '--ui-text-secondary',
  '--ui-text-muted',
  '--ui-border-subtle',
  '--ui-border',
  '--ui-border-strong',
  '--ui-input',
  '--ui-input-placeholder',
  '--ui-accent',
  '--ui-focus',
  '--ui-primary-action-bg',
  '--ui-primary-action-hover',
  '--ui-primary-action-active',
  '--ui-primary-action-text',
];

const COLOR_LITERAL_RE = /(?:#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(|\boklch\s*\()/g;
const ALLOWED_COLOR_LITERAL_FILES = new Set([
  // Public map visualization owns data-driven cartographic colors rather than UI theme colors.
  path.normalize('src/components/explore/PublicIncidentMap.tsx'),
]);

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full);
    if (/\.(tsx?|jsx?)$/.test(entry.name)) return [full];
    return [];
  });
}

function relative(file) {
  return path.normalize(path.relative(ROOT, file));
}

function getLineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

const failures = [];

for (const root of SRC_ROOTS) {
  for (const file of listFiles(root)) {
    const rel = relative(file);
    if (ALLOWED_COLOR_LITERAL_FILES.has(rel)) continue;

    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(COLOR_LITERAL_RE)) {
      failures.push(
        `${rel}:${getLineNumber(content, match.index ?? 0)} contains a literal UI color (${match[0]}). Use semantic/category tokens instead.`
      );
    }
  }
}

const categoryCss = fs.readFileSync(CATEGORY_TOKEN_FILE, 'utf8');
for (const key of CATEGORY_KEYS) {
  for (const role of CATEGORY_ROLES) {
    const token = `--sec-${key}-${role}:`;
    const count = categoryCss.split(token).length - 1;
    if (count < 2) {
      failures.push(`${path.relative(ROOT, CATEGORY_TOKEN_FILE)} is missing light/dark coverage for ${token}`);
    }
  }
}

const semanticCss = fs.readFileSync(SEMANTIC_TOKEN_FILE, 'utf8');
for (const token of REQUIRED_SEMANTIC_TOKENS) {
  const count = semanticCss.split(`${token}:`).length - 1;
  if (count < 2) {
    failures.push(`${path.relative(ROOT, SEMANTIC_TOKEN_FILE)} is missing light/dark coverage for ${token}`);
  }
}

const mainContent = fs.readFileSync(MAIN_FILE, 'utf8');
for (const requiredImport of [
  "./theme/semantic-tokens.css",
  "./theme/category-tokens.css",
]) {
  if (!mainContent.includes(requiredImport)) {
    failures.push(`src/main.tsx must import ${requiredImport}`);
  }
}

if (failures.length > 0) {
  console.error('\nDesign-system audit failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  console.error(`\n${failures.length} violation(s) found.\n`);
  process.exit(1);
}

console.log('Design-system audit passed: semantic colors and all category themes are centralized.');
