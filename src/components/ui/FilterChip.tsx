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
      role="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      style={
        selected && config
          ? {
              backgroundColor: config.primaryColor,
              borderColor: config.primaryColor,
              color: config.colors.filledText || '#FFFFFF',
            }
          : undefined
      }
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 h-[34px] sm:h-[36px] text-[13px] sm:text-[14px] font-medium rounded-full border transition-all select-none cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
        selected && !config
          ? 'bg-[var(--ui-primary-action-bg)] text-[var(--ui-primary-action-text)] border-[var(--ui-primary-action-bg)] font-semibold shadow-2xs'
          : !selected
          ? 'bg-surface text-secondary hover:text-primary border-theme hover:border-strong hover:bg-surface-hover'
          : ''
      } ${className}`}
    >
      {icon && <span className="shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5">{icon}</span>}
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span
          className={`ml-0.5 text-[11px] sm:text-[12px] px-1.5 py-0.2 rounded-full font-semibold leading-none ${
            selected
              ? 'bg-black/20 dark:bg-black/30 text-current'
              : 'bg-surface-subtle text-muted'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
