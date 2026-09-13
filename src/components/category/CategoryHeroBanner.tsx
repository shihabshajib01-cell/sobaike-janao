import React from 'react';
import {
  SectionKey,
  HERO_TOKENS,
  HERO_SLIDER_TOKENS,
  getHeroCtaStyle,
} from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

export interface CategoryHeroBannerProps {
  section: SectionKey;
  titleBn: string;
  titleEn: string;
  mobileDescriptionBn?: string;
  mobileDescriptionEn?: string;
  descriptionBn: string;
  descriptionEn: string;
  desktopDescriptionBn?: string;
  desktopDescriptionEn?: string;
  illustrationSrc?: string;
  desktopMediaPosition?: string;
  desktopMediaScale?: number;
  desktopMediaTranslateY?: string;
  action?: {
    labelBn: string;
    labelEn: string;
    onClick: () => void;
  };
  headingLevel?: 'h1' | 'h2';
  active?: boolean;
  ctaId?: string;
  ctaTabIndex?: number;
  className?: string;
}

export const resolvePublicAsset = (src?: string) => {
  if (!src) return src;

  if (
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('data:') ||
    src.startsWith('blob:')
  ) {
    return src;
  }

  const base = import.meta.env.BASE_URL || './';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedSrc = src.replace(/^\/+/, '');

  return `${normalizedBase}${normalizedSrc}`;
};

/**
 * CategoryHeroBanner
 * Canonical presentational banner component extracted directly from CategoryHeroSlider.
 * Visual source of truth for both CategoryHeroSlider and ServiceHeroCarousel.
 */
export const CategoryHeroBanner: React.FC<CategoryHeroBannerProps> = ({
  section,
  titleBn,
  titleEn,
  mobileDescriptionBn,
  mobileDescriptionEn,
  descriptionBn,
  descriptionEn,
  desktopDescriptionBn,
  desktopDescriptionEn,
  illustrationSrc,
  desktopMediaPosition,
  desktopMediaScale,
  desktopMediaTranslateY,
  action,
  headingLevel = 'h1',
  active = true,
  ctaId,
  ctaTabIndex,
  className,
}) => {
  const { language } = useApp();
  const sectionKey = section;

  const resolvedDesktopMediaPosition =
    desktopMediaPosition ??
    HERO_TOKENS.sections[sectionKey]?.desktopMediaPosition ??
    HERO_SLIDER_TOKENS.media.defaultDesktopPosition;

  const resolvedDesktopMediaScale =
    desktopMediaScale ??
    HERO_TOKENS.sections[sectionKey]?.desktopMediaScale ??
    HERO_SLIDER_TOKENS.media.defaultDesktopScale;

  const resolvedDesktopMediaTranslateY =
    desktopMediaTranslateY ??
    HERO_TOKENS.sections[sectionKey]?.desktopMediaTranslateY;

  const HeadingTag = headingLevel;

  const mobileDescription =
    language === 'bn'
      ? mobileDescriptionBn || descriptionBn
      : mobileDescriptionEn || descriptionEn;

  return (
    <div className={`hero-slider-grid ${className || ''}`.trim()}>
      {/* 1 & 2: Title and Description Header (plus Desktop CTA row) */}
      <div className="hero-slider-content">
        <HeadingTag
          className="type-h1 tracking-tight text-center md:text-left"
          style={{ color: HERO_TOKENS.text.primary }}
        >
          {language === 'bn' ? titleBn : titleEn}
        </HeadingTag>

        {/* Mobile Question / Description (shown < 768px) */}
        {mobileDescription && (
          <p
            className="block md:hidden type-body text-center max-w-md mx-auto leading-relaxed"
            style={{ color: HERO_TOKENS.text.secondary }}
          >
            {mobileDescription}
          </p>
        )}

        {/* Tablet Short Description (768px - 1023px) */}
        <p
          className="hidden md:block lg:hidden type-body max-w-xl text-center lg:text-left"
          style={{ color: HERO_TOKENS.text.secondary }}
        >
          {language === 'bn' ? descriptionBn : descriptionEn}
        </p>

        {/* Desktop Long Description (>= 1024px) */}
        <p
          className="hidden lg:block type-body max-w-xl"
          style={{ color: HERO_TOKENS.text.secondary }}
        >
          {language === 'bn'
            ? desktopDescriptionBn || descriptionBn
            : desktopDescriptionEn || descriptionEn}
        </p>

        {/* Desktop/Tablet CTA (hidden on mobile <768px, shown on >=768px) */}
        {action && (
          <div className="hero-slider-cta-row">
            <Button
              id={ctaId}
              variant="outline"
              size="md"
              tabIndex={ctaTabIndex !== undefined ? ctaTabIndex : active ? 0 : -1}
              onClick={action.onClick}
              className="w-auto shadow-none btn-hero-cta"
              style={getHeroCtaStyle(sectionKey)}
            >
              {language === 'bn' ? action.labelBn : action.labelEn}
            </Button>
          </div>
        )}
      </div>

      {/* 3: Mobile/Desktop Illustration */}
      <div className="hero-slider-media">
        {illustrationSrc ? (
          <img
            src={resolvePublicAsset(illustrationSrc)}
            alt=""
            aria-hidden="true"
            style={
              {
                '--hero-desktop-media-position': resolvedDesktopMediaPosition,
                '--hero-desktop-media-scale': resolvedDesktopMediaScale,
                ...(resolvedDesktopMediaTranslateY
                  ? { '--hero-desktop-media-translate-y': resolvedDesktopMediaTranslateY }
                  : {}),
              } as React.CSSProperties
            }
            className="hero-slider-image hero-desktop-media-framed"
          />
        ) : (
          <div
            aria-hidden="true"
            className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 ui-radius-card bg-ui-surface-subtle/60 ui-border-default border-ui-stroke-subtle/40 opacity-40 shrink-0 m-4 lg:m-0"
          />
        )}
      </div>

      {/* 4: Mobile CTA (shown on mobile <768px below illustration, hidden on >=768px) */}
      {action && (
        <div className="hero-slider-mobile-cta">
          <Button
            id={ctaId ? `${ctaId}-mobile` : undefined}
            variant="outline"
            size="md"
            tabIndex={ctaTabIndex !== undefined ? ctaTabIndex : active ? 0 : -1}
            onClick={action.onClick}
            className="w-full shadow-none btn-hero-cta justify-center min-h-[44px]"
            style={getHeroCtaStyle(sectionKey)}
          >
            {language === 'bn' ? action.labelBn : action.labelEn}
          </Button>
        </div>
      )}
    </div>
  );
};
