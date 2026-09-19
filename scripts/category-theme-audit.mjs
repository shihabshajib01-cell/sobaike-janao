import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const css = read('src/theme/color-system.css');
const shell = read('src/components/layout/AppShell.tsx');
const taxonomy = read('src/services/taxonomyService.ts');

const categories = [
  'harassment',
  'extortion',
  'public_safety',
  'road_transport',
  'load_shedding',
  'illegal_occupation',
  'rickshaw',
];

const failures = [];

for (const category of categories) {
  for (const role of ['primary', 'hover', 'container', 'on-container', 'outline', 'on-primary']) {
    if (!css.includes(`--category-${category}-${role}:`)) {
      failures.push(`Missing ${category} ${role} token`);
    }
  }
}

for (const role of [
  '--md-primary: var(--category-route-primary)',
  '--md-secondary: var(--category-route-primary)',
  '--md-focus: var(--category-route-primary)',
  '--ui-primary-action-bg: var(--category-route-primary)',
  '--ui-accent: var(--category-route-primary)',
  '--ui-focus: var(--category-route-primary)',
  '--hero-text-primary: var(--category-route-on-container)',
]) {
  if (!css.includes(role)) failures.push(`Missing scoped semantic mapping: ${role}`);
}

if (!shell.includes('category-theme-scope')) failures.push('AppShell does not activate category theme scope');
if (!shell.includes('data-category-theme')) failures.push('AppShell lacks category theme marker');
if (!shell.includes("'--category-route-primary': segment.primaryColor")) failures.push('AppShell does not source primary from taxonomy');
if (!taxonomy.includes('if (legacy) {\n            clearRuntimeSectionCssVariables(segment.id);')) {
  failures.push('Built-in categories are not protected from runtime theme overrides');
}

if (failures.length) {
  console.error('Category theme audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Category theme audit passed: ${categories.length} canonical palettes propagate through shared semantic roles.`);
