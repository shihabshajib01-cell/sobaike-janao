import React from 'react';
import { SectionKey } from '../../theme/tokens';
import { useTaxonomy } from '../../services/taxonomyService';

export interface FilterChipProps {
  id?: string;
  label: string;
  selected?: boolean;
  count?: number;
  section?: SectionKey;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  id,
  label,
  selected = false,
  count,
  section,
  icon,
  onClick,
  disabled = false,
  className = '',
}) => {
  const { getSegment } = useTaxonomy();
  const config = section ? getSegment(section) : null;

  return (
    <button
      id={id}
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      style={
        selected && section
          ? {
              backgroundColor: config?.primaryColor || 'var(--md-primary)',
              borderColor: config?.primaryColor || 'var(--md-primary)',
              color: config?.colors.filledText || 'var(--md-on-primary)',
            }
          : undefined
      }
      className={`inline-flex items-center justify-center ui-space-filter-chip min-h-[44px] type-compact font-[var(--font-weight-medium)] ui-radius-pill ui-border-default transition-all select-none cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-role-focus focus-visible:ring-offset-1 active:scale-95 ${
        selected && !config
          ? 'bg-role-primary text-role-on-primary border-role-primary font-[var(--font-weight-semibold)] ui-elevation-selected'
          : !selected
          ? 'bg-role-surface text-role-on-surface-secondary hover:text-role-on-surface border-role-outline hover:border-role-outline-strong hover:bg-role-surface-hover'
          : ''
      } ${className}`}
    >
      {icon && <span className="shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5">{icon}</span>}
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <small
          className={`ml-0.5 px-1.5 py-0.5 ui-radius-pill font-[var(--font-weight-semibold)] leading-none ${
            selected
              ? 'bg-current/20 text-current'
              : 'bg-role-surface-subtle text-role-on-surface-muted'
          }`}
        >
          {count}
        </small>
      )}
    </button>
  );
};
