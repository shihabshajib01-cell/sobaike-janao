import { SectionKey } from '../theme/tokens';

export type SubjectTypeValue = 'individual' | 'business' | 'group' | 'organization' | 'unknown';

export interface SubjectOptionItem {
  value: SubjectTypeValue;
  labelBn: string;
  labelEn: string;
}

export interface ReportSubjectConfig {
  sectionTitleBn: string;
  sectionTitleEn: string;
  questionBn: string;
  questionEn: string;
  options: SubjectOptionItem[];
}

const UNKNOWN_OPTION: SubjectOptionItem = {
  value: 'unknown',
  labelBn: 'অজ্ঞাত / নিশ্চিত নই',
  labelEn: 'Unknown / Not Sure',
};

const PERSON_GROUP_ORG_OPTIONS: SubjectOptionItem[] = [
  { value: 'individual', labelBn: 'ব্যক্তি', labelEn: 'Individual' },
  { value: 'group', labelBn: 'দল / একাধিক ব্যক্তি', labelEn: 'Group / Multiple People' },
  { value: 'organization', labelBn: 'প্রতিষ্ঠান / সংগঠন', labelEn: 'Organization' },
  UNKNOWN_OPTION,
];

export const REPORT_SUBJECT_CONFIGS: Record<string, ReportSubjectConfig> = {
  // Illegal auto-rickshaw charging
  'rickshaw:charging-station-location': {
    sectionTitleBn: '৩. চার্জিং স্টেশন / পরিচালনাকারীর তথ্য',
    sectionTitleEn: '3. Charging Station / Operator',
    questionBn: 'চার্জিং স্টেশন বা গ্যারেজটি কার দ্বারা পরিচালিত?',
    questionEn: 'Who operates this charging station or garage?',
    options: [
      { value: 'business', labelBn: 'চার্জিং স্টেশন / গ্যারেজ', labelEn: 'Charging Station / Garage' },
      { value: 'individual', labelBn: 'পরিচালনাকারী ব্যক্তি', labelEn: 'Individual Operator' },
      { value: 'organization', labelBn: 'প্রতিষ্ঠান / ভবন কর্তৃপক্ষ', labelEn: 'Organization / Building Authority' },
      UNKNOWN_OPTION,
    ],
  },
  'rickshaw:default': {
    sectionTitleBn: '৩. চার্জিং স্টেশন / পরিচালনাকারীর তথ্য',
    sectionTitleEn: '3. Charging Station / Operator',
    questionBn: 'চার্জিং স্টেশন বা গ্যারেজটি কার দ্বারা পরিচালিত?',
    questionEn: 'Who operates this charging station or garage?',
    options: [
      { value: 'business', labelBn: 'চার্জিং স্টেশন / গ্যারেজ', labelEn: 'Charging Station / Garage' },
      { value: 'individual', labelBn: 'পরিচালনাকারী ব্যক্তি', labelEn: 'Individual Operator' },
      { value: 'organization', labelBn: 'প্রতিষ্ঠান / ভবন কর্তৃপক্ষ', labelEn: 'Organization / Building Authority' },
      UNKNOWN_OPTION,
    ],
  },

  // Bribery
  'extortion:bribe-demanded-service': {
    sectionTitleBn: '৩. ঘুষ দাবিকারীর তথ্য',
    sectionTitleEn: '3. Bribe Demander Information',
    questionBn: 'কে ঘুষ দাবি করেছে?',
    questionEn: 'Who demanded the bribe?',
    options: [
      { value: 'individual', labelBn: 'কর্মকর্তা / কর্মচারী / ব্যক্তি', labelEn: 'Officer / Employee / Individual' },
      { value: 'organization', labelBn: 'অফিস / প্রতিষ্ঠান / সংস্থা', labelEn: 'Office / Organization / Agency' },
      { value: 'group', labelBn: 'একাধিক ব্যক্তি / মধ্যস্থতাকারী', labelEn: 'Multiple People / Intermediaries' },
      UNKNOWN_OPTION,
    ],
  },
  'extortion:bribe-paid': {
    sectionTitleBn: '৩. ঘুষ গ্রহণকারীর তথ্য',
    sectionTitleEn: '3. Bribe Recipient Information',
    questionBn: 'কে ঘুষ গ্রহণ করেছে?',
    questionEn: 'Who received the bribe?',
    options: [
      { value: 'individual', labelBn: 'কর্মকর্তা / কর্মচারী / ব্যক্তি', labelEn: 'Officer / Employee / Individual' },
      { value: 'organization', labelBn: 'অফিস / প্রতিষ্ঠান / সংস্থা', labelEn: 'Office / Organization / Agency' },
      { value: 'group', labelBn: 'একাধিক ব্যক্তি / মধ্যস্থতাকারী', labelEn: 'Multiple People / Intermediaries' },
      UNKNOWN_OPTION,
    ],
  },

  // Extortion
  'extortion:shop-business': {
    sectionTitleBn: '৩. চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: '3. Extortion Party Details',
    questionBn: 'চাঁদা কে দাবি করছে?',
    questionEn: 'Who is demanding the money?',
    options: [
      { value: 'individual', labelBn: 'ব্যক্তি / চাঁদা দাবিকারী', labelEn: 'Individual' },
      { value: 'group', labelBn: 'দল / সিন্ডিকেট', labelEn: 'Group / Syndicate' },
      { value: 'organization', labelBn: 'সমিতি / কমিটি / সংগঠন', labelEn: 'Association / Committee / Organization' },
      UNKNOWN_OPTION,
    ],
  },
  'extortion:transport-movement': {
    sectionTitleBn: '৩. চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: '3. Extortion Party Details',
    questionBn: 'চাঁদা কে আদায় করছে?',
    questionEn: 'Who is collecting the money?',
    options: [
      { value: 'individual', labelBn: 'চাঁদা আদায়কারী ব্যক্তি', labelEn: 'Individual Collector' },
      { value: 'group', labelBn: 'দল / সিন্ডিকেট', labelEn: 'Group / Syndicate' },
      { value: 'organization', labelBn: 'স্ট্যান্ড / পরিবহন সমিতি / কমিটি', labelEn: 'Stand / Transport Association / Committee' },
      UNKNOWN_OPTION,
    ],
  },
  'extortion:construction-property': {
    sectionTitleBn: '৩. চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: '3. Extortion Party Details',
    questionBn: 'চাঁদা বা বাধা কে দিচ্ছে?',
    questionEn: 'Who is demanding money or creating the obstruction?',
    options: [
      { value: 'individual', labelBn: 'ব্যক্তি / চাঁদা দাবিকারী', labelEn: 'Individual' },
      { value: 'group', labelBn: 'দল / সিন্ডিকেট', labelEn: 'Group / Syndicate' },
      { value: 'organization', labelBn: 'স্থানীয় সংগঠন / কমিটি', labelEn: 'Local Organization / Committee' },
      UNKNOWN_OPTION,
    ],
  },
  'extortion:threat-money-demand': {
    sectionTitleBn: '৩. চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: '3. Extortion Party Details',
    questionBn: 'হুমকি দিয়ে টাকা কে দাবি করছে?',
    questionEn: 'Who is making the threatening demand?',
    options: [
      { value: 'individual', labelBn: 'ব্যক্তি', labelEn: 'Individual' },
      { value: 'group', labelBn: 'দল / সিন্ডিকেট', labelEn: 'Group / Syndicate' },
      { value: 'organization', labelBn: 'সংগঠন / গ্রুপ', labelEn: 'Organization / Group' },
      { value: 'unknown', labelBn: 'অজ্ঞাত / ফোন বা অনলাইন পরিচিতি মাত্র', labelEn: 'Unknown / Phone or Online Identity Only' },
    ],
  },
  'extortion:extortion-other': {
    sectionTitleBn: '৩. চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: '3. Extortion Party Details',
    questionBn: 'চাঁদা বা অর্থ কে দাবি করছে?',
    questionEn: 'Who is demanding the money?',
    options: [
      { value: 'individual', labelBn: 'ব্যক্তি', labelEn: 'Individual' },
      { value: 'group', labelBn: 'দল / সিন্ডিকেট', labelEn: 'Group / Syndicate' },
      { value: 'organization', labelBn: 'প্রতিষ্ঠান / সংগঠন', labelEn: 'Organization' },
      UNKNOWN_OPTION,
    ],
  },
  'extortion:default': {
    sectionTitleBn: '৩. সংশ্লিষ্ট ব্যক্তি / পক্ষের তথ্য',
    sectionTitleEn: '3. Involved Person / Party Information',
    questionBn: 'ঘটনার সঙ্গে কে বা কারা জড়িত?',
    questionEn: 'Who is involved in this incident?',
    options: PERSON_GROUP_ORG_OPTIONS,
  },

  // Public Safety: suspect details are useful but often unknown, so always optional.
  'public_safety:theft': {
    sectionTitleBn: '৩. সন্দেহভাজন / জড়িত ব্যক্তির তথ্য',
    sectionTitleEn: '3. Suspect / Involved Person Information',
    questionBn: 'সন্দেহভাজন ব্যক্তি বা দল সম্পর্কে কিছু জানা আছে?',
    questionEn: 'Do you know anything about the suspect or involved party?',
    options: PERSON_GROUP_ORG_OPTIONS,
  },
  'public_safety:robbery': {
    sectionTitleBn: '৩. সন্দেহভাজন / জড়িত ব্যক্তির তথ্য',
    sectionTitleEn: '3. Suspect / Involved Person Information',
    questionBn: 'ডাকাতি বা ছিনতাইয়ে জড়িত ব্যক্তি বা দল সম্পর্কে কিছু জানা আছে?',
    questionEn: 'Do you know anything about the person or group involved?',
    options: PERSON_GROUP_ORG_OPTIONS,
  },
  'public_safety:snatching': {
    sectionTitleBn: '৩. সন্দেহভাজন / জড়িত ব্যক্তির তথ্য',
    sectionTitleEn: '3. Suspect / Involved Person Information',
    questionBn: 'ছিনতাইকারী ব্যক্তি বা দল সম্পর্কে কিছু জানা আছে?',
    questionEn: 'Do you know anything about the snatcher or involved group?',
    options: PERSON_GROUP_ORG_OPTIONS,
  },
  'public_safety:default': {
    sectionTitleBn: '৩. সন্দেহভাজন / জড়িত ব্যক্তির তথ্য',
    sectionTitleEn: '3. Suspect / Involved Person Information',
    questionBn: 'ঘটনার সঙ্গে জড়িত ব্যক্তি বা দল সম্পর্কে কিছু জানা আছে?',
    questionEn: 'Do you know anything about the person or group involved?',
    options: PERSON_GROUP_ORG_OPTIONS,
  },

  // Road & Transport Issues
  'road_transport:road-repair-delay': {
    sectionTitleBn: '৩. দায়িত্বশীল কর্তৃপক্ষ / ঠিকাদারের তথ্য',
    sectionTitleEn: '3. Responsible Authority / Contractor Information',
    questionBn: 'দায়িত্বশীল কর্তৃপক্ষ, ঠিকাদার বা প্রতিষ্ঠানের তথ্য জানা আছে?',
    questionEn: 'Do you know the responsible authority, contractor, or organization?',
    options: [
      { value: 'organization', labelBn: 'সরকারি / স্থানীয় কর্তৃপক্ষ', labelEn: 'Government / Local Authority' },
      { value: 'business', labelBn: 'ঠিকাদার / কোম্পানি', labelEn: 'Contractor / Company' },
      { value: 'individual', labelBn: 'দায়িত্বশীল ব্যক্তি / প্রতিনিধি', labelEn: 'Responsible Individual / Representative' },
      UNKNOWN_OPTION,
    ],
  },
  'road_transport:road-accident': {
    sectionTitleBn: '৩. জড়িত ব্যক্তি / যানবাহনের তথ্য',
    sectionTitleEn: '3. Involved Person / Vehicle Information',
    questionBn: 'জড়িত ব্যক্তি, চালক, যানবাহন বা প্রতিষ্ঠানের তথ্য জানা আছে?',
    questionEn: 'Do you know any details about the person, driver, vehicle, or organization involved?',
    options: [
      { value: 'individual', labelBn: 'চালক / ব্যক্তি', labelEn: 'Driver / Individual' },
      { value: 'business', labelBn: 'পরিবহন মালিক / ব্যবসা', labelEn: 'Transport Owner / Business' },
      { value: 'organization', labelBn: 'পরিবহন প্রতিষ্ঠান / সংস্থা', labelEn: 'Transport Organization / Agency' },
      { value: 'group', labelBn: 'একাধিক ব্যক্তি / যানবাহন', labelEn: 'Multiple People / Vehicles' },
      UNKNOWN_OPTION,
    ],
  },
  'road_transport:road-block': {
    sectionTitleBn: '৩. অবরোধ / প্রতিবন্ধকতার সঙ্গে জড়িত পক্ষের তথ্য',
    sectionTitleEn: '3. Party Involved in the Road Block / Obstruction',
    questionBn: 'অবরোধ বা প্রতিবন্ধকতার সঙ্গে জড়িত ব্যক্তি, দল বা প্রতিষ্ঠানের তথ্য জানা আছে?',
    questionEn: 'Do you know the person, group, or organization involved in the obstruction?',
    options: PERSON_GROUP_ORG_OPTIONS,
  },
  'road_transport:default': {
    sectionTitleBn: '৩. সংশ্লিষ্ট ব্যক্তি / কর্তৃপক্ষের তথ্য',
    sectionTitleEn: '3. Involved Person / Authority Information',
    questionBn: 'সংশ্লিষ্ট ব্যক্তি, প্রতিষ্ঠান বা কর্তৃপক্ষের তথ্য জানা আছে?',
    questionEn: 'Do you know the person, organization, or authority involved?',
    options: PERSON_GROUP_ORG_OPTIONS,
  },

  // Illegal Occupation
  'illegal_occupation:road-public-space-encroachment': {
    sectionTitleBn: '৩. দখলকারী ব্যক্তি / প্রতিষ্ঠানের তথ্য',
    sectionTitleEn: '3. Occupier / Organization Information',
    questionBn: 'রাস্তা বা জনপরিসর কে দখল করেছে?',
    questionEn: 'Who is occupying the road or public space?',
    options: [
      { value: 'individual', labelBn: 'ব্যক্তি', labelEn: 'Individual' },
      { value: 'business', labelBn: 'দোকান / ব্যবসা', labelEn: 'Shop / Business' },
      { value: 'group', labelBn: 'দল / একাধিক ব্যক্তি', labelEn: 'Group / Multiple People' },
      { value: 'organization', labelBn: 'প্রতিষ্ঠান / সংগঠন', labelEn: 'Organization' },
      UNKNOWN_OPTION,
    ],
  },
  'illegal_occupation:private-property-occupation': {
    sectionTitleBn: '৩. দখলকারী ব্যক্তি / পক্ষের তথ্য',
    sectionTitleEn: '3. Occupier / Involved Party Information',
    questionBn: 'ব্যক্তিগত জমি বা সম্পত্তি কে দখল করেছে?',
    questionEn: 'Who is occupying the private land or property?',
    options: PERSON_GROUP_ORG_OPTIONS,
  },
  'illegal_occupation:government-property-occupation': {
    sectionTitleBn: '৩. দখলকারী ব্যক্তি / পক্ষের তথ্য',
    sectionTitleEn: '3. Occupier / Involved Party Information',
    questionBn: 'সরকারি জমি বা সম্পত্তি কে দখল করেছে?',
    questionEn: 'Who is occupying the government land or property?',
    options: PERSON_GROUP_ORG_OPTIONS,
  },
  'illegal_occupation:default': {
    sectionTitleBn: '৩. দখলকারী ব্যক্তি / পক্ষের তথ্য',
    sectionTitleEn: '3. Occupier / Involved Party Information',
    questionBn: 'দখলের সঙ্গে জড়িত ব্যক্তি বা প্রতিষ্ঠানের তথ্য জানা আছে?',
    questionEn: 'Do you know the person or organization involved in the occupation?',
    options: PERSON_GROUP_ORG_OPTIONS,
  },
};

