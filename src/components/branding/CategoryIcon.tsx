import React from 'react';
import { FeatureIcon, FeatureIconProps, FeatureIconSize, FeatureIconVariant } from './FeatureIcon';
import { SectionKey } from '../../theme/tokens';

export interface CategoryIconProps {
  section: SectionKey;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  withContainer?: boolean;
  variant?: 'standard' | 'marker' | 'badge';
  ariaLabel?: string;
}

/**
 * CategoryIcon re-exports / wraps standardized FeatureIcon
 * preserving backward compatibility for existing imports.
 */
export const CategoryIcon: React.FC<CategoryIconProps> = ({
  section,
  className = '',
  size = 'md',
  strokeWidth = 2,
  withContainer = false,
  variant = 'standard',
  ariaLabel,
}) => {
  const mappedVariant: FeatureIconVariant =
    variant === 'marker'
      ? 'marker'
      : withContainer || variant === 'badge'
      ? 'container'
      : 'standard';

  return (
    <FeatureIcon
      section={section}
      size={size as FeatureIconSize}
      variant={mappedVariant}
      className={className}
      strokeWidth={strokeWidth}
      ariaLabel={ariaLabel}
    />
  );
};
