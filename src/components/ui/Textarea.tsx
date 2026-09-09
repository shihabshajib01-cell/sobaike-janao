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
            <label htmlFor={textareaId} className="block type-label text-ui-content-primary">
              {label}
              {required && <span className="text-red-600 dark:text-red-400 ml-1" aria-hidden="true">*</span>}
            </label>
            {maxCharacters && (
              <span className="type-compact text-ui-content-muted">
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
          className={`w-full bg-ui-surface text-ui-content-primary placeholder:text-ui-content-muted ui-border-default ui-radius-control ui-space-textarea transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] disabled:bg-ui-surface-subtle disabled:text-ui-content-muted disabled:cursor-not-allowed ${
            error
              ? 'border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500'
              : 'border-ui-stroke-default hover:border-ui-stroke-strong'
          } ${className}`}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1.5 type-helper text-red-600 dark:text-red-400 font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-helper`} className="mt-1.5 type-helper text-ui-content-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
