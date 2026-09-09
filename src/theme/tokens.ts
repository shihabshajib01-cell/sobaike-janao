import React from 'react';

export const SECTIONS = {
  harassment: {
    key: 'harassment' as const,
    slug: '/harassment',
    nameBn: 'হয়রানি ও নির্যাতনের বিরুদ্ধে জানান',
    nameEn: 'Report Harassment & Abuse',
    shortNameBn: 'হয়রানি',
    shortNameEn: 'Harassment',
    descriptionBn: 'শারীরিক বা মানসিক নির্যাতন, প্রতারণা ও অনলাইনে হেনস্তার অভিযোগ দায়িত্বশীলভাবে প্রকাশ করুন।',
    descriptionEn: 'Report physical or psychological abuse, relationship deception, or online harassment responsibly.',
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
    nameBn: 'অবৈধ চার্জিং স্টেশন প্রকাশ করুন',
    nameEn: 'Expose Unsafe Charging Stations',
    shortNameBn: 'চার্জিং',
    shortNameEn: 'Charging',
    descriptionBn: 'আবাসিক বা ঝুঁকিপূর্ণ এলাকায় অননুমোদিত চার্জিং স্টেশন ও অনিরাপদ সংযোগের তথ্য জানান।',
    descriptionEn: 'Report locations and hazards of unauthorized auto-rickshaw battery charging stations.',
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
    nameBn: 'চাঁদাবাজির তথ্য প্রকাশ করুন',
    nameEn: 'Report Local Extortion',
    shortNameBn: 'চাঁদাবাজি',
    shortNameEn: 'Extortion',
    descriptionBn: 'দোকানপাট, বাজার, পরিবহন স্ট্যান্ড বা নির্মাণকাজে জোরপূর্বক অর্থ আদায় ও হুমকির বিরুদ্ধে তথ্য দিন।',
    descriptionEn: 'Report forced collections, extortion, and coercive illegal demands in local areas.',
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
    nameBn: 'ইউটিলিটি সেবা অভিযোগ',
    nameEn: 'Utility Service Complaints',
    shortNameBn: 'ইউটিলিটি',
    shortNameEn: 'Utility',
    descriptionBn: 'লোডশেডিং, গ্যাস সংকট বা অতিরিক্ত বিদ্যুৎ বিল সংক্রান্ত সমস্যা দায়িত্বশীলভাবে জানান।',
    descriptionEn: 'Report load shedding, gas shortages, or excess electricity bill issues responsibly.',
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
    nameBn: 'অবৈধ দখল রিপোর্টিং',
    nameEn: 'Illegal Occupation Reporting',
    shortNameBn: 'অবৈধ দখল',
    shortNameEn: 'Illegal Occupation',
    badgeBn: 'শীঘ্রই আসছে',
    badgeEn: 'Coming Soon',
    descriptionBn: 'এই রিপোর্টিং সেবাটি প্রস্তুত করা হচ্ছে এবং এখনো চালু হয়নি।',
    descriptionEn: 'This reporting service is being prepared and is not available yet.',
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
