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

export const REPORT_SUBJECT_CONFIGS: Record<string, ReportSubjectConfig> = {
  // Rickshaw - Battery Rickshaw & Charging Hazards
  'rickshaw:charging-station-location': {
    sectionTitleBn: '৩. চার্জিং স্টেশন / পরিচালনাকারীর তথ্য',
    sectionTitleEn: '3. Charging Station / Operator',
    questionBn: 'চার্জিং স্টেশন বা গ্যারেজটি কার দ্বারা পরিচালিত?',
    questionEn: 'Who operates this charging station or garage?',
    options: [
      {
        value: 'business',
        labelBn: 'চার্জিং স্টেশন / গ্যারেজ',
        labelEn: 'Charging Station / Garage',
      },
      {
        value: 'individual',
        labelBn: 'পরিচালনাকারী ব্যক্তি',
        labelEn: 'Individual Operator',
      },
      {
        value: 'organization',
        labelBn: 'প্রতিষ্ঠান / ভবন কর্তৃপক্ষ',
        labelEn: 'Organization / Building Authority',
      },
      {
        value: 'unknown',
        labelBn: 'অজ্ঞাত / নিশ্চিত নই',
        labelEn: 'Unknown / Not Sure',
      },
    ],
  },
  'rickshaw:default': {
    sectionTitleBn: '৩. চার্জিং স্টেশন / পরিচালনাকারীর তথ্য',
    sectionTitleEn: '3. Charging Station / Operator',
    questionBn: 'চার্জিং স্টেশন বা গ্যারেজটি কার দ্বারা পরিচালিত?',
    questionEn: 'Who operates this charging station or garage?',
    options: [
      {
        value: 'business',
        labelBn: 'চার্জিং স্টেশন / গ্যারেজ',
        labelEn: 'Charging Station / Garage',
      },
      {
        value: 'individual',
        labelBn: 'পরিচালনাকারী ব্যক্তি',
        labelEn: 'Individual Operator',
      },
      {
        value: 'organization',
        labelBn: 'প্রতিষ্ঠান / ভবন কর্তৃপক্ষ',
        labelEn: 'Organization / Building Authority',
      },
      {
        value: 'unknown',
        labelBn: 'অজ্ঞাত / নিশ্চিত নই',
        labelEn: 'Unknown / Not Sure',
      },
    ],
  },

  // Extortion - Shop & Business
  'extortion:shop-business': {
    sectionTitleBn: '৩. চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: '3. Extortion Party Details',
    questionBn: 'চাঁদা কে দাবি করছে?',
    questionEn: 'Who is demanding the money?',
    options: [
      {
        value: 'individual',
        labelBn: 'ব্যক্তি / চাঁদা দাবিকারী',
        labelEn: 'Individual',
      },
      {
        value: 'group',
        labelBn: 'দল / সিন্ডিকেট',
        labelEn: 'Group / Syndicate',
      },
      {
        value: 'organization',
        labelBn: 'সমিতি / কমিটি / সংগঠন',
        labelEn: 'Association / Committee / Organization',
      },
      {
        value: 'unknown',
        labelBn: 'অজ্ঞাত / নিশ্চিত নই',
        labelEn: 'Unknown / Not Sure',
      },
    ],
  },

  // Extortion - Transport & Movement
  'extortion:transport-movement': {
    sectionTitleBn: '৩. চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: '3. Extortion Party Details',
    questionBn: 'চাঁদা কে আদায় করছে?',
    questionEn: 'Who is collecting the money?',
    options: [
      {
        value: 'individual',
        labelBn: 'চাঁদা আদায়কারী ব্যক্তি',
        labelEn: 'Individual Collector',
      },
      {
        value: 'group',
        labelBn: 'দল / সিন্ডিকেট',
        labelEn: 'Group / Syndicate',
      },
      {
        value: 'organization',
        labelBn: 'স্ট্যান্ড / পরিবহন সমিতি / কমিটি',
        labelEn: 'Stand / Transport Association / Committee',
      },
      {
        value: 'unknown',
        labelBn: 'অজ্ঞাত / নিশ্চিত নই',
        labelEn: 'Unknown / Not Sure',
      },
    ],
  },

  // Extortion - Construction & Property
  'extortion:construction-property': {
    sectionTitleBn: '৩. চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: '3. Extortion Party Details',
    questionBn: 'চাঁদা বা বাধা কে দিচ্ছে?',
    questionEn: 'Who is demanding money or creating the obstruction?',
    options: [
      {
        value: 'individual',
        labelBn: 'ব্যক্তি / চাঁদা দাবিকারী',
        labelEn: 'Individual',
      },
      {
        value: 'group',
        labelBn: 'দল / সিন্ডিকেট',
        labelEn: 'Group / Syndicate',
      },
      {
        value: 'organization',
        labelBn: 'স্থানীয় সংগঠন / কমিটি',
        labelEn: 'Local Organization / Committee',
      },
      {
        value: 'unknown',
        labelBn: 'অজ্ঞাত / নিশ্চিত নই',
        labelEn: 'Unknown / Not Sure',
      },
    ],
  },

  // Extortion - Threat & Money Demand
  'extortion:threat-money-demand': {
    sectionTitleBn: '৩. চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: '3. Extortion Party Details',
    questionBn: 'হুমকি দিয়ে টাকা কে দাবি করছে?',
    questionEn: 'Who is making the threatening demand?',
    options: [
      {
        value: 'individual',
        labelBn: 'ব্যক্তি',
        labelEn: 'Individual',
      },
      {
        value: 'group',
        labelBn: 'দল / সিন্ডিকেট',
        labelEn: 'Group / Syndicate',
      },
      {
        value: 'organization',
        labelBn: 'সংগঠন / গ্রুপ',
        labelEn: 'Organization / Group',
      },
      {
        value: 'unknown',
        labelBn: 'অজ্ঞাত / ফোন বা অনলাইন পরিচিতি মাত্র',
        labelEn: 'Unknown / Phone or Online Identity Only',
      },
    ],
  },

  // Extortion - Other & Default
  'extortion:extortion-other': {
    sectionTitleBn: '৩. চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: '3. Extortion Party Details',
    questionBn: 'চাঁদা বা অর্থ কে দাবি করছে?',
    questionEn: 'Who is demanding the money?',
    options: [
      {
        value: 'individual',
        labelBn: 'ব্যক্তি',
        labelEn: 'Individual',
      },
      {
        value: 'group',
        labelBn: 'দল / সিন্ডিকেট',
        labelEn: 'Group / Syndicate',
      },
      {
        value: 'organization',
        labelBn: 'প্রতিষ্ঠান / সংগঠন',
        labelEn: 'Organization',
      },
      {
        value: 'unknown',
        labelBn: 'অজ্ঞাত / নিশ্চিত নই',
        labelEn: 'Unknown / Not Sure',
      },
    ],
  },
  'extortion:default': {
    sectionTitleBn: '৩. চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: '3. Extortion Party Details',
    questionBn: 'চাঁদা বা অর্থ কে দাবি করছে?',
    questionEn: 'Who is demanding the money?',
    options: [
      {
        value: 'individual',
        labelBn: 'ব্যক্তি',
        labelEn: 'Individual',
      },
      {
        value: 'group',
        labelBn: 'দল / সিন্ডিকেট',
        labelEn: 'Group / Syndicate',
      },
      {
        value: 'organization',
        labelBn: 'প্রতিষ্ঠান / সংগঠন',
        labelEn: 'Organization',
      },
      {
        value: 'unknown',
        labelBn: 'অজ্ঞাত / নিশ্চিত নই',
        labelEn: 'Unknown / Not Sure',
      },
    ],
  },
};

