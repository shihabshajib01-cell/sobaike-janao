import React from 'react';

export interface EvStationIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
  size?: number | string;
  strokeWidth?: number;
  ariaLabel?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
  ariaHidden?: boolean;
  style?: React.CSSProperties;
}

/**
 * EvStationIcon renders the Google Material Symbols Outlined `ev_station` glyph
 * used for Illegal Charging Stations / Rickshaw subcategory reports.
 */
export const EvStationIcon: React.FC<EvStationIconProps> = ({
  className = '',
  size,
  strokeWidth: _strokeWidth,
  ariaLabel,
  'aria-hidden': ariaHiddenAttr,
  ariaHidden,
  style,
  ...rest
}) => {
  const isAccessible = Boolean(ariaLabel);
  const isAriaHidden = !isAccessible && (ariaHiddenAttr === true || ariaHiddenAttr === 'true' || ariaHidden === true);

  // Compute optical font-size and box bounds based on size prop or common Tailwind classes
  const computedStyle: React.CSSProperties = {
    fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
    ...style,
  };

  if (typeof size === 'number') {
    computedStyle.width = `${size}px`;
    computedStyle.height = `${size}px`;
    computedStyle.fontSize = `${size}px`;
  } else if (typeof size === 'string') {
    computedStyle.width = size;
    computedStyle.height = size;
    computedStyle.fontSize = size;
  } else if (className.includes('w-3 h-3') || className.includes('w-3 ') || className.endsWith('w-3')) {
    computedStyle.fontSize = '12px';
  } else if (className.includes('w-3.5')) {
    computedStyle.fontSize = '14px';
  } else if (className.includes('w-4')) {
    computedStyle.fontSize = '16px';
  } else if (className.includes('w-5')) {
    computedStyle.fontSize = '20px';
  } else if (className.includes('w-6')) {
    computedStyle.fontSize = '24px';
  } else {
    computedStyle.fontSize = 'inherit';
  }

  return (
    <span
      className={`material-symbols-outlined select-none inline-flex items-center justify-center shrink-0 leading-none ${className}`}
      style={computedStyle}
      role={isAccessible ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={isAriaHidden ? 'true' : undefined}
      {...rest}
    >
      ev_station
    </span>
  );
};

export default EvStationIcon;
