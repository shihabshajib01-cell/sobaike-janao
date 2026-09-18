import React from 'react';
import { TextField, TextFieldProps } from './TextField';

export type ContactFieldProps = Omit<TextFieldProps, 'type' | 'inputMode'>;

export const ContactField = React.forwardRef<HTMLInputElement, ContactFieldProps>(
  (props, ref) => (
    <TextField
      ref={ref}
      {...props}
      type="text"
      inputMode="email"
    />
  )
);

ContactField.displayName = 'ContactField';
