import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { CategoryIcon } from '../components/branding/CategoryIcon';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { useApp } from '../context/AppContext';
import { CATEGORY_ORDER } from '../data/categoryOrder';
import {
  CategoryPopularityMetric,
  CategoryPopularityService,
} from '../services/categoryPopularityService';
import { useTaxonomy } from '../services/taxonomyService';
import { SectionKey } from '../theme/tokens';
import { toBanglaDigits } from '../utils/formatters';

const emptyCounts = () =>
  Object.fromEntries(CATEGORY_ORDER.map((key) => [key, 0])) as Record<SectionKey, number>;

export const IssuesPage: React.FC = () => {
  const { language, navigateTo } = useApp();
  const { getSegment } = useTaxonomy();
  const [categoryOrder, setCategoryOrder] = useState<SectionKey[]>(CATEGORY_ORDER);
  const [metrics, setMetrics] = useState<CategoryPopularityMetric[]>([]);
  const [counts, setCounts] = useState<Record<SectionKey, number>>(emptyCounts);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCountError, setHasCountError] = useState(false);

  const loadPopularity = useCallback(async () => {
    setIsLoading(true);
    setHasCountError(false);
    try {
      CategoryPopularityService.clearCache();
      const ranking = await CategoryPopularityService.getRanking();
      const ordered = await CategoryPopularityService.getOrderedCategoryKeys();
      const nextCounts = emptyCounts();
      ranking.forEach((item) => {
        nextCounts[item.segmentId] = item.publishedPostCount;
      });
      setMetrics(ranking);
      setCounts(nextCounts);
      setCategoryOrder(ordered);
    } catch (error) {
      console.warn('[IssuesPage popularity load error]', error);
      setHasCountError(true);
      setCategoryOrder(CATEGORY_ORDER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPopularity();
  }, [loadPopularity]);

  const metricsByKey = useMemo(
    () => new Map(metrics.map((item) => [item.segmentId, item])),
    [metrics]
  );

  const cards = useMemo(
    () => categoryOrder.map((key) => ({ key, config: getSegment(key) })),
    [categoryOrder, getSegment]
  );

  return (
    <PublicPageContainer id="issues-page-container" className="md:hidden">
      <section aria-labelledby="issues-page-title" className="space-y-1">
        <h1 id="issues-page-title" className="type-h1 text-ui-content-primary">
          {language === 'bn' ? 'বিষয়সমূহ' : 'Issues'}
        </h1>
        <p className="type-body text-ui-content-secondary">
          {language === 'bn'
            ? 'জনপ্রিয় বিষয় আগে দেখানো হচ্ছে। বিষয় বেছে প্রকাশিত প্রতিবেদন দেখুন।'
            : 'Popular issues appear first. Choose an issue to browse published reports.'}
        </p>
      </section>

      {hasCountError && (
        <button
          type="button"
          onClick={loadPopularity}
          className="flex w-full min-h-[44px] items-center gap-2 ui-radius-control border border-ui-warning-border bg-ui-warning-bg px-3 py-2.5 text-left type-helper font-[var(--font-weight-medium)] text-ui-warning-text cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {language === 'bn'
              ? 'জনপ্রিয়তার তথ্য পাওয়া যায়নি। স্থির ক্রম দেখানো হচ্ছে। আবার চেষ্টা করতে ট্যাপ করুন।'
              : 'Popularity data is unavailable. Stable order is shown. Tap to retry.'}
          </span>
        </button>
      )}

      <section
        id="issues-category-grid"
        aria-label={language === 'bn' ? 'অভিযোগের বিষয়সমূহ' : 'Issue categories'}
        className="grid grid-cols-1 gap-2.5"
      >
        {cards.map(({ key, config }) => {
          const metric = metricsByKey.get(key);
          const displayCount = language === 'bn' ? toBanglaDigits(counts[key]) : counts[key];
          const rank = metric?.popularityRank || categoryOrder.indexOf(key) + 1;
          return (
            <button
              key={key}
              id={`issues-card-${key}`}
              type="button"
              onClick={() => navigateTo(config.slug)}
              aria-label={`${language === 'bn' ? config.nameBn : config.nameEn}, ${
                language === 'bn' ? `জনপ্রিয়তার অবস্থান ${toBanglaDigits(rank)}` : `popularity rank ${rank}`
              }`}
              className="min-h-[84px] ui-card px-3.5 py-3 text-left transition-all hover:bg-ui-surface-hover active:scale-[0.99] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              style={{ borderColor: `var(--sec-${key}-border)` }}
            >
              <div className="flex items-center gap-3">
                <CategoryIcon
                  section={key}
                  size="md"
                  withContainer
                  ariaLabel={language === 'bn' ? config.nameBn : config.nameEn}
                />

                <h4 className="min-w-0 flex-1 type-h4 text-ui-content-primary">
                  {language === 'bn' ? config.nameBn : config.nameEn}
                </h4>

                <p className="shrink-0 text-right type-meta font-[var(--font-weight-medium)] text-ui-content-secondary">
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
