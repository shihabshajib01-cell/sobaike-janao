import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SectionKey } from '../theme/tokens';
import { VisitorSessionService, StoredLocation, LocationRequestResult } from '../services/visitorSessionService';
import { isValidReporterCoordinates } from '../services/types';
import { IpLocationService, ApproximateIpLocation } from '../services/ipLocationService';

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

const stripLanguagePrefix = (pathname: string): string => {
  if (pathname === '/en') return '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/';
  return pathname || '/';
};

const withLanguagePrefix = (pathname: string, language: Language): string => {
  const logicalPath = stripLanguagePrefix(pathname);
  if (language === 'en') {
    return logicalPath === '/' ? '/en' : `/en${logicalPath}`;
  }
  return logicalPath;
};

const normalizeRoutePath = (pathname: string): RoutePath => {
  const logicalPath = stripLanguagePrefix(pathname);
  const normalized =
    logicalPath.length > 1 ? logicalPath.replace(/\/+$/, '') : logicalPath;
  return (normalized || '/') as RoutePath;
};

export type BrowseLocation = (StoredLocation & { source: 'device' }) | ApproximateIpLocation;

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
  browseLocation: BrowseLocation | null;
  refreshBrowseLocation: () => Promise<void>;
  retryBrowseLocation: () => Promise<LocationRequestResult>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'bn';
    const pathname = window.location.pathname;
    if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
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
  const [browseLocation, setBrowseLocation] = useState<BrowseLocation | null>(() => {
    const loc = VisitorSessionService.getLastRecordedLocation();
    return loc ? { ...loc, source: 'device' as const } : null;
  });
  const [browseLocationStatus, setBrowseLocationStatus] = useState<BrowseLocationStatus>('not_asked');

  const refreshBrowseLocation = useCallback(async () => {
    const loc = VisitorSessionService.getLastRecordedLocation();
    if (loc && isValidReporterCoordinates(loc.latitude, loc.longitude, loc.accuracy)) {
      setBrowseLocation({ ...loc, source: 'device' });
      setBrowseLocationStatus('available');
      return;
    }

    const choice = VisitorSessionService.getLocationChoice();
    const perm = await VisitorSessionService.queryPermissionStatus();

    // If browser permission is already granted, retrieve device location silently.
    // This never creates a permission prompt because we only enter this branch after
    // the browser reports an existing grant.
    if (perm === 'granted') {
      const deviceResult = await VisitorSessionService.requestAndRecordLocation('browse');
      if (deviceResult.success && deviceResult.coords) {
        setBrowseLocation({
          latitude: deviceResult.coords.latitude,
          longitude: deviceResult.coords.longitude,
          accuracy: deviceResult.coords.accuracy,
          timestamp: Date.now(),
          source: 'device',
        });
        setBrowseLocationStatus('available');
        return;
      }
    }

    // Do not perform IP geolocation on a first visit before the user has
    // interacted with location. Approximate fallback is allowed here only for
    // a returning visitor who previously granted location and whose device
    // position cannot currently be restored. Explicit denial is respected.
    if (choice === 'granted' && perm !== 'denied') {
      const approximate = await IpLocationService.getApproximateLocation();
      if (approximate) {
        setBrowseLocation(approximate);
        setBrowseLocationStatus('available');
        return;
      }
    }

    setBrowseLocation(null);
    if (choice === 'not_now') {
      setBrowseLocationStatus('not_now');
    } else if (perm === 'denied') {
      setBrowseLocationStatus('denied');
    } else if (perm === 'unavailable') {
      setBrowseLocationStatus('unavailable');
    } else if (choice === 'granted') {
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
        source: 'device',
      });
      setBrowseLocationStatus('available');
      return result;
    } else {
      // Respect an explicit permission denial. For technical failures after
      // the user actively requested location, use the coarse first-party IP
      // fallback for browsing only; it can never satisfy report submission.
      if (result.status !== 'denied' && result.errorType !== 'denied') {
        const approximate = await IpLocationService.getApproximateLocation();
        if (approximate) {
          setBrowseLocation(approximate);
          setBrowseLocationStatus('available');
          return { ...result, browseFallback: 'ip' };
        }
      }

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
        setBrowseLocation({ ...loc, source: 'device' });
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

      const params = new URLSearchParams(location.search);
      params.delete('lang');
      const search = params.toString();
      const targetPath = withLanguagePrefix(location.pathname, lang);

      navigate(
        {
          pathname: targetPath,
          search: search ? `?${search}` : '',
          hash: location.hash,
        },
        { replace: true }
      );
    },
    [location.hash, location.pathname, location.search, navigate]
  );

  useEffect(() => {
    const isEnglishPath =
      location.pathname === '/en' || location.pathname.startsWith('/en/');
    const urlLanguage: Language = isEnglishPath ? 'en' : 'bn';
    const params = new URLSearchParams(location.search);
    const legacyEnglishQuery = params.get('lang') === 'en';

    if (legacyEnglishQuery && !isEnglishPath) {
      params.delete('lang');
      const search = params.toString();
      navigate(
        {
          pathname: withLanguagePrefix(location.pathname, 'en'),
          search: search ? `?${search}` : '',
          hash: location.hash,
        },
        { replace: true }
      );
      setLanguageState('en');
      return;
    }

    if (language !== urlLanguage) {
      setLanguageState(urlLanguage);
    }
  }, [language, location.hash, location.pathname, location.search, navigate]);

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

  const logicalPathname = useMemo(
    () => stripLanguagePrefix(location.pathname),
    [location.pathname]
  );

  const currentReportId = useMemo(() => {
    if (logicalPathname.startsWith('/report-detail/')) {
      const raw = logicalPathname.replace('/report-detail/', '');
      return decodeURIComponent(raw);
    }
    return null;
  }, [logicalPathname]);

  const currentLocationId = useMemo(() => {
    if (logicalPathname.startsWith('/location/')) {
      const raw = logicalPathname.replace('/location/', '');
      return decodeURIComponent(raw);
    }
    return null;
  }, [logicalPathname]);

  const currentSubjectId = useMemo(() => {
    if (logicalPathname.startsWith('/subject/')) {
      const raw = logicalPathname.replace('/subject/', '');
      return decodeURIComponent(raw);
    }
    return null;
  }, [logicalPathname]);

  const navigateTo = useCallback((route: RoutePath) => {
    const cleanRoute = route.startsWith('/') ? route : `/${route}`;
    navigate(withLanguagePrefix(cleanRoute, language));
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setIsTabletMenuOpen(false);
    setIsHarassmentFilterOpen(false);
  }, [language, navigate]);

  // Sync report composer state when visiting /report (open modal with no pre-selected segment)
  useEffect(() => {
    if (logicalPathname === '/report') {
      setReportComposerInitialSegment(null);
      setIsReportComposerOpen(true);
    }
  }, [logicalPathname]);

  const openReportComposer = useCallback((segment?: SectionKey | null) => {
    // Always open with no pre-selected segment unless explicitly provided as non-null
    setReportComposerInitialSegment(segment || null);
    setIsReportComposerOpen(true);
  }, []);

  const closeReportComposer = useCallback(() => {
    setIsReportComposerOpen(false);
    // If route was /report, navigate to home
    if (logicalPathname.startsWith('/report')) {
      navigateTo('/');
    }
  }, [logicalPathname, navigateTo]);

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
