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
    return `./brand/${fileName}`;
  }
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}brand/${fileName}`;
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'compact',
  size = 'md',
  showEnglish = true,
  englishClassName,
  className = '',
  onClick,
  id,
  'aria-label': customAriaLabel,
}) => {
  const { language } = useApp();

  const defaultAriaLabel =
    language === 'bn' ? 'সবাইকে জানাও — মূলপাতা' : 'Sobaike Janao — Home';
  const ariaLabel = customAriaLabel || defaultAriaLabel;

  if (variant === 'full') {
    const fullSizes = {
      sm: 'h-8 max-w-[180px]',
      md: 'h-10 max-w-[220px]',
      lg: 'h-12 max-w-[260px]',
    };

    const content = (
      <div className={`relative inline-flex items-center ${fullSizes[size]} ${className}`}>
        {/* Light Mode Wordmark */}
        <img
          src={getBrandAsset('sobaike-janao-logo-light.png')}
          alt="সবাইকে জানাও (Sobaike Janao)"
          className="block dark:hidden object-contain h-full w-auto select-none"
        />
        {/* Dark Mode Wordmark */}
        <img
          src={getBrandAsset('sobaike-janao-logo-dark.png')}
          alt="সবাইকে জানাও (Sobaike Janao)"
          className="hidden dark:block object-contain h-full w-auto select-none"
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
          className="inline-flex items-center text-left focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] rounded-lg transition-colors cursor-pointer"
        >
          {content}
        </button>
      );
    }

    return (
      <div id={id} className="inline-flex items-center">
        {content}
      </div>
    );
  }

  // Compact Navigation Brand: Mark (Image) + Live Responsive HTML Text
  // Mark Sizes (Explicit dimensions to prevent CLS layout shift)
  const markDimensions = {
    sm: { width: 32, height: 32, imgClass: 'w-8 h-8' },
    md: { width: 36, height: 36, imgClass: 'w-9 h-9' },
    lg: { width: 44, height: 44, imgClass: 'w-11 h-11' },
  };

  const textStyles = {
    sm: {
      bangla: 'text-[15px] sm:text-[16px] font-bold leading-tight text-primary tracking-tight whitespace-nowrap',
      english: 'hidden min-[380px]:block text-[11px] sm:text-[12px] leading-tight font-medium text-secondary tracking-normal whitespace-nowrap',
      gap: 'gap-1.5 sm:gap-2.5',
    },
    md: {
      bangla: 'text-[18px] leading-[24px] font-bold text-primary tracking-tight whitespace-nowrap',
      english: 'text-[14px] leading-tight font-medium text-secondary tracking-normal whitespace-nowrap',
      gap: 'gap-3',
    },
    lg: {
      bangla: 'text-[20px] leading-[26px] font-bold text-primary tracking-tight whitespace-nowrap',
      english: 'text-[15px] leading-tight font-medium text-secondary tracking-normal whitespace-nowrap',
      gap: 'gap-3.5',
    },
  };

  const dim = markDimensions[size];
  const style = textStyles[size];

  const brandContent = (
    <div className={`flex items-center ${style.gap} select-none ${className}`}>
      {/* Official Sobaike Janao Teal Logo Mark */}
      <img
        src={getBrandAsset('sobaike-janao-mark-512.png')}
        alt=""
        aria-hidden="true"
        width={dim.width}
        height={dim.height}
        className={`${dim.imgClass} object-contain shrink-0 select-none`}
      />

      {/* Semantic Accessible Live HTML Wordmark */}
      <div className="flex flex-col text-left">
        <span className={style.bangla}>
          সবাইকে জানাও
        </span>
        {showEnglish && (
          <span className={englishClassName || style.english}>
            Sobaike Janao
          </span>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        id={id}
        onClick={onClick}
        aria-label={ariaLabel}
        className="flex items-center text-left focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] rounded-xl p-1 transition-colors cursor-pointer"
      >
        {brandContent}
      </button>
    );
  }

  return (
    <div id={id} className="flex items-center">
      {brandContent}
    </div>
  );
};
