import React from 'react';
import { FormField } from './FormField';
import { FORM_CONTROL_BASE, formControlStateClass, formFieldIds, joinFormClasses } from './formSystem';

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  fieldClassName?: string;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ id, label, helperText, error, required, className = '', fieldClassName = '', ...props }, ref) => {
    if (!id) throw new Error('TextField requires a stable id');
    const { helperId, errorId } = formFieldIds(id);
    const describedBy = [
      props['aria-describedby'],
      helperText ? helperId : undefined,
      error ? errorId : undefined,
    ].filter(Boolean).join(' ') || undefined;

    return (
      <FormField
        id={id}
        label={label}
        helperText={helperText}
        error={error}
        required={Boolean(required)}
        className={fieldClassName}
      >
        <input
          {...props}
          ref={ref}
          id={id}
          required={required}
          aria-required={required ? 'true' : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={joinFormClasses(FORM_CONTROL_BASE, formControlStateClass(Boolean(error)), className)}
        />
      </FormField>
    );
  }
);

TextField.displayName = 'TextField';
