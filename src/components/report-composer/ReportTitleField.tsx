import React from 'react';
import { TextField } from '../ui/TextField';

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

  return (
    <TextField
      id="complaint-title-input"
      type="text"
      required
      maxLength={REPORT_TITLE_MAX_LENGTH}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      label={language === 'bn' ? 'প্রতিবেদনের শিরোনাম' : 'Report title'}
      placeholder={
        language === 'bn'
          ? 'ঘটনাটি সংক্ষেপে একটি শিরোনামে লিখুন'
          : 'Write a short headline for the incident'
      }
      error={error}
      helperText={
        <div className="flex items-start justify-between gap-3">
          <span>{language === 'bn' ? 'সর্বোচ্চ ১০০ অক্ষর' : 'Maximum 100 characters'}</span>
          <span className="ml-auto shrink-0 type-meta tabular-nums">
            {currentLength} / {REPORT_TITLE_MAX_LENGTH}
          </span>
        </div>
      }
    />
  );
};

export default ReportTitleField;
