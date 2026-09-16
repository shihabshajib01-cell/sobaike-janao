import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ErrorBoundary } from '../ErrorBoundary';
import { DesktopLeftRail } from './DesktopLeftRail';
import { Header } from './Header';
import { MobileHeader } from './MobileHeader';
import { BottomNav } from './BottomNav';
import { SearchModal } from './SearchModal';
import { ReportComposerModal } from '../report-composer/ReportComposerModal';
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
import { SeoManager } from '../seo/SeoManager';
import { MapExploreSkeleton } from '../ui/LoadingSkeleton';

const LazyExplorePage = React.lazy(() =>
  import('../../pages/ExplorePage').then((m) => ({ default: m.ExplorePage }))
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
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-ui-action-bg focus:text-ui-action-text focus:rounded-[var(--radius-control)] focus:shadow-[var(--elevation-lg)] focus:font-semibold focus:outline-none focus:ring-2 focus:ring-ui-focus text-[var(--type-fixed-15)]"
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
        className="w-full flex-1 flex flex-col min-[1440px]:pl-[240px] min-[1536px]:pl-[250px] min-[1920px]:pl-[260px]"
      >
        <ErrorBoundary componentName="LocationReminderBar" silent>
          <LocationReminderBar isFirstVisitNoticeOpen={isFirstVisitNoticeOpen} />
        </ErrorBoundary>

        <main
          id="main-content"
          tabIndex={-1}
          className="w-full mx-auto max-w-[900px] flex-1 flex flex-col justify-between pb-28 pb-safe md:pb-0 focus:outline-none"
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
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </SeoManager>
          </div>

          <footer className="pt-8 pb-6 border-t border-ui-stroke-subtle mt-10 text-[var(--type-fixed-14)] text-ui-content-muted px-4 md:px-6 lg:px-8 min-[1440px]:px-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-ui-content-primary">সবাইকে জানাও</span>
                <span>•</span>
                <span>
                  {language === 'bn'
                    ? 'নাগরিক তথ্য ও অভিযোগ প্ল্যাটফর্ম'
                    : 'Citizen reporting platform'}
                </span>
              </div>
              <div className="text-[var(--type-fixed-14)] text-ui-content-muted">
                <span>{language === 'bn' ? 'জনস্বার্থ রেকর্ড' : 'Public interest record'}</span>
              </div>
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

      <ErrorBoundary componentName="ReportComposerModal" silent>
        <ReportComposerModal
          isOpen={isReportComposerOpen}
          onClose={closeReportComposer}
          initialSegment={reportComposerInitialSegment}
          language={language}
        />
      </ErrorBoundary>

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
