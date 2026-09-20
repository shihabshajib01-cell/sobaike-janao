import React from 'react';
import { Calendar } from 'lucide-react';
import { FormField } from './FormField';
import { FORM_CONTROL_BASE, formFieldIds, joinFormClasses } from './formSystem';
import type { TextFieldProps } from './TextField';

export interface DateFieldProps extends Omit<TextFieldProps, 'type'> {
  language?: 'bn' | 'en';
}

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const localizeDigits = (value: string, language: 'bn' | 'en') =>
  language === 'bn' ? value.replace(/\d/g, (digit) => BANGLA_DIGITS[Number(digit)]) : value;

const formatDateValue = (value: string, language: 'bn' | 'en') => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return localizeDigits(value, language);

  return localizeDigits(`${match[3]}/${match[2]}/${match[1]}`, language);
};

export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      required,
      disabled,
      className = '',
      fieldClassName = '',
      language = 'bn',
      placeholder,
      value,
      ...props
    },
    ref
  ) => {
    if (!id) throw new Error('DateField requires a stable id');

    const { helperId, errorId } = formFieldIds(id);
    const describedBy = [
      props['aria-describedby'],
      helperText ? helperId : undefined,
      error ? errorId : undefined,
    ].filter(Boolean).join(' ') || undefined;
    const rawValue = typeof value === 'string' ? value : '';
    const displayValue =
      rawValue ||
      placeholder ||
      (language === 'bn' ? 'দিন/মাস/বছর' : 'DD/MM/YYYY');

    return (
      <FormField
        id={id}
        label={label}
        helperText={helperText}
        error={error}
        required={Boolean(required)}
        className={fieldClassName}
      >
        <div
          className={joinFormClasses(
            FORM_CONTROL_BASE,
            'relative flex items-center justify-between gap-3 overflow-hidden',
            error
              ? 'border-role-validation-outline focus-within:ring-2 focus-within:ring-role-validation-focus focus-within:border-role-validation-focus'
              : 'border-role-control-outline hover:border-role-control-outline-hover focus-within:ring-2 focus-within:ring-role-focus focus-within:border-role-focus',
            disabled && 'bg-role-disabled-container text-role-on-disabled cursor-not-allowed',
            className
          )}
        >
          <p
            className={joinFormClasses(
              'min-w-0 flex-1 truncate type-input',
              rawValue ? 'text-role-on-surface' : 'text-role-on-surface-muted'
            )}
            aria-hidden="true"
          >
            {rawValue ? formatDateValue(rawValue, language) : displayValue}
          </p>
          <Calendar
            className="pointer-events-none h-4 w-4 shrink-0 text-role-on-surface-muted"
            aria-hidden="true"
          />
          <input
            {...props}
            ref={ref}
            id={id}
            type="date"
            lang={language === 'bn' ? 'bn-BD' : 'en-GB'}
            value={value}
            required={required}
            disabled={disabled}
            aria-required={required ? 'true' : undefined}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
        </div>
      </FormField>
    );
  }
);

DateField.displayName = 'DateField';