export function getReportSubjectConfig(
  segment: SectionKey,
  subcategoryId?: string
): ReportSubjectConfig | null {
  if (segment === 'harassment' || segment === 'load_shedding') {
    return null;
  }

  const exactKey = `${segment}:${subcategoryId || ''}`;
  if (REPORT_SUBJECT_CONFIGS[exactKey]) {
    return REPORT_SUBJECT_CONFIGS[exactKey];
  }

  const defaultKey = `${segment}:default`;
  return REPORT_SUBJECT_CONFIGS[defaultKey] || null;
}

export function getSubjectOptionLabel(
  segment: SectionKey,
  subcategoryId: string | undefined,
  value: SubjectTypeValue | string | undefined,
  language: 'bn' | 'en'
): string {
  const config = getReportSubjectConfig(segment, subcategoryId);
  if (config && value) {
    const found = config.options.find((opt) => opt.value === value);
    if (found) {
      return language === 'bn' ? found.labelBn : found.labelEn;
    }
  }

  switch (value) {
    case 'business':
      return language === 'bn' ? 'ব্যবসা / প্রতিষ্ঠান' : 'Business / Organization';
    case 'group':
      return language === 'bn' ? 'দল / একাধিক ব্যক্তি' : 'Group / Multiple People';
    case 'organization':
      return language === 'bn' ? 'প্রতিষ্ঠান / কর্তৃপক্ষ' : 'Organization / Authority';
    case 'individual':
      return language === 'bn' ? 'ব্যক্তি' : 'Individual';
    case 'unknown':
    default:
      return language === 'bn' ? 'অজ্ঞাত / নিশ্চিত নই' : 'Unknown / Not Sure';
  }
}
