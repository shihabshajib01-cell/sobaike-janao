import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { VisitorSessionService } from '../../services/visitorSessionService';
import { Modal } from '../ui/Modal';

interface LocationConsentModalProps {
  isOpen: boolean;
  language: 'bn' | 'en';
  onClose: () => void;
}

export const LocationConsentModal: React.FC<LocationConsentModalProps> = ({
  isOpen,
  language,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const shareLocationBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        shareLocationBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isBn = language === 'bn';

  const handleShareLocation = async () => {
    setIsLoading(true);
    try {
      await VisitorSessionService.requestAndRecordLocation();
    } catch {
      // Handled internally in service
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const handleNotNow = async () => {
    try {
      await VisitorSessionService.handleNotNow();
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
      <div className="p-5 sm:p-6 flex flex-col gap-5 text-ui-content-primary">
        {/* Icon & Heading */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-ui-info-bg text-ui-info-text border border-ui-info-border flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 id="location-consent-title" className="text-lg font-bold tracking-tight">
              {isBn ? 'কাছাকাছি প্রতিবেদন দেখুন' : 'See reports near you'}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div id="location-consent-desc" className="text-sm text-ui-content-secondary leading-relaxed">
          <p>
            {isBn
              ? 'লোকেশন চালু করলে কাছাকাছি এলাকার আরও প্রতিবেদন দেখতে পারবেন।'
              : 'Turn on location to show more reports from nearby areas.'}
          </p>
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
