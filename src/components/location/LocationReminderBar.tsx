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
      <article
        id="location-reminder-bar"
        className="w-full bg-ui-surface border border-ui-stroke-subtle rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-6 shadow-2xs hover:shadow-xs transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 md:gap-6"
      >
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-ui-surface-subtle flex items-center justify-center shrink-0 border border-ui-stroke-subtle text-ui-content-secondary mt-0.5">
            <MapPin className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
          </div>
          
          <div className="flex flex-col gap-1 sm:gap-1.5 flex-1 min-w-0">
            <h3 className="text-[16px] sm:text-[17px] md:text-[20px] leading-[1.38] sm:leading-[1.4] md:leading-[30px] font-bold md:font-semibold text-ui-content-primary line-clamp-2 break-words">
              {isBn ? 'আপনার এলাকার প্রতিবেদন আগে দেখুন' : 'See reports from your area first'}
            </h3>
            <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-[1.5] sm:leading-[1.55] md:leading-[26px] text-ui-content-secondary break-words">
              {isBn
                ? 'লোকেশন চালু করলে আপনার কাছাকাছি এলাকার প্রতিবেদনগুলো আগে দেখানো হবে।'
                : 'Turning on location will show reports from your nearby area first.'}
            </p>
          </div>
        </div>
        
        <div className="w-full sm:w-auto shrink-0 flex sm:justify-end pl-11 sm:pl-0 mt-2 sm:mt-0">
          <Button
            id="location-reminder-turn-on-btn"
            variant="secondary"
            size="sm"
            onClick={() => openLocationConsent('browse')}
            className="w-full sm:w-auto min-h-[44px] text-[13.5px] sm:text-[14px] font-semibold"
          >
            {isBn ? 'লোকেশন চালু করুন' : 'Turn on location'}
          </Button>
        </div>
      </article>
    </aside>
  );
};
