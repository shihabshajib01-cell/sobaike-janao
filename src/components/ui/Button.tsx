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
    'inline-flex items-center justify-center text-[16px] leading-[24px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3.5 py-2 min-h-[44px] rounded-xl gap-1.5',
    md: 'px-4 py-2.5 min-h-[44px] rounded-xl gap-2',
    lg: 'px-6 py-3 min-h-[48px] rounded-xl gap-2.5',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-[var(--ui-primary-action-bg)] text-[var(--ui-primary-action-text)] hover:bg-[var(--ui-primary-action-hover)] active:opacity-90 border border-transparent shadow-2xs',
    secondary:
      'bg-surface-subtle text-primary hover:bg-surface-elevated active:bg-surface-hover border border-subtle',
    outline:
      'bg-surface text-primary hover:bg-surface-subtle active:bg-surface-hover border border-theme shadow-2xs',
    ghost:
      'bg-transparent text-secondary hover:text-primary hover:bg-surface-subtle active:bg-surface-hover border border-transparent',
    destructive:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-red-600 shadow-2xs',
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
