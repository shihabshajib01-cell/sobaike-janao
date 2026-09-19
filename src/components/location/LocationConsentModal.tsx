import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { VisitorSessionService } from '../../services/visitorSessionService';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { ModalActions } from '../ui/ModalActions';

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
  const { retryBrowseLocation } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
      setErrorMessage(null);
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
        VisitorSessionService.setLocationChoice('granted');
        const res = await retryBrowseLocation();
        if (res.success || res.browseFallback === 'ip') {
          onSuccess?.();
          onClose();
        } else {
          let msg = isBn
            ? 'লোকেশন বর্তমানে পাওয়া যাচ্ছে না। আবার চেষ্টা করুন।'
            : 'Location is currently unavailable. Please try again.';
          if (res.errorType === 'denied' || res.status === 'denied') {
            msg = isBn
              ? 'লোকেশন অনুমতি বন্ধ আছে। ব্রাউজার বা সাইট সেটিংস থেকে অনুমতি চালু করে আবার চেষ্টা করুন।'
              : 'Location permission is blocked. Enable it in your browser or site settings, then try again.';
          } else if (res.errorType === 'timeout') {
            msg = isBn
              ? 'সময়ের মধ্যে লোকেশন পাওয়া যায়নি। আবার চেষ্টা করুন।'
              : 'Location could not be retrieved in time. Please try again.';
          }
          setErrorMessage(msg);
        }
      }
    } catch {
      if (isReportMode) {
        setErrorMessage(
          isBn
            ? 'লোকেশন পাওয়া যায়নি। অনুগ্রহ করে জিপিএস চালু করে আবার চেষ্টা করুন।'
            : 'Location could not be retrieved. Please enable GPS and try again.'
        );
      } else {
        setErrorMessage(
          isBn
            ? 'লোকেশন বর্তমানে পাওয়া যাচ্ছে না। আবার চেষ্টা করুন।'
            : 'Location is currently unavailable. Please try again.'
        );
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

  const handleModalClose = () => {
    if (!isReportMode && !VisitorSessionService.getLocationChoice()) {
      VisitorSessionService.setLocationChoice('not_now');
    }
    onClose();
  };

  return (
    <Modal
      id="location-consent-modal"
      isOpen={isOpen}
      onClose={handleModalClose}
      closeOnBackdrop={false}
      closeOnEscape={true}
      maxWidth="md"
      language={language}
      title={
        isReportMode
          ? (isBn ? 'প্রতিবেদন জমা দিতে লোকেশন চালু করুন' : 'Turn on location to submit report')
          : (isBn ? 'আপনার লোকেশন ব্যবহার করুন' : 'Use your location')
      }
      headerIcon={<MapPin className="w-5 h-5" aria-hidden="true" />}
      showCloseButton={false}
      ariaDescribedBy="location-consent-desc"
      footer={
        <ModalActions
          primary={{
            id: 'location-consent-primary-btn',
            type: 'button',
            size: 'lg',
            onClick: handleShareLocation,
            isLoading,
            label: isLoading
              ? (isBn ? 'অনুমতি চাওয়া হচ্ছে...' : 'Requesting...')
              : (isBn ? 'লোকেশন চালু করুন' : 'Turn on location'),
          }}
          secondary={{
            id: 'location-consent-secondary-btn',
            type: 'button',
            size: 'lg',
            onClick: handleNotNow,
            disabled: isLoading,
            label: isBn ? 'এখন নয়' : 'Not now',
          }}
        />
      }
    >
      <div id="location-consent-desc" className="space-y-3">
        <p className="type-body text-ui-content-secondary">
          {isReportMode
            ? (isBn
                ? 'প্রতিবেদন জমা দিতে আপনার ডিভাইসের লোকেশন প্রয়োজন। লোকেশন চালু করে আবার চেষ্টা করুন।'
                : 'Your device location is required to submit a report. Turn on location and try again.')
            : (isBn
                ? 'আপনার ব্রাউজিং অভিজ্ঞতা ব্যক্তিগতকরণ করতে লোকেশন ব্যবহারের অনুমতি দিন। আপনার লোকেশন জনসমক্ষে দেখানো হবে না।'
                : 'Allow location access to personalize your browsing experience. Your location will not be displayed publicly.')}
        </p>

        {errorMessage && (
          <div className="p-3 ui-radius-control ui-border-default border-ui-error-border bg-ui-error-bg text-ui-error-text type-helper flex items-start gap-2" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
