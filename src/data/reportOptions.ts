import { SectionKey } from '../theme/tokens';

export interface SubcategoryOption {
  id: string;
  nameBn: string;
  nameEn: string;
  descriptionBn?: string;
  descriptionEn?: string;
  categoryGroup?: 'violence' | 'relationship_scam' | 'digital_intimate' | 'general';
  isSensitive?: boolean;
}

export const SEGMENT_SUBCATEGORIES: Record<SectionKey, SubcategoryOption[]> = {
  harassment: [
    {
      id: 'rape-sexual-violence',
      nameBn: 'ধর্ষণ',
      nameEn: 'Rape / Sexual Violence',
      descriptionBn: 'যৌন সহিংসতা বা ধর্ষণ সংক্রান্ত অভিযোগ',
      descriptionEn: 'Sexual violence, assault or rape allegation',
      categoryGroup: 'violence',
      isSensitive: true,
    },
    {
      id: 'sexual-harassment',
      nameBn: 'যৌন হয়রানি',
      nameEn: 'Sexual Harassment',
      descriptionBn: 'অনাকাঙ্ক্ষিত যৌন আচরণ, মন্তব্য বা স্পর্শ',
      descriptionEn: 'Unwanted sexual behavior, comments or physical touch',
      categoryGroup: 'violence',
    },
    {
      id: 'domestic-violence',
      nameBn: 'পারিবারিক সহিংসতা',
      nameEn: 'Domestic Violence',
      descriptionBn: 'পরিবার বা সম্পর্কের মধ্যে শারীরিক/মানসিক নির্যাতন',
      descriptionEn: 'Physical or emotional abuse within family or relationship',
      categoryGroup: 'violence',
    },
    {
      id: 'blackmail-coercion',
      nameBn: 'ব্ল্যাকমেইলিং',
      nameEn: 'Blackmailing',
      descriptionBn: 'ব্যক্তিগত ছবি, ভিডিও বা তথ্য ব্যবহার করে ভয় দেখানো',
      descriptionEn: 'Blackmail or threats using photos, videos, or personal information',
      categoryGroup: 'digital_intimate',
      isSensitive: true,
    },
    {
      id: 'honeytrap',
      nameBn: 'হানিট্র্যাপ',
      nameEn: 'Honeytrap',
      descriptionBn: 'প্রলোভন, প্রতারণা বা ফাঁদে ফেলে হয়রানি',
      descriptionEn: 'Lure, deception, or entrapped harassment',
      categoryGroup: 'relationship_scam',
    },
  ],
  rickshaw: [
    {
      id: 'charging-station-location',
      nameBn: 'অবৈধ চার্জিং স্টেশন',
      nameEn: 'Illegal Charging Station',
      descriptionBn: 'অবৈধ বিদ্যুৎ সংযোগ বা অগ্নিঝুঁকিপূর্ণ ব্যাটারি চার্জিং স্পট',
      descriptionEn: 'Report illegal power connections or hazardous battery charging points',
    },
  ],
  extortion: [
    {
      id: 'shop-business',
      nameBn: 'দোকান ও ব্যবসা প্রতিষ্ঠানে চাঁদা দাবি',
      nameEn: 'Extortion from Shops & Businesses',
      descriptionBn: 'দোকান, বাজার বা ব্যবসা প্রতিষ্ঠানে জোরপূর্বক চাঁদা দাবি',
      descriptionEn: 'Forced money demands from shops and commercial establishments',
    },
    {
      id: 'transport-movement',
      nameBn: 'পরিবহন বা চলাচলে চাঁদা দাবি',
      nameEn: 'Extortion in Transport & Transit',
      descriptionBn: 'বাস, সিএনজি, লেগুনা বা চলাচলের রাস্তায় চাঁদা আদায়',
      descriptionEn: 'Forced money demands on transport stands, routes, or transit',
    },
    {
      id: 'construction-property',
      nameBn: 'নির্মাণ/সম্পত্তি সংক্রান্ত চাঁদা দাবি',
      nameEn: 'Construction & Property Extortion',
      descriptionBn: 'ভবন নির্মাণ বা সম্পত্তি ব্যবহারে চাঁদা ও বাধা সৃষ্টি',
      descriptionEn: 'Demands related to building construction or property use',
    },
    {
      id: 'threat-money-demand',
      nameBn: 'হুমকি দিয়ে টাকা দাবি',
      nameEn: 'Threats & Coercive Demands',
      descriptionBn: 'ভয়ভীতি ও শারীরিক বা মানসিক চাপ দিয়ে টাকা আদায়',
      descriptionEn: 'Intimidation and threat-based extortion demands',
    },
    {
      id: 'extortion-other',
      nameBn: 'অন্যান্য চাঁদাবাজি',
      nameEn: 'Other Extortion',
      descriptionBn: 'অন্য যেকোনো ধরনের চাঁদাবাজি বা জবরদস্তির ঘটনা',
      descriptionEn: 'Any other extortion or coercive money collection',
    },
  ],
};

