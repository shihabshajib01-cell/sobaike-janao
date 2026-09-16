import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { SectionKey } from '../theme/tokens';
import { PublicReportService } from '../services/publicReportService';
import { useTaxonomy } from '../services/taxonomyService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { LocationSelector } from '../components/feed/LocationSelector';
import { MobileCategoryLocationPortal } from '../components/feed/MobileCategoryLocationPortal';
import { FilterChip } from '../components/ui/FilterChip';
import { EmptyState } from '../components/ui/EmptyState';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { CategoryHeroSlider } from '../components/category/CategoryHeroSlider';
import { useApp } from '../context/AppContext';
import { VisitorSessionService } from '../services/visitorSessionService';
import { CANONICAL_BANNER_CONTENT } from '../data/bannerContent';

export interface StandardCategoryPageProps {
  section: SectionKey;
}

export const StandardCategoryPage: React.FC<StandardCategoryPageProps> = ({ section }) => {
  const { language, openReportComposer, browseLocation, browseLocationStatus } = useApp();
  const { getFeedSubcategories } = useTaxonomy();
  const bannerContent = CANONICAL_BANNER_CONTENT[section];

  const [selectedSubcat, setSelectedSubcat] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
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
    setSelectedDistrict('all');
  }, [section]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (report.segment !== section) return false;
      const matchesSubcat = selectedSubcat === 'all' || report.subcategoryId === selectedSubcat;
      const matchesDistrict =
        selectedDistrict === 'all' ||
        (report.districtBn && report.districtBn.includes(selectedDistrict)) ||
        (report.districtEn && report.districtEn.toLowerCase().includes(selectedDistrict.toLowerCase()));
      return matchesSubcat && matchesDistrict;
    });
  }, [reports, section, selectedSubcat, selectedDistrict]);

  return (
    <PublicPageContainer id={`${section}-page-container`}>
      <MobileCategoryLocationPortal
        selectedDistrict={selectedDistrict}
        onSelectDistrict={setSelectedDistrict}
      />

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

      <section id={`${section}-filter-section`} className="space-y-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3 border-b border-ui-stroke-subtle pb-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[var(--type-fixed-18)] sm:text-[var(--type-fixed-20)] font-bold leading-[var(--type-line-ratio-130)] text-ui-content-primary">
              {language === 'bn' ? 'সকল প্রতিবেদন' : 'All reports'}
            </h2>
            <p className="text-[var(--type-fixed-14)] text-ui-content-muted mt-0.5">
              {language === 'bn'
                ? `${filteredReports.length}টি প্রকাশিত প্রতিবেদন`
                : `${filteredReports.length} published reports`}
            </p>
          </div>

          <div className="hidden md:block shrink-0">
            <LocationSelector
              selectedDistrict={selectedDistrict}
              onSelectDistrict={setSelectedDistrict}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {subcategories.map((subcat) => {
            const count = reports.filter((report) => {
              if (report.segment !== section) return false;
              const matchesSub = subcat.id === 'all' || report.subcategoryId === subcat.id;
              const matchesDist =
                selectedDistrict === 'all' ||
                (report.districtBn && report.districtBn.includes(selectedDistrict)) ||
                (report.districtEn && report.districtEn.toLowerCase().includes(selectedDistrict.toLowerCase()));
              return matchesSub && matchesDist;
            }).length;

            return (
              <FilterChip
                key={subcat.id}
                id={`${section}-filter-subcat-${subcat.id}`}
                label={language === 'bn' ? subcat.nameBn : subcat.nameEn}
                section={section}
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
          id={`${section}-feed-skeleton`}
          ariaLabel={language === 'bn' ? 'প্রতিবেদন লোড হচ্ছে...' : 'Loading reports...'}
        />
      )}

      {!isLoading && fetchError && (
        <div role="alert" className="bg-ui-surface border border-ui-error-border rounded-[var(--radius-card)] p-6 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-ui-error-text mx-auto" aria-hidden="true" />
          <p className="text-[var(--type-fixed-16)] font-semibold text-ui-error-text">
            {language === 'bn' ? 'প্রতিবেদন লোড করা যায়নি।' : "Couldn't load reports."}
          </p>
          <button
            type="button"
            onClick={loadData}
            className="btn-primary-action px-4 py-2 text-[var(--type-fixed-16)] font-semibold rounded-[var(--radius-control)] min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus cursor-pointer"
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
                  ? 'এই উপ-বিভাগ বা এলাকার জন্য বর্তমানে কোনো প্রকাশিত প্রতিবেদন নেই।'
                  : 'There are currently no published reports under this subcategory.'
              }
              actionLabel={language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset filters'}
              onAction={() => {
                setSelectedSubcat('all');
                setSelectedDistrict('all');
              }}
            />
          )}
        </div>
      )}
    </PublicPageContainer>
  );
};
