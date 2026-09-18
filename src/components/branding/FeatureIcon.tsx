import React from 'react';
import {
  AlertTriangle,
  Building2,
  CircleDot,
  HeartHandshake,
  LucideIcon,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  TrafficCone,
  ZapOff,
} from 'lucide-react';
import { EvStationIcon } from './EvStationIcon';
import { SectionKey } from '../../theme/tokens';

export type FeatureIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type FeatureIconVariant = 'standard' | 'container' | 'marker' | 'badge';

export interface FeatureIconPalette {
  primary?: string;
  background?: string;
  border?: string;
  text?: string;
}

export interface FeatureIconProps {
  section: SectionKey;
  iconKey?: string;
  palette?: FeatureIconPalette;
  size?: FeatureIconSize;
  variant?: FeatureIconVariant;
  className?: string;
  strokeWidth?: number;
  ariaLabel?: string;
}

const ICON_MAP: Partial<Record<SectionKey, LucideIcon | React.ComponentType<any>>> = {
  harassment: HeartHandshake,
  extortion: ShieldAlert,
  public_safety: ShieldCheck,
  road_transport: TrafficCone,
  load_shedding: ZapOff,
  illegal_occupation: Building2,
  rickshaw: EvStationIcon,
};

const CUSTOM_ICON_MAP: Record<string, LucideIcon | React.ComponentType<any>> = {
  shield: ShieldCheck,
  alert: ShieldAlert,
  heart: HeartHandshake,
  road: TrafficCone,
  building: Building2,
  bolt: ZapOff,
  map: MapPin,
  warning: AlertTriangle,
  dot: CircleDot,
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

export const FeatureIcon: React.FC<FeatureIconProps> = ({
  section,
  iconKey,
  palette,
  size = 'md',
  variant = 'standard',
  className = '',
  strokeWidth = 2,
  ariaLabel,
}) => {
  const IconComponent =
    (iconKey ? CUSTOM_ICON_MAP[iconKey] : undefined) ||
    ICON_MAP[section] ||
    ShieldAlert;
  const isAccessible = Boolean(ariaLabel);

  if (variant === 'marker') {
    return (
      <div
        className={`w-8 h-8 min-w-[32px] min-h-[32px] rounded-[var(--radius-pill)] flex items-center justify-center text-ui-content-inverse border-2 border-ui-surface shadow-[var(--elevation-md)] transition-all shrink-0 ${className}`}
        style={{
          backgroundColor:
            palette?.primary ||
            `var(--sec-${section}-primary, var(--ui-accent))`,
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
          backgroundColor:
            palette?.background ||
            `var(--sec-${section}-bg, var(--ui-surface-subtle))`,
          color:
            palette?.text ||
            `var(--sec-${section}-text, var(--ui-content-primary))`,
          borderColor:
            palette?.border ||
            `var(--sec-${section}-border, var(--ui-stroke-subtle))`,
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
      style={palette?.text ? { color: palette.text } : undefined}
      strokeWidth={strokeWidth}
      role={isAccessible ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={!isAccessible ? 'true' : undefined}
    />
  );
};
