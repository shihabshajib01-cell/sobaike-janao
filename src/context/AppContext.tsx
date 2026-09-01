import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SectionKey } from '../theme/tokens';

export type RoutePath =
  | '/'
  | '/harassment'
  | '/rickshaw'
  | '/extortion'
  | '/explore'
  | '/report'
  | '/track-report'
  | '/search'
  | '/more'
  | `/report-detail/${string}`
  | `/location/${string}`
  | `/subject/${string}`
  | string;

export type Language = 'bn' | 'en';

export interface AppContextType {
  currentRoute: RoutePath;
  currentReportId: string | null;
  currentLocationId: string | null;
  currentSubjectId: string | null;
  queryParams: Record<string, string>;
  navigateTo: (route: RoutePath) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
  isTabletMenuOpen: boolean;
  setIsTabletMenuOpen: (open: boolean) => void;
  isReportComposerOpen: boolean;
  reportComposerInitialSegment: SectionKey | null;
  openReportComposer: (segment?: SectionKey | null) => void;
  closeReportComposer: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [language, setLanguage] = useState<Language>('bn');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isTabletMenuOpen, setIsTabletMenuOpen] = useState<boolean>(false);

  // Global Report Composer Modal State
  const [isReportComposerOpen, setIsReportComposerOpen] = useState<boolean>(false);
  const [reportComposerInitialSegment, setReportComposerInitialSegment] = useState<SectionKey | null>(null);

  // Sync document language attribute with active state
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const currentRoute: RoutePath = (location.pathname || '/') as RoutePath;

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (location.search) {
      const searchParams = new URLSearchParams(location.search);
      searchParams.forEach((val, key) => {
        params[key] = val;
      });
    }
    return params;
  }, [location.search]);

  const currentReportId = useMemo(() => {
    if (location.pathname.startsWith('/report-detail/')) {
      const raw = location.pathname.replace('/report-detail/', '');
      return decodeURIComponent(raw);
    }
    return null;
  }, [location.pathname]);

  const currentLocationId = useMemo(() => {
    if (location.pathname.startsWith('/location/')) {
      const raw = location.pathname.replace('/location/', '');
      return decodeURIComponent(raw);
    }
    return null;
  }, [location.pathname]);

  const currentSubjectId = useMemo(() => {
    if (location.pathname.startsWith('/subject/')) {
      const raw = location.pathname.replace('/subject/', '');
      return decodeURIComponent(raw);
    }
    return null;
  }, [location.pathname]);

  const navigateTo = useCallback((route: RoutePath) => {
    const cleanRoute = route.startsWith('/') ? route : `/${route}`;
    navigate(cleanRoute);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setIsTabletMenuOpen(false);
  }, [navigate]);

  // Sync report composer state when visiting /report (open modal with no pre-selected segment)
  useEffect(() => {
    if (location.pathname === '/report') {
      setReportComposerInitialSegment(null);
      setIsReportComposerOpen(true);
    }
  }, [location.pathname]);

  const openReportComposer = useCallback((segment?: SectionKey | null) => {
    // Always open with no pre-selected segment unless explicitly provided as non-null
    setReportComposerInitialSegment(segment || null);
    setIsReportComposerOpen(true);
  }, []);

  const closeReportComposer = useCallback(() => {
    setIsReportComposerOpen(false);
    // If route was /report, navigate to home
    if (location.pathname.startsWith('/report')) {
      navigateTo('/');
    }
  }, [location.pathname, navigateTo]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'bn' ? 'en' : 'bn'));
  }, []);

  const value = useMemo<AppContextType>(
    () => ({
      currentRoute,
      currentReportId,
      currentLocationId,
      currentSubjectId,
      queryParams,
      navigateTo,
      language,
      setLanguage,
      toggleLanguage,
      isSearchModalOpen,
      setIsSearchModalOpen,
      isShortcutsModalOpen,
      setIsShortcutsModalOpen,
      isTabletMenuOpen,
      setIsTabletMenuOpen,
      isReportComposerOpen,
      reportComposerInitialSegment,
      openReportComposer,
      closeReportComposer,
    }),
    [
      currentRoute,
      currentReportId,
      currentLocationId,
      currentSubjectId,
      queryParams,
      navigateTo,
      language,
      toggleLanguage,
      isSearchModalOpen,
      isShortcutsModalOpen,
      isTabletMenuOpen,
      isReportComposerOpen,
      reportComposerInitialSegment,
      openReportComposer,
      closeReportComposer,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

