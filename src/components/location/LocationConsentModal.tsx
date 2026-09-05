import React, { useState } from 'react';
import { MapPin, Loader2, ShieldCheck } from 'lucide-react';
import { VisitorSessionService } from '../../services/visitorSessionService';

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-consent-title"
      aria-describedby="location-consent-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-surface border border-subtle rounded-2xl w-full max-w-md p-6 shadow-xl flex flex-col gap-5 text-primary">
        {/* Icon & Heading */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 id="location-consent-title" className="text-lg font-bold tracking-tight">
              {isBn ? 'আপনার এলাকার পোস্ট দেখুন' : 'See more posts from your area'}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isBn ? 'গোপনীয়তা সুরক্ষিত' : 'Privacy Protected'}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div id="location-consent-desc" className="text-sm text-secondary leading-relaxed">
          <p>
            {isBn
              ? 'লোকেশন চালু করলে আপনার আশপাশের অভিযোগ, রিপোর্ট ও পোস্টগুলো ফিডে বেশি প্রাধান্য পাবে। এতে আপনার এলাকার আপডেট সহজে দেখতে পারবেন।'
              : 'Turn on location to see more complaints, reports, and posts from places near you. It helps keep your feed more relevant to where you are.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row-reverse gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleShareLocation}
            disabled={isLoading}
            className="w-full sm:flex-1 h-11 px-5 rounded-xl font-medium text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
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
            className="w-full sm:flex-1 h-11 px-5 rounded-xl font-medium text-sm bg-surface-muted hover:bg-surface-muted/80 text-secondary border border-subtle transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <span>{isBn ? 'এখন নয়' : 'Not now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
