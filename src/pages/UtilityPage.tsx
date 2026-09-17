import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { SECTIONS } from '../theme/tokens';
import { PublicReportService } from '../services/publicReportService';
import { useTaxonomy } from '../services/taxonomyService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { MobileCategoryFilterPortal } from '../components/feed/MobileCategoryFilterPortal';
import { FilterChip } from '../components/ui/FilterChip';
import { EmptyState } from '../components/ui/EmptyState';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { CategoryHeroSlider } from '../components/category/CategoryHeroSlider';
import { CategoryFilterSheet } from '../components/report/CategoryFilterSheet';
import { useApp } from '../context/AppContext';
import { VisitorSessionService } from '../services/visitorSessionService';
import { CANONICAL_BANNER_CONTENT } from '../data/bannerContent';
import {
  CategoryFeedFilterState,
  EMPTY_CATEGORY_FEED_FILTERS,
  matchesCategoryFeedFilters,
} from '../data/categoryFeedFilters';

export const UtilityPage: React.FC = () => {
  const { language, openReportComposer, browseLocation, browseLocationStatus } = useApp();
  const { getFeedSubcategories, getSegment } = useTaxonomy();
  const config = getSegment('load_shedding') || SECTIONS.load_shedding;
  const bannerContent = CANONICAL_BANNER_CONTENT.load_shedding;

  const [selectedSubcat, setSelectedSubcat] = useState<string>('all');
  const [feedFilters, setFeedFilters] = useState<CategoryFeedFilterState>({
    ...EMPTY_CATEGORY_FEED_FILTERS,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const subcategories = getFeedSubcategories('load_shedding');

  const hasValidBrowseLocation =
    browseLocationStatus === 'available' &&
    browseLocation !== null &&
    typeof browseLocation.latitude === 'number' &&
    typeof browseLocation.longitude === 'number' &&
    VisitorSessionService.isLocationFresh(browseLocation);

  const visitorLat = hasValidBrowseLocation ? browseLocation.latitude : null;
  const visitorLng = hasValidBrowseLocation ? browseLocation.longitude : null;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await PublicReportService.getBySegment('load_shedding', {
        visitorLat,
        visitorLng,
      });
      setReports(data);
    } catch (err) {
      console.warn('[UtilityPage load error]', err);
      setFetchError('LOAD_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, [visitorLat, visitorLng]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (report.segment !== 'load_shedding') return false;
      const matchesSubcat = selectedSubcat === 'all' || report.subcategoryId === selectedSubcat;
      return matchesSubcat && matchesCategoryFeedFilters(report, 'load_shedding', feedFilters);
    });
  }, [reports, selectedSubcat, feedFilters]);

  const hasActiveFeedFilters =
    feedFilters.divisionId !== 'all' ||
    feedFilters.districtId !== 'all' ||
    feedFilters.incidentPeriod !== 'all' ||
    feedFilters.evidence !== 'all' ||
    feedFilters.utilityBillTrend !== 'all';

  return (
    <PublicPageContainer id="utility-page-container">
      <MobileCategoryFilterPortal
        language={language}
        onOpen={() => setIsFilterOpen(true)}
      />

      <CategoryHeroSlider
        id="utility-header-banner"
        section="load_shedding"
        slides={[
          {
            id: 'utility-primary',
            titleBn: bannerContent.titleBn,
            titleEn: bannerContent.titleEn,
            mobileDescriptionBn: bannerContent.mobileDescriptionBn,
            mobileDescriptionEn: bannerContent.mobileDescriptionEn,
            descriptionBn: bannerContent.tabletDescriptionBn,
            descriptionEn: bannerContent.tabletDescriptionEn,
            desktopDescriptionBn: bannerContent.desktopDescriptionBn,
            desktopDescriptionEn: bannerContent.desktopDescriptionEn,
            illustrationSrc: bannerContent.illustrationSrc,
            action: {
              labelBn: bannerContent.primaryCtaBn,
              labelEn: bannerContent.primaryCtaEn,
              onClick: () => openReportComposer('load_shedding'),
            },
          },
        ]}
      />

      <div className="flex items-center gap-2 text-[var(--type-fixed-13)] sm:text-[var(--type-fixed-14)] text-ui-content-secondary bg-ui-surface-subtle border border-ui-stroke-subtle rounded-[var(--radius-control)] px-3 sm:px-3.5 py-2 sm:py-2.5 text-left">
        <Info className="w-4 h-4 text-ui-content-muted shrink-0" aria-hidden="true" />
        <span>
          {language === 'bn'
            ? 'লোডশেডিং, গ্যাস সংকট বা অতিরিক্ত বিদ্যুৎ বিল সংক্রান্ত প্রতিবেদন জমা দিন।'
            : 'Report load shedding, gas shortages, or excess electricity bills responsibly.'}
        </span>
      </div>

      <section id="utility-filter-section" className="space-y-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3 border-b border-ui-stroke-subtle pb-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[var(--type-fixed-18)] sm:text-[var(--type-fixed-20)] font-[var(--font-weight-bold)] leading-[var(--type-line-ratio-130)] text-ui-content-primary">
              {language === 'bn' ? 'সকল প্রতিবেদন' : 'All reports'}
            </h2>
            <p className="text-[var(--type-fixed-14)] text-ui-content-muted mt-0.5">
              {language === 'bn'
                ? `${filteredReports.length}টি প্রকাশিত প্রতিবেদন`
                : `${filteredReports.length} published reports`}
            </p>
          </div>

          <div
            id="desktop-category-filter-slot"
            className="hidden md:flex shrink-0 items-center"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {subcategories.map((subcat) => {
            const count = reports.filter((report) => {
              if (report.segment !== 'load_shedding') return false;
              const matchesSub = subcat.id === 'all' || report.subcategoryId === subcat.id;
              return matchesSub && matchesCategoryFeedFilters(report, 'load_shedding', feedFilters);
            }).length;

            return (
              <FilterChip
                key={subcat.id}
                id={`filter-subcat-${subcat.id}`}
                label={language === 'bn' ? subcat.nameBn : subcat.nameEn}
                section="load_shedding"
                selected={selectedSubcat === subcat.id}
                count={isLoading ? undefined : count}
                onClick={() => setSelectedSubcat(subcat.id)}
              />
            );
          })}
        </div>
      </section>

      {isLoading && (
        <ReportFeedSkeleton
          count={3}
          id="utility-feed-skeleton"
          ariaLabel={language === 'bn' ? 'প্রতিবেদন লোড হচ্ছে...' : 'Loading reports...'}
        />
      )}

      {!isLoading && fetchError && (
        <div role="alert" className="bg-ui-surface border border-ui-error-border rounded-[var(--radius-card)] p-6 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-ui-error-text mx-auto" aria-hidden="true" />
          <p className="text-[var(--type-fixed-16)] font-[var(--font-weight-semibold)] text-ui-error-text">
            {language === 'bn' ? 'প্রতিবেদন লোড করা যায়নি।' : "Couldn't load reports."}
          </p>
          <button
            type="button"
            onClick={loadData}
            className="btn-primary-action px-4 py-2 text-[var(--type-fixed-16)] font-[var(--font-weight-semibold)] rounded-[var(--radius-control)] min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus cursor-pointer"
          >
            {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
          </button>
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
                hasActiveFeedFilters || selectedSubcat !== 'all'
                  ? language === 'bn'
                    ? 'এই ফিল্টারগুলোর জন্য বর্তমানে কোনো প্রকাশিত প্রতিবেদন নেই।'
                    : 'There are currently no published reports for these filters.'
                  : language === 'bn'
                  ? 'এই মুহূর্তে ইউটিলিটি সেবা সংক্রান্ত কোনো প্রকাশিত প্রতিবেদন নেই। নতুন প্রতিবেদন জমা দিতে নিচের বোতামটি ব্যবহার করুন।'
                  : 'No utility reports have been published yet. Use the button below to submit a report.'
              }
              actionLabel={
                hasActiveFeedFilters || selectedSubcat !== 'all'
                  ? language === 'bn'
                    ? 'ফিল্টার রিসেট করুন'
                    : 'Reset filters'
                  : language === 'bn'
                  ? 'প্রতিবেদন জমা দিন'
                  : 'Submit report'
              }
              onAction={
                hasActiveFeedFilters || selectedSubcat !== 'all'
                  ? () => {
                      setSelectedSubcat('all');
                      setFeedFilters({ ...EMPTY_CATEGORY_FEED_FILTERS });
                    }
                  : () => openReportComposer('load_shedding')
              }
            />
          )}
        </div>
      )}

      <CategoryFilterSheet
        section="load_shedding"
        isOpen={isFilterOpen}
        language={language}
        value={feedFilters}
        onClose={() => setIsFilterOpen(false)}
        onApply={(next) => {
          setFeedFilters(next);
          setIsFilterOpen(false);
        }}
      />
    </PublicPageContainer>
  );
};
