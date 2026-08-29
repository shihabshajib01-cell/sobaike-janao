import React from 'react';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  id?: string;
  name: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  options: RadioOption[];
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  id,
  name,
  label,
  value,
  defaultValue,
  options,
  onChange,
  disabled,
  className = '',
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || options[0]?.value);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (optValue: string) => {
    if (!isControlled) {
      setInternalValue(optValue);
    }
    onChange?.(optValue);
  };

  return (
    <fieldset id={id} className={`w-full text-left ${className}`} disabled={disabled}>
      {label && <legend className="block text-[16px] leading-[24px] font-medium text-primary mb-2">{label}</legend>}
      <div className="space-y-2.5">
        {options.map((opt) => {
          const optId = `${name}-${opt.value}`;
          const isChecked = currentValue === opt.value;
          const isOptDisabled = disabled || opt.disabled;

          return (
            <label
              key={opt.value}
              htmlFor={optId}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none min-h-[48px] ${
                isChecked
                  ? 'border-[var(--ui-primary-action-bg)] bg-surface-elevated shadow-2xs'
                  : 'border-subtle bg-surface hover:border-theme'
              } ${isOptDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                <input
                  id={optId}
                  type="radio"
                  name={name}
                  value={opt.value}
                  checked={isChecked}
                  disabled={isOptDisabled}
                  onChange={() => handleChange(opt.value)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 rounded-full border border-theme bg-surface transition-colors peer-checked:border-[var(--ui-primary-action-bg)] flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ui-focus)] peer-focus-visible:ring-offset-1">
                  {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-[var(--ui-primary-action-bg)]" />}
                </div>
              </div>
              <div>
                <div className="text-[16px] leading-[24px] font-medium text-primary">{opt.label}</div>
                {opt.description && (
                  <div className="text-[14px] leading-[20px] text-muted mt-0.5">{opt.description}</div>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
