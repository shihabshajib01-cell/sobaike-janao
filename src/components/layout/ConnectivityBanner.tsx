import React, { useEffect, useRef, useState } from 'react';
import { WifiOff, Wifi, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface ConnectivityBannerProps {
  id?: string;
  className?: string;
}

export const ConnectivityBanner: React.FC<ConnectivityBannerProps> = ({
  id = 'persistent-connectivity-banner',
  className = '',
}) => {
  const {
    isOnline,
    isCheckingConnection,
    isConnectionRestored,
    offlineSince,
    checkConnection,
    language,
  } = useApp();

  const bannerRef = useRef<HTMLDivElement>(null);
  const [offlineMinutes, setOfflineMinutes] = useState<number>(0);

  // Update offline duration counter every 30 seconds if offline
  useEffect(() => {
    if (isOnline || !offlineSince) {
      setOfflineMinutes(0);
      return;
    }

    const updateDuration = () => {
      const elapsedMs = Date.now() - new Date(offlineSince).getTime();
      const mins = Math.floor(elapsedMs / 60000);
      setOfflineMinutes(mins);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 30000);
    return () => clearInterval(interval);
  }, [isOnline, offlineSince]);

  // Dynamically synchronize the banner's actual height as a CSS variable
  // so that sticky headers, rails, and modals stack seamlessly without overlapping
  useEffect(() => {
    const isVisible = !isOnline || isConnectionRestored;

    if (!isVisible) {
      document.documentElement.style.setProperty('--connectivity-banner-height', '0px');
      return;
    }

    const updateHeight = () => {
      if (bannerRef.current) {
        const height = bannerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--connectivity-banner-height', `${height}px`);
      }
    };

    updateHeight();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && bannerRef.current) {
      resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(bannerRef.current);
    }

    window.addEventListener('resize', updateHeight);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateHeight);
      document.documentElement.style.setProperty('--connectivity-banner-height', '0px');
    };
  }, [isOnline, isConnectionRestored]);

  // If online and not in restored notification phase, do not render
  if (isOnline && !isConnectionRestored) {
    return null;
  }

  const isRestored = isConnectionRestored;

  return (
    <aside
      id={id}
      ref={bannerRef}
      role={isRestored ? 'status' : 'alert'}
      aria-live={isRestored ? 'polite' : 'assertive'}
      className={`sticky top-0 z-[60] w-full transition-colors duration-200 shadow-2xs select-none ${
        isRestored
          ? 'bg-ui-success-bg border-b border-ui-success-border text-ui-success-text'
          : 'bg-ui-warning-bg border-b border-ui-warning-border text-ui-warning-text'
      } ${className}`}
    >
      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3">
        {/* Left cluster: Status icon + Primary alert text */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative ${
              isRestored
                ? 'bg-ui-success-border/40 text-ui-success-text'
                : 'bg-ui-warning-border/50 text-ui-warning-text'
            }`}
          >
            {isRestored ? (
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <>
                <WifiOff className="w-4 h-4" aria-hidden="true" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              </>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[13px] sm:text-[14px] leading-snug text-ui-content-primary">
                {isRestored
                  ? language === 'bn'
                    ? 'ইন্টারনেট সংযোগ ফিরে এসেছে'
                    : 'Back online'
                  : language === 'bn'
                  ? 'আপনি অফলাইনে আছেন'
                  : 'You are currently offline'}
              </span>

              {/* Optional duration chip when offline for >= 1 min */}
              {!isRestored && offlineMinutes >= 1 && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-ui-surface/60 font-medium text-ui-content-secondary border border-ui-warning-border/50">
                  {language === 'bn' ? `${offlineMinutes} মিনিট` : `${offlineMinutes}m`}
                </span>
              )}
            </div>

            <p className="text-[12px] sm:text-[13px] leading-tight text-ui-content-secondary mt-0.5">
              {isRestored
                ? language === 'bn'
                  ? 'সংযোগ পুনরায় সক্রিয় হয়েছে, সমস্ত সেবা প্রস্তুত।'
                  : 'Internet connection is restored and all services are ready.'
                : language === 'bn'
                ? 'ইন্টারনেট সংযোগ বিচ্ছিন্ন হয়েছে। সংরক্ষিত খসড়া ব্রাউজারে নিরাপদ আছে।'
                : 'No internet connection detected. Saved drafts and cached items remain safe.'}
            </p>
          </div>
        </div>

        {/* Right cluster: Retry / Check connection CTA button */}
        {!isRestored && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="connectivity-banner-retry-btn"
              onClick={() => checkConnection()}
              disabled={isCheckingConnection}
              aria-label={
                language === 'bn'
                  ? 'ইন্টারনেট সংযোগ পুনরায় পরীক্ষা করুন'
                  : 'Check internet connection'
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg font-semibold text-[12px] sm:text-[13px] transition-colors border border-ui-warning-border bg-ui-surface text-ui-content-primary hover:bg-ui-surface-hover active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 text-ui-content-secondary ${
                  isCheckingConnection ? 'animate-spin' : ''
                }`}
                aria-hidden="true"
              />
              <span className="whitespace-nowrap">
                {isCheckingConnection
                  ? language === 'bn'
                    ? 'পরীক্ষা হচ্ছে...'
                    : 'Checking...'
                  : language === 'bn'
                  ? 'পুনরায় পরীক্ষা'
                  : 'Check connection'}
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
