import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'outline' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  id,
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  };

  const variantClasses = {
    default: 'bg-surface ui-border-default border-subtle ui-elevation-card ui-radius-card',
    subtle: 'bg-surface-subtle ui-border-default border-subtle ui-radius-card',
    outline: 'bg-transparent ui-border-default border-theme ui-radius-card',
    interactive:
      'bg-surface ui-border-default border-subtle hover:border-theme hover:bg-surface-hover active:bg-surface-subtle transition-all ui-radius-card cursor-pointer',
  };

  return (
    <div
      id={id}
      className={`${variantClasses[variant]} ${paddingClasses[padding]} text-primary text-left ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
