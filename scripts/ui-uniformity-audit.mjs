import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (relative) => fs.readFileSync(path.resolve(ROOT, relative), 'utf8');
const walkTsx = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkTsx(full));
    else if (entry.isFile() && entry.name.endsWith('.tsx')) files.push(full);
  }
  return files;
};

const extractJsxPropExpressions = (source, propName) => {
  const token = `${propName}={`;
  const expressions = [];
  let cursor = 0;

  while (cursor < source.length) {
    const start = source.indexOf(token, cursor);
    if (start === -1) break;

    let index = start + token.length;
    let depth = 1;
    let quote = null;
    let escaped = false;

    while (index < source.length && depth > 0) {
      const char = source[index];

      if (quote) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === quote) {
          quote = null;
        }
        index += 1;
        continue;
      }

      if (char === "'" || char === '"' || char === '`') {
        quote = char;
      } else if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
      }

      index += 1;
    }

    expressions.push(source.slice(start + token.length, Math.max(start + token.length, index - 1)));
    cursor = index;
  }

  return expressions;
};

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

const standardModalSurfaces = [
  'src/components/layout/SearchModal.tsx',
  'src/components/location/FirstVisitNoticeModal.tsx',
  'src/components/location/LocationConsentModal.tsx',
  'src/components/report-detail/CitizenActionModal.tsx',
  'src/components/report-detail/SubjectResponseModal.tsx',
  'src/components/report/CategoryFilterSheet.tsx',
  'src/components/report/HarassmentFilterSheet.tsx',
];

for (const file of standardModalSurfaces) {
  requireContains(file, '<Modal', 'standard dialogs must use the shared Modal shell');
  requireNotContains(file, 'showHeader={false}', 'standard dialogs must use the unified Modal header anatomy');
}

for (const root of [path.resolve(ROOT, 'src/components'), path.resolve(ROOT, 'src/pages')]) {
  for (const filePath of walkTsx(root)) {
    const relative = path.relative(ROOT, filePath).replaceAll('\\', '/');
    const source = fs.readFileSync(filePath, 'utf8');
    if (!source.includes('<Modal')) continue;

    const footerExpressions = extractJsxPropExpressions(source, 'footer');
    footerExpressions.forEach((footerExpression, index) => {
      if (!footerExpression.includes('<ModalActions')) {
        failures.push(
          `${relative}: Modal footer #${index + 1} must use the shared ModalActions layout`
        );
      }
    });
  }
}

requireContains(
  'src/components/layout/SearchModal.tsx',
  '<Button',
  'search-modal quick actions must use the shared Button primitive'
);
requireNotContains(
  'src/components/layout/SearchModal.tsx',
  '<button',
  'search modal must not recreate raw button controls'
);
requireNotContains(
  'src/components/report-detail/SubjectResponseModal.tsx',
  '<button',
  'subject-response modal must not retain raw legacy button controls'
);
requireNotContains(
  'src/components/report-detail/SubjectResponseModal.tsx',
  'type="checkbox"',
  'subject-response modal must use the shared Checkbox primitive'
);

const approvedSpecializedDialogSurfaces = new Set([
  'src/components/media/ImageViewer.tsx',
  'src/components/media/AttachmentLightboxModal.tsx',
  'src/components/ui/Drawer.tsx',
]);

for (const root of [path.resolve(ROOT, 'src/components'), path.resolve(ROOT, 'src/pages')]) {
  for (const filePath of walkTsx(root)) {
    const relative = path.relative(ROOT, filePath).replaceAll('\\', '/');
    if (relative === 'src/components/ui/Modal.tsx' || approvedSpecializedDialogSurfaces.has(relative)) continue;
    const source = fs.readFileSync(filePath, 'utf8');
    if (source.includes('role="dialog"') || source.includes("role='dialog'")) {
      failures.push(`${relative}: raw dialog shells are forbidden; use the shared Modal system`);
    }
  }
}

requireContains(
  'src/components/ui/Modal.tsx',
  'headerIcon?: React.ReactNode;',
  'Modal must own the shared icon-header recipe'
);
requireContains(
  'src/components/ui/Modal.tsx',
  'showCloseButton?: boolean;',
  'Modal must centrally control close-button presence'
);

requireContains(
  'src/components/ui/Modal.tsx',
  'closeOnEscape?: boolean;',
  'Modal must expose an explicit Escape-dismiss policy'
);

requireContains(
  'src/components/location/FirstVisitNoticeModal.tsx',
  'closeOnEscape={false}',
  'mandatory first-visit acknowledgement must not dismiss with Escape'
);

for (const file of [
  'src/components/report-detail/CitizenActionModal.tsx',
  'src/components/report-detail/SubjectResponseModal.tsx',
]) {
  requireContains(
    file,
    '<UnsavedChangesDialog',
    'data-entry modals must protect dirty content with the shared discard confirmation'
  );
  requireContains(
    file,
    'closeOnEscape={true}',
    'data-entry modal Escape must route through the guarded close path'
  );
}

