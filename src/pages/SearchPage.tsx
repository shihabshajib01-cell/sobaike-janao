import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, MapPin, UserX, ArrowRight, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PublicReportService } from '../services/publicReportService';
import { ReportItem } from '../types/report';
import { BANGLADESH_DISTRICTS } from '../data/districts';
import { ReportCard } from '../components/report/ReportCard';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { toBanglaDigits } from '../utils/formatters';
import { SectionKey, SECTIONS } from '../theme/tokens';
import { Select } from '../components/ui/Select';
import { HarassmentClassificationFilters } from '../components/report/HarassmentClassificationFilters';
import {
  EMPTY_HARASSMENT_CLASSIFICATION_FILTERS,
  hasActiveHarassmentClassificationFilters,
  matchesHarassmentClassification,
} from '../data/harassmentClassification';

export const SearchPage: React.FC = () => {
  const { language, navigateTo, queryParams } = useApp();
  const initialQuery = queryParams.q || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'reports' | 'locations' | 'subjects'>('all');
  const [selectedReportSegment, setSelectedReportSegment] = useState<SectionKey | 'all'>('all');
  const [harassmentFilters, setHarassmentFilters] = useState(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);

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
      console.warn('[SearchPage load error]', err);
      setFetchError('LOAD_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (queryParams.q !== undefined && queryParams.q !== query) {
      setQuery(queryParams.q);
    }
  }, [queryParams.q]);

  const hasReportFilters =
    (selectedReportSegment === 'harassment' && hasActiveHarassmentClassificationFilters(harassmentFilters)) ||
    selectedReportSegment !== 'all';
  const hasSearchIntent = Boolean(query.trim()) || hasReportFilters;

  useEffect(() => {
    if (selectedReportSegment !== 'harassment' && hasActiveHarassmentClassificationFilters(harassmentFilters)) {
      setHarassmentFilters(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);
    }
  }, [selectedReportSegment, harassmentFilters]);

  const matchingReports = useMemo(() => {
    if (!query.trim() && !hasReportFilters) return [];
    const q = query.toLowerCase().trim();
    return allReports.filter((r) => {
      if (selectedReportSegment !== 'all' && r.segment !== selectedReportSegment) return false;
      if (selectedReportSegment === 'harassment' && !matchesHarassmentClassification(r, harassmentFilters)) return false;
      if (!q) return true;
      const inTitle =
        (r.titleBn && r.titleBn.toLowerCase().includes(q)) ||
        (r.titleEn && r.titleEn.toLowerCase().includes(q));
      const inDesc =
        (r.shortDescriptionBn && r.shortDescriptionBn.toLowerCase().includes(q)) ||
        (r.shortDescriptionEn && r.shortDescriptionEn.toLowerCase().includes(q));
      const inLoc =
        (r.locationBn && !r.locationBn.includes('গোপন') && r.locationBn.toLowerCase().includes(q)) ||
        (r.locationEn && !r.locationEn.toLowerCase().includes('withheld') && r.locationEn.toLowerCase().includes(q));
      const inSub =
        (r.reportedSubject && !r.reportedSubject.includes('গোপন') && !r.reportedSubject.toLowerCase().includes('withheld') && r.reportedSubject.toLowerCase().includes(q)) ||
        (r.reportedSubjectBn && !r.reportedSubjectBn.includes('গোপন') && r.reportedSubjectBn.toLowerCase().includes(q)) ||
        (r.reportedSubjectEn && !r.reportedSubjectEn.toLowerCase().includes('withheld') && r.reportedSubjectEn.toLowerCase().includes(q));
      const inId = r.id.toLowerCase().includes(q);
      return inTitle || inDesc || inLoc || inSub || inId;
    });
  }, [allReports, query, selectedReportSegment, harassmentFilters, hasReportFilters]);

  const matchingLocations = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return BANGLADESH_DISTRICTS.filter((d) => {
      return (
        d.nameEn.toLowerCase().includes(q) ||
        d.nameBn.includes(q) ||
        d.divisionEn.toLowerCase().includes(q) ||
        d.divisionBn.includes(q)
      );
    });
  }, [query]);

  const matchingSubjects = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const subjectsMap = new Map<string, { nameBn: string; nameEn: string; count: number; sampleReport: any }>();

    allReports.forEach((r) => {
      const subjectBn = r.reportedSubjectBn || r.reportedSubject || '';
      const subjectEn = r.reportedSubjectEn || r.reportedSubject || '';

      if (
        !subjectBn ||
        subjectBn.includes('গোপন') ||
        subjectBn.toLowerCase().includes('withheld') ||
        subjectEn.toLowerCase().includes('withheld')
      ) {
        return;
      }

      if (
        (subjectBn && subjectBn.toLowerCase().includes(q)) ||
        (subjectEn && subjectEn.toLowerCase().includes(q))
      ) {
        const key = (subjectEn || subjectBn).toLowerCase();
        const existing = subjectsMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          subjectsMap.set(key, {
            nameBn: subjectBn,
            nameEn: subjectEn,
            count: 1,
            sampleReport: r,
          });
        }
      }
    });

    return Array.from(subjectsMap.values());
  }, [allReports, query]);

  const totalResults = matchingReports.length + matchingLocations.length + matchingSubjects.length;

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: language === 'bn' ? 'সকল প্রতিবেদন' : 'All reports' },
      ...(Object.values(SECTIONS) as Array<(typeof SECTIONS)[SectionKey]>).map((section) => ({
        value: section.key,
        label: language === 'bn' ? section.nameBn : section.nameEn,
      })),
    ],
    [language]
  );

  return (
    <PublicPageContainer id="search-page-container">
      <div className="space-y-1">
        <h1 className="text-[32px] leading-[42px] font-bold text-ui-content-primary tracking-tight">
          {language === 'bn' ? 'অনুসন্ধান' : 'Search'}
        </h1>
      </div>

      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-ui-content-muted absolute left-3.5 pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={
            language === 'bn'
              ? 'প্রকাশিত প্রতিবেদন অনুসন্ধান করুন'
              : 'Search published reports'
          }
          placeholder={
            language === 'bn'
              ? 'প্রতিবেদন, এলাকা, ব্যক্তি বা প্রতিষ্ঠান খুঁজুন...'
              : 'Search reports, places, people or organizations...'
          }
          className="w-full pl-10 pr-4 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:border-ui-accent rounded-xl text-[16px] text-ui-content-primary placeholder:text-ui-content-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus min-h-[44px]"
        />
      </div>

      <section className="bg-ui-surface border border-ui-stroke-subtle rounded-xl p-3.5 sm:p-4 space-y-3" aria-label={language === 'bn' ? 'প্রতিবেদন ফিল্টার' : 'Report filters'}>
        <div className="max-w-sm">
          <Select
            id="search-report-category"
            label={language === 'bn' ? 'প্রতিবেদনের ধরন' : 'Report category'}
            value={selectedReportSegment}
            onChange={(event) => setSelectedReportSegment(event.target.value as SectionKey | 'all')}
            options={categoryOptions}
          />
        </div>
        {selectedReportSegment === 'harassment' && (
          <HarassmentClassificationFilters language={language} value={harassmentFilters} onChange={setHarassmentFilters} />
        )}
      </section>

      {hasSearchIntent && (
        <div className="flex items-center gap-2 pb-2 border-b border-ui-stroke-subtle overflow-x-auto no-scrollbar">
          <button
            type="button"
            aria-pressed={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 rounded-xl text-[16px] font-semibold cursor-pointer transition-colors min-h-[44px] shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              activeTab === 'all'
                ? 'bg-ui-action-bg text-ui-action-text font-bold'
                : 'bg-ui-surface-subtle text-ui-content-secondary'
            }`}
          >
            {language === 'bn' ? 'সকল' : 'All'} ({totalResults})
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 rounded-xl text-[16px] font-semibold cursor-pointer transition-colors min-h-[44px] shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              activeTab === 'reports'
                ? 'bg-ui-action-bg text-ui-action-text font-bold'
                : 'bg-ui-surface-subtle text-ui-content-secondary'
            }`}
          >
            {language === 'bn' ? 'প্রতিবেদন' : 'Reports'} ({matchingReports.length})
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'locations'}
            onClick={() => setActiveTab('locations')}
            className={`px-4 py-2.5 rounded-xl text-[16px] font-semibold cursor-pointer transition-colors min-h-[44px] shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              activeTab === 'locations'
                ? 'bg-ui-action-bg text-ui-action-text font-bold'
                : 'bg-ui-surface-subtle text-ui-content-secondary'
            }`}
          >
            {language === 'bn' ? 'এলাকা' : 'Locations'} ({matchingLocations.length})
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'subjects'}
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2.5 rounded-xl text-[16px] font-semibold cursor-pointer transition-colors min-h-[44px] shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              activeTab === 'subjects'
                ? 'bg-ui-action-bg text-ui-action-text font-bold'
                : 'bg-ui-surface-subtle text-ui-content-secondary'
            }`}
          >
            {language === 'bn' ? 'ব্যক্তি ও প্রতিষ্ঠান' : 'People & organizations'} ({matchingSubjects.length})
          </button>
        </div>
      )}

      {isLoading && (
        <ReportFeedSkeleton
          count={3}
          id="search-feed-skeleton"
          ariaLabel={language === 'bn' ? 'অনুসন্ধান লোড হচ্ছে...' : 'Loading search...'}
        />
      )}

      {!isLoading && fetchError && (
        <div role="alert" className="bg-ui-surface border border-ui-error-border rounded-xl p-8 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-ui-error-text mx-auto" aria-hidden="true" />
          <p className="text-[16px] font-semibold text-ui-error-text">
            {language === 'bn'
              ? 'অনুসন্ধান লোড করা যায়নি।'
              : "Couldn't load search."}
          </p>
          <button
            type="button"
            onClick={loadData}
            className="btn-primary-action px-4 py-2.5 rounded-xl text-[14px] font-semibold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus cursor-pointer"
          >
            {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      )}

      {!isLoading && !fetchError && !hasSearchIntent && (
        <div className="py-14 text-center">
          <Search className="w-8 h-8 text-ui-content-muted mx-auto" aria-hidden="true" />
        </div>
      )}

      {!isLoading && !fetchError && hasSearchIntent && (
        <div className="space-y-6">
          {(activeTab === 'all' || activeTab === 'locations') && matchingLocations.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[14px] font-bold text-ui-content-secondary uppercase tracking-wider">
                {language === 'bn' ? 'এলাকা' : 'Locations'}
              </h2>
              <div className="bg-ui-surface border border-ui-stroke-subtle rounded-xl divide-y divide-ui-stroke-subtle overflow-hidden shadow-2xs">
                {matchingLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => navigateTo(`/location/${loc.id}` as any)}
                    className="w-full p-4.5 transition-colors cursor-pointer flex items-center justify-between group text-left min-h-[52px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-ui-surface-subtle flex items-center justify-center text-ui-content-secondary shrink-0">
                        <MapPin className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-[16px] font-bold text-ui-content-primary">
                          {language === 'bn' ? loc.nameBn : loc.nameEn}
                        </div>
                        <div className="text-[14px] text-ui-content-muted">
                          {language === 'bn' ? `${loc.divisionBn} বিভাগ` : `${loc.divisionEn} Division`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[14px] font-semibold text-ui-content-secondary">
                      <span>{language === 'bn' ? 'প্রতিবেদন দেখুন' : 'View reports'}</span>
                      <ArrowRight className="w-4 h-4 text-ui-content-muted" aria-hidden="true" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'subjects') && matchingSubjects.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[14px] font-bold text-ui-content-secondary uppercase tracking-wider">
                {language === 'bn' ? 'ব্যক্তি ও প্রতিষ্ঠান' : 'People & organizations'}
              </h2>
              <div className="bg-ui-surface border border-ui-stroke-subtle rounded-xl divide-y divide-ui-stroke-subtle overflow-hidden shadow-2xs">
                {matchingSubjects.map((sub) => (
                  <button
                    key={sub.nameEn || sub.nameBn}
                    type="button"
                    onClick={() => navigateTo(`/subject/${encodeURIComponent(sub.nameEn || sub.nameBn)}` as any)}
                    className="w-full p-4.5 transition-colors cursor-pointer flex items-center justify-between group text-left min-h-[52px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-ui-surface-subtle flex items-center justify-center text-ui-content-secondary shrink-0">
                        <UserX className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-[16px] font-bold text-ui-content-primary">
                          {language === 'bn' ? sub.nameBn : sub.nameEn}
                        </div>
                        <div className="text-[14px] text-ui-content-muted">
                          {language === 'bn'
                            ? `${toBanglaDigits(sub.count)}টি প্রতিবেদনে উল্লিখিত`
                            : `Mentioned in ${sub.count} reports`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[14px] font-semibold text-ui-content-secondary">
                      <span>{language === 'bn' ? 'প্রতিবেদন দেখুন' : 'View reports'}</span>
                      <ArrowRight className="w-4 h-4 text-ui-content-muted" aria-hidden="true" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'reports') && matchingReports.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[14px] font-bold text-ui-content-secondary uppercase tracking-wider">
                {language === 'bn' ? 'প্রতিবেদন' : 'Reports'}
              </h2>
              <div className="space-y-3">
                {matchingReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-10 text-center space-y-3 shadow-2xs">
              <AlertCircle className="w-8 h-8 text-ui-content-muted mx-auto" aria-hidden="true" />
              <h3 className="text-[16px] font-bold text-ui-content-primary">
                {language === 'bn' ? 'কোনো ফল পাওয়া যায়নি।' : 'No results found.'}
              </h3>
              <p className="text-[14px] text-ui-content-muted max-w-sm mx-auto leading-relaxed">
                {language === 'bn'
                  ? `"${query}" এর সাথে মিলে এমন কোনো ফলাফল পাওয়া যায়নি।`
                  : `No reports, places, or entities match "${query}".`}
              </p>
            </div>
          )}
        </div>
      )}
    </PublicPageContainer>
  );
};
