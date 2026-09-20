import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PublicReportService } from '../services/publicReportService';
import { useTaxonomy } from '../services/taxonomyService';
import { ReportItem } from '../types/report';
import { MobileCategoryFilterPortal } from '../components/feed/MobileCategoryFilterPortal';
import { CategoryFeedView } from '../components/feed/CategoryFeedView';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { CategoryHeroSlider } from '../components/category/CategoryHeroSlider';
import { useApp } from '../context/AppContext';
import { VisitorSessionService } from '../services/visitorSessionService';
import { CANONICAL_BANNER_CONTENT } from '../data/bannerContent';
import { usePublishedBannerRuntime } from '../services/bannerRuntime';
import { useSeo } from '../components/seo/SeoManager';
import { SeoMetadata } from '../lib/seo';
import { BANGLADESH_DISTRICTS } from '../data/districts';
import {
  EMPTY_HARASSMENT_CLASSIFICATION_FILTERS,
  HarassmentClassificationFilterState,
  matchesHarassmentClassification,
} from '../data/harassmentClassification';
import {
  HarassmentFilterSheet,
  HarassmentFilterValue,
} from '../components/report/HarassmentFilterSheet';

const normalizeDistrictName = (value?: string) =>
  value
    ?.trim()
    .toLocaleLowerCase()
    .replace('chittagong', 'chattogram')
    .replace('barisal', 'barishal');

const resolveReportDistrict = (report: ReportItem) => {
  const districtBn = report.districtBn?.trim();
  const districtEn = normalizeDistrictName(report.districtEn);

  return BANGLADESH_DISTRICTS.find((district) => {
    const optionEn = normalizeDistrictName(district.nameEn);
    return (
      (districtBn && (districtBn === district.nameBn || districtBn.includes(district.nameBn))) ||
      (districtEn && optionEn && (districtEn === optionEn || districtEn.includes(optionEn)))
    );
  });
};

const matchesLocationFilters = (
  report: ReportItem,
  divisionId: string,
  districtId: string
) => {
  if (divisionId === 'all' && districtId === 'all') return true;

  const district = resolveReportDistrict(report);
  if (!district) return false;
  if (divisionId !== 'all' && district.divisionId !== divisionId) return false;
  if (districtId !== 'all' && district.id !== districtId) return false;
  return true;
};

export interface HarassmentPageProps {
  initialSubcategoryId?: string;
  seoOverride?: SeoMetadata | null;
}

export const HarassmentPage: React.FC<HarassmentPageProps> = ({
  initialSubcategoryId,
  seoOverride = null,
}) => {
  const {
    language,
    browseLocation,
    browseLocationStatus,
    isHarassmentFilterOpen,
    setIsHarassmentFilterOpen,
  } = useApp();
  const { getFeedSubcategories } = useTaxonomy();
  const { setDynamicSeo } = useSeo();
  usePublishedBannerRuntime();
  const bannerContent = CANONICAL_BANNER_CONTENT.harassment;

  const [selectedSubcat, setSelectedSubcat] = useState<string>(initialSubcategoryId || 'all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [classificationFilters, setClassificationFilters] =
    useState<HarassmentClassificationFilterState>({
      ...EMPTY_HARASSMENT_CLASSIFICATION_FILTERS,
    });

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const subcategories = getFeedSubcategories('harassment');
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
            report.segment === 'harassment' && report.subcategoryId === initialSubcategoryId
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
      const data = await PublicReportService.getBySegment('harassment', {
        visitorLat,
        visitorLng,
      });
      setReports(data);
    } catch (err) {
      console.warn('[HarassmentPage load error]', err);
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

  const matchesCurrentFilters = useCallback(
    (report: ReportItem) =>
      matchesLocationFilters(report, selectedDivision, selectedDistrict) &&
      matchesHarassmentClassification(report, classificationFilters),
    [selectedDivision, selectedDistrict, classificationFilters]
  );

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (report.segment !== 'harassment') return false;
      const matchesSubcat = selectedSubcat === 'all' || report.subcategoryId === selectedSubcat;
      return matchesSubcat && matchesCurrentFilters(report);
    });
  }, [reports, selectedSubcat, matchesCurrentFilters]);

  const getSubcategoryHref = useCallback(
    (subcategoryId: string) => {
      if (!initialSubcategoryId || subcategoryId !== 'all') return undefined;
      return language === 'en' ? '/en/harassment' : '/harassment';
    },
    [initialSubcategoryId, language]
  );

  const countForSubcategory = useCallback(
    (subcategoryId: string) =>
      reports.filter((report) => {
        if (report.segment !== 'harassment') return false;
        const matchesSub = subcategoryId === 'all' || report.subcategoryId === subcategoryId;
        return matchesSub && matchesCurrentFilters(report);
      }).length,
    [reports, matchesCurrentFilters]
  );

  const handleApplyFilterSheet = useCallback(
    (next: HarassmentFilterValue) => {
      setSelectedDivision(next.divisionId);
      setSelectedDistrict(next.districtId);
      setClassificationFilters({ ...next.classification });
      setIsHarassmentFilterOpen(false);
    },
    [setIsHarassmentFilterOpen]
  );

  return (
    <PublicPageContainer id="harassment-page-container">
      <MobileCategoryFilterPortal
        language={language}
        onOpen={() => setIsHarassmentFilterOpen(true)}
        renderMobile={false}
      />

      <CategoryHeroSlider
        id="harassment-header-banner"
        section="harassment"
        slides={[
          {
            id: 'harassment-primary',
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
        section="harassment"
        language={language}
        reports={reports}
        filteredReports={filteredReports}
        isLoading={isLoading}
        fetchError={fetchError}
        onRetry={loadData}
        onEmptyAction={() => {
          setSelectedSubcat(initialSubcategoryId || 'all');
          setSelectedDivision('all');
          setSelectedDistrict('all');
          setClassificationFilters({ ...EMPTY_HARASSMENT_CLASSIFICATION_FILTERS });
        }}
        selectedSubcategory={selectedSubcat}
        subcategories={subcategories}
        onSelectSubcategory={setSelectedSubcat}
        getSubcategoryHref={initialSubcategoryId ? getSubcategoryHref : undefined}
        countForSubcategory={countForSubcategory}
        idPrefix="harassment"
      />

      <HarassmentFilterSheet
        isOpen={isHarassmentFilterOpen}
        language={language}
        value={{
          divisionId: selectedDivision,
          districtId: selectedDistrict,
          classification: classificationFilters,
        }}
        onClose={() => setIsHarassmentFilterOpen(false)}
        onApply={handleApplyFilterSheet}
      />
    </PublicPageContainer>
  );
};
