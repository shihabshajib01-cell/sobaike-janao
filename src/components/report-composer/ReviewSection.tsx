import React from 'react';
import { ChevronDown, Edit2 } from 'lucide-react';

export interface ReviewSectionProps {
  id: string;
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  summary?: React.ReactNode;
  icon?: React.ReactNode;
  onEdit?: () => void;
  editLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  id,
  isOpen,
  onToggle,
  title,
  summary,
  icon,
  onEdit,
  editLabel = 'Edit',
  children,
  className = '',
}) => {
  const headerId = `${id}-header`;
  const panelId = `${id}-panel`;

  return (
    <div
      id={id}
      className={`border rounded-2xl bg-surface transition-colors duration-150 overflow-hidden shadow-2xs ${
        isOpen ? 'border-strong' : 'border-subtle hover:border-strong/60'
      } ${className}`}
    >
      <div className="flex items-center justify-between p-3.5 sm:p-4 gap-2">
        <button
          id={headerId}
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="flex-1 flex items-center justify-between gap-3 text-left cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] min-h-[38px] min-w-0"
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {icon && <div className="text-primary shrink-0">{icon}</div>}
            <div className="min-w-0">
              <span className="text-[14px] sm:text-[15px] font-bold text-primary leading-tight block truncate">
                {title}
              </span>
              {!isOpen && summary && (
                <div className="text-[12.5px] sm:text-[13px] text-muted truncate mt-0.5 font-normal">
                  {summary}
                </div>
              )}
            </div>
          </div>

          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-muted shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-primary bg-surface-subtle' : 'hover:text-primary'
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline cursor-pointer min-h-[38px] px-2 py-1 shrink-0 rounded-lg hover:bg-surface-subtle transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{editLabel}</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div id={panelId} role="region" aria-labelledby={headerId} className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-0">
          <div className="pt-2 border-t border-subtle/60">{children}</div>
        </div>
      )}
    </div>
  );
};
