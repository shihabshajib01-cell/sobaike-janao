import React from 'react';
import { SectionKey, SECTIONS } from '../../theme/tokens';

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
  const config = section ? SECTIONS[section] : null;

  return (
    <button
      id={id}
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      style={
        selected && config
          ? {
              backgroundColor: config.primaryColor,
              borderColor: config.primaryColor,
              color: config.colors.filledText || 'var(--ui-content-inverse)',
            }
          : undefined
      }
      className={`inline-flex items-center justify-center ui-space-filter-chip min-h-[44px] text-[13px] sm:text-[14px] font-medium ui-radius-pill ui-border-default transition-all select-none cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus focus-visible:ring-offset-1 active:scale-95 ${
        selected && !config
          ? 'bg-ui-action-bg text-ui-action-text border-ui-action-bg font-semibold ui-elevation-selected'
          : !selected
          ? 'bg-ui-surface text-ui-content-secondary hover:text-ui-content-primary border-ui-stroke-default hover:border-ui-stroke-strong hover:bg-ui-surface-hover'
          : ''
      } ${className}`}
    >
      {icon && <span className="shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5">{icon}</span>}
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span
          className={`ml-0.5 text-[11px] sm:text-[12px] px-1.5 py-0.2 rounded-full font-semibold leading-none ${
            selected
              ? 'bg-current/20 text-current'
              : 'bg-ui-surface-subtle text-ui-content-muted'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
