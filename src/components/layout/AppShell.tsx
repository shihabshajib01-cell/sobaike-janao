import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ErrorBoundary } from '../ErrorBoundary';
import { DesktopLeftRail } from './DesktopLeftRail';
import { Header } from './Header';
import { MobileHeader } from './MobileHeader';
import { BottomNav, shouldHideBottomNav } from './BottomNav';
import { SearchModal } from './SearchModal';
import { FirstVisitNoticeModal } from '../location/FirstVisitNoticeModal';
import { LocationConsentModal } from '../location/LocationConsentModal';
import { LocationReminderBar } from '../location/LocationReminderBar';
import { VisitorSessionService } from '../../services/visitorSessionService';
import { HomePage } from '../../pages/HomePage';
import { IssuesPage } from '../../pages/IssuesPage';
import { HarassmentPage } from '../../pages/HarassmentPage';
import { RickshawPage } from '../../pages/RickshawPage';
import { ExtortionPage } from '../../pages/ExtortionPage';
import { UtilityPage } from '../../pages/UtilityPage';
import { StandardCategoryPage } from '../../pages/StandardCategoryPage';
import { ReportDetailPage } from '../../pages/ReportDetailPage';
import { ReportPage } from '../../pages/ReportPage';
import { SearchPage } from '../../pages/SearchPage';
import { MorePage } from '../../pages/MorePage';
import { LocationPage } from '../../pages/LocationPage';
import { SubjectPage } from '../../pages/SubjectPage';
import { DynamicCategoryPage } from '../../pages/DynamicCategoryPage';
import { SeoManager } from '../seo/SeoManager';
import { MapExploreSkeleton } from '../ui/LoadingSkeleton';

const LazyExplorePage = React.lazy(() =>
  import('../../pages/ExplorePage').then((m) => ({ default: m.ExplorePage }))
);

const LazyReportComposerModal = React.lazy(() =>
  import('../report-composer/ReportComposerModal').then((m) => ({ default: m.ReportComposerModal }))
);

const ReportDetailRouteWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <ReportDetailPage reportId={id ? decodeURIComponent(id) : ''} />;
};

const LocationRouteWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <LocationPage locationId={id ? decodeURIComponent(id) : ''} />;
};

const SubjectRouteWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <SubjectPage subjectId={id ? decodeURIComponent(id) : ''} />;
};

const RESPONSIBILITY_NOTICE_KEY = 'sobaike_responsibility_notice_v1';

function hasAcceptedResponsibilityNotice(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(RESPONSIBILITY_NOTICE_KEY) === 'accepted';
  } catch {
    return false;
  }
}

function setAcceptedResponsibilityNotice(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RESPONSIBILITY_NOTICE_KEY, 'accepted');
  } catch {
    // Ignore private browsing / restricted storage errors
  }
}

