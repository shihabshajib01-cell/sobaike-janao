import React from 'react';
import { MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { VisitorSessionService } from '../../services/visitorSessionService';

export interface LocationReminderBarProps {
  isFirstVisitNoticeOpen?: boolean;
}

/**
 * LocationReminderBar
 * One-time inline reminder shown only until the visitor makes an explicit
 * location choice. Refreshing the page must not nag returning visitors.
 * Reuses existing LocationConsentModal in 'browse' purpose.
 */
export const LocationReminderBar: React.FC<LocationReminderBarProps> = ({
  isFirstVisitNoticeOpen = false,
}) => {
  const {
    language,
    browseLocationStatus,
    browseLocation,
    openLocationConsent,
    isLocationModalOpen,
  } = useApp();

  // The reminder is only for visitors who have never answered the location
  // prompt. Once they grant, deny, or choose "Not now", that decision is
  // persisted and refreshes must not show the reminder again.
  const locationChoice = VisitorSessionService.getLocationChoice();
  const hasBrowseLocation =
    browseLocationStatus === 'available' && Boolean(browseLocation);
  const hasAnsweredLocationPrompt = locationChoice !== null;

  if (
    isFirstVisitNoticeOpen ||
    isLocationModalOpen ||
    hasBrowseLocation ||
    hasAnsweredLocationPrompt
  ) {
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
        className="w-full bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-card)] p-3 sm:p-3.5 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[var(--elevation-2xs)] transition-colors"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 text-ui-content-primary">
          <div className="w-8 h-8 rounded-[var(--radius-badge-md)] bg-ui-surface-subtle flex items-center justify-center shrink-0 border border-ui-stroke-subtle text-ui-accent">
            <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
          </div>
          <p className="type-compact font-[var(--font-weight-medium)] leading-snug text-ui-content-secondary">
            {isBn
              ? 'আপনার কাছাকাছি কী ঘটছে আর আপনার এলাকার খবর দেখাতে লোকেশন চালু করুন।'
              : 'Turn on location to see what’s happening near you and reports from your area.'}
          </p>
        </div>

        <div className="w-full sm:w-auto shrink-0 flex justify-end">
          <Button
            id="location-reminder-turn-on-btn"
            variant="secondary"
            size="md"
            onClick={() => openLocationConsent('browse')}
            className="w-full sm:w-auto min-h-[44px] type-compact font-[var(--font-weight-semibold)]"
          >
            {isBn ? 'লোকেশন চালু করুন' : 'Turn on location'}
          </Button>
        </div>
      </div>
    </aside>
  );
};
