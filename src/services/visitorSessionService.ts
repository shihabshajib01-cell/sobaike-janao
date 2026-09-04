import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  ReporterSubmissionContext,
  ReporterLocationCaptureResult,
  isValidReporterCoordinates,
} from './types';


const VISITOR_ID_KEY = 'sobaike_visitor_id_v1';
const SESSION_ID_KEY = 'sobaike_session_id_v1';
const LOCATION_CHOICE_KEY = 'sobaike_location_choice_v1';

export type LocationChoice = 'granted' | 'not_now';

export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unavailable';

export interface VisitorMetadata {
  browser_name: string;
  browser_version: string;
  os_name: string;
  device_category: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  platform: string;
  language: string;
  timezone: string;
  screen_width: number;
  screen_height: number;
  user_agent: string;
}

export interface StoredLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

let activeWatchId: number | null = null;
let lastRecordedLocation: StoredLocation | null = null;

/**
 * Generate a cryptographically strong UUID with fallback.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  // Ultimate deterministic fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Parse browser name and version safely from navigator
 */
function detectBrowser(ua: string): { name: string; version: string } {
  if (/SamsungBrowser\/([0-9.]+)/i.test(ua)) {
    const match = ua.match(/SamsungBrowser\/([0-9.]+)/i);
    return { name: 'Samsung Internet', version: match ? match[1] : '' };
  }
  if (/OPR\/([0-9.]+)|Opera\/([0-9.]+)/i.test(ua)) {
    const match = ua.match(/(?:OPR|Opera)\/([0-9.]+)/i);
    return { name: 'Opera', version: match ? match[1] : '' };
  }
  if (/Edg\/([0-9.]+)/i.test(ua)) {
    const match = ua.match(/Edg\/([0-9.]+)/i);
    return { name: 'Edge', version: match ? match[1] : '' };
  }
  if (/Chrome\/([0-9.]+)/i.test(ua) && !/Chromium/i.test(ua)) {
    const match = ua.match(/Chrome\/([0-9.]+)/i);
    return { name: 'Chrome', version: match ? match[1] : '' };
  }
  if (/Firefox\/([0-9.]+)/i.test(ua)) {
    const match = ua.match(/Firefox\/([0-9.]+)/i);
    return { name: 'Firefox', version: match ? match[1] : '' };
  }
  if (/Safari\/([0-9.]+)/i.test(ua) && !/Chrome/i.test(ua)) {
    const match = ua.match(/Version\/([0-9.]+)/i);
    return { name: 'Safari', version: match ? match[1] : '' };
  }
  return { name: 'Other', version: '' };
}

/**
 * Detect broad Operating System
 */
function detectOS(ua: string, platform: string): string {
  const combined = `${ua} ${platform}`.toLowerCase();
  if (/android/i.test(combined)) return 'Android';
  if (/iphone|ipad|ipod/i.test(combined)) return 'iOS';
  if (/windows/i.test(combined)) return 'Windows';
  if (/macintosh|mac os x/i.test(combined)) return 'macOS';
  if (/cros/i.test(combined)) return 'ChromeOS';
  if (/linux/i.test(combined)) return 'Linux';
  return 'Other';
}

/**
 * Detect broad device category
 */
function detectDeviceCategory(ua: string): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  if (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(ua)) {
    return 'tablet';
  }
  if (/(mobi|ipod|phone|blackberry|opera mini|fennec|minimo|symbian|psp|nintendo ds)/i.test(ua)) {
    return 'mobile';
  }
  if (typeof window !== 'undefined' && window.innerWidth <= 768 && 'ontouchstart' in window) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Gather safe browser/device metadata
 */
