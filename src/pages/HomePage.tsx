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
import { calculateDistanceKm } from '../utils/geoDistance';

type FeedFilterType = 'all' | 'latest' | 'popular' | 'most_shared';

export const HomePage: React.FC = () => {
  const { language, browseLocation, browseLocationStatus } = useApp();

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
      console.warn('[HomePage data load error]', err);
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
      load_shedding: allReports.filter((r) => r.segment === 'load_shedding').length,
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

    const hasValidBrowseLocation =
      browseLocationStatus === 'available' &&
      browseLocation !== null &&
      typeof browseLocation.latitude === 'number' &&
      typeof browseLocation.longitude === 'number';

    const origin = hasValidBrowseLocation
      ? {
          lat: browseLocation.latitude,
          lng: browseLocation.longitude,
        }
      : null;

    if (feedFilter === 'all') {
      if (origin) {
        const withCalculatedDistance: {
          report: ReportItem;
          originalIndex: number;
          distanceKm: number | null;
        }[] = list.map((report, originalIndex) => {
          const distanceKm = report.coordinates
            ? calculateDistanceKm(origin, report.coordinates)
            : null;
          return {
            report,
            originalIndex,
            distanceKm,
          };
        });

        const groupA: typeof withCalculatedDistance = [];
        const groupB: typeof withCalculatedDistance = [];

        for (const item of withCalculatedDistance) {
          if (item.distanceKm !== null) {
            groupA.push(item);
          } else {
            groupB.push(item);
          }
        }

        groupA.sort((a, b) => {
          if (a.distanceKm! !== b.distanceKm!) {
            return a.distanceKm! - b.distanceKm!;
          }
          return a.originalIndex - b.originalIndex;
        });

        // Group B keeps its original relative order (already ordered by originalIndex)
        list = [...groupA, ...groupB].map((item) => item.report);
      }
    } else if (feedFilter === 'latest') {
      // Primary: newest published date; Secondary tie-breaker: nearest location; Fallback: ID / stable index
      const withDistance = list.map((report, originalIndex) => ({
        report,
        originalIndex,
        distanceKm: origin && report.coordinates ? calculateDistanceKm(origin, report.coordinates) : null,
      }));

      withDistance.sort((a, b) => {
        const repA = a.report;
        const repB = b.report;

        // Primary: publication date
        if (repA.publishedAt && repB.publishedAt) {
          const timeDiff = new Date(repB.publishedAt).getTime() - new Date(repA.publishedAt).getTime();
          if (timeDiff !== 0) return timeDiff;
        } else if (repA.publishedAt && !repB.publishedAt) {
          return -1;
        } else if (!repA.publishedAt && repB.publishedAt) {
          return 1;
        }

        // Secondary: location distance tie-breaker (only when both have valid distance and are tied)
        if (a.distanceKm !== null && b.distanceKm !== null && a.distanceKm !== b.distanceKm) {
          return a.distanceKm - b.distanceKm;
        }

        // Fallback: ID comparison
        const idA = parseInt(repA.id, 10) || 0;
        const idB = parseInt(repB.id, 10) || 0;
        if (idB !== idA) return idB - idA;

        // Final deterministic tie-breaker: originalIndex
        return a.originalIndex - b.originalIndex;
      });

      list = withDistance.map((item) => item.report);
    } else if (feedFilter === 'popular') {
      // Primary: related reports count; Secondary tie-breaker: nearest location; Fallback: published date / ID
      const withDistance = list.map((report, originalIndex) => ({
        report,
        originalIndex,
        distanceKm: origin && report.coordinates ? calculateDistanceKm(origin, report.coordinates) : null,
      }));

      withDistance.sort((a, b) => {
        const repA = a.report;
        const repB = b.report;

        // Primary: popularity (related report IDs)
        const relA = repA.relatedReportIds?.length || 0;
        const relB = repB.relatedReportIds?.length || 0;
        if (relB !== relA) return relB - relA;

        // Secondary: location distance tie-breaker (when popularity ties and both have valid distance)
        if (a.distanceKm !== null && b.distanceKm !== null && a.distanceKm !== b.distanceKm) {
          return a.distanceKm - b.distanceKm;
        }

        // Tertiary: publication date
        if (repA.publishedAt && repB.publishedAt) {
          const timeDiff = new Date(repB.publishedAt).getTime() - new Date(repA.publishedAt).getTime();
          if (timeDiff !== 0) return timeDiff;
        } else if (repA.publishedAt && !repB.publishedAt) {
          return -1;
        } else if (!repA.publishedAt && repB.publishedAt) {
          return 1;
        }

        // Fallback: ID comparison
        const idA = parseInt(repA.id, 10) || 0;
        const idB = parseInt(repB.id, 10) || 0;
        if (idB !== idA) return idB - idA;

        // Final deterministic tie-breaker: originalIndex
        return a.originalIndex - b.originalIndex;
      });

      list = withDistance.map((item) => item.report);
    } else if (feedFilter === 'most_shared') {
      // Primary: published date (no fake share count); Secondary tie-breaker: nearest location; Fallback: ID
      const withDistance = list.map((report, originalIndex) => ({
        report,
        originalIndex,
        distanceKm: origin && report.coordinates ? calculateDistanceKm(origin, report.coordinates) : null,
      }));

      withDistance.sort((a, b) => {
        const repA = a.report;
        const repB = b.report;

        // Primary: publication date
        if (repA.publishedAt && repB.publishedAt) {
          const timeDiff = new Date(repB.publishedAt).getTime() - new Date(repA.publishedAt).getTime();
          if (timeDiff !== 0) return timeDiff;
        } else if (repA.publishedAt && !repB.publishedAt) {
          return -1;
        } else if (!repA.publishedAt && repB.publishedAt) {
          return 1;
        }

        // Secondary: location distance tie-breaker (when published dates tie and both have valid distance)
        if (a.distanceKm !== null && b.distanceKm !== null && a.distanceKm !== b.distanceKm) {
          return a.distanceKm - b.distanceKm;
        }

        // Fallback: ID comparison
        const idA = parseInt(repA.id, 10) || 0;
        const idB = parseInt(repB.id, 10) || 0;
        if (idB !== idA) return idB - idA;

        // Final deterministic tie-breaker: originalIndex
        return a.originalIndex - b.originalIndex;
      });

      list = withDistance.map((item) => item.report);
    }

    return list;
  }, [allReports, feedFilter, selectedDistrict, browseLocation, browseLocationStatus]);

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
      {/* Semantic Page Level H1 for Screen Readers and Landmark Hierarchy */}
      <h1 className="sr-only">
        {language === 'bn'
          ? 'সবাইকে জানাও — নাগরিক প্রতিবেদন প্ল্যাটফর্ম'
          : 'Sobaike Janao — Citizen Reporting Platform'}
      </h1>

      {/* 1. Service Hero Carousel */}
      <ServiceHeroCarousel
        id="home-service-carousel"
        reportCounts={reportCounts}
        className="mb-2"
      />

      {/* 2. Combined Public Feed */}
      <section id="home-feed-section" className="space-y-4 pt-1">
        {/* Feed Header & District Filter */}
        <div className="flex items-start justify-between gap-2 sm:gap-3 border-b border-ui-stroke-subtle pb-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] sm:text-[20px] font-bold leading-[1.3] text-ui-content-primary">
              {language === 'bn' ? 'সকল প্রতিবেদন' : 'All reports'}
            </h2>
          </div>

          {/* Location Selector */}
          <div className="shrink-0">
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
            icon={<LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />}
            selected={feedFilter === 'all'}
            count={districtFilteredReports.length}
            onClick={() => setFeedFilter('all')}
          />
          <FilterChip
            id="filter-chip-latest"
            label={language === 'bn' ? 'সর্বশেষ' : 'Latest'}
            icon={<Sparkles className="w-3.5 h-3.5" aria-hidden="true" />}
            selected={feedFilter === 'latest'}
            onClick={() => setFeedFilter('latest')}
          />
          <FilterChip
            id="filter-chip-popular"
            label={language === 'bn' ? 'জনপ্রিয়' : 'Popular'}
            icon={<Flame className="w-3.5 h-3.5" aria-hidden="true" />}
            selected={feedFilter === 'popular'}
            onClick={() => setFeedFilter('popular')}
          />
          <FilterChip
            id="filter-chip-most-shared"
            label={language === 'bn' ? 'সর্বাধিক শেয়ার' : 'Most shared'}
            icon={<Share2 className="w-3.5 h-3.5" aria-hidden="true" />}
            selected={feedFilter === 'most_shared'}
            onClick={() => setFeedFilter('most_shared')}
          />
        </div>

        {/* Loading State Skeleton Screen */}
        {isLoading && (
          <ReportFeedSkeleton
            count={4}
            id="home-feed-skeleton"
            ariaLabel={language === 'bn' ? 'প্রতিবেদন লোড হচ্ছে...' : 'Loading reports...'}
          />
        )}

        {/* Error State */}
        {!isLoading && fetchError && (
          <div role="alert" className="bg-ui-surface border border-ui-error-border rounded-2xl p-6 text-center space-y-3">
            <AlertCircle className="w-6 h-6 text-ui-error-text mx-auto" aria-hidden="true" />
            <p className="text-[16px] font-semibold text-ui-error-text">
              {language === 'bn'
                ? 'প্রতিবেদন লোড করা যায়নি।'
                : 'Couldn’t load reports.'}
            </p>
            <button
              type="button"
              onClick={loadReports}
              className="btn-primary-action px-4 py-2 text-[14px] font-semibold rounded-xl min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus cursor-pointer"
            >
              {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
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
            title={language === 'bn' ? 'কোনো প্রতিবেদন নেই' : 'No reports found'}
            description={
              language === 'bn'
                ? 'এই ফিল্টারে কোনো প্রতিবেদন নেই।'
                : 'No reports match these filters.'
            }
            actionLabel={language === 'bn' ? 'ফিল্টার মুছুন' : 'Clear filters'}
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
