import React, { useState, useEffect, useMemo, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';
import { PublicReportService } from '../services/publicReportService';
import { ReportItem } from '../types/report';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../data/districts';
import { SECTIONS, SectionKey } from '../theme/tokens';
import { SUBCATEGORIES } from '../data/categories';
import { ReportFeedSkeleton, MapExploreSkeleton } from '../components/ui/LoadingSkeleton';
import type { ExploreViewMode } from '../components/explore/MapSectionHeader';
import { PublicIncidentMap } from '../components/explore/PublicIncidentMap';
import { DistrictRankingPanel } from '../components/explore/DistrictRankingPanel';
import { RecentAreaReports } from '../components/explore/RecentAreaReports';
import { ReportAnalyticsOverview } from '../components/explore/ReportAnalyticsOverview';
import { ReportSubcategoryBreakdown } from '../components/explore/ReportSubcategoryBreakdown';
import { ReportActivityTimeline } from '../components/explore/ReportActivityTimeline';
import { ReportGeographicBreakdown } from '../components/explore/ReportGeographicBreakdown';
import { ReportTopicDivisionMatrix } from '../components/explore/ReportTopicDivisionMatrix';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { toBanglaDigits } from '../utils/formatters';
import { CategoryIcon } from '../components/branding/CategoryIcon';
import { MapIcon } from '../components/explore/MapIcon';
import { Modal } from '../components/ui/Modal';
import { SearchableSelect } from '../components/ui/SearchableSelect';
import { SearchInput } from '../components/ui/SearchInput';
import { Button } from '../components/ui/Button';
import { ModalActions } from '../components/ui/ModalActions';
import { FilterChip } from '../components/ui/FilterChip';
import { HorizontalScrollRail } from '../components/ui/HorizontalScrollRail';
import { HarassmentClassificationFilters } from '../components/report/HarassmentClassificationFilters';
import { HarassmentClassificationBreakdown } from '../components/explore/HarassmentClassificationBreakdown';
import {
  EMPTY_HARASSMENT_CLASSIFICATION_FILTERS,
  HARASSMENT_AGE_GROUP_OPTIONS,
  HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,
  HARASSMENT_REPORTING_FOR_OPTIONS,
  getBilingualOptionLabel,
  hasActiveHarassmentClassificationFilters,
  matchesHarassmentClassification,
} from '../data/harassmentClassification';

const CATEGORY_KEYS = Object.keys(SECTIONS) as SectionKey[];

export const ExplorePage: React.FC = () => {
  const { language } = useApp();
  // Default to 'reports' mode per Phase 8 product direction
  const [viewMode, setViewMode] = useState<ExploreViewMode>('reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<SectionKey | 'all'>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<{ segment: SectionKey; subId: string } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [harassmentFilters, setHarassmentFilters] = useState(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);

  // Mobile UX Phase 6 Sheet States
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isAreaSheetOpen, setIsAreaSheetOpen] = useState(false);

  // Temporary local draft state for mobile filter sheet
  const [draftSection, setDraftSection] = useState<SectionKey | 'all'>('all');
  const [draftDivision, setDraftDivision] = useState<string>('all');
  const [draftDistrict, setDraftDistrict] = useState<string>('all');
  const [draftHarassmentFilters, setDraftHarassmentFilters] = useState(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);

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

  // Prevent hidden Harassment classification filters from leaking across category changes.
  useEffect(() => {
    if (selectedSection !== 'harassment') {
      setHarassmentFilters(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);
    }
    if (selectedSubcategory && selectedSubcategory.segment !== selectedSection) {
      setSelectedSubcategory(null);
    }
  }, [selectedSection, selectedSubcategory]);

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
      if (selectedSection === 'harassment' && !matchesHarassmentClassification(r, harassmentFilters)) {
        return false;
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
  }, [allReports, searchQuery, selectedSection, selectedDivision, harassmentFilters]);

  const areaFilteredReports: ReportItem[] = useMemo(() => {
    if (selectedDistrict === 'all') return baseFilteredReports;
    return baseFilteredReports.filter((r) => {
      const matchDist =
        (r.districtEn || '').toLowerCase() === selectedDistrict.toLowerCase() ||
        r.districtBn === selectedDistrict ||
        (r.districtEn || '').toLowerCase() === selectedDistrict.trim().toLowerCase();
      return matchDist;
    });
  }, [baseFilteredReports, selectedDistrict]);

  const matchesSelectedMonth = useCallback(
    (report: ReportItem) => {
      if (!selectedMonth) return true;
      if (!report.publishedAt || typeof report.publishedAt !== 'string') return false;
      const date = new Date(report.publishedAt);
      if (Number.isNaN(date.getTime())) return false;
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    },
    [selectedMonth]
  );

  const matchesSelectedSubcategory = useCallback(
    (report: ReportItem) => {
      if (!selectedSubcategory) return true;
      return (
        report.segment === selectedSubcategory.segment &&
        report.subcategoryId === selectedSubcategory.subId
      );
    },
    [selectedSubcategory]
  );

  // Keep the selected dimension visible in its own chart so users can switch drilldowns.
  const subcategoryChartReports = useMemo(
    () => areaFilteredReports.filter(matchesSelectedMonth),
    [areaFilteredReports, matchesSelectedMonth]
  );

  const timelineChartReports = useMemo(
    () => areaFilteredReports.filter(matchesSelectedSubcategory),
    [areaFilteredReports, matchesSelectedSubcategory]
  );

  // Final shared report set used by the answer strip, map and summary.
  const filteredReports: ReportItem[] = useMemo(
    () =>
      areaFilteredReports.filter(
        (report) => matchesSelectedSubcategory(report) && matchesSelectedMonth(report)
      ),
    [areaFilteredReports, matchesSelectedMonth, matchesSelectedSubcategory]
  );

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
    setSelectedSubcategory(null);
    setSelectedMonth(null);
    setHarassmentFilters(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);
  };

  const handleOpenFilterSheet = () => {
    setDraftSection(selectedSection);
    setDraftDivision(selectedDivision);
    setDraftDistrict(selectedDistrict);
    setDraftHarassmentFilters(harassmentFilters);
    setIsAreaSheetOpen(false);
    setIsFilterSheetOpen(true);
  };

  const handleApplyFilterSheet = () => {
    setSelectedSection(draftSection);
    setSelectedDivision(draftDivision);
    setSelectedDistrict(draftDistrict);
    setHarassmentFilters(
      draftSection === 'harassment' ? draftHarassmentFilters : EMPTY_HARASSMENT_CLASSIFICATION_FILTERS
    );
    setIsFilterSheetOpen(false);
  };

  const handleClearFilterSheet = () => {
    setDraftSection('all');
    setDraftDivision('all');
    setDraftDistrict('all');
    setDraftHarassmentFilters(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);
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
    if (selectedSection === 'harassment') {
      if (harassmentFilters.ageGroup !== 'all') count++;
      if (harassmentFilters.abuserRelationship !== 'all') count++;
      if (harassmentFilters.reportingFor !== 'all') count++;
    }
    return count;
  }, [selectedSection, selectedDivision, selectedDistrict, harassmentFilters]);

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

  const handleSelectCategoryInsight = useCallback((category: SectionKey) => {
    setSelectedSection(category);
    setSelectedSubcategory(null);
  }, []);

  const handleSelectDivisionInsight = useCallback((division: string) => {
    setSelectedDivision(division);
    setSelectedDistrict('all');
  }, []);

  const handleSelectSubcategoryInsight = useCallback((segment: SectionKey, subId: string) => {
    setSelectedSection(segment);
    setSelectedSubcategory((current) =>
      current?.segment === segment && current.subId === subId ? null : { segment, subId }
    );
  }, []);

  const handleSelectMonthInsight = useCallback((monthKey: string) => {
    setSelectedMonth((current) => (current === monthKey ? null : monthKey));
  }, []);

  const handleSelectTopicDivisionInsight = useCallback(
    (category: SectionKey, division: string) => {
      setSelectedSection(category);
      setSelectedDivision(division);
      setSelectedDistrict('all');
      setSelectedSubcategory(null);
    },
    []
  );

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    (selectedSection === 'harassment' && hasActiveHarassmentClassificationFilters(harassmentFilters)) ||
    selectedSection !== 'all' ||
    selectedDivision !== 'all' ||
    selectedDistrict !== 'all' ||
    selectedSubcategory !== null ||
    selectedMonth !== null;

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

  const activeSubcategoryName = useMemo(() => {
    if (!selectedSubcategory) return null;
    const match = SUBCATEGORIES[selectedSubcategory.segment]?.find(
      (item) => item.id === selectedSubcategory.subId
    );
    if (!match) return selectedSubcategory.subId;
    return language === 'bn' ? match.nameBn : match.nameEn;
  }, [selectedSubcategory, language]);

  const activeMonthName = useMemo(() => {
    if (!selectedMonth) return null;
    const [yearText, monthText] = selectedMonth.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return selectedMonth;
    const date = new Date(Date.UTC(year, month - 1, 1));
    return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }, [selectedMonth, language]);

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

  // Meaningful context check: Category, Division, or District selected
  const hasMeaningfulContext =
    selectedSection !== 'all' ||
    selectedDivision !== 'all' ||
    selectedDistrict !== 'all';

  return (
    <PublicPageContainer id="explore-page-container">
      {/* Top Controls & View Switcher Wrapper */}
      <div className="space-y-3 sm:space-y-4 md:space-y-4">
        {/* 1. Page Title & Context (Compact Spacing) */}
        <div className="space-y-0.5 pb-0.5">
          <h1 className="type-h1 text-ui-content-primary">
            {language === 'bn' ? 'প্রতিবেদন বিশ্লেষণ' : 'Report insights'}
          </h1>
          <p className="type-body text-ui-content-secondary">
            {language === 'bn'
              ? 'এলাকা অনুযায়ী প্রকাশিত প্রতিবেদন ও বিশ্লেষণ দেখুন'
              : 'Explore published reports and analysis by area'}
          </p>
        </div>

      {/* 2. Control Layer (Find reports - Compact Workbench) */}
      <div className="bg-ui-surface border border-ui-stroke-subtle ui-radius-card p-3.5 sm:p-4 md:p-4.5 space-y-3 shadow-[var(--elevation-2xs)]">
        <div className="space-y-0.5">
          <h2 className="type-h4 text-ui-content-primary">
            {language === 'bn' ? 'প্রতিবেদন খুঁজুন' : 'Find reports'}
          </h2>
          <p className="type-meta text-ui-content-secondary">
            {language === 'bn'
              ? 'এলাকা, বিষয় বা শব্দ দিয়ে প্রকাশিত প্রতিবেদন খুঁজুন।'
              : 'Explore published reports by area, topic, or search term.'}
          </p>
        </div>
        {/* Desktop / Tablet Controls (Search, Division, District) */}
        <div className="hidden md:flex items-start justify-between gap-4">
          <div className="grid grid-cols-2 gap-2 min-w-[350px] lg:min-w-[390px]">
            <SearchableSelect
              id="desktop-select-division"
              value={selectedDivision}
              onChange={(value) => {
                setSelectedDivision(value);
                setSelectedDistrict('all');
              }}
              placeholder={language === 'bn' ? 'সকল বিভাগ' : 'All divisions'}
              searchPlaceholder={language === 'bn' ? 'বিভাগ খুঁজুন...' : 'Search divisions...'}
              noResultsText={language === 'bn' ? 'কোনো বিভাগ পাওয়া যায়নি' : 'No matching division'}
              options={[
                { value: 'all', label: language === 'bn' ? 'সকল বিভাগ' : 'All divisions' },
                ...DIVISIONS.map((division) => ({
                  value: division.nameEn,
                  label: language === 'bn' ? division.nameBn : division.nameEn,
                  keywords: [division.nameBn, division.nameEn],
                })),
              ]}
            />
            <SearchableSelect
              id="desktop-select-district"
              value={selectedDistrict}
              onChange={setSelectedDistrict}
              placeholder={language === 'bn' ? 'সকল জেলা' : 'All districts'}
              searchPlaceholder={language === 'bn' ? 'জেলা খুঁজুন...' : 'Search districts...'}
              noResultsText={language === 'bn' ? 'কোনো জেলা পাওয়া যায়নি' : 'No matching district'}
              options={[
                { value: 'all', label: language === 'bn' ? 'সকল জেলা' : 'All districts' },
                ...availableDistricts.map((district) => ({
                  value: district.nameEn,
                  label: language === 'bn'
                    ? `${district.nameBn} (${district.divisionBn})`
                    : `${district.nameEn} (${district.divisionEn})`,
                  keywords: [district.nameBn, district.nameEn, district.divisionBn, district.divisionEn],
                })),
              ]}
            />
          </div>

          <div className="w-[240px] lg:w-[280px] shrink-0">
            <SearchInput
              id="explore-desktop-search"
              value={searchQuery}
              onChange={setSearchQuery}
              language={language}
              ariaLabel={language === 'bn' ? 'এলাকা বা প্রতিবেদন খুঁজুন' : 'Search by area or report'}
              placeholder={language === 'bn' ? 'এলাকা বা প্রতিবেদন খুঁজুন...' : 'Search by area or report...'}
            />
          </div>
        </div>

        {/* Desktop Category Filter Chips */}
        <div className="hidden md:block pt-0.5">
          <HorizontalScrollRail
            ariaLabel={language === 'bn' ? 'প্রতিবেদনের বিষয়' : 'Report topics'}
            previousLabel={language === 'bn' ? 'আগের বিষয়গুলো দেখুন' : 'Show previous topics'}
            nextLabel={language === 'bn' ? 'পরের বিষয়গুলো দেখুন' : 'Show more topics'}
          >
            <Button
              type="button"
              size="sm"
              variant={selectedSection === 'all' ? 'primary' : 'secondary'}
              aria-pressed={selectedSection === 'all'}
              onClick={() => { setSelectedSection('all'); setSelectedSubcategory(null); }}
              className="shrink-0"
            >
              {language === 'bn' ? 'সব' : 'All'}
            </Button>

            {CATEGORY_KEYS.map((sectionKey) => {
              const section = SECTIONS[sectionKey];
              return (
                <FilterChip
                  key={sectionKey}
                  label={language === 'bn' ? section.shortNameBn : section.shortNameEn}
                  section={sectionKey}
                  selected={selectedSection === sectionKey}
                  icon={<CategoryIcon section={sectionKey} size="xs" />}
                  onClick={() => { setSelectedSection(sectionKey); setSelectedSubcategory(null); }}
                />
              );
            })}
          </HorizontalScrollRail>
        </div>

        {selectedSection === 'harassment' && (
          <div className="hidden md:block pt-1 border-t border-ui-stroke-subtle">
            <HarassmentClassificationFilters
              language={language}
              value={harassmentFilters}
              onChange={setHarassmentFilters}
            />
          </div>
        )}

        {/* Mobile Control Bar (Search Input + Filters Drawer Button) */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile Keyword Search */}
          <div className="flex-1 min-w-0">
            <SearchInput
              id="explore-mobile-search"
              value={searchQuery}
              onChange={setSearchQuery}
              language={language}
              ariaLabel={language === 'bn' ? 'এলাকা বা প্রতিবেদন খুঁজুন' : 'Search by area or report'}
              placeholder={language === 'bn' ? 'এলাকা বা প্রতিবেদন খুঁজুন...' : 'Search by area or report...'}
            />
          </div>

          {/* Mobile Filter Button */}
          <Button
            id="explore-mobile-filter-button"
            type="button"
            variant={mobileFilterCount > 0 ? 'secondary' : 'outline'}
            size="md"
            onClick={handleOpenFilterSheet}
            aria-expanded={isFilterSheetOpen}
            aria-controls="mobile-filter-sheet"
            aria-label={
              language === 'bn'
                ? `ফিল্টার খুলুন${mobileFilterCount > 0 ? ` (${toBanglaDigits(mobileFilterCount)}টি সক্রিয়)` : ''}`
                : `Open filters${mobileFilterCount > 0 ? ` (${mobileFilterCount} active)` : ''}`
            }
            leftIcon={<MapIcon name="filter" size="sm" ariaHidden={true} />}
            rightIcon={
              mobileFilterCount > 0 ? (
                <span className="w-5 h-5 ui-radius-pill bg-ui-accent text-ui-action-text type-meta font-[var(--font-weight-bold)] flex items-center justify-center">
                  {language === 'bn' ? toBanglaDigits(mobileFilterCount) : mobileFilterCount}
                </span>
              ) : undefined
            }
            className={`shrink-0 whitespace-nowrap ${
              mobileFilterCount > 0 ? 'border-ui-accent font-[var(--font-weight-bold)]' : ''
            }`}
          >
            {language === 'bn' ? 'ফিল্টার' : 'Filters'}
          </Button>
        </div>
      </div>

      {/* 2.5 Active Filter Context Row */}
      {hasActiveFilters && (
        <div
          role="region"
          aria-label={language === 'bn' ? 'সক্রিয় ফিল্টার' : 'Active filters'}
          className="flex flex-wrap items-center gap-2 pt-0"
        >
          <span className="type-meta font-[var(--font-weight-semibold)] text-ui-content-secondary mr-1 shrink-0">
            {language === 'bn' ? 'সক্রিয় ফিল্টার:' : 'Active filters:'}
          </span>

          {/* Division Chip */}
          {selectedDivision !== 'all' && activeDivisionName && (
            <span className="inline-flex items-center gap-1 pl-3 pr-0.5 py-0 ui-radius-badge-md bg-ui-surface-subtle border border-ui-stroke-subtle type-meta font-[var(--font-weight-medium)] text-ui-content-primary max-w-full">
              <span className="truncate">{activeDivisionName}</span>
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
                className="w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center text-ui-content-secondary hover:text-ui-content-primary rounded-r-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <MapIcon name="close" size="xs" ariaHidden={true} />
              </button>
            </span>
          )}

          {/* District Chip */}
          {selectedDistrict !== 'all' && activeDistrictName && (
            <span className="inline-flex items-center gap-1 pl-3 pr-0.5 py-0 ui-radius-badge-md bg-ui-surface-subtle border border-ui-stroke-subtle type-meta font-[var(--font-weight-medium)] text-ui-content-primary max-w-full">
              <span className="truncate">{activeDistrictName}</span>
              <button
                type="button"
                onClick={() => setSelectedDistrict('all')}
                aria-label={
                  language === 'bn'
                    ? `${activeDistrictName} ফিল্টার সরান`
                    : `Remove ${activeDistrictName} filter`
                }
                className="w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center text-ui-content-secondary hover:text-ui-content-primary rounded-r-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <MapIcon name="close" size="xs" ariaHidden={true} />
              </button>
            </span>
          )}

          {/* Category Chip */}
          {selectedSection !== 'all' && activeCategoryName && (
            <span className="inline-flex items-center gap-1.5 pl-3 pr-0.5 py-0 ui-radius-badge-md bg-ui-surface-subtle border border-ui-stroke-subtle type-meta font-[var(--font-weight-medium)] text-ui-content-primary max-w-full">
              <CategoryIcon section={selectedSection as SectionKey} size="xs" className="shrink-0" />
              <span className="truncate">{activeCategoryName}</span>
              <button
                type="button"
                onClick={() => setSelectedSection('all')}
                aria-label={
                  language === 'bn'
                    ? `${activeCategoryName} ফিল্টার সরান`
                    : `Remove ${activeCategoryName} filter`
                }
                className="w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center text-ui-content-secondary hover:text-ui-content-primary rounded-r-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <MapIcon name="close" size="xs" ariaHidden={true} />
              </button>
            </span>
          )}

          {selectedSubcategory && activeSubcategoryName && (
            <span className="inline-flex items-center gap-1.5 pl-3 pr-0.5 py-0 ui-radius-badge-md bg-ui-surface-subtle border border-ui-stroke-subtle type-meta font-[var(--font-weight-medium)] text-ui-content-primary max-w-full">
              <span className="truncate">{activeSubcategoryName}</span>
              <button
                type="button"
                onClick={() => setSelectedSubcategory(null)}
                aria-label={
                  language === 'bn'
                    ? `${activeSubcategoryName} সাবক্যাটাগরি ফিল্টার সরান`
                    : `Remove ${activeSubcategoryName} subcategory filter`
                }
                className="w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center text-ui-content-secondary hover:text-ui-content-primary rounded-r-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <MapIcon name="close" size="xs" ariaHidden={true} />
              </button>
            </span>
          )}

          {selectedMonth && activeMonthName && (
            <span className="inline-flex items-center gap-1.5 pl-3 pr-0.5 py-0 ui-radius-badge-md bg-ui-surface-subtle border border-ui-stroke-subtle type-meta font-[var(--font-weight-medium)] text-ui-content-primary max-w-full">
              <span className="truncate">{activeMonthName}</span>
              <button
                type="button"
                onClick={() => setSelectedMonth(null)}
                aria-label={
                  language === 'bn'
                    ? `${activeMonthName} সময় ফিল্টার সরান`
                    : `Remove ${activeMonthName} time filter`
                }
                className="w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center text-ui-content-secondary hover:text-ui-content-primary rounded-r-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <MapIcon name="close" size="xs" ariaHidden={true} />
              </button>
            </span>
          )}

          {/* Search Query Chip */}
          {searchQuery.trim() && (
            <span className="inline-flex items-center gap-1 pl-3 pr-0.5 py-0 ui-radius-badge-md bg-ui-surface-subtle border border-ui-stroke-subtle type-meta font-[var(--font-weight-medium)] text-ui-content-primary max-w-full">
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
                className="w-11 h-11 min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center text-ui-content-secondary hover:text-ui-content-primary rounded-r-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <MapIcon name="close" size="xs" ariaHidden={true} />
              </button>
            </span>
          )}

          {selectedSection === 'harassment' && harassmentFilters.ageGroup !== 'all' && (
            <span className="inline-flex items-center gap-1 pl-3 pr-0.5 ui-radius-badge-md bg-ui-surface-subtle border border-ui-stroke-subtle type-meta font-[var(--font-weight-medium)] text-ui-content-primary">
              <span>{getBilingualOptionLabel(HARASSMENT_AGE_GROUP_OPTIONS, harassmentFilters.ageGroup, language)}</span>
              <button type="button" onClick={() => setHarassmentFilters((prev) => ({ ...prev, ageGroup: 'all' }))} aria-label={language === 'bn' ? 'বয়সের ফিল্টার সরান' : 'Remove age filter'} className="w-11 h-11 flex items-center justify-center rounded-r-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"><MapIcon name="close" size="xs" ariaHidden={true} /></button>
            </span>
          )}
          {selectedSection === 'harassment' && harassmentFilters.abuserRelationship !== 'all' && (
            <span className="inline-flex items-center gap-1 pl-3 pr-0.5 ui-radius-badge-md bg-ui-surface-subtle border border-ui-stroke-subtle type-meta font-[var(--font-weight-medium)] text-ui-content-primary">
              <span>{getBilingualOptionLabel(HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS, harassmentFilters.abuserRelationship, language)}</span>
              <button type="button" onClick={() => setHarassmentFilters((prev) => ({ ...prev, abuserRelationship: 'all' }))} aria-label={language === 'bn' ? 'সম্পর্কের ফিল্টার সরান' : 'Remove relationship filter'} className="w-11 h-11 flex items-center justify-center rounded-r-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"><MapIcon name="close" size="xs" ariaHidden={true} /></button>
            </span>
          )}
          {selectedSection === 'harassment' && harassmentFilters.reportingFor !== 'all' && (
            <span className="inline-flex items-center gap-1 pl-3 pr-0.5 ui-radius-badge-md bg-ui-surface-subtle border border-ui-stroke-subtle type-meta font-[var(--font-weight-medium)] text-ui-content-primary">
              <span>{getBilingualOptionLabel(HARASSMENT_REPORTING_FOR_OPTIONS, harassmentFilters.reportingFor, language)}</span>
              <button type="button" onClick={() => setHarassmentFilters((prev) => ({ ...prev, reportingFor: 'all' }))} aria-label={language === 'bn' ? 'প্রতিবেদনকারীর ফিল্টার সরান' : 'Remove reporting-for filter'} className="w-11 h-11 flex items-center justify-center rounded-r-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"><MapIcon name="close" size="xs" ariaHidden={true} /></button>
            </span>
          )}

          {/* Clear All Button */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="min-h-[44px] px-3 py-2 inline-flex items-center type-meta font-[var(--font-weight-semibold)] text-ui-accent hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ui-radius-badge-md ml-auto sm:ml-1"
          >
            {language === 'bn' ? 'সব মুছুন' : 'Clear all'}
          </button>
        </div>
      )}

      {/* 3. Compact Context Strip: Dynamic Answer & Secondary About Data */}
      {!isLoading && !fetchError && (
        <div className="space-y-2">
          {/* Dynamic Result Context */}
          <div className="bg-ui-surface-subtle border border-ui-stroke-subtle ui-radius-control px-4 py-3 shadow-[var(--elevation-2xs)] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
            <h3 className="type-meta  font-[var(--font-weight-bold)] text-ui-content-primary leading-snug">
              {dynamicAnswerHeading}
            </h3>
            <p className="type-meta font-[var(--font-weight-medium)] text-ui-content-secondary shrink-0">
              {countMessage}
            </p>
          </div>

          {/* Secondary About This Data Disclosure */}
          <details className="group bg-ui-surface border border-ui-stroke-subtle ui-radius-control px-3.5 sm:px-4 py-1 type-meta text-ui-content-secondary shadow-[var(--elevation-2xs)]">
            <summary className="font-[var(--font-weight-medium)] type-meta text-ui-content-secondary hover:text-ui-content-primary cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus min-h-[44px] flex items-center justify-between gap-2 list-none">
              <span>{language === 'bn' ? 'এই তথ্য সম্পর্কে' : 'About this data'}</span>
              <span className="w-7 h-7 ui-radius-badge-sm bg-ui-surface-subtle border border-ui-stroke-subtle flex items-center justify-center text-ui-content-secondary group-hover:text-ui-content-primary shrink-0 transition-transform duration-200 group-open:rotate-180">
                <MapIcon name="chevron-down" size="xs" ariaHidden={true} />
              </span>
            </summary>
            <div className="pt-2 pb-3 border-t border-ui-stroke-subtle mt-1 type-meta  text-ui-content-secondary leading-relaxed">
              {language === 'bn'
                ? 'এখানে সবাইকে জানাও-এ প্রকাশিত নাগরিক প্রতিবেদন বিশ্লেষণ করা হয়েছে। এটি সরকারি অপরাধ পরিসংখ্যান নয় এবং কোনো এলাকার সামগ্রিক নিরাপত্তা বা কোনো অভিযোগের আইনগত সত্যতা নির্ধারণ করে না।'
                : 'This analysis is based on citizen reports published on Sobaike Janao. It is not official crime statistics and does not determine the overall safety of an area or the legal truth of an allegation.'}
            </div>
          </details>
        </div>
      )}

      {/* 4. Reports | Map Mode Switcher (Connected to Workspace) */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div
          role="group"
          aria-label={language === 'bn' ? 'ভিউ পরিবর্তন' : 'View mode switcher'}
          className="flex items-center bg-ui-surface-subtle p-1 ui-radius-control border border-ui-stroke-subtle w-fit shadow-[var(--elevation-2xs)]"
        >
          <button
            type="button"
            aria-pressed={viewMode === 'reports'}
            onClick={() => setViewMode('reports')}
            className={`px-3.5 sm:px-4 py-2 ui-radius-badge-md type-meta  font-[var(--font-weight-semibold)] flex items-center gap-2 transition-all cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus border ${
              viewMode === 'reports'
                ? 'bg-ui-surface text-ui-content-primary shadow-[var(--elevation-2xs)] font-[var(--font-weight-bold)] border-ui-stroke-subtle/50 dark:bg-ui-action-bg dark:text-ui-action-text dark:border-ui-action-bg dark:ring-1 dark:ring-ui-accent-border'
                : 'border-transparent text-ui-content-secondary hover:text-ui-content-primary dark:text-ui-content-secondary dark:hover:text-ui-content-primary'
            }`}
          >
            <MapIcon name="file-text" size="md" aria-hidden="true" />
            <span>{language === 'bn' ? 'প্রতিবেদন' : 'Reports'}</span>
          </button>

          <button
            type="button"
            aria-pressed={viewMode === 'heatmap'}
            onClick={() => setViewMode('heatmap')}
            className={`px-3.5 sm:px-4 py-2 ui-radius-badge-md type-meta  font-[var(--font-weight-semibold)] flex items-center gap-2 transition-all cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus border ${
              viewMode === 'heatmap'
                ? 'bg-ui-surface text-ui-content-primary shadow-[var(--elevation-2xs)] font-[var(--font-weight-bold)] border-ui-stroke-subtle/50 dark:bg-ui-action-bg dark:text-ui-action-text dark:border-ui-action-bg dark:ring-1 dark:ring-ui-accent-border'
                : 'border-transparent text-ui-content-secondary hover:text-ui-content-primary dark:text-ui-content-secondary dark:hover:text-ui-content-primary'
            }`}
          >
            <MapIcon name="flame" size="md" aria-hidden="true" />
            <span>{language === 'bn' ? 'মানচিত্র' : 'Map'}</span>
          </button>
        </div>
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
          className="bg-ui-surface border border-ui-error-border ui-radius-control p-8 text-center space-y-4 shadow-[var(--elevation-xs)]"
        >
          <MapIcon
            name="alert-circle"
            size="xl"
            className="text-ui-error-text mx-auto"
            ariaHidden={true}
          />
          <p className="type-body font-[var(--font-weight-semibold)] text-ui-error-text">
            {language === 'bn'
              ? 'প্রতিবেদন লোড করা যায়নি।'
              : 'Couldn’t load reports.'}
          </p>
          <Button type="button" variant="primary" size="md" onClick={loadData}>
            {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
          </Button>
        </div>
      )}

      {/* 5. Selected Mode Content (Map vs Reports) or Zero Result Recovery */}
      {!isLoading && !fetchError && (
        <>
          {filteredReports.length === 0 ? (
            /* Authoritative Zero-Result Recovery State */
            <div
              role="status"
              className="bg-ui-surface border border-ui-stroke-subtle ui-radius-card p-8 sm:p-10 text-center space-y-4 shadow-[var(--elevation-2xs)]"
            >
              <MapIcon
                name="alert-circle"
                size="xl"
                className="text-ui-content-secondary mx-auto"
                ariaHidden={true}
              />
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="type-body  font-[var(--font-weight-bold)] text-ui-content-primary">
                  {language === 'bn'
                    ? 'এই ফিল্টারে কোনো প্রতিবেদন পাওয়া যায়নি'
                    : 'No reports found for these filters'}
                </h3>
                <p className="type-meta  text-ui-content-secondary leading-relaxed">
                  {language === 'bn'
                    ? 'অন্য এলাকা বা বিষয় নির্বাচন করুন, অনুসন্ধান পরিবর্তন করুন, অথবা কিছু ফিল্টার সরিয়ে আবার দেখুন।'
                    : 'Try another area or topic, change your search, or remove some filters and try again.'}
                </p>
              </div>
              {hasActiveFilters && (
                <div className="pt-2">
                  <Button type="button" variant="primary" size="md" onClick={handleResetFilters}>
                    {language === 'bn' ? 'সব ফিল্টার মুছুন' : 'Clear all filters'}
                  </Button>
                </div>
              )}
            </div>
          ) : viewMode === 'heatmap' ? (
            /* MAP VIEW */
            <div className="space-y-4 md:space-y-6">
              {/* Row 1: Full-Width Map */}
              <div className="w-full">
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
                  <div className="bg-ui-surface border border-ui-stroke-subtle ui-radius-card p-3.5 sm:p-4 shadow-[var(--elevation-2xs)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 ui-radius-control bg-ui-surface-subtle border border-ui-stroke-subtle flex items-center justify-center shrink-0 text-ui-content-primary">
                        <MapIcon name="map-pin" size="md" ariaHidden={true} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="type-body font-[var(--font-weight-bold)] text-ui-content-primary whitespace-normal break-words line-clamp-2 leading-snug">
                          {activeDistrictName || selectedDistrict}
                        </h3>
                        <p className="type-meta text-ui-content-secondary whitespace-normal break-words leading-tight mt-0.5">
                          {language === 'bn'
                            ? `${toBanglaDigits(filteredReports.length)}টি প্রকাশিত প্রতিবেদন`
                            : `${filteredReports.length} published reports`}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => {
                        setIsFilterSheetOpen(false);
                        setIsAreaSheetOpen(true);
                      }}
                      aria-expanded={isAreaSheetOpen}
                      aria-controls="mobile-area-sheet"
                      aria-label={
                        language === 'bn'
                          ? `${activeDistrictName || selectedDistrict} এলাকার বিস্তারিত দেখুন`
                          : `View details for ${activeDistrictName || selectedDistrict}`
                      }
                      rightIcon={<MapIcon name="arrow-right" size="xs" ariaHidden={true} />}
                      className="w-full sm:w-auto shrink-0"
                    >
                      {language === 'bn' ? 'এলাকার বিস্তারিত' : 'Area details'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Row 2: District Ranking Panel / Area Summary (Full-width below map on desktop/tablet; on mobile hidden if district selected since mobile uses bottom-sheet trigger) */}
              <div className={`w-full ${selectedDistrict !== 'all' ? 'hidden md:block' : 'block'}`}>
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

              {/* Row 3: Contextual Recent Reports (Rendered ONLY when user chooses meaningful context: category, division, or district) */}
              {hasMeaningfulContext && (
                <div className={selectedDistrict !== 'all' ? 'hidden md:block' : 'block'}>
                  <RecentAreaReports
                    reports={filteredReports}
                    selectedDistrict={selectedDistrict}
                    selectedSection={selectedSection}
                    language={language}
                    onViewAllReports={() => setViewMode('reports')}
                  />
                </div>
              )}
            </div>
          ) : (
            /* REPORTS VIEW (Analytical Hierarchy: Report Summary -> Detailed Analysis) */
            <div className="space-y-6">
              {/* 1. Report summary */}
              <ReportAnalyticsOverview
                reports={filteredReports}
                language={language}
                activeCategory={selectedSection}
                onSelectCategory={handleSelectCategoryInsight}
              />

              <ReportTopicDivisionMatrix
                reports={filteredReports}
                language={language}
                activeCategory={selectedSection}
                activeDivision={selectedDivision}
                onSelectCell={handleSelectTopicDivisionInsight}
              />
              {selectedSection === 'harassment' && (
                <HarassmentClassificationBreakdown
                  reports={filteredReports}
                  language={language}
                  activeAgeGroup={harassmentFilters.ageGroup}
                  activeAbuserRelationship={harassmentFilters.abuserRelationship}
                  activeReportingFor={harassmentFilters.reportingFor}
                  onSelectAgeGroup={(value) =>
                    setHarassmentFilters((current) => ({
                      ...current,
                      ageGroup: current.ageGroup === value ? 'all' : value,
                    }))
                  }
                  onSelectAbuserRelationship={(value) =>
                    setHarassmentFilters((current) => ({
                      ...current,
                      abuserRelationship:
                        current.abuserRelationship === value ? 'all' : value,
                    }))
                  }
                  onSelectReportingFor={(value) =>
                    setHarassmentFilters((current) => ({
                      ...current,
                      reportingFor: current.reportingFor === value ? 'all' : value,
                    }))
                  }
                />
              )}

              {/* 2. Detailed analysis (Directly visible by default) */}
              <div id="detailed-analysis-section" className="space-y-4 pt-1">
                <div className="border-b border-ui-stroke-subtle pb-2.5">
                  <h3 className="type-h2 text-ui-content-primary">
                    {language === 'bn' ? 'বিস্তারিত বিশ্লেষণ' : 'Detailed analysis'}
                  </h3>
                  <p className="type-meta text-ui-content-secondary mt-0.5">
                    {language === 'bn'
                      ? 'বিষয়, এলাকা ও সময় অনুযায়ী বিস্তারিত বিশ্লেষণ দেখুন।'
                      : 'Explore distribution by topic, geography and time.'}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* 1. Subcategory breakdown */}
                  <ReportSubcategoryBreakdown
                    reports={subcategoryChartReports}
                    language={language}
                    activeSubcategory={selectedSubcategory}
                    onSelectSubcategory={handleSelectSubcategoryInsight}
                  />

                  {/* 2. Geographic breakdown */}
                  <ReportGeographicBreakdown
                    reports={filteredReports}
                    language={language}
                    activeDivision={selectedDivision}
                    activeDistrict={selectedDistrict}
                    onSelectDivision={handleSelectDivisionInsight}
                    onSelectDistrict={handleSelectDistrict}
                  />

                  {/* 3. Activity Timeline or Small Dataset Trend Safety Message */}
                  {filteredReports.length <= 2 ? (
                    <div className="bg-ui-surface-subtle border border-ui-stroke-subtle ui-radius-control p-3.5 sm:p-4 text-left space-y-1">
                      <div className="type-meta  font-[var(--font-weight-bold)] text-ui-content-primary">
                        {language === 'bn'
                          ? 'এই নির্বাচনে প্রবণতা দেখানোর মতো পর্যাপ্ত প্রতিবেদন নেই।'
                          : 'There are not enough reports in this selection to show a meaningful trend.'}
                      </div>
                      <div className="type-meta text-ui-content-secondary">
                        {language === 'bn'
                          ? 'সময়ের সাথে পরিবর্তন অর্থপূর্ণভাবে দেখাতে আরও প্রকাশিত প্রতিবেদন প্রয়োজন।'
                          : 'More published reports are needed before changes over time can be interpreted meaningfully.'}
                      </div>
                    </div>
                  ) : (
                    <ReportActivityTimeline
                      reports={timelineChartReports}
                      language={language}
                      activeMonthKey={selectedMonth}
                      onSelectMonth={handleSelectMonthInsight}
                    />
                  )}
                </div>
              </div>
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
          <ModalActions
            primary={{
              type: 'button',
              size: 'md',
              onClick: handleApplyFilterSheet,
              label: language === 'bn' ? 'ফিল্টার প্রয়োগ করুন' : 'Apply filters',
            }}
            secondary={{
              type: 'button',
              size: 'md',
              onClick: handleClearFilterSheet,
              label: language === 'bn' ? 'ফিল্টার মুছুন' : 'Clear filters',
            }}
          />
        }
      >
        <div className="space-y-4 py-1">
          <SearchableSelect
            id="mobile-filter-division"
            label={language === 'bn' ? 'বিভাগ' : 'Division'}
            value={draftDivision}
            onChange={handleDraftDivisionChange}
            searchPlaceholder={language === 'bn' ? 'বিভাগ খুঁজুন...' : 'Search divisions...'}
            noResultsText={language === 'bn' ? 'কোনো বিভাগ পাওয়া যায়নি' : 'No matching division'}
            options={[
              { value: 'all', label: language === 'bn' ? 'সকল বিভাগ' : 'All divisions' },
              ...DIVISIONS.map((division) => ({ value: division.nameEn, label: language === 'bn' ? division.nameBn : division.nameEn, keywords: [division.nameBn, division.nameEn] })),
            ]}
          />

          <SearchableSelect
            id="mobile-filter-district"
            label={language === 'bn' ? 'জেলা' : 'District'}
            value={draftDistrict}
            onChange={setDraftDistrict}
            searchPlaceholder={language === 'bn' ? 'জেলা খুঁজুন...' : 'Search districts...'}
            noResultsText={language === 'bn' ? 'কোনো জেলা পাওয়া যায়নি' : 'No matching district'}
            options={[
              { value: 'all', label: language === 'bn' ? 'সকল জেলা' : 'All districts' },
              ...draftAvailableDistricts.map((district) => ({ value: district.nameEn, label: language === 'bn' ? district.nameBn : district.nameEn, keywords: [district.nameBn, district.nameEn, district.divisionBn, district.divisionEn] })),
            ]}
          />

          {/* Topic / Category */}
          <fieldset className="space-y-2 border-0 p-0 m-0">
            <legend className="type-meta font-[var(--font-weight-bold)] text-ui-content-primary block p-0 mb-1">
              {language === 'bn' ? 'বিষয়' : 'Topic'}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={draftSection === 'all'}
                onClick={() => setDraftSection('all')}
                className={`px-3 py-2.5 ui-radius-control type-meta font-[var(--font-weight-semibold)] cursor-pointer border transition-all min-h-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                  draftSection === 'all'
                    ? 'bg-ui-action-bg text-ui-action-text border-ui-action-bg shadow-[var(--elevation-xs)] font-[var(--font-weight-bold)]'
                    : 'bg-ui-surface border border-ui-stroke-subtle text-ui-content-secondary hover:text-ui-content-primary'
                }`}
              >
                {language === 'bn' ? 'সব বিষয়' : 'All topics'}
              </button>

              {CATEGORY_KEYS.map((sectionKey) => {
                const section = SECTIONS[sectionKey];
                const selected = draftSection === sectionKey;
                return (
                  <button
                    type="button"
                    key={sectionKey}
                    aria-pressed={selected}
                    onClick={() => setDraftSection(sectionKey)}
                    className={`px-3 py-2.5 ui-radius-control type-meta font-[var(--font-weight-semibold)] cursor-pointer border transition-all flex items-center justify-center gap-1.5 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                      selected
                        ? 'shadow-[var(--elevation-xs)] font-[var(--font-weight-bold)] ring-1'
                        : 'bg-ui-surface border-ui-stroke-subtle text-ui-content-secondary hover:text-ui-content-primary'
                    }`}
                    style={selected ? {
                      backgroundColor: `var(--sec-${sectionKey}-bg)`,
                      color: `var(--sec-${sectionKey}-text)`,
                      borderColor: `var(--sec-${sectionKey}-border)`,
                      ['--tw-ring-color' as any]: `var(--sec-${sectionKey}-border)`,
                    } : undefined}
                  >
                    <CategoryIcon section={sectionKey} size="xs" />
                    <span className="truncate">
                      {language === 'bn' ? section.shortNameBn : section.shortNameEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {draftSection === 'harassment' && (
            <div className="pt-1 border-t border-ui-stroke-subtle">
              <HarassmentClassificationFilters
                language={language}
                value={draftHarassmentFilters}
                onChange={setDraftHarassmentFilters}
              />
            </div>
          )}
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
          <ModalActions
            align="center"
            primary={{
              type: 'button',
              size: 'md',
              onClick: () => {
                setViewMode('reports');
                setIsAreaSheetOpen(false);
              },
              leftIcon: <MapIcon name="file-text" size="sm" ariaHidden={true} />,
              label: language === 'bn' ? 'প্রতিবেদন দেখুন' : 'View reports',
            }}
          />
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
