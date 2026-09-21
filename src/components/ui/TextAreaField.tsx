import React from 'react';
import { FormField } from './FormField';
import { FORM_TEXTAREA_BASE, formControlStateClass, formFieldIds, joinFormClasses } from './formSystem';
import { useBanglaPhoneticInput } from './BanglaPhonetic';

export interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
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

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
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
      inputMode,
      disabled,
      readOnly,
      maxLength,
      ...props
    },
    ref
  ) => {
    if (!id) throw new Error('TextAreaField requires a stable id');
    const { helperId, errorId } = formFieldIds(id);
    const describedBy = [
      props['aria-describedby'],
      helperText ? helperId : undefined,
      error ? errorId : undefined,
    ].filter(Boolean).join(' ') || undefined;

    const normalizedInputMode = inputMode ? String(inputMode) : '';
    const phoneticEligible =
      phonetic !== false &&
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
        <textarea
          {...props}
          ref={ref}
          id={id}
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
          className={joinFormClasses(FORM_TEXTAREA_BASE, formControlStateClass(Boolean(error)), className)}
        />
      </FormField>
    );
  }
);

TextAreaField.displayName = 'TextAreaField';
