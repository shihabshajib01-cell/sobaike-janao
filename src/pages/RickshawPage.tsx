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
  const { language, openReportComposer } = useApp();
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
            titleBn: 'ঝুঁকিপূর্ণ চার্জিং',
            titleEn: 'Unsafe Charging',
            mobileDescriptionBn: 'ব্যাটারি • তার • চার্জিং',
            mobileDescriptionEn: 'Batteries • wiring • charging',
            descriptionBn: 'অনিরাপদ ব্যাটারি চার্জিং ও ঝুঁকিপূর্ণ সংযোগ।',
            descriptionEn: 'Unsafe battery charging and risky connections.',
            desktopDescriptionBn: 'অনিরাপদ ব্যাটারি চার্জিং স্টেশন, খোলা তার, অতিরিক্ত লোড বা অন্যান্য বৈদ্যুতিক ঝুঁকির তথ্য জানান।',
            desktopDescriptionEn: 'Report unsafe battery charging stations, exposed wiring, overloaded connections, or other electrical risks.',
            illustrationSrc: '/illustrations/services/rickshaw-hero-illegal-charging-station-v02.jpeg',
            action: {
              labelBn: 'রিপোর্ট করুন',
              labelEn: 'Report now',
              onClick: () => openReportComposer('rickshaw'),
            },
          },
        ]}
      />

      {/* Quiet Information Strip */}
      <div className="flex items-center gap-2 text-[13px] sm:text-[14px] text-ui-content-secondary bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-left">
        <Info className="w-4 h-4 text-ui-content-muted shrink-0" aria-hidden="true" />
        <span>
          {language === 'bn'
            ? 'অবৈধ বা ঝুঁকিপূর্ণ চার্জিং স্টেশনের অবস্থান ও তথ্য দিন।'
            : 'Share the location and details of illegal or unsafe charging stations.'}
        </span>
      </div>

      {/* 2. Location Filter Controls */}
      <section id="rickshaw-filter-section" className="space-y-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3 border-b border-ui-stroke-subtle pb-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] sm:text-[20px] font-bold leading-[1.3] text-ui-content-primary">
              {language === 'bn'
                ? 'সকল প্রতিবেদন'
                : 'All reports'}
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
              title={language === 'bn' ? 'কোনো প্রতিবেদন পাওয়া যায়নি' : 'No reports found'}
              description={
                language === 'bn'
                  ? 'এই উপ-বিভাগ বা এলাকার জন্য বর্তমানে কোনো প্রকাশিত প্রতিবেদন নেই।'
                  : 'There are currently no published reports under this subcategory.'
              }
              actionLabel={language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset filters'}
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
