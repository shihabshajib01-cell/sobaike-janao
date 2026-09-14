import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { VisitorSessionService } from '../../services/visitorSessionService';
import { Modal } from '../ui/Modal';

interface LocationConsentModalProps {
  isOpen: boolean;
  language: 'bn' | 'en';
  purpose?: 'browse' | 'report';
  onClose: () => void;
  onSuccess?: () => void | Promise<void> | any;
}

export const LocationConsentModal: React.FC<LocationConsentModalProps> = ({
  isOpen,
  language,
  purpose = 'browse',
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const shareLocationBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
      setErrorMessage(null);
      const timer = setTimeout(() => {
        shareLocationBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isBn = language === 'bn';
  const isReportMode = purpose === 'report';

  const handleShareLocation = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (isReportMode) {
        const res = await VisitorSessionService.captureReporterDeviceLocation();
        if (res.success && res.coords) {
          onSuccess?.();
          onClose();
        } else {
          // Keep modal open on failure / denied / timeout / unavailable
          let msg = isBn
            ? 'এই ব্রাউজারে লোকেশন অনুমতি বন্ধ আছে। সাইটের লোকেশন অনুমতি চালু করে আবার চেষ্টা করুন।'
            : 'Location permission is disabled in your browser. Please enable site location permission and try again.';
          if (res.errorType === 'denied') {
            msg = isBn
              ? 'লোকেশন অনুমতি অস্বীকার করা হয়েছে। ব্রাউজার বা সাইট সেটিংস থেকে লোকেশন অনুমতি চালু করুন।'
              : 'Location permission was denied. Please enable location permission in your browser or site settings.';
          } else if (res.errorType === 'timeout') {
            msg = isBn
              ? 'অবস্থান নির্ণয়ের সময় শেষ হয়ে গেছে। অনুগ্রহ করে জিপিএস চালু করে পুনরায় চেষ্টা করুন।'
              : 'Location request timed out. Please ensure GPS is enabled and try again.';
          }
          setErrorMessage(msg);
        }
      } else {
        const res = await VisitorSessionService.requestAndRecordLocation();
        if (res.success) {
          onSuccess?.();
        }
        onClose();
      }
    } catch {
      if (isReportMode) {
        setErrorMessage(
          isBn
            ? 'লোকেশন পাওয়া যায়নি। অনুগ্রহ করে জিপিএস চালু করে আবার চেষ্টা করুন।'
            : 'Location could not be retrieved. Please enable GPS and try again.'
        );
      } else {
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotNow = async () => {
    try {
      if (!isReportMode) {
        await VisitorSessionService.handleNotNow();
      }
    } catch {
      // Handled internally
    } finally {
      onClose();
    }
  };

  return (
    <Modal
      id="location-consent-modal"
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdrop={false}
      showHeader={false}
      maxWidth="md"
      language={language}
      ariaLabelledBy="location-consent-title"
      ariaDescribedBy="location-consent-desc"
    >
      <div className="p-5 sm:p-6 flex flex-col gap-5 text-ui-content-primary text-left">
        {/* Icon & Heading */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-ui-info-bg text-ui-info-text border border-ui-info-border flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 id="location-consent-title" className="text-lg font-bold tracking-tight">
              {isReportMode
                ? (isBn ? 'প্রতিবেদন জমা দিতে লোকেশন চালু করুন' : 'Turn on location to submit report')
                : (isBn ? 'কাছাকাছি প্রতিবেদন দেখুন' : 'See reports near you')}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div id="location-consent-desc" className="text-sm text-ui-content-secondary leading-relaxed space-y-3">
          <p>
            {isReportMode
              ? (isBn
                  ? 'প্রতিবেদন জমা দিতে আপনার ডিভাইসের লোকেশন প্রয়োজন। লোকেশন চালু করে আবার চেষ্টা করুন।'
                  : 'Your device location is required to submit a report. Turn on location and try again.')
              : (isBn
                  ? 'লোকেশন চালু করলে কাছাকাছি এলাকার আরও প্রতিবেদন দেখতে পারবেন।'
                  : 'Turn on location to show more reports from nearby areas.')}
          </p>

          {errorMessage && (
            <div className="p-3 rounded-xl border border-ui-error-border bg-ui-error-bg text-ui-error-text text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row-reverse gap-2.5 pt-2">
          <button
            ref={shareLocationBtnRef}
            type="button"
            onClick={handleShareLocation}
            disabled={isLoading}
            className="w-full sm:flex-1 h-11 px-5 rounded-xl font-medium text-sm bg-ui-action-bg hover:bg-ui-action-hover text-ui-action-text transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>{isBn ? 'অনুমতি চাওয়া হচ্ছে...' : 'Requesting...'}</span>
              </>
            ) : (
              <span>{isBn ? 'লোকেশন চালু করুন' : 'Turn on location'}</span>
            )}
          </button>
          <button
            type="button"
            onClick={handleNotNow}
            disabled={isLoading}
            className="w-full sm:flex-1 h-11 px-5 rounded-xl font-medium text-sm bg-ui-surface-subtle hover:bg-ui-surface-subtle/80 text-ui-content-secondary border border-ui-stroke-subtle transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
          >
            <span>{isBn ? 'এখন নয়' : 'Not now'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
