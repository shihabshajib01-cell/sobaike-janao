import React from 'react';

export interface EvStationIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
  size?: number | string;
  strokeWidth?: number | string;
  'aria-label'?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

/**
 * Google Material Symbols Outlined icon: `ev_station`
 * Authoritative icon for Illegal Charging Stations / Rickshaw category.
 * Renders the Material Symbols font glyph instead of a custom SVG path.
 */
export const EvStationIcon = React.forwardRef<HTMLSpanElement, EvStationIconProps>(
  (
    {
      className = '',
      size,
      strokeWidth: _strokeWidth,
      style,
      'aria-hidden': ariaHidden,
      'aria-label': ariaLabel,
      role,
      ...props
    },
    ref
  ) => {
    let resolvedFontSize: string;

    if (typeof size === 'number') {
      resolvedFontSize = `${size}px`;
    } else if (typeof size === 'string' && size) {
      const sizeMap: Record<string, string> = {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '20px',
        xl: '24px',
      };
      resolvedFontSize = sizeMap[size] || (size.match(/^[0-9]+$/) ? `${size}px` : size);
    } else {
      // Resolve optical font size from Tailwind dimensions in className if present
      if (/\b(?:w|h)-3\b/.test(className)) resolvedFontSize = '12px';
      else if (/\b(?:w|h)-3\.5\b/.test(className)) resolvedFontSize = '14px';
      else if (/\b(?:w|h)-4\b/.test(className)) resolvedFontSize = '16px';
      else if (/\b(?:w|h)-5\b/.test(className)) resolvedFontSize = '20px';
      else if (/\b(?:w|h)-6\b/.test(className)) resolvedFontSize = '24px';
      else if (/\b(?:w|h)-7\b/.test(className)) resolvedFontSize = '28px';
      else if (/\b(?:w|h)-8\b/.test(className)) resolvedFontSize = '32px';
      else resolvedFontSize = '20px';
    }

    const isAccessible = Boolean(ariaLabel);

    return (
      <span
        ref={ref}
        className={`material-symbols-outlined shrink-0 ${className}`.trim()}
        style={{
          fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
          fontSize: resolvedFontSize,
          lineHeight: 1,
          color: 'currentColor',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          ...(size ? { width: resolvedFontSize, height: resolvedFontSize } : {}),
          ...style,
        }}
        aria-hidden={isAccessible ? undefined : (ariaHidden !== undefined ? ariaHidden : 'true')}
        aria-label={ariaLabel}
        role={role || (isAccessible ? 'img' : undefined)}
        {...props}
      >
        ev_station
      </span>
    );
  }
);

EvStationIcon.displayName = 'EvStationIcon';

export default EvStationIcon;
