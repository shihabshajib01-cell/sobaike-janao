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
`                    <button
                      type="button"
                      onClick={() => {
                        setIsFilterSheetOpen(false);
                        setIsAreaSheetOpen(true);
                      }}
                      aria-expanded={isAreaSheetOpen}
                      aria-controls="mobile-area-sheet"
                      aria-label={
                        language === 'bn'
                          ? \`${activeDistrictName || selectedDistrict} এলাকার বিস্তারিত দেখুন\`
                          : \`View details for ${activeDistrictName || selectedDistrict}\`
                      }
                      className="btn-primary-action px-3.5 py-2.5 rounded-[var(--radius-control)] text-[var(--type-fixed-13)] font-[var(--font-weight-semibold)] min-h-[44px] w-full sm:w-auto flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shadow-[var(--elevation-2xs)]"
                    >
                      <span>{language === 'bn' ? 'এলাকার বিস্তারিত' : 'Area details'}</span>
                      <MapIcon name="arrow-right" size="xs" ariaHidden={true} />
                    </button>`,
`                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => {
                        setIsFilterSheetOpen(false);
                        setIsAreaSheetOpen(true);
                      }}
                      aria-expanded={isAreaSheetOpen}
                      aria-controls="mobile-area-sheet"
                      aria-label={
                        language === 'bn'
                          ? \`${activeDistrictName || selectedDistrict} এলাকার বিস্তারিত দেখুন\`
                          : \`View details for ${activeDistrictName || selectedDistrict}\`
                      }
                      rightIcon={<MapIcon name="arrow-right" size="xs" ariaHidden={true} />}
                      className="w-full sm:w-auto shrink-0"
                    >
                      {language === 'bn' ? 'এলাকার বিস্তারিত' : 'Area details'}
                    </Button>`,
'mobile area details action'
);

replaceOnce(
`            <button
              type="button"
              onClick={handleClearFilterSheet}
              className="px-3 sm:px-4 py-2.5 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface text-[var(--type-fixed-13)] sm:text-[var(--type-fixed-14)] font-[var(--font-weight-semibold)] text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface-subtle transition-colors min-h-[44px] cursor-pointer shrink-0 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            >
              {language === 'bn' ? 'ফিল্টার মুছুন' : 'Clear filters'}
            </button>`,
`            <Button type="button" variant="secondary" size="md" onClick={handleClearFilterSheet} className="shrink-0">
              {language === 'bn' ? 'ফিল্টার মুছুন' : 'Clear filters'}
            </Button>`,
'mobile filter clear action'
);

if (!source.includes('<SearchInput') || !source.includes('<HorizontalScrollRail') || !source.includes('<Button')) {
  throw new Error('Explore shared primitives are missing');
}
if (source.includes('btn-primary-action')) {
  throw new Error('Explore still contains duplicated primary action styling');
}

fs.writeFileSync(file, source);
console.log('Explore action consolidation applied safely.');
