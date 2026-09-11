import React from 'react';
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

  const getSegmentStyles = (sec: SectionKey) => {
    switch (sec) {
      case 'harassment':
        return {
          bg: 'var(--sec-harassment-bg)',
          color: 'var(--sec-harassment-text)',
          border: 'var(--sec-harassment-border)',
        };
      case 'rickshaw':
        return {
          bg: 'var(--sec-rickshaw-bg)',
          color: 'var(--sec-rickshaw-text)',
          border: 'var(--sec-rickshaw-border)',
        };
      case 'extortion':
        return {
          bg: 'var(--sec-extortion-bg)',
          color: 'var(--sec-extortion-text)',
          border: 'var(--sec-extortion-border)',
        };
      case 'load_shedding':
        return {
          bg: 'var(--sec-load_shedding-bg)',
          color: 'var(--sec-load_shedding-text)',
          border: 'var(--sec-load_shedding-border)',
        };
    }
  };

  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="border-b border-ui-stroke-subtle bg-ui-surface sticky top-0 z-20">
      {/* Main Title Bar */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3.5 md:py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-[20px] font-bold text-ui-content-primary leading-tight">
                {language === 'bn' ? 'প্রতিবেদন জমা দিন' : 'Submit a report'}
              </h2>

              {segment && (
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-semibold border"
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

            <p className="text-[13px] sm:text-[14px] text-ui-content-muted leading-tight mt-1">
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
          className="text-ui-content-muted min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
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
              className={`flex items-center justify-center w-full gap-1.5 sm:gap-2 px-1.5 sm:px-2 md:px-3.5 py-2 rounded-xl text-[12px] sm:text-[13px] md:text-[14px] font-medium transition-all whitespace-nowrap cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                isCurrent
                  ? 'bg-ui-accent text-ui-content-inverse font-bold shadow-2xs'
                  : isCompleted
                  ? 'bg-ui-accent-soft text-ui-content-primary border font-semibold'
                  : 'bg-ui-surface-subtle text-ui-content-secondary border border-ui-stroke-subtle disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <span
                className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 rounded-full flex items-center justify-center text-[11px] sm:text-[12px] font-bold ${
                  isCurrent
                    ? 'bg-ui-content-inverse/25 text-ui-content-inverse'
                    : isCompleted
                    ? 'bg-ui-accent text-ui-content-inverse'
                    : 'bg-ui-surface text-ui-content-muted border border-ui-stroke-subtle'
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
