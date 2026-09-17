import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const failures = [];
const read = (file) => fs.readFileSync(path.resolve(ROOT, file), 'utf8');
const size = (file) => fs.statSync(path.resolve(ROOT, file)).size;
const requireContains = (file, token, message) => {
  if (!read(file).includes(token)) failures.push(`${file}: ${message}`);
};
const requireNotContains = (file, token, message) => {
  if (read(file).includes(token)) failures.push(`${file}: ${message}`);
};

const appShell = 'src/components/layout/AppShell.tsx';
for (const token of [
  'LazyReportComposerModal',
  'LazyReportDetailPage',
  'LazySearchPage',
  'LazyMorePage',
  'LazyLocationPage',
  'LazySubjectPage',
  'LazyExplorePage',
]) {
  requireContains(appShell, token, `${token} must remain route/workflow code-split`);
}
requireNotContains(
  appShell,
  "import { ReportComposerModal } from '../report-composer/ReportComposerModal'",
  'report composer must not return to the initial application bundle'
);

const packageJson = JSON.parse(read('package.json'));
for (const script of [
  'lint',
  'typecheck',
  'test',
  'test:a11y',
  'audit:bundle',
  'audit:design-system',
  'audit:ui-uniformity',
  'audit:technical-quality',
]) {
  if (!packageJson.scripts?.[script]) failures.push(`package.json: missing ${script} script`);
}
if (packageJson.scripts?.lint?.includes('tsc --noEmit')) {
  failures.push('package.json: lint must be real source linting; TypeScript belongs in typecheck');
}

for (const dependency of [
  'eslint',
  'typescript-eslint',
  'eslint-plugin-react-hooks',
  'tsx',
  'playwright',
  '@axe-core/playwright',
]) {
  if (!packageJson.devDependencies?.[dependency]) {
    failures.push(`package.json: missing pinned quality dependency ${dependency}`);
  }
}

for (const file of [
  'eslint.config.mjs',
  'scripts/public-accessibility-smoke.mjs',
  'scripts/bundle-budget.mjs',
  'scripts/public-functional-smoke.mjs',
  'scripts/public-ui-100-regression-smoke.mjs',
  'tests/formatters.test.ts',
  'tests/report-domain.test.ts',
  'tests/geo-distance.test.ts',
]) {
  if (!fs.existsSync(path.resolve(ROOT, file))) failures.push(`${file}: required quality gate is missing`);
}

const sourceLimits = new Map([
  ['src/components/report-composer/Step3ComplaintDetails.tsx', 134 * 1024],
  ['src/components/report-composer/Step4Review.tsx', 50 * 1024],
  ['src/components/report-composer/ReportComposerModal.tsx', 55 * 1024],
  ['src/pages/ExplorePage.tsx', 62 * 1024],
  ['src/pages/ReportDetailPage.tsx', 45 * 1024],
]);
for (const [file, maxBytes] of sourceLimits) {
  const actual = size(file);
  if (actual > maxBytes) {
    failures.push(`${file}: ${(actual / 1024).toFixed(1)} KiB exceeds guarded ${(maxBytes / 1024).toFixed(0)} KiB complexity budget`);
  }
}

const ci = read('.github/workflows/ci.yml');
for (const token of [
  'npm run lint',
  'npm run typecheck',
  'npm test',
  'npm run audit:bundle',
  'npm run audit:technical-quality',
  'npm run test:a11y',
  'node scripts/public-functional-smoke.mjs',
  'node scripts/public-ui-100-regression-smoke.mjs',
]) {
  if (!ci.includes(token)) failures.push(`.github/workflows/ci.yml: missing ${token}`);
}

if (failures.length) {
  console.error(`Public technical-quality audit found ${failures.length} violation(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('Public technical-quality audit passed: code splitting, real linting, tests, accessibility tooling, bundle budgets, full browser regression and complexity guards are enforced.');
