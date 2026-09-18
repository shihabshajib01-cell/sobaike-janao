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
  mobileOrder?: 'secondary-first' | 'primary-first';
  align?: 'end' | 'center';
  className?: string;
}

export const ModalActions: React.FC<ModalActionsProps> = ({
  primary,
  secondary,
  mobileOrder = 'secondary-first',
  align = 'end',
  className = '',
}) => {
  const renderAction = (
    action: ModalActionConfig,
    fallbackVariant: ButtonVariant,
    orderClass: string
  ) => {
    const { label, variant = fallbackVariant, className: actionClassName = '', ...buttonProps } = action;

    return (
      <Button
        {...buttonProps}
        variant={variant}
        className={`w-full sm:w-auto ${orderClass} ${actionClassName}`}
      >
        {label}
      </Button>
    );
  };

  const primaryOrder =
    mobileOrder === 'primary-first' ? 'order-1 sm:order-2' : 'order-2 sm:order-2';
  const secondaryOrder =
    mobileOrder === 'primary-first' ? 'order-2 sm:order-1' : 'order-1 sm:order-1';

  return (
    <div
      className={`w-full grid grid-cols-1 gap-2.5 sm:flex sm:items-center ${
        align === 'center' ? 'sm:justify-center' : 'sm:justify-end'
      } ${className}`}
    >
      {secondary ? renderAction(secondary, 'outline', secondaryOrder) : null}
      {renderAction(primary, 'primary', primaryOrder)}
    </div>
  );
};
