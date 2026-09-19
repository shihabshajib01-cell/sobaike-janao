import React from 'react';
import { TextField, TextFieldProps } from './TextField';

export interface MonthFieldProps extends Omit<TextFieldProps, 'type'> {
  language?: 'bn' | 'en';
}

export const MonthField = React.forwardRef<HTMLInputElement, MonthFieldProps>(
  ({ language = 'bn', ...props }, ref) => (
    <TextField ref={ref} {...props} type="month" lang={language === 'bn' ? 'bn-BD' : 'en-GB'} />
  )
);

MonthField.displayName = 'MonthField';
