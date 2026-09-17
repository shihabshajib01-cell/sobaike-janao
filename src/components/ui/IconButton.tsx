import React from 'react';

export type IconButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  'aria-label': string; // Enforce accessible label
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
    'inline-flex items-center justify-center ui-radius-control transition-colors focus:outline-none focus:ring-2 focus:ring-ui-focus focus:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0';

  const sizeClasses: Record<IconButtonSize, string> = {
    sm: 'min-w-[44px] min-h-[44px] p-2.5',
    md: 'w-11 h-11 min-w-[44px] min-h-[44px] p-2.5',
    lg: 'w-12 h-12 min-w-[48px] min-h-[48px] p-3',
  };

  const variantClasses: Record<IconButtonVariant, string> = {
    primary:
      'bg-ui-action-bg text-ui-action-text hover:bg-ui-action-hover active:bg-ui-action-active ui-border-default border-transparent ui-elevation-control',
    secondary:
      'bg-ui-surface-subtle text-ui-content-primary hover:bg-ui-surface-elevated active:bg-ui-surface-hover ui-border-default border-ui-stroke-subtle',
    outline:
      'bg-ui-surface text-ui-content-primary hover:bg-ui-surface-subtle active:bg-ui-surface-hover ui-border-default border-ui-stroke-default ui-elevation-control',
    ghost:
      'bg-transparent text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface-subtle active:bg-ui-surface-hover ui-border-default border-transparent',
    destructive:
      'bg-ui-destructive-bg text-ui-destructive-text hover:bg-ui-destructive-hover active:bg-ui-destructive-active ui-border-default border-ui-destructive-border',
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
