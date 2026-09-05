import { SectionKey } from '../theme/tokens';

export interface SubcategoryOption {
  id: string;
  nameBn: string;
  nameEn: string;
}

export const SUBCATEGORIES: Record<SectionKey, SubcategoryOption[]> = {
  harassment: [
    { id: 'all', nameBn: 'সকল রিপোর্ট', nameEn: 'All Reports' },
    { id: 'rape-sexual-violence', nameBn: 'ধর্ষণ', nameEn: 'Rape / Sexual Violence' },
    { id: 'sexual-harassment', nameBn: 'যৌন হয়রানি', nameEn: 'Sexual Harassment' },
    { id: 'domestic-violence', nameBn: 'পারিবারিক সহিংসতা', nameEn: 'Domestic Violence' },
    { id: 'blackmail-coercion', nameBn: 'ব্ল্যাকমেইলিং', nameEn: 'Blackmailing' },
    { id: 'honeytrap', nameBn: 'হানিট্র্যাপ', nameEn: 'Honeytrap' },
  ],
  rickshaw: [
    { id: 'all', nameBn: 'সকল রিপোর্ট', nameEn: 'All Reports' },
    { id: 'charging-station-location', nameBn: 'অবৈধ চার্জিং স্টেশন', nameEn: 'Illegal Charging Station' },
  ],
  extortion: [
    { id: 'all', nameBn: 'সকল রিপোর্ট', nameEn: 'All Reports' },
    { id: 'shop-business', nameBn: 'দোকান ও ব্যবসা প্রতিষ্ঠানে চাঁদা দাবি', nameEn: 'Shops & Businesses' },
    { id: 'transport-movement', nameBn: 'পরিবহন বা চলাচলে চাঁদা দাবি', nameEn: 'Transport & Transit' },
    { id: 'construction-property', nameBn: 'নির্মাণ/সম্পত্তি সংক্রান্ত চাঁদা দাবি', nameEn: 'Construction & Property' },
    { id: 'threat-money-demand', nameBn: 'হুমকি দিয়ে টাকা দাবি', nameEn: 'Threats & Demands' },
    { id: 'extortion-other', nameBn: 'অন্যান্য চাঁদাবাজি', nameEn: 'Other Extortion' },
  ],
};

export const POPULAR_DISTRICTS = [
  { id: 'all', nameBn: 'সারা বাংলাদেশ', nameEn: 'All Bangladesh' },
  { id: 'ঢাকা', nameBn: 'ঢাকা', nameEn: 'Dhaka' },
  { id: 'চট্টগ্রাম', nameBn: 'চট্টগ্রাম', nameEn: 'Chittagong' },
  { id: 'সিলেট', nameBn: 'সিলেট', nameEn: 'Sylhet' },
  { id: 'রাজশাহী', nameBn: 'রাজশাহী', nameEn: 'Rajshahi' },
  { id: 'খুলনা', nameBn: 'খুলনা', nameEn: 'Khulna' },
  { id: 'বরিশাল', nameBn: 'বরিশাল', nameEn: 'Barisal' },
  { id: 'রংপুর', nameBn: 'রংপুর', nameEn: 'Rangpur' },
  { id: 'ময়মনসিংহ', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh' },
];
