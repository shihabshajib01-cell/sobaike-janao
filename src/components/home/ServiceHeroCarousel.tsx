import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  SectionKey,
  HERO_TOKENS,
  HERO_SLIDER_BEHAVIOR,
  getHeroSliderCssVars,
} from '../../theme/tokens';
import { useApp, RoutePath } from '../../context/AppContext';
import { CategoryHeroBanner } from '../category/CategoryHeroBanner';

export interface ServiceSlide {
  key: SectionKey;
  isComingSoon?: boolean;
  serviceLabelBn?: string;
  serviceLabelEn?: string;
  nameBn: string;
  nameEn: string;
  mobileDescBn?: string;
  mobileDescEn?: string;
  descBn: string;
  descEn: string;
  desktopDescBn: string;
  desktopDescEn: string;
  primaryCtaBn?: string;
  primaryCtaEn?: string;
  path: RoutePath;
  illustrationSrc?: string;
  desktopMediaPosition?: string;
  desktopMediaScale?: number;
  desktopMediaTranslateY?: string;
  badgeBn?: string;
  badgeEn?: string;
  reportCount?: number;
}

export interface ServiceHeroCarouselProps {
  id?: string;
  reportCounts?: Partial<Record<SectionKey, number>>;
  className?: string;
}

const AUTOPLAY_INTERVAL = HERO_SLIDER_BEHAVIOR.autoplayIntervalMs;

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
      mobileDescBn: 'আপনি বা পরিচিত কেউ কি কোনো ধরনের হয়রানি বা নির্যাতনের শিকার হচ্ছেন?',
      mobileDescEn: 'Are you or someone you know facing harassment or abuse?',
      descBn: 'শারীরিক, মৌখিক বা অনলাইন নির্যাতন।',
      descEn: 'Physical, verbal, or online abuse.',
      desktopDescBn: 'শারীরিক, মৌখিক বা অনলাইন হয়রানি, নির্যাতন, হুমকি বা অন্য অনিরাপদ আচরণের তথ্য জানান।',
      desktopDescEn: 'Report physical, verbal, or online harassment, abuse, threats, or other unsafe behaviour.',
      primaryCtaBn: 'রিপোর্ট করুন',
      primaryCtaEn: 'Report now',
      path: '/harassment',
      illustrationSrc: '/illustrations/services/harassment-hero-public-harassment-v02.jpeg',
    },
    {
      key: 'rickshaw',
      nameBn: 'অবৈধ চার্জিং স্টেশন',
      nameEn: 'Expose Illegal Charging Stations',
      mobileDescBn: 'আপনার এলাকায় কি কোনো অবৈধ বা ঝুঁকিপূর্ণ চার্জিং স্টেশন আছে?',
      mobileDescEn: 'Is there an illegal or unsafe charging station in your area?',
      descBn: 'অনিরাপদ ব্যাটারি চার্জিং ও ঝুঁকিপূর্ণ সংযোগ।',
      descEn: 'Unsafe battery charging and risky connections.',
      desktopDescBn: 'অনিরাপদ ব্যাটারি চার্জিং স্টেশন, খোলা তার, অতিরিক্ত লোড বা অন্যান্য বৈদ্যুতিক ঝুঁকির তথ্য জানান।',
      desktopDescEn: 'Report unsafe battery charging stations, exposed wiring, overloaded connections, or other electrical risks.',
      primaryCtaBn: 'রিপোর্ট করুন',
      primaryCtaEn: 'Report now',
      path: '/rickshaw',
      illustrationSrc: '/illustrations/services/rickshaw-hero-illegal-charging-station-v02.jpeg',
    },
    {
      key: 'extortion',
      nameBn: 'চাঁদাবাজি',
      nameEn: 'Extortion',
      mobileDescBn: 'আপনার কাছে কি চাঁদা দাবি করা হয়েছে বা হুমকি দেওয়া হয়েছে?',
      mobileDescEn: 'Have you been asked for illegal payment or threatened?',
      descBn: 'অবৈধ চাঁদা, হুমকি বা জোরপূর্বক অর্থ দাবি।',
      descEn: 'Illegal demands, threats, or forced payments.',
      desktopDescBn: 'দোকান, পরিবহন বা এলাকায় অবৈধ অর্থ দাবি, হুমকি, চাপ বা জোরপূর্বক আদায়ের তথ্য জানান।',
      desktopDescEn: 'Report illegal demands for money, threats, coercion, or forced payments in shops, transport, or local areas.',
      primaryCtaBn: 'রিপোর্ট করুন',
      primaryCtaEn: 'Report now',
      path: '/extortion',
      illustrationSrc: '/illustrations/services/extortion-hero-shopkeeper-coercion-v02.jpeg',
    },
    {
      key: 'load_shedding',
      nameBn: 'ইউটিলিটি সমস্যা',
      nameEn: 'Utility Issues',
      mobileDescBn: 'আপনি কি বিদ্যুৎ, গ্যাস বা বিলিং সমস্যায় ভুগছেন?',
      mobileDescEn: 'Are you facing power, gas, or billing problems?',
      descBn: 'বিদ্যুৎ, গ্যাস বা বিলিং সমস্যা।',
      descEn: 'Power, gas, or billing problems.',
      desktopDescBn: 'লোডশেডিং, গ্যাস সংকট, বিদ্যুৎ সরবরাহ সমস্যা বা ভুল ইউটিলিটি বিলের তথ্য জানান।',
      desktopDescEn: 'Report load shedding, gas shortages, electricity supply problems, or incorrect utility billing.',
      primaryCtaBn: 'রিপোর্ট করুন',
      primaryCtaEn: 'Report now',
      path: '/load-shedding',
      illustrationSrc: '/illustrations/services/load-shedding-hero-family-blackout-v01.jpeg',
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

  const currentSlide = slides[currentIndex];
  const activeKey = currentSlide.key;
  const activeHeroBg = HERO_TOKENS.sections[activeKey]?.background ?? `var(--sec-${activeKey}-bg)`;

  const containerStyle: React.CSSProperties = {
    ...getHeroSliderCssVars(),
    backgroundColor: activeHeroBg,
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
              key={slide.key}
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
                backgroundColor: HERO_TOKENS.sections[slide.key]?.background ?? `var(--sec-${slide.key}-bg)`,
              }}
            >
              <CategoryHeroBanner
                section={slide.key}
                titleBn={slide.nameBn}
                titleEn={slide.nameEn}
                mobileDescriptionBn={slide.mobileDescBn}
                mobileDescriptionEn={slide.mobileDescEn}
                descriptionBn={slide.descBn}
                descriptionEn={slide.descEn}
                desktopDescriptionBn={slide.desktopDescBn}
                desktopDescriptionEn={slide.desktopDescEn}
                illustrationSrc={slide.illustrationSrc}
                desktopMediaPosition={slide.desktopMediaPosition}
                desktopMediaScale={slide.desktopMediaScale}
                desktopMediaTranslateY={slide.desktopMediaTranslateY}
                action={{
                  labelBn: slide.primaryCtaBn || (language === 'bn' ? 'রিপোর্ট করুন' : 'Report now'),
                  labelEn: slide.primaryCtaEn || 'Report now',
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

      {/* Large-Desktop (>=1440px) / Fine-Pointer Hover Arrows */}
      {isMultiSlide && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label={language === 'bn' ? 'পূর্ববর্তী সেবা' : 'Previous service'}
            className="hero-slider-arrow hero-slider-arrow-prev"
          >
            <ChevronLeft aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label={language === 'bn' ? 'পরবর্তী সেবা' : 'Next service'}
            className="hero-slider-arrow hero-slider-arrow-next"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </>
      )}
    </section>
  );
};
