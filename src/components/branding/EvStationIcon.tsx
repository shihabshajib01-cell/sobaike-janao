import React from 'react';

export interface EvStationIconProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
  className?: string;
  size?: number | string;
  strokeWidth?: number | string;
  'aria-label'?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

const SIZE_CLASSES: Record<string, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

/**
 * Self-contained EV charging-station icon used for the Rickshaw / Illegal Charging category.
 *
 * This intentionally renders as SVG instead of a font ligature. The previous Material Symbols
 * implementation depended on the external "Material Symbols Outlined" webfont; when that font was
 * unavailable, browsers exposed the literal fallback text "ev_station" throughout the UI.
 */
export const EvStationIcon = React.forwardRef<SVGSVGElement, EvStationIconProps>(
  (
    {
      className = '',
      size,
      strokeWidth = 2,
      'aria-hidden': ariaHidden,
      'aria-label': ariaLabel,
      role,
      ...props
    },
    ref
  ) => {
    const namedSizeClass =
      typeof size === 'string' && SIZE_CLASSES[size] ? SIZE_CLASSES[size] : '';
    const explicitSize =
      typeof size === 'number' ||
      (typeof size === 'string' && size && !SIZE_CLASSES[size])
        ? size
        : undefined;
    const isAccessible = Boolean(ariaLabel);

    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        width={explicitSize}
        height={explicitSize}
        className={`shrink-0 ${namedSizeClass} ${className}`.trim()}
        role={role || (isAccessible ? 'img' : undefined)}
        aria-label={ariaLabel}
        aria-hidden={
          isAccessible
            ? undefined
            : ariaHidden !== undefined
              ? ariaHidden
              : 'true'
        }
        {...props}
      >
        <rect x="4" y="3" width="10" height="18" rx="2" />
        <path d="M7 7h4" />
        <path d="M7 17h4" />
        <path d="m8.4 9.5 2.8 2.4-2.2 3.1" />
        <path d="M14 7h2a2 2 0 0 1 2 2v2.5" />
        <path d="M17 11.5h2v3h-2z" />
        <path d="M18 14.5V18a2 2 0 0 1-2 2h-2" />
      </svg>
    );
  }
);

EvStationIcon.displayName = 'EvStationIcon';

export default EvStationIcon;
