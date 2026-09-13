import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  SectionKey,
  HERO_TOKENS,
  HERO_SLIDER_TOKENS,
  HERO_SLIDER_BEHAVIOR,
  getHeroCtaStyle,
} from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

export interface CategoryHeroSlide {
  id: string;
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
  action?: {
    labelBn: string;
    labelEn: string;
    onClick: () => void;
  };
}

export interface CategoryHeroSliderProps {
  id?: string;
  section: SectionKey;
  slides: CategoryHeroSlide[];
  className?: string;
}

const AUTOPLAY_INTERVAL = HERO_SLIDER_BEHAVIOR.autoplayIntervalMs;

const resolvePublicAsset = (src?: string) => {
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

export const CategoryHeroSlider: React.FC<CategoryHeroSliderProps> = ({
  id = 'category-hero-slider',
  section,
  slides,
  className = '',
}) => {
  const { language } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const timerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const sliderRef = useRef<HTMLElement | null>(null);

  // Section key for CSS variables & art background override
  const sectionKey = section;
  const heroBackground =
    HERO_TOKENS.sections[sectionKey]?.background ??
    `var(--sec-${sectionKey}-bg)`;

  const totalSlides = slides.length;
  const isMultiSlide = totalSlides > 1;

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Track document visibility
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handlePrev = useCallback(() => {
    if (!isMultiSlide) return;
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [isMultiSlide, totalSlides]);

  const handleNext = useCallback(() => {
    if (!isMultiSlide) return;
    setCurrentIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  }, [isMultiSlide, totalSlides]);

  // Autoplay management
  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (
      !isMultiSlide ||
      prefersReducedMotion ||
      isHovered ||
      isFocused ||
      isSwiping ||
      !isDocumentVisible
    ) {
      return;
    }

    timerRef.current = window.setTimeout(() => {
      handleNext();
    }, AUTOPLAY_INTERVAL);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    isMultiSlide,
    currentIndex,
    prefersReducedMotion,
    isHovered,
    isFocused,
    isSwiping,
    isDocumentVisible,
    handleNext,
  ]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isMultiSlide) return;

    // Do not trigger carousel navigation when event originates from an interactive child
    const target = e.target as HTMLElement | null;
    if (target && target !== sliderRef.current) {
      const isInteractive =
        target.closest('button, a, input, textarea, select, [role="button"], [role="link"], [role="textbox"]') !== null ||
        target.isContentEditable;
      if (isInteractive) {
        return;
      }
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  // Pointer-safe hover handling (ignores touch / coarse pointers)
  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setIsHovered(true);
    }
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      setIsHovered(false);
    }
  };

  // Touch / Pointer gestures for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMultiSlide) return;
    setIsHovered(false);
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsSwiping(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsHovered(false);
    if (!isMultiSlide || !touchStartRef.current) {
      setIsSwiping(false);
      return;
    }
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;

    // Minimum swipe threshold and predominantly horizontal
    if (
      Math.abs(diffX) > HERO_SLIDER_BEHAVIOR.swipeThresholdPx &&
      Math.abs(diffX) > Math.abs(diffY) * HERO_SLIDER_BEHAVIOR.swipeDominanceRatio
    ) {
      if (diffX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartRef.current = null;
    setIsSwiping(false);
  };

  const handleTouchCancel = () => {
    setIsHovered(false);
    touchStartRef.current = null;
    setIsSwiping(false);
  };

  // Section styling via CSS variables & art background override
  const containerStyle: React.CSSProperties = {
    backgroundColor: heroBackground,
    borderColor: `var(--sec-${sectionKey}-border)`,
    touchAction: 'pan-y',
  };

  if (!slides || slides.length === 0) {
    return null;
  }

  // Single slide (no slider overhead, static clean presentation)
  if (!isMultiSlide) {
    const slide = slides[0];
    return (
      <section
        id={id}
        className={`w-full ui-radius-card ui-border-default ui-elevation-card relative overflow-hidden transition-colors ${className}`}
        style={containerStyle}
      >
        <div className="hero-slider-grid">
          {/* Left 50% Content Column */}
          <div className="hero-slider-content">
            <h1
              className="type-h1 tracking-tight"
              style={{ color: HERO_TOKENS.text.primary }}
            >
              {language === 'bn' ? slide.titleBn : slide.titleEn}
            </h1>

            {/* Mobile Question */}
            {(slide.mobileDescriptionBn || slide.mobileDescriptionEn) && (
              <p
                className="block md:hidden type-body text-center max-w-md mx-auto"
                style={{ color: HERO_TOKENS.text.secondary }}
              >
                {language === 'bn' ? slide.mobileDescriptionBn : slide.mobileDescriptionEn}
              </p>
            )}

            {/* Tablet Short Description */}
            <p
              className="hidden md:block lg:hidden type-body max-w-xl text-center lg:text-left"
              style={{ color: HERO_TOKENS.text.secondary }}
            >
              {language === 'bn' ? slide.descriptionBn : slide.descriptionEn}
            </p>

            {/* Desktop Long Description */}
            <p
              className="hidden lg:block type-body max-w-xl"
              style={{ color: HERO_TOKENS.text.secondary }}
            >
              {language === 'bn'
                ? (slide.desktopDescriptionBn || slide.descriptionBn)
                : (slide.desktopDescriptionEn || slide.descriptionEn)}
            </p>

            {/* CTA (if exists) */}
            {slide.action && (
              <div className="hero-slider-cta-row">
                <Button
                  id={`${id}-cta-btn`}
                  variant="outline"
                  size="md"
                  onClick={slide.action.onClick}
                  className="w-auto shadow-none btn-hero-cta"
                  style={getHeroCtaStyle(sectionKey)}
                >
                  {language === 'bn' ? slide.action.labelBn : slide.action.labelEn}
                </Button>
              </div>
            )}
          </div>

          {/* Right 50% Illustration Column */}
          <div className="hero-slider-media">
            {slide.illustrationSrc ? (
              (() => {
                const resolvedDesktopMediaPosition =
                  slide.desktopMediaPosition ??
                  HERO_TOKENS.sections[sectionKey]?.desktopMediaPosition ??
                  HERO_SLIDER_TOKENS.media.defaultDesktopPosition;
                const resolvedDesktopMediaScale =
                  slide.desktopMediaScale ??
                  HERO_TOKENS.sections[sectionKey]?.desktopMediaScale ??
                  HERO_SLIDER_TOKENS.media.defaultDesktopScale;

                return (
                  <img
                    src={resolvePublicAsset(slide.illustrationSrc)}
                    alt=""
                    aria-hidden="true"
                    style={{
                      '--hero-desktop-media-position': resolvedDesktopMediaPosition,
                      '--hero-desktop-media-scale': resolvedDesktopMediaScale,
                    } as React.CSSProperties}
                    className="hero-slider-image hero-desktop-media-framed"
                  />
                );
              })()
            ) : (
              <div
                aria-hidden="true"
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 ui-radius-card bg-ui-surface-subtle/60 ui-border-default border-ui-stroke-subtle/40 opacity-40 shrink-0 m-4 lg:m-0"
              />
            )}
          </div>
        </div>
      </section>
    );
  }

  // Multi-slide Carousel
  return (
    <section
      id={id}
      ref={sliderRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={
        language === 'bn'
          ? 'সেবা ক্যাটাগরি ব্যানার স্লাইডার'
          : 'Service category hero slider'
      }
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className={`group w-full ui-radius-card ui-border-default ui-elevation-card relative overflow-hidden transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${className}`}
      style={containerStyle}
    >
      {/* Slides Track */}
      <div
        className={`hero-slider-track ${
          prefersReducedMotion ? '!transition-none' : ''
        }`}
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transitionDuration: prefersReducedMotion
            ? '0ms'
            : `${HERO_SLIDER_BEHAVIOR.transitionDurationMs}ms`,
        }}
      >
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={
                language === 'bn'
                  ? `স্লাইড ${index + 1} / ${totalSlides}`
                  : `Slide ${index + 1} of ${totalSlides}`
              }
              aria-hidden={!isActive}
              className="w-full shrink-0 min-w-full p-0"
              style={{
                backgroundColor: heroBackground,
              }}
            >
              <div className="hero-slider-grid">
                {/* Left 50% Content Column */}
                <div className="hero-slider-content">
                  {index === 0 ? (
                    <h1
                      className="type-h1 tracking-tight"
                      style={{ color: HERO_TOKENS.text.primary }}
                    >
                      {language === 'bn' ? slide.titleBn : slide.titleEn}
                    </h1>
                  ) : (
                    <h2
                      className="type-h1 tracking-tight"
                      style={{ color: HERO_TOKENS.text.primary }}
                    >
                      {language === 'bn' ? slide.titleBn : slide.titleEn}
                    </h2>
                  )}

                  {/* Mobile Question */}
                  {(slide.mobileDescriptionBn || slide.mobileDescriptionEn) && (
                    <p
                      className="block md:hidden type-body text-center max-w-md mx-auto"
                      style={{ color: HERO_TOKENS.text.secondary }}
                    >
                      {language === 'bn' ? slide.mobileDescriptionBn : slide.mobileDescriptionEn}
                    </p>
                  )}

                  {/* Tablet Short Description */}
                  <p
                    className="hidden md:block lg:hidden type-body max-w-xl text-center lg:text-left"
                    style={{ color: HERO_TOKENS.text.secondary }}
                  >
                    {language === 'bn' ? slide.descriptionBn : slide.descriptionEn}
                  </p>

                  {/* Desktop Long Description */}
                  <p
                    className="hidden lg:block type-body max-w-xl"
                    style={{ color: HERO_TOKENS.text.secondary }}
                  >
                    {language === 'bn'
                      ? (slide.desktopDescriptionBn || slide.descriptionBn)
                      : (slide.desktopDescriptionEn || slide.descriptionEn)}
                  </p>

                  {/* CTA (if exists) */}
                  {slide.action && (
                    <div className="hero-slider-cta-row">
                      <Button
                        id={`${id}-cta-btn-${index}`}
                        variant="outline"
                        size="md"
                        tabIndex={isActive ? 0 : -1}
                        onClick={slide.action.onClick}
                        className="w-auto shadow-none btn-hero-cta"
                        style={getHeroCtaStyle(sectionKey)}
                      >
                        {language === 'bn' ? slide.action.labelBn : slide.action.labelEn}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Right 50% Illustration Column */}
                <div className="hero-slider-media">
                  {slide.illustrationSrc ? (
                    (() => {
                      const resolvedDesktopMediaPosition =
                        slide.desktopMediaPosition ??
                        HERO_TOKENS.sections[sectionKey]?.desktopMediaPosition ??
                        HERO_SLIDER_TOKENS.media.defaultDesktopPosition;
                      const resolvedDesktopMediaScale =
                        slide.desktopMediaScale ??
                        HERO_TOKENS.sections[sectionKey]?.desktopMediaScale ??
                        HERO_SLIDER_TOKENS.media.defaultDesktopScale;

                      return (
                        <img
                          src={resolvePublicAsset(slide.illustrationSrc)}
                          alt=""
                          aria-hidden="true"
                          style={{
                            '--hero-desktop-media-position': resolvedDesktopMediaPosition,
                            '--hero-desktop-media-scale': resolvedDesktopMediaScale,
                          } as React.CSSProperties}
                          className="hero-slider-image hero-desktop-media-framed"
                        />
                      );
                    })()
                  ) : (
                    <div
                      aria-hidden="true"
                      className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 ui-radius-card bg-ui-surface-subtle/60 ui-border-default border-ui-stroke-subtle/40 opacity-40 shrink-0 m-4 lg:m-0"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Large-Desktop (>=1440px) / Fine-Pointer Hover Arrows */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label={language === 'bn' ? 'পূর্ববর্তী স্লাইড' : 'Previous slide'}
        className="hero-slider-arrow hero-slider-arrow-prev"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label={language === 'bn' ? 'পরবর্তী স্লাইড' : 'Next slide'}
        className="hero-slider-arrow hero-slider-arrow-next"
      >
        <ChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>
    </section>
  );
};
