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

export const SearchPage: React.FC = () => {
  const { language, navigateTo, queryParams } = useApp();
  const initialQuery = queryParams.q || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'reports' | 'locations' | 'subjects'>('all');

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

  // Update query state if queryParams changes
  useEffect(() => {
    if (queryParams.q !== undefined && queryParams.q !== query) {
      setQuery(queryParams.q);
    }
  }, [queryParams.q]);

  // Search through Reports
  const matchingReports = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return allReports.filter((r) => {
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
  }, [allReports, query]);

  // Search through Locations
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

  // Search through Reported Subjects
  const matchingSubjects = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const subjectsMap = new Map<string, { nameBn: string; nameEn: string; count: number; sampleReport: any }>();

    allReports.forEach((r) => {
      const subjectBn = r.reportedSubjectBn || r.reportedSubject || '';
      const subjectEn = r.reportedSubjectEn || r.reportedSubject || '';

      // Skip withheld subjects
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

  return (
    <PublicPageContainer id="search-page-container">
      {/* Editorial Header */}
      <div className="space-y-1">
        <h1 className="text-[32px] leading-[42px] font-bold text-ui-content-primary tracking-tight">
          {language === 'bn' ? 'অনুসন্ধান' : 'Search'}
        </h1>
        <p className="text-[16px] leading-[26px] text-ui-content-secondary">
          {language === 'bn'
            ? 'বিষয়, এলাকা বা পক্ষ অনুযায়ী প্রতিবেদন খুঁজুন।'
            : 'Search reports by topic, area, or entity.'}
        </p>
      </div>

      {/* Search Input Box */}
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
              ? 'বিষয়, এলাকা বা পক্ষ অনুযায়ী খুঁজুন...'
              : 'Search by topic, area, or entity...'
          }
          className="w-full pl-10 pr-4 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:border-ui-accent rounded-xl text-[16px] text-ui-content-primary placeholder:text-ui-content-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus min-h-[44px]"
        />
      </div>

      {/* Result Category Tabs */}
      {query.trim() && (
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
            {language === 'bn' ? 'সংশ্লিষ্ট পক্ষ' : 'Entities'} ({matchingSubjects.length})
          </button>
        </div>
      )}

      {/* Loading State Skeleton Screen */}
      {isLoading && (
        <ReportFeedSkeleton
          count={3}
          id="search-feed-skeleton"
          ariaLabel={language === 'bn' ? 'অনুসন্ধান লোড হচ্ছে...' : 'Loading search index...'}
        />
      )}

      {/* Error State */}
      {!isLoading && fetchError && (
        <div role="alert" className="bg-ui-surface border border-ui-error-border rounded-xl p-8 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-ui-error-text mx-auto" aria-hidden="true" />
          <p className="text-[16px] font-semibold text-ui-error-text">
            {language === 'bn'
              ? 'অনুসন্ধান ডেটা লোড করা যায়নি।'
              : 'Couldn’t load search data.'}
          </p>
          <button
            type="button"
            onClick={loadData}
            className="btn-primary-action px-4 py-2.5 rounded-xl text-[14px] font-semibold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus cursor-pointer"
          >
            {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      )}

      {/* Initial Empty / Instructional State */}
      {!isLoading && !fetchError && !query.trim() && (
        <div className="py-14 text-center space-y-3">
          <Search className="w-8 h-8 text-ui-content-muted mx-auto" aria-hidden="true" />
          <p className="text-[16px] leading-[26px] text-ui-content-secondary font-medium max-w-md mx-auto">
            {language === 'bn'
              ? 'বিষয়, এলাকা বা পক্ষ অনুযায়ী অনুসন্ধান করুন।'
              : 'Search by topic, area, or entity name.'}
          </p>
        </div>
      )}

      {/* Results Content */}
      {!isLoading && !fetchError && query.trim() && (
        <div className="space-y-6">
          {/* 1. Locations Section */}
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

          {/* 2. Subjects Section */}
          {(activeTab === 'all' || activeTab === 'subjects') && matchingSubjects.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[14px] font-bold text-ui-content-secondary uppercase tracking-wider">
                {language === 'bn' ? 'সংশ্লিষ্ট পক্ষ' : 'Reported entities'}
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

          {/* 3. Reports Section */}
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

          {/* Empty State */}
          {totalResults === 0 && (
            <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-10 text-center space-y-3 shadow-2xs">
              <AlertCircle className="w-8 h-8 text-ui-content-muted mx-auto" aria-hidden="true" />
              <h3 className="text-[16px] font-bold text-ui-content-primary">
                {language === 'bn' ? 'কোনো ফলাফল নেই' : 'No results found'}
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
