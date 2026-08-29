import React from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export interface AccordionProps {
  id: string;
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  summary?: string | React.ReactNode;
  badge?: React.ReactNode;
  hasError?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  id,
  isOpen,
  onToggle,
  title,
  summary,
  badge,
  hasError = false,
  icon,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
}) => {
  const headerId = `${id}-header`;
  const panelId = `${id}-panel`;

  return (
    <div
      id={id}
      className={`border rounded-2xl transition-colors duration-150 overflow-hidden ${
        hasError
          ? 'border-red-500/50 bg-red-500/5'
          : isOpen
          ? 'border-strong bg-surface'
          : 'border-subtle bg-surface hover:border-strong/60'
      } ${className}`}
    >
      <button
        id={headerId}
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={`w-full flex items-center justify-between p-4 md:p-5 text-left transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] ${headerClassName}`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          {icon && (
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                hasError
                  ? 'bg-red-500/10 text-red-500'
                  : isOpen
                  ? 'bg-accent-soft text-accent'
                  : 'bg-surface-subtle text-secondary'
              }`}
            >
              {icon}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[16px] md:text-[18px] font-bold text-primary leading-tight">
                {title}
              </span>
              {badge}
              {hasError && (
                <span className="inline-flex items-center gap-1 text-[14px] font-semibold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>ত্রুটি / Error</span>
                </span>
              )}
            </div>

            {summary && !isOpen && (
              <div className="text-[14px] leading-snug text-muted mt-1 truncate">
                {summary}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-muted transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-primary bg-surface-subtle' : 'hover:text-primary'
            }`}
          >
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </button>

      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className={`px-4 pb-5 md:px-5 md:pb-6 pt-1 border-t border-subtle ${contentClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};
