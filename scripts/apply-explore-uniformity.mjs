import fs from 'node:fs';

const file = 'src/pages/ExplorePage.tsx';
let source = fs.readFileSync(file, 'utf8');

function replaceOnce(from, to, label) {
  const first = source.indexOf(from);
  if (first < 0) throw new Error(`Missing expected Explore pattern: ${label}`);
  if (source.indexOf(from, first + from.length) >= 0) {
    throw new Error(`Explore pattern is not unique: ${label}`);
  }
  source = source.slice(0, first) + to + source.slice(first + from.length);
}

replaceOnce(
  "import { SearchableSelect } from '../components/ui/SearchableSelect';",
  "import { SearchableSelect } from '../components/ui/SearchableSelect';\nimport { SearchInput } from '../components/ui/SearchInput';\nimport { Button } from '../components/ui/Button';\nimport { HorizontalScrollRail } from '../components/ui/HorizontalScrollRail';",
  'shared UI imports'
);

replaceOnce(
  'className="text-[var(--type-fixed-22)] md:text-[var(--type-fixed-26)] leading-[var(--type-line-ratio-125)] font-[var(--font-weight-bold)] text-ui-content-primary tracking-tight"',
  'className="type-h1 text-ui-content-primary"',
  'page title typography'
);
replaceOnce(
  'className="text-[var(--type-fixed-13)] md:text-[var(--type-fixed-14)] leading-[var(--type-line-ratio-140)] text-ui-content-secondary"',
  'className="type-body text-ui-content-secondary"',
  'page helper typography'
);
replaceOnce(
  'className="text-[var(--type-fixed-15)] font-[var(--font-weight-bold)] text-ui-content-primary"',
  'className="type-h4 text-ui-content-primary"',
  'find reports heading typography'
);
replaceOnce(
  'className="text-[var(--type-fixed-12)] sm:text-[var(--type-fixed-13)] text-ui-content-secondary"',
  'className="type-meta text-ui-content-secondary"',
  'find reports helper typography'
);

const desktopSearch = `          <div className="relative flex items-center w-[240px] lg:w-[280px] shrink-0">
            <MapIcon name="search" size="sm" className="text-ui-content-muted absolute left-3.5 pointer-events-none" ariaHidden={true} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={language === 'bn' ? 'এলাকা বা প্রতিবেদন খুঁজুন' : 'Search by area or report'}
              placeholder={language === 'bn' ? 'এলাকা বা প্রতিবেদন খুঁজুন...' : 'Search by area or report...'}
              className="w-full pl-10 pr-11 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:border-ui-accent rounded-[var(--radius-control)] text-[var(--type-fixed-14)] text-ui-content-primary placeholder:text-ui-content-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus min-h-[44px]"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} aria-label={language === 'bn' ? 'অনুসন্ধান মুছুন' : 'Clear search'} className="absolute right-0.5 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-ui-content-muted hover:text-ui-content-primary rounded-[var(--radius-control)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus">
                <MapIcon name="close" size="xs" ariaHidden={true} />
              </button>
            )}
          </div>`;
const sharedDesktopSearch = `          <div className="w-[240px] lg:w-[280px] shrink-0">
            <SearchInput
              id="explore-desktop-search"
              value={searchQuery}
              onChange={setSearchQuery}
              language={language}
              ariaLabel={language === 'bn' ? 'এলাকা বা প্রতিবেদন খুঁজুন' : 'Search by area or report'}
              placeholder={language === 'bn' ? 'এলাকা বা প্রতিবেদন খুঁজুন...' : 'Search by area or report...'}
            />
          </div>`;
replaceOnce(desktopSearch, sharedDesktopSearch, 'desktop shared search');

const categoryStartMarker = '        {/* Desktop Category Filter Chips */}';
const categoryEndMarker = "\n\n        {selectedSection === 'harassment' && (";
const categoryStart = source.indexOf(categoryStartMarker);
if (categoryStart < 0) throw new Error('Missing Explore desktop category rail start');
const categoryEnd = source.indexOf(categoryEndMarker, categoryStart);
if (categoryEnd < 0) throw new Error('Missing Explore desktop category rail end');
const sharedCategoryRail = `        {/* Desktop Category Filter Chips */}
        <div className="hidden md:block pt-0.5">
          <HorizontalScrollRail
            ariaLabel={language === 'bn' ? 'প্রতিবেদনের বিষয়' : 'Report topics'}
            previousLabel={language === 'bn' ? 'আগের বিষয়গুলো দেখুন' : 'Show previous topics'}
            nextLabel={language === 'bn' ? 'পরের বিষয়গুলো দেখুন' : 'Show more topics'}
          >
            <Button
              type="button"
              size="sm"
              variant={selectedSection === 'all' ? 'primary' : 'secondary'}
              aria-pressed={selectedSection === 'all'}
              onClick={() => setSelectedSection('all')}
              className="shrink-0"
            >
              {language === 'bn' ? 'সব' : 'All'}
            </Button>

            {CATEGORY_KEYS.map((sectionKey) => {
              const section = SECTIONS[sectionKey];
              const selected = selectedSection === sectionKey;
              return (
                <button
                  type="button"
                  key={sectionKey}
                  aria-pressed={selected}
                  onClick={() => setSelectedSection(sectionKey)}
                  className={
                    'px-3.5 py-2 rounded-[var(--radius-control)] type-label shrink-0 cursor-pointer border transition-all flex items-center gap-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ' +
                    (selected
                      ? 'shadow-[var(--elevation-xs)] ring-1'
                      : 'bg-ui-surface border-ui-stroke-subtle text-ui-content-secondary hover:text-ui-content-primary')
                  }
                  style={selected ? {
                    backgroundColor: \`var(--sec-\${sectionKey}-bg)\`,
                    color: \`var(--sec-\${sectionKey}-text)\`,
                    borderColor: \`var(--sec-\${sectionKey}-border)\`,
                    ['--tw-ring-color' as any]: \`var(--sec-\${sectionKey}-border)\`,
                  } : undefined}
                >
                  <CategoryIcon section={sectionKey} size="xs" />
                  <span>{language === 'bn' ? section.shortNameBn : section.shortNameEn}</span>
                </button>
              );
            })}
          </HorizontalScrollRail>
        </div>`;
