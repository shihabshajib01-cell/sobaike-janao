import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  Sparkles,
  LayoutGrid,
  Flame,
  Share2,
} from 'lucide-react';
import { SectionKey } from '../theme/tokens';
import { PublicReportService } from '../services/publicReportService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { LocationSelector } from '../components/feed/LocationSelector';
import { FilterChip } from '../components/ui/FilterChip';
import { EmptyState } from '../components/ui/EmptyState';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { ServiceHeroCarousel } from '../components/home/ServiceHeroCarousel';
import { useApp } from '../context/AppContext';

type FeedFilterType = 'all' | 'latest' | 'popular' | 'most_shared';

export const HomePage: React.FC = () => {
  const { language } = useApp();

  const [allReports, setAllReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [feedFilter, setFeedFilter] = useState<FeedFilterType>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const reports = await PublicReportService.getAll();
      setAllReports(reports);
    } catch (err) {
      console.error('[HomePage data load error]', err);
      setFetchError('LOAD_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Compute report counts per segment for the carousel
  const reportCounts: Partial<Record<SectionKey, number>> = useMemo(() => {
    return {
      harassment: allReports.filter((r) => r.segment === 'harassment').length,
      rickshaw: allReports.filter((r) => r.segment === 'rickshaw').length,
      extortion: allReports.filter((r) => r.segment === 'extortion').length,
    };
  }, [allReports]);

  // Filtered and sorted list of reports for the feed
  const filteredReports = useMemo(() => {
    let list = allReports.filter((report) => {
      const matchesDistrict =
        selectedDistrict === 'all' ||
        (report.districtBn && report.districtBn.includes(selectedDistrict)) ||
        (report.districtEn && report.districtEn.toLowerCase().includes(selectedDistrict.toLowerCase()));

      return matchesDistrict;
    });

    if (feedFilter === 'latest') {
      // Sort newest published date
      list = [...list].sort((a, b) => {
        if (a.publishedAt && b.publishedAt) {
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        }
        const idA = parseInt(a.id, 10) || 0;
        const idB = parseInt(b.id, 10) || 0;
        return idB - idA;
      });
    } else if (feedFilter === 'popular') {
      // If popularity/response/view data exists, sort; otherwise keep clean order without inventing fake numbers
      list = [...list].sort((a, b) => {
        const relA = a.relatedReportIds?.length || 0;
        const relB = b.relatedReportIds?.length || 0;
        if (relB !== relA) return relB - relA;
        if (a.publishedAt && b.publishedAt) {
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        }
        const idA = parseInt(a.id, 10) || 0;
        const idB = parseInt(b.id, 10) || 0;
        return idB - idA;
      });
    } else if (feedFilter === 'most_shared') {
      // UI ready without fake mock metrics
      list = [...list].sort((a, b) => {
        if (a.publishedAt && b.publishedAt) {
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        }
        const idA = parseInt(a.id, 10) || 0;
        const idB = parseInt(b.id, 10) || 0;
        return idB - idA;
      });
    }

    return list;
  }, [allReports, feedFilter, selectedDistrict]);

  // Counts for the feed filter chips based on selected district
  const districtFilteredReports = useMemo(() => {
    if (selectedDistrict === 'all') return allReports;
    return allReports.filter(
      (r) =>
        r.districtBn.includes(selectedDistrict) ||
        r.districtEn.toLowerCase().includes(selectedDistrict.toLowerCase())
    );
  }, [allReports, selectedDistrict]);

  return (
    <PublicPageContainer id="home-page-container">
      {/* 1. Service Hero Carousel (Desktop / Tablet only) */}
      <ServiceHeroCarousel
        id="home-service-carousel"
        reportCounts={reportCounts}
        className="hidden md:block"
      />

      {/* 2. Combined Public Feed */}
      <section id="home-feed-section" className="space-y-4 pt-1">
        {/* Feed Header & District Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle pb-3">
          <div>
            <h2 className="text-[20px] font-bold leading-[1.3] text-primary">
              {language === 'bn' ? 'সাম্প্রতিক প্রকাশনা ও প্রতিবেদন' : 'Recent Public Reports'}
            </h2>
            <p className="text-[14px] leading-[1.5] text-secondary mt-0.5">
              {language === 'bn'
                ? 'মডারেশন শেষে প্রকাশিত নাগরিক প্রতিবেদনের সময়ানুক্রমিক ফিড'
                : 'Moderated public feed across citizen reporting categories'}
            </p>
          </div>

          {/* Location Selector */}
          <div className="shrink-0 flex items-center gap-2">
            <LocationSelector
              selectedDistrict={selectedDistrict}
              onSelectDistrict={setSelectedDistrict}
            />
          </div>
        </div>

        {/* Feed Control Chips: সব | সর্বশেষ | জনপ্রিয় | সর্বাধিক শেয়ার */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
          <FilterChip
            id="filter-chip-all"
            label={language === 'bn' ? 'সব' : 'All'}
            icon={<LayoutGrid className="w-3.5 h-3.5" />}
            selected={feedFilter === 'all'}
            count={districtFilteredReports.length}
            onClick={() => setFeedFilter('all')}
          />
          <FilterChip
            id="filter-chip-latest"
            label={language === 'bn' ? 'সর্বশেষ' : 'Latest'}
            icon={<Sparkles className="w-3.5 h-3.5" />}
            selected={feedFilter === 'latest'}
            onClick={() => setFeedFilter('latest')}
          />
          <FilterChip
            id="filter-chip-popular"
            label={language === 'bn' ? 'জনপ্রিয়' : 'Popular'}
            icon={<Flame className="w-3.5 h-3.5" />}
            selected={feedFilter === 'popular'}
            onClick={() => setFeedFilter('popular')}
          />
          <FilterChip
            id="filter-chip-most-shared"
            label={language === 'bn' ? 'সর্বাধিক শেয়ার' : 'Most Shared'}
            icon={<Share2 className="w-3.5 h-3.5" />}
            selected={feedFilter === 'most_shared'}
            onClick={() => setFeedFilter('most_shared')}
          />
        </div>

        {/* Loading State Skeleton Screen */}
        {isLoading && (
          <ReportFeedSkeleton
            count={4}
            id="home-feed-skeleton"
            ariaLabel={language === 'bn' ? 'পাবলিক প্রতিবেদন লোড হচ্ছে...' : 'Loading published reports...'}
          />
        )}

        {/* Error State */}
        {!isLoading && fetchError && (
          <div className="bg-surface border border-rose-500/30 rounded-2xl p-6 text-center space-y-3">
            <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
            <p className="text-[16px] font-semibold text-rose-500">
              {language === 'bn'
                ? 'সার্ভার থেকে পাবলিক ডেটা লোড করতে সমস্যা হয়েছে।'
                : 'Unable to load public reports from server. Please check your connection.'}
            </p>
            <button
              onClick={loadReports}
              className="btn-primary-action px-4 py-2 text-[14px] font-semibold rounded-xl min-h-[44px]"
            >
              {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
            </button>
          </div>
        )}

        {/* Feed List of Report Cards */}
        {!isLoading && !fetchError && filteredReports.length > 0 && (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}

        {!isLoading && !fetchError && filteredReports.length === 0 && (
          <EmptyState
            title={language === 'bn' ? 'কোনো প্রতিবেদন পাওয়া যায়নি' : 'No Reports Found'}
            description={
              language === 'bn'
                ? 'নির্বাচিত ফিল্টার বা এলাকার জন্য বর্তমানে কোনো প্রকাশিত প্রতিবেদন নেই।'
                : 'There are currently no published reports matching your selected filters.'
            }
            actionLabel={language === 'bn' ? 'সকল ফিল্টার রিসেট করুন' : 'Reset Filters'}
            onAction={() => {
              setFeedFilter('all');
              setSelectedDistrict('all');
            }}
          />
        )}
      </section>
    </PublicPageContainer>
  );
};
