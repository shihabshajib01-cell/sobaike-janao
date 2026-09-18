import React from 'react';
import { FormField } from './FormField';
import { FORM_TEXTAREA_BASE, formControlStateClass, formFieldIds, joinFormClasses } from './formSystem';

export interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  fieldClassName?: string;
}

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ id, label, helperText, error, required, className = '', fieldClassName = '', ...props }, ref) => {
    if (!id) throw new Error('TextAreaField requires a stable id');
    const { helperId, errorId } = formFieldIds(id);

    return (
      <FormField
        id={id}
        label={label}
        helperText={helperText}
        error={error}
        required={Boolean(required)}
        className={fieldClassName}
      >
        <textarea
          {...props}
          ref={ref}
          id={id}
          required={required}
          aria-required={required ? 'true' : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : props['aria-describedby']}
          className={joinFormClasses(FORM_TEXTAREA_BASE, formControlStateClass(Boolean(error)), className)}
        />
      </FormField>
    );
  }
);

TextAreaField.displayName = 'TextAreaField';
