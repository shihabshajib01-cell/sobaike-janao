import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { SECTIONS } from '../theme/tokens';
import { PublicReportService } from '../services/publicReportService';
import { useTaxonomy } from '../services/taxonomyService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { LocationSelector } from '../components/feed/LocationSelector';
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

export const ExtortionPage: React.FC = () => {
  const { language, openReportComposer, browseLocation, browseLocationStatus } = useApp();
  const { getFeedSubcategories, getSegment } = useTaxonomy();
  const config = getSegment('extortion') || SECTIONS.extortion;
  const bannerContent = CANONICAL_BANNER_CONTENT.extortion;

  const [selectedSubcat, setSelectedSubcat] = useState<string>('all');
  const [feedFilters, setFeedFilters] = useState<CategoryFeedFilterState>({
    ...EMPTY_CATEGORY_FEED_FILTERS,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const subcategories = getFeedSubcategories('extortion');

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
      const data = await PublicReportService.getBySegment('extortion', {
        visitorLat,
        visitorLng,
      });
      setReports(data);
    } catch (err) {
      console.warn('[ExtortionPage load error]', err);
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
      if (report.segment !== 'extortion') return false;
      const matchesSubcat = selectedSubcat === 'all' || report.subcategoryId === selectedSubcat;
      return matchesSubcat && matchesCategoryFeedFilters(report, 'extortion', feedFilters);
    });
  }, [reports, selectedSubcat, feedFilters]);

  const handleDesktopDistrictChange = (districtId: string) => {
    setFeedFilters((current) => ({
      ...current,
      divisionId: 'all',
      districtId,
    }));
  };

  return (
    <PublicPageContainer id="extortion-page-container">
      <MobileCategoryFilterPortal
        language={language}
        onOpen={() => setIsFilterOpen(true)}
      />

      <CategoryHeroSlider
        id="extortion-header-banner"
        section="extortion"
        slides={[
          {
            id: 'extortion-primary',
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
              onClick: () => openReportComposer('extortion'),
            },
          },
        ]}
      />

      <section id="extortion-filter-section" className="space-y-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3 border-b border-ui-stroke-subtle pb-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] sm:text-[20px] font-bold leading-[1.3] text-ui-content-primary">
              {language === 'bn' ? 'সকল প্রতিবেদন' : 'All reports'}
            </h2>
            <p className="text-[14px] text-ui-content-muted mt-0.5">
              {language === 'bn'
                ? `${filteredReports.length}টি প্রকাশিত প্রতিবেদন`
                : `${filteredReports.length} published reports`}
            </p>
          </div>

          <div className="hidden md:block shrink-0">
            <LocationSelector
              selectedDistrict={feedFilters.districtId}
              onSelectDistrict={handleDesktopDistrictChange}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {subcategories.map((subcat) => {
            const count = reports.filter((report) => {
              if (report.segment !== 'extortion') return false;
              const matchesSub = subcat.id === 'all' || report.subcategoryId === subcat.id;
              return matchesSub && matchesCategoryFeedFilters(report, 'extortion', feedFilters);
            }).length;

            return (
              <FilterChip
                key={subcat.id}
                id={`filter-subcat-${subcat.id}`}
                label={language === 'bn' ? subcat.nameBn : subcat.nameEn}
                section="extortion"
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
          id="extortion-feed-skeleton"
          ariaLabel={language === 'bn' ? 'প্রতিবেদন লোড হচ্ছে...' : 'Loading reports...'}
        />
      )}

      {!isLoading && fetchError && (
        <div role="alert" className="bg-ui-surface border border-ui-error-border rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-ui-error-text mx-auto" aria-hidden="true" />
          <p className="text-[16px] font-semibold text-ui-error-text">
            {language === 'bn' ? 'প্রতিবেদন লোড করা যায়নি।' : "Couldn't load reports."}
          </p>
          <button
            type="button"
            onClick={loadData}
            className="btn-primary-action px-4 py-2 text-[16px] font-semibold rounded-xl min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus cursor-pointer"
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
                language === 'bn'
                  ? 'এই ফিল্টারগুলোর জন্য বর্তমানে কোনো প্রকাশিত প্রতিবেদন নেই।'
                  : 'There are currently no published reports for these filters.'
              }
              actionLabel={language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset filters'}
              onAction={() => {
                setSelectedSubcat('all');
                setFeedFilters({ ...EMPTY_CATEGORY_FEED_FILTERS });
              }}
            />
          )}
        </div>
      )}

      <CategoryFilterSheet
        section="extortion"
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
