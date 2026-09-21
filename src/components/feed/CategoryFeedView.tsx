import React from 'react';
import { AlertCircle } from 'lucide-react';
import { SectionKey } from '../../theme/tokens';
import { ReportItem } from '../../types/report';
import { ReportCard } from '../report/ReportCard';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { FilterChip } from '../ui/FilterChip';
import { HorizontalScrollRail } from '../ui/HorizontalScrollRail';
import { ReportFeedSkeleton } from '../ui/LoadingSkeleton';
import { toBanglaDigits } from '../../utils/formatters';

type Language = 'bn' | 'en';

type SubcategoryOption = {
  id: string;
  slug?: string;
  nameBn: string;
  nameEn: string;
};

export interface CategoryFeedViewProps {
  section: SectionKey;
  language: Language;
  reports?: ReportItem[];
  filteredReports: ReportItem[];
  isLoading: boolean;
  fetchError: string | null;
  onRetry: () => void;
  onEmptyAction: () => void;
  emptyActionLabel?: string;
  emptyDescription?: string;
  selectedSubcategory?: string;
  subcategories?: SubcategoryOption[];
  onSelectSubcategory?: (id: string) => void;
  getSubcategoryHref?: (id: string) => string | undefined;
  countForSubcategory?: (id: string) => number;
  idPrefix: string;
  showDesktopFilterSlot?: boolean;
}

export const CategoryFeedView: React.FC<CategoryFeedViewProps> = ({
  section,
  language,
  filteredReports,
  isLoading,
  fetchError,
  onRetry,
  onEmptyAction,
  emptyActionLabel,
  emptyDescription,
  selectedSubcategory = 'all',
  subcategories = [],
  onSelectSubcategory,
  getSubcategoryHref,
  countForSubcategory,
  idPrefix,
  showDesktopFilterSlot = true,
}) => {
  const hasSubcategories = subcategories.length > 0 && Boolean(onSelectSubcategory);

  return (
    <>
      <section id={`${idPrefix}-filter-section`} className="space-y-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3 border-b border-ui-stroke-subtle pb-3">
          <div className="min-w-0 flex-1">
            <h2 className="type-h2 text-ui-content-primary">
              {language === 'bn' ? 'সকল প্রতিবেদন' : 'All reports'}
            </h2>
            <p className="type-meta text-ui-content-muted mt-0.5">
              {language === 'bn'
                ? `${toBanglaDigits(filteredReports.length)}টি প্রকাশিত প্রতিবেদন`
                : `${filteredReports.length} published reports`}
            </p>
          </div>

          {showDesktopFilterSlot && (
            <div
              id="desktop-category-filter-slot"
              className="hidden md:flex shrink-0 items-center"
            />
          )}
        </div>

        {hasSubcategories && (
          <HorizontalScrollRail
            id={`${idPrefix}-subcategory-rail`}
            ariaLabel={language === 'bn' ? 'প্রতিবেদনের উপবিভাগ' : 'Report subcategories'}
            previousLabel={language === 'bn' ? 'আগের বিভাগগুলো দেখুন' : 'Show previous categories'}
            nextLabel={language === 'bn' ? 'পরের বিভাগগুলো দেখুন' : 'Show more categories'}
          >
            {subcategories.map((subcat) => {
              const stableSlug = (subcat.slug || subcat.id.replace(/_/g, '-')).replace(/^\/+/, '');
              const automaticHref =
                subcat.id === 'all'
                  ? undefined
                  : language === 'en'
                    ? `/en/topic/${encodeURIComponent(stableSlug)}`
                    : `/topic/${encodeURIComponent(stableSlug)}`;
              const href = getSubcategoryHref?.(subcat.id) ?? automaticHref;
              return (
                <FilterChip
                  key={subcat.id}
                  id={`${idPrefix}-filter-subcat-${subcat.id}`}
                  label={language === 'bn' ? subcat.nameBn : subcat.nameEn}
                  section={section}
                  selected={selectedSubcategory === subcat.id}
                  count={isLoading ? undefined : countForSubcategory?.(subcat.id)}
                  to={href}
                  onClick={href ? undefined : () => onSelectSubcategory?.(subcat.id)}
                />
              );
            })}
          </HorizontalScrollRail>
        )}
      </section>

      {isLoading && (
        <ReportFeedSkeleton
          count={3}
          id={`${idPrefix}-feed-skeleton`}
          ariaLabel={language === 'bn' ? 'প্রতিবেদন লোড হচ্ছে...' : 'Loading reports...'}
        />
      )}

      {!isLoading && fetchError && (
        <div
          role="alert"
          className="bg-ui-surface border border-ui-error-border rounded-[var(--radius-card)] p-6 text-center space-y-3"
        >
          <AlertCircle className="w-6 h-6 text-ui-error-text mx-auto" aria-hidden="true" />
          <p className="type-body font-[var(--font-weight-semibold)] text-ui-error-text">
            {language === 'bn' ? 'প্রতিবেদন লোড করা যায়নি।' : "Couldn't load reports."}
          </p>
          <Button type="button" variant="primary" size="md" onClick={onRetry}>
            {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
          </Button>
        </div>
      )}

      {!isLoading && !fetchError && (
        <div className="space-y-3">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => <ReportCard key={report.id} report={report} />)
          ) : (
            <EmptyState
              title={language === 'bn' ? 'কোনো প্রতিবেদন পাওয়া যায়নি' : 'No reports found'}
              description={
                emptyDescription ||
                (language === 'bn'
                  ? 'এই ফিল্টারগুলোর জন্য বর্তমানে কোনো প্রকাশিত প্রতিবেদন নেই।'
                  : 'There are currently no published reports for these filters.')
              }
              actionLabel={
                emptyActionLabel || (language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset filters')
              }
              onAction={onEmptyAction}
            />
          )}
        </div>
      )}
    </>
  );
};
