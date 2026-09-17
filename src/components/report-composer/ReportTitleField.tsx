import React from 'react';

export const REPORT_TITLE_MAX_LENGTH = 100;

export interface ReportTitleFieldProps {
  value: string;
  error?: string;
  language: 'bn' | 'en';
  onChange: (value: string) => void;
}

export const ReportTitleField: React.FC<ReportTitleFieldProps> = ({
  value,
  error,
  language,
  onChange,
}) => {
  const currentLength = value.length;
  const helpId = 'complaint-title-help';
  const errorId = 'complaint-title-error';

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="complaint-title-input"
        className="block type-label font-[var(--font-weight-bold)] text-ui-content-primary"
      >
        <span>{language === 'bn' ? 'প্রতিবেদনের শিরোনাম' : 'Report title'}</span>
        <span className="text-ui-validation-text ml-1" aria-hidden="true">
          *
        </span>
      </label>

      <input
        id="complaint-title-input"
        type="text"
        maxLength={REPORT_TITLE_MAX_LENGTH}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          language === 'bn'
            ? 'ঘটনাটি সংক্ষেপে একটি শিরোনামে লিখুন'
            : 'Write a short headline for the incident'
        }
        aria-required="true"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${errorId} ${helpId}` : helpId}
        className={`ui-control w-full px-3.5 py-2.5 bg-ui-surface border type-body text-ui-content-primary placeholder:text-ui-content-muted focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent ${
          error ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'
        }`}
      />

      <div id={helpId} className="flex items-start justify-between gap-3">
        <p className="type-helper text-ui-content-muted">
          {language === 'bn' ? 'সর্বোচ্চ ১০০ অক্ষর' : 'Maximum 100 characters'}
        </p>
        <span className="ml-auto shrink-0 type-meta tabular-nums text-ui-content-muted">
          {currentLength} / {REPORT_TITLE_MAX_LENGTH}
        </span>
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="type-helper text-ui-error-text font-[var(--font-weight-semibold)]"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default ReportTitleField;
