import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (relative) => fs.readFileSync(path.resolve(ROOT, relative), 'utf8');

const failures = [];
const requireContains = (file, token, message) => {
  const source = read(file);
  if (!source.includes(token)) failures.push(`${file}: ${message}`);
};
const requireNotContains = (file, token, message) => {
  const source = read(file);
  if (source.includes(token)) failures.push(`${file}: ${message}`);
};

const categoryPages = [
  'src/pages/StandardCategoryPage.tsx',
  'src/pages/ExtortionPage.tsx',
  'src/pages/HarassmentPage.tsx',
  'src/pages/UtilityPage.tsx',
  'src/pages/RickshawPage.tsx',
];

for (const file of categoryPages) {
  requireContains(file, 'CategoryFeedView', 'must render the shared CategoryFeedView');
  requireNotContains(file, "../components/report/ReportCard", 'must not own a page-specific report-list implementation');
  requireNotContains(file, "../components/ui/FilterChip", 'must not own a page-specific subcategory chip rail');
  requireNotContains(file, 'ReportFeedSkeleton', 'must not own a page-specific feed loading state');
  requireNotContains(file, 'EmptyState', 'must not own a page-specific feed empty state');
  requireNotContains(file, 'btn-primary-action', 'must not own a page-specific retry button recipe');
  requireNotContains(file, 'overflow-x-auto', 'must not own a page-specific horizontal navigation rail');
  requireNotContains(file, 'overflow-x-scroll', 'must not own a page-specific horizontal navigation rail');
}

requireContains(
  'src/components/feed/CategoryFeedView.tsx',
  'HorizontalScrollRail',
  'shared category feed must use the shared horizontal rail'
);
requireContains(
  'src/components/feed/CategoryFeedView.tsx',
  '<Button',
  'shared category feed must use the shared Button for retry'
);
requireContains(
  'src/components/feed/CategoryFeedView.tsx',
  'type-h2',
  'shared category feed heading must use semantic typography'
);
requireContains(
  'src/components/ui/HorizontalScrollRail.tsx',
  '<IconButton',
  'horizontal rail arrows must use the shared IconButton'
);
requireContains(
  'src/components/ui/HorizontalScrollRail.tsx',
  'ResizeObserver',
  'horizontal rail must respond to dynamic content/viewport width'
);

for (const file of ['src/pages/MorePage.tsx', 'src/pages/SearchPage.tsx']) {
  requireContains(file, 'HorizontalScrollRail', 'horizontal tabs must use the shared horizontal rail');
  requireContains(file, '<Button', 'tab/retry actions must use the shared Button primitive');
  requireNotContains(file, 'overflow-x-auto no-scrollbar', 'must not recreate a horizontal tab rail');
}

requireContains(
  'src/pages/SearchPage.tsx',
  '<SearchInput',
  'Search page must use the shared SearchInput primitive'
);
requireNotContains(
  'src/pages/SearchPage.tsx',
  'btn-primary-action',
  'Search page must not recreate the primary retry button recipe'
);

if (failures.length) {
  console.error(`Public UI uniformity audit found ${failures.length} violation(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('Public UI uniformity audit passed: shared feed, rail, search and action patterns are enforced.');
