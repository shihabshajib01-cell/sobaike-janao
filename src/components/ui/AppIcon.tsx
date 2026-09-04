import React from 'react';
import {
  MapPin,
  Calendar,
  Share2,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Clock,
  User,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Minus,
  RotateCcw,
  Search,
  Filter,
  Layers,
  Compass,
  Eye,
  FileText,
  HeartHandshake,
  Zap,
  ZapOff,
  Building,
  ShieldAlert,
  HelpCircle,
  Home,
  Globe,
  PlusCircle,
  Shield,
  CheckCircle,
  LucideIcon,
} from 'lucide-react';
import { SectionKey } from '../../theme/tokens';

export type AppIconName =
  | 'home'
  | 'globe'
  | 'plus-circle'
  | 'shield'
  | 'check-circle'
  | 'map-pin'
  | 'calendar'
  | 'share'
  | 'arrow-right'
  | 'arrow-left'
  | 'check'
  | 'alert-circle'
  | 'clock'
  | 'user'
  | 'info'
  | 'external-link'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'close'
  | 'plus'
  | 'minus'
  | 'reset'
  | 'search'
  | 'filter'
  | 'layers'
  | 'compass'
  | 'eye'
  | 'file-text'
  | 'help'
  | 'harassment'
  | 'rickshaw'
  | 'extortion'
  | 'zap-off'
  | 'building'
  | 'load-shedding'
  | 'illegal-occupation';

export type AppIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AppIconProps {
  name: AppIconName;
  size?: AppIconSize;
  strokeWidth?: number;
  className?: string;
  ariaLabel?: string;
  ariaHidden?: boolean;
}

const ICON_REGISTRY: Record<AppIconName, LucideIcon> = {
  home: Home,
  globe: Globe,
  'plus-circle': PlusCircle,
  shield: Shield,
  'check-circle': CheckCircle,
  'map-pin': MapPin,
  calendar: Calendar,
  share: Share2,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  check: Check,
  'alert-circle': AlertCircle,
  clock: Clock,
  user: User,
  info: Info,
  'external-link': ExternalLink,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  close: X,
  plus: Plus,
  minus: Minus,
  reset: RotateCcw,
  search: Search,
  filter: Filter,
  layers: Layers,
  compass: Compass,
  eye: Eye,
  'file-text': FileText,
  help: HelpCircle,
  harassment: HeartHandshake,
  rickshaw: Zap,
  extortion: ShieldAlert,
  'zap-off': ZapOff,
  building: Building,
  'load-shedding': ZapOff,
  'illegal-occupation': Building,
};

const SIZE_MAP: Record<AppIconSize, string> = {
  xs: 'w-3 h-3', // 12px
  sm: 'w-3.5 h-3.5', // 14px
  md: 'w-4 h-4', // 16px
  lg: 'w-5 h-5', // 20px
  xl: 'w-6 h-6', // 24px
};

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 'md',
  strokeWidth = 2,
  className = '',
  ariaLabel,
  ariaHidden = true,
}) => {
  const Component = ICON_REGISTRY[name] || HelpCircle;
  const isAccessible = Boolean(ariaLabel);

  return (
    <Component
      className={`${SIZE_MAP[size]} shrink-0 ${className}`}
      strokeWidth={strokeWidth}
      role={isAccessible ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={!isAccessible && ariaHidden ? 'true' : undefined}
    />
  );
};