export const AppShell: React.FC = () => {
  const {
    currentRoute,
    language,
    isReportComposerOpen,
    reportComposerInitialSegment,
    closeReportComposer,
    isLocationModalOpen,
    locationModalPurpose,
    openLocationConsent,
    closeLocationConsent,
    locationSuccessCallback,
  } = useApp();

  const [isFirstVisitNoticeOpen, setIsFirstVisitNoticeOpen] = useState(false);
  const previousRouteRef = useRef(currentRoute);
  const hideMobileMainNavigation = shouldHideBottomNav(currentRoute);

  useEffect(() => {
    if (previousRouteRef.current === currentRoute) return;
    previousRouteRef.current = currentRoute;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById('main-content')?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentRoute]);

  useEffect(() => {
    const hasNoticeAccepted = hasAcceptedResponsibilityNotice();

    if (!hasNoticeAccepted) {
      setIsFirstVisitNoticeOpen(true);
    } else {
      const choice = VisitorSessionService.getLocationChoice();
      if (!choice) {
        openLocationConsent('browse');
      } else {
        VisitorSessionService.initReturningVisitor();
      }
    }

    return () => {
      VisitorSessionService.stopLocationWatch();
    };
  }, [openLocationConsent]);

  const handleAcknowledgeNotice = () => {
    setAcceptedResponsibilityNotice();
    setIsFirstVisitNoticeOpen(false);

    const choice = VisitorSessionService.getLocationChoice();
    if (!choice) {
      openLocationConsent('browse');
    } else {
      VisitorSessionService.initReturningVisitor();
    }
  };

  return (
    <div className="min-h-screen bg-ui-page text-ui-content-primary flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-ui-action-bg focus:text-ui-action-text focus:ui-radius-control focus:ui-elevation-control focus:font-[var(--font-weight-semibold)] focus:outline-none focus:ring-2 focus:ring-ui-focus type-action"
      >
        {language === 'bn' ? 'মূল বিষয়বস্তুতে যান' : 'Skip to main content'}
      </a>

      <ErrorBoundary componentName="DesktopLeftRail" silent>
        <DesktopLeftRail />
      </ErrorBoundary>

      <ErrorBoundary componentName="Header" silent>
        <Header />
      </ErrorBoundary>

      <ErrorBoundary componentName="MobileHeader" fallback={null}>
        <MobileHeader />
      </ErrorBoundary>

      <div
        id="public-desktop-workspace"
        className="w-full flex-1 flex flex-col min-[1440px]:pl-[var(--layout-rail-desktop)] min-[1536px]:pl-[var(--layout-rail-large)] min-[1920px]:pl-[var(--layout-rail-xl)]"
      >
        <ErrorBoundary componentName="LocationReminderBar" silent>
          <LocationReminderBar isFirstVisitNoticeOpen={isFirstVisitNoticeOpen} />
        </ErrorBoundary>

        <main
          id="main-content"
          tabIndex={-1}
          className={`w-full mx-auto max-w-[var(--layout-content-max)] flex-1 flex flex-col justify-between focus:outline-none ${
            hideMobileMainNavigation ? 'pb-6 md:pb-0' : 'pb-28 pb-safe md:pb-0'
          }`}
        >
          <div className="w-full">
            <SeoManager>
              <ErrorBoundary componentName="MainRoutes">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/issues" element={<IssuesPage />} />
                  <Route path="/harassment" element={<HarassmentPage />} />
                  <Route path="/extortion" element={<ExtortionPage />} />
                  <Route path="/public-safety" element={<StandardCategoryPage section="public_safety" />} />
                  <Route path="/road-transport" element={<StandardCategoryPage section="road_transport" />} />
                  <Route path="/load-shedding" element={<UtilityPage />} />
                  <Route path="/illegal-occupation" element={<StandardCategoryPage section="illegal_occupation" />} />
                  <Route path="/rickshaw" element={<RickshawPage />} />
                  <Route path="/category/:slug" element={<DynamicCategoryPage />} />
                  <Route path="/report" element={<ReportPage />} />
                  <Route
                    path="/explore"
                    element={
                      <React.Suspense fallback={<MapExploreSkeleton />}>
                        <LazyExplorePage />
                      </React.Suspense>
                    }
                  />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/more" element={<MorePage />} />
                  <Route path="/report-detail/:id" element={<ReportDetailRouteWrapper />} />
                  <Route path="/location/:id" element={<LocationRouteWrapper />} />
                  <Route path="/subject/:id" element={<SubjectRouteWrapper />} />

                  {/* English prerendered route family. These mirror the Bangla routes so
                      /en/... URLs are first-class crawlable pages, not query-state aliases. */}
                  <Route path="/en" element={<HomePage />} />
                  <Route path="/en/issues" element={<IssuesPage />} />
                  <Route path="/en/harassment" element={<HarassmentPage />} />
                  <Route path="/en/extortion" element={<ExtortionPage />} />
                  <Route path="/en/public-safety" element={<StandardCategoryPage section="public_safety" />} />
                  <Route path="/en/road-transport" element={<StandardCategoryPage section="road_transport" />} />
                  <Route path="/en/load-shedding" element={<UtilityPage />} />
                  <Route path="/en/illegal-occupation" element={<StandardCategoryPage section="illegal_occupation" />} />
                  <Route path="/en/rickshaw" element={<RickshawPage />} />
                  <Route path="/en/category/:slug" element={<DynamicCategoryPage />} />
                  <Route path="/en/report" element={<ReportPage />} />
                  <Route
                    path="/en/explore"
                    element={
                      <React.Suspense fallback={<MapExploreSkeleton />}>
                        <LazyExplorePage />
                      </React.Suspense>
                    }
                  />
                  <Route path="/en/search" element={<SearchPage />} />
                  <Route path="/en/more" element={<MorePage />} />
                  <Route path="/en/report-detail/:id" element={<ReportDetailRouteWrapper />} />
                  <Route path="/en/location/:id" element={<LocationRouteWrapper />} />
                  <Route path="/en/subject/:id" element={<SubjectRouteWrapper />} />
                  <Route path="/en/*" element={<Navigate to="/en" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </SeoManager>
          </div>

          <footer className="pt-8 pb-6 border-t border-ui-stroke-subtle mt-10 type-meta text-ui-content-muted px-4 md:px-6 lg:px-8 min-[1440px]:px-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-[var(--font-weight-bold)] text-ui-content-primary">সবাইকে জানাও</span>
                <span>•</span>
                <span>
                  {language === 'bn'
                    ? 'নাগরিক তথ্য ও অভিযোগ প্ল্যাটফর্ম'
                    : 'Citizen reporting platform'}
                </span>
              </div>
              <span>{language === 'bn' ? 'জনস্বার্থ রেকর্ড' : 'Public interest record'}</span>
            </div>
          </footer>
        </main>
      </div>

      <ErrorBoundary componentName="BottomNav" fallback={null}>
        <BottomNav />
      </ErrorBoundary>

      <ErrorBoundary componentName="SearchModal" silent>
        <SearchModal />
      </ErrorBoundary>

      {isReportComposerOpen && (
        <ErrorBoundary componentName="ReportComposerModal" silent>
          <React.Suspense fallback={null}>
            <LazyReportComposerModal
              isOpen={isReportComposerOpen}
              onClose={closeReportComposer}
              initialSegment={reportComposerInitialSegment}
              language={language}
            />
          </React.Suspense>
        </ErrorBoundary>
      )}

      <ErrorBoundary componentName="FirstVisitNoticeModal" silent>
        <FirstVisitNoticeModal
          isOpen={isFirstVisitNoticeOpen}
          language={language}
          onAcknowledge={handleAcknowledgeNotice}
        />
      </ErrorBoundary>

      <ErrorBoundary componentName="LocationConsentModal" silent>
        <LocationConsentModal
          isOpen={isLocationModalOpen}
          language={language}
          purpose={locationModalPurpose}
          onClose={closeLocationConsent}
          onSuccess={() => {
            locationSuccessCallback?.();
            closeLocationConsent();
          }}
        />
      </ErrorBoundary>
    </div>
  );
};
