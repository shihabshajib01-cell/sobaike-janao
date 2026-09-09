import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ id, label, helperText, error, options, placeholder, required, disabled, className = '', ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full text-left">
        {label && (
          <label htmlFor={selectId} className="block type-label text-ui-content-primary mb-1.5">
            {label}
            {required && <span className="text-ui-validation-text ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            className={`w-full appearance-none min-h-[44px] bg-ui-surface text-ui-content-primary ui-border-default ui-radius-control ui-space-select transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] disabled:bg-ui-surface-subtle disabled:text-ui-content-muted disabled:cursor-not-allowed ${
              error
                ? 'border-ui-validation-border focus:ring-ui-validation-focus focus:border-ui-validation-focus'
                : 'border-ui-stroke-default hover:border-ui-stroke-strong'
            } ${className}`}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-ui-surface text-ui-content-primary">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-ui-content-muted">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 type-helper text-ui-validation-text font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${selectId}-helper`} className="mt-1.5 type-helper text-ui-content-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
