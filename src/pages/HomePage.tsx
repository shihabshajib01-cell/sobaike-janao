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

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_REPORT_COUNT);
  }, [feedFilter, selectedDistrict, visitorLat, visitorLng]);

  const reportCounts: Partial<Record<SectionKey, number>> = useMemo(() => {
    return {
      harassment: allReports.filter((r) => r.segment === 'harassment').length,
      rickshaw: allReports.filter((r) => r.segment === 'rickshaw').length,
      extortion: allReports.filter((r) => r.segment === 'extortion').length,
      load_shedding: allReports.filter((r) => r.segment === 'load_shedding').length,
    };
  }, [allReports]);

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

      <ServiceHeroCarousel id="home-service-carousel" reportCounts={reportCounts} className="mb-2" />

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
            <Button variant="primary" size="md" onClick={loadReports}>
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
