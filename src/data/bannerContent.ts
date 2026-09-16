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
 * Existing illustrations are preserved. Newly introduced categories intentionally use
 * an empty illustration source until category-specific artwork is approved, avoiding
 * misleading reuse of another complaint category's visual.
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
  extortion: {
    section: 'extortion',
    titleBn: 'ঘুষ ও চাঁদাবাজি',
    titleEn: 'Bribery & Extortion',
    mobileDescriptionBn: 'আপনার কাছে কি ঘুষ বা অবৈধ চাঁদা দাবি করা হয়েছে?',
    mobileDescriptionEn: 'Have you faced a bribe demand, extortion, or coercive payment?',
    tabletDescriptionBn: 'ঘুষ, অবৈধ চাঁদা, হুমকি বা জোরপূর্বক অর্থ আদায়ের তথ্য জানান।',
    tabletDescriptionEn: 'Report bribery, illegal demands, threats, or forced payment collection.',
    desktopDescriptionBn: 'সেবা, ব্যবসা, পরিবহন বা এলাকায় ঘুষ, অবৈধ অর্থ দাবি, হুমকি বা জোরপূর্বক আদায়ের তথ্য জানান।',
    desktopDescriptionEn: 'Report bribery, illegal payment demands, threats, or forced collections in services and local areas.',
    illustrationSrc: '/illustrations/services/extortion-hero-shopkeeper-coercion-v02.jpg',
    primaryCtaBn: 'রিপোর্ট করুন',
    primaryCtaEn: 'Report now',
  },
  public_safety: {
    section: 'public_safety',
    titleBn: 'জননিরাপত্তা',
    titleEn: 'Public Safety',
    mobileDescriptionBn: 'চুরি, ডাকাতি বা ছিনতাইয়ের কোনো ঘটনা দেখেছেন বা ভুক্তভোগী হয়েছেন?',
    mobileDescriptionEn: 'Have you witnessed or experienced theft, robbery, or snatching?',
    tabletDescriptionBn: 'চুরি, ডাকাতি, ছিনতাই ও সংশ্লিষ্ট জননিরাপত্তার ঘটনার তথ্য জানান।',
    tabletDescriptionEn: 'Report theft, robbery, snatching, and related public-safety incidents.',
    desktopDescriptionBn: 'চুরি, ডাকাতি বা ছিনতাইয়ের ঘটনা, স্থান, সময় এবং প্রাসঙ্গিক তথ্য নিরাপদভাবে জানান।',
    desktopDescriptionEn: 'Report the place, time, and relevant details of theft, robbery, or snatching incidents.',
    illustrationSrc: '',
    primaryCtaBn: 'রিপোর্ট করুন',
    primaryCtaEn: 'Report now',
  },
  road_transport: {
    section: 'road_transport',
    titleBn: 'সড়ক ও যাতায়াত সমস্যা',
    titleEn: 'Road & Transport Issues',
    mobileDescriptionBn: 'রাস্তা মেরামতে বিলম্ব, দুর্ঘটনা বা সড়ক অবরোধের সমস্যা আছে?',
    mobileDescriptionEn: 'Is there a delayed road repair, accident, or road obstruction?',
    tabletDescriptionBn: 'রাস্তা মেরামতে বিলম্ব, সড়ক দুর্ঘটনা বা চলাচলে বাধার তথ্য জানান।',
    tabletDescriptionEn: 'Report delayed road repairs, road accidents, or travel obstructions.',
    desktopDescriptionBn: 'রাস্তা মেরামতে বিলম্ব, সড়ক দুর্ঘটনা, অবরোধ বা চলাচলে বাধার স্থান ও বিস্তারিত তথ্য জানান।',
    desktopDescriptionEn: 'Report locations and details of delayed road repairs, road accidents, blocks, or travel obstructions.',
    illustrationSrc: '',
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
  illegal_occupation: {
    section: 'illegal_occupation',
    titleBn: 'অবৈধ দখল',
    titleEn: 'Illegal Occupation',
    mobileDescriptionBn: 'রাস্তা, ফুটপাত বা কোনো জমি ও সম্পত্তি অবৈধভাবে দখল করা হয়েছে?',
    mobileDescriptionEn: 'Is a public space, land, or property being occupied illegally?',
    tabletDescriptionBn: 'রাস্তা, ফুটপাত, ব্যক্তিগত বা সরকারি জমি ও সম্পত্তির অবৈধ দখল জানান।',
    tabletDescriptionEn: 'Report illegal occupation of public space, private land, or government property.',
    desktopDescriptionBn: 'রাস্তা, ফুটপাত, ফুটওভার ব্রিজ, ব্যক্তিগত জমি বা সরকারি সম্পত্তির অবৈধ দখলের তথ্য জানান।',
    desktopDescriptionEn: 'Report illegal occupation of roads, footpaths, foot-over-bridges, private land, or government property.',
    illustrationSrc: '',
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
};
