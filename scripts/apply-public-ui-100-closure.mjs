import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, source) => fs.writeFileSync(path.join(root, file), source);
const mergeBase = execFileSync('git', ['merge-base', 'HEAD', 'origin/main'], { encoding: 'utf8' }).trim();
const readBase = (file) =>
  execFileSync('git', ['show', `${mergeBase}:${file}`], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith('.tsx') ? [path.relative(root, full).replaceAll('\\', '/')] : [];
  });
}

const publicTsxFiles = [
  ...walk(path.join(root, 'src/components')),
  ...walk(path.join(root, 'src/pages')),
  'src/App.tsx',
];

function legacyNumber(value) {
  if (value.length === 3) return Number(value) / 10;
  return Number(value);
}

function roleForLegacySize(value) {
  const n = legacyNumber(value);
  if (n <= 14.5) return 'type-compact';
  if (n < 15.5) return 'type-h4';
  if (n < 17) return 'type-label';
  if (n < 22) return 'type-h3';
  if (n < 26) return 'type-h2';
  return 'type-h1';
}

function collapseAdjacentTypeRoles(source) {
  const roleRank = {
    'type-compact': 0,
    'type-helper': 0,
    'type-meta': 0,
    'type-body': 0,
    'type-action': 0,
    'type-label': 1,
    'type-h4': 2,
    'type-h3': 3,
    'type-h2': 4,
    'type-h1': 5,
  };
  return source.replace(
    /\btype-(?:compact|helper|meta|body|action|label|h4|h3|h2|h1)(?:\s+type-(?:compact|helper|meta|body|action|label|h4|h3|h2|h1))+/g,
    (sequence) =>
      sequence
        .trim()
        .split(/\s+/)
        .sort((a, b) => roleRank[b] - roleRank[a])[0]
  );
}

function normalizeLegacyTypography(source) {
  source = source.replace(
    /(?:xs:|sm:|md:|lg:|xl:|2xl:|min-\[[^\]]+\]:)?text-\[var\(--type-fixed-(\d+)\)\]/g,
    (_match, value) => roleForLegacySize(value)
  );
  source = collapseAdjacentTypeRoles(source);
  source = source.replace(/min-h-\[42px\]/g, 'min-h-[44px]');
  return source;
}

// Always regenerate UI files from the branch merge-base. This keeps the transform
// deterministic and prevents an interrupted/partial codemod from becoming the next input.
for (const file of publicTsxFiles) {
  const source = normalizeLegacyTypography(readBase(file));
  write(file, source);
}

// SearchableSelect: central touch targets and a language-aware clear action.
{
  const file = 'src/components/ui/SearchableSelect.tsx';
  let source = read(file);
  source = source.replace('  clearable?: boolean;\n  className?: string;', '  clearable?: boolean;\n  clearLabel?: string;\n  className?: string;');
  source = source.replace('  clearable = false,\n  className = \'\',', '  clearable = false,\n  clearLabel,\n  className = \'\',');
  source = source.replace(
    '  const selected = options.find((option) => option.value === value);',
    "  const selected = options.find((option) => option.value === value);\n  const resolvedClearLabel =\n    clearLabel ||\n    (typeof document !== 'undefined' && document.documentElement.lang === 'bn'\n      ? 'নির্বাচন মুছুন'\n      : 'Clear selection');"
  );
  source = source.replace(
    'className="w-8 h-8 inline-flex items-center justify-center',
    'className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center'
  );
  source = source.replace('aria-label="Clear selection"', 'aria-label={resolvedClearLabel}');
  write(file, source);
}

// Accordion: keep validation wording in the active document language.
{
  const file = 'src/components/ui/Accordion.tsx';
  let source = read(file);
  source = source.replace(
    '  const isExpanded = collapsible ? isOpen : true;',
    "  const isExpanded = collapsible ? isOpen : true;\n  const errorLabel =\n    typeof document !== 'undefined' && document.documentElement.lang === 'bn' ? 'ত্রুটি' : 'Error';"
  );
  source = source.replaceAll('<span>ত্রুটি / Error</span>', '<span>{errorLabel}</span>');
  write(file, source);
}

