export type HarassmentAgeGroup =
  | 'under_18'
  | '18_29'
  | '30_59'
  | '60_plus'
  | 'prefer_not_to_say';

export type HarassmentAbuserRelationship =
  | 'intimate_partner'
  | 'household_family'
  | 'other_relative'
  | 'friend_acquaintance'
  | 'coworker_classmate'
  | 'authority_caregiver_service_provider'
  | 'stranger'
  | 'other_or_unknown';

export type HarassmentReportingFor = 'self' | 'someone_else';

export interface BilingualOption<T extends string> {
  value: T;
  labelEn: string;
  labelBn: string;
}

export const HARASSMENT_AGE_GROUP_OPTIONS: BilingualOption<HarassmentAgeGroup>[] = [
  { value: 'under_18', labelEn: 'Under 18', labelBn: '১৮ বছরের কম' },
  { value: '18_29', labelEn: '18–29', labelBn: '১৮–২৯' },
  { value: '30_59', labelEn: '30–59', labelBn: '৩০–৫৯' },
  { value: '60_plus', labelEn: '60+', labelBn: '৬০+' },
  {
    value: 'prefer_not_to_say',
    labelEn: 'Prefer not to say / Unknown',
    labelBn: 'বলতে অনিচ্ছুক / জানা নেই',
  },
];

export const HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS: BilingualOption<HarassmentAbuserRelationship>[] = [
  {
    value: 'intimate_partner',
    labelEn: 'Current / former intimate partner or spouse',
    labelBn: 'বর্তমান / সাবেক ঘনিষ্ঠ সঙ্গী বা স্বামী/স্ত্রী',
  },
  {
    value: 'household_family',
    labelEn: 'Immediate family / household member',
    labelBn: 'নিকট পরিবারের / একই পরিবারের সদস্য',
  },
  { value: 'other_relative', labelEn: 'Other relative', labelBn: 'অন্যান্য আত্মীয়' },
  {
    value: 'friend_acquaintance',
    labelEn: 'Friend / acquaintance',
    labelBn: 'বন্ধু / পরিচিত ব্যক্তি',
  },
  {
    value: 'coworker_classmate',
    labelEn: 'Co-worker / classmate',
    labelBn: 'সহকর্মী / সহপাঠী',
  },
  {
    value: 'authority_caregiver_service_provider',
    labelEn: 'Authority / caregiver / service provider',
    labelBn: 'কর্তৃপক্ষ / পরিচর্যাকারী / সেবাদানকারী',
  },
  { value: 'stranger', labelEn: 'Stranger', labelBn: 'অপরিচিত ব্যক্তি' },
  {
    value: 'other_or_unknown',
    labelEn: 'Other known person / Unknown',
    labelBn: 'অন্যান্য পরিচিত ব্যক্তি / জানা নেই',
  },
];

export const HARASSMENT_REPORTING_FOR_OPTIONS: BilingualOption<HarassmentReportingFor>[] = [
  { value: 'self', labelEn: 'Myself', labelBn: 'নিজের জন্য' },
  { value: 'someone_else', labelEn: 'Someone else', labelBn: 'অন্য কারও জন্য' },
];

export const getBilingualOptionLabel = <T extends string>(
  options: BilingualOption<T>[],
  value: T | string | null | undefined,
  language: 'bn' | 'en'
): string => {
  if (!value) return '';
  const option = options.find((item) => item.value === value);
  if (!option) return value;
  return language === 'bn' ? option.labelBn : option.labelEn;
};

export const isHarassmentAgeGroup = (value: unknown): value is HarassmentAgeGroup =>
  HARASSMENT_AGE_GROUP_OPTIONS.some((item) => item.value === value);

export const isHarassmentAbuserRelationship = (
  value: unknown
): value is HarassmentAbuserRelationship =>
  HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS.some((item) => item.value === value);

export const isHarassmentReportingFor = (value: unknown): value is HarassmentReportingFor =>
  HARASSMENT_REPORTING_FOR_OPTIONS.some((item) => item.value === value);
