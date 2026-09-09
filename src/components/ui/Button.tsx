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
    'inline-flex items-center justify-center type-action transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'ui-space-button-sm min-h-[44px] ui-radius-control',
    md: 'ui-space-button-md min-h-[44px] ui-radius-control',
    lg: 'ui-space-button-lg min-h-[48px] ui-radius-control',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-[var(--ui-primary-action-bg)] text-[var(--ui-primary-action-text)] hover:bg-[var(--ui-primary-action-hover)] active:opacity-90 ui-border-default border-transparent ui-elevation-control',
    secondary:
      'bg-surface-subtle text-primary hover:bg-surface-elevated active:bg-surface-hover ui-border-default border-subtle',
    outline:
      'bg-surface text-primary hover:bg-surface-subtle active:bg-surface-hover ui-border-default border-theme ui-elevation-control',
    ghost:
      'bg-transparent text-secondary hover:text-primary hover:bg-surface-subtle active:bg-surface-hover ui-border-default border-transparent',
    destructive:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 ui-border-default border-red-600 ui-elevation-control',
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
      <span className="truncate leading-normal">{children}</span>
      {!isLoading && rightIcon && (
        <span className="shrink-0 inline-flex items-center">{rightIcon}</span>
      )}
    </button>
  );
};
