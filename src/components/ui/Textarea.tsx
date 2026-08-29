import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  maxCharacters?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id, label, helperText, error, maxCharacters, required, disabled, value, defaultValue, onChange, className = '', rows = 4, ...props }, ref) => {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const [charCount, setCharCount] = React.useState(
      typeof value === 'string' ? value.length : typeof defaultValue === 'string' ? defaultValue.length : 0
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className="w-full text-left">
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={textareaId} className="block text-[16px] leading-[24px] font-medium text-primary">
              {label}
              {required && <span className="text-red-600 dark:text-red-400 ml-1" aria-hidden="true">*</span>}
            </label>
            {maxCharacters && (
              <span className="text-[14px] text-muted">
                {charCount}/{maxCharacters}
              </span>
            )}
          </div>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          maxLength={maxCharacters}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          className={`w-full text-[16px] leading-[24px] bg-surface text-primary placeholder:text-muted border rounded-xl p-3.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:border-[var(--ui-accent)] disabled:bg-surface-subtle disabled:text-muted disabled:cursor-not-allowed ${
            error
              ? 'border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500'
              : 'border-theme hover:border-strong'
          } ${className}`}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1.5 text-[14px] leading-[20px] text-red-600 dark:text-red-400 font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-helper`} className="mt-1.5 text-[14px] leading-[20px] text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
