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
    neutral: 'bg-ui-surface-subtle text-ui-content-primary ui-border-default border-ui-stroke-subtle',
    outline: 'bg-ui-surface text-ui-content-primary ui-border-default border-ui-stroke-default',
    success: 'bg-ui-success-bg text-ui-success-text ui-border-default border-ui-success-border',
    warning: 'bg-ui-warning-bg text-ui-warning-text ui-border-default border-ui-warning-border',
    error: 'bg-ui-error-bg text-ui-error-text ui-border-default border-ui-error-border',
    brand: 'bg-ui-accent text-ui-content-inverse ui-border-default border-transparent',
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
