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
  collapsible?: boolean;
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
  collapsible = true,
  className = '',
  headerClassName = '',
  contentClassName = '',
}) => {
  const headerId = `${id}-header`;
  const panelId = `${id}-panel`;
  const isExpanded = collapsible ? isOpen : true;
  const errorLabel =
    typeof document !== 'undefined' && document.documentElement.lang === 'bn' ? 'ত্রুটি' : 'Error';

  return (
    <div
      id={id}
      className={`border rounded-[var(--radius-card)] transition-colors duration-150 overflow-hidden ${
        hasError
          ? 'border-ui-error-border bg-ui-error-bg'
          : isExpanded
          ? 'border-ui-stroke-strong bg-ui-surface'
          : 'border-ui-stroke-subtle bg-ui-surface'
      } ${className}`}
    >
      {collapsible ? (
        <button
          id={headerId}
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          className={`w-full flex items-center justify-between p-4 md:p-5 text-left transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${headerClassName}`}
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            {icon && (
              <div
                className={`w-9 h-9 rounded-[var(--radius-control)] flex items-center justify-center shrink-0 transition-colors ${
                  hasError
                    ? 'bg-ui-error-bg text-ui-error-text'
                    : isExpanded
                    ? 'bg-ui-accent-soft text-ui-accent'
                    : 'bg-ui-surface-subtle text-ui-content-secondary'
                }`}
              >
                {icon}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="type-label type-h3 font-[var(--font-weight-bold)] text-ui-content-primary leading-tight">
                  {title}
                </span>
                {badge}
                {hasError && (
                  <span className="inline-flex items-center gap-1 type-helper font-[var(--font-weight-semibold)] text-ui-error-text bg-ui-error-bg border border-ui-error-border px-2 py-0.5 rounded-[var(--radius-badge-sm)]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorLabel}</span>
                  </span>
                )}
              </div>

              {summary && !isExpanded && (
                <div className="type-helper leading-snug text-ui-content-muted mt-1 truncate">
                  {summary}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`w-8 h-8 rounded-[var(--radius-badge-md)] flex items-center justify-center text-ui-content-muted transition-transform duration-200 ${
                isExpanded ? 'rotate-180 bg-ui-surface-subtle' : ''
              }`}
            >
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
        </button>
      ) : (
        <div
          id={headerId}
          className={`w-full flex items-center justify-between p-4 md:p-5 text-left select-none ${headerClassName}`}
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            {icon && (
              <div
                className={`w-9 h-9 rounded-[var(--radius-control)] flex items-center justify-center shrink-0 transition-colors ${
                  hasError
                    ? 'bg-ui-error-bg text-ui-error-text'
                    : 'bg-ui-accent-soft text-ui-accent'
                }`}
              >
                {icon}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="type-label type-h3 font-[var(--font-weight-bold)] text-ui-content-primary leading-tight">
                  {title}
                </span>
                {badge}
                {hasError && (
                  <span className="inline-flex items-center gap-1 type-helper font-[var(--font-weight-semibold)] text-ui-error-text bg-ui-error-bg border border-ui-error-border px-2 py-0.5 rounded-[var(--radius-badge-sm)]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorLabel}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isExpanded && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className={`px-4 pb-5 md:px-5 md:pb-6 pt-1 border-t border-ui-stroke-subtle ${contentClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};
