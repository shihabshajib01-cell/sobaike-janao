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
 * Single source of truth for standalone category pages and the Home service carousel.
 * Category-specific artwork lives under public/illustrations/services and is shared by
 * standalone category pages and the Home carousel to preserve one visual source of truth.
 */
// Bengali banner descriptions are intentionally kept at exactly 60 characters
// so every category has the same copy footprint in the shared hero system.
export const CANONICAL_BANNER_CONTENT: Record<SectionKey, CategoryBannerContent> = {
  harassment: {
    section: 'harassment',
    titleBn: 'হয়রানি ও নির্যাতন',
    titleEn: 'Harassment & Abuse',
    mobileDescriptionBn: 'আপনি বা পরিচিত কেউ কি এখন হয়রানি বা নির্যাতনের শিকার হয়েছেন?',
    mobileDescriptionEn: 'Have you or someone you know experienced harassment or abuse?',
    tabletDescriptionBn: 'আপনি বা পরিচিত কেউ কি এখন হয়রানি বা নির্যাতনের শিকার হয়েছেন?',
    tabletDescriptionEn: 'Have you or someone you know experienced harassment or abuse?',
    desktopDescriptionBn: 'আপনি বা পরিচিত কেউ কি এখন হয়রানি বা নির্যাতনের শিকার হয়েছেন?',
    desktopDescriptionEn: 'Have you or someone you know experienced harassment or abuse?',
    illustrationSrc: '/illustrations/services/harassment-hero-public-harassment-v02.jpg',
    primaryCtaBn: 'রিপোর্ট করুন',
    primaryCtaEn: 'Report Now',
  },
  extortion: {
    section: 'extortion',
    titleBn: 'ঘুষ ও চাঁদাবাজি',
    titleEn: 'Bribery & Extortion',
    mobileDescriptionBn: 'কখনো ঘুষ চাওয়া বা অবৈধভাবে টাকা দাবি করার কোনো ঘটনা দেখেছেন?',
    mobileDescriptionEn: 'Seen someone demand a bribe or illegally ask for money?',
    tabletDescriptionBn: 'কখনো ঘুষ চাওয়া বা অবৈধভাবে টাকা দাবি করার কোনো ঘটনা দেখেছেন?',
    tabletDescriptionEn: 'Seen someone demand a bribe or illegally ask for money?',
    desktopDescriptionBn: 'কখনো ঘুষ চাওয়া বা অবৈধভাবে টাকা দাবি করার কোনো ঘটনা দেখেছেন?',
    desktopDescriptionEn: 'Seen someone demand a bribe or illegally ask for money?',
    illustrationSrc: '/illustrations/services/extortion-hero-shopkeeper-coercion-v02.jpg',
    primaryCtaBn: 'রিপোর্ট করুন',
    primaryCtaEn: 'Report Now',
  },
  public_safety: {
    section: 'public_safety',
    titleBn: 'জননিরাপত্তা',
    titleEn: 'Public Safety',
    mobileDescriptionBn: 'চুরি, ডাকাতি, ছিনতাই বা অন্য কোনো জননিরাপত্তা ঝুঁকি দেখেছেন?',
    mobileDescriptionEn: 'Seen theft, robbery, snatching, or another public safety concern?',
    tabletDescriptionBn: 'চুরি, ডাকাতি, ছিনতাই বা অন্য কোনো জননিরাপত্তা ঝুঁকি দেখেছেন?',
    tabletDescriptionEn: 'Seen theft, robbery, snatching, or another public safety concern?',
    desktopDescriptionBn: 'চুরি, ডাকাতি, ছিনতাই বা অন্য কোনো জননিরাপত্তা ঝুঁকি দেখেছেন?',
    desktopDescriptionEn: 'Seen theft, robbery, snatching, or another public safety concern?',
    illustrationSrc: '/illustrations/services/public-safety-hero-rickshaw-snatching-v01.avif',
    primaryCtaBn: 'রিপোর্ট করুন',
    primaryCtaEn: 'Report Now',
  },
  road_transport: {
    section: 'road_transport',
    titleBn: 'সড়ক ও যানজট',
    titleEn: 'Road & Traffic',
    mobileDescriptionBn: 'ভাঙা রাস্তা, দুর্ঘটনার ঝুঁকি বা যানজটের কোনো সমস্যা দেখেছেন?',
    mobileDescriptionEn: 'Seen damaged roads, traffic hazards, or serious congestion nearby?',
    tabletDescriptionBn: 'ভাঙা রাস্তা, দুর্ঘটনার ঝুঁকি বা যানজটের কোনো সমস্যা দেখেছেন?',
    tabletDescriptionEn: 'Seen damaged roads, traffic hazards, or serious congestion nearby?',
    desktopDescriptionBn: 'ভাঙা রাস্তা, দুর্ঘটনার ঝুঁকি বা যানজটের কোনো সমস্যা দেখেছেন?',
    desktopDescriptionEn: 'Seen damaged roads, traffic hazards, or serious congestion nearby?',
    illustrationSrc: '/illustrations/services/road-transport-hero-broken-road-rickshaw-v01.avif',
    primaryCtaBn: 'রিপোর্ট করুন',
    primaryCtaEn: 'Report Now',
  },
  load_shedding: {
    section: 'load_shedding',
    titleBn: 'ইউটিলিটি সমস্যা',
    titleEn: 'Utility Issues',
    mobileDescriptionBn: 'বিদ্যুৎ, গ্যাস, পানি বা অন্যান্য ইউটিলিটি সমস্যায় কি ভুগছেন?',
    mobileDescriptionEn: 'Facing problems with electricity, gas, water, or other utilities?',
    tabletDescriptionBn: 'বিদ্যুৎ, গ্যাস, পানি বা অন্যান্য ইউটিলিটি সমস্যায় কি ভুগছেন?',
    tabletDescriptionEn: 'Facing problems with electricity, gas, water, or other utilities?',
    desktopDescriptionBn: 'বিদ্যুৎ, গ্যাস, পানি বা অন্যান্য ইউটিলিটি সমস্যায় কি ভুগছেন?',
    desktopDescriptionEn: 'Facing problems with electricity, gas, water, or other utilities?',
    illustrationSrc: '/illustrations/services/load-shedding-hero-family-blackout-v01.jpg',
    primaryCtaBn: 'রিপোর্ট করুন',
    primaryCtaEn: 'Report Now',
  },
  illegal_occupation: {
    section: 'illegal_occupation',
    titleBn: 'অবৈধ দখল',
    titleEn: 'Illegal Encroachment',
    mobileDescriptionBn: 'রাস্তা, ফুটপাত বা সরকারি জায়গা কোথাও অবৈধভাবে দখল করা হয়েছে?',
    mobileDescriptionEn: 'Seen roads, footpaths, or public spaces being occupied illegally?',
    tabletDescriptionBn: 'রাস্তা, ফুটপাত বা সরকারি জায়গা কোথাও অবৈধভাবে দখল করা হয়েছে?',
    tabletDescriptionEn: 'Seen roads, footpaths, or public spaces being occupied illegally?',
    desktopDescriptionBn: 'রাস্তা, ফুটপাত বা সরকারি জায়গা কোথাও অবৈধভাবে দখল করা হয়েছে?',
    desktopDescriptionEn: 'Seen roads, footpaths, or public spaces being occupied illegally?',
    illustrationSrc: '/illustrations/services/illegal-occupation-hero-footpath-encroachment-v01.avif',
    primaryCtaBn: 'রিপোর্ট করুন',
    primaryCtaEn: 'Report Now',
  },
  rickshaw: {
    section: 'rickshaw',
    titleBn: 'অবৈধ অটো চার্জিং',
    titleEn: 'Illegal Auto Charging',
    mobileDescriptionBn: 'আপনার এলাকায় অবৈধ বা ঝুঁকিপূর্ণ অটো চার্জিং কেন্দ্র দেখেছেন?',
    mobileDescriptionEn: 'Seen an illegal or unsafe auto charging station in your area?',
    tabletDescriptionBn: 'আপনার এলাকায় অবৈধ বা ঝুঁকিপূর্ণ অটো চার্জিং কেন্দ্র দেখেছেন?',
    tabletDescriptionEn: 'Seen an illegal or unsafe auto charging station in your area?',
    desktopDescriptionBn: 'আপনার এলাকায় অবৈধ বা ঝুঁকিপূর্ণ অটো চার্জিং কেন্দ্র দেখেছেন?',
    desktopDescriptionEn: 'Seen an illegal or unsafe auto charging station in your area?',
    illustrationSrc: '/illustrations/services/rickshaw-hero-illegal-charging-station-v02.jpg',
    primaryCtaBn: 'রিপোর্ট করুন',
    primaryCtaEn: 'Report Now',
  },
};
