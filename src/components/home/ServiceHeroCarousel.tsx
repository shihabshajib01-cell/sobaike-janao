import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { useApp, RoutePath } from '../../context/AppContext';
import { Button } from '../ui/Button';

export interface ServiceSlide {
  key: string;
  isComingSoon?: boolean;
  serviceLabelBn?: string;
  serviceLabelEn?: string;
  nameBn: string;
  nameEn: string;
  descBn: string;
  descEn: string;
  primaryCtaBn?: string;
  primaryCtaEn?: string;
  path: RoutePath;
  illustrationSrc?: string;
  badgeBn?: string;
  badgeEn?: string;
  reportCount?: number;
}

export interface ServiceHeroCarouselProps {
  id?: string;
  reportCounts?: Partial<Record<SectionKey, number>>;
  className?: string;
}

const AUTOPLAY_INTERVAL = 35_000;

export const ServiceHeroCarousel: React.FC<ServiceHeroCarouselProps> = ({
  id = 'home-service-carousel',
  reportCounts: _reportCounts = {},
  className = '',
}) => {
  const { language, openReportComposer } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const timerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const sliderRef = useRef<HTMLElement | null>(null);

  const slides: ServiceSlide[] = [
    {
      key: 'harassment',
      nameBn: 'হয়রানি ও নির্যাতন',
      nameEn: 'Harassment & Abuse',
      descBn: 'হয়রানি বা নির্যাতনের ঘটনা জানান।',
      descEn: 'Report harassment or abusive incidents.',
      primaryCtaBn: 'রিপোর্ট করুন',
      primaryCtaEn: 'Report now',
      path: '/harassment',
      illustrationSrc: '/illustrations/services/harassment-hero-public-harassment-v02.png',
    },
    {
      key: 'rickshaw',
      nameBn: 'ঝুঁকিপূর্ণ চার্জিং',
      nameEn: 'Unsafe Charging',
      descBn: 'অনিরাপদ ব্যাটারি চার্জিংয়ের তথ্য জানান।',
      descEn: 'Report unsafe battery charging.',
      primaryCtaBn: 'রিপোর্ট করুন',
      primaryCtaEn: 'Report now',
      path: '/rickshaw',
      illustrationSrc: '/illustrations/services/rickshaw-hero-illegal-charging-station-v02.png',
    },
    {
      key: 'extortion',
      nameBn: 'চাঁদাবাজি',
      nameEn: 'Extortion',
      descBn: 'অবৈধ চাঁদা বা হুমকির তথ্য জানান।',
      descEn: 'Report illegal demands or threats.',
      primaryCtaBn: 'রিপোর্ট করুন',
      primaryCtaEn: 'Report now',
      path: '/extortion',
      illustrationSrc: '/illustrations/services/extortion-hero-shopkeeper-coercion-v02.png',
    },
    {
      key: 'load_shedding',
      nameBn: 'ইউটিলিটি সমস্যা',
      nameEn: 'Utility Issues',
      descBn: 'বিদ্যুৎ, গ্যাস বা বিলিং সমস্যা জানান।',
      descEn: 'Report power, gas or billing issues.',
      primaryCtaBn: 'রিপোর্ট করুন',
      primaryCtaEn: 'Report now',
      path: '/load-shedding',
      illustrationSrc: '/illustrations/services/load-shedding-hero-family-blackout-v01.png',
    },
  ];

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

  // Pointer-safe hover handling (ignores touch / coarse pointers)
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

  // Focus handling with inner containment check
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    if (sliderRef.current && sliderRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsFocused(false);
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

  const currentSlide = slides[currentIndex];
  const activeKey = currentSlide.key;

  const containerStyle: React.CSSProperties = {
    backgroundColor: `var(--sec-${activeKey}-bg)`,
    borderColor: `var(--sec-${activeKey}-border)`,
    touchAction: 'pan-y',
  };

  return (
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
      className={`group w-full rounded-2xl border shadow-2xs relative overflow-hidden transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${className}`}
      style={containerStyle}
    >
      {/* Slides Track */}
      <div
        className={`flex w-full items-stretch ${
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
              key={slide.key}
              role="group"
              aria-roledescription="slide"
              aria-label={
                language === 'bn'
                  ? `স্লাইড ${index + 1} / ${totalSlides}`
                  : `Slide ${index + 1} of ${totalSlides}`
              }
              aria-hidden={!isActive}
              className="w-full shrink-0 min-w-full p-4 sm:p-5 md:p-6"
              style={{
                backgroundColor: `var(--sec-${slide.key}-bg)`,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 md:gap-6 w-full">
                {/* Copy Block */}
                <div className="min-w-0 space-y-1.5 sm:space-y-2 text-center md:text-left z-10 md:col-start-1 md:row-start-1">
                  <h2 className="type-h2 text-ui-content-primary tracking-tight">
                    {language === 'bn' ? slide.nameBn : slide.nameEn}
                  </h2>

                  <p className="type-body text-ui-content-secondary max-w-2xl mx-auto md:mx-0">
                    {language === 'bn' ? slide.descBn : slide.descEn}
                  </p>
                </div>

                {/* Image Block */}
                <div className="min-w-0 w-full flex items-center justify-center md:justify-end relative pointer-events-none select-none md:col-start-2 md:row-start-1 md:row-span-2">
                  {slide.illustrationSrc ? (
                    <img
                      src={slide.illustrationSrc}
                      alt=""
                      aria-hidden="true"
                      className="w-full max-w-full h-auto max-h-[220px] sm:max-h-[260px] md:max-h-[190px] object-contain object-center md:object-right mx-auto"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl bg-ui-surface-subtle/60 border border-ui-stroke-subtle/40 opacity-40 shrink-0 mx-auto md:ml-auto md:mr-0"
                    />
                  )}
                </div>

                {/* CTA Block */}
                <div className="w-full flex justify-center md:justify-start pt-1 sm:pt-1.5 md:pt-2 md:col-start-1 md:row-start-2">
                  <Button
                    id={`${id}-report-btn-${slide.key}`}
                    variant="primary"
                    size="md"
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => openReportComposer()}
                    style={{
                      backgroundColor: `var(--sec-${slide.key}-primary)`,
                      color: `var(--sec-${slide.key}-on-primary)`,
                    }}
                    className="w-full sm:w-full md:w-auto shadow-xs"
                  >
                    {language === 'bn' ? slide.primaryCtaBn : slide.primaryCtaEn}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Large-Desktop (>=1440px) / Fine-Pointer Hover Arrows */}
      {isMultiSlide && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label={language === 'bn' ? 'পূর্ববর্তী সেবা' : 'Previous service'}
            className="hidden [@media(min-width:1440px)_and_(hover:hover)_and_(pointer:fine)]:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-ui-surface/90 hover:bg-ui-surface text-ui-content-primary border border-ui-stroke-subtle shadow-md backdrop-blur-xs items-center justify-center cursor-pointer transition-opacity duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label={language === 'bn' ? 'পরবর্তী সেবা' : 'Next service'}
            className="hidden [@media(min-width:1440px)_and_(hover:hover)_and_(pointer:fine)]:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-ui-surface/90 hover:bg-ui-surface text-ui-content-primary border border-ui-stroke-subtle shadow-md backdrop-blur-xs items-center justify-center cursor-pointer transition-opacity duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </>
      )}
    </section>
  );
};
