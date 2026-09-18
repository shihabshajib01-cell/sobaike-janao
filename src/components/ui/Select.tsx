import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { FormField } from './FormField';
import { formControlStateClass, formFieldIds, joinFormClasses } from './formSystem';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  options: SelectOption[];
  placeholder?: string;
  fieldClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      options,
      placeholder,
      required,
      disabled,
      className = '',
      fieldClassName = '',
      ...props
    },
    ref
  ) => {
    const generatedId = useId().replace(/:/g, '');
    const selectId =
      id ||
      (typeof label === 'string'
        ? `select-${label.toLowerCase().replace(/\s+/g, '-')}`
        : `select-${generatedId}`);
    const { helperId, errorId } = formFieldIds(selectId);

    return (
      <FormField
        id={selectId}
        label={label}
        helperText={helperText}
        error={error}
        required={Boolean(required)}
        className={fieldClassName}
      >
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            required={required}
            aria-required={required ? 'true' : undefined}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : props['aria-describedby']}
            className={joinFormClasses(
              'w-full appearance-none min-h-[44px] bg-role-surface text-role-on-surface ui-border-default ui-radius-control ui-space-select type-body transition-colors focus:outline-none focus:ring-2 disabled:bg-role-surface-subtle disabled:text-role-on-surface-muted disabled:cursor-not-allowed',
              formControlStateClass(Boolean(error)),
              className
            )}
            {...props}
          >
            {placeholder ? <option value="">{placeholder}</option> : null}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="bg-role-surface text-role-on-surface"
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-role-on-surface-muted"
            aria-hidden="true"
          />
        </div>
      </FormField>
    );
  }
);

Select.displayName = 'Select';
