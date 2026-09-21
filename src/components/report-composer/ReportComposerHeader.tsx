import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { SectionKey } from '../../theme/tokens';
import { useTaxonomy } from '../../services/taxonomyService';
import { IconButton } from '../ui/IconButton';
import { CategoryIcon } from '../branding/CategoryIcon';

export interface ReportComposerHeaderProps {
  currentStep: number;
  segment: SectionKey | null;
  language: 'bn' | 'en';
  onClose: () => void;
}

export const ReportComposerHeader: React.FC<ReportComposerHeaderProps> = ({
  currentStep,
  segment,
  language,
  onClose,
}) => {
  const { getSegment } = useTaxonomy();
  const segmentInfo = segment ? getSegment(segment) : null;

  const stepTitles = [
    {
      titleBn: 'সেবা',
      titleEn: 'Service',
    },
    {
      titleBn: 'অভিযোগের ধরন',
      titleEn: 'Complaint type',
    },
    {
      titleBn: 'বিবরণ',
      titleEn: 'Details',
    },
    {
      titleBn: 'পর্যালোচনা',
      titleEn: 'Review',
    },
  ];

  const currentStepInfo = stepTitles[currentStep - 1] || stepTitles[0];
  const previousStepRef = useRef(currentStep);
  const sectionStatusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (previousStepRef.current === currentStep) return;
    previousStepRef.current = currentStep;
    const frame = window.requestAnimationFrame(() => {
      sectionStatusRef.current?.focus({ preventScroll: true });
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

  return (
    <div className="border-b border-ui-stroke-subtle bg-ui-surface sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 md:px-8 py-3.5 md:py-4">
        <div className="flex items-center gap-3 min-w-0">
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
                <span>
                  {language === 'bn'
                    ? segmentInfo?.shortNameBn || segment
                    : segmentInfo?.shortNameEn || segment}
                </span>
              </div>
            )}

            <p
              ref={sectionStatusRef}
              id="report-composer-section-status"
              tabIndex={-1}
              aria-live="polite"
              aria-atomic="true"
              className="sr-only focus:outline-none"
            >
              {language === 'bn' ? currentStepInfo.titleBn : currentStepInfo.titleEn}
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
    </div>
  );
};
