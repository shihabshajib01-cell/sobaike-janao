import React from 'react';
import { Button, ButtonProps, ButtonVariant } from './Button';

export interface ModalActionConfig
  extends Omit<ButtonProps, 'children' | 'fullWidth' | 'variant'> {
  label: React.ReactNode;
  variant?: ButtonVariant;
}

export interface ModalActionsProps {
  primary: ModalActionConfig;
  secondary?: ModalActionConfig;
  align?: 'end' | 'center';
  className?: string;
}

export const ModalActions: React.FC<ModalActionsProps> = ({
  primary,
  secondary,
  align = 'end',
  className = '',
}) => {
  const renderAction = (
    action: ModalActionConfig,
    fallbackVariant: ButtonVariant
  ) => {
    const {
      label,
      variant = fallbackVariant,
      className: actionClassName = '',
      ...buttonProps
    } = action;

    return (
      <Button
        {...buttonProps}
        variant={variant}
        className={`w-full sm:w-auto ${actionClassName}`}
      >
        {label}
      </Button>
    );
  };

  return (
    <div
      className={`w-full grid grid-cols-1 gap-2.5 sm:flex sm:items-center ${
        align === 'center' ? 'sm:justify-center' : 'sm:justify-end'
      } ${className}`}
    >
      {secondary ? renderAction(secondary, 'outline') : null}
      {renderAction(primary, 'primary')}
    </div>
  );
};