export function getVisitorMetadata(): VisitorMetadata {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      browser_name: 'Other',
      browser_version: '',
      os_name: 'Other',
      device_category: 'unknown',
      platform: '',
      language: 'en',
      timezone: 'UTC',
      screen_width: 0,
      screen_height: 0,
      user_agent: '',
    };
  }

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const browser = detectBrowser(ua);
  const os = detectOS(ua, platform);
  const deviceCategory = detectDeviceCategory(ua);

  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    timezone = 'UTC';
  }

  const screenWidth = typeof window.screen !== 'undefined' ? window.screen.width : window.innerWidth || 0;
  const screenHeight = typeof window.screen !== 'undefined' ? window.screen.height : window.innerHeight || 0;

  return {
    browser_name: browser.name,
    browser_version: browser.version,
    os_name: os,
    device_category: deviceCategory,
    platform: platform || os,
    language: navigator.language || 'en',
    timezone,
    screen_width: screenWidth,
    screen_height: screenHeight,
    user_agent: ua,
  };
}

/**
 * Calculate distance in meters using Haversine formula
 */
function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const VisitorSessionService = {
  /**
   * Get or create a persistent visitor ID (localStorage)
   */
  getVisitorId(): string {
    if (typeof window === 'undefined') return 'server';
    try {
      let vid = localStorage.getItem(VISITOR_ID_KEY);
      if (!vid) {
        vid = generateUUID();
        localStorage.setItem(VISITOR_ID_KEY, vid);
      }
      return vid;
    } catch {
      return generateUUID();
    }
  },

  /**
   * Get or create a session-scoped ID (sessionStorage)
   */
  getSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    try {
      let sid = sessionStorage.getItem(SESSION_ID_KEY);
      if (!sid) {
        sid = generateUUID();
        sessionStorage.setItem(SESSION_ID_KEY, sid);
      }
      return sid;
    } catch {
      return generateUUID();
    }
  },

  /**
   * Get saved location choice ('granted' | 'not_now' | null)
   */
  getLocationChoice(): LocationChoice | null {
    if (typeof window === 'undefined') return null;
    try {
      const val = localStorage.getItem(LOCATION_CHOICE_KEY);
      if (val === 'granted' || val === 'not_now') {
        return val;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Save location choice locally
   */
  setLocationChoice(choice: LocationChoice): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCATION_CHOICE_KEY, choice);
    } catch {
      // Ignored
    }
  },

  /**
   * Record visit session via secure Supabase RPC
   */
  async recordSession(
    status: PermissionStatus,
    coords?: { latitude: number; longitude: number; accuracy: number } | null
  ): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      // Local or demo mode, do not fail
      return;
    }

    const visitorId = this.getVisitorId();
    const sessionId = this.getSessionId();
    const meta = getVisitorMetadata();

    const payload = {
      p_visitor_id: visitorId,
      p_session_id: sessionId,
      p_permission_status: status,

      p_latitude: coords ? coords.latitude : null,
      p_longitude: coords ? coords.longitude : null,
      p_accuracy_meters: coords ? coords.accuracy : null,

      p_browser_name: meta.browser_name,
      p_browser_version: meta.browser_version,
      p_os_name: meta.os_name,
      p_device_category: meta.device_category,
      p_platform: meta.platform,

      p_language: meta.language,
      p_timezone: meta.timezone,

      p_screen_width: meta.screen_width,
      p_screen_height: meta.screen_height,

      p_user_agent: meta.user_agent,
    };

    try {
      const { error } = await supabase.rpc('record_public_visit_session', payload);
      if (error) {
        console.warn('[VisitorSessionService] Failed to record visit session:', error.message);
      } else if (coords) {
        lastRecordedLocation = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          timestamp: Date.now(),
        };
      }
    } catch (err) {
      console.warn('[VisitorSessionService] Unexpected error recording session:', err);
    }
  },

  /**
   * Handles user clicking "Share Location" on the consent modal
   */
  async requestAndRecordLocation(): Promise<{ success: boolean; status: PermissionStatus }> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.setLocationChoice('granted');
      await this.recordSession('unavailable', null);
      return { success: false, status: 'unavailable' };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          this.setLocationChoice('granted');
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          await this.recordSession('granted', coords);
          this.startLocationWatch();
          resolve({ success: true, status: 'granted' });
        },
        async (error) => {
          let status: PermissionStatus = 'unavailable';
          if (error.code === error.PERMISSION_DENIED) {
            status = 'denied';
          }
          this.setLocationChoice('granted'); // Record choice so we don't spam custom modal again
          await this.recordSession(status, null);
          resolve({ success: false, status });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        }
      );
    });
  },

  /**
   * Handles user clicking "Not Now"
   */
  async handleNotNow(): Promise<void> {
    this.setLocationChoice('not_now');
    await this.recordSession('prompt', null);
  },

  /**
   * For returning visitors who previously granted consent, restore session tracking
   */
  initReturningVisitor(): void {
    const choice = this.getLocationChoice();
    if (choice === 'granted') {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const coords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            };
            await this.recordSession('granted', coords);
            this.startLocationWatch();
          },
          async (err) => {
            const status: PermissionStatus =
              err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable';
            await this.recordSession(status, null);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000,
          }
        );
      }
    }
  },

  /**
   * Start throttled location watcher while website is open
   */
  startLocationWatch(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    if (activeWatchId !== null) return;

    try {
      activeWatchId = navigator.geolocation.watchPosition(
        async (position) => {
          const newLat = position.coords.latitude;
          const newLon = position.coords.longitude;
          const newAcc = position.coords.accuracy;
          const now = Date.now();

          let shouldUpdate = false;

          if (!lastRecordedLocation) {
            shouldUpdate = true;
          } else {
            const elapsedMs = now - lastRecordedLocation.timestamp;
            const fiveMinutesMs = 5 * 60 * 1000;

            // Check if 5 minutes elapsed
            if (elapsedMs >= fiveMinutesMs) {
              shouldUpdate = true;
            } else {
              // Check if moved ~100 meters
              const dist = calculateDistanceMeters(
                lastRecordedLocation.latitude,
                lastRecordedLocation.longitude,
                newLat,
                newLon
              );
              if (dist >= 100) {
                shouldUpdate = true;
              }
            }
          }

          if (shouldUpdate) {
            await this.recordSession('granted', {
              latitude: newLat,
              longitude: newLon,
              accuracy: newAcc,
            });
          }
        },
        (error) => {
          // Temporary watch error, silent handling
        },
        {
          enableHighAccuracy: true,
          maximumAge: 60000,
          timeout: 15000,
        }
      );
    } catch {
      // Ignored
    }
  },

  /**
   * Stop location watcher on unmount / cleanup
   */
  stopLocationWatch(): void {
    if (typeof navigator !== 'undefined' && navigator.geolocation && activeWatchId !== null) {
      navigator.geolocation.clearWatch(activeWatchId);
      activeWatchId = null;
    }
  },

  /**
   * Get the last known valid device location recorded during the session, if any.
   */
  getLastRecordedLocation(): StoredLocation | null {
    return lastRecordedLocation;
  },

  /**
   * Captures the reporter's device GPS location immediately associated with complaint submission.
   * Required for complaint submission for platform safety and spam prevention.
   *
   * Behavior:
   * 1. Checks for geolocation availability in browser.
   * 2. Attempts fresh capture via navigator.geolocation.getCurrentPosition with high accuracy.
   * 3. Validates coordinates (numeric, not 0,0, lat -90..90, lng -180..180, accuracy > 0).
   * 4. If fresh capture succeeds, updates `lastRecordedLocation` and returns coordinates.
   * 5. If fresh capture times out or fails (e.g. temporary weak signal), but a previously valid
   *    `lastRecordedLocation` is available, uses it.
   * 6. If permission was denied or no valid position could be captured, returns clear fail result (fails closed).
   */
  async captureReporterDeviceLocation(): Promise<ReporterLocationCaptureResult> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (!isSupabaseConfigured()) {
        return {
          success: true,
          coords: {
            latitude: 23.8103,
            longitude: 90.4125,
            accuracy: 25,
            captured_at: new Date().toISOString(),
          },
        };
      }
      return {
        success: false,
        errorType: 'unavailable',
        messageEn:
          'Location services are not supported or available on this device/browser. Device location is required to submit a complaint for platform safety and spam prevention.',
        messageBn:
          'এই ডিভাইস বা ব্রাউজারে লোকেশন সেবা সমর্থিত নয়। প্ল্যাটফর্মের নিরাপত্তা ও স্প্যাম প্রতিরোধের স্বার্থে অভিযোগ জমা দিতে ডিভাইসের অবস্থান আবশ্যক।',
      };
    }

    return new Promise<ReporterLocationCaptureResult>((resolve) => {
      // 10-second timeout for fresh capture
      const timeoutId = setTimeout(() => {
        // If fresh capture timed out, check if we have a valid lastRecordedLocation to use
        if (
          lastRecordedLocation &&
          isValidReporterCoordinates(
            lastRecordedLocation.latitude,
            lastRecordedLocation.longitude,
            lastRecordedLocation.accuracy
          )
        ) {
          resolve({
            success: true,
            coords: {
              latitude: lastRecordedLocation.latitude,
              longitude: lastRecordedLocation.longitude,
              accuracy: lastRecordedLocation.accuracy,
              captured_at: new Date(lastRecordedLocation.timestamp).toISOString(),
            },
          });
          return;
        }

        if (!isSupabaseConfigured()) {
          resolve({
            success: true,
            coords: {
              latitude: 23.8103,
              longitude: 90.4125,
              accuracy: 25,
              captured_at: new Date().toISOString(),
            },
          });
          return;
        }

        resolve({
          success: false,
          errorType: 'timeout',
          messageEn:
            'Location request timed out. Device location is required to submit a complaint for platform safety and spam prevention. Please ensure device GPS is turned on and try again.',
          messageBn:
            'অবস্থান নির্ণয়ের সময় শেষ হয়ে গেছে। প্ল্যাটফর্মের নিরাপত্তা ও স্প্যাম প্রতিরোধের স্বার্থে অভিযোগ জমা দিতে ডিভাইসের অবস্থান আবশ্যক। অনুগ্রহ করে ডিভাইসের জিপিএস চালু করে পুনরায় চেষ্টা করুন।',
        });
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeoutId);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;
          const captured_at = new Date(pos.timestamp || Date.now()).toISOString();

          if (!isValidReporterCoordinates(lat, lng, accuracy)) {
            // Check if valid stored location exists as fallback
            if (
              lastRecordedLocation &&
              isValidReporterCoordinates(
                lastRecordedLocation.latitude,
                lastRecordedLocation.longitude,
                lastRecordedLocation.accuracy
              )
            ) {
              resolve({
                success: true,
                coords: {
                  latitude: lastRecordedLocation.latitude,
                  longitude: lastRecordedLocation.longitude,
                  accuracy: lastRecordedLocation.accuracy,
                  captured_at: new Date(lastRecordedLocation.timestamp).toISOString(),
                },
              });
              return;
            }

            resolve({
              success: false,
              errorType: 'invalid_coordinates',
              messageEn:
                'Invalid GPS coordinates captured from device. Valid device location is required to submit a complaint for platform safety and spam prevention.',
              messageBn:
                'ডিভাইস থেকে প্রাপ্ত জিপিএস স্থানাঙ্ক সঠিক নয়। প্ল্যাটফর্মের নিরাপত্তা ও স্প্যাম প্রতিরোধের স্বার্থে অভিযোগ জমা দিতে সঠিক অবস্থান আবশ্যক।',
            });
            return;
          }

          // Successfully captured fresh location!
          lastRecordedLocation = {
            latitude: lat,
            longitude: lng,
            accuracy,
            timestamp: Date.now(),
          };

          this.setLocationChoice('granted');
          this.startLocationWatch();

          // Also record session asynchronously in background
          this.recordSession('granted', { latitude: lat, longitude: lng, accuracy }).catch(() => {});

          resolve({
            success: true,
            coords: {
              latitude: lat,
              longitude: lng,
              accuracy,
              captured_at,
            },
          });
        },
        (err) => {
          clearTimeout(timeoutId);

          if (err.code === err.PERMISSION_DENIED) {
            // User explicitly denied permission
            if (!isSupabaseConfigured()) {
              resolve({
                success: true,
                coords: {
                  latitude: 23.8103,
                  longitude: 90.4125,
                  accuracy: 25,
                  captured_at: new Date().toISOString(),
                },
              });
              return;
            }
            resolve({
              success: false,
              errorType: 'denied',
              messageEn:
                'Location access was denied. Device location is required to submit a complaint for platform safety and spam prevention. Please allow location permissions in your browser or device settings and try again.',
              messageBn:
                'লোকেশন ব্যবহারের অনুমতি দেওয়া হয়নি। প্ল্যাটফর্মের নিরাপত্তা ও স্প্যাম প্রতিরোধের স্বার্থে অভিযোগ জমা দিতে আপনার ডিভাইসের অবস্থান আবশ্যক। অনুগ্রহ করে ব্রাউজার বা ডিভাইসের সেটিংসে লোকেশন অনুমতি সক্রিয় করে পুনরায় চেষ্টা করুন।',
            });
            return;
          }

          // For other errors (POSITION_UNAVAILABLE, TIMEOUT), fallback if valid location exists
          if (
            lastRecordedLocation &&
            isValidReporterCoordinates(
              lastRecordedLocation.latitude,
              lastRecordedLocation.longitude,
              lastRecordedLocation.accuracy
            )
          ) {
            resolve({
              success: true,
              coords: {
                latitude: lastRecordedLocation.latitude,
                longitude: lastRecordedLocation.longitude,
                accuracy: lastRecordedLocation.accuracy,
                captured_at: new Date(lastRecordedLocation.timestamp).toISOString(),
              },
            });
            return;
          }

          if (!isSupabaseConfigured()) {
            resolve({
              success: true,
              coords: {
                latitude: 23.8103,
                longitude: 90.4125,
                accuracy: 25,
                captured_at: new Date().toISOString(),
              },
            });
            return;
          }

          resolve({
            success: false,
            errorType: 'unavailable',
            messageEn:
              'Unable to detect your device location. Device location is required to submit a complaint for platform safety and spam prevention. Please ensure device GPS is turned on and try again.',
            messageBn:
              'আপনার ডিভাইসের অবস্থান শনাক্ত করা যায়নি। প্ল্যাটফর্মের নিরাপত্তা ও স্প্যাম প্রতিরোধের স্বার্থে অভিযোগ জমা দিতে অবস্থান আবশ্যক। অনুগ্রহ করে ডিভাইসের জিপিএস চালু করে পুনরায় চেষ্টা করুন।',
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 9500,
          maximumAge: 0, // Request fresh position
        }
      );
    });
  },

  /**
   * Get parsed visitor metadata (browser, OS, screen dimensions)
   */
  getVisitorMetadata(): VisitorMetadata {
    return getVisitorMetadata();
  },

  /**
   * Constructs the safe private reporter context record to link to the complaint.
   * Strictly standard browser/device metadata and GPS coordinates without invasive tracking.
   */
  buildReporterSubmissionContext(
    clientSubmissionId: string,
    coords: {
      latitude: number;
      longitude: number;
      accuracy: number;
      captured_at: string;
    }
  ): ReporterSubmissionContext {
    const meta = getVisitorMetadata();
    return {
      client_submission_id: clientSubmissionId,
      visitor_id: this.getVisitorId(),
      session_id: this.getSessionId(),
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy_meters: coords.accuracy,
      captured_at: coords.captured_at,
      browser_name: meta.browser_name,
      browser_version: meta.browser_version,
      os_name: meta.os_name,
      device_category: meta.device_category,
      platform: meta.platform,
      language: meta.language,
      timezone: meta.timezone,
      screen_width: meta.screen_width,
      screen_height: meta.screen_height,
      user_agent: meta.user_agent,
    };
  },

};

