import { useState, useEffect, useCallback, useRef } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isChecking: boolean;
  isRestored: boolean;
  offlineSince: Date | null;
  checkConnection: () => Promise<boolean>;
}

/**
 * useNetworkStatus
 * 
 * Reliably tracks the browser's online/offline connectivity status
 * using standard browser network events (window 'online' and 'offline'),
 * window focus, document visibility, and an active lightweight HTTP ping verification.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  });

  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isRestored, setIsRestored] = useState<boolean>(false);
  const [offlineSince, setOfflineSince] = useState<Date | null>(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return new Date();
    }
    return null;
  });

  const restoredTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef<boolean>(isOnline);
  isOnlineRef.current = isOnline;

  const clearRestoredTimer = useCallback(() => {
    if (restoredTimerRef.current) {
      clearTimeout(restoredTimerRef.current);
      restoredTimerRef.current = null;
    }
  }, []);

  const triggerRestoredState = useCallback(() => {
    clearRestoredTimer();
    setIsRestored(true);
    setIsOnline(true);
    setOfflineSince(null);

    // Keep the "back online" confirmation banner visible for 3.5 seconds
    restoredTimerRef.current = setTimeout(() => {
      setIsRestored(false);
      restoredTimerRef.current = null;
    }, 3500);
  }, [clearRestoredTimer]);

  /**
   * Actively ping a lightweight static asset to ensure that the browser
   * can actually transfer packets, avoiding captive portal or false positive edge cases.
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);

    try {
      // 1. Check browser's reported connectivity
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
        if (!offlineSince) {
          setOfflineSince(new Date());
        }
        setIsRestored(false);
        clearRestoredTimer();
        setIsChecking(false);
        return false;
      }

      // 2. Active network probe with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`/brand/favicon-16x16.png?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const reachable = response.ok || response.status < 500;

      if (reachable) {
        if (!isOnlineRef.current) {
          triggerRestoredState();
        } else {
          setIsOnline(true);
          setOfflineSince(null);
        }
        return true;
      } else {
        setIsOnline(false);
        if (!offlineSince) {
          setOfflineSince(new Date());
        }
        setIsRestored(false);
        clearRestoredTimer();
        return false;
      }
    } catch {
      // Network error, DNS resolution failure, or timeout
      setIsOnline(false);
      if (!offlineSince) {
        setOfflineSince(new Date());
      }
      setIsRestored(false);
      clearRestoredTimer();
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [clearRestoredTimer, triggerRestoredState, offlineSince]);

  useEffect(() => {
    const handleOnlineEvent = () => {
      // Browser reports online event; actively verify network reachability
      checkConnection();
    };

    const handleOfflineEvent = () => {
      clearRestoredTimer();
      setIsRestored(false);
      setIsOnline(false);
      setOfflineSince(new Date());
    };

    const handleFocusOrVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        // If navigator says offline, respect it immediately
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          if (isOnlineRef.current) {
            handleOfflineEvent();
          }
        } else if (!isOnlineRef.current) {
          // If we were offline and tab became focused again, check if back online
          checkConnection();
        }
      }
    };

    // Listen to browser network events
    window.addEventListener('online', handleOnlineEvent);
    window.addEventListener('offline', handleOfflineEvent);
    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);

    return () => {
      window.removeEventListener('online', handleOnlineEvent);
      window.removeEventListener('offline', handleOfflineEvent);
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
      clearRestoredTimer();
    };
  }, [checkConnection, clearRestoredTimer]);

  return {
    isOnline,
    isChecking,
    isRestored,
    offlineSince,
    checkConnection,
  };
}
