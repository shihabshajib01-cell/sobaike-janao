import React from 'react';
import { useApp } from '../../context/AppContext';
import { TextSizePreference, useTextSize } from '../../context/TextSizeContext';

interface TextSizeSelectorProps {
  variant?: 'compact' | 'segmented';
  className?: string;
  idPrefix?: string;
}

export const TextSizeSelector: React.FC<TextSizeSelectorProps> = ({
  variant = 'segmented',
  className = '',
  idPrefix = 'text-size',
}) => {
  const { language } = useApp();
  const { textSize, setTextSize } = useTextSize();

  const options: Array<{
    id: TextSizePreference;
    labelBn: string;
    labelEn: string;
    shortLabel: string;
  }> = [
    { id: 'smaller', labelBn: 'ছোট', labelEn: 'Smaller', shortLabel: 'A−' },
    { id: 'default', labelBn: 'স্বাভাবিক', labelEn: 'Default', shortLabel: 'A' },
    { id: 'larger', labelBn: 'বড়', labelEn: 'Larger', shortLabel: 'A+' },
  ];

  if (variant === 'compact') {
    return (
      <div
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 type-compact ui-radius-control border border-ui-stroke-subtle bg-ui-surface min-h-[44px] ${className}`}
      >
        <span className="font-[var(--font-weight-medium)] text-ui-content-secondary">
          {language === 'bn' ? 'লেখার আকার' : 'Text size'}
        </span>
        <div
          className="flex items-center gap-1"
          role="group"
          aria-label={language === 'bn' ? 'লেখার আকার নির্বাচন' : 'Select text size'}
        >
          {options.map((option) => {
            const isSelected = textSize === option.id;
            return (
              <button
                key={option.id}
                id={`${idPrefix}-${option.id}`}
                type="button"
                aria-pressed={isSelected}
                aria-label={language === 'bn' ? option.labelBn : option.labelEn}
                onClick={() => setTextSize(option.id)}
                className={`min-w-[36px] min-h-[36px] px-2 ui-radius-badge-md type-compact font-[var(--font-weight-semibold)] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                  isSelected
                    ? 'bg-ui-surface-subtle text-ui-content-primary border border-ui-stroke-default'
                    : 'text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface-subtle border border-transparent'
                }`}
              >
                {option.shortLabel}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center p-1 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-[var(--radius-card)] gap-1 ${className}`}
      role="group"
      aria-label={language === 'bn' ? 'লেখার আকার' : 'Text size'}
    >
      {options.map((option) => {
        const isSelected = textSize === option.id;
        return (
          <button
            key={option.id}
            id={`${idPrefix}-${option.id}`}
            type="button"
            aria-pressed={isSelected}
            onClick={() => setTextSize(option.id)}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 px-2 rounded-[var(--radius-control)] type-label font-[var(--font-weight-medium)] transition-colors cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              isSelected
                ? 'bg-ui-surface text-ui-content-primary font-[var(--font-weight-bold)] shadow-[var(--elevation-2xs)] border border-ui-stroke-subtle'
                : 'text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface/50'
            }`}
          >
            <span className="shrink-0" aria-hidden="true">{option.shortLabel}</span>
            <span className="truncate">
              {language === 'bn' ? option.labelBn : option.labelEn}
            </span>
          </button>
        );
      })}
    </div>
  );
};