export function getReportSubjectConfig(
  segment: SectionKey,
  subcategoryId?: string
): ReportSubjectConfig | null {
  if (segment === 'harassment') {
    return null;
  }

  const exactKey = `${segment}:${subcategoryId || ''}`;
  if (REPORT_SUBJECT_CONFIGS[exactKey]) {
    return REPORT_SUBJECT_CONFIGS[exactKey];
  }

  const defaultKey = `${segment}:default`;
  if (REPORT_SUBJECT_CONFIGS[defaultKey]) {
    return REPORT_SUBJECT_CONFIGS[defaultKey];
  }

  return REPORT_SUBJECT_CONFIGS['extortion:default'];
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

  // Graceful fallback for legacy drafts or unexpected values
  switch (value) {
    case 'business':
      return language === 'bn' ? 'দোকান / গ্যারেজ' : 'Business / Garage';
    case 'group':
      return language === 'bn' ? 'দল / সিন্ডিকেট' : 'Group / Syndicate';
    case 'organization':
      return language === 'bn' ? 'প্রতিষ্ঠান / কর্তৃপক্ষ' : 'Organization';
    case 'individual':
      return language === 'bn' ? 'ব্যক্তি' : 'Individual';
    case 'unknown':
    default:
      return language === 'bn' ? 'অজ্ঞাত / নিশ্চিত নই' : 'Unknown / Not Sure';
  }
}
