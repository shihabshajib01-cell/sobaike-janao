import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, source) => fs.writeFileSync(path.join(root, file), source);

const composerDir = path.join(root, 'src/components/report-composer');
const composerFiles = fs
  .readdirSync(composerDir)
  .filter((name) => name.endsWith('.tsx'))
  .map((name) => `src/components/report-composer/${name}`);

function normalizeLegacyTypography(source) {
  const compound = [
    [/text-\[var\(--type-fixed-18\)\]\s+sm:text-\[var\(--type-fixed-20\)\]\s+md:text-\[var\(--type-fixed-22\)\]/g, 'type-h3'],
    [/text-\[var\(--type-fixed-20\)\]\s+md:text-\[var\(--type-fixed-22\)\]/g, 'type-h3'],
    [/text-\[var\(--type-fixed-13\)\]\s+sm:text-\[var\(--type-fixed-14\)\]\s+md:text-\[var\(--type-fixed-15\)\]/g, 'type-helper'],
    [/text-\[var\(--type-fixed-13\)\]\s+sm:text-\[var\(--type-fixed-14\)\]/g, 'type-helper'],
    [/text-\[var\(--type-fixed-12\)\]\s+sm:text-\[var\(--type-fixed-13\)\]\s+md:text-\[var\(--type-fixed-14\)\]/g, 'type-action'],
    [/text-\[var\(--type-fixed-145\)\]\s+sm:text-\[var\(--type-fixed-155\)\]/g, 'type-h4'],
    [/text-\[var\(--type-fixed-11\)\]\s+sm:text-\[var\(--type-fixed-12\)\]/g, 'type-helper'],
  ];
  for (const [pattern, replacement] of compound) source = source.replace(pattern, replacement);

  const roleFor = (value) => {
    const n = Number(value);
    if (n <= 14) return 'type-helper';
    if (n <= 15) return 'type-body';
    if (n <= 16) return 'type-label';
    if (n <= 20) return 'type-h3';
    if (n <= 24) return 'type-h2';
    return 'type-h1';
  };

  source = source.replace(/(?:sm:|md:|lg:|xl:)?text-\[var\(--type-fixed-(\d+)\)\]/g, (_match, value) => roleFor(value));
  source = source.replace(/\b(type-(?:helper|body|label|action|meta|h[1-4]))(?:\s+\1)+\b/g, '$1');
  source = source.replace(/min-h-\[42px\]/g, 'min-h-[44px]');
  return source;
}

for (const file of composerFiles) {
  const before = read(file);
  const after = normalizeLegacyTypography(before);
  if (after !== before) write(file, after);
}

// SearchableSelect: central touch targets, semantic type roles and localized clear action.
{
  const file = 'src/components/ui/SearchableSelect.tsx';
  let source = normalizeLegacyTypography(read(file));
  source = source.replace('  clearable?: boolean;\n  className?: string;', '  clearable?: boolean;\n  clearLabel?: string;\n  className?: string;');
  source = source.replace('  clearable = false,\n  className = \'\',', '  clearable = false,\n  clearLabel,\n  className = \'\',');
  source = source.replace(
    '  const selected = options.find((option) => option.value === value);',
    "  const selected = options.find((option) => option.value === value);\n  const resolvedClearLabel =\n    clearLabel ||\n    (typeof document !== 'undefined' && document.documentElement.lang === 'bn'\n      ? 'নির্বাচন মুছুন'\n      : 'Clear selection');"
  );
  source = source.replace('className="w-8 h-8 inline-flex items-center justify-center', 'className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center');
  source = source.replace('aria-label="Clear selection"', 'aria-label={resolvedClearLabel}');
  source = source.replace("className={`w-full min-h-[44px] bg-ui-surface", "className={`w-full min-h-[44px] bg-ui-surface");
  write(file, source);
}

// Accordion: semantic type roles and language-aware validation badge.
{
  const file = 'src/components/ui/Accordion.tsx';
  let source = normalizeLegacyTypography(read(file));
  source = source.replace(
    '  const isExpanded = collapsible ? isOpen : true;',
    "  const isExpanded = collapsible ? isOpen : true;\n  const errorLabel =\n    typeof document !== 'undefined' && document.documentElement.lang === 'bn' ? 'ত্রুটি' : 'Error';"
  );
  source = source.replaceAll('<span>ত্রুটি / Error</span>', '<span>{errorLabel}</span>');
  write(file, source);
}

