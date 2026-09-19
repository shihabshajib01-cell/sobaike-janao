import React from 'react';
import { TextField, TextFieldProps } from './TextField';

export interface TimeFieldProps extends Omit<TextFieldProps, 'type'> {
  language?: 'bn' | 'en';
}

export const TimeField = React.forwardRef<HTMLInputElement, TimeFieldProps>(
  ({ language = 'bn', ...props }, ref) => (
    <TextField ref={ref} {...props} type="time" lang={language === 'bn' ? 'bn-BD' : 'en-GB'} />
  )
);

TimeField.displayName = 'TimeField';
