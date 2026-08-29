import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, label, description, checked, disabled, className = '', onChange, ...props }, ref) => {
    const checkboxId = id || (typeof label === 'string' ? `cb-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <label
        htmlFor={checkboxId}
        className={`inline-flex items-start gap-3 cursor-pointer select-none text-left min-h-[44px] py-1 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
      >
        <div className="relative flex items-center justify-center mt-0.5 shrink-0">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <div className="w-5 h-5 rounded-lg border border-theme bg-surface transition-colors peer-checked:bg-[var(--ui-primary-action-bg)] peer-checked:border-[var(--ui-primary-action-bg)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ui-focus)] peer-focus-visible:ring-offset-1 flex items-center justify-center">
            {checked && <Check className="w-3.5 h-3.5 text-[var(--ui-primary-action-text)] stroke-[2.5]" />}
          </div>
        </div>
        {(label || description) && (
          <div>
            {label && <div className="text-[16px] leading-[24px] font-medium text-primary">{label}</div>}
            {description && <div className="text-[14px] leading-[20px] text-muted mt-0.5">{description}</div>}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
