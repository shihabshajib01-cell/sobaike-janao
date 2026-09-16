import React from 'react';
import { SECTIONS, SectionKey } from '../../theme/tokens';
import { useTaxonomy } from '../../services/taxonomyService';
import { CategoryIcon } from '../branding/CategoryIcon';

export interface CategoryBadgeProps {
  id?: string;
  section: SectionKey;
  language?: 'bn' | 'en';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  id,
  section,
  language = 'bn',
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const { getSegment } = useTaxonomy();
  const config = getSegment(section) || SECTIONS[section];
  if (!config) return null;

  const label = language === 'bn' ? config.shortNameBn : config.shortNameEn;

  const sizeClasses = {
    sm: 'text-[var(--type-fixed-13)] px-2.5 py-1 rounded-[var(--radius-badge-sm)] gap-1.5 font-[var(--font-weight-semibold)] min-h-[26px]',
    md: 'text-[var(--type-fixed-14)] px-3 py-1.5 rounded-[var(--radius-badge-md)] gap-2 font-[var(--font-weight-semibold)] min-h-[30px]',
    lg: 'text-[var(--type-fixed-15)] px-3.5 py-2 rounded-[var(--radius-control)] gap-2 font-[var(--font-weight-semibold)] min-h-[36px]',
  };

  const iconSizeMap: Record<'sm' | 'md' | 'lg', 'xs' | 'sm' | 'md'> = {
    sm: 'xs',
    md: 'sm',
    lg: 'md',
  };

  return (
    <span
      id={id}
      style={{
        backgroundColor: `var(--sec-${section}-bg)`,
        color: `var(--sec-${section}-text)`,
        borderColor: `var(--sec-${section}-border)`,
      }}
      className={`inline-flex items-center justify-center border whitespace-nowrap leading-none select-none ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <CategoryIcon section={section} size={iconSizeMap[size]} />}
      <span>{label}</span>
    </span>
  );
};

