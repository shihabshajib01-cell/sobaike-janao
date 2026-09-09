import React from 'react';

export type BadgeVariant = 'neutral' | 'outline' | 'success' | 'warning' | 'error' | 'brand';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  id?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  id,
  variant = 'neutral',
  size = 'md',
  icon,
  children,
  className = '',
}) => {
  const sizeClasses: Record<BadgeSize, string> = {
    sm: 'type-compact leading-none ui-space-badge-sm ui-radius-badge-sm',
    md: 'type-compact leading-none ui-space-badge-md ui-radius-badge-md font-medium',
  };

  const variantClasses: Record<BadgeVariant, string> = {
    neutral: 'bg-surface-subtle text-primary ui-border-default border-subtle',
    outline: 'bg-surface text-primary ui-border-default border-theme',
    success: 'bg-[var(--ui-success-bg)] text-[var(--ui-success-text)] ui-border-default border-[var(--ui-success-border)]',
    warning: 'bg-[var(--ui-warning-bg)] text-[var(--ui-warning-text)] ui-border-default border-[var(--ui-warning-border)]',
    error: 'bg-[var(--ui-error-bg)] text-[var(--ui-error-text)] ui-border-default border-[var(--ui-error-border)]',
    brand: 'bg-accent text-inverse ui-border-default border-transparent',
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center justify-center select-none font-medium whitespace-nowrap min-h-[28px] ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
