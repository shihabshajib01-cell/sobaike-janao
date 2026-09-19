import React from 'react';
import {
  SectionKey,
  HERO_TOKENS,
  HERO_SLIDER_TOKENS,
  getHeroCtaStyle,
} from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import {
  isManagedThemePreset,
  useTaxonomy,
} from '../../services/taxonomyService';
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
  deferIllustration?: boolean;
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
  deferIllustration = false,
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
  const { getSegment } = useTaxonomy();
  const sectionKey = section;
  const segmentMeta = getSegment(sectionKey);
  const usesManagedTheme = isManagedThemePreset(segmentMeta?.themeKey);
  const ctaStyle = usesManagedTheme && segmentMeta
    ? ({
        '--hero-cta-text': segmentMeta.textColor,
        '--hero-cta-border': segmentMeta.primaryColor,
        '--hero-cta-hover-bg': segmentMeta.primaryColor,
        '--hero-cta-hover-border': segmentMeta.primaryColor,
        '--hero-cta-hover-text': segmentMeta.colors.filledText,
      } as React.CSSProperties)
    : getHeroCtaStyle(sectionKey);

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
          className={`hero-banner-title type-h1 tracking-tight text-center md:text-left ${language === 'bn' ? 'hero-banner-title-bn' : 'hero-banner-title-en'}`}
          style={{ color: HERO_TOKENS.text.primary }}
        >
          {language === 'bn' ? titleBn : titleEn}
        </HeadingTag>

        {/* Mobile Question / Description (shown < 768px) */}
        {mobileDescription && (
          <p
            className="hero-banner-description block md:hidden type-body text-center max-w-md mx-auto leading-relaxed"
            style={{ color: HERO_TOKENS.text.secondary }}
          >
            {mobileDescription}
          </p>
        )}

        {/* Tablet Short Description (768px - 1023px) */}
        <p
          className="hidden md:block lg:hidden type-body max-w-xl text-left"
          style={{ color: HERO_TOKENS.text.secondary }}
        >
          {language === 'bn' ? descriptionBn : descriptionEn}
        </p>

        {/* Desktop Long Description (>= 1024px) */}
        <p
          className="hidden lg:block type-body max-w-xl text-left"
          style={{ color: HERO_TOKENS.text.secondary }}
        >
          {language === 'bn'
            ? desktopDescriptionBn || descriptionBn
            : desktopDescriptionEn || descriptionEn}
        </p>

        {/* Tablet CTA only (768px–1023px). Hidden on mobile and desktop/large screens. */}
        {action && (
          <div className="hero-slider-cta-row">
            <Button
              id={ctaId}
              variant="outline"
              size="md"
              tabIndex={ctaTabIndex !== undefined ? ctaTabIndex : active ? 0 : -1}
              onClick={action.onClick}
              className="shadow-none btn-hero-cta"
              style={ctaStyle}
            >
              {language === 'bn' ? action.labelBn : action.labelEn}
            </Button>
          </div>
        )}
      </div>

      {/* 3: Mobile/Desktop Illustration */}
      <div className="hero-slider-media">
        {illustrationSrc ? (
          deferIllustration ? (
            <div
              aria-hidden="true"
              data-hero-media-deferred="true"
              className="hero-slider-image hero-desktop-media-framed"
              style={{
                ...({
              '--hero-desktop-media-position': resolvedDesktopMediaPosition,
              '--hero-desktop-media-scale': resolvedDesktopMediaScale,
              ...(resolvedDesktopMediaTranslateY
                ? { '--hero-desktop-media-translate-y': resolvedDesktopMediaTranslateY }
                : {}),
            } as React.CSSProperties),
                aspectRatio: '16 / 9',
                opacity: 0,
              }}
            />
          ) : (
            <img
              src={resolvePublicAsset(illustrationSrc)}
              alt=""
              aria-hidden="true"
              width={1600}
              height={900}
              loading={active ? 'eager' : 'lazy'}
              fetchPriority={active ? 'high' : 'low'}
              decoding="async"
              style={{
              '--hero-desktop-media-position': resolvedDesktopMediaPosition,
              '--hero-desktop-media-scale': resolvedDesktopMediaScale,
              ...(resolvedDesktopMediaTranslateY
                ? { '--hero-desktop-media-translate-y': resolvedDesktopMediaTranslateY }
                : {}),
            } as React.CSSProperties}
              className="hero-slider-image hero-desktop-media-framed"
            />
          )
        ) : (
          <div
            aria-hidden="true"
            className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 ui-radius-card bg-role-surface-subtle/60 ui-border-default border-role-outline-subtle/40 opacity-40 shrink-0 m-4 lg:m-0"
          />
        )}
      </div>

      {/* 4: Mobile CTA (shown on mobile <768px below illustration, hidden on >=768px) */}
      {action && (
        <div className="hero-slider-mobile-cta">
          <Button
            id={ctaId ? `${ctaId}-mobile` : undefined}
            fullWidth
            variant="outline"
            size="md"
            tabIndex={ctaTabIndex !== undefined ? ctaTabIndex : active ? 0 : -1}
            onClick={action.onClick}
            className="shadow-none btn-hero-cta"
            style={ctaStyle}
          >
            {language === 'bn' ? action.labelBn : action.labelEn}
          </Button>
        </div>
      )}
    </div>
  );
};
