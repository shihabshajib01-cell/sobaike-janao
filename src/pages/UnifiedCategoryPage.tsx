import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { SectionKey, SECTIONS } from '../theme/tokens';
import { PublicReportService } from '../services/publicReportService';
import { useTaxonomy } from '../services/taxonomyService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { LocationSelector } from '../components/feed/LocationSelector';
import { FilterChip } from '../components/ui/FilterChip';
import { EmptyState } from '../components/ui/EmptyState';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { CategoryIcon } from '../components/branding/CategoryIcon';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { VisitorSessionService } from '../services/visitorSessionService';

export type UnifiedCategorySection =
  | 'public_safety'
  | 'road_transport'
  | 'illegal_occupation';

export interface UnifiedCategoryPageProps {
  section: UnifiedCategorySection;
}

export const UnifiedCategoryPage: React.FC<UnifiedCategoryPageProps> = ({ section }) => {
  const { language, openReportComposer, browseLocation, browseLocationStatus } = useApp();
  const { getFeedSubcategories, getSegment } = useTaxonomy();
  const config = getSegment(section) || SECTIONS[section];

  const [selectedSubcat, setSelectedSubcat] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    } catch (error) {
      console.warn(`[UnifiedCategoryPage:${section}] load error`, error);
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
      const matchesSubcategory =
        selectedSubcat === 'all' || report.subcategoryId === selectedSubcat;
      const matchesDistrict =
        selectedDistrict === 'all' ||
        (report.districtBn || '').includes(selectedDistrict) ||
        (report.districtEn || '').toLowerCase().includes(selectedDistrict.toLowerCase());
      return matchesSubcategory && matchesDistrict;
    });
  }, [reports, section, selectedSubcat, selectedDistrict]);

  return (
    <PublicPageContainer id={`${section.replace(/_/g, '-')}-page-container`}>
      <section
        className="rounded-2xl border p-5 sm:p-6 md:p-7 space-y-4 shadow-2xs"
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0"
              style={{
                backgroundColor: config.bgColor,
                borderColor: config.borderColor,
                color: config.textColor,
              }}
            >
              <CategoryIcon section={section} size="lg" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[24px] sm:text-[28px] font-bold leading-tight text-ui-content-primary">
                {language === 'bn' ? config.nameBn : config.nameEn}
              </h1>
              <p className="text-[14px] sm:text-[15px] leading-relaxed text-ui-content-secondary mt-1.5 max-w-[620px]">
                {language === 'bn' ? config.descriptionBn : config.descriptionEn}
              </p>
            </div>
          </div>

          <Button
            id={`${section.replace(/_/g, '-')}-report-cta`}
            variant="primary"
            size="md"
            onClick={() => openReportComposer(section)}
            className="shrink-0 min-h-[44px]"
          >
            {language === 'bn' ? 'ঘটনা জানান' : 'Report incident'}
          </Button>
        </div>
      </section>

      <section id={`${section}-filter-section`} className="space-y-3">
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

          <div className="shrink-0">
            <LocationSelector
              selectedDistrict={selectedDistrict}
              onSelectDistrict={setSelectedDistrict}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {subcategories.map((subcategory) => {
            const count = reports.filter((report) => {
              if (report.segment !== section) return false;
              const matchesSubcategory =
                subcategory.id === 'all' || report.subcategoryId === subcategory.id;
              const matchesDistrict =
                selectedDistrict === 'all' ||
                (report.districtBn || '').includes(selectedDistrict) ||
                (report.districtEn || '').toLowerCase().includes(selectedDistrict.toLowerCase());
              return matchesSubcategory && matchesDistrict;
            }).length;

            return (
              <FilterChip
                key={subcategory.id}
                id={`${section}-filter-${subcategory.id}`}
                label={language === 'bn' ? subcategory.nameBn : subcategory.nameEn}
                section={section as SectionKey}
                selected={selectedSubcat === subcategory.id}
                count={isLoading ? undefined : count}
                onClick={() => setSelectedSubcat(subcategory.id)}
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
                  ? 'এই অভিযোগের ধরন বা এলাকার জন্য বর্তমানে কোনো প্রকাশিত প্রতিবেদন নেই।'
                  : 'There are currently no published reports for this complaint type or area.'
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
