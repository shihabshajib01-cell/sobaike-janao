import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SectionKey } from '../theme/tokens';
import { VisitorSessionService, StoredLocation, LocationRequestResult, BROWSE_LOCATION_MAX_AGE_MS } from '../services/visitorSessionService';
import { isValidReporterCoordinates } from '../services/types';
import { IpLocationService, ApproximateIpLocation, IP_LOCATION_MAX_AGE_MS } from '../services/ipLocationService';

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
  useApproximateBrowseLocation: () => Promise<void>;
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
    const choice = VisitorSessionService.getLocationChoice();
    if (choice !== 'granted') return null;
    const loc = VisitorSessionService.getLastRecordedLocation();
    return loc ? { ...loc, source: 'device' as const } : null;
  });
  // Start in a short resolving state so pages do not issue an unranked request
  // before the persisted browse-location preference has been restored.
  const [browseLocationStatus, setBrowseLocationStatus] =
    useState<BrowseLocationStatus>('requesting');

  const refreshBrowseLocation = useCallback(async () => {
    const resolveApproximate = async (
      failureStatus: BrowseLocationStatus
    ): Promise<boolean> => {
      const approximate = await IpLocationService.getApproximateLocation();
      if (approximate) {
        setBrowseLocation(approximate);
        setBrowseLocationStatus('available');
        return true;
      }
      setBrowseLocation(null);
      setBrowseLocationStatus(failureStatus);
      return false;
    };

    let choice = VisitorSessionService.getLocationChoice();

    // "Not now" is authoritative: never silently upgrade it to precise GPS,
    // even if the browser still has a previous geolocation grant.
    if (choice === 'not_now') {
      await resolveApproximate('not_now');
      return;
    }

    const loc = VisitorSessionService.getLastRecordedLocation();
    if (
      choice === 'granted' &&
      loc &&
      isValidReporterCoordinates(loc.latitude, loc.longitude, loc.accuracy)
    ) {
      setBrowseLocation({ ...loc, source: 'device' });
      setBrowseLocationStatus('available');
      return;
    }

    const perm = await VisitorSessionService.queryPermissionStatus();

    // Re-read the persisted choice after async permission lookup so an explicit
    // "Not now" made during this refresh cannot lose a race to silent GPS.
    choice = VisitorSessionService.getLocationChoice();
    if (choice === 'not_now') {
      await resolveApproximate('not_now');
      return;
    }

    // Existing browser grants may be restored without another prompt. A newly
    // granted permission may upgrade denied/IP fallback, but an explicit
    // "Not now" remains authoritative and is handled before this branch.
    if (perm === 'granted') {
      const requestMode =
        choice === 'denied' || choice === 'ip_fallback'
          ? 'permission_upgrade'
          : 'restore';
      const deviceResult = await VisitorSessionService.requestAndRecordLocation(
        'browse',
        { mode: requestMode }
      );

      choice = VisitorSessionService.getLocationChoice();
      if (choice === 'not_now') {
        await resolveApproximate('not_now');
        return;
      }

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

    choice = VisitorSessionService.getLocationChoice();

    // If a previously willing/attempted visitor now has browser permission
    // blocked, remember that state. A manual future browser grant can still
    // upgrade back to device location through the permission observer.
    if (
      perm === 'denied' &&
      choice !== null &&
      choice !== 'not_now' &&
      choice !== 'denied'
    ) {
      VisitorSessionService.setLocationChoice('denied');
      choice = 'denied';
    }

    // After any explicit location interaction, always keep a coarse IP
    // location available for browsing when precise device location cannot be
    // restored. First-time undecided visitors never enter this branch.
    if (
      choice === 'granted' ||
      choice === 'denied' ||
      choice === 'ip_fallback'
    ) {
      const failureStatus: BrowseLocationStatus =
        choice === 'denied'
          ? 'denied'
          : choice === 'granted'
          ? 'granted_unavailable'
          : 'unavailable';
      await resolveApproximate(failureStatus);
      return;
    }

    setBrowseLocation(null);
    if (perm === 'unavailable') {
      setBrowseLocationStatus('unavailable');
    } else if (perm === 'denied') {
      setBrowseLocationStatus('denied');
    } else {
      setBrowseLocationStatus('not_asked');
    }
  }, []);

  const retryBrowseLocation = useCallback(async (): Promise<LocationRequestResult> => {
    setBrowseLocationStatus('requesting');
    const result = await VisitorSessionService.requestAndRecordLocation('browse', {
      mode: 'user_request',
    });

    // The user may have selected Not now / approximate location while the
    // browser geolocation request was still in flight. Preserve that newer
    // intent and never rewrite it to ip_fallback.
    const currentChoice = VisitorSessionService.getLocationChoice();
    if (currentChoice === 'not_now') {
      const approximate = await IpLocationService.getApproximateLocation();
      if (approximate) {
        setBrowseLocation(approximate);
        setBrowseLocationStatus('available');
      } else {
        setBrowseLocation(null);
        setBrowseLocationStatus('not_now');
      }
      return result;
    }

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
    }

    // A technical GPS failure after an explicit user attempt is remembered as
    // an IP-fallback preference. This prevents a new location nag on refresh,
    // while still allowing a future browser grant to upgrade to device GPS.
    if (result.status !== 'denied' && result.errorType !== 'denied') {
      VisitorSessionService.setLocationChoice('ip_fallback');
    }

    const approximate = await IpLocationService.getApproximateLocation();
    if (approximate) {
      setBrowseLocation(approximate);
      setBrowseLocationStatus('available');
      return { ...result, browseFallback: 'ip' };
    }

    setBrowseLocation(null);
    if (result.status === 'denied' || result.errorType === 'denied') {
      setBrowseLocationStatus('denied');
    } else if (result.errorType === 'timeout') {
      setBrowseLocationStatus('error');
    } else {
      setBrowseLocationStatus('unavailable');
    }
    return result;
  }, []);

  const useApproximateBrowseLocation = useCallback(async (): Promise<void> => {
    await VisitorSessionService.handleNotNow();
    const approximate = await IpLocationService.getApproximateLocation();

    if (approximate) {
      setBrowseLocation(approximate);
      setBrowseLocationStatus('available');
      return;
    }

    setBrowseLocation(null);
    setBrowseLocationStatus('not_now');
  }, []);

  useEffect(() => {
    refreshBrowseLocation();

    // 1. Subscribe to location updates in session memory
    const unsubscribeLocation = VisitorSessionService.subscribeLocationChange((loc) => {
      const choice = VisitorSessionService.getLocationChoice();
      if (
        choice === 'granted' &&
        loc &&
        isValidReporterCoordinates(loc.latitude, loc.longitude, loc.accuracy)
      ) {
        setBrowseLocation({ ...loc, source: 'device' });
        setBrowseLocationStatus('available');
      } else {
        // Report submission may capture a device position even while browsing
        // is explicitly approximate. Never let reporter GPS override the saved
        // browse preference.
        refreshBrowseLocation();
      }
    });

    // 2. Observe external browser permission changes (e.g. user changes setting in browser toolbar)
    const unsubscribePermission = VisitorSessionService.setupPermissionObserver((perm) => {
      if (perm === 'denied') {
        // Device permission denial removes GPS from memory, then re-resolves
        // browsing through the coarse IP fallback if the user had already
        // attempted location.
        refreshBrowseLocation();
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

  // Context owns browse-location freshness. Device positions are refreshed on
  // the device TTL; IP positions use their longer coarse-location TTL. Pages
  // consume this state instead of applying a second, conflicting freshness rule.
  useEffect(() => {
    if (browseLocationStatus !== 'available' || !browseLocation) return;

    const maxAgeMs =
      browseLocation.source === 'ip'
        ? IP_LOCATION_MAX_AGE_MS
        : BROWSE_LOCATION_MAX_AGE_MS;
    const ageMs = Math.max(0, Date.now() - browseLocation.timestamp);
    const delayMs = Math.max(1000, maxAgeMs - ageMs + 250);

    const timeoutId = window.setTimeout(() => {
      void refreshBrowseLocation();
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    browseLocation,
    browseLocationStatus,
    refreshBrowseLocation,
  ]);

  // If an explicit location choice exists but the approximate provider/network
  // is temporarily unavailable, retry without nagging the visitor again.
  // Coming back online also triggers an immediate recovery attempt.
  useEffect(() => {
    const handleOnline = () => {
      void refreshBrowseLocation();
    };
    window.addEventListener('online', handleOnline);

    const choice = VisitorSessionService.getLocationChoice();
    const shouldRetryApproximate =
      choice !== null &&
      browseLocationStatus !== 'available' &&
      browseLocationStatus !== 'requesting' &&
      navigator.onLine;

    const retryId = shouldRetryApproximate
      ? window.setTimeout(() => {
          void refreshBrowseLocation();
        }, 60_000)
      : null;

    return () => {
      window.removeEventListener('online', handleOnline);
      if (retryId !== null) {
        window.clearTimeout(retryId);
      }
    };
  }, [browseLocationStatus, refreshBrowseLocation]);

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

  // Sync report composer state when visiting /report (open modal with no pre-selected segment).
  // Use the normalized route so static route entries such as /report/ behave exactly
  // like in-app navigation to /report.
  useEffect(() => {
    if (currentRoute === '/report') {
      setReportComposerInitialSegment(null);
      setIsReportComposerOpen(true);
    }
  }, [currentRoute]);

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
      useApproximateBrowseLocation,
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
      useApproximateBrowseLocation,
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
