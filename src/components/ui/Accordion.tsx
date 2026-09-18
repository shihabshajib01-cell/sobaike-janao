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
          ? 'border-role-error-outline bg-role-error-container'
          : isExpanded
          ? 'border-role-outline-strong bg-role-surface'
          : 'border-role-outline-subtle bg-role-surface'
      } ${className}`}
    >
      {collapsible ? (
        <button
          id={headerId}
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          className={`w-full flex items-center justify-between p-4 md:p-5 text-left transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-role-focus ${headerClassName}`}
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            {icon && (
              <div
                className={`w-9 h-9 rounded-[var(--radius-control)] flex items-center justify-center shrink-0 transition-colors ${
                  hasError
                    ? 'bg-role-error-container text-role-on-error-container'
                    : isExpanded
                    ? 'bg-role-secondary-container text-role-on-secondary-container'
                    : 'bg-role-surface-subtle text-role-on-surface-secondary'
                }`}
              >
                {icon}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="type-h3 font-[var(--font-weight-bold)] text-role-on-surface leading-tight">
                  {title}
                </span>
                {badge}
                {hasError && (
                  <span className="inline-flex items-center gap-1 type-compact font-[var(--font-weight-semibold)] text-role-on-error-container bg-role-error-container border border-role-error-outline px-2 py-0.5 rounded-[var(--radius-badge-sm)]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorLabel}</span>
                  </span>
                )}
              </div>

              {summary && !isExpanded && (
                <div className="type-compact leading-snug text-role-on-surface-muted mt-1 truncate">
                  {summary}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`w-8 h-8 rounded-[var(--radius-badge-md)] flex items-center justify-center text-role-on-surface-muted transition-transform duration-200 ${
                isExpanded ? 'rotate-180 bg-role-surface-subtle' : ''
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
                    ? 'bg-role-error-container text-role-on-error-container'
                    : 'bg-role-secondary-container text-role-on-secondary-container'
                }`}
              >
                {icon}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="type-h3 font-[var(--font-weight-bold)] text-role-on-surface leading-tight">
                  {title}
                </span>
                {badge}
                {hasError && (
                  <span className="inline-flex items-center gap-1 type-compact font-[var(--font-weight-semibold)] text-role-on-error-container bg-role-error-container border border-role-error-outline px-2 py-0.5 rounded-[var(--radius-badge-sm)]">
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
          className={`px-4 pb-5 md:px-5 md:pb-6 pt-1 border-t border-role-outline-subtle ${contentClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};
