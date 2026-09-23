import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, Link, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ErrorBoundary } from '../ErrorBoundary';
import { LocationReminderBar } from '../location/LocationReminderBar';
import { shouldHideBottomNav } from './navigationVisibility';
import { VisitorSessionService } from '../../services/visitorSessionService';
import { HomePage } from '../../pages/HomePage';
import { SeoManager } from '../seo/SeoManager';
import { MapExploreSkeleton, ReportFeedSkeleton } from '../ui/LoadingSkeleton';
import { SECTIONS, SectionKey } from '../../theme/tokens';
import { useTaxonomy } from '../../services/taxonomyService';

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
const LazyTopicPage = React.lazy(() =>
  import('../../pages/TopicPage').then((m) => ({ default: m.TopicPage }))
);

const LazyExplorePage = React.lazy(() =>
  import('../../pages/ExplorePage').then((m) => ({ default: m.ExplorePage }))
);

const LazyReportComposerModal = React.lazy(() =>
  import('../report-composer/ReportComposerModal').then((m) => ({ default: m.ReportComposerModal }))
);

const LazyDesktopLeftRail = React.lazy(() =>
  import('./DesktopLeftRail').then((m) => ({ default: m.DesktopLeftRail }))
);
const LazyHeader = React.lazy(() =>
  import('./Header').then((m) => ({ default: m.Header }))
);
const LazyMobileHeader = React.lazy(() =>
  import('./MobileHeader').then((m) => ({ default: m.MobileHeader }))
);
const LazyBottomNav = React.lazy(() =>
  import('./BottomNav').then((m) => ({ default: m.BottomNav }))
);
const LazySearchModal = React.lazy(() =>
  import('./SearchModal').then((m) => ({ default: m.SearchModal }))
);
const LazyLocationConsentModal = React.lazy(() =>
  import('../location/LocationConsentModal').then((m) => ({ default: m.LocationConsentModal }))
);
const LazyFirstVisitNoticeModal = React.lazy(() =>
  import('../location/FirstVisitNoticeModal').then((m) => ({ default: m.FirstVisitNoticeModal }))
);

type ViewportTier = 'mobile' | 'tablet' | 'desktop';

const getViewportTier = (): ViewportTier => {
  if (typeof window === 'undefined') return 'mobile';
  if (window.matchMedia('(min-width: 1440px)').matches) return 'desktop';
  if (window.matchMedia('(min-width: 768px)').matches) return 'tablet';
  return 'mobile';
};

const FORM_SCHEMA_SMOKE_ENABLED = import.meta.env.VITE_FORM_SCHEMA_SMOKE === '1';
const LazySchemaFormSmokeHarness = FORM_SCHEMA_SMOKE_ENABLED
  ? React.lazy(() =>
      import('../report-composer/SchemaFormSmokeHarness').then((m) => ({
        default: m.SchemaFormSmokeHarness,
      }))
    )
  : null;

const RouteSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useApp();

  return (
    <React.Suspense
      fallback={
        <div className="p-4 md:p-6">
          <ReportFeedSkeleton
            count={3}
            ariaLabel={language === 'bn' ? 'পৃষ্ঠা লোড হচ্ছে...' : 'Loading page...'}
          />
        </div>
      }
    >
      {children}
    </React.Suspense>
  );
};

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
    isSearchModalOpen,
    isReportComposerOpen,
    reportComposerInitialSegment,
    closeReportComposer,
    isLocationModalOpen,
    locationModalPurpose,
    closeLocationConsent,
    locationSuccessCallback,
  } = useApp();

  const { segments, subcategories } = useTaxonomy();
  const [isFirstVisitNoticeOpen, setIsFirstVisitNoticeOpen] = useState(false);
  const [viewportTier, setViewportTier] = useState<ViewportTier>(getViewportTier);
  const [isMobileChromeCompact, setIsMobileChromeCompact] = useState(false);
  const [routeAnnouncement, setRouteAnnouncement] = useState('');
  const previousNavigationKeyRef = useRef(`${language}:${currentRoute}`);
  const hideMobileMainNavigation = shouldHideBottomNav(currentRoute);

  const activeCategoryTheme = React.useMemo(() => {
    const route = currentRoute.replace(/^\/en(?=\/|$)/, '') || '/';
    const staticEntry = (Object.entries(SECTIONS) as Array<[SectionKey, (typeof SECTIONS)[SectionKey]]>)
      .find(([, section]) => section.slug === route);
    const dynamicSlug = route.startsWith('/category/')
      ? route.slice('/category/'.length)
      : null;
    const dynamicEntry = dynamicSlug
      ? Object.values(segments).find((segment) => {
          const normalizedSlug = segment.slug?.replace(/^\/category\//, '').replace(/^\//, '');
          return normalizedSlug === dynamicSlug || segment.id === dynamicSlug;
        })
      : null;
    const topicSlug = route.startsWith('/topic/') ? route.slice('/topic/'.length) : null;
    const topicSegmentId = topicSlug
      ? Object.entries(subcategories).find(([, items]) =>
          items.some((item) => {
            const normalizedSlug = (item.slug || item.id.replace(/_/g, '-')).replace(/^\//, '');
            return normalizedSlug === topicSlug || item.id === topicSlug;
          })
        )?.[0]
      : null;
    const topicEntry = topicSegmentId ? segments[topicSegmentId] : null;
    const segment =
      topicEntry ||
      dynamicEntry ||
      (staticEntry ? segments[staticEntry[0]] || { ...staticEntry[1], id: staticEntry[0] } : null);

    if (!segment) return null;

    return {
      id: segment.id,
      style: {
        '--category-route-primary': segment.primaryColor,
        '--category-route-hover': segment.hoverColor,
        '--category-route-on-primary': segment.colors.filledText,
        '--category-route-container': segment.bgColor,
        '--category-route-on-container': segment.textColor,
        '--category-route-outline': segment.borderColor,
      } as React.CSSProperties,
    };
  }, [currentRoute, segments, subcategories]);

  useEffect(() => {
    const tabletQuery = window.matchMedia('(min-width: 768px)');
    const desktopQuery = window.matchMedia('(min-width: 1440px)');

    const syncViewportTier = () => {
      setViewportTier(
        desktopQuery.matches ? 'desktop' : tabletQuery.matches ? 'tablet' : 'mobile'
      );
    };

    syncViewportTier();
    tabletQuery.addEventListener('change', syncViewportTier);
    desktopQuery.addEventListener('change', syncViewportTier);

    return () => {
      tabletQuery.removeEventListener('change', syncViewportTier);
      desktopQuery.removeEventListener('change', syncViewportTier);
    };
  }, []);

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
    <div
      className={`min-h-screen bg-ui-page text-ui-content-primary flex flex-col${activeCategoryTheme ? ' category-theme-scope' : ''}`}
      data-category-theme={activeCategoryTheme?.id}
      style={activeCategoryTheme?.style}
    >
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

      {viewportTier === 'desktop' ? (
        <ErrorBoundary componentName="DesktopLeftRail" silent>
          <React.Suspense fallback={null}>
            <LazyDesktopLeftRail />
          </React.Suspense>
        </ErrorBoundary>
      ) : viewportTier === 'tablet' ? (
        <ErrorBoundary componentName="Header" silent>
          <React.Suspense fallback={null}>
            <LazyHeader />
          </React.Suspense>
        </ErrorBoundary>
      ) : (
        <ErrorBoundary componentName="MobileHeader" fallback={null}>
          <React.Suspense fallback={null}>
            <LazyMobileHeader
              isCompact={isMobileChromeCompact}
              onCompactChange={setIsMobileChromeCompact}
            />
          </React.Suspense>
        </ErrorBoundary>
      )}

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
                  <Route path="/topic/:slug" element={<RouteSuspense><LazyTopicPage /></RouteSuspense>} />
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
                  <Route path="/en/topic/:slug" element={<RouteSuspense><LazyTopicPage /></RouteSuspense>} />
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
                    ? 'স্বাধীন নাগরিক প্রতিবেদন ও জনস্বার্থ তথ্য প্ল্যাটফর্ম'
                    : 'Independent citizen reporting & public-interest information platform'}
                </span>
              </div>
              <span>{language === 'bn' ? 'জনস্বার্থ রেকর্ড' : 'Public interest record'}</span>
            </div>

            <p className="mt-3 max-w-3xl text-ui-content-secondary">
              {language === 'bn'
                ? 'প্রকাশের আগে প্রতিবেদন পর্যালোচনা করা হয়; উৎস পাওয়া গেলে প্রতিবেদন পাতায় উৎসের নাম ও লিংক দেখানো হয়। প্রকাশিত হওয়া কোনো অভিযোগের সরকারি বা বিচারিক সত্যতা প্রমাণ করে না।'
                : 'Reports are reviewed before publication; when sources are available, the report page shows the source name and URL. Publication does not mean an allegation has been proven by a court or government authority.'}
            </p>

            <nav
              aria-label={language === 'bn' ? 'তথ্য ও নীতিমালা' : 'Information and policies'}
              className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2"
            >
              <Link
                to={language === 'en' ? '/en/more' : '/more'}
                className="font-[var(--font-weight-semibold)] text-ui-content-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ui-radius-badge-md"
              >
                {language === 'bn' ? 'সম্পর্কে, নীতিমালা ও সহায়তা' : 'About, policies & help'}
              </Link>
              <Link
                to={language === 'en' ? '/en/report' : '/report'}
                className="font-[var(--font-weight-semibold)] text-ui-content-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ui-radius-badge-md"
              >
                {language === 'bn' ? 'কীভাবে প্রতিবেদন করবেন' : 'How to report'}
              </Link>
              <Link
                to={language === 'en' ? '/en/issues' : '/issues'}
                className="font-[var(--font-weight-semibold)] text-ui-content-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ui-radius-badge-md"
              >
                {language === 'bn' ? 'প্রতিবেদনের বিষয়সমূহ' : 'Reporting topics'}
              </Link>
            </nav>
          </footer>
        </main>
      </div>

      {viewportTier === 'mobile' ? (
        <ErrorBoundary componentName="BottomNav" fallback={null}>
          <React.Suspense fallback={null}>
            <LazyBottomNav
              isCompact={isMobileChromeCompact}
              onCompactChange={setIsMobileChromeCompact}
            />
          </React.Suspense>
        </ErrorBoundary>
      ) : null}

      {isSearchModalOpen ? (
        <ErrorBoundary componentName="SearchModal" silent>
          <React.Suspense fallback={null}>
            <LazySearchModal />
          </React.Suspense>
        </ErrorBoundary>
      ) : null}

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

      {isFirstVisitNoticeOpen ? (
        <ErrorBoundary componentName="FirstVisitNoticeModal" silent>
          <React.Suspense
            fallback={
              <div
                className="fixed inset-0 z-[100] bg-ui-overlay"
                aria-hidden="true"
              />
            }
          >
            <LazyFirstVisitNoticeModal
              isOpen={isFirstVisitNoticeOpen}
              language={language}
              onAcknowledge={handleAcknowledgeNotice}
            />
          </React.Suspense>
        </ErrorBoundary>
      ) : null}

      {isLocationModalOpen ? (
        <ErrorBoundary componentName="LocationConsentModal" silent>
          <React.Suspense fallback={null}>
            <LazyLocationConsentModal
              isOpen={isLocationModalOpen}
              language={language}
              purpose={locationModalPurpose}
              onClose={closeLocationConsent}
              onSuccess={() => {
                locationSuccessCallback?.();
                closeLocationConsent();
              }}
            />
          </React.Suspense>
        </ErrorBoundary>
      ) : null}
    </div>
  );
};
