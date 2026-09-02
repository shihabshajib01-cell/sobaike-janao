import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, MapPin, UserX, FileText, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PublicReportService } from '../services/publicReportService';
import { ReportItem } from '../types/report';
import { BANGLADESH_DISTRICTS } from '../data/districts';
import { ReportCard } from '../components/report/ReportCard';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';

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
        <h1 className="text-[32px] leading-[42px] font-bold text-primary tracking-tight">
          {language === 'bn' ? 'অনুসন্ধান' : 'Search'}
        </h1>
        <p className="text-[16px] leading-[26px] text-secondary">
          {language === 'bn'
            ? 'বিষয়, জেলা বা সংশ্লিষ্ট পক্ষের নাম দিয়ে প্রকাশিত প্রতিবেদন অনুসন্ধান করুন।'
            : 'Find published reports, locations, or reported entities.'}
        </p>
      </div>

      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-muted absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            language === 'bn'
              ? 'বিষয়, স্থান, ব্যক্তি বা প্রতিষ্ঠানের নাম দিয়ে খুঁজুন...'
              : 'Search reports, districts, subjects, or organizations...'
          }
          className="w-full pl-10 pr-4 py-2.5 bg-surface border border-subtle focus:border-[var(--ui-accent)] rounded-xl text-[16px] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] min-h-[44px]"
        />
      </div>

      {/* Result Category Tabs */}
      {query.trim() && (
        <div className="flex items-center gap-2 pb-2 border-b border-subtle overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2.5 rounded-xl text-[16px] font-semibold cursor-pointer transition-colors min-h-[44px] shrink-0 ${
              activeTab === 'all'
                ? 'bg-[var(--ui-primary-action-bg)] text-[var(--ui-primary-action-text)] font-bold'
                : 'bg-surface-subtle text-secondary hover:bg-surface-elevated'
            }`}
          >
            {language === 'bn' ? 'সকল' : 'All'} ({totalResults})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 rounded-xl text-[16px] font-semibold cursor-pointer transition-colors min-h-[44px] shrink-0 ${
              activeTab === 'reports'
                ? 'bg-[var(--ui-primary-action-bg)] text-[var(--ui-primary-action-text)] font-bold'
                : 'bg-surface-subtle text-secondary hover:bg-surface-elevated'
            }`}
          >
            {language === 'bn' ? 'প্রতিবেদন' : 'Reports'} ({matchingReports.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('locations')}
            className={`px-4 py-2.5 rounded-xl text-[16px] font-semibold cursor-pointer transition-colors min-h-[44px] shrink-0 ${
              activeTab === 'locations'
                ? 'bg-[var(--ui-primary-action-bg)] text-[var(--ui-primary-action-text)] font-bold'
                : 'bg-surface-subtle text-secondary hover:bg-surface-elevated'
            }`}
          >
            {language === 'bn' ? 'জেলা ও এলাকা' : 'Locations'} ({matchingLocations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2.5 rounded-xl text-[16px] font-semibold cursor-pointer transition-colors min-h-[44px] shrink-0 ${
              activeTab === 'subjects'
                ? 'bg-[var(--ui-primary-action-bg)] text-[var(--ui-primary-action-text)] font-bold'
                : 'bg-surface-subtle text-secondary hover:bg-surface-elevated'
            }`}
          >
            {language === 'bn' ? 'সংশ্লিষ্ট পক্ষ' : 'Subjects'} ({matchingSubjects.length})
          </button>
        </div>
      )}

      {/* Loading State Skeleton Screen */}
      {isLoading && (
        <ReportFeedSkeleton
          count={3}
          id="search-feed-skeleton"
          ariaLabel={language === 'bn' ? 'অনুসন্ধান ডেটা প্রস্তুত করা হচ্ছে...' : 'Preparing search index...'}
        />
      )}

      {/* Error State */}
      {!isLoading && fetchError && (
        <div className="bg-surface border border-rose-500/30 rounded-xl p-8 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-[16px] font-semibold text-rose-500">
            {language === 'bn'
              ? 'অনুসন্ধান ডেটা লোড করতে সমস্যা হয়েছে।'
              : 'Unable to load public data for search. Please try again.'}
          </p>
          <button
            onClick={loadData}
            className="btn-primary-action px-4 py-2.5 rounded-xl text-[14px] font-semibold min-h-[44px]"
          >
            {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      )}

      {/* Initial Empty / Instructional State (Flattened per design rules) */}
      {!isLoading && !fetchError && !query.trim() && (
        <div className="py-14 text-center space-y-3">
          <Search className="w-8 h-8 text-muted mx-auto" />
          <p className="text-[16px] leading-[26px] text-secondary font-medium max-w-md mx-auto">
            {language === 'bn'
              ? 'নাম, এলাকা, বিষয় বা প্রকাশিত তথ্য দিয়ে অনুসন্ধান করুন।'
              : 'Search by subject, location, category, or published information.'}
          </p>
        </div>
      )}

      {/* Results Content */}
      {!isLoading && !fetchError && query.trim() && (
        <div className="space-y-6">
          {/* 1. Locations Section */}
          {(activeTab === 'all' || activeTab === 'locations') && matchingLocations.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[14px] font-bold text-secondary uppercase tracking-wider">
                {language === 'bn' ? 'জেলা ও এলাকা ফলাফল' : 'Location Matches'}
              </h2>
              <div className="bg-surface border border-subtle rounded-xl divide-y divide-subtle overflow-hidden shadow-2xs">
                {matchingLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => navigateTo(`/location/${loc.id}` as any)}
                    className="w-full p-4.5 hover:bg-surface-subtle transition-colors cursor-pointer flex items-center justify-between group text-left min-h-[52px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-subtle flex items-center justify-center text-secondary shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[16px] font-bold text-primary">
                          {language === 'bn' ? loc.nameBn : loc.nameEn}
                        </div>
                        <div className="text-[14px] text-muted">
                          {language === 'bn' ? `${loc.divisionBn} বিভাগ` : `${loc.divisionEn} Division`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[14px] font-semibold text-secondary group-hover:text-primary">
                      <span>{language === 'bn' ? 'প্রতিবেদন দেখুন' : 'View reports'}</span>
                      <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Subjects Section */}
          {(activeTab === 'all' || activeTab === 'subjects') && matchingSubjects.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[14px] font-bold text-secondary uppercase tracking-wider">
                {language === 'bn' ? 'সংশ্লিষ্ট পক্ষ ফলাফল' : 'Reported Subject Matches'}
              </h2>
              <div className="bg-surface border border-subtle rounded-xl divide-y divide-subtle overflow-hidden shadow-2xs">
                {matchingSubjects.map((sub) => (
                  <button
                    key={sub.nameEn || sub.nameBn}
                    type="button"
                    onClick={() => navigateTo(`/subject/${encodeURIComponent(sub.nameEn || sub.nameBn)}` as any)}
                    className="w-full p-4.5 hover:bg-surface-subtle transition-colors cursor-pointer flex items-center justify-between group text-left min-h-[52px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-subtle flex items-center justify-center text-secondary shrink-0">
                        <UserX className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[16px] font-bold text-primary">
                          {language === 'bn' ? sub.nameBn : sub.nameEn}
                        </div>
                        <div className="text-[14px] text-muted">
                          {language === 'bn'
                            ? `${sub.count}টি প্রকাশিত প্রতিবেদনে উল্লিখিত`
                            : `Mentioned in ${sub.count} published reports`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[14px] font-semibold text-secondary group-hover:text-primary">
                      <span>{language === 'bn' ? 'রেকর্ড দেখুন' : 'View records'}</span>
                      <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Reports Section */}
          {(activeTab === 'all' || activeTab === 'reports') && matchingReports.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[14px] font-bold text-secondary uppercase tracking-wider">
                {language === 'bn' ? 'প্রতিবেদন ফলাফল' : 'Matching Reports'}
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
            <div className="bg-surface border border-subtle rounded-2xl p-10 text-center space-y-3 shadow-2xs">
              <AlertCircle className="w-8 h-8 text-muted mx-auto" />
              <h3 className="text-[16px] font-bold text-primary">
                {language === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No Results Found'}
              </h3>
              <p className="text-[14px] text-muted max-w-sm mx-auto leading-relaxed">
                {language === 'bn'
                  ? `"${query}" এর সাথে মিলে এমন কোনো প্রতিবেদন, এলাকা বা পক্ষ পাওয়া যায়নি।`
                  : `No public reports, places, or entities matched "${query}".`}
              </p>
            </div>
          )}
        </div>
      )}
    </PublicPageContainer>
  );
};