source = source.slice(0, categoryStart) + sharedCategoryRail + source.slice(categoryEnd);

const mobileSearchStart = '          {/* Mobile Keyword Search */}\n          <div className="flex-1 relative flex items-center min-w-0">';
const mobileSearchEndMarker = '\n\n          {/* Mobile Filter Button */}';
const mobileStart = source.indexOf(mobileSearchStart);
if (mobileStart < 0) throw new Error('Missing Explore mobile search start');
const mobileEnd = source.indexOf(mobileSearchEndMarker, mobileStart);
if (mobileEnd < 0) throw new Error('Missing Explore mobile search end');
const sharedMobileSearch = `          {/* Mobile Keyword Search */}
          <div className="flex-1 min-w-0">
            <SearchInput
              id="explore-mobile-search"
              value={searchQuery}
              onChange={setSearchQuery}
              language={language}
              ariaLabel={language === 'bn' ? 'এলাকা বা প্রতিবেদন খুঁজুন' : 'Search by area or report'}
              placeholder={language === 'bn' ? 'এলাকা বা প্রতিবেদন খুঁজুন...' : 'Search by area or report...'}
            />
          </div>`;
source = source.slice(0, mobileStart) + sharedMobileSearch + source.slice(mobileEnd);

replaceOnce(
`          <button
            type="button"
            onClick={loadData}
            className="btn-primary-action px-4 py-2 rounded-[var(--radius-control)] text-[var(--type-fixed-14)] font-[var(--font-weight-semibold)] min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus cursor-pointer"
          >
            {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
          </button>`,
`          <Button type="button" variant="primary" size="md" onClick={loadData}>
            {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
          </Button>`,
'explore retry button'
);

replaceOnce(
`                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn-primary-action px-4 py-2.5 rounded-[var(--radius-control)] text-[var(--type-fixed-14)] font-[var(--font-weight-semibold)] min-h-[44px] cursor-pointer inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shadow-[var(--elevation-xs)]"
                  >
                    {language === 'bn' ? 'সব ফিল্টার মুছুন' : 'Clear all filters'}
                  </button>`,
`                  <Button type="button" variant="primary" size="md" onClick={handleResetFilters}>
                    {language === 'bn' ? 'সব ফিল্টার মুছুন' : 'Clear all filters'}
                  </Button>`,
'zero-result clear filters button'
);

replaceOnce(
`            <button
              type="button"
              onClick={handleApplyFilterSheet}
              className="btn-primary-action px-3.5 sm:px-5 py-2.5 rounded-[var(--radius-control)] text-[var(--type-fixed-13)] sm:text-[var(--type-fixed-14)] font-[var(--font-weight-bold)] min-h-[44px] cursor-pointer flex-1 flex items-center justify-center whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shadow-[var(--elevation-xs)]"
            >
              {language === 'bn' ? 'ফিল্টার প্রয়োগ করুন' : 'Apply filters'}
            </button>`,
`            <Button type="button" variant="primary" size="md" onClick={handleApplyFilterSheet} className="flex-1">
              {language === 'bn' ? 'ফিল্টার প্রয়োগ করুন' : 'Apply filters'}
            </Button>`,
'mobile filter apply button'
);

replaceOnce(
`          <button
            type="button"
            onClick={() => {
              setViewMode('reports');
              setIsAreaSheetOpen(false);
            }}
            className="btn-primary-action w-full py-2.5 px-4 rounded-[var(--radius-control)] text-[var(--type-fixed-14)] font-[var(--font-weight-bold)] min-h-[44px] flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shadow-[var(--elevation-xs)]"
          >
            <MapIcon name="file-text" size="sm" ariaHidden={true} />
            <span>{language === 'bn' ? 'প্রতিবেদন দেখুন' : 'View reports'}</span>
          </button>`,
`          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            onClick={() => {
              setViewMode('reports');
              setIsAreaSheetOpen(false);
            }}
            leftIcon={<MapIcon name="file-text" size="sm" ariaHidden={true} />}
          >
            {language === 'bn' ? 'প্রতিবেদন দেখুন' : 'View reports'}
          </Button>`,
'area sheet view reports button'
);

replaceOnce(
  'className="text-[var(--type-fixed-18)] sm:text-[var(--type-fixed-19)] md:text-[var(--type-fixed-20)] font-[var(--font-weight-bold)] text-ui-content-primary tracking-tight"',
  'className="type-h2 text-ui-content-primary"',
  'detailed analysis heading'
);
replaceOnce(
  'className="text-[var(--type-fixed-125)] sm:text-[var(--type-fixed-13)] text-ui-content-secondary mt-0.5"',
  'className="type-meta text-ui-content-secondary mt-0.5"',
  'detailed analysis helper'
);

if (!source.includes('<SearchInput') || !source.includes('<HorizontalScrollRail') || !source.includes('<Button')) {
  throw new Error('Explore shared primitives were not applied');
}

fs.writeFileSync(file, source);
console.log('Explore UI uniformity codemod applied safely.');
