import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { PublicReportService } from '../services/publicReportService';
import { ReportItem } from '../types/report';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../data/districts';
import { SECTIONS, SectionKey } from '../theme/tokens';
import { ReportCard } from '../components/report/ReportCard';
import { ReportFeedSkeleton, MapExploreSkeleton } from '../components/ui/LoadingSkeleton';
import { MapSectionHeader } from '../components/explore/MapSectionHeader';
import { PublicIncidentMap } from '../components/explore/PublicIncidentMap';
import { DistrictRankingPanel } from '../components/explore/DistrictRankingPanel';
import { RecentAreaReports } from '../components/explore/RecentAreaReports';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { toBanglaDigits } from '../utils/formatters';
import { CategoryIcon } from '../components/branding/CategoryIcon';
import { MapIcon } from '../components/explore/MapIcon';

export const ExplorePage: React.FC = () => {
  const { language } = useApp();
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('map'); // Default to map exploration per user focus
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<SectionKey | 'all'>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');

  const [allReports, setAllReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await PublicReportService.getAll();
      setAllReports(data);
    } catch (err) {
      console.warn('[ExplorePage load error]', err);
      setFetchError('LOAD_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered reports
  const filteredReports: ReportItem[] = useMemo(() => {
    return allReports.filter((r) => {
      // Section filter
      if (selectedSection !== 'all' && r.segment !== selectedSection) {
        return false;
      }
      // Division filter
      if (selectedDivision !== 'all') {
        const foundDist = BANGLADESH_DISTRICTS.find(
          (d) =>
            d.nameEn.toLowerCase() === (r.districtEn || '').toLowerCase().trim() ||
            d.nameBn === r.districtBn ||
            d.id === (r.districtEn || '').toLowerCase().trim()
        );
        const matchDiv =
          foundDist &&
          (foundDist.divisionEn.toLowerCase() === selectedDivision.toLowerCase() ||
            foundDist.divisionBn === selectedDivision ||
            foundDist.divisionId === selectedDivision.toLowerCase());
        if (!matchDiv) return false;
      }
      // District filter
      if (selectedDistrict !== 'all') {
        const matchDist =
          (r.districtEn || '').toLowerCase() === selectedDistrict.toLowerCase() ||
          r.districtBn === selectedDistrict;
        if (!matchDist) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle =
          (r.titleBn && r.titleBn.toLowerCase().includes(q)) ||
          (r.titleEn && r.titleEn.toLowerCase().includes(q));
        const inDesc =
          (r.shortDescriptionBn && r.shortDescriptionBn.toLowerCase().includes(q)) ||
          (r.shortDescriptionEn && r.shortDescriptionEn.toLowerCase().includes(q));
        const inLoc =
          (r.locationBn && r.locationBn.toLowerCase().includes(q)) ||
          (r.locationEn && r.locationEn.toLowerCase().includes(q));
        const inSubject =
          (r.reportedSubject && r.reportedSubject.toLowerCase().includes(q)) ||
          (r.reportedSubjectBn && r.reportedSubjectBn.toLowerCase().includes(q)) ||
          (r.reportedSubjectEn && r.reportedSubjectEn.toLowerCase().includes(q));
        const inId = r.id.toLowerCase().includes(q);

        if (!inTitle && !inDesc && !inLoc && !inSubject && !inId) {
          return false;
        }
      }
      return true;
    });
  }, [allReports, searchQuery, selectedSection, selectedDivision, selectedDistrict]);

  // Available districts filtered by selected division if set
  const availableDistricts = useMemo(() => {
    if (selectedDivision === 'all') return BANGLADESH_DISTRICTS;
    return BANGLADESH_DISTRICTS.filter(
      (d) =>
        d.divisionEn.toLowerCase() === selectedDivision.toLowerCase() ||
        d.divisionBn === selectedDivision ||
        d.divisionId === selectedDivision.toLowerCase()
    );
  }, [selectedDivision]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSection('all');
    setSelectedDivision('all');
    setSelectedDistrict('all');
    setLocationSearchQuery('');
  };

  return (
    <PublicPageContainer id="explore-page-container">
      {/* 1. Header with View Toggle */}
      <MapSectionHeader
        language={language}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* 2. Map Controls (Search, Categories, Location Search) */}
      <div className="space-y-3 pb-3 border-b border-subtle">
        {/* Search Bar, Division and District Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* Main Keyword Search */}
          <div className="sm:col-span-2 lg:col-span-6 relative flex items-center">
            <MapIcon name="search" size="sm" className="text-muted absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'এলাকা বা প্রতিবেদন খুঁজুন...'
                  : 'Search by area or report...'
              }
              className="w-full pl-10 pr-9 py-2 bg-surface border border-subtle focus:border-theme rounded-xl text-[14px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[40px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-muted hover:text-primary cursor-pointer p-1"
              >
                <MapIcon name="close" size="xs" />
              </button>
            )}
          </div>

          {/* Division Dropdown */}
          <div className="sm:col-span-1 lg:col-span-3 relative flex items-center">
            <select
              value={selectedDivision}
              onChange={(e) => {
                setSelectedDivision(e.target.value);
                setSelectedDistrict('all'); // reset district when division changes
              }}
              className="w-full px-3.5 py-2 bg-surface border border-subtle focus:border-theme rounded-xl text-[14px] text-primary min-h-[40px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] truncate"
            >
              <option value="all">
                {language === 'bn' ? 'সকল বিভাগ' : 'All Divisions'}
              </option>
              {DIVISIONS.map((div) => (
                <option key={div.id} value={div.nameEn}>
                  {language === 'bn' ? div.nameBn : div.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* District Dropdown */}
          <div className="sm:col-span-1 lg:col-span-3 relative flex items-center">
            <MapIcon name="map-pin" size="sm" className="text-muted absolute left-3.5 pointer-events-none" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-surface border border-subtle focus:border-theme rounded-xl text-[14px] text-primary min-h-[40px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] truncate"
            >
              <option value="all">
                {language === 'bn' ? 'সকল জেলা' : 'All Districts'}
              </option>
              {availableDistricts.map((d) => (
                <option key={d.id} value={d.nameEn}>
                  {language === 'bn' ? `${d.nameBn} (${d.divisionBn})` : `${d.nameEn} (${d.divisionEn})`}
                </option>
              ))}
            </select>
            {selectedDistrict !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedDistrict('all')}
                title={language === 'bn' ? 'জেলা মুছুন' : 'Clear district'}
                className="absolute right-3 text-muted hover:text-primary cursor-pointer p-1"
              >
                <MapIcon name="close" size="xs" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedSection('all')}
            className={`px-3.5 py-1.5 rounded-xl text-[13px] font-semibold shrink-0 cursor-pointer border transition-all min-h-[34px] ${
              selectedSection === 'all'
                ? 'bg-primary text-white dark:text-slate-900 border-primary shadow-xs font-bold'
                : 'bg-surface hover:bg-surface-subtle border-subtle text-secondary'
            }`}
          >
            {language === 'bn' ? 'সব' : 'All'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedSection('harassment')}
            className={`px-3.5 py-1.5 rounded-xl text-[13px] font-semibold shrink-0 cursor-pointer border transition-all flex items-center gap-1.5 min-h-[34px] ${
              selectedSection === 'harassment'
                ? 'bg-[var(--sec-harassment-bg)] text-[var(--sec-harassment-text)] border-[var(--sec-harassment-border)] shadow-xs font-bold ring-1 ring-[var(--sec-harassment-border)]'
                : 'bg-surface hover:bg-surface-subtle border-subtle text-secondary'
            }`}
          >
            <CategoryIcon section="harassment" size="xs" />
            <span>{language === 'bn' ? SECTIONS.harassment.shortNameBn : SECTIONS.harassment.shortNameEn}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSection('rickshaw')}
            className={`px-3.5 py-1.5 rounded-xl text-[13px] font-semibold shrink-0 cursor-pointer border transition-all flex items-center gap-1.5 min-h-[34px] ${
              selectedSection === 'rickshaw'
                ? 'bg-[var(--sec-rickshaw-bg)] text-[var(--sec-rickshaw-text)] border-[var(--sec-rickshaw-border)] shadow-xs font-bold ring-1 ring-[var(--sec-rickshaw-border)]'
                : 'bg-surface hover:bg-surface-subtle border-subtle text-secondary'
            }`}
          >
            <CategoryIcon section="rickshaw" size="xs" />
            <span>{language === 'bn' ? SECTIONS.rickshaw.shortNameBn : SECTIONS.rickshaw.shortNameEn}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSection('extortion')}
            className={`px-3.5 py-1.5 rounded-xl text-[13px] font-semibold shrink-0 cursor-pointer border transition-all flex items-center gap-1.5 min-h-[34px] ${
              selectedSection === 'extortion'
                ? 'bg-[var(--sec-extortion-bg)] text-[var(--sec-extortion-text)] border-[var(--sec-extortion-border)] shadow-xs font-bold ring-1 ring-[var(--sec-extortion-border)]'
                : 'bg-surface hover:bg-surface-subtle border-subtle text-secondary'
            }`}
          >
            <CategoryIcon section="extortion" size="xs" />
            <span>{language === 'bn' ? SECTIONS.extortion.shortNameBn : SECTIONS.extortion.shortNameEn}</span>
          </button>

          {(searchQuery || selectedSection !== 'all' || selectedDistrict !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[12px] font-semibold text-secondary hover:text-primary underline ml-auto shrink-0 cursor-pointer px-2 py-1"
            >
              {language === 'bn' ? 'রিসেট' : 'Reset'}
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton States */}
      {isLoading && (
        viewMode === 'map' ? (
          <MapExploreSkeleton
            id="explore-map-skeleton"
            ariaLabel={language === 'bn' ? 'মানচিত্র ও এলাকাভিত্তিক তথ্য লোড হচ্ছে...' : 'Loading map and area insights...'}
          />
        ) : (
          <ReportFeedSkeleton
            count={4}
            id="explore-feed-skeleton"
            ariaLabel={language === 'bn' ? 'প্রতিবেদন লোড হচ্ছে...' : 'Loading reports...'}
          />
        )
      )}

      {/* Error State */}
      {!isLoading && fetchError && (
        <div className="bg-surface border border-rose-500/30 rounded-xl p-8 text-center space-y-4">
          <MapIcon name="alert-circle" size="xl" className="text-rose-500 mx-auto" />
          <p className="text-[15px] font-semibold text-rose-500">
            {language === 'bn'
              ? 'তথ্য লোড করতে সমস্যা হয়েছে।'
              : 'Unable to load explore reports. Please try again.'}
          </p>
          <button
            onClick={loadData}
            className="btn-primary-action px-4 py-2 rounded-xl text-[14px] font-semibold min-h-[40px]"
          >
            {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      )}

      {/* Main View Area */}
      {!isLoading && !fetchError && (
        <>
          {viewMode === 'map' ? (
            <div className="space-y-6">
              {/* Map & District Ranking Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* 1. Interactive Map (Left/Main on Desktop, Top on Mobile) */}
                <div className="lg:col-span-8 w-full">
                  <PublicIncidentMap
                    reports={filteredReports}
                    language={language}
                    selectedSection={selectedSection}
                    selectedDistrict={selectedDistrict}
                    onSelectDistrict={setSelectedDistrict}
                    onCenterChange={setSelectedDistrict}
                  />
                </div>

                {/* 2. District Ranking Panel (Right on Desktop, Below Map on Mobile) */}
                <div className="lg:col-span-4 w-full">
                  <DistrictRankingPanel
                    reports={filteredReports}
                    selectedDistrict={selectedDistrict}
                    onSelectDistrict={setSelectedDistrict}
                    language={language}
                    selectedSection={selectedSection}
                  />
                </div>
              </div>

              {/* 3. Recent Area Reports Section (Below Map & Ranking) */}
              <RecentAreaReports
                reports={filteredReports}
                selectedDistrict={selectedDistrict}
                selectedSection={selectedSection}
                language={language}
              />
            </div>
          ) : (
            /* Feed / List View */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-[13px] text-muted font-medium">
                <span>
                  {language === 'bn'
                    ? `${toBanglaDigits(filteredReports.length)}টি প্রকাশিত প্রতিবেদন`
                    : `${filteredReports.length} published reports`}
                </span>
                {(searchQuery || selectedSection !== 'all' || selectedDistrict !== 'all') && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-secondary hover:text-primary font-semibold underline cursor-pointer"
                  >
                    {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
                  </button>
                )}
              </div>

              {filteredReports.length > 0 ? (
                <div className="space-y-3">
                  {filteredReports.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              ) : (
                <div className="bg-surface border border-subtle rounded-2xl p-10 text-center space-y-3">
                  <MapIcon name="alert-circle" size="xl" className="text-muted mx-auto" />
                  <h3 className="text-[16px] font-bold text-primary">
                    {language === 'bn' ? 'কোনো প্রতিবেদন পাওয়া যায়নি' : 'No Reports Found'}
                  </h3>
                  <p className="text-[13px] text-muted max-w-sm mx-auto leading-relaxed">
                    {language === 'bn'
                      ? 'আপনার অনুসন্ধানের সাথে মিলে এমন কোনো ফলাফল নেই। ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।'
                      : 'No reports matched your search filters. Try adjusting keywords or category filters.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </PublicPageContainer>
  );
};

export default ExplorePage;

