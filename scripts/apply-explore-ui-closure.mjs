import fs from 'node:fs';

const file = 'src/pages/ExplorePage.tsx';
let source = fs.readFileSync(file, 'utf8');

const replaceOrThrow = (from, to, label) => {
  if (!source.includes(from)) {
    throw new Error(`Explore UI closure patch could not find: ${label}`);
  }
  source = source.replace(from, to);
};

if (!source.includes("import { FilterChip } from '../components/ui/FilterChip';")) {
  replaceOrThrow(
    "import { Button } from '../components/ui/Button';\n",
    "import { Button } from '../components/ui/Button';\nimport { FilterChip } from '../components/ui/FilterChip';\n",
    'Button import anchor'
  );
}

replaceOrThrow(
`            {CATEGORY_KEYS.map((sectionKey) => {
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
            })}`,
`            {CATEGORY_KEYS.map((sectionKey) => {
              const section = SECTIONS[sectionKey];
              return (
                <FilterChip
                  key={sectionKey}
                  label={language === 'bn' ? section.shortNameBn : section.shortNameEn}
                  section={sectionKey}
                  selected={selectedSection === sectionKey}
                  icon={<CategoryIcon section={sectionKey} size="xs" />}
                  onClick={() => setSelectedSection(sectionKey)}
                />
              );
            })}`,
  'desktop category filter buttons'
);

replaceOrThrow(
`          <button
            type="button"
            onClick={handleOpenFilterSheet}
            aria-expanded={isFilterSheetOpen}
            aria-controls="mobile-filter-sheet"
            aria-label={
              language === 'bn'
                ? \`ফিল্টার খুলুন\${mobileFilterCount > 0 ? \` (\${toBanglaDigits(mobileFilterCount)}টি সক্রিয়)\` : ''}\`
                : \`Open filters\${mobileFilterCount > 0 ? \` (\${mobileFilterCount} active)\` : ''}\`
            }
            className={\`flex items-center justify-center gap-1.5 px-3 py-2.5 sm:px-3.5 rounded-[var(--radius-control)] border text-[var(--type-fixed-14)] font-[var(--font-weight-semibold)] min-h-[44px] cursor-pointer transition-colors shrink-0 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus \${
              mobileFilterCount > 0
                ? 'bg-ui-surface-subtle border-ui-accent text-ui-content-primary shadow-[var(--elevation-2xs)] font-[var(--font-weight-bold)]'
                : 'bg-ui-surface border-ui-stroke-subtle text-ui-content-secondary hover:text-ui-content-primary'
            }\`}
          >
            <MapIcon name="filter" size="sm" ariaHidden={true} />
            <span>{language === 'bn' ? 'ফিল্টার' : 'Filters'}</span>
            {mobileFilterCount > 0 && (
              <span className="w-5 h-5 rounded-[var(--radius-pill)] bg-ui-accent text-ui-action-text text-[var(--type-fixed-11)] font-[var(--font-weight-bold)] flex items-center justify-center">
                {language === 'bn' ? toBanglaDigits(mobileFilterCount) : mobileFilterCount}
              </span>
            )}
          </button>`,
`          <Button
            id="explore-mobile-filter-button"
            type="button"
            variant={mobileFilterCount > 0 ? 'secondary' : 'outline'}
            size="md"
            onClick={handleOpenFilterSheet}
            aria-expanded={isFilterSheetOpen}
            aria-controls="mobile-filter-sheet"
            aria-label={
              language === 'bn'
                ? \`ফিল্টার খুলুন\${mobileFilterCount > 0 ? \` (\${toBanglaDigits(mobileFilterCount)}টি সক্রিয়)\` : ''}\`
                : \`Open filters\${mobileFilterCount > 0 ? \` (\${mobileFilterCount} active)\` : ''}\`
            }
            leftIcon={<MapIcon name="filter" size="sm" ariaHidden={true} />}
            rightIcon={
              mobileFilterCount > 0 ? (
                <span className="w-5 h-5 ui-radius-pill bg-ui-accent text-ui-action-text type-meta font-[var(--font-weight-bold)] flex items-center justify-center">
                  {language === 'bn' ? toBanglaDigits(mobileFilterCount) : mobileFilterCount}
                </span>
              ) : undefined
            }
            className={\`shrink-0 whitespace-nowrap \${
              mobileFilterCount > 0 ? 'border-ui-accent font-[var(--font-weight-bold)]' : ''
            }\`}
          >
            {language === 'bn' ? 'ফিল্টার' : 'Filters'}
          </Button>`,
  'mobile filter action'
);

const semanticReplacements = [
  ['text-[var(--type-fixed-11)]', 'type-meta'],
  ['text-[var(--type-fixed-12)]', 'type-meta'],
  ['text-[var(--type-fixed-13)]', 'type-meta'],
  ['text-[var(--type-fixed-14)]', 'type-meta'],
  ['text-[var(--type-fixed-15)]', 'type-label'],
  ['text-[var(--type-fixed-16)]', 'type-body'],
  ['rounded-[var(--radius-card)]', 'ui-radius-card'],
  ['rounded-[var(--radius-control)]', 'ui-radius-control'],
  ['rounded-[var(--radius-badge-md)]', 'ui-radius-badge-md'],
  ['rounded-[var(--radius-badge-sm)]', 'ui-radius-badge-sm'],
  ['rounded-[var(--radius-pill)]', 'ui-radius-pill'],
];

for (const [from, to] of semanticReplacements) {
  source = source.split(from).join(to);
}

if (source.includes('--type-fixed-')) {
  throw new Error('Explore UI closure left legacy fixed typography aliases behind');
}

fs.writeFileSync(file, source);
console.log('Explore UI closure patch applied.');
