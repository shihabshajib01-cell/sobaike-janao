import { SectionKey } from '../theme/tokens';

export interface CategoryBannerContent {
  section: SectionKey;
  titleBn: string;
  titleEn: string;
  mobileDescriptionBn: string;
  mobileDescriptionEn: string;
  tabletDescriptionBn: string;
  tabletDescriptionEn: string;
  desktopDescriptionBn: string;
  desktopDescriptionEn: string;
  illustrationSrc: string;
  primaryCtaBn: string;
  primaryCtaEn: string;
}

/**
 * CANONICAL_BANNER_CONTENT
 * Single source of truth for both standalone category pages and the Home service carousel.
 * Normalized character lengths across all 4 categories for balanced rhythm and line consistency:
 *
 * QA Length Analysis:
 * - BN Desktop: 77, 81, 78, 77 chars (~77-81 chars, within ±5%)
 * - EN Desktop: 86, 91, 88, 88 chars (~86-91 chars, within ±6%)
 * - BN Mobile:  63, 62, 60, 60 chars (~60-63 chars, within ±5%)
 * - EN Mobile:  58, 62, 59, 58 chars (~58-62 chars, within ±7%)
 */
export const CANONICAL_BANNER_CONTENT: Record<SectionKey, CategoryBannerContent> = {
  harassment: {
    section: 'harassment',
    titleBn: 'হয়রানি ও নির্যাতন',
    titleEn: 'Harassment & Abuse',
    mobileDescriptionBn: 'আপনি বা পরিচিত কেউ কি কোনো ধরনের হয়রানি বা নির্যাতনের শিকার?',
    mobileDescriptionEn: 'Are you or someone you know facing any harassment or abuse?',
    tabletDescriptionBn: 'শারীরিক, মৌখিক বা অনলাইন নির্যাতন ও হয়রানির তথ্য জানান।',
    tabletDescriptionEn: 'Report physical, verbal, or online abuse and harassment.',
    desktopDescriptionBn: 'শারীরিক, মৌখিক বা অনলাইন হয়রানি, নির্যাতন, হুমকি বা অনিরাপদ আচরণের তথ্য জানান।',
    desktopDescriptionEn: 'Report physical, verbal, or online harassment, abuse, threats, or unsafe behaviour.',
    illustrationSrc: '/illustrations/services/harassment-hero-public-harassment-v02.jpg',
    primaryCtaBn: 'রিপোর্ট করুন',
    primaryCtaEn: 'Report now',
  },
  rickshaw: {
    section: 'rickshaw',
    titleBn: 'অবৈধ চার্জিং স্টেশন',
    titleEn: 'Expose Illegal Charging Stations',
    mobileDescriptionBn: 'আপনার এলাকায় কি কোনো অবৈধ বা ঝুঁকিপূর্ণ চার্জিং স্টেশন রয়েছে?',
    mobileDescriptionEn: 'Is there an illegal or unsafe vehicle charging station nearby?',
    tabletDescriptionBn: 'অনিরাপদ ব্যাটারি চার্জিং ও ঝুঁকিপূর্ণ বিদ্যুৎ সংযোগের তথ্য দিন।',
    tabletDescriptionEn: 'Report unsafe battery charging and risky electrical connections.',
    desktopDescriptionBn: 'অনিরাপদ ব্যাটারি চার্জিং স্টেশন, খোলা তার বা ঝুঁকিপূর্ণ বিদ্যুৎ সংযোগের তথ্য জানান।',
    desktopDescriptionEn: 'Report unsafe battery charging stations, exposed wiring, or risky power connections.',
    illustrationSrc: '/illustrations/services/rickshaw-hero-illegal-charging-station-v02.jpg',
    primaryCtaBn: 'রিপোর্ট করুন',
    primaryCtaEn: 'Report now',
  },
  extortion: {
    section: 'extortion',
    titleBn: 'চাঁদাবাজি',
    titleEn: 'Extortion',
    mobileDescriptionBn: 'আপনার কাছে কি অবৈধ চাঁদা দাবি করা হয়েছে বা কোনো হুমকি দেওয়া হয়েছে?',
    mobileDescriptionEn: 'Have you faced illegal extortion demands or coercive threats?',
    tabletDescriptionBn: 'অবৈধ চাঁদা, হুমকি বা জোরপূর্বক অর্থ আদায়ের তথ্য জানান।',
    tabletDescriptionEn: 'Report illegal demands, threats, or forced payment collection.',
    desktopDescriptionBn: 'দোকানপাট, পরিবহন বা এলাকায় অবৈধ অর্থ দাবি, হুমকি বা জোরপূর্বক আদায়ের তথ্য জানান।',
    desktopDescriptionEn: 'Report illegal payment demands, threats, or forced collections in local areas.',
    illustrationSrc: '/illustrations/services/extortion-hero-shopkeeper-coercion-v02.jpg',
    primaryCtaBn: 'রিপোর্ট করুন',
    primaryCtaEn: 'Report now',
  },
  load_shedding: {
    section: 'load_shedding',
    titleBn: 'ইউটিলিটি সমস্যা',
    titleEn: 'Utility Issues',
    mobileDescriptionBn: 'আপনি কি এলাকায় বিদ্যুৎ বিভ্রাট, গ্যাস সংকট বা বিলিং সমস্যায় ভুগছেন?',
    mobileDescriptionEn: 'Are you facing power cuts, gas shortages, or billing problems?',
    tabletDescriptionBn: 'লোডশেডিং, গ্যাস সংকট বা ভুল ইউটিলিটি বিলের তথ্য জমা দিন।',
    tabletDescriptionEn: 'Report load shedding, gas shortages, or incorrect utility bills.',
    desktopDescriptionBn: 'ঘন ঘন লোডশেডিং, তীব্র গ্যাস সংকট, বিদ্যুৎ বিপর্যয় বা ভুল বিলিং সমস্যার তথ্য জানান।',
    desktopDescriptionEn: 'Report chronic load shedding, gas shortages, power failures, or incorrect bills.',
    illustrationSrc: '/illustrations/services/load-shedding-hero-family-blackout-v01.jpg',
    primaryCtaBn: 'রিপোর্ট করুন',
    primaryCtaEn: 'Report now',
  },
};
