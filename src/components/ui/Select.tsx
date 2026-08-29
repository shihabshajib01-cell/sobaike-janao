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
          <label htmlFor={selectId} className="block text-[16px] leading-[24px] font-medium text-primary mb-1.5">
            {label}
            {required && <span className="text-red-600 dark:text-red-400 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            className={`w-full appearance-none text-[16px] leading-[24px] min-h-[44px] bg-surface text-primary border rounded-xl pl-3.5 pr-10 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-[var(--ui-accent)] disabled:bg-surface-subtle disabled:text-muted disabled:cursor-not-allowed ${
              error
                ? 'border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500'
                : 'border-theme hover:border-strong'
            } ${className}`}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-surface text-primary">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-[14px] leading-[20px] text-red-600 dark:text-red-400 font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${selectId}-helper`} className="mt-1.5 text-[14px] leading-[20px] text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
