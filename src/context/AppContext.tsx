import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SectionKey } from '../theme/tokens';
import { VisitorSessionService, StoredLocation } from '../services/visitorSessionService';
import { isValidReporterCoordinates } from '../services/types';

export type RoutePath =
  | '/'
  | '/harassment'
  | '/rickshaw'
  | '/extortion'
  | '/load-shedding'
  | '/illegal-occupation'
  | '/explore'
  | '/report'
  | '/search'
  | '/more'
  | `/report-detail/${string}`
  | `/location/${string}`
  | `/subject/${string}`
  | string;

export type Language = 'bn' | 'en';

export type LocationConsentPurpose = 'browse' | 'report';

export type BrowseLocationStatus =
  | 'checking'
  | 'available'
  | 'not_now'
  | 'denied'
  | 'unavailable';

export type { StoredLocation };

export interface LocationConsentOptions {
  purpose?: LocationConsentPurpose;
  onSuccess?: () => void | Promise<void> | any;
}

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
  isTabletMenuOpen: boolean;
  setIsTabletMenuOpen: (open: boolean) => void;
  isReportComposerOpen: boolean;
  reportComposerInitialSegment: SectionKey | null;
  openReportComposer: (segment?: SectionKey | null) => void;
  closeReportComposer: () => void;
  isLocationModalOpen: boolean;
  locationModalPurpose: LocationConsentPurpose;
  openLocationConsent: (
    purposeOrOptions?: LocationConsentPurpose | LocationConsentOptions | (() => void | Promise<void> | any),
    onSuccess?: () => void | Promise<void> | any
  ) => void;
  closeLocationConsent: () => void;
  locationSuccessCallback: (() => void | Promise<void> | any) | null;
  browseLocationStatus: BrowseLocationStatus;
  browseLocation: StoredLocation | null;
  refreshBrowseLocation: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [language, setLanguage] = useState<Language>('bn');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isTabletMenuOpen, setIsTabletMenuOpen] = useState<boolean>(false);

  // Global Report Composer Modal State
  const [isReportComposerOpen, setIsReportComposerOpen] = useState<boolean>(false);
  const [reportComposerInitialSegment, setReportComposerInitialSegment] = useState<SectionKey | null>(null);

  // Global Location Consent Modal State & Callback
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [locationModalPurpose, setLocationModalPurpose] = useState<LocationConsentPurpose>('browse');
  const [locationSuccessCallback, setLocationSuccessCallback] = useState<(() => void | Promise<void> | any) | null>(null);

  // Global Browse Location State
  const [browseLocation, setBrowseLocation] = useState<StoredLocation | null>(() => {
    return VisitorSessionService.getLastRecordedLocation();
  });
  const [browseLocationStatus, setBrowseLocationStatus] = useState<BrowseLocationStatus>('checking');

  const refreshBrowseLocation = useCallback(async () => {
    const loc = VisitorSessionService.getLastRecordedLocation();
    if (loc && isValidReporterCoordinates(loc.latitude, loc.longitude, loc.accuracy)) {
      setBrowseLocation(loc);
      setBrowseLocationStatus('available');
      return;
    }

    setBrowseLocation(null);
    const choice = VisitorSessionService.getLocationChoice();
    if (choice === 'not_now') {
      setBrowseLocationStatus('not_now');
      return;
    }

    const perm = await VisitorSessionService.queryPermissionStatus();
    if (perm === 'denied') {
      setBrowseLocationStatus('denied');
    } else if (perm === 'unavailable') {
      setBrowseLocationStatus('unavailable');
    } else if (choice === 'granted') {
      // Choice was granted but coordinates are not yet available or failed
      setBrowseLocationStatus('unavailable');
    } else {
      setBrowseLocationStatus('checking');
    }
  }, []);

  useEffect(() => {
    refreshBrowseLocation();

    const unsubscribe = VisitorSessionService.subscribeLocationChange((loc) => {
      if (loc && isValidReporterCoordinates(loc.latitude, loc.longitude, loc.accuracy)) {
        setBrowseLocation(loc);
        setBrowseLocationStatus('available');
      } else {
        refreshBrowseLocation();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshBrowseLocation]);

  const openLocationConsent = useCallback((
    purposeOrOptions?: LocationConsentPurpose | LocationConsentOptions | (() => void | Promise<void> | any),
    onSuccess?: () => void | Promise<void> | any
  ) => {
    let targetPurpose: LocationConsentPurpose = 'browse';
    let targetCallback: (() => void | Promise<void> | any) | null = null;

    if (typeof purposeOrOptions === 'function') {
      targetPurpose = 'report';
      targetCallback = purposeOrOptions;
    } else if (typeof purposeOrOptions === 'string') {
      targetPurpose = purposeOrOptions;
      targetCallback = onSuccess || null;
    } else if (purposeOrOptions && typeof purposeOrOptions === 'object') {
      targetPurpose = purposeOrOptions.purpose || 'browse';
      targetCallback = purposeOrOptions.onSuccess || null;
    }

    setLocationModalPurpose(targetPurpose);
    setLocationSuccessCallback(() => targetCallback);
    setIsLocationModalOpen(true);
  }, []);

  const closeLocationConsent = useCallback(() => {
    setIsLocationModalOpen(false);
    setLocationSuccessCallback(null);
  }, []);

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
      isTabletMenuOpen,
      setIsTabletMenuOpen,
      isReportComposerOpen,
      reportComposerInitialSegment,
      openReportComposer,
      closeReportComposer,
      isLocationModalOpen,
      locationModalPurpose,
      openLocationConsent,
      closeLocationConsent,
      locationSuccessCallback,
      browseLocationStatus,
      browseLocation,
      refreshBrowseLocation,
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
      isTabletMenuOpen,
      isReportComposerOpen,
      reportComposerInitialSegment,
      openReportComposer,
      closeReportComposer,
      isLocationModalOpen,
      locationModalPurpose,
      openLocationConsent,
      closeLocationConsent,
      locationSuccessCallback,
      browseLocationStatus,
      browseLocation,
      refreshBrowseLocation,
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
