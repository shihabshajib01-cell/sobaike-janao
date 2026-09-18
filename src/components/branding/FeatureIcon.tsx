import React from 'react';
import {
  HeartHandshake,
  ShieldAlert,
  ShieldCheck,
  TrafficCone,
  Building2,
  ZapOff,
  MapPin,
  Heart,
  LucideIcon,
} from 'lucide-react';
import { EvStationIcon } from './EvStationIcon';
import { SectionKey } from '../../theme/tokens';
import { useTaxonomy } from '../../services/taxonomyService';

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

const ICON_MAP: Record<string, LucideIcon | React.ComponentType<any>> = {
  harassment: HeartHandshake,
  extortion: ShieldAlert,
  public_safety: ShieldCheck,
  road_transport: TrafficCone,
  load_shedding: ZapOff,
  illegal_occupation: Building2,
  rickshaw: EvStationIcon,
  shield: ShieldCheck,
  alert: ShieldAlert,
  heart: Heart,
  road: TrafficCone,
  building: Building2,
  bolt: ZapOff,
  map: MapPin,
};

const SIZE_CLASSES: Record<FeatureIconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

const CONTAINER_SIZE_CLASSES: Record<FeatureIconSize, string> = {
  xs: 'w-5 h-5 rounded-[var(--radius-badge-sm)] p-1',
  sm: 'w-6 h-6 rounded-[var(--radius-badge-md)] p-1.2',
  md: 'w-8 h-8 rounded-[var(--radius-badge-md)] p-1.5',
  lg: 'w-10 h-10 rounded-[var(--radius-control)] p-2.5',
  xl: 'w-12 h-12 rounded-[var(--radius-card)] p-3',
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
  const { getSegment } = useTaxonomy();
  const config = getSegment(section);
  const iconKey = config?.iconKey || section;
  const IconComponent = ICON_MAP[iconKey] || ICON_MAP[section] || ShieldAlert;
  const isAccessible = Boolean(ariaLabel);
  const primary = config?.primaryColor || 'var(--ui-action-bg)';
  const background = config?.bgColor || 'var(--ui-surface-subtle)';
  const text = config?.textColor || 'var(--ui-content-primary)';
  const border = config?.borderColor || 'var(--ui-stroke-default)';

  if (variant === 'marker') {
    return (
      <div
        className={`w-8 h-8 min-w-[32px] min-h-[32px] rounded-[var(--radius-pill)] flex items-center justify-center text-ui-content-inverse border-2 border-ui-surface shadow-[var(--elevation-md)] transition-all shrink-0 ${className}`}
        style={{
          backgroundColor: primary,
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
        className={`inline-flex items-center justify-center shrink-0 border shadow-[var(--elevation-2xs)] transition-colors ${CONTAINER_SIZE_CLASSES[size]} ${className}`}
        style={{
          backgroundColor: background,
          color: text,
          borderColor: border,
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
