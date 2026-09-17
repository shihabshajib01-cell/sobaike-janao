import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useApp } from '../context/AppContext';
import { VisitorSessionService } from '../services/visitorSessionService';
import { CANONICAL_BANNER_CONTENT } from '../data/bannerContent';
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

export const HarassmentPage: React.FC = () => {
  const {
    language,
    openReportComposer,
    browseLocation,
    browseLocationStatus,
    isHarassmentFilterOpen,
    setIsHarassmentFilterOpen,
  } = useApp();
  const { getFeedSubcategories, getSegment } = useTaxonomy();
  const config = getSegment('harassment') || SECTIONS.harassment;
  const bannerContent = CANONICAL_BANNER_CONTENT.harassment;

  const [selectedSubcat, setSelectedSubcat] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [classificationFilters, setClassificationFilters] =
    useState<HarassmentClassificationFilterState>({
      ...EMPTY_HARASSMENT_CLASSIFICATION_FILTERS,
    });

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const subcategoryScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollSubcategoriesLeft, setCanScrollSubcategoriesLeft] = useState(false);
  const [canScrollSubcategoriesRight, setCanScrollSubcategoriesRight] = useState(false);

  const subcategories = getFeedSubcategories('harassment');

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
    loadData();
  }, [loadData]);

  const updateSubcategoryScrollControls = useCallback(() => {
    const container = subcategoryScrollRef.current;
    if (!container) return;

    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    setCanScrollSubcategoriesLeft(container.scrollLeft > 2);
    setCanScrollSubcategoriesRight(maxScrollLeft - container.scrollLeft > 2);
  }, []);

  useEffect(() => {
    const container = subcategoryScrollRef.current;
    if (!container) return;

    updateSubcategoryScrollControls();
    container.addEventListener('scroll', updateSubcategoryScrollControls, { passive: true });
    window.addEventListener('resize', updateSubcategoryScrollControls);

    return () => {
      container.removeEventListener('scroll', updateSubcategoryScrollControls);
      window.removeEventListener('resize', updateSubcategoryScrollControls);
    };
  }, [updateSubcategoryScrollControls]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateSubcategoryScrollControls);
    return () => window.cancelAnimationFrame(frame);
  }, [
    language,
    subcategories.length,
    isLoading,
    reports.length,
    selectedDistrict,
    updateSubcategoryScrollControls,
  ]);

  const scrollSubcategories = useCallback((direction: 'left' | 'right') => {
    const container = subcategoryScrollRef.current;
    if (!container) return;

    const distance = Math.max(280, Math.round(container.clientWidth * 0.7));
    container.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (report.segment !== 'harassment') return false;
      const matchesSubcat =
        selectedSubcat === 'all' || report.subcategoryId === selectedSubcat;
      return (
        matchesSubcat &&
        matchesLocationFilters(report, selectedDivision, selectedDistrict) &&
        matchesHarassmentClassification(report, classificationFilters)
      );
    });
  }, [
    reports,
    selectedSubcat,
    selectedDivision,
    selectedDistrict,
    classificationFilters,
  ]);

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
              onClick: () => openReportComposer('harassment'),
            },
          },
        ]}
      />

      <section id="harassment-filter-section" className="space-y-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3 border-b border-ui-stroke-subtle pb-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[var(--type-fixed-18)] sm:text-[var(--type-fixed-20)] font-[var(--font-weight-bold)] leading-[var(--type-line-ratio-130)] text-ui-content-primary">
              {language === 'bn'
                ? 'সকল প্রতিবেদন'
                : 'All reports'}
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

        <div className="relative">
          {canScrollSubcategoriesLeft && (
            <div className="absolute inset-y-0 left-0 z-10 hidden lg:flex items-center pr-5 bg-gradient-to-r from-ui-page via-ui-page to-transparent pointer-events-none">
              <button
                type="button"
                onClick={() => scrollSubcategories('left')}
                aria-label={language === 'bn' ? 'আগের বিভাগগুলো দেখুন' : 'Show previous categories'}
                className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] border border-ui-stroke-default bg-ui-surface text-ui-content-primary shadow-[var(--elevation-md)] transition-colors hover:bg-ui-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}

          <div
            ref={subcategoryScrollRef}
            className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden"
          >
            {subcategories.map((subcat) => {
              const count = reports.filter((report) => {
                if (report.segment !== 'harassment') return false;
                const matchesSub =
                  subcat.id === 'all' || report.subcategoryId === subcat.id;
                return (
                  matchesSub &&
                  matchesLocationFilters(report, selectedDivision, selectedDistrict) &&
                  matchesHarassmentClassification(report, classificationFilters)
                );
              }).length;

              return (
                <FilterChip
                  key={subcat.id}
                  id={`filter-subcat-${subcat.id}`}
                  label={language === 'bn' ? subcat.nameBn : subcat.nameEn}
                  section="harassment"
                  selected={selectedSubcat === subcat.id}
                  count={isLoading ? undefined : count}
                  onClick={() => setSelectedSubcat(subcat.id)}
                />
              );
            })}
          </div>

          {canScrollSubcategoriesRight && (
            <div className="absolute inset-y-0 right-0 z-10 hidden lg:flex items-center pl-5 bg-gradient-to-l from-ui-page via-ui-page to-transparent pointer-events-none">
              <button
                type="button"
                onClick={() => scrollSubcategories('right')}
                aria-label={language === 'bn' ? 'পরের বিভাগগুলো দেখুন' : 'Show more categories'}
                className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] border border-ui-stroke-default bg-ui-surface text-ui-content-primary shadow-[var(--elevation-md)] transition-colors hover:bg-ui-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </section>

      {isLoading && (
        <ReportFeedSkeleton
          count={3}
          id="harassment-feed-skeleton"
          ariaLabel={language === 'bn' ? 'প্রতিবেদন লোড হচ্ছে...' : 'Loading reports...'}
        />
      )}

      {!isLoading && fetchError && (
        <div role="alert" className="bg-ui-surface border border-ui-error-border rounded-[var(--radius-card)] p-6 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-ui-error-text mx-auto" aria-hidden="true" />
          <p className="text-[var(--type-fixed-16)] font-[var(--font-weight-semibold)] text-ui-error-text">
            {language === 'bn'
              ? 'প্রতিবেদন লোড করা যায়নি।'
              : "Couldn't load reports."}
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
            filteredReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))
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
                setSelectedDivision('all');
                setSelectedDistrict('all');
                setClassificationFilters({ ...EMPTY_HARASSMENT_CLASSIFICATION_FILTERS });
              }}
            />
          )}
        </div>
      )}

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
