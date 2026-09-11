import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionKey } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

export interface CategoryHeroSlide {
  id: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
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

  // Section key for CSS variables
  const sectionKey = section;

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

  // Hover handling with input awareness (fine-pointer mouse only)
  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (typeof window !== 'undefined') {
      const hasFineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (!hasFineHover) return;
    }
    setIsHovered(true);
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
    if (!isMultiSlide || !touchStartRef.current) {
      setIsSwiping(false);
      setIsHovered(false);
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
    setIsHovered(false);
  };

  const handleTouchCancel = () => {
    touchStartRef.current = null;
    setIsSwiping(false);
    setIsHovered(false);
  };

  // Section styling via CSS variables
  const containerStyle: React.CSSProperties = {
    backgroundColor: `var(--sec-${sectionKey}-bg)`,
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
        className={`w-full rounded-2xl border p-4 sm:p-5 md:p-7 shadow-2xs relative overflow-hidden transition-colors ${className}`}
        style={containerStyle}
      >
        <div className="flex items-center justify-between gap-4 md:gap-6 min-h-[130px] sm:min-h-[140px] md:min-h-[160px]">
          {/* Left Text Content */}
          <div className="min-w-0 flex-1 space-y-2 sm:space-y-2.5 text-left z-10">
            <h1 className="type-h1 text-ui-content-primary tracking-tight">
              {language === 'bn' ? slide.titleBn : slide.titleEn}
            </h1>
            <p className="type-body text-ui-content-secondary max-w-2xl">
              {language === 'bn' ? slide.descriptionBn : slide.descriptionEn}
            </p>
            {slide.action && (
              <div className="pt-1.5 sm:pt-2">
                <Button
                  id={`${id}-cta-btn`}
                  variant="primary"
                  size="md"
                  onClick={slide.action.onClick}
                  style={{
                    backgroundColor: `var(--sec-${sectionKey}-primary)`,
                    color: `var(--sec-${sectionKey}-on-primary)`,
                  }}
                  className="w-full sm:w-auto shadow-xs"
                >
                  {language === 'bn' ? slide.action.labelBn : slide.action.labelEn}
                </Button>
              </div>
            )}
          </div>

          {/* Right Illustration Safe Area (Phase 1 Quiet Placeholder) */}
          <div className="shrink-0 w-28 sm:w-40 md:w-52 lg:w-60 h-full min-h-[120px] sm:min-h-[140px] md:min-h-[160px] flex items-center justify-end relative pointer-events-none select-none">
            {slide.illustrationSrc ? (
              <img
                src={slide.illustrationSrc}
                alt=""
                aria-hidden="true"
                className="w-full h-full max-h-[150px] sm:max-h-[170px] md:max-h-[190px] object-contain object-right"
              />
            ) : (
              <div
                aria-hidden="true"
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-2xl bg-ui-surface-subtle/60 border border-ui-stroke-subtle/40 opacity-40 shrink-0"
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
              className="w-full shrink-0 p-4 sm:p-5 md:p-7 min-w-full"
            >
              <div className="flex items-center justify-between gap-4 md:gap-6 min-h-[130px] sm:min-h-[140px] md:min-h-[160px]">
                {/* Left Text Content */}
                <div className="min-w-0 flex-1 space-y-2 sm:space-y-2.5 text-left z-10">
                  {index === 0 ? (
                    <h1 className="type-h1 text-ui-content-primary tracking-tight">
                      {language === 'bn' ? slide.titleBn : slide.titleEn}
                    </h1>
                  ) : (
                    <h2 className="type-h2 text-ui-content-primary tracking-tight">
                      {language === 'bn' ? slide.titleBn : slide.titleEn}
                    </h2>
                  )}

                  <p className="type-body text-ui-content-secondary max-w-2xl">
                    {language === 'bn' ? slide.descriptionBn : slide.descriptionEn}
                  </p>

                  {slide.action && (
                    <div className="pt-1.5 sm:pt-2">
                      <Button
                        id={`${id}-cta-btn-${index}`}
                        variant="primary"
                        size="md"
                        tabIndex={isActive ? 0 : -1}
                        onClick={slide.action.onClick}
                        style={{
                          backgroundColor: `var(--sec-${sectionKey}-primary)`,
                          color: `var(--sec-${sectionKey}-on-primary)`,
                        }}
                        className="w-full sm:w-auto shadow-xs"
                      >
                        {language === 'bn' ? slide.action.labelBn : slide.action.labelEn}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Right Illustration Safe Area */}
                <div className="shrink-0 w-28 sm:w-40 md:w-52 lg:w-60 h-full min-h-[120px] sm:min-h-[140px] md:min-h-[160px] flex items-center justify-end relative pointer-events-none select-none">
                  {slide.illustrationSrc ? (
                    <img
                      src={slide.illustrationSrc}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full max-h-[150px] sm:max-h-[170px] md:max-h-[190px] object-contain object-right"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-2xl bg-ui-surface-subtle/60 border border-ui-stroke-subtle/40 opacity-40 shrink-0"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop / Fine-Pointer Hover Arrows (hidden on touch/coarse devices and viewports < 1440px) */}
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
