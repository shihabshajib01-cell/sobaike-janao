export type MobJusticeTrigger =
  | 'suspected_theft_robbery'
  | 'snatching_allegation'
  | 'kidnapping_allegation'
  | 'sexual_offence_allegation'
  | 'religious_sentiment_allegation'
  | 'personal_local_dispute'
  | 'informal_punishment'
  | 'other_accusation_dispute'
  | 'unknown';

export type MobJusticeSpread =
  | 'direct_accusation'
  | 'word_of_mouth'
  | 'social_media'
  | 'message_group_post'
  | 'loudspeaker_announcement'
  | 'local_arbitration_meeting'
  | 'organized_gathering'
  | 'unknown'
  | 'other';

export type MobJusticeOutcome =
  | 'threatened_harassed'
  | 'restrained_surrounded'
  | 'physically_assaulted'
  | 'seriously_injured'
  | 'death_reported'
  | 'property_damaged'
  | 'rescued_intervention'
  | 'ongoing'
  | 'unknown';

export type MobJusticeOngoingStatus = 'ongoing' | 'ended' | 'unknown';

export interface MobJusticeDetails {
  trigger: MobJusticeTrigger | '';
  spread: MobJusticeSpread | '';
  outcome: MobJusticeOutcome | '';
  targetedCount: number | '';
  ongoingStatus: MobJusticeOngoingStatus | '';
}

export interface MobJusticeValidationErrors {
  trigger?: string;
  outcome?: string;
  targetedCount?: string;
  ongoingStatus?: string;
}

export interface BilingualOption<T extends string = string> {
  value: T;
  labelBn: string;
  labelEn: string;
}

export const EMPTY_MOB_JUSTICE_DETAILS: MobJusticeDetails = {
  trigger: '',
  spread: '',
  outcome: '',
  targetedCount: '',
  ongoingStatus: '',
};

export const MOB_JUSTICE_TRIGGER_OPTIONS: BilingualOption<MobJusticeTrigger>[] = [
  { value: 'suspected_theft_robbery', labelBn: 'চুরি বা ডাকাতির সন্দেহ', labelEn: 'Suspected theft / robbery' },
  { value: 'snatching_allegation', labelBn: 'ছিনতাইয়ের অভিযোগ', labelEn: 'Snatching allegation' },
  { value: 'kidnapping_allegation', labelBn: 'অপহরণ / শিশু অপহরণের অভিযোগ', labelEn: 'Kidnapping / child-abduction allegation' },
  { value: 'sexual_offence_allegation', labelBn: 'যৌন হয়রানি / যৌন সহিংসতার অভিযোগ', labelEn: 'Sexual harassment / sexual-violence allegation' },
  { value: 'religious_sentiment_allegation', labelBn: 'ধর্মীয় অনুভূতিতে আঘাতের অভিযোগ', labelEn: 'Religious-sentiment allegation' },
  { value: 'personal_local_dispute', labelBn: 'ব্যক্তিগত / স্থানীয় বিরোধ', labelEn: 'Personal / local dispute' },
  { value: 'informal_punishment', labelBn: 'সালিশ / স্থানীয়ভাবে শাস্তি দেওয়ার চেষ্টা', labelEn: 'Village arbitration / informal punishment' },
  { value: 'other_accusation_dispute', labelBn: 'অন্যান্য অভিযোগ বা বিরোধ', labelEn: 'Other accusation / dispute' },
  { value: 'unknown', labelBn: 'কারণ জানা নেই', labelEn: 'Unknown' },
];

export const MOB_JUSTICE_SPREAD_OPTIONS: BilingualOption<MobJusticeSpread>[] = [
  { value: 'direct_accusation', labelBn: 'ঘটনাস্থলে সরাসরি অভিযোগ', labelEn: 'Direct accusation at the location' },
  { value: 'word_of_mouth', labelBn: 'মুখে মুখে গুজব / খবর', labelEn: 'Word-of-mouth rumor' },
  { value: 'social_media', labelBn: 'ফেসবুক / সামাজিক যোগাযোগমাধ্যম', labelEn: 'Social media' },
  { value: 'message_group_post', labelBn: 'মেসেজ / গ্রুপ / অনলাইন পোস্ট', labelEn: 'Message / group / online post' },
  { value: 'loudspeaker_announcement', labelBn: 'মাইক / লাউডস্পিকার / প্রকাশ্য ঘোষণা', labelEn: 'Loudspeaker / public announcement' },
  { value: 'local_arbitration_meeting', labelBn: 'সালিশ / স্থানীয় বৈঠক', labelEn: 'Local arbitration / meeting' },
  { value: 'organized_gathering', labelBn: 'সংগঠিতভাবে লোক জড়ো করা হয়েছিল', labelEn: 'Organized gathering / call' },
  { value: 'unknown', labelBn: 'জানা নেই', labelEn: 'Unknown' },
  { value: 'other', labelBn: 'অন্যান্য', labelEn: 'Other' },
];

