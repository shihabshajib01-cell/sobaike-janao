import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

const emptyCounts = (keys: SectionKey[] = CATEGORY_ORDER) =>
  Object.fromEntries(keys.map((key) => [key, 0])) as Record<string, number>;

export const IssuesPage: React.FC = () => {
  const { language } = useApp();
  const { segments } = useTaxonomy();
  const localizePath = (path: string) =>
    language === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path;
  const activeKeys = useMemo(
    () =>
      Object.values(segments)
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
        .map((segment) => segment.id as SectionKey),
    [segments]
  );
  const [categoryOrder, setCategoryOrder] = useState<SectionKey[]>(CATEGORY_ORDER);
  const [metrics, setMetrics] = useState<CategoryPopularityMetric[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>(emptyCounts());
  const [isLoading, setIsLoading] = useState(true);
  const [hasCountError, setHasCountError] = useState(false);

  const loadPopularity = useCallback(async () => {
    setIsLoading(true);
    setHasCountError(false);
    try {
      CategoryPopularityService.clearCache();
      const ranking = await CategoryPopularityService.getRanking();
      const ordered = await CategoryPopularityService.getOrderedCategoryKeys();
      const nextCounts = emptyCounts(activeKeys);
      ranking.forEach((item) => {
        nextCounts[item.segmentId] = item.publishedPostCount;
      });
      setMetrics(ranking);
      setCounts(nextCounts);
      setCategoryOrder(ordered);
    } catch (error) {
      console.warn('[IssuesPage popularity load error]', error);
      setHasCountError(true);
      setCategoryOrder(activeKeys.length > 0 ? activeKeys : CATEGORY_ORDER);
    } finally {
      setIsLoading(false);
    }
  }, [activeKeys]);

  useEffect(() => {
    void loadPopularity();
  }, [loadPopularity]);

  const metricsByKey = useMemo(
    () => new Map(metrics.map((item) => [item.segmentId, item])),
    [metrics]
  );

  const cards = useMemo(
    () =>
      categoryOrder
        .map((key) => ({ key, config: segments[key] }))
        .filter((item) => Boolean(item.config)),
    [categoryOrder, segments]
  );

  return (
    <PublicPageContainer id="issues-page-container">
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
            <Link
              key={key}
              id={`issues-card-${key}`}
              to={localizePath(config.slug)}
              aria-label={`${language === 'bn' ? config.nameBn : config.nameEn}, ${
                language === 'bn' ? `জনপ্রিয়তার অবস্থান ${toBanglaDigits(rank)}` : `popularity rank ${rank}`
              }`}
              className="group grid min-h-[68px] grid-cols-[68px_minmax(0,1fr)] gap-2.5 text-left transition-transform active:scale-[0.99] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            >
              <div
                className="flex size-[68px] items-center justify-center rounded-[16px] border"
                style={{
                  backgroundColor: config.bgColor,
                  borderColor: config.borderColor,
                }}
              >
                <CategoryIcon
                  section={key}
                  size="lg"
                  ariaLabel={language === 'bn' ? config.nameBn : config.nameEn}
                />
              </div>

              <div className="flex min-w-0 items-center gap-3 rounded-[16px] bg-ui-surface px-3.5 py-3 transition-colors group-hover:bg-ui-surface-hover">
                <h2 className="min-w-0 flex-1 type-h4 text-ui-content-primary">
                  {language === 'bn' ? config.nameBn : config.nameEn}
                </h2>

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
            </Link>
          );
        })}
      </section>
    </PublicPageContainer>
  );
};
