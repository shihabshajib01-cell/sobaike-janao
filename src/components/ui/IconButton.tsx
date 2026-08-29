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
    'inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] focus:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0';

  const sizeClasses: Record<IconButtonSize, string> = {
    sm: 'w-8 h-8 rounded-lg p-1.5',
    md: 'w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl p-2.5', // Touch friendly >= 44px
    lg: 'w-12 h-12 rounded-xl p-3',
  };

  const variantClasses: Record<IconButtonVariant, string> = {
    primary:
      'bg-[var(--ui-primary-action-bg)] text-[var(--ui-primary-action-text)] hover:bg-[var(--ui-primary-action-hover)] active:opacity-90 border border-transparent shadow-2xs',
    secondary:
      'bg-surface-subtle text-primary hover:bg-surface-elevated active:bg-surface-hover border border-subtle',
    outline:
      'bg-surface text-primary hover:bg-surface-subtle active:bg-surface-hover border border-theme shadow-2xs',
    ghost:
      'bg-transparent text-secondary hover:text-primary hover:bg-surface-subtle active:bg-surface-hover border border-transparent',
    destructive:
      'bg-[var(--ui-error-bg)] text-[var(--ui-error-text)] hover:opacity-90 border border-[var(--ui-error-border)]',
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