requireContains(
  'src/components/location/LocationConsentModal.tsx',
  'closeOnEscape={true}',
  'location permission modal must explicitly define its Escape dismissal policy'
);
requireContains(
  'src/components/report-composer/ReportComposerModal.tsx',
  'closeOnEscape={true}',
  'nested report-composer dialogs must explicitly define safe Escape behavior'
);
requireContains(
  'src/components/ui/Modal.tsx',
  'useDialogLifecycle',
  'Modal must use the shared dialog lifecycle behavior'
);
requireContains(
  'src/components/ui/useDialogLifecycle.ts',
  'button:not([disabled])',
  'dialog focus trapping must exclude disabled buttons'
);
requireContains(
  'src/components/ui/useDialogLifecycle.ts',
  'getClientRects().length > 0',
  'dialog focus trapping must exclude hidden controls'
);

requireContains(
  'src/components/ui/useDialogLifecycle.ts',
  'container.contains(activeElement)',
  'dialog lifecycle must preserve an element that already received autofocus inside the dialog'
);
requireContains(
  'src/components/ui/useDialogLifecycle.ts',
  'syncDialogInertState',
  'nested dialogs must isolate underlying dialog surfaces with inert state'
);
requireContains(
  'src/components/ui/Modal.tsx',
  'dialogRef: modalRootRef',
  'shared Modal must register its dialog root for nested inert isolation'
);
requireNotContains(
  'src/components/ui/Modal.tsx',
  'draft-confirm-close-modal',
  'Modal must not retain deleted draft-confirmation sizing exceptions'
);
requireContains(
  'src/components/ui/UnsavedChangesDialog.tsx',
  "variant: 'destructive'",
  'shared unsaved-changes confirmation must expose a destructive discard action'
);
requireContains(
  'src/components/ui/UnsavedChangesDialog.tsx',
  '<ModalActions',
  'shared unsaved-changes confirmation must use ModalActions'
);
requireContains(
  'src/components/media/ImageViewer.tsx',
  'useDialogLifecycle',
  'published image viewer must reuse shared dialog lifecycle behavior'
);
requireContains(
  'src/components/media/AttachmentLightboxModal.tsx',
  'useDialogLifecycle',
  'attachment viewer must reuse shared dialog lifecycle behavior'
);

for (const file of [
  'src/components/media/ImageViewer.tsx',
  'src/components/media/AttachmentLightboxModal.tsx',
]) {
  requireNotContains(
    file,
    "window.addEventListener('keydown'",
    'specialized media dialogs must not recreate keyboard lifecycle handling'
  );
  requireNotContains(
    file,
    "document.body.style.overflow",
    'specialized media dialogs must not recreate scroll-lock handling'
  );
  requireContains(
    file,
    'tabIndex={-1}',
    'specialized media dialogs must provide a safe lifecycle focus target'
  );
}

requireContains(
  'src/components/ui/Drawer.tsx',
  'useDialogLifecycle',
  'shared Drawer must reuse the central dialog lifecycle'
);
requireNotContains(
  'src/components/ui/Drawer.tsx',
  "window.addEventListener('keydown'",
  'Drawer must not recreate keyboard lifecycle handling'
);
requireNotContains(
  'src/components/ui/Drawer.tsx',
  "document.body.style.overflow",
  'Drawer must not recreate scroll-lock handling'
);
requireContains(
  'src/components/ui/SearchInput.tsx',
  'e.stopPropagation();',
  'search input must clear its value without also dismissing a parent modal'
);
requireContains(
  'src/components/ui/ModalActions.tsx',
  "{secondary ? renderAction(secondary, 'outline') : null}",
  'ModalActions must render secondary before primary consistently'
);
requireContains(
  'src/components/ui/Modal.tsx',
  'bg-ui-surface border-t border-ui-stroke-subtle',
  'Modal footer must use the unified surface and divider recipe'
);
requireContains(
  'src/components/ui/Modal.tsx',
  'bg-ui-overlay',
  'Modal backdrop must use the semantic overlay utility'
);
requireNotContains(
  'src/components/ui/Modal.tsx',
  "style={{ backgroundColor: 'var(--ui-overlay)' }}",
  'Modal backdrop must not recreate semantic overlay styling inline'
);
requireContains(
  'src/components/ui/Checkbox.tsx',
  'labelClassName?: string;',
  'Checkbox must expose semantic label typography customization without nested overrides'
);
requireContains(
  'src/components/ui/Button.tsx',
  'disabled:bg-ui-disabled-bg',
  'Button must own the shared semantic disabled background state'
);
requireContains(
  'src/components/ui/Button.tsx',
  'disabled:text-ui-disabled-text',
  'Button must own the shared semantic disabled text state'
);
requireNotContains(
  'src/components/ui/Button.tsx',
  'disabled:opacity-50',
  'Button must not use opacity as its primary disabled-state recipe'
);
requireContains(
  'src/components/location/FirstVisitNoticeModal.tsx',
  'ui-radius-control ui-border-default border-ui-stroke-default',
  'First-visit instructions must use centralized radius and border utilities'
);
requireContains(
  'src/components/location/FirstVisitNoticeModal.tsx',
  'labelClassName="type-body text-ui-content-primary"',
  'First-visit consent must request its typography through the Checkbox API'
);
requireNotContains(
  'src/components/location/FirstVisitNoticeModal.tsx',
  'disabled:bg-ui-disabled-bg',
  'First-visit CTA must inherit the shared Button disabled recipe'
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
