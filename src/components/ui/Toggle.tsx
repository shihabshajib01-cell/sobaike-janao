import React, { useId } from 'react';

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
  const generatedId = useId().replace(/:/g, '');
  const toggleId =
    id ||
    (typeof label === 'string'
      ? `toggle-${label.toLowerCase().replace(/\s+/g, '-')}`
      : `toggle-${generatedId}`);
  const labelId = label ? `${toggleId}-label` : undefined;
  const descriptionId = description ? `${toggleId}-description` : undefined;

  return (
    <div
      className={`inline-flex items-start justify-between gap-4 select-none min-h-[44px] py-1 ${className}`}
    >
      {(label || description) && (
        <div className="text-left pr-2">
          {label && <div id={labelId} className="type-label text-ui-content-primary">{label}</div>}
          {description && <div id={descriptionId} className="type-helper text-ui-content-muted mt-0.5">{description}</div>}
        </div>
      )}
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        aria-label={!label ? 'Toggle' : undefined}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center shrink-0 cursor-pointer rounded-[var(--radius-pill)] focus:outline-none focus:ring-2 focus:ring-ui-focus focus:ring-offset-2 disabled:cursor-not-allowed`}
      >
        <span
          aria-hidden="true"
          className={`relative inline-flex h-6 w-11 rounded-[var(--radius-pill)] border-2 border-transparent transition-colors duration-200 ease-in-out ${
            disabled
              ? 'bg-ui-disabled-bg border border-ui-stroke-subtle'
              : checked
                ? 'bg-ui-action-bg'
                : 'bg-ui-surface-subtle border border-ui-stroke-subtle'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-[var(--radius-pill)] shadow-[var(--elevation-xs)] ring-0 transition duration-200 ease-in-out ${
              disabled ? 'bg-ui-disabled-text' : 'bg-ui-action-text'
            } ${checked ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </span>
      </button>
    </div>
  );
};
