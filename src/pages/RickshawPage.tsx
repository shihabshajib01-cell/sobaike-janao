import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Info } from 'lucide-react';
import { PublicReportService } from '../services/publicReportService';
import { ReportItem } from '../types/report';
import { MobileCategoryFilterPortal } from '../components/feed/MobileCategoryFilterPortal';
import { CategoryFeedView } from '../components/feed/CategoryFeedView';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { CategoryHeroSlider } from '../components/category/CategoryHeroSlider';
import { CategoryFilterSheet } from '../components/report/CategoryFilterSheet';
import { useApp } from '../context/AppContext';
import { VisitorSessionService } from '../services/visitorSessionService';
import { CANONICAL_BANNER_CONTENT } from '../data/bannerContent';
import { usePublishedBannerRuntime } from '../services/bannerRuntime';
import {
  CategoryFeedFilterState,
  EMPTY_CATEGORY_FEED_FILTERS,
  matchesCategoryFeedFilters,
} from '../data/categoryFeedFilters';

export const RickshawPage: React.FC = () => {
  const { language, openReportComposer, browseLocation, browseLocationStatus } = useApp();
  usePublishedBannerRuntime();
  const bannerContent = CANONICAL_BANNER_CONTENT.rickshaw;

  const [feedFilters, setFeedFilters] = useState<CategoryFeedFilterState>({
    ...EMPTY_CATEGORY_FEED_FILTERS,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

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
      const data = await PublicReportService.getBySegment('rickshaw', {
        visitorLat,
        visitorLng,
      });
      setReports(data);
    } catch (err) {
      console.warn('[RickshawPage load error]', err);
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
      if (report.segment !== 'rickshaw') return false;
      return matchesCategoryFeedFilters(report, 'rickshaw', feedFilters);
    });
  }, [reports, feedFilters]);

  return (
    <PublicPageContainer id="rickshaw-page-container">
      <MobileCategoryFilterPortal language={language} onOpen={() => setIsFilterOpen(true)} />

      <CategoryHeroSlider
        id="rickshaw-header-banner"
        section="rickshaw"
        slides={[
          {
            id: 'rickshaw-primary',
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
              onClick: () => openReportComposer('rickshaw'),
            },
          },
        ]}
      />

      <div className="flex items-center gap-2 type-meta text-ui-content-secondary bg-ui-surface-subtle border border-ui-stroke-subtle rounded-[var(--radius-control)] px-3 sm:px-3.5 py-2 sm:py-2.5 text-left">
        <Info className="w-4 h-4 text-ui-content-muted shrink-0" aria-hidden="true" />
        <span>
          {language === 'bn'
            ? 'অবৈধ বা ঝুঁকিপূর্ণ চার্জিং স্টেশনের অবস্থান ও তথ্য দিন।'
            : 'Share the location and details of illegal or unsafe charging stations.'}
        </span>
      </div>

      <CategoryFeedView
        section="rickshaw"
        language={language}
        reports={reports}
        filteredReports={filteredReports}
        isLoading={isLoading}
        fetchError={fetchError}
        onRetry={loadData}
        onEmptyAction={() => setFeedFilters({ ...EMPTY_CATEGORY_FEED_FILTERS })}
        idPrefix="rickshaw"
      />

      <CategoryFilterSheet
        section="rickshaw"
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
