import React from 'react';
import { FormField } from './FormField';
import { formFieldIds, joinFormClasses } from './formSystem';

export interface RadioGroupOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  id: string;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  value: string;
  options: RadioGroupOption[];
  onChange: (value: string) => void;
  className?: string;
  optionClassName?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  id,
  label,
  helperText,
  error,
  required = false,
  value,
  options,
  onChange,
  className = '',
  optionClassName = '',
}) => {
  const { helperId, errorId, labelId } = formFieldIds(id);
  const describedBy = [helperText ? helperId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <FormField
      id={id}
      label={label}
      helperText={helperText}
      error={error}
      required={required}
      className={className}
      groupLabel
    >
      <div
        id={id}
        role="radiogroup"
        aria-labelledby={label ? labelId : undefined}
        aria-label={!label ? id : undefined}
        aria-required={required || undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className="grid gap-2 sm:grid-cols-2"
      >
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={joinFormClasses(
                'inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border px-3 py-2 type-body transition-colors',
                selected
                  ? 'border-role-primary bg-role-primary-container text-role-on-primary-container'
                  : 'border-role-outline bg-role-surface text-role-on-surface hover:border-role-outline-strong',
                option.disabled && 'opacity-50 cursor-not-allowed',
                optionClassName
              )}
            >
              <input
                id={optionId}
                type="radio"
                name={id}
                value={option.value}
                checked={selected}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
                className="accent-[var(--md-primary)]"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </FormField>
  );
};
