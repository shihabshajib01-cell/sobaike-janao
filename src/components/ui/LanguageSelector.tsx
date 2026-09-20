import React from 'react';
import { useApp } from '../../context/AppContext';

interface LanguageSelectorProps {
  variant?: 'compact' | 'segmented';
  className?: string;
  idPrefix?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'segmented',
  className = '',
  idPrefix = 'language',
}) => {
  const { language, toggleLanguage } = useApp();

  const options = [
    { id: 'bn' as const, label: 'বাংলা' },
    { id: 'en' as const, label: 'EN' },
  ];

  if (variant === 'compact') {
    return (
      <div
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 type-compact ui-radius-control border border-ui-stroke-subtle bg-ui-surface min-h-[44px] ${className}`}
      >
        <p className="font-[var(--font-weight-medium)] text-ui-content-primary">
          {language === 'bn' ? 'ভাষা' : 'Language'}
        </p>

        <div
          className="flex items-center gap-0.5 p-0.5 bg-ui-surface-subtle border border-ui-stroke-subtle ui-radius-control"
          role="group"
          aria-label={language === 'bn' ? 'ভাষা নির্বাচন' : 'Select language'}
        >
          {options.map((option) => {
            const isSelected = language === option.id;
            return (
              <button
                key={option.id}
                id={`${idPrefix}-${option.id}`}
                type="button"
                aria-pressed={isSelected}
                onClick={() => !isSelected && toggleLanguage()}
                className={`min-w-[46px] min-h-[34px] px-2.5 ui-radius-badge-md type-compact font-[var(--font-weight-semibold)] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                  isSelected
                    ? 'bg-ui-selected-bg text-ui-selected-text border border-ui-selected-border shadow-[var(--elevation-2xs)]'
                    : 'text-ui-content-secondary border border-transparent hover:text-ui-content-primary hover:bg-ui-surface/50'
                }`}
              >
                {option.label}
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
      aria-label={language === 'bn' ? 'ভাষা নির্বাচন' : 'Select language'}
    >
      {options.map((option) => {
        const isSelected = language === option.id;
        return (
          <button
            key={option.id}
            id={`${idPrefix}-${option.id}`}
            type="button"
            aria-pressed={isSelected}
            onClick={() => !isSelected && toggleLanguage()}
            className={`flex-1 min-w-0 min-h-[44px] px-3 rounded-[var(--radius-control)] type-label font-[var(--font-weight-medium)] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              isSelected
                ? 'bg-ui-selected-bg text-ui-selected-text font-[var(--font-weight-bold)] shadow-[var(--elevation-2xs)] border border-ui-selected-border'
                : 'text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface/50 border border-transparent'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
