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
  groupLabel?: boolean;
  labelAction?: React.ReactNode;
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
  groupLabel = false,
  labelAction,
}) => {
  const { helperId, errorId, labelId } = formFieldIds(id);

  const labelNode = label ? (
    groupLabel ? (
      <div id={labelId} className={`block ${labelClassName}`}>
        {label}
        {required ? (
          <span className="text-role-validation ml-1" aria-hidden="true">
            *
          </span>
        ) : null}
      </div>
    ) : (
      <label id={labelId} htmlFor={id} className={`block ${labelClassName}`}>
        {label}
        {required ? (
          <span className="text-role-validation ml-1" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
    )
  ) : null;

  return (
    <div className={`w-full min-w-0 text-left space-y-1.5 ${className}`}>
      {labelAction ? (
        <div className="flex items-start justify-between gap-3">
          {labelNode}
          <div className="ml-auto -my-2 shrink-0">{labelAction}</div>
        </div>
      ) : (
        labelNode
      )}

      {children}

      {helperText ? (
        <div id={helperId} className="type-helper text-role-on-surface-muted">
          {helperText}
        </div>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="type-helper text-ui-error-text font-[var(--font-weight-medium)]">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default FormField;
