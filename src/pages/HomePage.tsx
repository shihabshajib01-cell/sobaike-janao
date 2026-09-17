import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  Sparkles,
  LayoutGrid,
  TrendingUp,
} from 'lucide-react';
import { PublicReportService } from '../services/publicReportService';
import { PublicEngagementService } from '../services/publicEngagementService';
import { PublicFeedUpdateService } from '../services/publicFeedUpdateService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { LocationSelector } from '../components/feed/LocationSelector';
import { NewReportsNotice } from '../components/feed/NewReportsNotice';
import { FilterChip } from '../components/ui/FilterChip';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { HorizontalScrollRail } from '../components/ui/HorizontalScrollRail';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { ServiceHeroCarousel } from '../components/home/ServiceHeroCarousel';
import { useApp } from '../context/AppContext';
import { VisitorSessionService } from '../services/visitorSessionService';

type FeedFilterType = 'all' | 'latest' | 'popular';

interface LoadReportsOptions {
  background?: boolean;
}

const INITIAL_VISIBLE_REPORT_COUNT = 10;
const LOAD_MORE_REPORT_COUNT = 10;
const FEED_UPDATE_POLL_INTERVAL_MS = 30_000;

export const HomePage: React.FC = () => {
  const { language, browseLocation, browseLocationStatus } = useApp();

  const [allReports, setAllReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [feedFilter, setFeedFilter] = useState<FeedFilterType>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_REPORT_COUNT);
  const [feedWatermark, setFeedWatermark] = useState<string | null>(null);
  const [newReportCount, setNewReportCount] = useState<number>(0);
  const [pendingNewestPublishedAt, setPendingNewestPublishedAt] = useState<string | null>(null);
  const [isRefreshingNewReports, setIsRefreshingNewReports] = useState<boolean>(false);

  const hasValidBrowseLocation =
    browseLocationStatus === 'available' &&
    browseLocation !== null &&
    typeof browseLocation.latitude === 'number' &&
    typeof browseLocation.longitude === 'number' &&
    VisitorSessionService.isLocationFresh(browseLocation);

  const visitorLat = hasValidBrowseLocation ? browseLocation.latitude : null;
  const visitorLng = hasValidBrowseLocation ? browseLocation.longitude : null;

  const loadReports = useCallback(async (options?: LoadReportsOptions): Promise<boolean> => {
    const background = options?.background === true;

    if (!background) {
      setIsLoading(true);
      setFetchError(null);
    }

    try {
      const reports = await PublicReportService.getHomeFeed({
        visitorLat,
        visitorLng,
        filter: feedFilter === 'popular' ? 'all' : feedFilter,
        district: selectedDistrict,
      });

      if (feedFilter === 'popular') {
        const counts = await PublicEngagementService.getAllCounts();
        reports.sort((a, b) => {
          const aCounts = counts.get(a.id.trim().toUpperCase()) || { viewCount: 0, shareCount: 0 };
          const bCounts = counts.get(b.id.trim().toUpperCase()) || { viewCount: 0, shareCount: 0 };
          if (bCounts.viewCount !== aCounts.viewCount) {
            return bCounts.viewCount - aCounts.viewCount;
          }
          if (bCounts.shareCount !== aCounts.shareCount) {
            return bCounts.shareCount - aCounts.shareCount;
          }
          return (b.publishedAt || '').localeCompare(a.publishedAt || '');
        });
      }

      setAllReports(reports);
      return true;
    } catch (err) {
      console.warn('[HomePage data load error]', err);
      if (!background) {
        setFetchError('LOAD_ERROR');
      }
      return false;
    } finally {
      if (!background) {
        setIsLoading(false);
      }
    }
  }, [visitorLat, visitorLng, feedFilter, selectedDistrict]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_REPORT_COUNT);
    setFeedWatermark(null);
    setNewReportCount(0);
    setPendingNewestPublishedAt(null);
  }, [feedFilter, selectedDistrict, visitorLat, visitorLng]);

  useEffect(() => {
    if (isLoading || fetchError || feedWatermark) return;

    let cancelled = false;

    const establishFeedWatermark = async () => {
      try {
        const state = await PublicFeedUpdateService.getState({
          district: selectedDistrict,
        });

        if (!cancelled) {
          setFeedWatermark(state.newestPublishedAt || state.checkedAt);
          setNewReportCount(0);
          setPendingNewestPublishedAt(null);
        }
      } catch (err) {
        console.warn('[HomePage feed watermark error]', err);
        if (!cancelled) {
          setFeedWatermark(new Date().toISOString());
        }
      }
    };

    void establishFeedWatermark();

    return () => {
      cancelled = true;
    };
  }, [isLoading, fetchError, feedWatermark, selectedDistrict]);

  useEffect(() => {
    if (!feedWatermark || isLoading || fetchError) return;

    let cancelled = false;
    let checkInFlight = false;

    const checkForNewReports = async () => {
      if (
        cancelled ||
        checkInFlight ||
        document.visibilityState === 'hidden' ||
        !navigator.onLine
      ) {
        return;
      }

      checkInFlight = true;
      try {
        const state = await PublicFeedUpdateService.getState({
          since: feedWatermark,
          district: selectedDistrict,
        });

        if (!cancelled) {
          setNewReportCount(state.newCount);
          setPendingNewestPublishedAt(state.newCount > 0 ? state.newestPublishedAt : null);
        }
      } catch (err) {
        console.warn('[HomePage feed update check error]', err);
      } finally {
        checkInFlight = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void checkForNewReports();
    }, FEED_UPDATE_POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkForNewReports();
      }
    };

    const handleOnline = () => {
      void checkForNewReports();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [feedWatermark, selectedDistrict, isLoading, fetchError]);

  const handleRefreshNewReports = useCallback(async () => {
    if (isRefreshingNewReports) return;

    setIsRefreshingNewReports(true);
    try {
      const refreshed = await loadReports({ background: true });
      if (!refreshed) return;

      setFeedWatermark(pendingNewestPublishedAt || new Date().toISOString());
      setNewReportCount(0);
      setPendingNewestPublishedAt(null);
      setVisibleCount(INITIAL_VISIBLE_REPORT_COUNT);

      document.getElementById('home-feed-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } finally {
      setIsRefreshingNewReports(false);
    }
  }, [isRefreshingNewReports, loadReports, pendingNewestPublishedAt]);

  const filteredReports = useMemo(() => allReports, [allReports]);

  const visibleReports = useMemo(() => {
    return filteredReports.slice(0, visibleCount);
  }, [filteredReports, visibleCount]);

  const hasMoreReports = visibleReports.length < filteredReports.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + LOAD_MORE_REPORT_COUNT);
  }, []);

  return (
    <PublicPageContainer id="home-page-container">
      <h1 className="sr-only">
        {language === 'bn'
          ? 'সবাইকে জানাও — নাগরিক প্রতিবেদন প্ল্যাটফর্ম'
          : 'Sobaike Janao — Citizen Reporting Platform'}
      </h1>

      <ServiceHeroCarousel id="home-service-carousel" className="mb-2" />

      <section id="home-feed-section" className="space-y-4 pt-1">
        <div className="flex items-start justify-between gap-2 sm:gap-3 border-b border-ui-stroke-subtle pb-3">
          <div className="min-w-0 flex-1">
            <h2 className="type-h2 text-ui-content-primary">
              {language === 'bn' ? 'সকল প্রতিবেদন' : 'All reports'}
            </h2>
          </div>

          <div className="shrink-0">
            <LocationSelector selectedDistrict={selectedDistrict} onSelectDistrict={setSelectedDistrict} />
          </div>
        </div>

        <HorizontalScrollRail
          id="home-feed-filter-rail"
          ariaLabel={language === 'bn' ? 'প্রতিবেদন ফিল্টার' : 'Report filters'}
          previousLabel={language === 'bn' ? 'আগের ফিল্টারগুলো দেখুন' : 'Show previous filters'}
          nextLabel={language === 'bn' ? 'পরের ফিল্টারগুলো দেখুন' : 'Show more filters'}
          className="gap-1.5 sm:gap-2"
        >
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
          <FilterChip
            id="filter-chip-popular"
            label={language === 'bn' ? 'জনপ্রিয়' : 'Popular'}
            icon={<TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />}
            selected={feedFilter === 'popular'}
            onClick={() => setFeedFilter('popular')}
          />
        </HorizontalScrollRail>

        <NewReportsNotice
          count={newReportCount}
          language={language}
          isRefreshing={isRefreshingNewReports}
          onRefresh={() => void handleRefreshNewReports()}
        />

        {isLoading && (
          <ReportFeedSkeleton
            count={4}
            id="home-feed-skeleton"
            ariaLabel={language === 'bn' ? 'প্রতিবেদন লোড হচ্ছে...' : 'Loading reports...'}
          />
        )}

        {!isLoading && fetchError && (
          <div role="alert" className="ui-card p-6 text-center space-y-3 border-ui-error-border">
            <AlertCircle className="w-6 h-6 text-ui-error-text mx-auto" aria-hidden="true" />
            <p className="type-h4 font-[var(--font-weight-semibold)] text-ui-error-text">
              {language === 'bn' ? 'প্রতিবেদন লোড করা যায়নি।' : 'Couldn’t load reports.'}
            </p>
            <Button variant="primary" size="md" onClick={() => void loadReports()}>
              {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
            </Button>
          </div>
        )}

        {!isLoading && !fetchError && visibleReports.length > 0 && (
          <div className="space-y-3">
            {visibleReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}

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
            description={language === 'bn' ? 'এই ফিল্টারে কোনো প্রতিবেদন নেই।' : 'No reports match these filters.'}
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