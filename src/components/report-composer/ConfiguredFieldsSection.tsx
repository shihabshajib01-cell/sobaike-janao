import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { PublicReportingField, PublicReportingForm } from '../../services/reportingFormConfig';

export interface ConfiguredFieldsHandle {
  validateAndProceed: () => boolean;
}

interface ConfiguredFieldsSectionProps {
  form: PublicReportingForm | null;
  language: 'bn' | 'en';
  answers: Record<string, unknown>;
  onChange: (answers: Record<string, unknown>) => void;
}

const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'boolean') return false;
  return String(value).trim() === '';
};

const getLabel = (field: PublicReportingField, language: 'bn' | 'en') =>
  language === 'bn' ? field.labelBn : field.labelEn;

export const ConfiguredFieldsSection = forwardRef<
  ConfiguredFieldsHandle,
  ConfiguredFieldsSectionProps
>(({ form, language, answers, onChange }, ref) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fields =
    form?.engineMode === 'schema'
      ? form.fields
          .filter((field) => field.active && field.storageMode === 'custom_json')
          .sort((a, b) => a.sortOrder - b.sortOrder)
      : [];

  const setAnswer = (key: string, value: unknown) => {
    onChange({ ...answers, [key]: value });
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: '' }));
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    for (const field of fields) {
      const value = answers[field.storageKey];

      if (field.required && isEmpty(value)) {
        next[field.storageKey] =
          language === 'bn' ? 'এই তথ্যটি আবশ্যক।' : 'This field is required.';
        continue;
      }

      if (isEmpty(value)) continue;

      const maxLength = Number(field.validation?.maxLength || 0);
      if (
        maxLength > 0 &&
        typeof value === 'string' &&
        value.length > maxLength
      ) {
        next[field.storageKey] =
          language === 'bn'
            ? `সর্বোচ্চ ${maxLength} অক্ষর লিখুন।`
            : `Use at most ${maxLength} characters.`;
      }

      if (field.fieldType === 'number' || field.fieldType === 'currency') {
        const numberValue = Number(value);
        if (!Number.isFinite(numberValue)) {
          next[field.storageKey] =
            language === 'bn' ? 'সঠিক সংখ্যা লিখুন।' : 'Enter a valid number.';
          continue;
        }
        if (
          field.validation?.min !== undefined &&
          numberValue < Number(field.validation.min)
        ) {
          next[field.storageKey] =
            language === 'bn'
              ? `সর্বনিম্ন মান ${field.validation.min}।`
              : `Minimum value is ${field.validation.min}.`;
        }
        if (
          field.validation?.max !== undefined &&
          numberValue > Number(field.validation.max)
        ) {
          next[field.storageKey] =
            language === 'bn'
              ? `সর্বোচ্চ মান ${field.validation.max}।`
              : `Maximum value is ${field.validation.max}.`;
        }
      }
    }

    setErrors(next);
    const firstKey = Object.keys(next)[0];
    if (firstKey) {
      window.requestAnimationFrame(() => {
        document.getElementById(`configured-field-${firstKey}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    }
    return Object.keys(next).length === 0;
  };

  useImperativeHandle(ref, () => ({ validateAndProceed: validate }));

  if (fields.length === 0) return null;

  return (
    <section
      id="composer-section-configured-fields"
      className="space-y-4 rounded-[var(--radius-card)] border border-ui-stroke-subtle bg-ui-surface p-4 md:p-5"
    >
      <div className="space-y-1 text-left">
        <h3 className="type-h3 font-[var(--font-weight-bold)] text-ui-content-primary">
          {language === 'bn' ? 'অতিরিক্ত তথ্য' : 'Additional information'}
        </h3>
        <p className="type-compact text-ui-content-secondary">
          {language === 'bn'
            ? 'এই অভিযোগের ধরন অনুযায়ী প্রয়োজনীয় অতিরিক্ত তথ্য দিন।'
            : 'Provide the additional information configured for this complaint type.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const key = field.storageKey;
          const value = answers[key];
          const label = getLabel(field, language);
          const helper = language === 'bn' ? field.helperBn : field.helperEn;
          const placeholder =
            language === 'bn' ? field.placeholderBn : field.placeholderEn;
          const error = errors[key];
          const commonInputClass =
            'w-full min-h-[44px] rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface px-3 py-2 type-body text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus';

          return (
            <div
              key={field.fieldKey}
              id={`configured-field-${key}`}
              className={
                field.fieldType === 'textarea' || field.fieldType === 'multiselect'
                  ? 'space-y-1.5 sm:col-span-2'
                  : 'space-y-1.5'
              }
            >
              <label
                htmlFor={`configured-input-${key}`}
                className="type-compact font-[var(--font-weight-semibold)] text-ui-content-primary"
              >
                {label}
                {field.required ? ' *' : ''}
              </label>

              {field.fieldType === 'textarea' ? (
                <textarea
                  id={`configured-input-${key}`}
                  rows={4}
                  value={String(value ?? '')}
                  placeholder={placeholder}
                  onChange={(event) => setAnswer(key, event.target.value)}
                  className={`${commonInputClass} resize-y`}
                />
              ) : field.fieldType === 'select' ? (
                <select
                  id={`configured-input-${key}`}
                  value={String(value ?? '')}
                  onChange={(event) => setAnswer(key, event.target.value)}
                  className={commonInputClass}
                >
                  <option value="">
                    {language === 'bn' ? 'নির্বাচন করুন' : 'Select'}
                  </option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {language === 'bn' ? option.labelBn : option.labelEn}
                    </option>
                  ))}
                </select>
              ) : field.fieldType === 'radio' ? (
                <div
                  role="radiogroup"
                  aria-label={label}
                  className="flex flex-wrap gap-2"
                >
                  {field.options.map((option) => (
                    <label
                      key={option.value}
                      className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface px-3 py-2 type-compact text-ui-content-primary"
                    >
                      <input
                        type="radio"
                        name={`configured-${key}`}
                        value={option.value}
                        checked={value === option.value}
                        onChange={() => setAnswer(key, option.value)}
                      />
                      {language === 'bn' ? option.labelBn : option.labelEn}
                    </label>
                  ))}
                </div>
              ) : field.fieldType === 'checkbox' ? (
                <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface px-3 py-2 type-compact text-ui-content-primary">
                  <input
                    id={`configured-input-${key}`}
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(event) => setAnswer(key, event.target.checked)}
                  />
                  {helper || label}
                </label>
              ) : field.fieldType === 'multiselect' ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {field.options.map((option) => {
                    const selected = Array.isArray(value)
                      ? value.includes(option.value)
                      : false;
                    return (
                      <label
                        key={option.value}
                        className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface px-3 py-2 type-compact text-ui-content-primary"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(event) => {
                            const current = Array.isArray(value)
                              ? [...value]
                              : [];
                            const next = event.target.checked
                              ? [...current, option.value]
                              : current.filter((item) => item !== option.value);
                            setAnswer(key, next);
                          }}
                        />
                        {language === 'bn' ? option.labelBn : option.labelEn}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <input
                  id={`configured-input-${key}`}
                  type={
                    field.fieldType === 'currency' || field.fieldType === 'number'
                      ? 'number'
                      : field.fieldType === 'phone'
                        ? 'tel'
                        : field.fieldType === 'url'
                          ? 'url'
                          : field.fieldType === 'email'
                            ? 'email'
                            : field.fieldType
                  }
                  value={String(value ?? '')}
                  placeholder={placeholder}
                  min={
                    field.validation?.min !== undefined
                      ? Number(field.validation.min)
                      : undefined
                  }
                  max={
                    field.validation?.max !== undefined
                      ? Number(field.validation.max)
                      : undefined
                  }
                  maxLength={
                    field.validation?.maxLength !== undefined
                      ? Number(field.validation.maxLength)
                      : undefined
                  }
                  onChange={(event) =>
                    setAnswer(
                      key,
                      field.fieldType === 'number' || field.fieldType === 'currency'
                        ? event.target.value
                        : event.target.value
                    )
                  }
                  className={commonInputClass}
                />
              )}

              {field.fieldType !== 'checkbox' && helper && (
                <p className="type-compact text-ui-content-muted">{helper}</p>
              )}
              {error && (
                <p role="alert" className="type-compact text-ui-error-text">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
});

ConfiguredFieldsSection.displayName = 'ConfiguredFieldsSection';

export default ConfiguredFieldsSection;
