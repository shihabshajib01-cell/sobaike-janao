import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SectionKey } from '../theme/tokens';
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
import { getRuntimeBannerContent, usePublishedBannerRuntime } from '../services/bannerRuntime';
import {
  CategoryFeedFilterState,
  EMPTY_CATEGORY_FEED_FILTERS,
  matchesCategoryFeedFilters,
} from '../data/categoryFeedFilters';

export interface StandardCategoryPageProps {
  section: SectionKey;
}

export const StandardCategoryPage: React.FC<StandardCategoryPageProps> = ({ section }) => {
  const { language, openReportComposer, browseLocation, browseLocationStatus } = useApp();
  const { getFeedSubcategories } = useTaxonomy();
  usePublishedBannerRuntime();
  const bannerContent = getRuntimeBannerContent(section);

  const [selectedSubcat, setSelectedSubcat] = useState<string>('all');
  const [feedFilters, setFeedFilters] = useState<CategoryFeedFilterState>({
    ...EMPTY_CATEGORY_FEED_FILTERS,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const subcategories = getFeedSubcategories(section);

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
      const data = await PublicReportService.getBySegment(section, {
        visitorLat,
        visitorLng,
      });
      setReports(data);
    } catch (err) {
      console.warn(`[StandardCategoryPage:${section} load error]`, err);
      setFetchError('LOAD_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, [section, visitorLat, visitorLng]);

  useEffect(() => {
    setSelectedSubcat('all');
    setFeedFilters({ ...EMPTY_CATEGORY_FEED_FILTERS });
    setIsFilterOpen(false);
  }, [section]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (report.segment !== section) return false;
      const matchesSubcat = selectedSubcat === 'all' || report.subcategoryId === selectedSubcat;
      return matchesSubcat && matchesCategoryFeedFilters(report, section, feedFilters);
    });
  }, [reports, section, selectedSubcat, feedFilters]);

  const countForSubcategory = useCallback(
    (subcategoryId: string) =>
      reports.filter((report) => {
        if (report.segment !== section) return false;
        const matchesSub = subcategoryId === 'all' || report.subcategoryId === subcategoryId;
        return matchesSub && matchesCategoryFeedFilters(report, section, feedFilters);
      }).length,
    [reports, section, feedFilters]
  );

  if (!bannerContent) {
    return null;
  }

  return (
    <PublicPageContainer id={`${section}-page-container`}>
      <MobileCategoryFilterPortal language={language} onOpen={() => setIsFilterOpen(true)} />

      <CategoryHeroSlider
        id={`${section}-header-banner`}
        section={section}
        slides={[
          {
            id: `${section}-primary`,
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
              onClick: () => openReportComposer(section),
            },
          },
        ]}
      />

      <CategoryFeedView
        section={section}
        language={language}
        reports={reports}
        filteredReports={filteredReports}
        isLoading={isLoading}
        fetchError={fetchError}
        onRetry={loadData}
        onEmptyAction={() => {
          setSelectedSubcat('all');
          setFeedFilters({ ...EMPTY_CATEGORY_FEED_FILTERS });
        }}
        selectedSubcategory={selectedSubcat}
        subcategories={subcategories}
        onSelectSubcategory={setSelectedSubcat}
        countForSubcategory={countForSubcategory}
        idPrefix={section}
      />

      <CategoryFilterSheet
        section={section}
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
