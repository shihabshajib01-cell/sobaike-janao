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
      <div className="space-y-3 pb-3 border-b border-ui-stroke-subtle">
        {/* Search Bar, Division and District Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* Main Keyword Search */}
          <div className="sm:col-span-2 lg:col-span-6 relative flex items-center">
            <MapIcon name="search" size="sm" className="text-ui-content-muted absolute left-3.5 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={
                language === 'bn'
                  ? 'এলাকা বা প্রতিবেদন খুঁজুন'
                  : 'Search by area or report'
              }
              placeholder={
                language === 'bn'
                  ? 'এলাকা বা প্রতিবেদন খুঁজুন...'
                  : 'Search by area or report...'
              }
              className="w-full pl-10 pr-11 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:border-ui-accent rounded-xl text-[14px] text-ui-content-primary placeholder:text-ui-content-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus min-h-[44px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={language === 'bn' ? 'অনুসন্ধান মুছুন' : 'Clear search'}
                className="absolute right-0.5 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-ui-content-muted hover:text-ui-content-primary rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <MapIcon name="close" size="xs" aria-hidden="true" />
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
              aria-label={language === 'bn' ? 'বিভাগ নির্বাচন করুন' : 'Select division'}
              className="w-full px-3.5 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:border-ui-accent rounded-xl text-[14px] text-ui-content-primary min-h-[44px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus truncate"
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
            <MapIcon name="map-pin" size="sm" className="text-ui-content-muted absolute left-3.5 pointer-events-none" aria-hidden="true" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              aria-label={language === 'bn' ? 'জেলা নির্বাচন করুন' : 'Select district'}
              className="w-full pl-10 pr-11 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:border-ui-accent rounded-xl text-[14px] text-ui-content-primary min-h-[44px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus truncate"
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
                aria-label={language === 'bn' ? 'নির্বাচিত জেলা মুছুন' : 'Clear selected district'}
                title={language === 'bn' ? 'জেলা মুছুন' : 'Clear district'}
                className="absolute right-0.5 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-ui-content-muted hover:text-ui-content-primary rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <MapIcon name="close" size="xs" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            aria-pressed={selectedSection === 'all'}
            onClick={() => setSelectedSection('all')}
            className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold shrink-0 cursor-pointer border transition-all min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              selectedSection === 'all'
                ? 'bg-ui-action-bg text-ui-action-text border-ui-action-bg shadow-xs font-bold'
                : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary'
            }`}
          >
            {language === 'bn' ? 'সব' : 'All'}
          </button>

          <button
            type="button"
            aria-pressed={selectedSection === 'harassment'}
            onClick={() => setSelectedSection('harassment')}
            className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold shrink-0 cursor-pointer border transition-all flex items-center gap-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              selectedSection === 'harassment'
                ? 'bg-sec-harassment-bg text-sec-harassment-text border-sec-harassment-border shadow-xs font-bold ring-1 ring-sec-harassment-border'
                : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary'
            }`}
          >
            <CategoryIcon section="harassment" size="xs" />
            <span>{language === 'bn' ? SECTIONS.harassment.shortNameBn : SECTIONS.harassment.shortNameEn}</span>
          </button>

          <button
            type="button"
            aria-pressed={selectedSection === 'rickshaw'}
            onClick={() => setSelectedSection('rickshaw')}
            className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold shrink-0 cursor-pointer border transition-all flex items-center gap-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              selectedSection === 'rickshaw'
                ? 'bg-sec-rickshaw-bg text-sec-rickshaw-text border-sec-rickshaw-border shadow-xs font-bold ring-1 ring-sec-rickshaw-border'
                : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary'
            }`}
          >
            <CategoryIcon section="rickshaw" size="xs" />
            <span>{language === 'bn' ? SECTIONS.rickshaw.shortNameBn : SECTIONS.rickshaw.shortNameEn}</span>
          </button>

          <button
            type="button"
            aria-pressed={selectedSection === 'extortion'}
            onClick={() => setSelectedSection('extortion')}
            className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold shrink-0 cursor-pointer border transition-all flex items-center gap-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              selectedSection === 'extortion'
                ? 'bg-sec-extortion-bg text-sec-extortion-text border-sec-extortion-border shadow-xs font-bold ring-1 ring-sec-extortion-border'
                : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary'
            }`}
          >
            <CategoryIcon section="extortion" size="xs" />
            <span>{language === 'bn' ? SECTIONS.extortion.shortNameBn : SECTIONS.extortion.shortNameEn}</span>
          </button>

          <button
            type="button"
            aria-pressed={selectedSection === 'load_shedding'}
            onClick={() => setSelectedSection('load_shedding')}
            className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold shrink-0 cursor-pointer border transition-all flex items-center gap-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              selectedSection === 'load_shedding'
                ? 'bg-sec-load_shedding-bg text-sec-load_shedding-text border-sec-load_shedding-border shadow-xs font-bold ring-1 ring-sec-load_shedding-border'
                : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary'
            }`}
          >
            <CategoryIcon section="load_shedding" size="xs" />
            <span>{language === 'bn' ? SECTIONS.load_shedding.shortNameBn : SECTIONS.load_shedding.shortNameEn}</span>
          </button>

          {(searchQuery || selectedSection !== 'all' || selectedDistrict !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[13px] font-semibold text-ui-content-secondary underline ml-auto shrink-0 cursor-pointer px-3 py-2 min-h-[44px] flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus rounded-xl"
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
        <div role="alert" className="bg-ui-surface border border-ui-error-border rounded-xl p-8 text-center space-y-4">
          <MapIcon name="alert-circle" size="xl" className="text-ui-error-text mx-auto" ariaHidden={true} />
          <p className="text-[15px] font-semibold text-ui-error-text">
            {language === 'bn'
              ? 'তথ্য লোড করতে সমস্যা হয়েছে।'
              : 'Unable to load explore reports. Please try again.'}
          </p>
          <button
            type="button"
            onClick={loadData}
            className="btn-primary-action px-4 py-2 rounded-xl text-[14px] font-semibold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus cursor-pointer"
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
              <div className="flex items-center justify-between text-[13px] text-ui-content-muted font-medium">
                <span>
                  {language === 'bn'
                    ? `${toBanglaDigits(filteredReports.length)}টি প্রকাশিত প্রতিবেদন`
                    : `${filteredReports.length} published reports`}
                </span>
                {(searchQuery || selectedSection !== 'all' || selectedDistrict !== 'all') && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[13px] font-semibold text-ui-content-secondary underline cursor-pointer px-3 py-2 min-h-[44px] flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus rounded-xl"
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
                <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-10 text-center space-y-3">
                  <MapIcon name="alert-circle" size="xl" className="text-ui-content-muted mx-auto" />
                  <h3 className="text-[16px] font-bold text-ui-content-primary">
                    {language === 'bn' ? 'কোনো প্রতিবেদন পাওয়া যায়নি' : 'No Reports Found'}
                  </h3>
                  <p className="text-[13px] text-ui-content-muted max-w-sm mx-auto leading-relaxed">
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

