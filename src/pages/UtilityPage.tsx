import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { SECTIONS } from '../theme/tokens';
import { PublicReportService } from '../services/publicReportService';
import { useTaxonomy } from '../services/taxonomyService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { LocationSelector } from '../components/feed/LocationSelector';
import { FilterChip } from '../components/ui/FilterChip';
import { EmptyState } from '../components/ui/EmptyState';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { CategoryHeroSlider } from '../components/category/CategoryHeroSlider';
import { useApp } from '../context/AppContext';

export const UtilityPage: React.FC = () => {
  const { language, openReportComposer } = useApp();
  const { getFeedSubcategories, getSegment } = useTaxonomy();
  const config = getSegment('load_shedding') || SECTIONS.load_shedding;

  const [selectedSubcat, setSelectedSubcat] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const subcategories = getFeedSubcategories('load_shedding');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await PublicReportService.getBySegment('load_shedding');
      setReports(data);
    } catch (err) {
      console.warn('[UtilityPage load error]', err);
      setFetchError('LOAD_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (r.segment !== 'load_shedding') return false;
      const matchesSubcat = selectedSubcat === 'all' || r.subcategoryId === selectedSubcat;
      const matchesDistrict =
        selectedDistrict === 'all' ||
        (r.districtBn && r.districtBn.includes(selectedDistrict)) ||
        (r.districtEn && r.districtEn.toLowerCase().includes(selectedDistrict.toLowerCase()));
      return matchesSubcat && matchesDistrict;
    });
  }, [reports, selectedSubcat, selectedDistrict]);

  return (
    <PublicPageContainer id="utility-page-container">
      {/* 1. Category Hero Slider */}
      <CategoryHeroSlider
        id="utility-header-banner"
        section="load_shedding"
        slides={[
          {
            id: 'utility-primary',
            titleBn: config.nameBn,
            titleEn: config.nameEn,
            descriptionBn: config.descriptionBn,
            descriptionEn: config.descriptionEn,
            action: {
              labelBn: 'অভিযোগ জানান',
              labelEn: 'File Report',
              onClick: () => openReportComposer('load_shedding'),
            },
          },
        ]}
      />

      {/* Quiet Information Strip */}
      <div className="flex items-center gap-2 text-[13px] sm:text-[14px] text-ui-content-secondary bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-left">
        <Info className="w-4 h-4 text-ui-content-muted shrink-0" aria-hidden="true" />
        <span>
          {language === 'bn'
            ? 'লোডশেডিং, গ্যাস সংকট বা অতিরিক্ত বিদ্যুৎ বিল সংক্রান্ত অভিযোগ জানান।'
            : 'Report load shedding, gas shortages, or excess electricity bills responsibly.'}
        </span>
      </div>

      {/* 2. Subcategory & Location Filter Controls */}
      <section id="utility-filter-section" className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-ui-stroke-subtle pb-3">
          <div>
            <h2 className="text-[16px] font-bold text-ui-content-primary">
              {language === 'bn' ? 'অভিযোগের ধরন অনুসারে ফিল্টার' : 'Filter by Complaint Type'}
            </h2>
            <p className="text-[14px] text-ui-content-muted">
              {language === 'bn'
                ? `${filteredReports.length}টি প্রকাশিত অভিযোগ পাওয়া গেছে`
                : `${filteredReports.length} published reports found`}
            </p>
          </div>

          <div className="shrink-0">
            <LocationSelector
              selectedDistrict={selectedDistrict}
              onSelectDistrict={setSelectedDistrict}
            />
          </div>
        </div>

        {/* Horizontally scrollable subcategory chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {subcategories.map((subcat) => {
            const count = reports.filter((r) => {
              if (r.segment !== 'load_shedding') return false;
              const matchesSub = subcat.id === 'all' || r.subcategoryId === subcat.id;
              const matchesDist =
                selectedDistrict === 'all' || (r.districtBn && r.districtBn.includes(selectedDistrict));
              return matchesSub && matchesDist;
            }).length;

            return (
              <FilterChip
                key={subcat.id}
                id={`filter-subcat-${subcat.id}`}
                label={language === 'bn' ? subcat.nameBn : subcat.nameEn}
                section="load_shedding"
                selected={selectedSubcat === subcat.id}
                count={isLoading ? undefined : count}
                onClick={() => setSelectedSubcat(subcat.id)}
              />
            );
          })}
        </div>
      </section>

      {/* 3. Loading State Skeleton Screen */}
      {isLoading && (
        <ReportFeedSkeleton
          count={3}
          id="utility-feed-skeleton"
          ariaLabel={language === 'bn' ? 'অভিযোগ লোড হচ্ছে...' : 'Loading reports...'}
        />
      )}

      {/* 4. Error State */}
      {!isLoading && fetchError && (
        <div role="alert" className="bg-ui-surface border border-ui-error-border rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-ui-error-text mx-auto" aria-hidden="true" />
          <p className="text-[16px] font-semibold text-ui-error-text">
            {language === 'bn'
              ? 'প্রতিবেদন লোড করা যায়নি।'
              : "Couldn't load reports."}
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

      {/* 5. Reports Feed */}
      {!isLoading && !fetchError && (
        <div className="space-y-3">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))
          ) : (
            <EmptyState
              title={language === 'bn' ? 'কোনো অভিযোগ পাওয়া যায়নি' : 'No Reports Found'}
              description={
                language === 'bn'
                  ? 'এই মুহূর্তে ইউটিলিটি সেবা সংক্রান্ত কোনো প্রকাশিত অভিযোগ নেই। নতুন অভিযোগ জানাতে নিচের বোতামে চাপ দিন।'
                  : 'No utility complaints published yet. Click below to file a report.'
              }
              actionLabel={language === 'bn' ? 'অভিযোগ জানান' : 'File Report'}
              onAction={() => openReportComposer('load_shedding')}
            />
          )}
        </div>
      )}
    </PublicPageContainer>
  );
};
