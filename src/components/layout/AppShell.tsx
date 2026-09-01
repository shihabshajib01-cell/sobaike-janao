import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ErrorBoundary } from '../ErrorBoundary';
import { DesktopLeftRail } from './DesktopLeftRail';
import { Header } from './Header';
import { MobileHeader } from './MobileHeader';
import { BottomNav } from './BottomNav';
import { SearchModal } from './SearchModal';
import { ViewportDebugger } from '../debug/ViewportDebugger';
import { ReportComposerModal } from '../report-composer/ReportComposerModal';
import { Toast } from '../ui/Toast';
import { HomePage } from '../../pages/HomePage';
import { HarassmentPage } from '../../pages/HarassmentPage';
import { RickshawPage } from '../../pages/RickshawPage';
import { ExtortionPage } from '../../pages/ExtortionPage';
import { ReportDetailPage } from '../../pages/ReportDetailPage';
import { ReportPage } from '../../pages/ReportPage';
import { TrackReportPage } from '../../pages/TrackReportPage';
import { ExplorePage } from '../../pages/ExplorePage';
import { SearchPage } from '../../pages/SearchPage';
import { MorePage } from '../../pages/MorePage';
import { LocationPage } from '../../pages/LocationPage';
import { SubjectPage } from '../../pages/SubjectPage';

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

export const AppShell: React.FC = () => {
  const {
    language,
    isReportComposerOpen,
    reportComposerInitialSegment,
    closeReportComposer,
    navigateTo,
    toast,
    hideToast,
  } = useApp();

  return (
    <div className="min-h-screen bg-page text-primary flex flex-col">
      {/* 1. Desktop Left Navigation Rail (fixed viewport left on >= 1440px) */}
      <ErrorBoundary componentName="DesktopLeftRail" silent>
        <DesktopLeftRail />
      </ErrorBoundary>

      {/* 2. Tablet & Compact Desktop Header (768px - 1439px) */}
      <ErrorBoundary componentName="Header" silent>
        <Header />
      </ErrorBoundary>

      {/* 3. Mobile Header (< 768px) */}
      <ErrorBoundary componentName="MobileHeader" fallback={null}>
        <MobileHeader />
      </ErrorBoundary>

      {/* 4. Independently Viewport-Centered Main Public Content */}
      <main
        id="public-main-workspace"
        className="w-full mx-auto max-w-[900px] min-[1440px]:max-w-[880px] min-[1536px]:max-w-[900px] min-[1920px]:max-w-[920px] flex-1 flex flex-col justify-between pb-20 pb-safe md:pb-0"
      >
        <div className="w-full">
          <ErrorBoundary componentName="MainRoutes">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/harassment" element={<HarassmentPage />} />
              <Route path="/rickshaw" element={<RickshawPage />} />
              <Route path="/extortion" element={<ExtortionPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/track-report" element={<TrackReportPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/more" element={<MorePage />} />
              <Route path="/report-detail/:id" element={<ReportDetailRouteWrapper />} />
              <Route path="/location/:id" element={<LocationRouteWrapper />} />
              <Route path="/subject/:id" element={<SubjectRouteWrapper />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </div>

        {/* Minimal Informational Trust Footer */}
        <footer className="pt-8 pb-6 border-t border-subtle mt-10 text-[14px] text-muted px-4 md:px-6 lg:px-8 min-[1440px]:px-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary">সবাইকে জানাও</span>
              <span>•</span>
              <span>
                {language === 'bn'
                  ? 'মডারেটেড নাগরিক অভিযোগ ও তথ্য প্ল্যাটফর্ম'
                  : 'Moderated Citizen Public Platform'}
              </span>
            </div>
            <div className="text-[14px] text-muted">
              <span>{language === 'bn' ? 'মুক্ত জনস্বার্থ রেকর্ড' : 'Public Interest Record'}</span>
            </div>
          </div>
        </footer>
      </main>

      {/* 5. Mobile Fixed Bottom Navigation (< 768px) */}
      <ErrorBoundary componentName="BottomNav" fallback={null}>
        <BottomNav />
      </ErrorBoundary>

      {/* 6. Global Search Dialog Modal */}
      <ErrorBoundary componentName="SearchModal" silent>
        <SearchModal />
      </ErrorBoundary>

      {/* 7. Unified Global Report Composer Modal */}
      <ErrorBoundary componentName="ReportComposerModal" silent>
        <ReportComposerModal
          isOpen={isReportComposerOpen}
          onClose={closeReportComposer}
          initialSegment={reportComposerInitialSegment}
          language={language}
          onTrackReport={(rId) => {
            closeReportComposer();
            navigateTo(`/track-report?id=${encodeURIComponent(rId)}`);
          }}
        />
      </ErrorBoundary>

      {/* 8. Persistent Global Toast Notification */}
      <Toast toast={toast} onDismiss={hideToast} language={language} />

      {/* 9. Dev-only Viewport Sizing Debugger */}
      {import.meta.env.DEV && <ViewportDebugger />}
    </div>
  );
};

