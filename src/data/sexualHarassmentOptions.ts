import {
  BilingualOption,
  HarassmentAbuserRelationship,
  HarassmentAgeGroup,
} from './harassmentClassification';

export type SexualHarassmentType =
  | 'eve_teasing'
  | 'unwanted_physical_contact'
  | 'sexual_comments_gestures_proposition'
  | 'workplace_harassment'
  | 'abuse_of_power'
  | 'stalking'
  | 'online_digital_harassment'
  | 'other'
  | 'unknown_not_stated';

export type SexualHarassmentContext =
  | 'workplace'
  | 'educational_institution'
  | 'healthcare'
  | 'public_transport'
  | 'road_public_space'
  | 'home_private_space'
  | 'online_social_media'
  | 'government_service'
  | 'other'
  | 'unknown_not_stated';

export type SexualHarassmentFrequency =
  | 'one-time'
  | 'repeated'
  | 'ongoing'
  | 'unknown_not_stated';

export const SEXUAL_HARASSMENT_TYPE_OPTIONS: BilingualOption<SexualHarassmentType>[] = [
  { value: 'eve_teasing', labelEn: 'Eve-teasing / verbal harassment', labelBn: 'উত্যক্ত করা / ইভটিজিং' },
  { value: 'unwanted_physical_contact', labelEn: 'Unwanted physical contact', labelBn: 'অনাকাঙ্ক্ষিত স্পর্শ' },
  { value: 'sexual_comments_gestures_proposition', labelEn: 'Sexual comments / gestures / proposition', labelBn: 'যৌন মন্তব্য / ইঙ্গিত / প্রস্তাব' },
  { value: 'workplace_harassment', labelEn: 'Workplace sexual harassment', labelBn: 'কর্মক্ষেত্রে যৌন হয়রানি' },
  { value: 'abuse_of_power', labelEn: 'Harassment using authority / power', labelBn: 'ক্ষমতা / পদ ব্যবহার করে যৌন হয়রানি' },
  { value: 'stalking', labelEn: 'Stalking / persistent following', labelBn: 'অনুসরণ / স্টকিং' },
  { value: 'online_digital_harassment', labelEn: 'Online / digital sexual harassment', labelBn: 'অনলাইন / ডিজিটাল যৌন হয়রানি' },
  { value: 'other', labelEn: 'Other', labelBn: 'অন্যান্য' },
  { value: 'unknown_not_stated', labelEn: 'Unknown / not stated', labelBn: 'জানা নেই / উল্লেখ নেই' },
];

export const SEXUAL_HARASSMENT_CONTEXT_OPTIONS: BilingualOption<SexualHarassmentContext>[] = [
  { value: 'workplace', labelEn: 'Workplace', labelBn: 'কর্মক্ষেত্র' },
  { value: 'educational_institution', labelEn: 'Educational institution', labelBn: 'শিক্ষাপ্রতিষ্ঠান' },
  { value: 'healthcare', labelEn: 'Hospital / healthcare', labelBn: 'হাসপাতাল / স্বাস্থ্যসেবা' },
  { value: 'public_transport', labelEn: 'Public transport', labelBn: 'গণপরিবহন' },
  { value: 'road_public_space', labelEn: 'Road / public space', labelBn: 'রাস্তা / জনসমাগমস্থল' },
  { value: 'home_private_space', labelEn: 'Home / private space', labelBn: 'বাসা / ব্যক্তিগত স্থান' },
  { value: 'online_social_media', labelEn: 'Online / social media', labelBn: 'অনলাইন / সোশ্যাল মিডিয়া' },
  { value: 'government_service', labelEn: 'Government / service institution', labelBn: 'সরকারি / সেবা প্রতিষ্ঠান' },
  { value: 'other', labelEn: 'Other', labelBn: 'অন্যান্য' },
  { value: 'unknown_not_stated', labelEn: 'Unknown / not stated', labelBn: 'জানা নেই / উল্লেখ নেই' },
];

