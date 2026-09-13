import React from 'react';

export const SECTIONS = {
  harassment: {
    key: 'harassment' as const,
    slug: '/harassment',
    nameBn: 'হয়রানি ও নির্যাতন',
    nameEn: 'Harassment & abuse',
    shortNameBn: 'হয়রানি',
    shortNameEn: 'Harassment',
    descriptionBn: 'শারীরিক বা মানসিক নির্যাতন, নিপীড়ন ও অনলাইনে হেনস্তার তথ্য জানান।',
    descriptionEn: 'Report incidents of harassment, abuse, or safety violations.',
    primaryColor: '#B84A62',
    hoverColor: '#9E384E',
    bgColor: '#FDF2F4',
    borderColor: '#F7CCD5',
    textColor: '#8B293E',
    colors: {
      primary: '#B84A62',
      hover: '#9E384E',
      lightBg: '#FDF2F4',
      bgLight: '#FDF2F4',
      border: '#F7CCD5',
      text: '#8B293E',
      textSafe: '#8B293E',
      filledText: '#FFFFFF',
    },
  },
  rickshaw: {
    key: 'rickshaw' as const,
    slug: '/rickshaw',
    nameBn: 'অবৈধ অটো চার্জিং',
    nameEn: 'Illegal auto-rickshaw charging',
    shortNameBn: 'চার্জিং',
    shortNameEn: 'Charging',
    descriptionBn: 'অবৈধ বা ঝুঁকিপূর্ণ চার্জিং স্টেশনের অবস্থান ও তথ্য দিন।',
    descriptionEn: 'Share the location and details of illegal or unsafe charging stations.',
    primaryColor: '#D9822B',
    hoverColor: '#B8681A',
    bgColor: '#FEF7EE',
    borderColor: '#FBDDB9',
    textColor: '#9A530C',
    colors: {
      primary: '#D9822B',
      hover: '#B8681A',
      lightBg: '#FEF7EE',
      bgLight: '#FEF7EE',
      border: '#FBDDB9',
      text: '#9A530C',
      textSafe: '#9A530C',
      filledText: '#050505',
    },
  },
  extortion: {
    key: 'extortion' as const,
    slug: '/extortion',
    nameBn: 'চাঁদাবাজি',
    nameEn: 'Extortion',
    shortNameBn: 'চাঁদাবাজি',
    shortNameEn: 'Extortion',
    descriptionBn: 'দোকানপাট, পরিবহন বা এলাকায় অবৈধ চাঁদা দাবি ও হুমকির তথ্য জানান।',
    descriptionEn: 'Report extortion, illegal tolls, or coercive demands.',
    primaryColor: '#4F5D95',
    hoverColor: '#3E4A7A',
    bgColor: '#F0F3F9',
    borderColor: '#CCD5E8',
    textColor: '#333E67',
    colors: {
      primary: '#4F5D95',
      hover: '#3E4A7A',
      lightBg: '#F0F3F9',
      bgLight: '#F0F3F9',
      border: '#CCD5E8',
      text: '#333E67',
      textSafe: '#333E67',
      filledText: '#FFFFFF',
    },
  },
  load_shedding: {
    key: 'load_shedding' as const,
    slug: '/load-shedding',
    nameBn: 'ইউটিলিটি সমস্যা',
    nameEn: 'Utility issues',
    shortNameBn: 'ইউটিলিটি',
    shortNameEn: 'Utility',
    descriptionBn: 'লোডশেডিং, গ্যাস সংকট বা অতিরিক্ত বিদ্যুৎ বিল সংক্রান্ত প্রতিবেদন জমা দিন।',
    descriptionEn: 'Report load shedding, gas shortages, or electricity billing issues.',
    primaryColor: '#0D9488',
    hoverColor: '#0F766E',
    bgColor: '#F0FDFA',
    borderColor: '#CCFBF1',
    textColor: '#115E59',
    colors: {
      primary: '#0D9488',
      hover: '#0F766E',
      lightBg: '#F0FDFA',
      bgLight: '#F0FDFA',
      border: '#CCFBF1',
      text: '#115E59',
      textSafe: '#115E59',
      filledText: '#050505',
    },
  },
};

export type SectionKey = keyof typeof SECTIONS;

export interface ComingSoonServiceConfig {
  key: 'illegal_occupation';
  slug: '/illegal-occupation';
  nameBn: string;
  nameEn: string;
  shortNameBn: string;
  shortNameEn: string;
  badgeBn: string;
  badgeEn: string;
  descriptionBn: string;
  descriptionEn: string;
  primaryColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconName: 'building';
}

export const COMING_SOON_SERVICES: Record<'illegal_occupation', ComingSoonServiceConfig> = {
  illegal_occupation: {
    key: 'illegal_occupation',
    slug: '/illegal-occupation',
    nameBn: 'অবৈধ দখল',
    nameEn: 'Illegal occupation',
    shortNameBn: 'অবৈধ দখল',
    shortNameEn: 'Illegal occupation',
    badgeBn: 'শীঘ্রই আসছে',
    badgeEn: 'Coming soon',
    descriptionBn: 'এই সেবাটি এখনো চালু হয়নি।',
    descriptionEn: 'This service isn’t available yet.',
    primaryColor: '#6B7280',
    bgColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    textColor: '#374151',
    iconName: 'building',
  },
};

export type ComingSoonServiceKey = keyof typeof COMING_SOON_SERVICES;

