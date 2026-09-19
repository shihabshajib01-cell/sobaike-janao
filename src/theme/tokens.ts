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
    primaryColor: 'var(--category-harassment-primary)',
    hoverColor: 'var(--category-harassment-hover)',
    bgColor: 'var(--category-harassment-container)',
    borderColor: 'var(--category-harassment-outline)',
    textColor: 'var(--category-harassment-on-container)',
    colors: {
      primary: 'var(--category-harassment-primary)',
      hover: 'var(--category-harassment-hover)',
      lightBg: 'var(--category-harassment-container)',
      bgLight: 'var(--category-harassment-container)',
      border: 'var(--category-harassment-outline)',
      text: 'var(--category-harassment-on-container)',
      textSafe: 'var(--category-harassment-on-container)',
      filledText: 'var(--category-harassment-on-primary)',
    },
  },
  extortion: {
    key: 'extortion' as const,
    slug: '/extortion',
    nameBn: 'চাঁদাবাজি ও ঘুষ',
    nameEn: 'Extortion & Bribery',
    shortNameBn: 'চাঁদাবাজি ও ঘুষ',
    shortNameEn: 'Extortion & Bribery',
    descriptionBn: 'চাঁদাবাজি, ঘুষ বা জোরপূর্বক অর্থ আদায়ের ঘটনা জানান।',
    descriptionEn: 'Report extortion, bribery, illegal tolls, or coercive payment demands.',
    primaryColor: 'var(--category-extortion-primary)',
    hoverColor: 'var(--category-extortion-hover)',
    bgColor: 'var(--category-extortion-container)',
    borderColor: 'var(--category-extortion-outline)',
    textColor: 'var(--category-extortion-on-container)',
    colors: {
      primary: 'var(--category-extortion-primary)',
      hover: 'var(--category-extortion-hover)',
      lightBg: 'var(--category-extortion-container)',
      bgLight: 'var(--category-extortion-container)',
      border: 'var(--category-extortion-outline)',
      text: 'var(--category-extortion-on-container)',
      textSafe: 'var(--category-extortion-on-container)',
      filledText: 'var(--category-extortion-on-primary)',
    },
  },
  public_safety: {
    key: 'public_safety' as const,
    slug: '/public-safety',
    nameBn: 'জননিরাপত্তা',
    nameEn: 'Public Safety',
    shortNameBn: 'জননিরাপত্তা',
    shortNameEn: 'Public Safety',
    descriptionBn: 'চুরি, ডাকাতি, ছিনতাই বা মব সহিংসতার ঘটনা ও অবস্থান জানান।',
    descriptionEn: 'Report theft, robbery, snatching, mob violence, and related public-safety incidents.',
    primaryColor: 'var(--category-public_safety-primary)',
    hoverColor: 'var(--category-public_safety-hover)',
    bgColor: 'var(--category-public_safety-container)',
    borderColor: 'var(--category-public_safety-outline)',
    textColor: 'var(--category-public_safety-on-container)',
    colors: {
      primary: 'var(--category-public_safety-primary)',
      hover: 'var(--category-public_safety-hover)',
      lightBg: 'var(--category-public_safety-container)',
      bgLight: 'var(--category-public_safety-container)',
      border: 'var(--category-public_safety-outline)',
      text: 'var(--category-public_safety-on-container)',
      textSafe: 'var(--category-public_safety-on-container)',
      filledText: 'var(--category-public_safety-on-primary)',
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
    primaryColor: 'var(--category-road_transport-primary)',
    hoverColor: 'var(--category-road_transport-hover)',
    bgColor: 'var(--category-road_transport-container)',
    borderColor: 'var(--category-road_transport-outline)',
    textColor: 'var(--category-road_transport-on-container)',
    colors: {
      primary: 'var(--category-road_transport-primary)',
      hover: 'var(--category-road_transport-hover)',
      lightBg: 'var(--category-road_transport-container)',
      bgLight: 'var(--category-road_transport-container)',
      border: 'var(--category-road_transport-outline)',
      text: 'var(--category-road_transport-on-container)',
      textSafe: 'var(--category-road_transport-on-container)',
      filledText: 'var(--category-road_transport-on-primary)',
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
    primaryColor: 'var(--category-load_shedding-primary)',
    hoverColor: 'var(--category-load_shedding-hover)',
    bgColor: 'var(--category-load_shedding-container)',
    borderColor: 'var(--category-load_shedding-outline)',
    textColor: 'var(--category-load_shedding-on-container)',
    colors: {
      primary: 'var(--category-load_shedding-primary)',
      hover: 'var(--category-load_shedding-hover)',
      lightBg: 'var(--category-load_shedding-container)',
      bgLight: 'var(--category-load_shedding-container)',
      border: 'var(--category-load_shedding-outline)',
      text: 'var(--category-load_shedding-on-container)',
      textSafe: 'var(--category-load_shedding-on-container)',
      filledText: 'var(--category-load_shedding-on-primary)',
    },
  },
  illegal_occupation: {
    key: 'illegal_occupation' as const,
    slug: '/illegal-occupation',
    nameBn: 'অবৈধ দখল',
    nameEn: 'Illegal Occupation',
    shortNameBn: 'অবৈধ দখল',
    shortNameEn: 'Illegal Occupation',
    descriptionBn: 'রাস্তা, ফুটপাত, ব্যক্তিগত বা সরকারি জমি ও সম্পত্তির অবৈধ দখলের তথ্য জানান।',
    descriptionEn: 'Report illegal occupation of public space, private land, or government property.',
    primaryColor: 'var(--category-illegal_occupation-primary)',
    hoverColor: 'var(--category-illegal_occupation-hover)',
    bgColor: 'var(--category-illegal_occupation-container)',
    borderColor: 'var(--category-illegal_occupation-outline)',
    textColor: 'var(--category-illegal_occupation-on-container)',
    colors: {
      primary: 'var(--category-illegal_occupation-primary)',
      hover: 'var(--category-illegal_occupation-hover)',
      lightBg: 'var(--category-illegal_occupation-container)',
      bgLight: 'var(--category-illegal_occupation-container)',
      border: 'var(--category-illegal_occupation-outline)',
      text: 'var(--category-illegal_occupation-on-container)',
      textSafe: 'var(--category-illegal_occupation-on-container)',
      filledText: 'var(--category-illegal_occupation-on-primary)',
    },
  },
  rickshaw: {
    key: 'rickshaw' as const,
    slug: '/rickshaw',
    nameBn: 'অবৈধ অটো-রিকশা চার্জিং স্টেশন',
    nameEn: 'Illegal Auto-rickshaw Charging Station',
    shortNameBn: 'চার্জিং',
    shortNameEn: 'Charging',
    descriptionBn: 'অবৈধ বা ঝুঁকিপূর্ণ চার্জিং স্টেশনের অবস্থান ও তথ্য দিন।',
    descriptionEn: 'Share the location and details of illegal or unsafe charging stations.',
    primaryColor: 'var(--category-rickshaw-primary)',
    hoverColor: 'var(--category-rickshaw-hover)',
    bgColor: 'var(--category-rickshaw-container)',
    borderColor: 'var(--category-rickshaw-outline)',
    textColor: 'var(--category-rickshaw-on-container)',
    colors: {
      primary: 'var(--category-rickshaw-primary)',
      hover: 'var(--category-rickshaw-hover)',
      lightBg: 'var(--category-rickshaw-container)',
      bgLight: 'var(--category-rickshaw-container)',
      border: 'var(--category-rickshaw-outline)',
      text: 'var(--category-rickshaw-on-container)',
      textSafe: 'var(--category-rickshaw-on-container)',
      filledText: 'var(--category-rickshaw-on-primary)',
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

/**
 * Legacy metadata retained temporarily for backwards compatibility with old
 * coming-soon links. Illegal occupation is now an active SECTIONS entry and is
 * deliberately filtered out of the report composer's upcoming-services list.
 */
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
    descriptionBn: 'এই সেবাটি এখন সক্রিয় প্রতিবেদনের অংশ।',
    descriptionEn: 'This service is now part of active reporting.',
    primaryColor: 'var(--category-illegal_occupation-primary)',
    bgColor: 'var(--category-illegal_occupation-container)',
    borderColor: 'var(--category-illegal_occupation-outline)',
    textColor: 'var(--category-illegal_occupation-on-container)',
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
  desktopMediaTranslateY?: string;
}

export const HERO_TOKENS = {
  text: {
    primary: 'var(--hero-text-primary)',
    secondary: 'var(--hero-text-secondary)',
  },
  sections: {
    harassment: {
      background: 'var(--hero-harassment-container)',
      ctaText: 'var(--category-harassment-hover)',
      ctaBorder: 'var(--category-harassment-hover)',
      ctaHover: 'var(--category-harassment-primary)',
      ctaHoverText: 'var(--category-harassment-on-primary)',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.05,
      desktopMediaTranslateY: '10px',
    },
    extortion: {
      background: 'var(--hero-extortion-container)',
      ctaText: 'var(--category-extortion-primary)',
      ctaBorder: 'var(--category-extortion-primary)',
      ctaHover: 'var(--category-extortion-primary)',
      ctaHoverText: 'var(--category-extortion-on-primary)',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.0,
      desktopMediaTranslateY: undefined,
    },
    public_safety: {
      background: 'var(--hero-public-safety-container)',
      ctaText: 'var(--category-public_safety-on-container)',
      ctaBorder: 'var(--category-public_safety-primary)',
      ctaHover: 'var(--category-public_safety-primary)',
      ctaHoverText: 'var(--category-public_safety-on-primary)',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.0,
      desktopMediaTranslateY: undefined,
    },
    road_transport: {
      background: 'var(--hero-road-transport-container)',
      ctaText: 'var(--category-road_transport-on-container)',
      ctaBorder: 'var(--category-road_transport-primary)',
      ctaHover: 'var(--category-road_transport-primary)',
      ctaHoverText: 'var(--category-road_transport-on-primary)',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.0,
      desktopMediaTranslateY: undefined,
    },
    load_shedding: {
      background: 'var(--hero-load-shedding-container)',
      ctaText: 'var(--category-load_shedding-on-container)',
      ctaBorder: 'var(--category-load_shedding-on-container)',
      ctaHover: 'var(--category-load_shedding-primary)',
      ctaHoverText: 'var(--category-load_shedding-on-primary)',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.0,
      desktopMediaTranslateY: undefined,
    },
    illegal_occupation: {
      background: 'var(--hero-illegal-occupation-container)',
      ctaText: 'var(--category-illegal_occupation-on-container)',
      ctaBorder: 'var(--category-illegal_occupation-primary)',
      ctaHover: 'var(--category-illegal_occupation-primary)',
      ctaHoverText: 'var(--category-illegal_occupation-on-primary)',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.0,
      desktopMediaTranslateY: undefined,
    },
    rickshaw: {
      background: 'var(--hero-rickshaw-container)',
      ctaText: 'var(--category-rickshaw-on-container)',
      ctaBorder: 'var(--category-rickshaw-on-container)',
      ctaHover: 'var(--category-rickshaw-primary)',
      ctaHoverText: 'var(--category-rickshaw-on-primary)',
      desktopMediaPosition: 'center bottom',
      desktopMediaScale: 1.0,
      desktopMediaTranslateY: undefined,
    },
  } satisfies Record<SectionKey, HeroSectionTheme>,
};

export const HERO_SLIDER_BEHAVIOR = {
  autoplayIntervalMs: 6_000,
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

  if (!t) {
    const key = String(section).replace(/[^a-z0-9_-]/gi, '');
    return {
      '--hero-cta-text': `var(--category-${key}-on-container, var(--md-on-surface))`,
      '--hero-cta-border': `var(--category-${key}-primary, var(--md-primary))`,
      '--hero-cta-hover-bg': `var(--category-${key}-primary, var(--md-primary))`,
      '--hero-cta-hover-border': `var(--category-${key}-primary, var(--md-primary))`,
      '--hero-cta-hover-text': `var(--category-${key}-on-primary, var(--md-on-primary))`,
    } as React.CSSProperties;
  }

  return {
    '--hero-cta-text': t.ctaText,
    '--hero-cta-border': t.ctaBorder,
    '--hero-cta-hover-bg': t.ctaHover,
    '--hero-cta-hover-border': t.ctaHover,
    '--hero-cta-hover-text': t.ctaHoverText,
  } as React.CSSProperties;
};