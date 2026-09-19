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
import { SeoManager } from '../seo/SeoManager';
import { MapExploreSkeleton, ReportFeedSkeleton } from '../ui/LoadingSkeleton';

const LazyIssuesPage = React.lazy(() =>
  import('../../pages/IssuesPage').then((m) => ({ default: m.IssuesPage }))
);
const LazyHarassmentPage = React.lazy(() =>
  import('../../pages/HarassmentPage').then((m) => ({ default: m.HarassmentPage }))
);
const LazyRickshawPage = React.lazy(() =>
  import('../../pages/RickshawPage').then((m) => ({ default: m.RickshawPage }))
);
const LazyExtortionPage = React.lazy(() =>
  import('../../pages/ExtortionPage').then((m) => ({ default: m.ExtortionPage }))
);
const LazyUtilityPage = React.lazy(() =>
  import('../../pages/UtilityPage').then((m) => ({ default: m.UtilityPage }))
);
const LazyStandardCategoryPage = React.lazy(() =>
  import('../../pages/StandardCategoryPage').then((m) => ({ default: m.StandardCategoryPage }))
);
const LazyReportDetailPage = React.lazy(() =>
  import('../../pages/ReportDetailPage').then((m) => ({ default: m.ReportDetailPage }))
);
const LazyReportPage = React.lazy(() =>
  import('../../pages/ReportPage').then((m) => ({ default: m.ReportPage }))
);
const LazySearchPage = React.lazy(() =>
  import('../../pages/SearchPage').then((m) => ({ default: m.SearchPage }))
);
const LazyMorePage = React.lazy(() =>
  import('../../pages/MorePage').then((m) => ({ default: m.MorePage }))
);
const LazyLocationPage = React.lazy(() =>
  import('../../pages/LocationPage').then((m) => ({ default: m.LocationPage }))
);
const LazySubjectPage = React.lazy(() =>
  import('../../pages/SubjectPage').then((m) => ({ default: m.SubjectPage }))
);
const LazyDynamicCategoryPage = React.lazy(() =>
  import('../../pages/DynamicCategoryPage').then((m) => ({ default: m.DynamicCategoryPage }))
);

const LazyExplorePage = React.lazy(() =>
  import('../../pages/ExplorePage').then((m) => ({ default: m.ExplorePage }))
);

const LazyReportComposerModal = React.lazy(() =>
  import('../report-composer/ReportComposerModal').then((m) => ({ default: m.ReportComposerModal }))
);

const FORM_SCHEMA_SMOKE_ENABLED = import.meta.env.VITE_FORM_SCHEMA_SMOKE === '1';
const LazySchemaFormSmokeHarness = FORM_SCHEMA_SMOKE_ENABLED
  ? React.lazy(() =>
      import('../report-composer/SchemaFormSmokeHarness').then((m) => ({
        default: m.SchemaFormSmokeHarness,
      }))
    )
  : null;

const RouteSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <React.Suspense
    fallback={
      <div className="p-4 md:p-6">
        <ReportFeedSkeleton count={3} ariaLabel="Loading page..." />
      </div>
    }
  >
    {children}
  </React.Suspense>
);

const ReportDetailRouteWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <RouteSuspense>
      <LazyReportDetailPage reportId={id ? decodeURIComponent(id) : ''} />
    </RouteSuspense>
  );
};

const LocationRouteWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <RouteSuspense>
      <LazyLocationPage locationId={id ? decodeURIComponent(id) : ''} />
    </RouteSuspense>
  );
};

const SubjectRouteWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <RouteSuspense>
      <LazySubjectPage subjectId={id ? decodeURIComponent(id) : ''} />
    </RouteSuspense>
  );
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
    closeLocationConsent,
    locationSuccessCallback,
  } = useApp();

  const [isFirstVisitNoticeOpen, setIsFirstVisitNoticeOpen] = useState(false);
  const [isMobileChromeCompact, setIsMobileChromeCompact] = useState(false);
  const [routeAnnouncement, setRouteAnnouncement] = useState('');
  const previousNavigationKeyRef = useRef(`${language}:${currentRoute}`);
  const hideMobileMainNavigation = shouldHideBottomNav(currentRoute);

  useEffect(() => {
    const navigationKey = `${language}:${currentRoute}`;
    if (previousNavigationKeyRef.current === navigationKey) return;
    previousNavigationKeyRef.current = navigationKey;

    setIsMobileChromeCompact(false);
    setRouteAnnouncement('');

    const frame = window.requestAnimationFrame(() => {
      document.getElementById('main-content')?.focus({ preventScroll: true });
      setRouteAnnouncement(
        language === 'bn' ? 'নতুন পৃষ্ঠা খোলা হয়েছে' : 'New page loaded'
      );
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentRoute, language]);

  useEffect(() => {
    const hasNoticeAccepted = hasAcceptedResponsibilityNotice();

    if (!hasNoticeAccepted) {
      setIsFirstVisitNoticeOpen(true);
    } else {
      const choice = VisitorSessionService.getLocationChoice();
      if (choice === 'granted') {
        VisitorSessionService.initReturningVisitor();
      }
      // Do not trigger a browser permission prompt on page load.
      // AppContext silently restores an existing grant and otherwise falls back
      // to approximate IP location for browsing; the inline CTA lets the user
      // explicitly request device location.
    }

    return () => {
      VisitorSessionService.stopLocationWatch();
    };
  }, []);

  const handleAcknowledgeNotice = () => {
    setAcceptedResponsibilityNotice();
    setIsFirstVisitNoticeOpen(false);

    const choice = VisitorSessionService.getLocationChoice();
    if (choice === 'granted') {
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

      <p
        id="route-change-announcement"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {routeAnnouncement}
      </p>

      <ErrorBoundary componentName="DesktopLeftRail" silent>
        <DesktopLeftRail />
      </ErrorBoundary>

      <ErrorBoundary componentName="Header" silent>
        <Header />
      </ErrorBoundary>

      <ErrorBoundary componentName="MobileHeader" fallback={null}>
        <MobileHeader
          isCompact={isMobileChromeCompact}
          onCompactChange={setIsMobileChromeCompact}
        />
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
                  <Route path="/issues" element={<RouteSuspense><LazyIssuesPage /></RouteSuspense>} />
                  <Route path="/harassment" element={<RouteSuspense><LazyHarassmentPage /></RouteSuspense>} />
                  <Route path="/extortion" element={<RouteSuspense><LazyExtortionPage /></RouteSuspense>} />
                  <Route path="/public-safety" element={<RouteSuspense><LazyStandardCategoryPage section="public_safety" /></RouteSuspense>} />
                  <Route path="/road-transport" element={<RouteSuspense><LazyStandardCategoryPage section="road_transport" /></RouteSuspense>} />
                  <Route path="/load-shedding" element={<RouteSuspense><LazyUtilityPage /></RouteSuspense>} />
                  <Route path="/illegal-occupation" element={<RouteSuspense><LazyStandardCategoryPage section="illegal_occupation" /></RouteSuspense>} />
                  <Route path="/rickshaw" element={<RouteSuspense><LazyRickshawPage /></RouteSuspense>} />
                  <Route path="/category/:slug" element={<RouteSuspense><LazyDynamicCategoryPage /></RouteSuspense>} />
                  <Route path="/report" element={<RouteSuspense><LazyReportPage /></RouteSuspense>} />
                  <Route
                    path="/explore"
                    element={
                      <React.Suspense fallback={<MapExploreSkeleton />}>
                        <LazyExplorePage />
                      </React.Suspense>
                    }
                  />
                  <Route path="/search" element={<RouteSuspense><LazySearchPage /></RouteSuspense>} />
                  <Route path="/more" element={<RouteSuspense><LazyMorePage /></RouteSuspense>} />
                  <Route path="/report-detail/:id" element={<ReportDetailRouteWrapper />} />
                  <Route path="/location/:id" element={<LocationRouteWrapper />} />
                  <Route path="/subject/:id" element={<SubjectRouteWrapper />} />
                  {FORM_SCHEMA_SMOKE_ENABLED && LazySchemaFormSmokeHarness ? (
                    <Route
                      path="/__form-schema-smoke"
                      element={<RouteSuspense><LazySchemaFormSmokeHarness /></RouteSuspense>}
                    />
                  ) : null}

                  {/* English prerendered route family. These mirror the Bangla routes so
                      /en/... URLs are first-class crawlable pages, not query-state aliases. */}
                  <Route path="/en" element={<HomePage />} />
                  <Route path="/en/issues" element={<RouteSuspense><LazyIssuesPage /></RouteSuspense>} />
                  <Route path="/en/harassment" element={<RouteSuspense><LazyHarassmentPage /></RouteSuspense>} />
                  <Route path="/en/extortion" element={<RouteSuspense><LazyExtortionPage /></RouteSuspense>} />
                  <Route path="/en/public-safety" element={<RouteSuspense><LazyStandardCategoryPage section="public_safety" /></RouteSuspense>} />
                  <Route path="/en/road-transport" element={<RouteSuspense><LazyStandardCategoryPage section="road_transport" /></RouteSuspense>} />
                  <Route path="/en/load-shedding" element={<RouteSuspense><LazyUtilityPage /></RouteSuspense>} />
                  <Route path="/en/illegal-occupation" element={<RouteSuspense><LazyStandardCategoryPage section="illegal_occupation" /></RouteSuspense>} />
                  <Route path="/en/rickshaw" element={<RouteSuspense><LazyRickshawPage /></RouteSuspense>} />
                  <Route path="/en/category/:slug" element={<RouteSuspense><LazyDynamicCategoryPage /></RouteSuspense>} />
                  <Route path="/en/report" element={<RouteSuspense><LazyReportPage /></RouteSuspense>} />
                  <Route
                    path="/en/explore"
                    element={
                      <React.Suspense fallback={<MapExploreSkeleton />}>
                        <LazyExplorePage />
                      </React.Suspense>
                    }
                  />
                  <Route path="/en/search" element={<RouteSuspense><LazySearchPage /></RouteSuspense>} />
                  <Route path="/en/more" element={<RouteSuspense><LazyMorePage /></RouteSuspense>} />
                  <Route path="/en/report-detail/:id" element={<ReportDetailRouteWrapper />} />
                  <Route path="/en/location/:id" element={<LocationRouteWrapper />} />
                  <Route path="/en/subject/:id" element={<SubjectRouteWrapper />} />
                  <Route path="/en/*" element={<Navigate to="/en" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </SeoManager>
          </div>

          <footer className="pt-8 pb-6 border-t border-ui-divider mt-10 type-meta text-ui-content-muted px-4 md:px-6 lg:px-8 min-[1440px]:px-0">
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
        <BottomNav
          isCompact={isMobileChromeCompact}
          onCompactChange={setIsMobileChromeCompact}
        />
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
