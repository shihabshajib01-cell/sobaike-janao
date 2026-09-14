import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { PublicReportService } from '../services/publicReportService';
import { ReportItem } from '../types/report';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../data/districts';
import { SECTIONS, SectionKey } from '../theme/tokens';
import { ReportCard } from '../components/report/ReportCard';
import { ReportFeedSkeleton, MapExploreSkeleton } from '../components/ui/LoadingSkeleton';
import type { ExploreViewMode } from '../components/explore/MapSectionHeader';
import { PublicIncidentMap } from '../components/explore/PublicIncidentMap';
import { DistrictRankingPanel } from '../components/explore/DistrictRankingPanel';
import { RecentAreaReports } from '../components/explore/RecentAreaReports';
import { ReportAnalyticsOverview } from '../components/explore/ReportAnalyticsOverview';
import { ReportSubcategoryBreakdown } from '../components/explore/ReportSubcategoryBreakdown';
import { ReportActivityTimeline } from '../components/explore/ReportActivityTimeline';
import { ReportGeographicBreakdown } from '../components/explore/ReportGeographicBreakdown';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { toBanglaDigits } from '../utils/formatters';
import { CategoryIcon } from '../components/branding/CategoryIcon';
import { MapIcon } from '../components/explore/MapIcon';

