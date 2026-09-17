import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Info } from 'lucide-react';
import { PublicReportService } from '../services/publicReportService';
import { useTaxonomy } from '../services/taxonomyService';
import { ReportItem } from '../types/report';
import { MobileCategoryFilterPortal } from '../components/feed/MobileCategoryFilterPortal';
import { CategoryFeedView } from '../components/feed/CategoryFeedView';
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
  const { getFeedSubcategories } = useTaxonomy();
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

  const countForSubcategory = useCallback(
    (subcategoryId: string) =>
      reports.filter((report) => {
        if (report.segment !== 'load_shedding') return false;
        const matchesSub = subcategoryId === 'all' || report.subcategoryId === subcategoryId;
        return matchesSub && matchesCategoryFeedFilters(report, 'load_shedding', feedFilters);
      }).length,
    [reports, feedFilters]
  );

  const hasActiveFeedFilters =
    feedFilters.divisionId !== 'all' ||
    feedFilters.districtId !== 'all' ||
    feedFilters.incidentPeriod !== 'all' ||
    feedFilters.evidence !== 'all' ||
    feedFilters.utilityBillTrend !== 'all';
  const hasFilteredContext = hasActiveFeedFilters || selectedSubcat !== 'all';

  return (
    <PublicPageContainer id="utility-page-container">
      <MobileCategoryFilterPortal language={language} onOpen={() => setIsFilterOpen(true)} />

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

      <div className="flex items-center gap-2 type-meta text-ui-content-secondary bg-ui-surface-subtle border border-ui-stroke-subtle rounded-[var(--radius-control)] px-3 sm:px-3.5 py-2 sm:py-2.5 text-left">
        <Info className="w-4 h-4 text-ui-content-muted shrink-0" aria-hidden="true" />
        <span>
          {language === 'bn'
            ? 'লোডশেডিং, গ্যাস সংকট বা অতিরিক্ত বিদ্যুৎ বিল সংক্রান্ত প্রতিবেদন জমা দিন।'
            : 'Report load shedding, gas shortages, or excess electricity bills responsibly.'}
        </span>
      </div>

      <CategoryFeedView
        section="load_shedding"
        language={language}
        reports={reports}
        filteredReports={filteredReports}
        isLoading={isLoading}
        fetchError={fetchError}
        onRetry={loadData}
        onEmptyAction={
          hasFilteredContext
            ? () => {
                setSelectedSubcat('all');
                setFeedFilters({ ...EMPTY_CATEGORY_FEED_FILTERS });
              }
            : () => openReportComposer('load_shedding')
        }
        emptyDescription={
          hasFilteredContext
            ? undefined
            : language === 'bn'
            ? 'এই মুহূর্তে ইউটিলিটি সেবা সংক্রান্ত কোনো প্রকাশিত প্রতিবেদন নেই। নতুন প্রতিবেদন জমা দিতে নিচের বোতামটি ব্যবহার করুন।'
            : 'No utility reports have been published yet. Use the button below to submit a report.'
        }
        emptyActionLabel={
          hasFilteredContext
            ? undefined
            : language === 'bn'
            ? 'প্রতিবেদন জমা দিন'
            : 'Submit report'
        }
        selectedSubcategory={selectedSubcat}
        subcategories={subcategories}
        onSelectSubcategory={setSelectedSubcat}
        countForSubcategory={countForSubcategory}
        idPrefix="utility"
      />

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
