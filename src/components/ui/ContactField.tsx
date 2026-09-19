import React from 'react';
import { TextField, TextFieldProps } from './TextField';

export type ContactFieldProps = Omit<TextFieldProps, 'type'>;

export const ContactField = React.forwardRef<HTMLInputElement, ContactFieldProps>(
  ({ inputMode, ...props }, ref) => (
    <TextField
      ref={ref}
      {...props}
      type="text"
      inputMode={inputMode}
    />
  )
);

ContactField.displayName = 'ContactField';
