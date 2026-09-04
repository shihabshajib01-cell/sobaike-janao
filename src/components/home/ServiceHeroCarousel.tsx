import React, { useState } from 'react';
import { SectionKey, SECTIONS, COMING_SOON_SERVICES } from '../../theme/tokens';
import { useApp, RoutePath } from '../../context/AppContext';
import { FeatureIcon } from '../branding/FeatureIcon';
import { AppIcon, AppIconName } from '../ui/AppIcon';

export interface ServiceSlide {
  key: string;
  isComingSoon?: boolean;
  serviceLabelBn: string;
  serviceLabelEn: string;
  nameBn: string;
  nameEn: string;
  descBn: string;
  descEn: string;
  primaryCtaBn?: string;
  primaryCtaEn?: string;
  path: RoutePath;
  iconName?: AppIconName;
  badgeBn?: string;
  badgeEn?: string;
  reportCount?: number;
}

export interface ServiceHeroCarouselProps {
  id?: string;
  reportCounts?: Partial<Record<SectionKey, number>>;
  className?: string;
}

export const ServiceHeroCarousel: React.FC<ServiceHeroCarouselProps> = ({
  id = 'service-hero-carousel',
  reportCounts = {},
  className = '',
}) => {
  const { language, navigateTo, openReportComposer } = useApp();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const slides: ServiceSlide[] = [
    {
      key: 'harassment',
      serviceLabelBn: 'হয়রানি ও নির্যাতন',
      serviceLabelEn: 'Harassment & Abuse',
      nameBn: 'হয়রানি ও নির্যাতনের বিরুদ্ধে জানান',
      nameEn: 'Speak Out Against Harassment & Abuse',
      descBn: 'আপনার এলাকায় বা কর্মক্ষেত্রে হয়রানি, নির্যাতন ও সামাজিক নিপীড়নের তথ্য জানান।',
      descEn: 'Responsibly report incidents of harassment, abuse, or safety violations in your community.',
      primaryCtaBn: 'অভিযোগ জানান',
      primaryCtaEn: 'File Report',
      path: '/harassment',
    },
    {
      key: 'rickshaw',
      serviceLabelBn: 'অবৈধ চার্জিং স্টেশন',
      serviceLabelEn: 'Illegal Charging Stations',
      nameBn: 'অবৈধ চার্জিং স্টেশন প্রকাশ করুন',
      nameEn: 'Expose Illegal Charging Stations',
      descBn: 'আপনার এলাকার অনুমোদনহীন ও ঝুঁকিপূর্ণ অটোরিকশা ব্যাটারি চার্জিং স্টেশনের তথ্য দিন।',
      descEn: 'Report unauthorized or hazardous auto-rickshaw battery charging stations.',
      primaryCtaBn: 'অভিযোগ জানান',
      primaryCtaEn: 'File Report',
      path: '/rickshaw',
    },
    {
      key: 'extortion',
      serviceLabelBn: 'চাঁদাবাজি',
      serviceLabelEn: 'Extortion',
      nameBn: 'আপনার এলাকার চাঁদাবাজির তথ্য জানান',
      nameEn: 'Report Extortion in Your Area',
      descBn: 'দোকানপাট, পরিবহন বা এলাকায় চাঁদাবাজি ও অবৈধ চাঁদা দাবির বিরুদ্ধে তথ্য জানান।',
      descEn: 'Report extortion, illegal tolls, or coercive protection fee demands.',
      primaryCtaBn: 'অভিযোগ জানান',
      primaryCtaEn: 'File Report',
      path: '/extortion',
    },
    {
      key: 'load_shedding',
      isComingSoon: true,
      serviceLabelBn: COMING_SOON_SERVICES.load_shedding.nameBn,
      serviceLabelEn: COMING_SOON_SERVICES.load_shedding.nameEn,
      nameBn: 'লোডশেডিং সংক্রান্ত রিপোর্টিং সেবা',
      nameEn: 'Load Shedding Reporting Service',
      descBn: COMING_SOON_SERVICES.load_shedding.descriptionBn,
      descEn: COMING_SOON_SERVICES.load_shedding.descriptionEn,
      badgeBn: COMING_SOON_SERVICES.load_shedding.badgeBn,
      badgeEn: COMING_SOON_SERVICES.load_shedding.badgeEn,
      path: COMING_SOON_SERVICES.load_shedding.slug,
      iconName: 'zap-off',
    },
    {
      key: 'illegal_occupation',
      isComingSoon: true,
      serviceLabelBn: COMING_SOON_SERVICES.illegal_occupation.nameBn,
      serviceLabelEn: COMING_SOON_SERVICES.illegal_occupation.nameEn,
      nameBn: 'অবৈধ দখল সংক্রান্ত রিপোর্টিং সেবা',
      nameEn: 'Illegal Occupation Reporting Service',
      descBn: COMING_SOON_SERVICES.illegal_occupation.descriptionBn,
      descEn: COMING_SOON_SERVICES.illegal_occupation.descriptionEn,
      badgeBn: COMING_SOON_SERVICES.illegal_occupation.badgeBn,
      badgeEn: COMING_SOON_SERVICES.illegal_occupation.badgeEn,
      path: COMING_SOON_SERVICES.illegal_occupation.slug,
      iconName: 'building',
    },
  ];

  const totalSlides = slides.length;
  const currentSlide = slides[currentSlideIndex];
  const isActiveService = !currentSlide.isComingSoon && currentSlide.key in SECTIONS;
  const conf = isActiveService ? SECTIONS[currentSlide.key as SectionKey] : null;
  const count = isActiveService ? reportCounts[currentSlide.key as SectionKey] ?? 0 : 0;

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  const toBanglaDigits = (num: number): string => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num
      .toString()
      .split('')
      .map((d) => bnDigits[parseInt(d, 10)] ?? d)
      .join('');
  };

  const slideIndicatorText =
    language === 'bn'
      ? `${toBanglaDigits(currentSlideIndex + 1)} / ${toBanglaDigits(totalSlides)}`
      : `${currentSlideIndex + 1} / ${totalSlides}`;

  return (
    <div id={id} className={`space-y-3.5 ${className}`}>
      {/* Interactive Hero Banner */}
      <section
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={language === 'bn' ? 'সেবা সমূহের হাইলাইট ব্যানার' : 'Service highlights hero banner'}
        onKeyDown={handleKeyDown}
        className="relative overflow-hidden rounded-2xl border border-subtle bg-surface shadow-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
        style={{
          borderLeftColor: conf ? conf.primaryColor : 'var(--ui-border-subtle)',
          borderLeftWidth: '4px',
        }}
      >
        {conf && (
          <div
            className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 transition-all duration-300"
            style={{
              background: `radial-gradient(circle 350px at 90% 15%, var(--sec-${currentSlide.key}-bg), transparent 80%)`,
            }}
          />
        )}

        <div className="relative z-10 p-5 sm:p-6 md:p-7 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {conf ? (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs transition-colors"
                style={{
                  backgroundColor: `var(--sec-${currentSlide.key}-bg)`,
                  color: `var(--sec-${currentSlide.key}-text)`,
                  borderColor: `var(--sec-${currentSlide.key}-border)`,
                }}
              >
                <FeatureIcon section={currentSlide.key as SectionKey} size="md" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-subtle bg-surface-subtle text-secondary shadow-2xs">
                {currentSlide.iconName && <AppIcon name={currentSlide.iconName} size="lg" />}
              </div>
            )}

            <span className="text-[16px] font-bold text-primary">
              {language === 'bn' ? currentSlide.serviceLabelBn : currentSlide.serviceLabelEn}
            </span>

            {currentSlide.isComingSoon && (
              <span
                id={`carousel-badge-${currentSlide.key}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-semibold bg-surface-subtle border border-subtle text-secondary shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{language === 'bn' ? currentSlide.badgeBn : currentSlide.badgeEn}</span>
              </span>
            )}

            {count > 0 && conf && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-surface-subtle border border-subtle text-secondary">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: conf.primaryColor }}
                />
                {language === 'bn'
                  ? `${toBanglaDigits(count)}টি প্রকাশিত অভিযোগ`
                  : `${count} published reports`}
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-left pt-1">
            <h2 className="text-[22px] sm:text-[24px] md:text-[26px] font-extrabold leading-[1.3] text-primary tracking-tight">
              {language === 'bn' ? currentSlide.nameBn : currentSlide.nameEn}
            </h2>

            <p className="text-[15px] leading-[1.6] text-secondary max-w-2xl">
              {language === 'bn' ? currentSlide.descBn : currentSlide.descEn}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Active Service Actions */}
              {isActiveService && conf && (
                <>
                  <button
                    id={`carousel-report-btn-${currentSlide.key}`}
                    type="button"
                    onClick={() => openReportComposer()}
                    className="inline-flex items-center justify-center gap-2 px-5 h-[44px] rounded-xl font-bold text-[15px] transition-all cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] hover:brightness-105 active:scale-[0.98]"
                    style={{
                      backgroundColor: conf.primaryColor,
                      color: currentSlide.key === 'rickshaw' ? 'var(--sec-rickshaw-on-primary, #050505)' : '#FFFFFF',
                    }}
                  >
                    <AppIcon name="plus" size="md" strokeWidth={2.5} />
                    <span>
                      {language === 'bn' ? currentSlide.primaryCtaBn : currentSlide.primaryCtaEn}
                    </span>
                  </button>

                  <button
                    id={`carousel-cta-${currentSlide.key}`}
                    type="button"
                    onClick={() => navigateTo(currentSlide.path)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 h-[44px] rounded-xl border border-subtle bg-surface hover:bg-surface-subtle text-primary font-semibold text-[14px] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
                  >
                    <span>
                      {language === 'bn' ? 'প্রতিবেদন দেখুন' : 'View Reports'}
                    </span>
                    <AppIcon name="arrow-right" size="sm" className="text-muted" />
                  </button>
                </>
              )}

              {/* Coming Soon Actions: Purely informative / link to Coming Soon page. Does NOT open composer. */}
              {currentSlide.isComingSoon && (
                <button
                  id={`carousel-coming-soon-btn-${currentSlide.key}`}
                  type="button"
                  onClick={() => navigateTo(currentSlide.path)}
                  className="inline-flex items-center justify-center gap-2 px-5 h-[44px] rounded-xl border border-subtle bg-surface hover:bg-surface-subtle text-primary font-semibold text-[14px] transition-colors cursor-pointer shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
                >
                  <span>
                    {language === 'bn' ? 'বিস্তারিত দেখুন' : 'Learn More'}
                  </span>
                  <AppIcon name="arrow-right" size="sm" className="text-muted" />
                </button>
              )}
            </div>

            <div
              id="carousel-navigation-bar"
              className="flex items-center justify-between sm:justify-start gap-1 bg-surface-subtle border border-subtle rounded-xl p-1 shrink-0 shadow-2xs self-end sm:self-center"
            >
              <button
                id="carousel-prev-btn"
                type="button"
                onClick={handlePrev}
                aria-label={language === 'bn' ? 'পূর্ববর্তী সেবা' : 'Previous service'}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-hover text-secondary hover:text-primary transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
              >
                <AppIcon name="chevron-left" size="sm" />
              </button>

              <span
                id="carousel-slide-indicator"
                aria-live="polite"
                className="text-[13px] font-bold text-secondary px-2.5 select-none font-mono"
              >
                {slideIndicatorText}
              </span>

              <button
                id="carousel-next-btn"
                type="button"
                onClick={handleNext}
                aria-label={language === 'bn' ? 'পরবর্তী সেবা' : 'Next service'}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface hover:bg-surface-hover text-secondary hover:text-primary transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
              >
                <AppIcon name="chevron-right" size="sm" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