// Modal: obey Hooks rules and use the central sheet radius.
{
  const file = 'src/components/ui/Modal.tsx';
  let source = read(file);
  const oldLanguageBlock = `  let appLanguage: 'bn' | 'en' = 'bn';\n  try {\n    const app = useApp();\n    if (app?.language) {\n      appLanguage = app.language;\n    }\n  } catch {\n    if (typeof document !== 'undefined' && document.documentElement.lang === 'en') {\n      appLanguage = 'en';\n    }\n  }\n  const activeLang = customLanguage || appLanguage;`;
  const newLanguageBlock = `  const { language: appLanguage } = useApp();\n  const activeLang = customLanguage || appLanguage;`;
  if (!source.includes(oldLanguageBlock)) throw new Error('Modal language block changed; refusing unsafe transform.');
  source = source.replace(oldLanguageBlock, newLanguageBlock);
  source = source.replace('rounded-t-2xl rounded-b-none', 'rounded-t-[var(--radius-card)] rounded-b-none');
  write(file, source);
}

// Complaint type selection: complete ARIA radio-group keyboard semantics.
{
  const file = 'src/components/report-composer/Step2ComplaintTypeAccordion.tsx';
  let source = read(file);
  source = source.replace(
    `  const helperText =\n    language === 'bn'\n      ? 'অভিযোগের ধরন নির্বাচন করুন।'\n      : 'Select a complaint type.';`,
    `  const helperText =\n    language === 'bn'\n      ? 'অভিযোগের ধরন নির্বাচন করুন।'\n      : 'Select a complaint type.';\n\n  const selectAndFocus = (index: number) => {\n    const next = allSubcategories[index];\n    if (!next) return;\n    onSelectSubcategory(next.id, next);\n    window.requestAnimationFrame(() => {\n      document.getElementById(\`subcategory-option-\${next.id}\`)?.focus();\n    });\n  };`
  );
  source = source.replace(
    `      <div\n        className={\`grid gap-2.5 sm:gap-3 \${`,
    `      <div\n        role="radiogroup"\n        aria-label={helperText}\n        className={\`grid gap-2.5 sm:gap-3 \${`
  );
  source = source.replace('{allSubcategories.map((item) => {', '{allSubcategories.map((item, index) => {');
  source = source.replace(
    '              tabIndex={0}',
    '              tabIndex={isSelected || (!selectedSubcategoryId && index === 0) ? 0 : -1}'
  );
  const oldKeydown = `              onKeyDown={(e) => {\n                if (e.key === 'Enter' || e.key === ' ') {\n                  e.preventDefault();\n                  onSelectSubcategory(item.id, item);\n                }\n              }}`;
  const newKeydown = `              onKeyDown={(e) => {\n                if (e.key === 'Enter' || e.key === ' ') {\n                  e.preventDefault();\n                  onSelectSubcategory(item.id, item);\n                  return;\n                }\n                if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;\n                e.preventDefault();\n                if (e.key === 'Home') return selectAndFocus(0);\n                if (e.key === 'End') return selectAndFocus(allSubcategories.length - 1);\n                const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;\n                const nextIndex = (index + delta + allSubcategories.length) % allSubcategories.length;\n                selectAndFocus(nextIndex);\n              }}`;
  if (!source.includes(oldKeydown)) throw new Error('Step 2 keyboard block changed; refusing unsafe transform.');
  source = source.replace(oldKeydown, newKeydown);
  write(file, source);
}

// App shell: keep the heavy composer out of the initial browsing bundle.
{
  const file = 'src/components/layout/AppShell.tsx';
  let source = read(file);
  source = source.replace("import { ReportComposerModal } from '../report-composer/ReportComposerModal';\n", '');
  const exploreLazy = `const LazyExplorePage = React.lazy(() =>\n  import('../../pages/ExplorePage').then((m) => ({ default: m.ExplorePage }))\n);`;
  if (!source.includes(exploreLazy)) throw new Error('Explore lazy boundary changed; refusing unsafe transform.');
  source = source.replace(
    exploreLazy,
    `${exploreLazy}\n\nconst LazyReportComposerModal = React.lazy(() =>\n  import('../report-composer/ReportComposerModal').then((m) => ({ default: m.ReportComposerModal }))\n);`
  );
  const oldComposer = `      <ErrorBoundary componentName="ReportComposerModal" silent>\n        <ReportComposerModal\n          isOpen={isReportComposerOpen}\n          onClose={closeReportComposer}\n          initialSegment={reportComposerInitialSegment}\n          language={language}\n        />\n      </ErrorBoundary>`;
  const newComposer = `      {isReportComposerOpen && (\n        <ErrorBoundary componentName="ReportComposerModal" silent>\n          <React.Suspense fallback={null}>\n            <LazyReportComposerModal\n              isOpen={isReportComposerOpen}\n              onClose={closeReportComposer}\n              initialSegment={reportComposerInitialSegment}\n              language={language}\n            />\n          </React.Suspense>\n        </ErrorBoundary>\n      )}`;
  if (!source.includes(oldComposer)) throw new Error('Composer render boundary changed; refusing unsafe transform.');
  source = source.replace(oldComposer, newComposer);
  write(file, source);
}