export const EVIDENCE_TYPES = [
  { id: 'screenshot', nameBn: 'স্ক্রিনশট (চ্যাট / পোস্ট / মেসেজ)', nameEn: 'Screenshots (Chat / Post)' },
  { id: 'photo', nameBn: 'ঘটনাস্থল বা পরিস্থিতির ছবি', nameEn: 'Site or Hazard Photos' },
  { id: 'video', nameBn: 'ভিডিও ফুটেজ (সিসিটিভি / মোবাইল রেকর্ড)', nameEn: 'Video Footage (CCTV / Mobile)' },
  { id: 'audio', nameBn: 'কথোপকথনের অডিও রেকর্ড', nameEn: 'Audio Recording' },
  { id: 'document', nameBn: 'কাগজপত্র বা রসিদ বা দরখাস্ত কপি', nameEn: 'Documents / Receipts / Letters' },
  { id: 'witness', nameBn: 'প্রত্যক্ষদর্শী ব্যক্তির সাক্ষ্য বা বক্তব্য', nameEn: 'Eyewitness Statements' },
  { id: 'other', nameBn: 'অন্যান্য প্রাসঙ্গিক তথ্য', nameEn: 'Other Supporting Info' },
];

export const INTIMATE_WHAT_HAPPENED_OPTIONS = [
  { id: 'threatened', nameBn: 'ফাঁস করার হুমকি দেওয়া হচ্ছে (Threatened to share)', nameEn: 'Threatening to distribute' },
  { id: 'already_shared', nameBn: 'ইতিমধ্যে অনলাইনে বা অন্যদের কাছে ছড়ানো হয়েছে', nameEn: 'Already shared / distributed' },
  { id: 'recorded_secretly', nameBn: 'গোপনে সম্মতি ছাড়া ছবি বা ভিডিও ধারণ করা হয়েছে', nameEn: 'Recorded secretly without consent' },
  { id: 'manipulated_deepfake', nameBn: 'ছবি বা ভিডিও বিকৃত / এডিট / ডিপফেক করা হয়েছে', nameEn: 'Manipulated / Edited / Deepfake content' },
  { id: 'other', nameBn: 'অন্যান্য পরিস্থিতি', nameEn: 'Other situation' },
];

export const INTIMATE_PLATFORMS = [
  { id: 'facebook', nameBn: 'ফেসবুক (Facebook)', nameEn: 'Facebook' },
  { id: 'messenger', nameBn: 'মেসেঞ্জার (Messenger)', nameEn: 'Messenger' },
  { id: 'whatsapp', nameBn: 'হোয়াটসঅ্যাপ (WhatsApp)', nameEn: 'WhatsApp' },
  { id: 'telegram', nameBn: 'টেলিগ্রাম (Telegram)', nameEn: 'Telegram' },
  { id: 'dating_app', nameBn: 'ডেটিং বা ম্যাট্রিমোনিয়াল অ্যাপ', nameEn: 'Dating / Matrimonial App' },
  { id: 'website', nameBn: 'কোনো ওয়েবসাইট বা ফোরাম', nameEn: 'Website or Forum' },
  { id: 'in_person', nameBn: 'সরাসরি ব্যক্তি বা এলাকায়', nameEn: 'In Person / Offline' },
  { id: 'other', nameBn: 'অন্যান্য মাধ্যম', nameEn: 'Other Channel' },
];

export const BANGLADESH_HELPLINES = [
  {
    number: '999',
    labelBn: 'জাতীয় জরুরি সেবা',
    labelEn: 'National Emergency Service',
    descBn: 'পুলিশ, ফায়ার সার্ভিস ও অ্যাম্বুলেন্স জরুরি সহায়তা সেবা।',
    descEn: 'Emergency service contact for police, fire service, and ambulance support.',
  },
  {
    number: '109',
    labelBn: 'নারী ও শিশু নির্যাতন প্রতিরোধ হেল্পলাইন',
    labelEn: 'Violence Against Women & Children Helpline',
    descBn: 'যৌন হয়রানি ও পারিবারিক সহিংসতায় আইনি ও পুনর্বাসন সহায়তা।',
    descEn: 'Assistance for gender-based violence, abuse, and harassment support.',
  },
  {
    number: '333',
    labelBn: 'জাতীয় তথ্য বাতায়ন ও নাগরিক সেবা',
    labelEn: 'National Public & Civic Services Desk',
    descBn: 'নাগরিক তথ্য ও সামাজিক সমস্যা সংক্রান্ত তথ্য ও সহায়তা।',
    descEn: 'Public information and civic service grievance assistance.',
  },
  {
    number: '13219',
    labelBn: 'বিআরটিএ যাত্রী কল্যাণ হেল্পলাইন',
    labelEn: 'BRTA Passenger Grievance',
    descBn: 'গণপরিবহন ও বাসের ভাড়া ও যাত্রী সমস্যা সংক্রান্ত সহায়তা।',
    descEn: 'Transit fare violations and commuter issues assistance desk.',
  },
  {
    number: '16122',
    labelBn: 'ভোক্তা অধিকার তথ্য ডেস্ক',
    labelEn: 'Consumer Rights Support Desk',
    descBn: 'অযৌক্তিক মূল্য আদায় ও ভোক্তা অধিকার লঙ্ঘন সংক্রান্ত সহায়তা।',
    descEn: 'Consumer rights, pricing disputes, and commerce guidance.',
  },
  {
    number: '1098',
    labelBn: 'শিশু সুরক্ষা ও সহায়তা হেল্পলাইন',
    labelEn: 'Child Helpline',
    descBn: 'ঝুঁকিগ্রস্ত শিশুদের সুরক্ষা ও প্রয়োজনীয় পরামর্শের জন্য।',
    descEn: 'Emergency care, protection, and advocacy for minors.',
  },
];

