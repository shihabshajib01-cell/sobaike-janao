import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { usePublishedBannerRuntime } from '../services/bannerRuntime';
import { useSeo } from '../components/seo/SeoManager';
import { SeoMetadata } from '../lib/seo';
import {
  CategoryFeedFilterState,
  EMPTY_CATEGORY_FEED_FILTERS,
  matchesCategoryFeedFilters,
} from '../data/categoryFeedFilters';

export interface ExtortionPageProps {
  initialSubcategoryId?: string;
  seoOverride?: SeoMetadata | null;
}

export const ExtortionPage: React.FC<ExtortionPageProps> = ({
  initialSubcategoryId,
  seoOverride = null,
}) => {
  const { language, browseLocation, browseLocationStatus } = useApp();
  const { getFeedSubcategories } = useTaxonomy();
  const { setDynamicSeo } = useSeo();
  usePublishedBannerRuntime();
  const bannerContent = CANONICAL_BANNER_CONTENT.extortion;

  const [selectedSubcat, setSelectedSubcat] = useState<string>(initialSubcategoryId || 'all');
  const [feedFilters, setFeedFilters] = useState<CategoryFeedFilterState>({
    ...EMPTY_CATEGORY_FEED_FILTERS,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const subcategories = getFeedSubcategories('extortion');
  const routeSubcategory = useMemo(
    () =>
      initialSubcategoryId
        ? subcategories.find((subcategory) => subcategory.id === initialSubcategoryId)
        : undefined,
    [initialSubcategoryId, subcategories]
  );

  useEffect(() => {
    if (!seoOverride || isLoading || fetchError) return;
    const hasPublishedTopicReports = initialSubcategoryId
      ? reports.some(
          (report) =>
            report.segment === 'extortion' && report.subcategoryId === initialSubcategoryId
        )
      : true;
    setDynamicSeo({
      ...seoOverride,
      robots: hasPublishedTopicReports
        ? 'index, follow, max-image-preview:large'
        : 'noindex, follow',
    });
  }, [seoOverride, isLoading, fetchError, initialSubcategoryId, reports, setDynamicSeo]);

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
    setSelectedSubcat(initialSubcategoryId || 'all');
  }, [initialSubcategoryId]);

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

  const getSubcategoryHref = useCallback(
    (subcategoryId: string) => {
      if (!initialSubcategoryId || subcategoryId !== 'all') return undefined;
      return language === 'en' ? '/en/extortion' : '/extortion';
    },
    [initialSubcategoryId, language]
  );

  const countForSubcategory = useCallback(
    (subcategoryId: string) =>
      reports.filter((report) => {
        if (report.segment !== 'extortion') return false;
        const matchesSub = subcategoryId === 'all' || report.subcategoryId === subcategoryId;
        return matchesSub && matchesCategoryFeedFilters(report, 'extortion', feedFilters);
      }).length,
    [reports, feedFilters]
  );

  return (
    <PublicPageContainer id="extortion-page-container">
      <MobileCategoryFilterPortal language={language} onOpen={() => setIsFilterOpen(true)} />

      <CategoryHeroSlider
        id="extortion-header-banner"
        section="extortion"
        slides={[
          {
            id: 'extortion-primary',
            titleBn: routeSubcategory?.nameBn || bannerContent.titleBn,
            titleEn: routeSubcategory?.nameEn || bannerContent.titleEn,
            mobileDescriptionBn: routeSubcategory?.descriptionBn || bannerContent.mobileDescriptionBn,
            mobileDescriptionEn: routeSubcategory?.descriptionEn || bannerContent.mobileDescriptionEn,
            descriptionBn: routeSubcategory?.descriptionBn || bannerContent.tabletDescriptionBn,
            descriptionEn: routeSubcategory?.descriptionEn || bannerContent.tabletDescriptionEn,
            desktopDescriptionBn: routeSubcategory?.descriptionBn || bannerContent.desktopDescriptionBn,
            desktopDescriptionEn: routeSubcategory?.descriptionEn || bannerContent.desktopDescriptionEn,
            illustrationSrc: bannerContent.illustrationSrc,
          },
        ]}
      />

      <CategoryFeedView
        section="extortion"
        language={language}
        reports={reports}
        filteredReports={filteredReports}
        isLoading={isLoading}
        fetchError={fetchError}
        onRetry={loadData}
        onEmptyAction={() => {
          setSelectedSubcat(initialSubcategoryId || 'all');
          setFeedFilters({ ...EMPTY_CATEGORY_FEED_FILTERS });
        }}
        selectedSubcategory={selectedSubcat}
        subcategories={subcategories}
        onSelectSubcategory={setSelectedSubcat}
        getSubcategoryHref={initialSubcategoryId ? getSubcategoryHref : undefined}
        countForSubcategory={countForSubcategory}
        idPrefix="extortion"
      />

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
