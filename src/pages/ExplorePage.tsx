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
import { Modal } from '../components/ui/Modal';

export const ExplorePage: React.FC = () => {
  const { language } = useApp();
  // Default to 'heatmap' mode per product direction
  const [viewMode, setViewMode] = useState<ExploreViewMode>('heatmap');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<SectionKey | 'all'>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  // Mobile UX Phase 6 Sheet States
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isAreaSheetOpen, setIsAreaSheetOpen] = useState(false);

  // Temporary local draft state for mobile filter sheet
  const [draftSection, setDraftSection] = useState<SectionKey | 'all'>('all');
  const [draftDivision, setDraftDivision] = useState<string>('all');
  const [draftDistrict, setDraftDistrict] = useState<string>('all');

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

  // Responsive resize safety: automatically close mobile sheets when transitioning to tablet/desktop (>= 768px)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsFilterSheetOpen(false);
        setIsAreaSheetOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Base filtered reports - applies Section, Division, and Search filters (ranking context)
  const baseFilteredReports: ReportItem[] = useMemo(() => {
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
  }, [allReports, searchQuery, selectedSection, selectedDivision]);

  // Shared Filtered Reports - single source of truth for Heatmap, Reports modes, and selected area data
  const filteredReports: ReportItem[] = useMemo(() => {
    if (selectedDistrict === 'all') return baseFilteredReports;
    return baseFilteredReports.filter((r) => {
      const matchDist =
        (r.districtEn || '').toLowerCase() === selectedDistrict.toLowerCase() ||
        r.districtBn === selectedDistrict ||
        (r.districtEn || '').toLowerCase() === selectedDistrict.trim().toLowerCase();
      return matchDist;
    });
  }, [baseFilteredReports, selectedDistrict]);

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

  // Available districts filtered by draft division in mobile filter sheet
  const draftAvailableDistricts = useMemo(() => {
    if (draftDivision === 'all') return BANGLADESH_DISTRICTS;
    return BANGLADESH_DISTRICTS.filter(
      (d) =>
        d.divisionEn.toLowerCase() === draftDivision.toLowerCase() ||
        d.divisionBn === draftDivision ||
        d.divisionId === draftDivision.toLowerCase()
    );
  }, [draftDivision]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSection('all');
    setSelectedDivision('all');
    setSelectedDistrict('all');
  };

  const handleOpenFilterSheet = () => {
    setDraftSection(selectedSection);
    setDraftDivision(selectedDivision);
    setDraftDistrict(selectedDistrict);
    setIsAreaSheetOpen(false);
    setIsFilterSheetOpen(true);
  };

  const handleApplyFilterSheet = () => {
    setSelectedSection(draftSection);
    setSelectedDivision(draftDivision);
    setSelectedDistrict(draftDistrict);
    setIsFilterSheetOpen(false);
  };

  const handleClearFilterSheet = () => {
    setDraftSection('all');
    setDraftDivision('all');
    setDraftDistrict('all');
  };

  const handleDraftDivisionChange = (div: string) => {
    setDraftDivision(div);
    setDraftDistrict('all');
  };

  const mobileFilterCount = useMemo(() => {
    let count = 0;
    if (selectedSection !== 'all') count++;
    if (selectedDivision !== 'all') count++;
    if (selectedDistrict !== 'all') count++;
    return count;
  }, [selectedSection, selectedDivision, selectedDistrict]);

  const handleSelectDistrict = useCallback((districtValue: string) => {
    if (!districtValue || districtValue === 'all') {
      setSelectedDistrict('all');
      return;
    }
    const distObj = BANGLADESH_DISTRICTS.find(
      (d) =>
        d.nameEn.toLowerCase() === districtValue.toLowerCase() ||
        d.nameBn === districtValue ||
        d.id === districtValue.toLowerCase()
    );
    if (distObj) {
      setSelectedDivision(distObj.divisionEn);
      setSelectedDistrict(distObj.nameEn);
    } else {
      setSelectedDistrict(districtValue);
    }
  }, []);

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
      {/* 1. Page Title & Context (Compact Spacing) */}
      <div className="space-y-0.5 pb-0.5">
        <h1 className="text-[22px] md:text-[26px] leading-[1.25] font-bold text-ui-content-primary tracking-tight">
          {language === 'bn' ? 'প্রতিবেদন বিশ্লেষণ' : 'Report insights'}
        </h1>
        <p className="text-[13px] md:text-[14px] leading-[1.4] text-ui-content-secondary">
          {language === 'bn'
            ? 'এলাকা অনুযায়ী প্রকাশিত প্রতিবেদন ও বিশ্লেষণ দেখুন'
            : 'Explore published reports and analysis by area'}
        </p>
      </div>

      {/* 2. Control Layer (Find reports - Compact Workbench) */}
      <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-3.5 sm:p-4 md:p-4.5 space-y-3 shadow-2xs">
        <div className="space-y-0.5">
          <h2 className="text-[15px] font-bold text-ui-content-primary">
            {language === 'bn' ? 'প্রতিবেদন খুঁজুন' : 'Find reports'}
          </h2>
          <p className="text-[12px] sm:text-[13px] text-ui-content-secondary">
            {language === 'bn'
              ? 'এলাকা, বিষয় বা শব্দ দিয়ে প্রকাশিত প্রতিবেদন খুঁজুন।'
              : 'Explore published reports by area, topic, or search term.'}
          </p>
        </div>

        {/* Desktop / Tablet Controls (Search, Division, District) */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* Main Keyword Search */}
          <div className="md:col-span-2 lg:col-span-6 relative flex items-center">
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
          <div className="md:col-span-1 lg:col-span-3 relative flex items-center">
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
          <div className="md:col-span-1 lg:col-span-3 relative flex items-center">
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

        {/* Desktop Category Filter Chips */}
        <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none pt-0.5">
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

        {/* Mobile Control Bar (Search Input + Filters Drawer Button) */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile Keyword Search */}
          <div className="flex-1 relative flex items-center min-w-0">
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

          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={handleOpenFilterSheet}
            aria-expanded={isFilterSheetOpen}
            aria-controls="mobile-filter-sheet"
            aria-label={
              language === 'bn'
                ? `ফিল্টার খুলুন${mobileFilterCount > 0 ? ` (${toBanglaDigits(mobileFilterCount)}টি সক্রিয়)` : ''}`
                : `Open filters${mobileFilterCount > 0 ? ` (${mobileFilterCount} active)` : ''}`
            }
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-[14px] font-semibold min-h-[44px] cursor-pointer transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              mobileFilterCount > 0
                ? 'bg-ui-surface-subtle border-ui-accent text-ui-content-primary shadow-2xs font-bold'
                : 'bg-ui-surface border-ui-stroke-subtle text-ui-content-secondary hover:text-ui-content-primary'
            }`}
          >
            <MapIcon name="filter" size="sm" ariaHidden={true} />
            <span>{language === 'bn' ? 'ফিল্টার' : 'Filters'}</span>
            {mobileFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-ui-accent text-ui-action-text text-[11px] font-bold flex items-center justify-center">
                {language === 'bn' ? toBanglaDigits(mobileFilterCount) : mobileFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2.5 Active Filter Context Row */}
      {hasActiveFilters && (
        <div
          role="region"
          aria-label={language === 'bn' ? 'সক্রিয় ফিল্টার' : 'Active filters'}
          className="flex flex-wrap items-center gap-2 pt-0"
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

      {/* 3. Compact Context Strip: Dynamic Answer & Secondary About Data */}
      {!isLoading && !fetchError && (
        <div className="space-y-2">
          {/* Dynamic Result Context */}
          <div className="bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl px-4 py-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
            <h3 className="text-[14px] sm:text-[15px] font-bold text-ui-content-primary leading-snug">
              {dynamicAnswerHeading}
            </h3>
            <p className="text-[13px] font-medium text-ui-content-secondary shrink-0">
              {countMessage}
            </p>
          </div>

          {/* Secondary About This Data Disclosure */}
          <details className="group bg-ui-surface border border-ui-stroke-subtle rounded-xl px-3.5 sm:px-4 py-1 text-[13px] text-ui-content-secondary shadow-2xs">
            <summary className="font-medium text-[13px] text-ui-content-secondary hover:text-ui-content-primary cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus min-h-[44px] flex items-center justify-between gap-2 list-none">
              <span>{language === 'bn' ? 'এই তথ্য সম্পর্কে' : 'About this data'}</span>
              <div className="w-7 h-7 rounded-md bg-ui-surface-subtle border border-ui-stroke-subtle flex items-center justify-center text-ui-content-muted group-hover:text-ui-content-primary shrink-0 transition-transform duration-200 group-open:rotate-180">
                <MapIcon name="chevron-down" size="xs" ariaHidden={true} />
              </div>
            </summary>
            <div className="pt-2 pb-3 border-t border-ui-stroke-subtle mt-1 text-[12px] sm:text-[13px] text-ui-content-muted leading-relaxed">
              {language === 'bn'
                ? 'এখানে সবাইকে জানাও-এ প্রকাশিত নাগরিক প্রতিবেদন বিশ্লেষণ করা হয়েছে। এটি সরকারি অপরাধ পরিসংখ্যান নয় এবং কোনো এলাকার সামগ্রিক নিরাপত্তা বা কোনো অভিযোগের আইনগত সত্যতা নির্ধারণ করে না।'
                : 'This analysis is based on citizen reports published on Sobaike Janao. It is not official crime statistics and does not determine the overall safety of an area or the legal truth of an allegation.'}
            </div>
          </details>
        </div>
      )}

      {/* 4. Map | Reports Mode Switcher (Connected to Workspace) */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div
          role="group"
          aria-label={language === 'bn' ? 'ভিউ পরিবর্তন' : 'View mode switcher'}
          className="flex items-center bg-ui-surface-subtle p-1 rounded-xl border border-ui-stroke-subtle w-fit shadow-2xs"
        >
          <button
            type="button"
            aria-pressed={viewMode === 'heatmap'}
            onClick={() => setViewMode('heatmap')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg text-[13px] sm:text-[14px] font-semibold flex items-center gap-2 transition-all cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
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
            className={`px-3.5 sm:px-4 py-2 rounded-lg text-[13px] sm:text-[14px] font-semibold flex items-center gap-2 transition-all cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              viewMode === 'reports'
                ? 'bg-ui-surface text-ui-content-primary shadow-2xs font-bold'
                : 'text-ui-content-secondary hover:text-ui-content-primary'
            }`}
          >
            <MapIcon name="file-text" size="md" aria-hidden="true" />
            <span>{language === 'bn' ? 'প্রতিবেদন' : 'Reports'}</span>
          </button>
        </div>
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
                    onSelectDistrict={handleSelectDistrict}
                    onResetFilters={handleResetFilters}
                  />
                </div>

                {/* Mobile Selected-Area Trigger Card (Mobile only, when district is selected) */}
                {selectedDistrict !== 'all' && (
                  <div className="block md:hidden w-full">
                    <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle flex items-center justify-center shrink-0 text-ui-content-primary">
                          <MapIcon name="map-pin" size="md" ariaHidden={true} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-bold text-ui-content-primary truncate">
                            {activeDistrictName || selectedDistrict}
                          </h3>
                          <p className="text-[13px] text-ui-content-secondary truncate">
                            {language === 'bn'
                              ? `${toBanglaDigits(filteredReports.length)}টি প্রকাশিত প্রতিবেদন`
                              : `${filteredReports.length} published reports`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsFilterSheetOpen(false);
                          setIsAreaSheetOpen(true);
                        }}
                        aria-label={
                          language === 'bn'
                            ? `${activeDistrictName || selectedDistrict} এলাকার বিস্তারিত দেখুন`
                            : `View details for ${activeDistrictName || selectedDistrict}`
                        }
                        className="btn-primary-action px-3.5 py-2 rounded-xl text-[13px] font-semibold min-h-[44px] flex items-center gap-1.5 shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shadow-2xs"
                      >
                        <span>{language === 'bn' ? 'এলাকার বিস্তারিত' : 'Area details'}</span>
                        <MapIcon name="arrow-right" size="xs" ariaHidden={true} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. District Ranking Panel (Right on Desktop, Below Map on Mobile when no district is selected) */}
                <div className={`w-full lg:col-span-4 ${selectedDistrict !== 'all' ? 'hidden md:block' : 'block'}`}>
                  <DistrictRankingPanel
                    reports={filteredReports}
                    rankingReports={baseFilteredReports}
                    selectedDistrict={selectedDistrict}
                    selectedDivision={selectedDivision}
                    onSelectDistrict={handleSelectDistrict}
                    language={language}
                    selectedSection={selectedSection}
                  />
                </div>
              </div>

              {/* 3. Recent Area Reports Contextual Preview (Desktop always, Mobile only when no district is selected to prevent duplication) */}
              <div className={selectedDistrict !== 'all' ? 'hidden md:block' : 'block'}>
                <RecentAreaReports
                  reports={filteredReports}
                  selectedDistrict={selectedDistrict}
                  selectedSection={selectedSection}
                  language={language}
                  onViewAllReports={() => setViewMode('reports')}
                />
              </div>
            </div>
          ) : (
            /* REPORTS VIEW (UX Phase 5 Progressive Disclosure Hierarchy) */
            <div className="space-y-6">
              {/* 1. Overview */}
              <ReportAnalyticsOverview
                reports={filteredReports}
                language={language}
              />

              {/* 2. Reports in this selection (Evidence / Actual Reports) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ui-stroke-subtle pb-3">
                  <div>
                    <h3 className="text-[17px] md:text-[18px] font-bold text-ui-content-primary">
                      {language === 'bn' ? 'এই নির্বাচনের প্রতিবেদন' : 'Reports in this selection'}
                    </h3>
                    <p className="text-[13px] text-ui-content-secondary mt-0.5">
                      {language === 'bn'
                        ? 'উপরের বিশ্লেষণে এই প্রকাশিত প্রতিবেদনগুলো অন্তর্ভুক্ত করা হয়েছে।'
                        : 'These published reports are included in the analysis above.'}
                    </p>
                  </div>
                  <div className="flex items-center shrink-0">
                    <span className="text-[13px] font-bold text-ui-content-primary font-mono bg-ui-surface-subtle border border-ui-stroke-subtle px-2.5 py-1 rounded-lg">
                      {language === 'bn'
                        ? `${toBanglaDigits(filteredReports.length)}টি প্রকাশিত প্রতিবেদন`
                        : `${filteredReports.length} published reports`}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredReports.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              </div>

              {/* 3. More analysis (Progressive Disclosure) */}
              <details className="group bg-ui-surface border border-ui-stroke-subtle rounded-2xl overflow-hidden transition-all shadow-xs">
                <summary className="w-full flex items-center justify-between p-4 sm:p-5 cursor-pointer list-none select-none min-h-[44px] hover:bg-ui-surface-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MapIcon name="layers" size="md" className="text-ui-content-primary shrink-0" />
                    <div>
                      <h3 className="text-[16px] md:text-[17px] font-bold text-ui-content-primary">
                        {language === 'bn' ? 'আরও বিশ্লেষণ' : 'More analysis'}
                      </h3>
                      <p className="text-[12px] md:text-[13px] text-ui-content-secondary mt-0.5">
                        {language === 'bn'
                          ? 'বিষয়, এলাকা ও সময় অনুযায়ী আরও বিস্তারিত দেখুন।'
                          : 'Explore distribution by topic, geography, and time.'}
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-ui-surface-subtle border border-ui-stroke-subtle flex items-center justify-center text-ui-content-secondary group-hover:text-ui-content-primary shrink-0 transition-transform duration-200 group-open:rotate-180">
                    <MapIcon name="chevron-down" size="sm" ariaHidden={true} />
                  </div>
                </summary>

                <div className="p-4 sm:p-5 pt-0 border-t border-ui-stroke-subtle space-y-4">
                  {/* 1. Subcategory breakdown */}
                  <ReportSubcategoryBreakdown
                    reports={filteredReports}
                    language={language}
                  />

                  {/* 2. Geographic breakdown */}
                  <ReportGeographicBreakdown
                    reports={filteredReports}
                    language={language}
                  />

                  {/* 3. Activity Timeline or Small Dataset Trend Safety Message */}
                  {filteredReports.length <= 2 ? (
                    <div className="bg-ui-surface-subtle border border-ui-stroke-subtle rounded-2xl p-4 sm:p-5 text-left space-y-1">
                      <div className="text-[14px] font-bold text-ui-content-primary">
                        {language === 'bn'
                          ? 'এই নির্বাচনে প্রবণতা দেখানোর মতো পর্যাপ্ত প্রতিবেদন নেই।'
                          : 'There are not enough reports in this selection to show a meaningful trend.'}
                      </div>
                      <div className="text-[12px] md:text-[13px] text-ui-content-secondary">
                        {language === 'bn'
                          ? 'সময়ের সাথে পরিবর্তন অর্থপূর্ণভাবে দেখাতে আরও প্রকাশিত প্রতিবেদন প্রয়োজন।'
                          : 'More published reports are needed before changes over time can be interpreted meaningfully.'}
                      </div>
                    </div>
                  ) : (
                    <ReportActivityTimeline
                      reports={filteredReports}
                      language={language}
                    />
                  )}
                </div>
              </details>
            </div>
          )}
        </>
      )}

      {/* Mobile Filter Bottom Sheet */}
      <Modal
        id="mobile-filter-sheet"
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title={language === 'bn' ? 'ফিল্টার' : 'Filters'}
        maxWidth="md"
        mobilePresentation="sheet"
        language={language}
        footer={
          <div className="flex items-center justify-between w-full gap-3">
            <button
              type="button"
              onClick={handleClearFilterSheet}
              className="px-4 py-2.5 rounded-xl border border-ui-stroke-subtle bg-ui-surface text-[14px] font-semibold text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface-subtle transition-colors min-h-[44px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            >
              {language === 'bn' ? 'ফিল্টার মুছুন' : 'Clear filters'}
            </button>
            <button
              type="button"
              onClick={handleApplyFilterSheet}
              className="btn-primary-action px-5 py-2.5 rounded-xl text-[14px] font-bold min-h-[44px] cursor-pointer flex-1 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shadow-xs"
            >
              {language === 'bn' ? 'ফিল্টার প্রয়োগ করুন' : 'Apply filters'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 py-1">
          {/* Division */}
          <div className="space-y-1.5">
            <label htmlFor="mobile-filter-division" className="text-[13px] font-bold text-ui-content-primary block">
              {language === 'bn' ? 'বিভাগ' : 'Division'}
            </label>
            <select
              id="mobile-filter-division"
              value={draftDivision}
              onChange={(e) => handleDraftDivisionChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:border-ui-accent rounded-xl text-[14px] text-ui-content-primary min-h-[44px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
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

          {/* District */}
          <div className="space-y-1.5">
            <label htmlFor="mobile-filter-district" className="text-[13px] font-bold text-ui-content-primary block">
              {language === 'bn' ? 'জেলা' : 'District'}
            </label>
            <select
              id="mobile-filter-district"
              value={draftDistrict}
              onChange={(e) => setDraftDistrict(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:border-ui-accent rounded-xl text-[14px] text-ui-content-primary min-h-[44px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            >
              <option value="all">
                {language === 'bn' ? 'সকল জেলা' : 'All districts'}
              </option>
              {draftAvailableDistricts.map((d) => (
                <option key={d.id} value={d.nameEn}>
                  {language === 'bn'
                    ? `${d.nameBn} (${d.divisionBn})`
                    : `${d.nameEn} (${d.divisionEn})`}
                </option>
              ))}
            </select>
          </div>

          {/* Topic / Category */}
          <fieldset className="space-y-2 border-0 p-0 m-0">
            <legend className="text-[13px] font-bold text-ui-content-primary block p-0 mb-1">
              {language === 'bn' ? 'বিষয়' : 'Topic'}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={draftSection === 'all'}
                onClick={() => setDraftSection('all')}
                className={`px-3 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border transition-all min-h-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                  draftSection === 'all'
                    ? 'bg-ui-action-bg text-ui-action-text border-ui-action-bg shadow-xs font-bold'
                    : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary hover:text-ui-content-primary'
                }`}
              >
                {language === 'bn' ? 'সব বিষয়' : 'All topics'}
              </button>

              <button
                type="button"
                aria-pressed={draftSection === 'harassment'}
                onClick={() => setDraftSection('harassment')}
                className={`px-3 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border transition-all flex items-center justify-center gap-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                  draftSection === 'harassment'
                    ? 'bg-[var(--sec-harassment-bg)] text-[var(--sec-harassment-text)] border-[var(--sec-harassment-border)] shadow-xs font-bold ring-1 ring-[var(--sec-harassment-border)]'
                    : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary hover:text-ui-content-primary'
                }`}
              >
                <CategoryIcon section="harassment" size="xs" />
                <span className="truncate">
                  {language === 'bn' ? SECTIONS.harassment.shortNameBn : SECTIONS.harassment.shortNameEn}
                </span>
              </button>

              <button
                type="button"
                aria-pressed={draftSection === 'rickshaw'}
                onClick={() => setDraftSection('rickshaw')}
                className={`px-3 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border transition-all flex items-center justify-center gap-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                  draftSection === 'rickshaw'
                    ? 'bg-[var(--sec-rickshaw-bg)] text-[var(--sec-rickshaw-text)] border-[var(--sec-rickshaw-border)] shadow-xs font-bold ring-1 ring-[var(--sec-rickshaw-border)]'
                    : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary hover:text-ui-content-primary'
                }`}
              >
                <CategoryIcon section="rickshaw" size="xs" />
                <span className="truncate">
                  {language === 'bn' ? SECTIONS.rickshaw.shortNameBn : SECTIONS.rickshaw.shortNameEn}
                </span>
              </button>

              <button
                type="button"
                aria-pressed={draftSection === 'extortion'}
                onClick={() => setDraftSection('extortion')}
                className={`px-3 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border transition-all flex items-center justify-center gap-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                  draftSection === 'extortion'
                    ? 'bg-[var(--sec-extortion-bg)] text-[var(--sec-extortion-text)] border-[var(--sec-extortion-border)] shadow-xs font-bold ring-1 ring-[var(--sec-extortion-border)]'
                    : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary hover:text-ui-content-primary'
                }`}
              >
                <CategoryIcon section="extortion" size="xs" />
                <span className="truncate">
                  {language === 'bn' ? SECTIONS.extortion.shortNameBn : SECTIONS.extortion.shortNameEn}
                </span>
              </button>

              <button
                type="button"
                aria-pressed={draftSection === 'load_shedding'}
                onClick={() => setDraftSection('load_shedding')}
                className={`col-span-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer border transition-all flex items-center justify-center gap-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                  draftSection === 'load_shedding'
                    ? 'bg-[var(--sec-load_shedding-bg)] text-[var(--sec-load_shedding-text)] border-[var(--sec-load_shedding-border)] shadow-xs font-bold ring-1 ring-[var(--sec-load_shedding-border)]'
                    : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary hover:text-ui-content-primary'
                }`}
              >
                <CategoryIcon section="load_shedding" size="xs" />
                <span className="truncate">
                  {language === 'bn' ? SECTIONS.load_shedding.shortNameBn : SECTIONS.load_shedding.shortNameEn}
                </span>
              </button>
            </div>
          </fieldset>
        </div>
      </Modal>

      {/* Mobile Selected Area Details Bottom Sheet */}
      <Modal
        id="mobile-area-sheet"
        isOpen={isAreaSheetOpen}
        onClose={() => setIsAreaSheetOpen(false)}
        title={activeDistrictName || (language === 'bn' ? 'এলাকার সারসংক্ষেপ' : 'Area summary')}
        maxWidth="md"
        mobilePresentation="sheet"
        language={language}
        footer={
          <button
            type="button"
            onClick={() => {
              setViewMode('reports');
              setIsAreaSheetOpen(false);
            }}
            className="btn-primary-action w-full py-2.5 px-4 rounded-xl text-[14px] font-bold min-h-[44px] flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shadow-xs"
          >
            <MapIcon name="file-text" size="sm" ariaHidden={true} />
            <span>{language === 'bn' ? 'প্রতিবেদন দেখুন' : 'View reports'}</span>
          </button>
        }
      >
        <div className="py-1">
          <DistrictRankingPanel
            reports={filteredReports}
            rankingReports={baseFilteredReports}
            selectedDistrict={selectedDistrict}
            selectedDivision={selectedDivision}
            onSelectDistrict={handleSelectDistrict}
            language={language}
            selectedSection={selectedSection}
          />
        </div>
      </Modal>
    </PublicPageContainer>
  );
};

export default ExplorePage;
