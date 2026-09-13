import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  SectionKey,
  HERO_TOKENS,
  HERO_SLIDER_BEHAVIOR,
  getHeroSliderCssVars,
} from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { CategoryHeroBanner } from './CategoryHeroBanner';
import { IconButton } from '../ui/IconButton';

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
  desktopMediaTranslateY?: string;
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
    ...getHeroSliderCssVars(),
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
        <CategoryHeroBanner
          section={sectionKey}
          titleBn={slide.titleBn}
          titleEn={slide.titleEn}
          mobileDescriptionBn={slide.mobileDescriptionBn}
          mobileDescriptionEn={slide.mobileDescriptionEn}
          descriptionBn={slide.descriptionBn}
          descriptionEn={slide.descriptionEn}
          desktopDescriptionBn={slide.desktopDescriptionBn}
          desktopDescriptionEn={slide.desktopDescriptionEn}
          illustrationSrc={slide.illustrationSrc}
          desktopMediaPosition={slide.desktopMediaPosition}
          desktopMediaScale={slide.desktopMediaScale}
          desktopMediaTranslateY={slide.desktopMediaTranslateY}
          action={slide.action}
          headingLevel="h1"
          active={true}
          ctaId={`${id}-cta-btn`}
          ctaTabIndex={0}
        />
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
          ...(prefersReducedMotion ? { transitionDuration: '0ms' } : {}),
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
              className="w-full shrink-0 min-w-full p-0 flex flex-col"
              style={{
                backgroundColor: heroBackground,
              }}
            >
              <CategoryHeroBanner
                section={sectionKey}
                titleBn={slide.titleBn}
                titleEn={slide.titleEn}
                mobileDescriptionBn={slide.mobileDescriptionBn}
                mobileDescriptionEn={slide.mobileDescriptionEn}
                descriptionBn={slide.descriptionBn}
                descriptionEn={slide.descriptionEn}
                desktopDescriptionBn={slide.desktopDescriptionBn}
                desktopDescriptionEn={slide.desktopDescriptionEn}
                illustrationSrc={slide.illustrationSrc}
                desktopMediaPosition={slide.desktopMediaPosition}
                desktopMediaScale={slide.desktopMediaScale}
                desktopMediaTranslateY={slide.desktopMediaTranslateY}
                action={slide.action}
                headingLevel={index === 0 ? 'h1' : 'h2'}
                active={isActive}
                ctaId={`${id}-cta-btn-${index}`}
                ctaTabIndex={isActive ? 0 : -1}
              />
            </div>
          );
        })}
      </div>

      {/* Large-Desktop (>=1440px) / Fine-Pointer Hover Arrows */}
      <IconButton
        variant="outline"
        size="md"
        onClick={handlePrev}
        aria-label={language === 'bn' ? 'পূর্ববর্তী স্লাইড' : 'Previous slide'}
        icon={<ChevronLeft aria-hidden="true" />}
        className="hero-slider-arrow hero-slider-arrow-prev ui-radius-pill"
      />

      <IconButton
        variant="outline"
        size="md"
        onClick={handleNext}
        aria-label={language === 'bn' ? 'পরবর্তী স্লাইড' : 'Next slide'}
        icon={<ChevronRight aria-hidden="true" />}
        className="hero-slider-arrow hero-slider-arrow-next ui-radius-pill"
      />
    </section>
  );
};
