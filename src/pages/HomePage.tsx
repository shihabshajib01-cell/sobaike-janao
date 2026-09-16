import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { SectionKey } from '../theme/tokens';
import { PublicReportService } from '../services/publicReportService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { LocationSelector } from '../components/feed/LocationSelector';
import { FilterChip } from '../components/ui/FilterChip';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { ServiceHeroCarousel } from '../components/home/ServiceHeroCarousel';
import { useApp } from '../context/AppContext';
import { VisitorSessionService } from '../services/visitorSessionService';

type FeedFilterType = 'all' | 'latest';

const INITIAL_VISIBLE_REPORT_COUNT = 10;
const LOAD_MORE_REPORT_COUNT = 10;

export const HomePage: React.FC = () => {
  const { language, browseLocation, browseLocationStatus } = useApp();

  const [allReports, setAllReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [feedFilter, setFeedFilter] = useState<FeedFilterType>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_REPORT_COUNT);

  // Determine valid browse location (transient request scope only)
  const hasValidBrowseLocation =
    browseLocationStatus === 'available' &&
    browseLocation !== null &&
    typeof browseLocation.latitude === 'number' &&
    typeof browseLocation.longitude === 'number' &&
    VisitorSessionService.isLocationFresh(browseLocation);

  const visitorLat = hasValidBrowseLocation ? browseLocation.latitude : null;
  const visitorLng = hasValidBrowseLocation ? browseLocation.longitude : null;

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const reports = await PublicReportService.getHomeFeed({
        visitorLat,
        visitorLng,
        filter: feedFilter,
        district: selectedDistrict,
      });
      setAllReports(reports);
    } catch (err) {
      console.warn('[HomePage data load error]', err);
      setFetchError('LOAD_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, [visitorLat, visitorLng, feedFilter, selectedDistrict]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Phase 7: Reset visible count whenever ranking context changes
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_REPORT_COUNT);
  }, [feedFilter, selectedDistrict, visitorLat, visitorLng]);

  // Compute report counts per segment for the carousel
  const reportCounts: Partial<Record<SectionKey, number>> = useMemo(() => {
    return {
      harassment: allReports.filter((r) => r.segment === 'harassment').length,
      rickshaw: allReports.filter((r) => r.segment === 'rickshaw').length,
      extortion: allReports.filter((r) => r.segment === 'extortion').length,
      load_shedding: allReports.filter((r) => r.segment === 'load_shedding').length,
    };
  }, [allReports]);

  // Filtered and ranked reports returned directly from the shadow-ranked backend
  const filteredReports = useMemo(() => {
    return allReports;
  }, [allReports]);

  // Phase 7: Slice visible reports for progressive reveal
  const visibleReports = useMemo(() => {
    return filteredReports.slice(0, visibleCount);
  }, [filteredReports, visibleCount]);

  const hasMoreReports = visibleReports.length < filteredReports.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + LOAD_MORE_REPORT_COUNT);
  }, []);

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
            <h2 className="text-[var(--type-fixed-18)] sm:text-[var(--type-fixed-20)] font-bold leading-[var(--type-line-ratio-130)] text-ui-content-primary">
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

        {/* Feed Control Chips: সব | সর্বশেষ */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
          <FilterChip
            id="filter-chip-all"
            label={language === 'bn' ? 'সব' : 'All'}
            icon={<LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />}
            selected={feedFilter === 'all'}
            count={filteredReports.length}
            onClick={() => setFeedFilter('all')}
          />
          <FilterChip
            id="filter-chip-latest"
            label={language === 'bn' ? 'সর্বশেষ' : 'Latest'}
            icon={<Sparkles className="w-3.5 h-3.5" aria-hidden="true" />}
            selected={feedFilter === 'latest'}
            onClick={() => setFeedFilter('latest')}
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
          <div role="alert" className="bg-ui-surface border border-ui-error-border rounded-[var(--radius-card)] p-6 text-center space-y-3">
            <AlertCircle className="w-6 h-6 text-ui-error-text mx-auto" aria-hidden="true" />
            <p className="text-[var(--type-fixed-16)] font-semibold text-ui-error-text">
              {language === 'bn'
                ? 'প্রতিবেদন লোড করা যায়নি।'
                : 'Couldn’t load reports.'}
            </p>
            <button
              type="button"
              onClick={loadReports}
              className="btn-primary-action px-4 py-2 text-[var(--type-fixed-14)] font-semibold rounded-[var(--radius-control)] min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus cursor-pointer"
            >
              {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
            </button>
          </div>
        )}

        {/* Feed List of Report Cards (Phase 7 Progressive Rendering) */}
        {!isLoading && !fetchError && visibleReports.length > 0 && (
          <div className="space-y-3">
            {visibleReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}

            {/* Phase 7 Load More Button */}
            {hasMoreReports && (
              <div className="pt-2 flex justify-center">
                <Button
                  id="home-load-more-button"
                  variant="secondary"
                  size="md"
                  onClick={handleLoadMore}
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  {language === 'bn' ? 'আরও প্রতিবেদন দেখুন' : 'Load more reports'}
                </Button>
              </div>
            )}
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
