import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionKey } from '../../theme/tokens';
import { useApp, RoutePath } from '../../context/AppContext';
import { Button } from '../ui/Button';

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
  const activeHeroBg = HERO_ART_BACKGROUNDS[activeKey] ?? `var(--sec-${activeKey}-bg)`;

  const containerStyle: React.CSSProperties = {
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
              className="w-full shrink-0 min-w-full p-0"
              style={{
                backgroundColor: HERO_ART_BACKGROUNDS[slide.key] ?? `var(--sec-${slide.key}-bg)`,
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-stretch min-h-[160px] md:min-h-[180px] lg:min-h-[230px] xl:min-h-[250px]">
                {/* Left 50% Content Column */}
                <div className="px-4 pt-4 pb-2 sm:px-5 sm:pt-5 sm:pb-3 md:px-6 md:py-6 lg:px-8 lg:py-7 xl:px-10 xl:py-8 flex flex-col justify-center items-center lg:items-start text-center lg:text-left min-w-0 z-10 space-y-2 md:space-y-3">
                  <h2
                    className="type-h1 tracking-tight"
                    style={{ color: '#102A43' }}
                  >
                    {language === 'bn' ? slide.nameBn : slide.nameEn}
                  </h2>

                  {/* Mobile Question */}
                  {(slide.mobileDescBn || slide.mobileDescEn) && (
                    <p
                      className="block md:hidden type-body text-center max-w-md mx-auto"
                      style={{ color: '#596579' }}
                    >
                      {language === 'bn' ? slide.mobileDescBn : slide.mobileDescEn}
                    </p>
                  )}

                  {/* Tablet Short Description */}
                  <p
                    className="hidden md:block lg:hidden type-body max-w-xl text-center lg:text-left"
                    style={{ color: '#596579' }}
                  >
                    {language === 'bn' ? slide.descBn : slide.descEn}
                  </p>

                  {/* Desktop Long Description */}
                  <p
                    className="hidden lg:block type-body max-w-xl"
                    style={{ color: '#596579' }}
                  >
                    {language === 'bn' ? slide.desktopDescBn : slide.desktopDescEn}
                  </p>

                  {/* CTA */}
                  <div className="pt-2 sm:pt-2.5 md:pt-1.5 w-full flex justify-center lg:justify-start">
                    <Button
                      id={`${id}-report-btn-${slide.key}`}
                      variant="outline"
                      size="md"
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => openReportComposer(slide.key)}
                      className={`w-auto shadow-none ${HERO_CTA_THEMES[slide.key] || ''}`}
                    >
                      {language === 'bn' ? slide.primaryCtaBn : slide.primaryCtaEn}
                    </Button>
                  </div>
                </div>

                {/* Right 50% Illustration Column */}
                <div className="w-full flex items-center justify-center lg:justify-end relative pointer-events-none select-none h-full min-w-0 overflow-hidden">
                  {slide.illustrationSrc ? (
                    <img
                      src={resolvePublicAsset(slide.illustrationSrc)}
                      alt=""
                      aria-hidden="true"
                      className="w-full max-w-full h-auto max-h-[220px] sm:max-h-[260px] md:max-h-[220px] lg:max-h-none lg:h-full lg:w-full object-contain lg:object-cover object-center mx-auto block"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-2xl bg-ui-surface-subtle/60 border border-ui-stroke-subtle/40 opacity-40 shrink-0 m-4 lg:m-0"
                    />
                  )}
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