export const MOB_JUSTICE_OUTCOME_OPTIONS: BilingualOption<MobJusticeOutcome>[] = [
  { value: 'threatened_harassed', labelBn: 'হুমকি / হয়রানি করা হয়েছে', labelEn: 'Threatened / harassed' },
  { value: 'restrained_surrounded', labelBn: 'আটক / ঘেরাও করা হয়েছে', labelEn: 'Restrained / surrounded' },
  { value: 'physically_assaulted', labelBn: 'মারধর করা হয়েছে', labelEn: 'Physically assaulted' },
  { value: 'seriously_injured', labelBn: 'গুরুতর আহত', labelEn: 'Seriously injured' },
  { value: 'death_reported', labelBn: 'মৃত্যু হয়েছে', labelEn: 'Death reported' },
  { value: 'property_damaged', labelBn: 'সম্পত্তি ভাঙচুর / ক্ষতি করা হয়েছে', labelEn: 'Property attacked / damaged' },
  { value: 'rescued_intervention', labelBn: 'পুলিশ / অন্যরা উদ্ধার করেছে', labelEn: 'Rescued / intervention occurred' },
  { value: 'ongoing', labelBn: 'ঘটনা এখনো চলছে', labelEn: 'Incident ongoing' },
  { value: 'unknown', labelBn: 'ফলাফল জানা নেই', labelEn: 'Outcome unknown' },
];

export const MOB_JUSTICE_ONGOING_OPTIONS: BilingualOption<MobJusticeOngoingStatus>[] = [
  { value: 'ongoing', labelBn: 'হ্যাঁ, এখনো চলছে', labelEn: 'Yes, still ongoing' },
  { value: 'ended', labelBn: 'না, শেষ হয়েছে', labelEn: 'No, ended' },
  { value: 'unknown', labelBn: 'নিশ্চিত নই', labelEn: 'Not sure' },
];

export function getMobJusticeOptionLabel<T extends string>(
  options: BilingualOption<T>[],
  value: T | '' | undefined,
  language: 'bn' | 'en'
): string {
  if (!value) return language === 'bn' ? 'তথ্য দেওয়া হয়নি' : 'Not provided';
  const option = options.find((item) => item.value === value);
  if (!option) return value;
  return language === 'bn' ? option.labelBn : option.labelEn;
}

export function validateMobJusticeDetails(
  details: MobJusticeDetails,
  language: 'bn' | 'en'
): MobJusticeValidationErrors {
  const errors: MobJusticeValidationErrors = {};

  if (!details.trigger) {
    errors.trigger = language === 'bn' ? 'ঘটনার কারণ বা অভিযোগের ধরন নির্বাচন করুন।' : 'Select what triggered the mob incident.';
  }

  if (!details.outcome) {
    errors.outcome = language === 'bn' ? 'ঘটনার ফলাফল নির্বাচন করুন।' : 'Select the incident outcome.';
  }

  if (!details.ongoingStatus) {
    errors.ongoingStatus = language === 'bn' ? 'ঘটনাটি এখনো চলছে কি না নির্বাচন করুন।' : 'Select whether the incident is still ongoing.';
  }

  if (details.targetedCount !== '') {
    const count = Number(details.targetedCount);
    if (!Number.isInteger(count) || count < 1 || count > 9999) {
      errors.targetedCount = language === 'bn' ? '১ থেকে ৯৯৯৯ এর মধ্যে পূর্ণসংখ্যা লিখুন।' : 'Enter a whole number between 1 and 9,999.';
    }
  }

  return errors;
}

export function hasMobJusticeValidationErrors(errors: MobJusticeValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}
