import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  labelClassName?: string;
  descriptionId?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, label, description, descriptionId, checked, disabled, className = '', labelClassName = 'type-label text-role-on-surface', onChange, ...props }, ref) => {
    const checkboxId = id || (typeof label === 'string' ? `cb-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <label
        htmlFor={checkboxId}
        className={`inline-flex items-start gap-3 cursor-pointer select-none text-left min-h-[44px] py-1 ${
          disabled ? 'cursor-not-allowed' : ''
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
          <div className={`w-5 h-5 rounded-[var(--radius-badge-md)] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-role-focus peer-focus-visible:ring-offset-1 flex items-center justify-center ${
            disabled
              ? 'bg-role-disabled-container border-role-outline-subtle'
              : checked
                ? 'bg-role-primary border-role-primary'
                : 'border-role-control-outline bg-role-surface'
          }`}>
            {checked && (
              <Check
                className={`w-3.5 h-3.5 stroke-[2.5] ${
                  disabled ? 'text-role-on-disabled' : 'text-role-on-primary'
                }`}
              />
            )}
          </div>
        </div>
        {(label || description) && (
          <span className="block">
            {label && <span className={`block ${labelClassName}`}>{label}</span>}
            {description && (
              <span
                id={descriptionId}
                className={`block type-helper mt-0.5 ${
                  disabled ? 'text-role-on-disabled' : 'text-role-on-surface-muted'
                }`}
              >
                {description}
              </span>
            )}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
