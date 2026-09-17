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

  const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'ui-space-badge-sm ui-radius-badge-sm type-meta font-semibold min-h-[26px]',
    md: 'ui-space-badge-md ui-radius-badge-md type-meta font-semibold min-h-[30px]',
    lg: 'ui-space-badge-md ui-radius-control type-label font-semibold min-h-[36px]',
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
      className={`inline-flex items-center justify-center ui-border-default whitespace-nowrap leading-none select-none ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <CategoryIcon section={section} size={iconSizeMap[size]} />}
      <span>{label}</span>
    </span>
  );
};
