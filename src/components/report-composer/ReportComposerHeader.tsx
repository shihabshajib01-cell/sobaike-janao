import React, { useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { IconButton } from '../ui/IconButton';
import { CategoryIcon } from '../branding/CategoryIcon';

export interface ReportComposerHeaderProps {
  currentStep: number;
  totalSteps: number;
  segment: SectionKey | null;
  language: 'bn' | 'en';
  onClose: () => void;
  onSelectStep?: (step: number) => void;
}

export const ReportComposerHeader: React.FC<ReportComposerHeaderProps> = ({
  currentStep,
  totalSteps,
  segment,
  language,
  onClose,
  onSelectStep,
}) => {
  const stepTitles = [
    {
      step: 1,
      shortBn: 'সেবা',
      shortEn: 'Service',
      titleBn: 'সেবা',
      titleEn: 'Service',
    },
    {
      step: 2,
      shortBn: 'ধরন',
      shortEn: 'Type',
      titleBn: 'অভিযোগের ধরন',
      titleEn: 'Complaint type',
    },
    {
      step: 3,
      shortBn: 'বিবরণ',
      shortEn: 'Details',
      titleBn: 'বিবরণ',
      titleEn: 'Details',
    },
    {
      step: 4,
      shortBn: 'যাচাই',
      shortEn: 'Review',
      titleBn: 'পর্যালোচনা',
      titleEn: 'Review',
    },
  ];

  const currentStepInfo = stepTitles[currentStep - 1] || stepTitles[0];
  const previousStepRef = useRef(currentStep);
  const stepStatusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (previousStepRef.current === currentStep) return;
    previousStepRef.current = currentStep;
    const frame = window.requestAnimationFrame(() => {
      stepStatusRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [currentStep]);

  const getSegmentStyles = (sec: SectionKey) => {
    const color = `var(--sec-${sec}-text)`;

    return {
      bg: `var(--sec-${sec}-bg)`,
      color: `color-mix(in srgb, ${color} 82%, var(--md-on-surface))`,
      border: `var(--sec-${sec}-border)`,
    };
  };

  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="border-b border-ui-stroke-subtle bg-ui-surface sticky top-0 z-20">
      {/* Main Title Bar */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3.5 md:py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="type-h3 font-[var(--font-weight-semibold)] text-ui-content-primary">
                {language === 'bn' ? 'প্রতিবেদন জমা দিন' : 'Submit a report'}
              </h2>

              {segment && (
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-pill)] type-compact font-[var(--font-weight-semibold)] border"
                  style={{
                    backgroundColor: getSegmentStyles(segment).bg,
                    color: getSegmentStyles(segment).color,
                    borderColor: getSegmentStyles(segment).border,
                  }}
                >
                  <CategoryIcon section={segment} size="xs" />
                  <span>{language === 'bn' ? SECTIONS[segment].shortNameBn : SECTIONS[segment].shortNameEn}</span>
                </div>
              )}
            </div>

            <p
              ref={stepStatusRef}
              id="report-composer-step-status"
              tabIndex={-1}
              aria-live="polite"
              aria-atomic="true"
              className="type-helper text-ui-content-secondary mt-1 focus:outline-none"
            >
              <span>
                {language === 'bn'
                  ? `ধাপ ${currentStep} / ${totalSteps}: ${currentStepInfo.titleBn}`
                  : `Step ${currentStep} of ${totalSteps}: ${currentStepInfo.titleEn}`}
              </span>
            </p>
          </div>
        </div>

        <IconButton
          id="report-composer-close-btn"
          icon={<X className="w-5 h-5" aria-hidden="true" />}
          aria-label={language === 'bn' ? 'বন্ধ করুন' : 'Close composer'}
          size="md"
          onClick={onClose}
          className="text-ui-content-secondary"
        />
      </div>

      {/* Interactive Step Indicator Chips (clickable for previous/accessible steps) */}
      <div className="px-3 sm:px-4 md:px-8 pb-3 pt-0.5 grid grid-cols-4 gap-1.5 sm:gap-2 md:gap-3 w-full">
        {stepTitles.map((st) => {
          const isCompleted = st.step < currentStep;
          const isCurrent = st.step === currentStep;
          const isAccessible = st.step <= currentStep;

          return (
            <button
              key={st.step}
              type="button"
              disabled={!isAccessible}
              aria-current={isCurrent ? 'step' : undefined}
              onClick={() => isAccessible && onSelectStep && onSelectStep(st.step)}
              className={`flex items-center justify-center w-full gap-1.5 sm:gap-2 px-1.5 sm:px-2 md:px-3.5 py-2 ui-radius-control type-helper font-[var(--font-weight-medium)] transition-colors whitespace-nowrap cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                isCurrent
                  ? 'bg-ui-accent text-ui-content-inverse font-[var(--font-weight-semibold)] ui-elevation-selected ui-border-default border-ui-accent'
                  : isCompleted
                  ? 'bg-ui-accent-soft text-ui-content-primary ui-border-default border-ui-accent-border font-[var(--font-weight-semibold)]'
                  : 'bg-ui-surface-subtle text-ui-content-muted ui-border-default border-ui-stroke-subtle disabled:cursor-not-allowed'
              }`}
            >
              <span
                className={`w-4 sm:w-5 shrink-0 flex items-center justify-center type-compact font-[var(--font-weight-bold)] ${
                  isCompleted
                    ? 'h-4 sm:h-5 rounded-[var(--radius-pill)] bg-ui-accent text-ui-content-inverse'
                    : isCurrent
                    ? 'text-ui-content-inverse'
                    : 'text-ui-content-muted'
                }`}
              >
                {isCompleted ? <Check className="w-3 h-3 text-ui-content-inverse" aria-hidden="true" /> : st.step}
              </span>
              <span className="sm:hidden truncate">{language === 'bn' ? st.shortBn : st.shortEn}</span>
              <span className="hidden sm:inline truncate">{language === 'bn' ? st.titleBn : st.titleEn}</span>
            </button>
          );
        })}
      </div>

      {/* Subtle Progress Track */}
      <div
        role="progressbar"
        aria-valuenow={progressPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={language === 'bn' ? 'ফর্ম পূরণের অগ্রগতি' : 'Form completion progress'}
        className="h-1 w-full bg-ui-surface-subtle overflow-hidden"
      >
        <div
          className="h-full bg-ui-accent transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};
