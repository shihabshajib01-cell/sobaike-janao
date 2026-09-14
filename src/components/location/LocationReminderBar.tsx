import React from 'react';
import { MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

export interface LocationReminderBarProps {
  isFirstVisitNoticeOpen?: boolean;
}

/**
 * LocationReminderBar
 * Persistent inline reminder bar positioned below public navigation
 * displayed when browse location is off/unavailable.
 * Reuses existing LocationConsentModal in 'browse' purpose.
 */
export const LocationReminderBar: React.FC<LocationReminderBarProps> = ({
  isFirstVisitNoticeOpen = false,
}) => {
  const {
    language,
    browseLocationStatus,
    openLocationConsent,
    isLocationModalOpen,
  } = useApp();

  // Show reminder ONLY when:
  // 1. First-visit notice is not currently open
  // 2. First-visit location modal is not actively open
  // 3. Location is NOT available (user chose Not now, denied, or unavailable)
  if (isFirstVisitNoticeOpen || isLocationModalOpen || browseLocationStatus === 'available') {
    return null;
  }

  const isBn = language === 'bn';

  return (
    <aside
      id="location-reminder-bar-container"
      aria-label={isBn ? 'লোকেশন বিজ্ঞপ্তি' : 'Location notice'}
      className="w-full mx-auto max-w-[900px] px-4 pt-3.5 sm:pt-4 md:px-6 md:pt-4 lg:px-8 min-[1440px]:px-0"
    >
      <div
        id="location-reminder-bar"
        className="w-full bg-ui-surface-subtle border border-ui-stroke-subtle rounded-2xl p-3 sm:p-3.5 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs transition-colors"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 text-ui-content-primary">
          <div className="w-8 h-8 rounded-lg bg-ui-surface flex items-center justify-center shrink-0 border border-ui-stroke-subtle text-ui-accent">
            <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
          </div>
          <p className="text-[13.5px] sm:text-[14px] font-medium leading-snug text-ui-content-secondary">
            {isBn
              ? 'কাছাকাছি এলাকার প্রতিবেদন আগে দেখতে লোকেশন চালু করুন।'
              : 'Turn on location to see nearby reports first.'}
          </p>
        </div>

        <div className="w-full sm:w-auto shrink-0 flex justify-end">
          <Button
            id="location-reminder-turn-on-btn"
            variant="secondary"
            size="sm"
            onClick={() => openLocationConsent('browse')}
            className="w-full sm:w-auto min-h-[44px] text-[13.5px] font-semibold"
          >
            {isBn ? 'লোকেশন চালু করুন' : 'Turn on location'}
          </Button>
        </div>
      </div>
    </aside>
  );
};
