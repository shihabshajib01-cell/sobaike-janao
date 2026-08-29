import React from 'react';
import { HeartHandshake, Zap, ShieldAlert, LucideIcon } from 'lucide-react';
import { SectionKey, SECTIONS } from '../../theme/tokens';

export type FeatureIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type FeatureIconVariant = 'standard' | 'container' | 'marker' | 'badge';

export interface FeatureIconProps {
  section: SectionKey;
  size?: FeatureIconSize;
  variant?: FeatureIconVariant;
  className?: string;
  strokeWidth?: number;
  ariaLabel?: string;
}

const ICON_MAP: Record<SectionKey, LucideIcon> = {
  harassment: HeartHandshake,
  rickshaw: Zap,
  extortion: ShieldAlert,
};

const SIZE_CLASSES: Record<FeatureIconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

const CONTAINER_SIZE_CLASSES: Record<FeatureIconSize, string> = {
  xs: 'w-5 h-5 rounded-md p-1',
  sm: 'w-6 h-6 rounded-lg p-1.2',
  md: 'w-8 h-8 rounded-lg p-1.5',
  lg: 'w-10 h-10 rounded-xl p-2.5',
  xl: 'w-12 h-12 rounded-2xl p-3',
};

/**
 * Standardized unified FeatureIcon component for Sobaike Janao.
 * Ensures identical icon geometry, stroke width (2px), color logic and sizing
 * across sidebars, filters, cards, map markers, summaries and feeds.
 */
export const FeatureIcon: React.FC<FeatureIconProps> = ({
  section,
  size = 'md',
  variant = 'standard',
  className = '',
  strokeWidth = 2,
  ariaLabel,
}) => {
  const IconComponent = ICON_MAP[section] || ShieldAlert;
  const isAccessible = Boolean(ariaLabel);

  if (variant === 'marker') {
    return (
      <div
        className={`w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center text-white border-2 border-white shadow-md transition-all shrink-0 ${className}`}
        style={{
          backgroundColor: `var(--sec-${section}-primary)`,
        }}
        role={isAccessible ? 'img' : undefined}
        aria-label={ariaLabel}
        aria-hidden={!isAccessible ? 'true' : undefined}
      >
        <IconComponent className="w-4 h-4" strokeWidth={strokeWidth} aria-hidden="true" />
      </div>
    );
  }

  if (variant === 'container' || variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 border shadow-2xs transition-colors ${CONTAINER_SIZE_CLASSES[size]} ${className}`}
        style={{
          backgroundColor: `var(--sec-${section}-bg)`,
          color: `var(--sec-${section}-text)`,
          borderColor: `var(--sec-${section}-border)`,
        }}
        role={isAccessible ? 'img' : undefined}
        aria-label={ariaLabel}
        aria-hidden={!isAccessible ? 'true' : undefined}
      >
        <IconComponent className={SIZE_CLASSES[size]} strokeWidth={strokeWidth} aria-hidden="true" />
      </div>
    );
  }

  return (
    <IconComponent
      className={`${SIZE_CLASSES[size]} shrink-0 ${className}`}
      strokeWidth={strokeWidth}
      role={isAccessible ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={!isAccessible ? 'true' : undefined}
    />
  );
};
