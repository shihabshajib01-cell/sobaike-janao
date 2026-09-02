import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ShieldAlert, PlusCircle, AlertCircle, RefreshCw, PhoneCall } from 'lucide-react';
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

export const ExtortionPage: React.FC = () => {
  const { language, navigateTo } = useApp();
  const { getFeedSubcategories, getSegment } = useTaxonomy();
  const config = getSegment('extortion') || SECTIONS.extortion;

  const [selectedSubcat, setSelectedSubcat] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const subcategories = getFeedSubcategories('extortion');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await PublicReportService.getBySegment('extortion');
      setReports(data);
    } catch (err) {
      console.warn('[ExtortionPage load error]', err);
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
      if (r.segment !== 'extortion') return false;
      const matchesSubcat = selectedSubcat === 'all' || r.subcategoryId === selectedSubcat;
      const matchesDistrict =
        selectedDistrict === 'all' ||
        (r.districtBn && r.districtBn.includes(selectedDistrict)) ||
        (r.districtEn && r.districtEn.toLowerCase().includes(selectedDistrict.toLowerCase()));
      return matchesSubcat && matchesDistrict;
    });
  }, [reports, selectedSubcat, selectedDistrict]);

  return (
    <PublicPageContainer id="extortion-page-container">
      {/* 1. Standard Type A Section Header */}
      <section
        id="extortion-header-banner"
        className="bg-surface border border-subtle rounded-2xl p-4 sm:p-5 md:p-7 space-y-3.5 md:space-y-4 shadow-2xs"
      >
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--sec-extortion-bg)',
                color: 'var(--sec-extortion-primary)',
              }}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span
              className="text-[13px] sm:text-[14px] font-semibold"
              style={{ color: 'var(--sec-extortion-text)' }}
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
          <PhoneCall className="w-4 h-4 text-muted shrink-0" />
          <span>
            {language === 'bn'
              ? 'জরুরি সহায়তার জন্য ৯৯৯ অথবা নাগরিক তথ্য সেবা ৩৩৩-এ যোগাযোগ করুন।'
              : 'For emergency assistance, contact National Emergency 999 or Citizen Hotline 333.'}
          </span>
        </div>
      </section>

      {/* 2. Subcategory & Location Filter Controls */}
      <section id="extortion-filter-section" className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-subtle pb-3">
          <div>
            <h2 className="text-[16px] font-bold text-primary">
              {language === 'bn' ? 'উপ-বিভাগ অনুসারে ফিল্টার' : 'Filter by Subcategory'}
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

        {/* Horizontally scrollable subcategory chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {subcategories.map((subcat) => {
            const count = reports.filter((r) => {
              if (r.segment !== 'extortion') return false;
              const matchesSub = subcat.id === 'all' || r.subcategoryId === subcat.id;
              const matchesDist =
                selectedDistrict === 'all' || r.districtBn.includes(selectedDistrict);
              return matchesSub && matchesDist;
            }).length;

            return (
              <FilterChip
                key={subcat.id}
                id={`filter-subcat-${subcat.id}`}
                label={language === 'bn' ? subcat.nameBn : subcat.nameEn}
                section="extortion"
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
          id="extortion-feed-skeleton"
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
              : 'Failed to load extortion reports. Please try again.'}
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
