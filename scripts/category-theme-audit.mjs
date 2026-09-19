import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const css = read('src/theme/color-system.css');
const shell = read('src/components/layout/AppShell.tsx');
const taxonomy = read('src/services/taxonomyService.ts');
const composerStep1 = read('src/components/report-composer/Step1ServiceSelect.tsx');
const composerHeader = read('src/components/report-composer/ReportComposerHeader.tsx');
const homeCarousel = read('src/components/home/ServiceHeroCarousel.tsx');

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
]) {
  if (!css.includes(role)) failures.push(`Missing scoped semantic mapping: ${role}`);
}

if (!css.includes('--hero-text-primary: color-mix(in srgb, var(--category-route-on-container) 68%, var(--md-on-surface))')) {
  failures.push('Category route hero title does not use the stronger category-derived text role');
}
if (!css.includes('--hero-text-secondary: color-mix(in srgb, var(--category-route-on-container) 76%, var(--md-on-surface))')) {
  failures.push('Category route hero description does not use the stronger category-derived text role');
}

if (!composerStep1.includes('accent: \`color-mix(in srgb, \${text} 82%, var(--md-on-surface))\`')) {
  failures.push('Report composer category cards do not derive their accent from the banner text role');
}
if (!composerStep1.includes('borderColor: isSelected ? palette.accent : undefined')) {
  failures.push('Report composer selected category border is not using the category accent');
}
if (!composerStep1.includes('color: palette.accent')) {
  failures.push('Report composer unselected category icon is not using the category accent');
}
if (!composerHeader.includes('color: \`color-mix(in srgb, \${color} 82%, var(--md-on-surface))\`')) {
  failures.push('Report composer selected category badge is not using the stronger category accent');
}

if (!homeCarousel.includes('className="category-hero-slider')) {
  failures.push('Home hero does not share the category banner mobile/layout recipe');
}
if (!homeCarousel.includes('className={\`category-theme-scope')) {
  failures.push('Home hero slides do not use the same scoped category theme as category pages');
}
if (!homeCarousel.includes("'--category-route-on-container': slideSegment.textColor")) {
  failures.push('Home hero slides do not source banner text from the category palette');
}
if (homeCarousel.includes('titleColor={') || homeCarousel.includes('descriptionColor={')) {
  failures.push('Home hero has one-off text overrides instead of the shared category banner style');
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
