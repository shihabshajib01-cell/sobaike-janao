import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  id?: string;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  id,
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center p-8 text-center bg-surface border border-subtle rounded-2xl max-w-md mx-auto my-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-surface-subtle flex items-center justify-center text-muted mb-4 shrink-0">
        {icon || <Inbox className="w-7 h-7 stroke-[1.5]" />}
      </div>
      <h3 className="text-[18px] font-bold text-primary mb-1.5">{title}</h3>
      {description && <p className="text-[14px] leading-[22px] text-muted max-w-xs mb-5">{description}</p>}
      {actionLabel && onAction && (
        <Button size="md" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
