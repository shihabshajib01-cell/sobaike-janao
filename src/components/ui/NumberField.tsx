import React from 'react';
import { TextField, TextFieldProps } from './TextField';

export interface NumberFieldProps extends Omit<TextFieldProps, 'type'> {
  integer?: boolean;
}

export const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ integer = false, step, inputMode, ...props }, ref) => (
    <TextField
      ref={ref}
      {...props}
      type="number"
      inputMode={inputMode ?? (integer ? 'numeric' : 'decimal')}
      step={step ?? (integer ? 1 : 'any')}
    />
  )
);

NumberField.displayName = 'NumberField';
