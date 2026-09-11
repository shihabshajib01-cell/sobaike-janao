import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { SECTIONS } from '../theme/tokens';
import { PublicReportService } from '../services/publicReportService';
import { useTaxonomy } from '../services/taxonomyService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { LocationSelector } from '../components/feed/LocationSelector';
import { EmptyState } from '../components/ui/EmptyState';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { CategoryHeroSlider } from '../components/category/CategoryHeroSlider';
import { useApp } from '../context/AppContext';

export const RickshawPage: React.FC = () => {
  const { language } = useApp();
  const { getSegment } = useTaxonomy();
  const config = getSegment('rickshaw') || SECTIONS.rickshaw;

  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await PublicReportService.getBySegment('rickshaw');
      setReports(data);
    } catch (err) {
      console.warn('[RickshawPage load error]', err);
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
      if (r.segment !== 'rickshaw') return false;
      const matchesDistrict =
        selectedDistrict === 'all' ||
        (r.districtBn && r.districtBn.includes(selectedDistrict)) ||
        (r.districtEn && r.districtEn.toLowerCase().includes(selectedDistrict.toLowerCase()));
      return matchesDistrict;
    });
  }, [reports, selectedDistrict]);

  return (
    <PublicPageContainer id="rickshaw-page-container">
      {/* 1. Category Hero Slider */}
      <CategoryHeroSlider
        id="rickshaw-header-banner"
        section="rickshaw"
        slides={[
          {
            id: 'rickshaw-primary',
            titleBn: config.nameBn,
            titleEn: config.nameEn,
            descriptionBn: config.descriptionBn,
            descriptionEn: config.descriptionEn,
          },
        ]}
      />

      {/* Quiet Information Strip */}
      <div className="flex items-center gap-2 text-[13px] sm:text-[14px] text-ui-content-secondary bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-left">
        <Info className="w-4 h-4 text-ui-content-muted shrink-0" aria-hidden="true" />
        <span>
          {language === 'bn'
            ? 'অবৈধ বা ঝুঁকিপূর্ণ অটোরিকশা চার্জিং স্টেশনের অবস্থান ও তথ্য জানান।'
            : 'Report details and location of illegal or unsafe auto-rickshaw charging stations.'}
        </span>
      </div>

      {/* 2. Location Filter Controls */}
      <section id="rickshaw-filter-section" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ui-stroke-subtle pb-3">
          <div>
            <h2 className="text-[18px] font-bold text-ui-content-primary">
              {language === 'bn' ? 'চার্জিং স্টেশন প্রতিবেদনসমূহ' : 'Charging Station Reports'}
            </h2>
            <p className="text-[14px] text-ui-content-muted">
              {language === 'bn'
                ? `${filteredReports.length}টি প্রকাশিত প্রতিবেদন পাওয়া গেছে`
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
      </section>

      {/* 3. Loading State Skeleton Screen */}
      {isLoading && (
        <ReportFeedSkeleton
          count={3}
          id="rickshaw-feed-skeleton"
          ariaLabel={language === 'bn' ? 'প্রতিবেদন লোড হচ্ছে...' : 'Loading reports...'}
        />
      )}

      {/* 4. Error State */}
      {!isLoading && fetchError && (
        <div role="alert" className="bg-ui-surface border border-ui-error-border rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-ui-error-text mx-auto" aria-hidden="true" />
          <p className="text-[16px] font-semibold text-ui-error-text">
            {language === 'bn'
              ? 'তথ্য লোড করতে ত্রুটি হয়েছে।'
              : 'Failed to load rickshaw reports. Please try again.'}
          </p>
          <button
            type="button"
            onClick={loadData}
            className="btn-primary-action px-4 py-2 text-[16px] font-semibold rounded-xl min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus cursor-pointer"
          >
            {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
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
              title={language === 'bn' ? 'কোনো প্রতিবেদন পাওয়া যায়নি' : 'No Reports Found'}
              description={
                language === 'bn'
                  ? 'এই উপ-বিভাগ বা এলাকার জন্য বর্তমানে কোনো প্রকাশিত প্রতিবেদন নেই।'
                  : 'There are currently no published reports under this subcategory.'
              }
              actionLabel={language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
              onAction={() => {
                setSelectedDistrict('all');
              }}
            />
          )}
        </div>
      )}
    </PublicPageContainer>
  );
};
