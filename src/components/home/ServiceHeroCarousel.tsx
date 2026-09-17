import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  SectionKey,
  HERO_TOKENS,
  HERO_SLIDER_BEHAVIOR,
  getHeroSliderCssVars,
} from '../../theme/tokens';
import { useApp, RoutePath } from '../../context/AppContext';
import { useTaxonomy } from '../../services/taxonomyService';
import { CategoryHeroBanner } from '../category/CategoryHeroBanner';
import { CANONICAL_BANNER_CONTENT } from '../../data/bannerContent';
import { IconButton } from '../ui/IconButton';

export interface ServiceSlide {
  key: SectionKey;
  path: RoutePath;
}

export interface ServiceHeroCarouselProps {
  id?: string;
  className?: string;
}

const AUTOPLAY_INTERVAL = HERO_SLIDER_BEHAVIOR.autoplayIntervalMs;

export const ServiceHeroCarousel: React.FC<ServiceHeroCarouselProps> = ({
  id = 'home-service-carousel',
  className = '',
}) => {
  const { language, openReportComposer } = useApp();
  const { segments } = useTaxonomy();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const timerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const sliderRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const availableSlides: ServiceSlide[] = [
    { key: 'harassment', path: '/harassment' },
    { key: 'load_shedding', path: '/load-shedding' },
    { key: 'extortion', path: '/extortion' },
    { key: 'public_safety', path: '/public-safety' },
    { key: 'road_transport', path: '/road-transport' },
    { key: 'illegal_occupation', path: '/illegal-occupation' },
    { key: 'rickshaw', path: '/rickshaw' },
  ];
  const slides = availableSlides.filter((slide) => Boolean(segments[slide.key]));

  const totalSlides = slides.length;
  const isMultiSlide = totalSlides > 1;
  const safeIndex = totalSlides > 0 ? Math.min(currentIndex, totalSlides - 1) : 0;

  useEffect(() => {
    if (currentIndex !== safeIndex) {
      setCurrentIndex(safeIndex);
    }
  }, [currentIndex, safeIndex]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

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
    safeIndex,
    prefersReducedMotion,
    isHovered,
    isFocused,
    isSwiping,
    isDocumentVisible,
    handleNext,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isMultiSlide) return;

    const target = e.target as HTMLElement | null;
    if (target && target !== sliderRef.current) {
      const isInteractive =
        target.closest(
          'button, a, input, textarea, select, [role="button"], [role="link"], [role="textbox"]'
        ) !== null || target.isContentEditable;
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

  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ) {
      setIsHovered(true);
    }
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      setIsHovered(false);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (
      (containerRef.current && containerRef.current.contains(e.relatedTarget as Node)) ||
      (sliderRef.current && sliderRef.current.contains(e.relatedTarget as Node))
    ) {
      return;
    }
    setIsFocused(false);
  };

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

  if (totalSlides === 0) {
    return null;
  }

  const currentSlide = slides[safeIndex];
  const activeKey = currentSlide.key;
  const activeHeroBg = HERO_TOKENS.sections[activeKey]?.background ?? `var(--sec-${activeKey}-bg)`;

  const containerStyle: React.CSSProperties = {
    ...getHeroSliderCssVars(),
    backgroundColor: activeHeroBg,
    borderColor: `var(--sec-${activeKey}-border)`,
    touchAction: 'pan-y',
  };

  return (
    <div
      ref={containerRef}
      className={`relative group w-full ${className}`}
      style={getHeroSliderCssVars()}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <section
        id={id}
        ref={sliderRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={
          language === 'bn'
            ? 'সেবা সমূহের হাইলাইট ব্যানার'
            : 'Service highlights hero banner'
        }
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        className="w-full ui-radius-card ui-border-default ui-elevation-card relative overflow-hidden transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        style={containerStyle}
      >
        <div
          className={`hero-slider-track ${
            prefersReducedMotion ? '!transition-none' : ''
          }`}
          style={{
            transform: `translateX(-${safeIndex * 100}%)`,
            ...(prefersReducedMotion ? { transitionDuration: '0ms' } : {}),
          }}
        >
          {slides.map((slide, index) => {
            const isActive = index === safeIndex;
            const content = CANONICAL_BANNER_CONTENT[slide.key];

            return (
              <div
                key={slide.key}
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
                  backgroundColor: HERO_TOKENS.sections[slide.key]?.background ?? `var(--sec-${slide.key}-bg)`,
                }}
              >
                <CategoryHeroBanner
                  section={slide.key}
                  titleBn={content.titleBn}
                  titleEn={content.titleEn}
                  mobileDescriptionBn={content.mobileDescriptionBn}
                  mobileDescriptionEn={content.mobileDescriptionEn}
                  descriptionBn={content.tabletDescriptionBn}
                  descriptionEn={content.tabletDescriptionEn}
                  desktopDescriptionBn={content.desktopDescriptionBn}
                  desktopDescriptionEn={content.desktopDescriptionEn}
                  illustrationSrc={content.illustrationSrc}
                  action={{
                    labelBn: content.primaryCtaBn,
                    labelEn: content.primaryCtaEn,
                    onClick: () => openReportComposer(slide.key),
                  }}
                  headingLevel="h2"
                  active={isActive}
                  ctaId={`${id}-report-btn-${slide.key}`}
                  ctaTabIndex={isActive ? 0 : -1}
                />
              </div>
            );
          })}
        </div>
      </section>

      {isMultiSlide && (
        <>
          <IconButton
            variant="outline"
            size="md"
            onClick={handlePrev}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            aria-label={language === 'bn' ? 'পূর্ববর্তী সেবা' : 'Previous service'}
            icon={<ChevronLeft aria-hidden="true" />}
            className="hero-slider-arrow hero-slider-arrow-prev ui-radius-pill"
          />

          <IconButton
            variant="outline"
            size="md"
            onClick={handleNext}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            aria-label={language === 'bn' ? 'পরবর্তী সেবা' : 'Next service'}
            icon={<ChevronRight aria-hidden="true" />}
            className="hero-slider-arrow hero-slider-arrow-next ui-radius-pill"
          />
        </>
      )}
    </div>
  );
};
