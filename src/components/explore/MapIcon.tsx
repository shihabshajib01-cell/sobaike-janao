import React from 'react';
import {
  MapPin,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  Map,
  LayoutGrid,
  Search,
  Filter,
  X,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Navigation,
  Info,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Calendar,
  AlertCircle,
  LucideIcon,
  HeartHandshake,
  Zap,
  ShieldAlert,
  Building2,
} from 'lucide-react';
import { SectionKey } from '../../theme/tokens';

export type MapIconName =
  | 'map-pin'
  | 'pin'
  | 'compass'
  | 'layers'
  | 'zoom-in'
  | 'zoom-out'
  | 'plus'
  | 'minus'
  | 'reset'
  | 'locate'
  | 'crosshair'
  | 'map'
  | 'list'
  | 'search'
  | 'filter'
  | 'close'
  | 'expand'
  | 'collapse'
  | 'navigation'
  | 'info'
  | 'external-link'
  | 'arrow-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'calendar'
  | 'alert-circle'
  | 'building'
  | 'harassment'
  | 'rickshaw'
  | 'extortion';

export type MapIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface MapIconProps {
  name: MapIconName;
  size?: MapIconSize;
  strokeWidth?: number;
  className?: string;
  ariaLabel?: string;
  ariaHidden?: boolean;
}

const MAP_ICON_REGISTRY: Record<MapIconName, LucideIcon> = {
  'map-pin': MapPin,
  pin: MapPin,
  compass: Compass,
  layers: Layers,
  'zoom-in': ZoomIn,
  'zoom-out': ZoomOut,
  plus: Plus,
  minus: Minus,
  reset: RotateCcw,
  locate: Crosshair,
  crosshair: Crosshair,
  map: Map,
  list: LayoutGrid,
  search: Search,
  filter: Filter,
  close: X,
  expand: Maximize2,
  collapse: Minimize2,
  navigation: Navigation,
  info: Info,
  'external-link': ExternalLink,
  'arrow-right': ChevronRight,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  calendar: Calendar,
  'alert-circle': AlertCircle,
  building: Building2,
  harassment: HeartHandshake,
  rickshaw: Zap,
  extortion: ShieldAlert,
};

const MAP_SIZE_MAP: Record<MapIconSize, string> = {
  xs: 'w-3 h-3', // 12px
  sm: 'w-3.5 h-3.5', // 14px
  md: 'w-4 h-4', // 16px
  lg: 'w-5 h-5', // 20px
  xl: 'w-6 h-6', // 24px
};

/**
 * Standardized MapIcon component for all map exploration controls,
 * layer tools, pins, zoom triggers, and legends.
 * Enforces uniform stroke-width (default: 2) and optical sizing.
 */
export const MapIcon: React.FC<MapIconProps> = ({
  name,
  size = 'md',
  strokeWidth = 2,
  className = '',
  ariaLabel,
  ariaHidden = true,
}) => {
  const IconComponent = MAP_ICON_REGISTRY[name] || MapPin;
  const isAccessible = Boolean(ariaLabel);

  return (
    <IconComponent
      className={`${MAP_SIZE_MAP[size]} shrink-0 ${className}`}
      strokeWidth={strokeWidth}
      role={isAccessible ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={!isAccessible && ariaHidden ? 'true' : undefined}
    />
  );
};

export default MapIcon;
