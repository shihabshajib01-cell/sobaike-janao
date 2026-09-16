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
  extortion: {
    key: 'extortion' as const,
    slug: '/extortion',
    nameBn: 'ঘুষ ও চাঁদাবাজি',
    nameEn: 'Bribery & Extortion',
    shortNameBn: 'ঘুষ ও চাঁদাবাজি',
    shortNameEn: 'Bribery & Extortion',
    descriptionBn: 'ঘুষ দাবি, ঘুষ প্রদান, চাঁদাবাজি, অবৈধ অর্থ দাবি বা জবরদস্তির তথ্য জানান।',
    descriptionEn: 'Report bribery, extortion, illegal payment demands, or coercive collections.',
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
  public_safety: {
    key: 'public_safety' as const,
    slug: '/public-safety',
    nameBn: 'জননিরাপত্তা',
    nameEn: 'Public Safety',
    shortNameBn: 'জননিরাপত্তা',
    shortNameEn: 'Public Safety',
    descriptionBn: 'চুরি, ডাকাতি বা ছিনতাইয়ের ঘটনা ও প্রাসঙ্গিক তথ্য জানান।',
    descriptionEn: 'Report theft, robbery, snatching, and related public-safety incidents.',
    primaryColor: '#3A7CA5',
    hoverColor: '#1B4D6B',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    textColor: '#1B4D6B',
    colors: {
      primary: '#3A7CA5',
      hover: '#1B4D6B',
      lightBg: '#EFF6FF',
      bgLight: '#EFF6FF',
      border: '#BFDBFE',
      text: '#1B4D6B',
      textSafe: '#1B4D6B',
      filledText: '#FFFFFF',
    },
  },
  road_transport: {
    key: 'road_transport' as const,
    slug: '/road-transport',
    nameBn: 'সড়ক ও যাতায়াত সমস্যা',
    nameEn: 'Road & Transport Issues',
    shortNameBn: 'সড়ক ও যাতায়াত',
    shortNameEn: 'Road & Transport',
    descriptionBn: 'রাস্তা মেরামতে বিলম্ব, সড়ক দুর্ঘটনা বা সড়ক অবরোধের তথ্য জানান।',
    descriptionEn: 'Report road repair delays, road accidents, or road blocks and obstructions.',
    primaryColor: '#B45309',
    hoverColor: '#92400E',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    textColor: '#92400E',
    colors: {
      primary: '#B45309',
      hover: '#92400E',
      lightBg: '#FFFBEB',
      bgLight: '#FFFBEB',
      border: '#FDE68A',
      text: '#92400E',
      textSafe: '#92400E',
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
  illegal_occupation: {
    key: 'illegal_occupation' as const,
    slug: '/illegal-occupation',
    nameBn: 'অবৈধ দখল',
    nameEn: 'Illegal Occupation',
    shortNameBn: 'অবৈধ দখল',
    shortNameEn: 'Illegal Occupation',
    descriptionBn: 'রাস্তা, ফুটপাত, ব্যক্তিগত বা সরকারি জমি/সম্পত্তির অবৈধ দখলের তথ্য জানান।',
    descriptionEn: 'Report illegal occupation of roads, footpaths, private land, or government property.',
    primaryColor: '#6B7280',
    hoverColor: '#4B5563',
    bgColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    textColor: '#374151',
    colors: {
      primary: '#6B7280',
      hover: '#4B5563',
      lightBg: '#F3F4F6',
      bgLight: '#F3F4F6',
      border: '#D1D5DB',
      text: '#374151',
      textSafe: '#374151',
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
};

export type SectionKey = keyof typeof SECTIONS;

// Kept as a compatibility contract for any future upcoming services.
// Illegal occupation has moved into the active SECTIONS taxonomy above.
export interface ComingSoonServiceConfig {
  key: string;
  slug: string;
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

export const COMING_SOON_SERVICES: Record<string, ComingSoonServiceConfig> = {};

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
  desktopMediaTranslateY?: string;
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
      desktopMediaTranslateY: '10px',
    },
    extortion: {
      background: '#FEEADE',
      ctaText: '#4F5D95',
      ctaBorder: '#4F5D95',
      ctaHover: '#4F5D95',
      ctaHoverText: '#FFFFFF',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.0,
      desktopMediaTranslateY: undefined,
    },
    public_safety: {
      background: '#EFF6FF',
      ctaText: '#1B4D6B',
      ctaBorder: '#3A7CA5',
      ctaHover: '#3A7CA5',
      ctaHoverText: '#FFFFFF',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.0,
      desktopMediaTranslateY: undefined,
    },
    road_transport: {
      background: '#FFFBEB',
      ctaText: '#92400E',
      ctaBorder: '#B45309',
      ctaHover: '#B45309',
      ctaHoverText: '#FFFFFF',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.0,
      desktopMediaTranslateY: undefined,
    },
    load_shedding: {
      background: '#FEEDD4',
      ctaText: '#0A756E',
      ctaBorder: '#0A756E',
      ctaHover: '#0D9488',
      ctaHoverText: '#050505',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.0,
      desktopMediaTranslateY: undefined,
    },
    illegal_occupation: {
      background: '#F3F4F6',
      ctaText: '#374151',
      ctaBorder: '#6B7280',
      ctaHover: '#6B7280',
      ctaHoverText: '#FFFFFF',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.0,
      desktopMediaTranslateY: undefined,
    },
    rickshaw: {
      background: '#E4F8EE',
      ctaText: '#9A520A',
      ctaBorder: '#9A520A',
      ctaHover: '#D9822B',
      ctaHoverText: '#050505',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.0,
      desktopMediaTranslateY: undefined,
    },
  } satisfies Record<SectionKey, HeroSectionTheme>,
};

export const HERO_SLIDER_BEHAVIOR = {
  autoplayIntervalMs: 15_000,
  swipeThresholdPx: 45,
  swipeDominanceRatio: 1.2,
  transitionDurationMs: 500,
} as const;

export const HERO_SLIDER_TOKENS = {
  dimensions: {
    mediaHeightMobile: '150px',
    mediaHeightSmall: '180px',
    mediaMaxHeightTablet: '220px',

    minHeightMobile: '160px',
    minHeightTablet: '180px',
    minHeightDesktop: '230px',
    minHeightLargeDesktop: '250px',
  },

  spacing: {
    contentMobileX: '1rem',
    contentMobileTop: '1rem',
    contentMobileBottom: '0.5rem',

    contentSmallX: '1.25rem',
    contentSmallTop: '1.25rem',
    contentSmallBottom: '0.75rem',

    contentTabletX: '1.5rem',
    contentTabletY: '1.5rem',

    contentDesktopX: '2rem',
    contentDesktopY: '1.75rem',

    contentLargeDesktopX: '2.5rem',
    contentLargeDesktopY: '2rem',

    contentGapMobile: '0.5rem',
    contentGapTablet: '0.75rem',

    ctaTopMobile: '0.5rem',
    ctaTopSmall: '0.625rem',
    ctaTopTablet: '0.375rem',
  },

  media: {
    mobileFit: 'cover',
    mobilePosition: 'center',
    tabletFit: 'contain',
    desktopFit: 'cover',
    defaultDesktopPosition: 'center bottom',
    defaultDesktopScale: 1,
  },

  controls: {
    arrowSize: '44px',
    arrowOffset: '12px',
    arrowIconSize: '20px',
  },
} as const;

export const getHeroSliderCssVars = (): React.CSSProperties =>
  ({
    '--hero-slider-media-mobile-h': HERO_SLIDER_TOKENS.dimensions.mediaHeightMobile,
    '--hero-slider-media-sm-h': HERO_SLIDER_TOKENS.dimensions.mediaHeightSmall,
    '--hero-slider-media-tablet-max-h': HERO_SLIDER_TOKENS.dimensions.mediaMaxHeightTablet,

    '--hero-slider-min-mobile': HERO_SLIDER_TOKENS.dimensions.minHeightMobile,
    '--hero-slider-min-tablet': HERO_SLIDER_TOKENS.dimensions.minHeightTablet,
    '--hero-slider-min-desktop': HERO_SLIDER_TOKENS.dimensions.minHeightDesktop,
    '--hero-slider-min-xl': HERO_SLIDER_TOKENS.dimensions.minHeightLargeDesktop,

    '--hero-slider-content-mobile-x': HERO_SLIDER_TOKENS.spacing.contentMobileX,
    '--hero-slider-content-mobile-top': HERO_SLIDER_TOKENS.spacing.contentMobileTop,
    '--hero-slider-content-mobile-bottom': HERO_SLIDER_TOKENS.spacing.contentMobileBottom,

    '--hero-slider-content-sm-x': HERO_SLIDER_TOKENS.spacing.contentSmallX,
    '--hero-slider-content-sm-top': HERO_SLIDER_TOKENS.spacing.contentSmallTop,
    '--hero-slider-content-sm-bottom': HERO_SLIDER_TOKENS.spacing.contentSmallBottom,

    '--hero-slider-content-tablet-x': HERO_SLIDER_TOKENS.spacing.contentTabletX,
    '--hero-slider-content-tablet-y': HERO_SLIDER_TOKENS.spacing.contentTabletY,

    '--hero-slider-content-desktop-x': HERO_SLIDER_TOKENS.spacing.contentDesktopX,
    '--hero-slider-content-desktop-y': HERO_SLIDER_TOKENS.spacing.contentDesktopY,

    '--hero-slider-content-xl-x': HERO_SLIDER_TOKENS.spacing.contentLargeDesktopX,
    '--hero-slider-content-xl-y': HERO_SLIDER_TOKENS.spacing.contentLargeDesktopY,

    '--hero-slider-content-gap-mobile': HERO_SLIDER_TOKENS.spacing.contentGapMobile,
    '--hero-slider-content-gap-tablet': HERO_SLIDER_TOKENS.spacing.contentGapTablet,

    '--hero-slider-cta-top-mobile': HERO_SLIDER_TOKENS.spacing.ctaTopMobile,
    '--hero-slider-cta-top-sm': HERO_SLIDER_TOKENS.spacing.ctaTopSmall,
    '--hero-slider-cta-top-tablet': HERO_SLIDER_TOKENS.spacing.ctaTopTablet,

    '--hero-slider-arrow-size': HERO_SLIDER_TOKENS.controls.arrowSize,
    '--hero-slider-arrow-offset': HERO_SLIDER_TOKENS.controls.arrowOffset,
    '--hero-slider-arrow-icon-size': HERO_SLIDER_TOKENS.controls.arrowIconSize,

    '--hero-slider-media-fit-mobile': HERO_SLIDER_TOKENS.media.mobileFit,
    '--hero-slider-media-position-mobile': HERO_SLIDER_TOKENS.media.mobilePosition,
    '--hero-slider-media-fit-tablet': HERO_SLIDER_TOKENS.media.tabletFit,
    '--hero-slider-media-fit-desktop': HERO_SLIDER_TOKENS.media.desktopFit,

    '--hero-slider-transition-duration': `${HERO_SLIDER_BEHAVIOR.transitionDurationMs}ms`,
  } as React.CSSProperties);

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