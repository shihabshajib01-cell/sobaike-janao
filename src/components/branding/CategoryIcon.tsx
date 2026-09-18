import React from 'react';
import { FeatureIcon, FeatureIconSize, FeatureIconVariant } from './FeatureIcon';
import { SectionKey } from '../../theme/tokens';
import { useTaxonomy } from '../../services/taxonomyService';

export interface CategoryIconProps {
  section: SectionKey;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  withContainer?: boolean;
  variant?: 'standard' | 'marker' | 'badge';
  ariaLabel?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  section,
  className = '',
  size = 'md',
  strokeWidth = 2,
  withContainer = false,
  variant = 'standard',
  ariaLabel,
}) => {
  const { getSegment } = useTaxonomy();
  const config = getSegment(section);
  const mappedVariant: FeatureIconVariant =
    variant === 'marker'
      ? 'marker'
      : withContainer || variant === 'badge'
        ? 'container'
        : 'standard';

  return (
    <FeatureIcon
      section={section}
      iconKey={config?.iconKey}
      palette={{
        primary: config?.primaryColor,
        background: config?.bgColor,
        border: config?.borderColor,
        text: config?.textColor,
      }}
      size={size as FeatureIconSize}
      variant={mappedVariant}
      className={className}
      strokeWidth={strokeWidth}
      ariaLabel={ariaLabel}
    />
  );
};
