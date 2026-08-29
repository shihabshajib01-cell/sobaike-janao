import React from 'react';

export interface ToggleProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}) => {
  const toggleId = id || (typeof label === 'string' ? `toggle-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <label
      htmlFor={toggleId}
      className={`inline-flex items-start justify-between gap-4 cursor-pointer select-none min-h-[44px] py-1 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {(label || description) && (
        <div className="text-left pr-2">
          {label && <div className="text-[16px] leading-[24px] font-medium text-primary">{label}</div>}
          {description && <div className="text-[14px] leading-[20px] text-muted mt-0.5">{description}</div>}
        </div>
      )}
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:ring-offset-2 ${
          checked ? 'bg-[var(--ui-primary-action-bg)]' : 'bg-surface-subtle border border-subtle'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--ui-primary-action-text)] shadow-xs ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0 bg-[var(--ui-border-strong)]'
          }`}
        />
      </button>
    </label>
  );
};