export const SEXUAL_HARASSMENT_AGE_GROUP_OPTIONS: BilingualOption<HarassmentAgeGroup>[] = [
  { value: 'under_18', labelEn: 'Under 18', labelBn: '১৮ বছরের কম' },
  { value: '18_29', labelEn: '18–29', labelBn: '১৮–২৯' },
  { value: '30_59', labelEn: '30–59', labelBn: '৩০–৫৯' },
  { value: '60_plus', labelEn: '60+', labelBn: '৬০+' },
  { value: 'prefer_not_to_say', labelEn: 'Prefer not to say', labelBn: 'বলতে অনিচ্ছুক' },
  { value: 'unknown_not_stated', labelEn: 'Unknown / not stated', labelBn: 'জানা নেই / উল্লেখ নেই' },
];

export const SEXUAL_HARASSMENT_RELATIONSHIP_OPTIONS: BilingualOption<HarassmentAbuserRelationship>[] = [
  { value: 'intimate_partner', labelEn: 'Current / former intimate partner or spouse', labelBn: 'বর্তমান / সাবেক ঘনিষ্ঠ সঙ্গী বা স্বামী/স্ত্রী' },
  { value: 'household_family', labelEn: 'Immediate family / household member', labelBn: 'নিকট পরিবারের / একই পরিবারের সদস্য' },
  { value: 'other_relative', labelEn: 'Other relative', labelBn: 'অন্যান্য আত্মীয়' },
  { value: 'friend_acquaintance', labelEn: 'Friend / acquaintance', labelBn: 'বন্ধু / পরিচিত ব্যক্তি' },
  { value: 'neighbor', labelEn: 'Neighbor', labelBn: 'প্রতিবেশী' },
  { value: 'coworker_classmate', labelEn: 'Co-worker / classmate', labelBn: 'সহকর্মী / সহপাঠী' },
  { value: 'teacher_tutor', labelEn: 'Teacher / tutor', labelBn: 'শিক্ষক / টিউটর' },
  { value: 'supervisor_employer', labelEn: 'Supervisor / employer', labelBn: 'সুপারভাইজার / নিয়োগকর্তা' },
  { value: 'service_health_worker', labelEn: 'Service provider / healthcare worker', labelBn: 'সেবাদানকারী / স্বাস্থ্যকর্মী' },
  { value: 'transport_worker', labelEn: 'Transport worker', labelBn: 'পরিবহন কর্মী' },
  { value: 'law_enforcement_authority', labelEn: 'Law enforcement / authority', labelBn: 'আইনশৃঙ্খলা / কর্তৃপক্ষ' },
  { value: 'stranger', labelEn: 'Stranger', labelBn: 'অপরিচিত ব্যক্তি' },
  { value: 'multiple_people', labelEn: 'Multiple people', labelBn: 'একাধিক ব্যক্তি' },
  { value: 'other', labelEn: 'Other', labelBn: 'অন্যান্য' },
  { value: 'unknown_not_stated', labelEn: 'Unknown / not stated', labelBn: 'জানা নেই / উল্লেখ নেই' },
];

export const SEXUAL_HARASSMENT_FREQUENCY_OPTIONS: BilingualOption<SexualHarassmentFrequency>[] = [
  { value: 'one-time', labelEn: 'One-time', labelBn: 'এককালীন' },
  { value: 'repeated', labelEn: 'Repeated / multiple times', labelBn: 'একাধিকবার / পুনরাবৃত্ত' },
  { value: 'ongoing', labelEn: 'Ongoing', labelBn: 'চলমান' },
  { value: 'unknown_not_stated', labelEn: 'Unknown / not stated', labelBn: 'জানা নেই / উল্লেখ নেই' },
];

export const needsSexualHarassmentInstitution = (
  context?: SexualHarassmentContext | string | null
): boolean =>
  [
    'workplace',
    'educational_institution',
    'healthcare',
    'public_transport',
    'government_service',
  ].includes(String(context || ''));

export const getSexualHarassmentOptionLabel = <T extends string>(
  options: BilingualOption<T>[],
  value: T | string | null | undefined,
  language: 'bn' | 'en'
): string => {
  if (!value) return '';
  const option = options.find((item) => item.value === value);
  if (!option) return value;
  return language === 'bn' ? option.labelBn : option.labelEn;
};
