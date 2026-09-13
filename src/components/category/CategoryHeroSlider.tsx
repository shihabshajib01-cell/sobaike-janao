import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionKey } from '../../theme/tokens';
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

const AUTOPLAY_INTERVAL = 35_000;

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

const HERO_ART_BACKGROUNDS: Record<SectionKey, string> = {
  harassment: '#FEEAEC',
  rickshaw: '#E4F8EE',
  extortion: '#FEEADE',
  load_shedding: '#FEEDD4',
};

const HERO_CTA_THEMES: Record<SectionKey, string> = {
  harassment: '!bg-transparent !border-[#9E384E] !text-[#9E384E] hover:!bg-[#B84A62] hover:!border-[#B84A62] hover:!text-white',
  rickshaw: '!bg-transparent !border-[#9A520A] !text-[#9A520A] hover:!bg-[#D9822B] hover:!border-[#D9822B] hover:!text-[#050505]',
  extortion: '!bg-transparent !border-[#4F5D95] !text-[#4F5D95] hover:!bg-[#4F5D95] hover:!border-[#4F5D95] hover:!text-white',
  load_shedding: '!bg-transparent !border-[#0A756E] !text-[#0A756E] hover:!bg-[#0D9488] hover:!border-[#0D9488] hover:!text-[#050505]',
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
  const sliderRef = useRef<HTMLDivElement | null>(null);

  // Section key for CSS variables & art background override
  const sectionKey = section;
  const heroBackground =
    HERO_ART_BACKGROUNDS[sectionKey] ??
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

    // Minimum swipe threshold of 45px and predominantly horizontal
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
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
        className={`w-full rounded-2xl border px-4 pt-4 pb-0 sm:px-5 sm:pt-5 sm:pb-0 md:p-6 lg:p-7 shadow-2xs relative overflow-hidden transition-colors ${className}`}
        style={containerStyle}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-0 md:gap-6">
          {/* Left Text Content */}
          <div className="order-1 md:order-none md:col-start-1 md:row-start-1 min-w-0 text-center md:text-left z-10 pb-0 md:pb-0">
            <h1
              className="type-h1 tracking-tight"
              style={{ color: '#102A43' }}
            >
              {language === 'bn' ? slide.titleBn : slide.titleEn}
            </h1>

            {/* Mobile Question */}
            {(slide.mobileDescriptionBn || slide.mobileDescriptionEn) && (
              <p
                className="block md:hidden type-body text-center max-w-md mx-auto mt-1.5 sm:mt-2"
                style={{ color: '#596579' }}
              >
                {language === 'bn' ? slide.mobileDescriptionBn : slide.mobileDescriptionEn}
              </p>
            )}

            {/* Tablet Short Description */}
            <p
              className="hidden md:block lg:hidden type-body max-w-2xl mx-auto md:mx-0 mt-2"
              style={{ color: '#596579' }}
            >
              {language === 'bn' ? slide.descriptionBn : slide.descriptionEn}
            </p>

            {/* Desktop Long Description */}
            <p
              className="hidden lg:block type-body max-w-2xl mx-auto md:mx-0 mt-2"
              style={{ color: '#596579' }}
            >
              {language === 'bn'
                ? (slide.desktopDescriptionBn || slide.descriptionBn)
                : (slide.desktopDescriptionEn || slide.descriptionEn)}
            </p>
          </div>

          {/* Right Illustration Safe Area - Edge to edge on mobile */}
          <div className="order-3 md:order-none md:col-start-2 md:row-start-1 md:row-span-2 -mx-4 sm:-mx-5 md:mx-0 w-[calc(100%+2rem)] sm:w-[calc(100%+2.5rem)] md:w-full flex items-center justify-center md:justify-end relative pointer-events-none select-none">
            {slide.illustrationSrc ? (
              <img
                src={resolvePublicAsset(slide.illustrationSrc)}
                alt=""
                aria-hidden="true"
                className="w-full max-w-full h-auto max-h-[220px] sm:max-h-[260px] md:max-h-[190px] lg:max-h-[220px] object-contain object-center md:object-right mx-auto block"
              />
            ) : (
              <div
                aria-hidden="true"
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-2xl bg-ui-surface-subtle/60 border border-ui-stroke-subtle/40 opacity-40 shrink-0"
              />
            )}
          </div>

          {/* CTA (if exists) */}
          {slide.action && (
            <div className="order-2 md:order-none md:col-start-1 md:row-start-2 pt-3 sm:pt-3.5 pb-4 sm:pb-5 md:pb-0 md:pt-4 w-full flex justify-center md:justify-start">
              <Button
                id={`${id}-cta-btn`}
                variant="outline"
                size="md"
                onClick={slide.action.onClick}
                className={`w-auto shadow-none ${HERO_CTA_THEMES[sectionKey] || ''}`}
              >
                {language === 'bn' ? slide.action.labelBn : slide.action.labelEn}
              </Button>
            </div>
          )}
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
      className={`group w-full rounded-2xl border shadow-2xs relative overflow-hidden transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${className}`}
      style={containerStyle}
    >
      {/* Slides Track */}
      <div
        className={`flex w-full ${
          prefersReducedMotion ? '' : 'transition-transform duration-500 ease-out'
        }`}
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
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
              className="w-full shrink-0 px-4 pt-4 pb-0 sm:px-5 sm:pt-5 sm:pb-0 md:p-6 lg:p-7 min-w-full"
              style={{
                backgroundColor: heroBackground,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-0 md:gap-6">
                {/* Left Text Content */}
                <div className="order-1 md:order-none md:col-start-1 md:row-start-1 min-w-0 text-center md:text-left z-10 pb-0 md:pb-0">
                  {index === 0 ? (
                    <h1
                      className="type-h1 tracking-tight"
                      style={{ color: '#102A43' }}
                    >
                      {language === 'bn' ? slide.titleBn : slide.titleEn}
                    </h1>
                  ) : (
                    <h2
                      className="type-h1 tracking-tight"
                      style={{ color: '#102A43' }}
                    >
                      {language === 'bn' ? slide.titleBn : slide.titleEn}
                    </h2>
                  )}

                  {/* Mobile Question */}
                  {(slide.mobileDescriptionBn || slide.mobileDescriptionEn) && (
                    <p
                      className="block md:hidden type-body text-center max-w-md mx-auto mt-1.5 sm:mt-2"
                      style={{ color: '#596579' }}
                    >
                      {language === 'bn' ? slide.mobileDescriptionBn : slide.mobileDescriptionEn}
                    </p>
                  )}

                  {/* Tablet Short Description */}
                  <p
                    className="hidden md:block lg:hidden type-body max-w-2xl mx-auto md:mx-0 mt-2"
                    style={{ color: '#596579' }}
                  >
                    {language === 'bn' ? slide.descriptionBn : slide.descriptionEn}
                  </p>

                  {/* Desktop Long Description */}
                  <p
                    className="hidden lg:block type-body max-w-2xl mx-auto md:mx-0 mt-2"
                    style={{ color: '#596579' }}
                  >
                    {language === 'bn'
                      ? (slide.desktopDescriptionBn || slide.descriptionBn)
                      : (slide.desktopDescriptionEn || slide.descriptionEn)}
                  </p>
                </div>

                {/* Right Illustration Safe Area - Edge to edge on mobile */}
                <div className="order-3 md:order-none md:col-start-2 md:row-start-1 md:row-span-2 -mx-4 sm:-mx-5 md:mx-0 w-[calc(100%+2rem)] sm:w-[calc(100%+2.5rem)] md:w-full flex items-center justify-center md:justify-end relative pointer-events-none select-none">
                  {slide.illustrationSrc ? (
                    <img
                      src={resolvePublicAsset(slide.illustrationSrc)}
                      alt=""
                      aria-hidden="true"
                      className="w-full max-w-full h-auto max-h-[220px] sm:max-h-[260px] md:max-h-[190px] lg:max-h-[220px] object-contain object-center md:object-right mx-auto block"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-2xl bg-ui-surface-subtle/60 border border-ui-stroke-subtle/40 opacity-40 shrink-0"
                    />
                  )}
                </div>

                {/* CTA (if exists) */}
                {slide.action && (
                  <div className="order-2 md:order-none md:col-start-1 md:row-start-2 pt-3 sm:pt-3.5 pb-4 sm:pb-5 md:pb-0 md:pt-4 w-full flex justify-center md:justify-start">
                    <Button
                      id={`${id}-cta-btn-${index}`}
                      variant="outline"
                      size="md"
                      tabIndex={isActive ? 0 : -1}
                      onClick={slide.action.onClick}
                      className={`w-auto shadow-none ${HERO_CTA_THEMES[sectionKey] || ''}`}
                    >
                      {language === 'bn' ? slide.action.labelBn : slide.action.labelEn}
                    </Button>
                  </div>
                )}
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
        className="hidden [@media(min-width:1440px)_and_(hover:hover)_and_(pointer:fine)]:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-ui-surface/90 hover:bg-ui-surface text-ui-content-primary border border-ui-stroke-subtle shadow-md backdrop-blur-xs items-center justify-center cursor-pointer transition-opacity duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label={language === 'bn' ? 'পরবর্তী স্লাইড' : 'Next slide'}
        className="hidden [@media(min-width:1440px)_and_(hover:hover)_and_(pointer:fine)]:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-ui-surface/90 hover:bg-ui-surface text-ui-content-primary border border-ui-stroke-subtle shadow-md backdrop-blur-xs items-center justify-center cursor-pointer transition-opacity duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
      >
        <ChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>
    </section>
  );
};