export const LAYOUT_TOKENS = {
  navWidth: {
    desktop: '240px',
    largeDesktop: '250px',
    xlDesktop: '260px',
  },
  navLeft: {
    desktop: '16px',
    largeDesktop: '20px',
    xlDesktop: '24px',
  },
  maxWidth: {
    desktopWorkspace: 'max-w-[900px]',
    desktop1440: 'max-w-[880px]',
    desktop1536: 'max-w-[900px]',
    desktop1920: 'max-w-[920px]',
    readingColumn: 'max-w-[720px]',
    formColumn: 'max-w-[720px]',
    modal: 'max-w-xl',
  },
  gutters: {
    mobile: 'px-4',
    tablet: 'px-6',
    compactDesktop: 'px-8',
    desktop: 'px-0',
  },
  spacing: {
    pagePaddingY: {
      mobile: 'py-4',
      tablet: 'py-5',
      desktop: 'py-6',
    },
    sectionGap: {
      mobile: 'space-y-5',
      tablet: 'space-y-6',
      desktop: 'space-y-7',
    },
    cardPadding: {
      mobile: 'p-4',
      tablet: 'p-5',
      desktop: 'p-6',
    },
  },
  touchTargetMin: '44px',
};

export interface HeroSectionTheme {
  background: string;
  ctaText: string;
  ctaBorder: string;
  ctaHover: string;
  ctaHoverText: string;
  desktopMediaPosition?: string;
  desktopMediaScale?: number;
}

export const HERO_TOKENS = {
  text: {
    primary: '#102A43',
    secondary: '#596579',
  },
  sections: {
    harassment: {
      background: '#FEEAEC',
      ctaText: '#9E384E',
      ctaBorder: '#9E384E',
      ctaHover: '#B84A62',
      ctaHoverText: '#FFFFFF',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.05,
    },
    rickshaw: {
      background: '#E4F8EE',
      ctaText: '#9A520A',
      ctaBorder: '#9A520A',
      ctaHover: '#D9822B',
      ctaHoverText: '#050505',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.0,
    },
    extortion: {
      background: '#FEEADE',
      ctaText: '#4F5D95',
      ctaBorder: '#4F5D95',
      ctaHover: '#4F5D95',
      ctaHoverText: '#FFFFFF',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.0,
    },
    load_shedding: {
      background: '#FEEDD4',
      ctaText: '#0A756E',
      ctaBorder: '#0A756E',
      ctaHover: '#0D9488',
      ctaHoverText: '#050505',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.0,
    },
  } satisfies Record<SectionKey, HeroSectionTheme>,
};

export const HERO_SLIDER_BEHAVIOR = {
  autoplayIntervalMs: 35_000,
  swipeThresholdPx: 45,
  swipeDominanceRatio: 1.2,
  transitionDurationMs: 500,
} as const;

export const HERO_SLIDER_TOKENS = {
  layout: {
    container:
      'group w-full ui-radius-card ui-border-default ui-elevation-card relative overflow-hidden transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus',
    staticContainer:
      'w-full ui-radius-card ui-border-default ui-elevation-card relative overflow-hidden transition-colors',
    track: 'flex w-full items-stretch',
    trackTransition: 'transition-transform duration-500 ease-out',
    slide: 'w-full shrink-0 min-w-full p-0',
    grid: 'grid grid-cols-1 lg:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-stretch min-h-[160px] md:min-h-[180px] lg:min-h-[230px] xl:min-h-[250px]',
    contentCol:
      'px-4 pt-4 pb-2 sm:px-5 sm:pt-5 sm:pb-3 md:px-6 md:py-6 lg:px-8 lg:py-7 xl:px-10 xl:py-8 flex flex-col justify-center items-center lg:items-start text-center lg:text-left min-w-0 z-10 space-y-2 md:space-y-3',
    mediaCol:
      'w-full h-[150px] sm:h-[180px] md:h-auto lg:h-full flex items-center justify-center lg:justify-end relative pointer-events-none select-none min-w-0 overflow-hidden',
    ctaRow: 'pt-2 sm:pt-2.5 md:pt-1.5 w-full flex justify-center lg:justify-start',
    ctaButton: 'w-auto shadow-none btn-hero-cta',
  },
  typography: {
    title: 'type-h1 tracking-tight',
    mobileDesc: 'block md:hidden type-body text-center max-w-md mx-auto',
    tabletDesc: 'hidden md:block lg:hidden type-body max-w-xl text-center lg:text-left',
    desktopDesc: 'hidden lg:block type-body max-w-xl',
  },
  media: {
    image:
      'w-full h-full object-cover object-center md:h-auto md:max-h-[220px] md:object-contain lg:max-h-none lg:h-full lg:w-full lg:object-cover hero-desktop-media-framed mx-auto block',
    placeholder:
      'w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 ui-radius-card bg-ui-surface-subtle/60 ui-border-default border-ui-stroke-subtle/40 opacity-40 shrink-0 m-4 lg:m-0',
  },
  navArrows: {
    base: 'hidden [@media(min-width:1440px)_and_(hover:hover)_and_(pointer:fine)]:flex absolute top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-ui-surface/90 hover:bg-ui-surface text-ui-content-primary border border-ui-stroke-subtle shadow-md backdrop-blur-xs items-center justify-center cursor-pointer transition-opacity duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus',
    prev: 'left-3',
    next: 'right-3',
    icon: 'w-5 h-5',
  },
} as const;

export const getHeroCtaStyle = (section: SectionKey): React.CSSProperties => {
  const t = HERO_TOKENS.sections[section];
  if (!t) return {};
  return {
    '--hero-cta-text': t.ctaText,
    '--hero-cta-border': t.ctaBorder,
    '--hero-cta-hover-bg': t.ctaHover,
    '--hero-cta-hover-border': t.ctaHover,
    '--hero-cta-hover-text': t.ctaHoverText,
  } as React.CSSProperties;
};
