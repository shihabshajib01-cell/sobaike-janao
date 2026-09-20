import React from 'react';

export type IconButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  'aria-label': string;
  icon: React.ReactNode;
}

export const IconButton: React.FC<IconButtonProps> = ({
  id,
  variant = 'ghost',
  size = 'md',
  'aria-label': ariaLabel,
  icon,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center ui-radius-control transition-colors focus:outline-none focus:ring-2 focus:ring-role-focus focus:ring-offset-1 select-none cursor-pointer shrink-0 disabled:opacity-100 disabled:cursor-not-allowed disabled:bg-role-disabled-container disabled:text-role-on-disabled disabled:border-role-outline-subtle disabled:hover:bg-role-disabled-container disabled:hover:text-role-on-disabled';

  const sizeClasses: Record<IconButtonSize, string> = {
    sm: 'min-w-[44px] min-h-[44px] p-2.5',
    md: 'w-11 h-11 min-w-[44px] min-h-[44px] p-2.5',
    lg: 'w-12 h-12 min-w-[48px] min-h-[48px] p-2.5',
  };

  const variantClasses: Record<IconButtonVariant, string> = {
    primary:
      'bg-role-primary text-role-on-primary hover:bg-role-primary-variant active:bg-role-primary-active ui-border-default border-transparent ui-elevation-control',
    secondary:
      'bg-role-surface-subtle text-role-on-surface hover:bg-role-surface-elevated active:bg-role-surface-hover ui-border-default border-role-outline-subtle',
    outline:
      'bg-role-surface text-role-on-surface hover:bg-role-surface-subtle active:bg-role-surface-hover ui-border-default border-role-outline ui-elevation-control',
    ghost:
      'bg-transparent text-role-on-surface-secondary hover:text-role-on-surface hover:bg-role-surface-subtle active:bg-role-surface-hover ui-border-default border-transparent',
    destructive:
      'bg-role-destructive text-role-on-destructive hover:bg-role-destructive-hover active:bg-role-destructive-active ui-border-default border-role-destructive-outline ui-elevation-control',
  };

  return (
    <button
      id={id}
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};
