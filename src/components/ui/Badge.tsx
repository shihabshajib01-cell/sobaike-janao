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
    sm: 'text-[14px] leading-none px-2.5 py-1 rounded-md gap-1',
    md: 'text-[14px] leading-none px-3 py-1.5 rounded-lg gap-1.5 font-medium',
  };

  const variantClasses: Record<BadgeVariant, string> = {
    neutral: 'bg-surface-subtle text-primary border border-subtle',
    outline: 'bg-surface text-primary border border-theme',
    success: 'bg-[var(--ui-success-bg)] text-[var(--ui-success-text)] border border-[var(--ui-success-border)]',
    warning: 'bg-[var(--ui-warning-bg)] text-[var(--ui-warning-text)] border border-[var(--ui-warning-border)]',
    error: 'bg-[var(--ui-error-bg)] text-[var(--ui-error-text)] border border-[var(--ui-error-border)]',
    brand: 'bg-accent text-inverse border border-transparent',
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
