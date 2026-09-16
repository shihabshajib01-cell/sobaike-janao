export interface BriberyDepartmentOption {
  value: string;
  labelBn: string;
  labelEn: string;
}

export const BRIBERY_DEPARTMENT_OPTIONS: BriberyDepartmentOption[] = [
  { value: 'land_office', labelBn: 'ভূমি অফিস', labelEn: 'Land Office' },
  { value: 'immigration_office', labelBn: 'ইমিগ্রেশন অফিস', labelEn: 'Immigration Office' },
  { value: 'tax_office', labelBn: 'কর অফিস', labelEn: 'Tax Office' },
  { value: 'customs_office', labelBn: 'কাস্টমস অফিস', labelEn: 'Customs Office' },
  { value: 'traffic_police', labelBn: 'ট্রাফিক পুলিশ', labelEn: 'Traffic Police' },
  { value: 'brta', labelBn: 'বিআরটিএ', labelEn: 'BRTA' },
  { value: 'passport_office', labelBn: 'পাসপোর্ট অফিস', labelEn: 'Passport Office' },
  { value: 'city_corporation', labelBn: 'সিটি কর্পোরেশন', labelEn: 'City Corporation' },
  { value: 'sub_registry_office', labelBn: 'সাব-রেজিস্ট্রি অফিস', labelEn: 'Sub-registry Office' },
  { value: 'education_office', labelBn: 'শিক্ষা অফিস', labelEn: 'Education Office' },
  { value: 'government_hospital', labelBn: 'সরকারি হাসপাতাল', labelEn: 'Government Hospital' },
  { value: 'other_government_service', labelBn: 'অন্যান্য সরকারি সেবা', labelEn: 'Other Government Service' },
];

export function getBriberyDepartmentLabel(
  value: string | undefined | null,
  language: 'bn' | 'en'
): string {
  if (!value) return '';
  const option = BRIBERY_DEPARTMENT_OPTIONS.find((item) => item.value === value);
  if (!option) return value;
  return language === 'bn' ? option.labelBn : option.labelEn;
}
