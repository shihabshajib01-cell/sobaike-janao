import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  AlertCircle,
  Sparkles,
  LayoutGrid,
  TrendingUp,
  LoaderCircle,
} from 'lucide-react';
import { PublicFeedUpdateService } from '../services/publicFeedUpdateService';
import { ReportItem } from '../types/report';
import { VirtualizedReportFeed } from '../components/report/VirtualizedReportFeed';
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
import { scheduleIdleTask } from '../utils/scheduleIdleTask';

type FeedFilterType = 'all' | 'latest' | 'popular';

interface LoadReportsOptions {
  background?: boolean;
  append?: boolean;
  offset?: number;
}

const HOME_FEED_PAGE_SIZE = 10;
const FEED_UPDATE_POLL_INTERVAL_MS = 30_000;
const HOME_FEED_PREFETCH_MARGIN = '720px 0px';
const HOME_FEED_REDUCED_PREFETCH_MARGIN = '160px 0px';

const getHomeFeedPrefetchMargin = (): string => {
  if (typeof navigator === 'undefined') return HOME_FEED_PREFETCH_MARGIN;

  const connection = (
    navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        effectiveType?: string;
      };
    }
  ).connection;

  if (
    connection?.saveData ||
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g'
  ) {
    return HOME_FEED_REDUCED_PREFETCH_MARGIN;
  }

  if (connection?.effectiveType === '3g') {
    return '360px 0px';
  }

  return HOME_FEED_PREFETCH_MARGIN;
};

