import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  SectionKey,
  HERO_TOKENS,
  HERO_SLIDER_BEHAVIOR,
  getHeroSliderCssVars,
} from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import {
  isManagedThemePreset,
  useTaxonomy,
} from '../../services/taxonomyService';
import { CategoryHeroBanner } from '../category/CategoryHeroBanner';
import { getPublishedBannerSettings, getRuntimeBannerContent, usePublishedBannerRuntime } from '../../services/bannerRuntime';
import { IconButton } from '../ui/IconButton';

export interface ServiceSlide {
  key: SectionKey;
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
  const { language, navigateTo, openReportComposer } = useApp();
  const { segments } = useTaxonomy();
  usePublishedBannerRuntime();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const timerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastSwipeAtRef = useRef(0);
  const sliderRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const availableSlides: ServiceSlide[] = Object.values(segments)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .map((segment) => ({ key: segment.id as SectionKey }));

  const slides = availableSlides
    .filter((slide) => Boolean(getRuntimeBannerContent(slide.key)))
    .filter((slide) => {
      const settings = getPublishedBannerSettings(slide.key);
      return settings ? settings.isActive && settings.showOnHome : true;
    })
    .sort((a, b) => {
      const aSettings = getPublishedBannerSettings(a.key);
      const bSettings = getPublishedBannerSettings(b.key);
      const aFallback = segments[a.key]?.sortOrder ?? 999;
      const bFallback = segments[b.key]?.sortOrder ?? 999;
      return (aSettings?.sortOrder ?? aFallback) - (bSettings?.sortOrder ?? bFallback);
    });

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

    if (e.key === 'Enter' && target === sliderRef.current) {
      const activeSlide = slides[safeIndex];
      const targetRoute = activeSlide ? segments[activeSlide.key]?.slug : null;
      if (targetRoute) {
        e.preventDefault();
        navigateTo(targetRoute);
      }
      return;
    }

    if (!isMultiSlide) return;

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
      lastSwipeAtRef.current = Date.now();
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

  const handleSlideClick = (
    e: React.MouseEvent<HTMLDivElement>,
    slideKey: SectionKey
  ) => {
    if (Date.now() - lastSwipeAtRef.current < 500) return;

    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        'button, a, input, textarea, select, [role="button"], [role="link"], [role="textbox"]'
      )
    ) {
      return;
    }

    const targetRoute = segments[slideKey]?.slug;
    if (targetRoute) {
      navigateTo(targetRoute);
    }
  };

  if (totalSlides === 0) {
    return null;
  }

  const currentSlide = slides[safeIndex];
  const activeKey = currentSlide.key;
  const activeSegment = segments[activeKey];
  const activeHeroBg = isManagedThemePreset(activeSegment?.themeKey)
    ? activeSegment?.bgColor || 'var(--md-surface-subtle)'
    : HERO_TOKENS.sections[activeKey]?.background ??
      activeSegment?.bgColor ??
      'var(--md-surface-subtle)';

  const containerStyle: React.CSSProperties = {
    ...getHeroSliderCssVars(),
    backgroundColor: activeHeroBg,
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
        aria-keyshortcuts="Enter ArrowLeft ArrowRight"
        onKeyDown={handleKeyDown}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        className="category-hero-slider w-full ui-radius-card ui-elevation-card relative overflow-hidden transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-role-focus"
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
            const rawDistance = Math.abs(index - safeIndex);
            const circularDistance =
              totalSlides > 1
                ? Math.min(rawDistance, totalSlides - rawDistance)
                : 0;
            const shouldHydrateMedia = circularDistance <= 1;
            const content = getRuntimeBannerContent(slide.key);
            if (!content) return null;
            const slideSegment = segments[slide.key];
            const slideThemeStyle = slideSegment
              ? ({
                  '--category-route-primary': slideSegment.primaryColor,
                  '--category-route-hover': slideSegment.hoverColor,
                  '--category-route-on-primary': slideSegment.colors.filledText,
                  '--category-route-container': slideSegment.bgColor,
                  '--category-route-on-container': slideSegment.textColor,
                  '--category-route-outline': slideSegment.borderColor,
                } as React.CSSProperties)
              : undefined;

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
                onClick={(e) => handleSlideClick(e, slide.key)}
                className={`category-theme-scope w-full shrink-0 min-w-full p-0 flex flex-col ${isActive ? 'cursor-pointer' : ''}`}
                data-category-theme={slide.key}
                style={{
                  ...slideThemeStyle,
                  backgroundColor: isManagedThemePreset(slideSegment?.themeKey)
                    ? slideSegment?.bgColor || 'var(--md-surface-subtle)'
                    : HERO_TOKENS.sections[slide.key]?.background ??
                      slideSegment?.bgColor ??
                      'var(--md-surface-subtle)',
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
                  deferIllustration={!shouldHydrateMedia}
                  action={
                    getPublishedBannerSettings(slide.key)?.showHomeCta
                      ? {
                          labelBn: content.primaryCtaBn,
                          labelEn: content.primaryCtaEn,
                          onClick: () => openReportComposer(slide.key),
                        }
                      : undefined
                  }
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
