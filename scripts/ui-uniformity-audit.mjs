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

requireContains(
  'src/pages/HomePage.tsx',
  'HorizontalScrollRail',
  'Home feed filters must use the shared horizontal rail'
);
requireContains(
  'src/pages/HomePage.tsx',
  'home-feed-filter-rail',
  'Home feed must expose a stable shared filter rail target'
);
requireNotContains(
  'src/pages/HomePage.tsx',
  'overflow-x-auto',
  'Home must not recreate its own horizontal filter rail'
);
requireNotContains(
  'src/pages/HomePage.tsx',
  'reportCounts',
  'Home must not carry stale category-count presentation plumbing'
);
requireNotContains(
  'src/components/home/ServiceHeroCarousel.tsx',
  'reportCounts',
  'Hero must not expose an unused report-count presentation API'
);
requireNotContains(
  'src/components/ui/SearchInput.tsx',
  'placeholderBn',
  'SearchInput must not expose unused language-specific placeholder props'
);

requireNotContains(
  'src/pages/IssuesPage.tsx',
  'className="md:hidden"',
  'Issues route content must remain available at tablet and desktop widths'
);

const reportCard = 'src/components/report/ReportCard.tsx';
requireContains(reportCard, 'role="link"', 'clickable report card must expose link semantics');
requireContains(reportCard, 'tabIndex={0}', 'clickable report card must be keyboard focusable');
requireContains(reportCard, 'onKeyDown={handleCardKeyDown}', 'clickable report card must support Enter/Space activation');
requireContains(reportCard, 'INTERACTIVE_SELECTOR', 'card activation must protect nested interactive actions');

const consolidatedPublicUiFiles = [
  'src/pages/ReportPage.tsx',
  'src/components/layout/Header.tsx',
  'src/components/layout/BottomNav.tsx',
  'src/pages/LocationPage.tsx',
  'src/pages/SubjectPage.tsx',
  'src/pages/ReportDetailPage.tsx',
  'src/pages/ExplorePage.tsx',
];

for (const file of consolidatedPublicUiFiles) {
  requireNotContains(file, '--type-fixed-', 'must use semantic typography roles instead of legacy fixed aliases');
}

for (const file of ['src/pages/LocationPage.tsx', 'src/pages/SubjectPage.tsx']) {
  requireContains(file, '<Button', 'entity feed page actions must use the shared Button primitive');
  requireContains(file, '<EmptyState', 'entity feed page empty state must use shared EmptyState');
  requireNotContains(file, 'btn-primary-action', 'entity feed page must not recreate primary action styling');
}

requireContains(
  'src/pages/LocationPage.tsx',
  'CATEGORY_ORDER',
  'Location summaries must derive from the current active category set'
);

requireContains(
  'src/pages/ReportDetailPage.tsx',
  "import { Button } from '../components/ui/Button';",
  'Report detail actions must use the shared Button primitive'
);
requireNotContains(
  'src/pages/ReportDetailPage.tsx',
  'btn-primary-action',
  'Report detail must not recreate primary action styling'
);

requireContains(
  'src/pages/ExplorePage.tsx',
  "import { FilterChip } from '../components/ui/FilterChip';",
  'Explore category controls must reuse shared FilterChip'
);
requireContains(
  'src/pages/ExplorePage.tsx',
  'explore-mobile-filter-button',
  'Explore mobile filter action must use the shared action path'
);

const reportTitleField = 'src/components/report-composer/ReportTitleField.tsx';
requireContains(reportTitleField, 'type-label', 'report title label must use semantic label typography');
requireContains(reportTitleField, 'type-body', 'report title input must use semantic body typography');
requireContains(reportTitleField, 'type-helper', 'report title helper/error text must use semantic helper typography');
requireContains(reportTitleField, 'type-meta', 'report title counter must use semantic meta typography');
requireContains(reportTitleField, 'ui-control', 'report title input must use the shared control recipe');
requireContains(reportTitleField, 'aria-required="true"', 'required report title input must expose required semantics');
requireContains(reportTitleField, 'role="alert"', 'report title validation must announce errors');
requireNotContains(reportTitleField, '--type-fixed-', 'report title field must not use legacy fixed typography aliases');
requireNotContains(reportTitleField, 'min-h-[44px]', 'report title field must inherit minimum target size from ui-control');

const closureFiles = [
  ...fs.readdirSync(path.resolve(ROOT, 'src/components/report-composer'))
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => `src/components/report-composer/${name}`),
  'src/components/ui/Accordion.tsx',
  'src/components/ui/Modal.tsx',
  'src/components/ui/SearchableSelect.tsx',
  'src/components/location/AddressSearchInput.tsx',
];

for (const file of closureFiles) {
  requireNotContains(file, '--type-fixed-', '100% closure forbids legacy fixed typography aliases');
  requireNotContains(file, 'min-h-[42px]', 'interactive controls must meet the 44px minimum target');
}

requireContains(
  'src/components/report-composer/Step2ComplaintTypeAccordion.tsx',
  'role="radiogroup"',
  'complaint type choices must expose radio-group semantics'
);
requireContains(
  'src/components/report-composer/Step2ComplaintTypeAccordion.tsx',
  "'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'",
  'complaint type radio group must support standard keyboard navigation'
);
requireContains(
  'src/components/layout/AppShell.tsx',
  'LazyReportComposerModal',
  'report composer must remain lazy-loaded outside the initial browsing bundle'
);
requireNotContains(
  'src/components/layout/AppShell.tsx',
  "import { ReportComposerModal } from '../report-composer/ReportComposerModal';",
  'report composer must not return to the eager app-shell bundle'
);
requireContains(
  'src/components/ui/SearchableSelect.tsx',
  'min-w-[44px] min-h-[44px]',
  'searchable select clear action must meet the minimum touch target'
);
requireContains(
  'src/components/ui/Modal.tsx',
  'const { language: appLanguage } = useApp();',
  'Modal must call useApp unconditionally in accordance with Hooks rules'
);
requireContains(
  'src/components/category/CategoryHeroBanner.tsx',
  "loading={active ? 'eager' : 'lazy'}",
  'inactive hero artwork must remain lazy-loaded'
);

if (failures.length) {
  console.error(`Public UI uniformity audit found ${failures.length} violation(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('Public UI uniformity audit passed: shared feed, rail, navigation, entity pages, report detail, explore, form and action patterns are enforced.');