// Modal: obey Hooks rules, use semantic typography and tokenized mobile sheet radius.
{
  const file = 'src/components/ui/Modal.tsx';
  let source = normalizeLegacyTypography(read(file));
  const oldLanguageBlock = `  let appLanguage: 'bn' | 'en' = 'bn';\n  try {\n    const app = useApp();\n    if (app?.language) {\n      appLanguage = app.language;\n    }\n  } catch {\n    if (typeof document !== 'undefined' && document.documentElement.lang === 'en') {\n      appLanguage = 'en';\n    }\n  }\n  const activeLang = customLanguage || appLanguage;`;
  const newLanguageBlock = `  const { language: appLanguage } = useApp();\n  const activeLang = customLanguage || appLanguage;`;
  if (!source.includes(oldLanguageBlock)) throw new Error('Modal language block changed; refusing unsafe transform.');
  source = source.replace(oldLanguageBlock, newLanguageBlock);
  source = source.replace('rounded-t-2xl rounded-b-none', 'rounded-t-[var(--radius-card)] rounded-b-none');
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

// Design-system audit: fixed aliases are compatibility-only and must not return to TSX.
{
  const file = 'scripts/design-system-audit.mjs';
  let source = read(file);
  const anchor = `  {\n    id: 'arbitrary-type-size',\n    pattern: /\\btext-\\[\\d+(?:\\.\\d+)?(?:px|rem)\\]/g,\n    message: 'Hardcoded font size bypasses semantic typography tokens',\n  },`;
  if (!source.includes(anchor)) throw new Error('Design audit anchor changed; refusing unsafe transform.');
  source = source.replace(
    anchor,
    `${anchor}\n  {\n    id: 'legacy-fixed-type-alias',\n    pattern: /text-\\[var\\(--type-fixed-[^)]+\\)\\]/g,\n    message: 'Legacy fixed typography aliases are compatibility-only; use semantic typography roles',\n  },`
  );
  write(file, source);
}

// Uniformity audit: make the closure scope explicit and permanent.
{
  const file = 'scripts/ui-uniformity-audit.mjs';
  let source = read(file);
  const insertBefore = `if (failures.length) {`;
  const block = `const closureFiles = [\n  'src/components/ui/Accordion.tsx',\n  'src/components/ui/Modal.tsx',\n  'src/components/ui/SearchableSelect.tsx',\n  ...fs.readdirSync(path.resolve(ROOT, 'src/components/report-composer'))\n    .filter((name) => name.endsWith('.tsx'))\n    .map((name) => \`src/components/report-composer/\${name}\`),\n];\n\nfor (const file of closureFiles) {\n  requireNotContains(file, '--type-fixed-', '100% closure forbids legacy fixed typography aliases');\n  requireNotContains(file, 'min-h-[42px]', 'interactive controls must meet the 44px minimum target');\n}\n\nrequireContains(\n  'src/components/layout/AppShell.tsx',\n  'LazyReportComposerModal',\n  'report composer must remain lazy-loaded outside the initial browsing bundle'\n);\nrequireNotContains(\n  'src/components/layout/AppShell.tsx',\n  \"import { ReportComposerModal } from '../report-composer/ReportComposerModal';\",\n  'report composer must not return to the eager app-shell bundle'\n);\nrequireContains(\n  'src/components/ui/SearchableSelect.tsx',\n  'min-w-[44px] min-h-[44px]',\n  'searchable select clear action must meet the minimum touch target'\n);\nrequireContains(\n  'src/components/ui/Modal.tsx',\n  'const { language: appLanguage } = useApp();',\n  'Modal must call useApp unconditionally in accordance with Hooks rules'\n);\n\n`;
  if (!source.includes(insertBefore)) throw new Error('Uniformity audit insertion point changed; refusing unsafe transform.');
  source = source.replace(insertBefore, block + insertBefore);
  write(file, source);
}

console.log(`Applied Public UI 100% closure normalization to ${composerFiles.length} composer files plus shared primitives, app shell and audit guards.`);
