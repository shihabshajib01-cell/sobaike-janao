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
import { useSeo } from '../components/seo/SeoManager';
import {
  BRAND_NAME,
  STATIC_ROUTE_SEO,
  SeoMetadata,
  buildBrandedSeoTitle,
  normalizeSeoDescription,
} from '../lib/seo';
import {
  CategoryFeedFilterState,
  EMPTY_CATEGORY_FEED_FILTERS,
  matchesCategoryFeedFilters,
} from '../data/categoryFeedFilters';

export interface StandardCategoryPageProps {
  section: SectionKey;
  initialSubcategoryId?: string;
  seoOverride?: SeoMetadata | null;
}

export const StandardCategoryPage: React.FC<StandardCategoryPageProps> = ({
  section,
  initialSubcategoryId,
  seoOverride = null,
}) => {
  const { language, browseLocation, browseLocationStatus } = useApp();
  const { segments, getFeedSubcategories } = useTaxonomy();
  const { setDynamicSeo } = useSeo();
  usePublishedBannerRuntime();
  const runtimeBannerContent = getRuntimeBannerContent(section);
  const segmentSeo = segments[section];
  const bannerContent = runtimeBannerContent || (segmentSeo
    ? {
        section: segmentSeo.id,
        titleBn: segmentSeo.nameBn,
        titleEn: segmentSeo.nameEn,
        mobileDescriptionBn: segmentSeo.descriptionBn,
        mobileDescriptionEn: segmentSeo.descriptionEn,
        tabletDescriptionBn: segmentSeo.descriptionBn,
        tabletDescriptionEn: segmentSeo.descriptionEn,
        desktopDescriptionBn: segmentSeo.descriptionBn,
        desktopDescriptionEn: segmentSeo.descriptionEn,
        illustrationSrc: '',
        primaryCtaBn: 'ঘটনা জানান',
        primaryCtaEn: 'Report incident',
      }
    : null);

  const [selectedSubcat, setSelectedSubcat] = useState<string>(initialSubcategoryId || 'all');
  const [feedFilters, setFeedFilters] = useState<CategoryFeedFilterState>({
    ...EMPTY_CATEGORY_FEED_FILTERS,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const subcategories = getFeedSubcategories(section);
  const routeSubcategory = useMemo(
    () =>
      initialSubcategoryId
        ? subcategories.find((subcategory) => subcategory.id === initialSubcategoryId)
        : undefined,
    [initialSubcategoryId, subcategories]
  );

  useEffect(() => {
    if (!segmentSeo) return;

    if (seoOverride) {
      // Server-prerendered topic routes already ship with the correct crawlable metadata.
      // Keep that metadata untouched during hydration/loading, then reconcile robots
      // against the live published feed after data resolves.
      if (isLoading || fetchError) return;

      const hasPublishedTopicReports = initialSubcategoryId
        ? reports.some(
            (report) =>
              report.segment === section && report.subcategoryId === initialSubcategoryId
          )
        : true;

      setDynamicSeo({
        ...seoOverride,
        robots: hasPublishedTopicReports
          ? 'index, follow, max-image-preview:large'
          : 'noindex, follow',
      });
      return;
    }

    const canonicalPath = segmentSeo.slug.startsWith('/')
      ? segmentSeo.slug
      : `/${segmentSeo.slug}`;
    const curated = STATIC_ROUTE_SEO[canonicalPath]?.[language];

    if (curated) {
      setDynamicSeo(curated);
      return;
    }

    const name = language === 'bn' ? segmentSeo.nameBn : segmentSeo.nameEn;
    const rawDescription =
      (language === 'bn' ? segmentSeo.descriptionBn : segmentSeo.descriptionEn) ||
      (language === 'bn'
        ? `${name} সংক্রান্ত প্রকাশিত নাগরিক প্রতিবেদন, সংশ্লিষ্ট এলাকা, উৎস ও সর্বশেষ আপডেট দেখুন।`
        : `Browse moderated citizen reports, locations, sources, and the latest updates about ${name}.`);

    setDynamicSeo({
      title: buildBrandedSeoTitle(name, BRAND_NAME[language]),
      description: normalizeSeoDescription(rawDescription, language),
      robots: 'index, follow, max-image-preview:large',
      ogType: 'website',
      ogSiteName: BRAND_NAME[language],
      canonicalPath,
      pageType: 'collection',
    });
  }, [
    language,
    segmentSeo?.nameBn,
    segmentSeo?.nameEn,
    segmentSeo?.descriptionBn,
    segmentSeo?.descriptionEn,
    segmentSeo?.slug,
    seoOverride,
    isLoading,
    fetchError,
    initialSubcategoryId,
    reports,
    section,
    setDynamicSeo,
  ]);

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
    setSelectedSubcat(initialSubcategoryId || 'all');
    setFeedFilters({ ...EMPTY_CATEGORY_FEED_FILTERS });
    setIsFilterOpen(false);
  }, [section, initialSubcategoryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (report.segment !== section) return false;
      const matchesSubcat =
        selectedSubcat === 'all' || report.subcategoryId === selectedSubcat;
      return matchesSubcat && matchesCategoryFeedFilters(report, section, feedFilters);
    });
  }, [reports, section, selectedSubcat, feedFilters]);

  const countForSubcategory = useCallback(
    (subcategoryId: string) =>
      reports.filter((report) => {
        if (report.segment !== section) return false;
        const matchesSub =
          subcategoryId === 'all' || report.subcategoryId === subcategoryId;
        return matchesSub && matchesCategoryFeedFilters(report, section, feedFilters);
      }).length,
    [reports, section, feedFilters]
  );

  const getSubcategoryHref = useCallback(
    (subcategoryId: string) => {
      if (!segmentSeo) return undefined;

      const localize = (path: string) =>
        language === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path;
      const categoryPath = segmentSeo.slug.startsWith('/')
        ? segmentSeo.slug
        : `/${segmentSeo.slug}`;

      if (subcategoryId === 'all') {
        return localize(categoryPath);
      }

      const subcategory = subcategories.find((item) => item.id === subcategoryId);
      if (!subcategory) return undefined;
      const slug = (subcategory.slug || subcategory.id.replace(/_/g, '-')).replace(/^\/+/, '');
      return localize(`/topic/${encodeURIComponent(slug)}`);
    },
    [language, segmentSeo, subcategories]
  );

  if (!bannerContent) {
    return null;
  }

  const topicDescriptionBn = routeSubcategory?.descriptionBn || bannerContent.tabletDescriptionBn;
  const topicDescriptionEn = routeSubcategory?.descriptionEn || bannerContent.tabletDescriptionEn;

  return (
    <PublicPageContainer id={`${section}-page-container`}>
      <MobileCategoryFilterPortal language={language} onOpen={() => setIsFilterOpen(true)} />

      <CategoryHeroSlider
        id={`${section}-header-banner`}
        section={section}
        slides={[
          {
            id: `${section}-primary`,
            titleBn: routeSubcategory?.nameBn || bannerContent.titleBn,
            titleEn: routeSubcategory?.nameEn || bannerContent.titleEn,
            mobileDescriptionBn:
              routeSubcategory?.descriptionBn || bannerContent.mobileDescriptionBn,
            mobileDescriptionEn:
              routeSubcategory?.descriptionEn || bannerContent.mobileDescriptionEn,
            descriptionBn: topicDescriptionBn,
            descriptionEn: topicDescriptionEn,
            desktopDescriptionBn:
              routeSubcategory?.descriptionBn || bannerContent.desktopDescriptionBn,
            desktopDescriptionEn:
              routeSubcategory?.descriptionEn || bannerContent.desktopDescriptionEn,
            illustrationSrc: bannerContent.illustrationSrc,
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
          setSelectedSubcat(initialSubcategoryId || 'all');
          setFeedFilters({ ...EMPTY_CATEGORY_FEED_FILTERS });
        }}
        selectedSubcategory={selectedSubcat}
        subcategories={subcategories}
        onSelectSubcategory={setSelectedSubcat}
        getSubcategoryHref={getSubcategoryHref}
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
