import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SectionKey } from '../theme/tokens';
import { VisitorSessionService, StoredLocation, LocationRequestResult } from '../services/visitorSessionService';
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
  | 'not_asked'
  | 'requesting'
  | 'available'
  | 'granted_unavailable'
  | 'not_now'
  | 'denied'
  | 'unavailable'
  | 'error';

const normalizeRoutePath = (pathname: string): RoutePath => {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return (normalized || '/') as RoutePath;
};

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
  isHarassmentFilterOpen: boolean;
  setIsHarassmentFilterOpen: (open: boolean) => void;
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
  retryBrowseLocation: () => Promise<LocationRequestResult>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'bn';
    return new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'bn';
  });
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isTabletMenuOpen, setIsTabletMenuOpen] = useState<boolean>(false);
  const [isHarassmentFilterOpen, setIsHarassmentFilterOpen] = useState<boolean>(false);

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
  const [browseLocationStatus, setBrowseLocationStatus] = useState<BrowseLocationStatus>('not_asked');

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
      // User consented previously, but coordinates are unavailable / waiting / GPS off
      setBrowseLocationStatus('granted_unavailable');
    } else {
      setBrowseLocationStatus('not_asked');
    }
  }, []);

  const retryBrowseLocation = useCallback(async (): Promise<LocationRequestResult> => {
    setBrowseLocationStatus('requesting');
    const result = await VisitorSessionService.requestAndRecordLocation('browse');
    if (result.success && result.coords) {
      setBrowseLocation({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
        timestamp: Date.now(),
      });
      setBrowseLocationStatus('available');
      return result;
    } else {
      setBrowseLocation(null);
      if (result.status === 'denied') {
        setBrowseLocationStatus('denied');
      } else if (result.errorType === 'timeout') {
        setBrowseLocationStatus('error');
      } else {
        setBrowseLocationStatus('unavailable');
      }
      return result;
    }
  }, []);

  useEffect(() => {
    refreshBrowseLocation();

    // 1. Subscribe to location updates in session memory
    const unsubscribeLocation = VisitorSessionService.subscribeLocationChange((loc) => {
      if (loc && isValidReporterCoordinates(loc.latitude, loc.longitude, loc.accuracy)) {
        setBrowseLocation(loc);
        setBrowseLocationStatus('available');
      } else {
        refreshBrowseLocation();
      }
    });

    // 2. Observe external browser permission changes (e.g. user changes setting in browser toolbar)
    const unsubscribePermission = VisitorSessionService.setupPermissionObserver((perm) => {
      if (perm === 'denied') {
        setBrowseLocation(null);
        setBrowseLocationStatus('denied');
      } else if (perm === 'granted') {
        const choice = VisitorSessionService.getLocationChoice();
        if (choice === 'granted') {
          VisitorSessionService.initReturningVisitor();
        } else {
          refreshBrowseLocation();
        }
      } else {
        refreshBrowseLocation();
      }
    });

    // 3. Observe tab visibility / focus returns to recover state without polling
    const unsubscribeLifecycle = VisitorSessionService.setupLifecycleObserver(() => {
      const choice = VisitorSessionService.getLocationChoice();
      if (choice === 'granted' && !VisitorSessionService.getLastRecordedLocation()) {
        VisitorSessionService.initReturningVisitor();
      } else {
        refreshBrowseLocation();
      }
    });

    return () => {
      unsubscribeLocation();
      unsubscribePermission();
      unsubscribeLifecycle();
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

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);

      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(location.search);
      if (lang === 'en') {
        params.set('lang', 'en');
      } else {
        params.delete('lang');
      }

      const search = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: search ? `?${search}` : '',
          hash: location.hash,
        },
        { replace: true }
      );
    },
    [location.hash, location.pathname, location.search, navigate]
  );

  const currentRoute: RoutePath = normalizeRoutePath(location.pathname || '/');

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
    setIsHarassmentFilterOpen(false);
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
    setLanguage(language === 'bn' ? 'en' : 'bn');
  }, [language, setLanguage]);

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
      isHarassmentFilterOpen,
      setIsHarassmentFilterOpen,
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
      retryBrowseLocation,
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
      isHarassmentFilterOpen,
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
      retryBrowseLocation,
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
