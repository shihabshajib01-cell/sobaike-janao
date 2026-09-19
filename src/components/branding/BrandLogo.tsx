import React from 'react';
import { useApp } from '../../context/AppContext';

export interface BrandLogoProps {
  variant?: 'compact' | 'full';
  size?: 'sm' | 'md' | 'lg';
  showEnglish?: boolean;
  englishClassName?: string;
  className?: string;
  onClick?: () => void;
  id?: string;
  'aria-label'?: string;
}

const getBrandAsset = (fileName: string) => {
  const base = import.meta.env.BASE_URL;
  if (!base || base === '/') {
    return `/brand/${fileName}`;
  }
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}brand/${fileName}`;
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'compact',
  size = 'md',
  className = '',
  onClick,
  id,
  'aria-label': customAriaLabel,
}) => {
  const { language } = useApp();

  const defaultAriaLabel =
    language === 'bn' ? 'সবাইকে জানাও — মূলপাতা' : 'Sobaike Janao — Home';
  const ariaLabel = customAriaLabel || defaultAriaLabel;

  const logoSizes = {
    sm: 'h-8 max-w-[124px]',
    md: 'h-10 max-w-[156px]',
    lg: 'h-12 max-w-[190px]',
  };

  const imageClass =
    'h-full w-auto max-w-full object-contain shrink-0 select-none';

  const brandContent = (
    <div
      className={`relative inline-flex items-center min-w-0 ${logoSizes[size]} ${className}`}
    >
      <img
        src={getBrandAsset('sobaike-janao-wordmark.webp')}
        alt=""
        aria-hidden="true"
        width={360}
        height={109}
        className={`block dark:hidden ${imageClass}`}
      />
      <img
        src={getBrandAsset('sobaike-janao-wordmark-dark.webp')}
        alt=""
        aria-hidden="true"
        width={1200}
        height={400}
        className={`hidden dark:block ${imageClass}`}
      />
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        id={id}
        onClick={onClick}
        aria-label={ariaLabel}
        className={`inline-flex items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus transition-colors cursor-pointer min-w-0 ${
          variant === 'full'
            ? 'rounded-[var(--radius-badge-md)]'
            : 'rounded-[var(--radius-control)] p-0.5 sm:p-1'
        }`}
      >
        {brandContent}
      </button>
    );
  }

  return (
    <div id={id} className="inline-flex items-center min-w-0">
      {brandContent}
    </div>
  );
};