export const HomePage: React.FC = () => {
  const { language, browseLocation, browseLocationStatus } = useApp();

  const [allReports, setAllReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [feedFilter, setFeedFilter] = useState<FeedFilterType>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [hasMoreReports, setHasMoreReports] = useState(false);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [totalReportCount, setTotalReportCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreInFlightRef = useRef(false);
  const lastLoadMoreOffsetRef = useRef<number | null>(null);
  const feedGenerationRef = useRef(0);
  const [feedWatermark, setFeedWatermark] = useState<string | null>(null);
  const [newReportCount, setNewReportCount] = useState<number>(0);
  const [pendingNewestPublishedAt, setPendingNewestPublishedAt] = useState<string | null>(null);
  const [isRefreshingNewReports, setIsRefreshingNewReports] = useState<boolean>(false);

  // AppContext owns source-aware freshness for both device and IP
  // locations. Home only consumes the currently valid global browse state.
  const hasValidBrowseLocation =
    browseLocationStatus === 'available' &&
    browseLocation !== null &&
    typeof browseLocation.latitude === 'number' &&
    typeof browseLocation.longitude === 'number';

  const visitorLat = hasValidBrowseLocation ? browseLocation.latitude : null;
  const visitorLng = hasValidBrowseLocation ? browseLocation.longitude : null;

  const loadReports = useCallback(async (options?: LoadReportsOptions): Promise<boolean> => {
    const background = options?.background === true;
    const append = options?.append === true;
    const offset = Math.max(0, options?.offset || 0);
    const requestGeneration = feedGenerationRef.current;

    if (!background && !append) {
      setIsLoading(true);
      setFetchError(null);
    }

    try {
      const { PublicReportService } = await import('../services/publicReportService');
      const page = await PublicReportService.getHomeFeedPage({
        visitorLat,
        visitorLng,
        filter: feedFilter,
        district: selectedDistrict,
        offset,
        limit: HOME_FEED_PAGE_SIZE,
      });

      if (requestGeneration !== feedGenerationRef.current) {
        return false;
      }

      setAllReports((current) => {
        if (!append) return page.reports;
        const existingIds = new Set(current.map((report) => report.id));
        const nextReports = page.reports.filter((report) => !existingIds.has(report.id));
        return [...current, ...nextReports];
      });
      setHasMoreReports(page.hasMore);
      setNextOffset(page.nextOffset);
      if (page.totalCount !== null) {
        setTotalReportCount(page.totalCount);
      }
      return true;
    } catch (err) {
      console.warn('[HomePage data load error]', err);
      if (
        requestGeneration === feedGenerationRef.current &&
        !background &&
        !append
      ) {
        setFetchError('LOAD_ERROR');
      }
      return false;
    } finally {
      if (
        requestGeneration === feedGenerationRef.current &&
        !background &&
        !append
      ) {
        setIsLoading(false);
      }
    }
  }, [visitorLat, visitorLng, feedFilter, selectedDistrict]);

  useEffect(() => {
    feedGenerationRef.current += 1;
    loadMoreInFlightRef.current = false;
    lastLoadMoreOffsetRef.current = null;
    setIsLoadingMore(false);
    setLoadMoreError(false);
    setHasMoreReports(false);
    setNextOffset(0);
    setTotalReportCount(0);
    setFeedWatermark(null);
    setNewReportCount(0);
    setPendingNewestPublishedAt(null);
  }, [feedFilter, selectedDistrict, visitorLat, visitorLng]);

  useEffect(() => {
    // AppContext performs one authoritative location restoration pass on mount.
    // Avoid fetching an unranked page that is immediately discarded/reloaded
    // when persisted device/IP location becomes available.
    if (browseLocationStatus === 'requesting') return;
    void loadReports();
  }, [browseLocationStatus, loadReports]);

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

    const cancelScheduledWatermark = scheduleIdleTask(() => {
      void establishFeedWatermark();
    }, 1400);

    return () => {
      cancelled = true;
      cancelScheduledWatermark();
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

    feedGenerationRef.current += 1;
    loadMoreInFlightRef.current = false;
    setIsLoadingMore(false);
    setLoadMoreError(false);
    setIsRefreshingNewReports(true);

    try {
      const refreshed = await loadReports({ background: true });
      if (!refreshed) return;

      setFeedWatermark(pendingNewestPublishedAt || new Date().toISOString());
      setNewReportCount(0);
      setPendingNewestPublishedAt(null);

      document.getElementById('home-feed-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } finally {
      setIsRefreshingNewReports(false);
    }
  }, [isRefreshingNewReports, loadReports, pendingNewestPublishedAt]);

  const filteredReports = useMemo(() => allReports, [allReports]);

  const handleLoadMore = useCallback(async () => {
    if (
      loadMoreInFlightRef.current ||
      !hasMoreReports ||
      nextOffset === null ||
      lastLoadMoreOffsetRef.current === nextOffset
    ) {
      return;
    }

    const requestGeneration = feedGenerationRef.current;
    const requestedOffset = nextOffset;
    loadMoreInFlightRef.current = true;
    lastLoadMoreOffsetRef.current = requestedOffset;
    setIsLoadingMore(true);
    setLoadMoreError(false);

    try {
      const loaded = await loadReports({
        background: true,
        append: true,
        offset: nextOffset,
      });

      if (!loaded && requestGeneration === feedGenerationRef.current) {
        if (lastLoadMoreOffsetRef.current === requestedOffset) {
          lastLoadMoreOffsetRef.current = null;
        }
        setLoadMoreError(true);
      }
    } finally {
      if (requestGeneration === feedGenerationRef.current) {
        loadMoreInFlightRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [hasMoreReports, loadReports, nextOffset]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;

    if (
      !sentinel ||
      isLoading ||
      fetchError ||
      !hasMoreReports ||
      nextOffset === null ||
      loadMoreError
    ) {
      return;
    }

    const rootMargin = getHomeFeedPrefetchMargin();
    const prefetchDistance = Number.parseInt(rootMargin, 10) || 0;

    const canLoadNow = () =>
      document.visibilityState === 'visible' &&
      navigator.onLine;

    const loadIfNearViewport = () => {
      if (!canLoadNow()) return;
      const bounds = sentinel.getBoundingClientRect();
      if (bounds.top <= window.innerHeight + prefetchDistance) {
        void handleLoadMore();
      }
    };

    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        loadIfNearViewport();
      }
    };

    const handleOnline = () => {
      loadIfNearViewport();
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('online', handleOnline);

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && canLoadNow()) {
            void handleLoadMore();
          }
        },
        {
          root: null,
          rootMargin,
          threshold: 0.01,
        }
      );

      observer.observe(sentinel);

      return () => {
        observer.disconnect();
        document.removeEventListener('visibilitychange', handleResume);
        window.removeEventListener('online', handleOnline);
      };
    }

    let frameId = 0;
    const handleFallbackViewportChange = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        loadIfNearViewport();
      });
    };

    window.addEventListener('scroll', handleFallbackViewportChange, { passive: true });
    window.addEventListener('resize', handleFallbackViewportChange);
    loadIfNearViewport();

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', handleFallbackViewportChange);
      window.removeEventListener('resize', handleFallbackViewportChange);
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('online', handleOnline);
    };
  }, [
    fetchError,
    handleLoadMore,
    hasMoreReports,
    isLoading,
    loadMoreError,
    nextOffset,
  ]);

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
            count={totalReportCount}
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

        {!isLoading && !fetchError && filteredReports.length > 0 && (
          <div className="space-y-3">
            <VirtualizedReportFeed
              reports={filteredReports}
              pageSize={HOME_FEED_PAGE_SIZE}
            />

            {hasMoreReports && !loadMoreError && (
              <div
                ref={loadMoreSentinelRef}
                id="home-infinite-feed-sentinel"
                className="min-h-6 pt-1 flex items-center justify-center"
                aria-hidden={!isLoadingMore}
              >
                {isLoadingMore && (
                  <div
                    id="home-infinite-feed-loader"
                    role="status"
                    aria-live="polite"
                    className="flex min-h-12 items-center justify-center"
                  >
                    <LoaderCircle
                      className="h-5 w-5 animate-spin text-ui-content-muted"
                      aria-hidden="true"
                    />
                    <span className="sr-only">
                      {language === 'bn'
                        ? 'আরও প্রতিবেদন লোড হচ্ছে...'
                        : 'Loading more reports...'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {hasMoreReports && loadMoreError && (
              <div
                id="home-infinite-feed-error"
                role="alert"
                className="pt-2 flex flex-col items-center justify-center gap-2 text-center"
              >
                <p className="type-meta text-ui-content-muted">
                  {language === 'bn'
                    ? 'আরও প্রতিবেদন লোড করা যায়নি।'
                    : 'Couldn’t load more reports.'}
                </p>
                <Button
                  id="home-infinite-feed-retry-button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleLoadMore()}
                >
                  {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
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