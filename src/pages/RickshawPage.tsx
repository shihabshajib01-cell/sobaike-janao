import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Zap, PlusCircle, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { SECTIONS } from '../theme/tokens';
import { PublicReportService } from '../services/publicReportService';
import { useTaxonomy } from '../services/taxonomyService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { LocationSelector } from '../components/feed/LocationSelector';
import { FilterChip } from '../components/ui/FilterChip';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
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
      {/* 1. Standard Type A Section Header */}
      <section
        id="rickshaw-header-banner"
        className="bg-surface border border-subtle rounded-2xl p-4 sm:p-5 md:p-7 space-y-3.5 md:space-y-4 shadow-2xs"
      >
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--sec-rickshaw-bg)',
                color: 'var(--sec-rickshaw-primary)',
              }}
            >
              <Zap className="w-4 h-4" />
            </div>
            <span
              className="text-[13px] sm:text-[14px] font-semibold"
              style={{ color: 'var(--sec-rickshaw-text)' }}
            >
              {language === 'bn' ? config.shortNameBn : config.shortNameEn}
            </span>
          </div>

          <h1 className="text-[24px] md:text-[32px] leading-[1.3] md:leading-[42px] font-bold text-primary tracking-tight">
            {language === 'bn' ? config.nameBn : config.nameEn}
          </h1>

          <p className="text-[16px] leading-[1.6] md:leading-[26px] text-secondary">
            {language === 'bn' ? config.descriptionBn : config.descriptionEn}
          </p>
        </div>

        {/* Quiet Information Strip */}
        <div className="flex items-center gap-2 text-[13px] sm:text-[14px] text-secondary bg-surface-subtle border border-subtle rounded-xl px-3 sm:px-3.5 py-2 sm:py-2.5 text-left">
          <Info className="w-4 h-4 text-muted shrink-0" />
          <span>
            {language === 'bn'
              ? 'অবৈধ বা ঝুঁকিপূর্ণ অটোরিকশা চার্জিং স্টেশনের অবস্থান ও তথ্য জানান।'
              : 'Report details and location of illegal or unsafe auto-rickshaw charging stations.'}
          </span>
        </div>
      </section>

      {/* 2. Location Filter Controls */}
      <section id="rickshaw-filter-section" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle pb-3">
          <div>
            <h2 className="text-[18px] font-bold text-primary">
              {language === 'bn' ? 'চার্জিং স্টেশন প্রতিবেদনসমূহ' : 'Charging Station Reports'}
            </h2>
            <p className="text-[14px] text-muted">
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
        <div className="bg-surface border border-rose-500/30 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-[16px] font-semibold text-rose-500">
            {language === 'bn'
              ? 'তথ্য লোড করতে ত্রুটি হয়েছে।'
              : 'Failed to load rickshaw reports. Please try again.'}
          </p>
          <button
            onClick={loadData}
            className="btn-primary-action px-4 py-2 text-[16px] font-semibold rounded-xl min-h-[44px]"
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
