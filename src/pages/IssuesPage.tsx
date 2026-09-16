import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { CategoryIcon } from '../components/branding/CategoryIcon';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { useApp } from '../context/AppContext';
import { PublicReportService } from '../services/publicReportService';
import { SectionKey, SECTIONS } from '../theme/tokens';
import { toBanglaDigits } from '../utils/formatters';

const CATEGORY_KEYS = Object.keys(SECTIONS) as SectionKey[];

export const IssuesPage: React.FC = () => {
  const { language, navigateTo } = useApp();
  const [counts, setCounts] = useState<Record<SectionKey, number>>(() =>
    Object.fromEntries(CATEGORY_KEYS.map((key) => [key, 0])) as Record<SectionKey, number>
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasCountError, setHasCountError] = useState(false);

  const loadCounts = useCallback(async () => {
    setIsLoading(true);
    setHasCountError(false);
    try {
      const reports = await PublicReportService.getAll();
      const nextCounts = Object.fromEntries(
        CATEGORY_KEYS.map((key) => [key, reports.filter((report) => report.segment === key).length])
      ) as Record<SectionKey, number>;
      setCounts(nextCounts);
    } catch (error) {
      console.warn('[IssuesPage count load error]', error);
      setHasCountError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const cards = useMemo(
    () => CATEGORY_KEYS.map((key) => ({ key, config: SECTIONS[key] })),
    []
  );

  return (
    <PublicPageContainer id="issues-page-container" className="md:hidden">
      <section aria-labelledby="issues-page-title" className="space-y-1">
        <h1 id="issues-page-title" className="text-[var(--type-fixed-24)] font-bold leading-tight text-ui-content-primary">
          {language === 'bn' ? 'বিষয়সমূহ' : 'Issues'}
        </h1>
        <p className="text-[var(--type-fixed-14)] leading-relaxed text-ui-content-secondary">
          {language === 'bn'
            ? 'বিষয় বেছে প্রকাশিত প্রতিবেদন দেখুন।'
            : 'Choose an issue to browse published reports.'}
        </p>
      </section>

      {hasCountError && (
        <button
          type="button"
          onClick={loadCounts}
          className="flex w-full items-center gap-2 rounded-[var(--radius-control)] border border-ui-warning-border bg-ui-warning-bg px-3 py-2.5 text-left text-[var(--type-fixed-13)] font-medium text-ui-warning-text cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {language === 'bn'
              ? 'প্রতিবেদন সংখ্যা পাওয়া যায়নি। আবার চেষ্টা করতে ট্যাপ করুন।'
              : 'Report counts are unavailable. Tap to retry.'}
          </span>
        </button>
      )}

      <section
        id="issues-category-grid"
        aria-label={language === 'bn' ? 'অভিযোগের বিষয়সমূহ' : 'Issue categories'}
        className="grid grid-cols-1 gap-2.5"
      >
        {cards.map(({ key, config }) => {
          const displayCount = language === 'bn' ? toBanglaDigits(counts[key]) : counts[key];
          return (
            <button
              key={key}
              id={`issues-card-${key}`}
              type="button"
              onClick={() => navigateTo(config.slug)}
              className="min-h-[84px] rounded-[var(--radius-card)] border bg-ui-surface px-3.5 py-3 text-left shadow-[var(--elevation-2xs)] transition-all hover:bg-ui-surface-hover active:scale-[0.99] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              style={{ borderColor: `var(--sec-${key}-border)` }}
            >
              <div className="flex items-center gap-3">
                <CategoryIcon
                  section={key}
                  size="md"
                  withContainer
                  ariaLabel={language === 'bn' ? config.nameBn : config.nameEn}
                />

                <h2 className="min-w-0 flex-1 text-[var(--type-fixed-15)] font-bold leading-snug text-ui-content-primary">
                  {language === 'bn' ? config.nameBn : config.nameEn}
                </h2>

                <p className="shrink-0 text-right text-[var(--type-fixed-125)] font-medium text-ui-content-secondary">
                  {isLoading
                    ? language === 'bn'
                      ? 'গণনা হচ্ছে...'
                      : 'Counting...'
                    : language === 'bn'
                    ? `${displayCount}টি প্রতিবেদন`
                    : `${displayCount} reports`}
                </p>
              </div>
            </button>
          );
        })}
      </section>
    </PublicPageContainer>
  );
};
