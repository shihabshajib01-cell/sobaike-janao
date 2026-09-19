import React from 'react';
import { TextField, TextFieldProps } from './TextField';

export interface DateFieldProps extends Omit<TextFieldProps, 'type'> {
  language?: 'bn' | 'en';
}

export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  ({ language = 'bn', ...props }, ref) => (
    <TextField ref={ref} {...props} type="date" lang={language === 'bn' ? 'bn-BD' : 'en-GB'} />
  )
);

DateField.displayName = 'DateField';
