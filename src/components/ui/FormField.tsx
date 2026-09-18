import React from 'react';
import { formFieldIds } from './formSystem';

export interface FormFieldProps {
  id: string;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  helperText,
  error,
  required = false,
  children,
  className = '',
  labelClassName = 'type-label text-role-on-surface',
}) => {
  const { helperId, errorId, labelId } = formFieldIds(id);

  return (
    <div className={`w-full text-left space-y-1.5 ${className}`}>
      {label ? (
        <label id={labelId} htmlFor={id} className={`block ${labelClassName}`}>
          {label}
          {required ? (
            <span className="text-role-validation ml-1" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {children}

      {error ? (
        <p id={errorId} role="alert" className="type-helper text-role-validation font-[var(--font-weight-medium)]">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="type-helper text-role-on-surface-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default FormField;