export const ExplorePage: React.FC = () => {
  const { language } = useApp();
  // Default to 'heatmap' mode per product direction
  const [viewMode, setViewMode] = useState<ExploreViewMode>('heatmap');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<SectionKey | 'all'>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

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

  // Shared Filtered Reports - single source of truth for both Heatmap and Reports modes
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
          r.districtBn === selectedDistrict ||
          (r.districtEn || '').toLowerCase() === selectedDistrict.trim().toLowerCase();
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
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedSection !== 'all' ||
    selectedDivision !== 'all' ||
    selectedDistrict !== 'all';

  // Active filter canonical display helpers
  const activeDivisionName = useMemo(() => {
    if (selectedDivision === 'all') return null;
    const divObj = DIVISIONS.find(
      (d) =>
        d.nameEn.toLowerCase() === selectedDivision.toLowerCase() ||
        d.nameBn === selectedDivision ||
        d.id === selectedDivision.toLowerCase()
    );
    if (language === 'bn') {
      return divObj ? `${divObj.nameBn} বিভাগ` : `${selectedDivision} বিভাগ`;
    }
    return divObj ? `${divObj.nameEn} Division` : `${selectedDivision} Division`;
  }, [selectedDivision, language]);

  const activeDistrictName = useMemo(() => {
    if (selectedDistrict === 'all') return null;
    const distObj = BANGLADESH_DISTRICTS.find(
      (d) =>
        d.nameEn.toLowerCase() === selectedDistrict.toLowerCase() ||
        d.nameBn === selectedDistrict ||
        d.id === selectedDistrict.toLowerCase()
    );
    if (language === 'bn') {
      return distObj ? `${distObj.nameBn} জেলা` : `${selectedDistrict} জেলা`;
    }
    return distObj ? distObj.nameEn : selectedDistrict;
  }, [selectedDistrict, language]);

  const activeCategoryName = useMemo(() => {
    if (selectedSection === 'all') return null;
    const sectionObj = SECTIONS[selectedSection as SectionKey];
    if (!sectionObj) return null;
    return language === 'bn' ? sectionObj.shortNameBn : sectionObj.shortNameEn;
  }, [selectedSection, language]);

  // Dynamic Answer Heading computation
  const dynamicAnswerHeading = useMemo(() => {
    const categoryObj = selectedSection !== 'all' ? SECTIONS[selectedSection as SectionKey] : null;
    const catName = categoryObj ? (language === 'bn' ? categoryObj.nameBn : categoryObj.nameEn) : null;

    const districtObj = selectedDistrict !== 'all'
      ? BANGLADESH_DISTRICTS.find(
          (d) =>
            d.nameEn.toLowerCase() === selectedDistrict.toLowerCase() ||
            d.nameBn === selectedDistrict ||
            d.id === selectedDistrict.toLowerCase()
        )
      : null;
    const distName = districtObj ? (language === 'bn' ? districtObj.nameBn : districtObj.nameEn) : selectedDistrict !== 'all' ? selectedDistrict : null;

    const divObj = selectedDivision !== 'all'
      ? DIVISIONS.find(
          (d) =>
            d.nameEn.toLowerCase() === selectedDivision.toLowerCase() ||
            d.nameBn === selectedDivision ||
            d.id === selectedDivision.toLowerCase()
        )
      : null;
    const divName = divObj ? (language === 'bn' ? divObj.nameBn : divObj.nameEn) : selectedDivision !== 'all' ? selectedDivision : null;

    if (language === 'bn') {
      if (distName) {
        if (catName) {
          return `${distName} জেলায় ${catName} প্রতিবেদন`;
        }
        return `${distName} জেলার প্রকাশিত প্রতিবেদন`;
      }
      if (divName) {
        if (catName) {
          return `${divName} বিভাগে ${catName} প্রতিবেদন`;
        }
        return `${divName} বিভাগের প্রকাশিত প্রতিবেদন`;
      }
      if (catName) {
        return `সারা বাংলাদেশের ${catName} প্রতিবেদন`;
      }
      return 'সারা বাংলাদেশের প্রকাশিত প্রতিবেদন';
    } else {
      if (distName) {
        if (catName) {
          return `${catName} reports in ${distName}`;
        }
        return `Published reports in ${distName}`;
      }
      if (divName) {
        if (catName) {
          return `${catName} reports in ${divName} Division`;
        }
        return `Published reports in ${divName} Division`;
      }
      if (catName) {
        return `${catName} reports across Bangladesh`;
      }
      return 'Published reports across Bangladesh';
    }
  }, [selectedSection, selectedDivision, selectedDistrict, language]);

  const countMessage = language === 'bn'
    ? `${toBanglaDigits(filteredReports.length)}টি প্রকাশিত প্রতিবেদন পাওয়া গেছে`
    : `${filteredReports.length} published reports found`;

  return (
    <PublicPageContainer id="explore-page-container">
      {/* 1. Page Title & Context */}
      <div className="space-y-0.5 pb-1">
        <h1 className="text-[24px] md:text-[28px] leading-[1.3] font-bold text-ui-content-primary tracking-tight">
          {language === 'bn' ? 'প্রতিবেদন বিশ্লেষণ' : 'Report insights'}
        </h1>
        <p className="text-[14px] md:text-[15px] leading-[1.5] text-ui-content-secondary">
          {language === 'bn'
            ? 'এলাকা অনুযায়ী প্রকাশিত প্রতিবেদন ও বিশ্লেষণ দেখুন'
            : 'Explore published reports and analysis by area'}
        </p>
      </div>

      {/* 2. Control Layer (Find reports) */}
      <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
        <div className="space-y-0.5">
          <h2 className="text-[16px] font-bold text-ui-content-primary">
            {language === 'bn' ? 'প্রতিবেদন খুঁজুন' : 'Find reports'}
          </h2>
          <p className="text-[13px] text-ui-content-secondary">
            {language === 'bn'
              ? 'এলাকা, বিষয় বা শব্দ দিয়ে প্রকাশিত প্রতিবেদন খুঁজুন।'
              : 'Explore published reports by area, topic, or search term.'}
          </p>
        </div>

        {/* Keyword Search, Division and District Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* Main Keyword Search */}
          <div className="sm:col-span-2 lg:col-span-6 relative flex items-center">
            <MapIcon
              name="search"
              size="sm"
              className="text-ui-content-muted absolute left-3.5 pointer-events-none"
              ariaHidden={true}
            />
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
                <MapIcon name="close" size="xs" ariaHidden={true} />
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
                {language === 'bn' ? 'সকল বিভাগ' : 'All divisions'}
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
            <MapIcon
              name="map-pin"
              size="sm"
              className="text-ui-content-muted absolute left-3.5 pointer-events-none"
              ariaHidden={true}
            />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              aria-label={language === 'bn' ? 'জেলা নির্বাচন করুন' : 'Select district'}
              className="w-full pl-10 pr-11 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:border-ui-accent rounded-xl text-[14px] text-ui-content-primary min-h-[44px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus truncate"
            >
              <option value="all">
                {language === 'bn' ? 'সকল জেলা' : 'All districts'}
              </option>
              {availableDistricts.map((d) => (
                <option key={d.id} value={d.nameEn}>
                  {language === 'bn'
                    ? `${d.nameBn} (${d.divisionBn})`
                    : `${d.nameEn} (${d.divisionEn})`}
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
                <MapIcon name="close" size="xs" ariaHidden={true} />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          <button
            type="button"
            aria-pressed={selectedSection === 'all'}
            onClick={() => setSelectedSection('all')}
            className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold shrink-0 cursor-pointer border transition-all min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              selectedSection === 'all'
                ? 'bg-ui-action-bg text-ui-action-text border-ui-action-bg shadow-xs font-bold'
                : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary hover:text-ui-content-primary'
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
                ? 'bg-[var(--sec-harassment-bg)] text-[var(--sec-harassment-text)] border-[var(--sec-harassment-border)] shadow-xs font-bold ring-1 ring-[var(--sec-harassment-border)]'
                : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary hover:text-ui-content-primary'
            }`}
          >
            <CategoryIcon section="harassment" size="xs" />
            <span>
              {language === 'bn'
                ? SECTIONS.harassment.shortNameBn
                : SECTIONS.harassment.shortNameEn}
            </span>
          </button>

          <button
            type="button"
            aria-pressed={selectedSection === 'rickshaw'}
            onClick={() => setSelectedSection('rickshaw')}
            className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold shrink-0 cursor-pointer border transition-all flex items-center gap-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              selectedSection === 'rickshaw'
                ? 'bg-[var(--sec-rickshaw-bg)] text-[var(--sec-rickshaw-text)] border-[var(--sec-rickshaw-border)] shadow-xs font-bold ring-1 ring-[var(--sec-rickshaw-border)]'
                : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary hover:text-ui-content-primary'
            }`}
          >
            <CategoryIcon section="rickshaw" size="xs" />
            <span>
              {language === 'bn'
                ? SECTIONS.rickshaw.shortNameBn
                : SECTIONS.rickshaw.shortNameEn}
            </span>
          </button>

          <button
            type="button"
            aria-pressed={selectedSection === 'extortion'}
            onClick={() => setSelectedSection('extortion')}
            className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold shrink-0 cursor-pointer border transition-all flex items-center gap-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              selectedSection === 'extortion'
                ? 'bg-[var(--sec-extortion-bg)] text-[var(--sec-extortion-text)] border-[var(--sec-extortion-border)] shadow-xs font-bold ring-1 ring-[var(--sec-extortion-border)]'
                : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary hover:text-ui-content-primary'
            }`}
          >
            <CategoryIcon section="extortion" size="xs" />
            <span>
              {language === 'bn'
                ? SECTIONS.extortion.shortNameBn
                : SECTIONS.extortion.shortNameEn}
            </span>
          </button>

          <button
            type="button"
            aria-pressed={selectedSection === 'load_shedding'}
            onClick={() => setSelectedSection('load_shedding')}
            className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold shrink-0 cursor-pointer border transition-all flex items-center gap-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              selectedSection === 'load_shedding'
                ? 'bg-[var(--sec-load_shedding-bg)] text-[var(--sec-load_shedding-text)] border-[var(--sec-load_shedding-border)] shadow-xs font-bold ring-1 ring-[var(--sec-load_shedding-border)]'
                : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary hover:text-ui-content-primary'
            }`}
          >
            <CategoryIcon section="load_shedding" size="xs" />
            <span>
              {language === 'bn'
                ? SECTIONS.load_shedding.shortNameBn
                : SECTIONS.load_shedding.shortNameEn}
            </span>
          </button>
        </div>
      </div>

      {/* 2.5 Active Filter Context Row */}
      {hasActiveFilters && (
        <div
          role="region"
          aria-label={language === 'bn' ? 'সক্রিয় ফিল্টার' : 'Active filters'}
          className="flex flex-wrap items-center gap-2 pt-0.5"
        >
          <span className="text-[13px] font-semibold text-ui-content-secondary mr-1 shrink-0">
            {language === 'bn' ? 'সক্রিয় ফিল্টার:' : 'Active filters:'}
          </span>

          {/* Division Chip */}
          {selectedDivision !== 'all' && activeDivisionName && (
            <span className="inline-flex items-center gap-1 pl-3 pr-0.5 py-0 rounded-lg bg-ui-surface-subtle border border-ui-stroke-subtle text-[13px] font-medium text-ui-content-primary">
              <span>{activeDivisionName}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedDivision('all');
                  setSelectedDistrict('all');
                }}
                aria-label={
                  language === 'bn'
                    ? `${activeDivisionName} ফিল্টার সরান`
                    : `Remove ${activeDivisionName} filter`
                }
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-ui-content-muted hover:text-ui-content-primary rounded-r-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <MapIcon name="close" size="xs" ariaHidden={true} />
              </button>
            </span>
          )}

          {/* District Chip */}
          {selectedDistrict !== 'all' && activeDistrictName && (
            <span className="inline-flex items-center gap-1 pl-3 pr-0.5 py-0 rounded-lg bg-ui-surface-subtle border border-ui-stroke-subtle text-[13px] font-medium text-ui-content-primary">
              <span>{activeDistrictName}</span>
              <button
                type="button"
                onClick={() => setSelectedDistrict('all')}
                aria-label={
                  language === 'bn'
                    ? `${activeDistrictName} ফিল্টার সরান`
                    : `Remove ${activeDistrictName} filter`
                }
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-ui-content-muted hover:text-ui-content-primary rounded-r-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <MapIcon name="close" size="xs" ariaHidden={true} />
              </button>
            </span>
          )}

          {/* Category Chip */}
          {selectedSection !== 'all' && activeCategoryName && (
            <span className="inline-flex items-center gap-1.5 pl-3 pr-0.5 py-0 rounded-lg bg-ui-surface-subtle border border-ui-stroke-subtle text-[13px] font-medium text-ui-content-primary">
              <CategoryIcon section={selectedSection as SectionKey} size="xs" />
              <span>{activeCategoryName}</span>
              <button
                type="button"
                onClick={() => setSelectedSection('all')}
                aria-label={
                  language === 'bn'
                    ? `${activeCategoryName} ফিল্টার সরান`
                    : `Remove ${activeCategoryName} filter`
                }
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-ui-content-muted hover:text-ui-content-primary rounded-r-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <MapIcon name="close" size="xs" ariaHidden={true} />
              </button>
            </span>
          )}

          {/* Search Query Chip */}
          {searchQuery.trim() && (
            <span className="inline-flex items-center gap-1 pl-3 pr-0.5 py-0 rounded-lg bg-ui-surface-subtle border border-ui-stroke-subtle text-[13px] font-medium text-ui-content-primary max-w-full">
              <span className="truncate max-w-[180px] sm:max-w-[240px]">
                {language === 'bn'
                  ? `অনুসন্ধান: “${searchQuery.trim()}”`
                  : `Search: “${searchQuery.trim()}”`}
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={
                  language === 'bn'
                    ? 'অনুসন্ধান ফিল্টার সরান'
                    : 'Remove search filter'
                }
                className="w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center text-ui-content-muted hover:text-ui-content-primary rounded-r-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <MapIcon name="close" size="xs" ariaHidden={true} />
              </button>
            </span>
          )}

          {/* Clear All Button */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="min-h-[44px] px-3 py-2 inline-flex items-center text-[13px] font-semibold text-ui-accent hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus rounded-lg ml-auto sm:ml-1"
          >
            {language === 'bn' ? 'সব মুছুন' : 'Clear all'}
          </button>
        </div>
      )}

      {/* 3. Dynamic Answer & About Data */}
      {!isLoading && !fetchError && (
        <div className="space-y-4 md:space-y-6">
          <div className="bg-ui-surface-subtle border border-ui-stroke-subtle rounded-2xl p-4 space-y-1 shadow-2xs">
            <h3 className="text-[15px] sm:text-[16px] font-bold text-ui-content-primary">
              {dynamicAnswerHeading}
            </h3>
            <p className="text-[13px] font-medium text-ui-content-secondary">
              {countMessage}
            </p>
          </div>

          <details className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-4 text-[13px] text-ui-content-secondary shadow-2xs">
            <summary className="font-semibold text-ui-content-primary cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus">
              {language === 'bn' ? 'এই তথ্য সম্পর্কে' : 'About this data'}
            </summary>
            <p className="mt-2 text-[12px] sm:text-[13px] text-ui-content-muted leading-relaxed">
              {language === 'bn'
                ? 'এখানে সবাইকে জানাও-এ প্রকাশিত নাগরিক প্রতিবেদন বিশ্লেষণ করা হয়েছে। এটি সরকারি অপরাধ পরিসংখ্যান নয় এবং কোনো এলাকার সামগ্রিক নিরাপত্তা বা কোনো অভিযোগের আইনগত সত্যতা নির্ধারণ করে না।'
                : 'This analysis is based on citizen reports published on Sobaike Janao. It is not official crime statistics and does not determine the overall safety of an area or the legal truth of an allegation.'}
            </p>
          </details>
        </div>
      )}

      {/* 4. Map | Reports Mode Switcher */}
      <div
        role="group"
        aria-label={language === 'bn' ? 'ভিউ পরিবর্তন' : 'View mode switcher'}
        className="flex items-center bg-ui-surface-subtle p-1 rounded-xl border border-ui-stroke-subtle w-fit shadow-2xs"
      >
        <button
          type="button"
          aria-pressed={viewMode === 'heatmap'}
          onClick={() => setViewMode('heatmap')}
          className={`px-4 py-2 rounded-lg text-[14px] font-semibold flex items-center gap-2 transition-all cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
            viewMode === 'heatmap'
              ? 'bg-ui-surface text-ui-content-primary shadow-2xs font-bold'
              : 'text-ui-content-secondary hover:text-ui-content-primary'
          }`}
        >
          <MapIcon name="flame" size="md" aria-hidden="true" />
          <span>{language === 'bn' ? 'মানচিত্র' : 'Map'}</span>
        </button>

        <button
          type="button"
          aria-pressed={viewMode === 'reports'}
          onClick={() => setViewMode('reports')}
          className={`px-4 py-2 rounded-lg text-[14px] font-semibold flex items-center gap-2 transition-all cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
            viewMode === 'reports'
              ? 'bg-ui-surface text-ui-content-primary shadow-2xs font-bold'
              : 'text-ui-content-secondary hover:text-ui-content-primary'
          }`}
        >
          <MapIcon name="file-text" size="md" aria-hidden="true" />
          <span>{language === 'bn' ? 'প্রতিবেদন' : 'Reports'}</span>
        </button>
      </div>

      {/* Loading Skeleton States */}
      {isLoading && (
        viewMode === 'heatmap' ? (
          <MapExploreSkeleton
            id="explore-map-skeleton"
            ariaLabel={language === 'bn' ? 'মানচিত্র লোড হচ্ছে...' : 'Loading map...'}
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
        <div
          role="alert"
          className="bg-ui-surface border border-ui-error-border rounded-xl p-8 text-center space-y-4 shadow-xs"
        >
          <MapIcon
            name="alert-circle"
            size="xl"
            className="text-ui-error-text mx-auto"
            ariaHidden={true}
          />
          <p className="text-[15px] font-semibold text-ui-error-text">
            {language === 'bn'
              ? 'প্রতিবেদন লোড করা যায়নি।'
              : 'Couldn’t load reports.'}
          </p>
          <button
            type="button"
            onClick={loadData}
            className="btn-primary-action px-4 py-2 rounded-xl text-[14px] font-semibold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus cursor-pointer"
          >
            {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      )}

      {/* 5. Selected Mode Content (Map vs Reports) or Zero Result Recovery */}
      {!isLoading && !fetchError && (
        <>
          {filteredReports.length === 0 ? (
            /* Authoritative Zero-Result Recovery State */
            <div
              role="status"
              className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-8 sm:p-10 text-center space-y-4 shadow-2xs"
            >
              <MapIcon
                name="alert-circle"
                size="xl"
                className="text-ui-content-muted mx-auto"
                ariaHidden={true}
              />
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-[16px] sm:text-[17px] font-bold text-ui-content-primary">
                  {language === 'bn'
                    ? 'এই ফিল্টারে কোনো প্রতিবেদন পাওয়া যায়নি'
                    : 'No reports found for these filters'}
                </h3>
                <p className="text-[13px] sm:text-[14px] text-ui-content-secondary leading-relaxed">
                  {language === 'bn'
                    ? 'অন্য এলাকা বা বিষয় নির্বাচন করুন, অনুসন্ধান পরিবর্তন করুন, অথবা কিছু ফিল্টার সরিয়ে আবার দেখুন।'
                    : 'Try another area or topic, change your search, or remove some filters and try again.'}
                </p>
              </div>
              {hasActiveFilters && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn-primary-action px-4 py-2.5 rounded-xl text-[14px] font-semibold min-h-[44px] cursor-pointer inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shadow-xs"
                  >
                    {language === 'bn' ? 'সব ফিল্টার মুছুন' : 'Clear all filters'}
                  </button>
                </div>
              )}
            </div>
          ) : viewMode === 'heatmap' ? (
            /* MAP VIEW */
            <div className="space-y-4 md:space-y-6">
              {/* Map & District Ranking Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* 1. Truthful Heatmap (Main on Desktop, Top on Mobile) */}
                <div className="lg:col-span-8 w-full">
                  <PublicIncidentMap
                    reports={filteredReports}
                    language={language}
                    selectedSection={selectedSection}
                    selectedDistrict={selectedDistrict}
                    onSelectDistrict={setSelectedDistrict}
                    onResetFilters={handleResetFilters}
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

              {/* 3. Recent Area Reports Contextual Preview (Compact) */}
              <RecentAreaReports
                reports={filteredReports}
                selectedDistrict={selectedDistrict}
                selectedSection={selectedSection}
                language={language}
                onViewAllReports={() => setViewMode('reports')}
              />
            </div>
          ) : (
            /* REPORTS VIEW (Preserves full ReportCard list browsing experience) */
            <div className="space-y-4">
              <ReportAnalyticsOverview
                reports={filteredReports}
                language={language}
              />

              <ReportSubcategoryBreakdown
                reports={filteredReports}
                language={language}
              />

              <ReportActivityTimeline
                reports={filteredReports}
                language={language}
              />

              <ReportGeographicBreakdown
                reports={filteredReports}
                language={language}
              />

              <div className="flex items-center justify-between text-[13px] text-ui-content-muted font-medium">
                <span>
                  {language === 'bn'
                    ? `${toBanglaDigits(filteredReports.length)}টি প্রতিবেদন`
                    : `${filteredReports.length} reports`}
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[13px] font-semibold text-ui-content-secondary hover:text-ui-content-primary underline cursor-pointer px-3 py-2 min-h-[44px] flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus rounded-xl"
                  >
                    {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset filters'}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {filteredReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </PublicPageContainer>
  );
};

export default ExplorePage;
