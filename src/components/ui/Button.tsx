import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  id,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center type-action transition-colors focus:outline-none focus:ring-2 focus:ring-role-focus focus:ring-offset-1 select-none cursor-pointer disabled:opacity-100 disabled:cursor-not-allowed disabled:bg-role-disabled-container disabled:text-role-on-disabled disabled:border-role-outline-subtle disabled:hover:bg-role-disabled-container disabled:hover:text-role-on-disabled disabled:active:opacity-100';

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'ui-space-button-sm min-h-[44px] ui-radius-control',
    md: 'ui-space-button-md min-h-[44px] ui-radius-control',
    lg: 'ui-space-button-lg min-h-[48px] ui-radius-control',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-role-primary text-role-on-primary hover:bg-role-primary-variant active:opacity-90 ui-border-default border-transparent ui-elevation-control',
    secondary:
      'bg-role-surface-subtle text-role-on-surface hover:bg-role-surface-elevated active:bg-role-surface-hover ui-border-default border-role-outline-subtle',
    outline:
      'bg-role-surface text-role-on-surface hover:bg-role-surface-subtle active:bg-role-surface-hover ui-border-default border-role-outline ui-elevation-control',
    ghost:
      'bg-transparent text-role-on-surface-secondary hover:text-role-on-surface hover:bg-role-surface-subtle active:bg-role-surface-hover ui-border-default border-transparent',
    destructive:
      'bg-role-destructive text-role-on-destructive hover:bg-role-destructive-hover active:bg-role-destructive-active ui-border-default border-role-destructive-outline ui-elevation-control',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      id={id}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0 inline-flex items-center">{leftIcon}</span>
      )}
      <span className="truncate">{children}</span>
      {!isLoading && rightIcon && (
        <span className="shrink-0 inline-flex items-center">{rightIcon}</span>
      )}
    </button>
  );
};
