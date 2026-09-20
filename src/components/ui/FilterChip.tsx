import React from 'react';
import { Link } from 'react-router-dom';
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
  to?: string;
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
  to,
  disabled = false,
  className = '',
}) => {
  const { getSegment } = useTaxonomy();
  const config = section ? getSegment(section) : null;

  const style =
    selected && section
      ? {
          backgroundColor: config?.primaryColor || 'var(--md-primary)',
          borderColor: config?.primaryColor || 'var(--md-primary)',
          color: config?.colors.filledText || 'var(--md-on-primary)',
        }
      : undefined;

  const classes = `inline-flex items-center justify-center ui-space-filter-chip min-h-[44px] type-compact font-[var(--font-weight-medium)] ui-radius-pill ui-border-default transition-all select-none whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-role-focus focus-visible:ring-offset-1 active:scale-95 ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  } ${
    selected && !config
      ? 'bg-role-primary text-role-on-primary border-role-primary font-[var(--font-weight-semibold)] ui-elevation-selected'
      : !selected
      ? 'bg-role-surface text-role-on-surface-secondary hover:text-role-on-surface border-role-outline-subtle hover:border-role-outline hover:bg-role-surface-hover'
      : ''
  } ${className}`;

  const content = (
    <>
      {icon && <span className="shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5">{icon}</span>}
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <small
          className={`ml-1 font-[var(--font-weight-semibold)] leading-none tabular-nums ${
            selected ? 'text-current' : 'text-role-on-surface-muted'
          }`}
        >
          {count}
        </small>
      )}
    </>
  );

  if (to && !disabled) {
    return (
      <Link
        id={id}
        to={to}
        aria-current={selected ? 'page' : undefined}
        onClick={onClick}
        style={style}
        className={classes}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      id={id}
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={classes}
    >
      {content}
    </button>
  );
};