// Hero images: decode asynchronously and only eagerly load the active slide.
{
  const file = 'src/components/category/CategoryHeroBanner.tsx';
  let source = read(file);
  source = source.replace(
    `            aria-hidden="true"\n            style=`,
    `            aria-hidden="true"\n            loading={active ? 'eager' : 'lazy'}\n            fetchPriority={active ? 'high' : 'low'}\n            decoding="async"\n            style=`
  );
  write(file, source);
}

// Audits are regenerated from main as well, so the script is idempotent.
{
  const file = 'scripts/design-system-audit.mjs';
  let source = readBase(file);
  const anchor = `  {\n    id: 'arbitrary-type-size',\n    pattern: /\\btext-\\[\\d+(?:\\.\\d+)?(?:px|rem)\\]/g,\n    message: 'Hardcoded font size bypasses semantic typography tokens',\n  },`;
  if (!source.includes(anchor)) throw new Error('Design audit anchor changed; refusing unsafe transform.');
  source = source.replace(
    anchor,
    `${anchor}\n  {\n    id: 'legacy-fixed-type-alias',\n    pattern: /text-\\[var\\(--type-fixed-[^)]+\\)\\]/g,\n    message: 'Legacy fixed typography aliases are compatibility-only; use semantic typography roles',\n  },`
  );
  write(file, source);
}

{
  const file = 'scripts/ui-uniformity-audit.mjs';
  let source = readBase(file);
  const insertBefore = `if (failures.length) {`;
  const block = `const closureFiles = [\n  ...fs.readdirSync(path.resolve(ROOT, 'src/components/report-composer'))\n    .filter((name) => name.endsWith('.tsx'))\n    .map((name) => \`src/components/report-composer/\${name}\`),\n  'src/components/ui/Accordion.tsx',\n  'src/components/ui/Modal.tsx',\n  'src/components/ui/SearchableSelect.tsx',\n  'src/components/location/AddressSearchInput.tsx',\n];\n\nfor (const file of closureFiles) {\n  requireNotContains(file, '--type-fixed-', '100% closure forbids legacy fixed typography aliases');\n  requireNotContains(file, 'min-h-[42px]', 'interactive controls must meet the 44px minimum target');\n}\n\nrequireContains(\n  'src/components/report-composer/Step2ComplaintTypeAccordion.tsx',\n  'role="radiogroup"',\n  'complaint type choices must expose radio-group semantics'\n);\nrequireContains(\n  'src/components/report-composer/Step2ComplaintTypeAccordion.tsx',\n  "'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'",\n  'complaint type radio group must support standard keyboard navigation'\n);\nrequireContains(\n  'src/components/layout/AppShell.tsx',\n  'LazyReportComposerModal',\n  'report composer must remain lazy-loaded outside the initial browsing bundle'\n);\nrequireNotContains(\n  'src/components/layout/AppShell.tsx',\n  \"import { ReportComposerModal } from '../report-composer/ReportComposerModal';\",\n  'report composer must not return to the eager app-shell bundle'\n);\nrequireContains(\n  'src/components/ui/SearchableSelect.tsx',\n  'min-w-[44px] min-h-[44px]',\n  'searchable select clear action must meet the minimum touch target'\n);\nrequireContains(\n  'src/components/ui/Modal.tsx',\n  'const { language: appLanguage } = useApp();',\n  'Modal must call useApp unconditionally in accordance with Hooks rules'\n);\nrequireContains(\n  'src/components/category/CategoryHeroBanner.tsx',\n  "loading={active ? 'eager' : 'lazy'}",\n  'inactive hero artwork must remain lazy-loaded'\n);\n\n`;
  if (!source.includes(insertBefore)) throw new Error('Uniformity audit insertion point changed; refusing unsafe transform.');
  source = source.replace(insertBefore, block + insertBefore);
  write(file, source);
}

console.log(`Regenerated and normalized ${publicTsxFiles.length} Public TSX files from ${mergeBase}.`);
