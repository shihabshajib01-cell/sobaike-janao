import React from 'react';
import { FormField } from './FormField';
import { FORM_CONTROL_BASE, formControlStateClass, formFieldIds, joinFormClasses } from './formSystem';
import { useBanglaPhoneticInput } from './BanglaPhonetic';

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  fieldClassName?: string;
  labelAction?: React.ReactNode;
  phonetic?: boolean;
}

const PHONETIC_BLOCKED_INPUT_MODES = new Set([
  'decimal',
  'email',
  'numeric',
  'search',
  'tel',
  'url',
]);

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      required,
      className = '',
      fieldClassName = '',
      labelAction,
      phonetic,
      onChange,
      onCompositionStart,
      onCompositionEnd,
      type,
      inputMode,
      disabled,
      readOnly,
      maxLength,
      ...props
    },
    ref
  ) => {
    if (!id) throw new Error('TextField requires a stable id');
    const { helperId, errorId } = formFieldIds(id);
    const describedBy = [
      props['aria-describedby'],
      helperText ? helperId : undefined,
      error ? errorId : undefined,
    ].filter(Boolean).join(' ') || undefined;

    const normalizedType = type || 'text';
    const normalizedInputMode = inputMode ? String(inputMode) : '';
    const phoneticEligible =
      phonetic !== false &&
      normalizedType === 'text' &&
      !disabled &&
      !readOnly &&
      !PHONETIC_BLOCKED_INPUT_MODES.has(normalizedInputMode);

    const phoneticController = useBanglaPhoneticInput(id, phoneticEligible);

    return (
      <FormField
        id={id}
        label={label}
        helperText={helperText}
        error={error}
        required={Boolean(required)}
        className={fieldClassName}
        labelAction={labelAction}
      >
        <input
          {...props}
          ref={ref}
          id={id}
          type={type}
          inputMode={inputMode}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          required={required}
          aria-required={required ? 'true' : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={
            phoneticController
              ? (event) => phoneticController.handleChange(event, onChange, maxLength)
              : onChange
          }
          onCompositionStart={
            phoneticController
              ? (event) => phoneticController.handleCompositionStart(event, onCompositionStart)
              : onCompositionStart
          }
          onCompositionEnd={
            phoneticController
              ? (event) => phoneticController.handleCompositionEnd(event, onCompositionEnd)
              : onCompositionEnd
          }
          className={joinFormClasses(FORM_CONTROL_BASE, formControlStateClass(Boolean(error)), className)}
        />
      </FormField>
    );
  }
);

TextField.displayName = 'TextField';
