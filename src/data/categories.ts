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
  extortion: [
    { id: 'all', nameBn: 'সকল রিপোর্ট', nameEn: 'All Reports' },
    { id: 'bribe-demanded-service', nameBn: 'ঘুষ', nameEn: 'Bribery' },
    { id: 'shop-business', nameBn: 'দোকান ও ব্যবসা প্রতিষ্ঠানে চাঁদা দাবি', nameEn: 'Shops & Businesses' },
    { id: 'transport-movement', nameBn: 'পরিবহন বা চলাচলে চাঁদা দাবি', nameEn: 'Transport & Transit' },
    { id: 'construction-property', nameBn: 'নির্মাণ/সম্পত্তি সংক্রান্ত চাঁদা দাবি', nameEn: 'Construction & Property' },
    { id: 'threat-money-demand', nameBn: 'হুমকি দিয়ে টাকা দাবি', nameEn: 'Threats & Demands' },
    { id: 'extortion-other', nameBn: 'অন্যান্য চাঁদাবাজি', nameEn: 'Other Extortion' },
  ],
  public_safety: [
    { id: 'all', nameBn: 'সকল রিপোর্ট', nameEn: 'All Reports' },
    { id: 'theft', nameBn: 'চুরি', nameEn: 'Theft' },
    { id: 'robbery', nameBn: 'ডাকাতি', nameEn: 'Robbery / Dacoity' },
    { id: 'snatching', nameBn: 'ছিনতাই', nameEn: 'Snatching' },
    { id: 'mob-justice', nameBn: 'গণপিটুনি / মব সহিংসতা', nameEn: 'Mob Justice / Mob Violence' },
    { id: 'child_abduction_murder', nameBn: 'শিশু অপহরণ / হত্যা', nameEn: 'Child Abduction / Murder' },
  ],
  road_transport: [
    { id: 'all', nameBn: 'সকল রিপোর্ট', nameEn: 'All Reports' },
    { id: 'road-repair-delay', nameBn: 'রাস্তা মেরামতে বিলম্ব', nameEn: 'Road Repair Delay' },
    { id: 'road-accident', nameBn: 'সড়ক দুর্ঘটনা', nameEn: 'Road Accident' },
    { id: 'road-block', nameBn: 'সড়ক অবরোধ', nameEn: 'Road Block / Obstruction' },
  ],
  load_shedding: [
    { id: 'all', nameBn: 'সকল রিপোর্ট', nameEn: 'All Reports' },
    { id: 'load-shedding-outage', nameBn: 'লোডশেডিং', nameEn: 'Load Shedding' },
    { id: 'gas-shortage', nameBn: 'গ্যাস সংকট', nameEn: 'Gas Shortage' },
    { id: 'excess-electricity-bill', nameBn: 'অতিরিক্ত বিদ্যুৎ বিল', nameEn: 'Excess Electricity Bill' },
  ],
  illegal_occupation: [
    { id: 'all', nameBn: 'সকল রিপোর্ট', nameEn: 'All Reports' },
    { id: 'road-public-space-encroachment', nameBn: 'রাস্তা / ফুটপাত / ফুটওভার ব্রিজ দখল', nameEn: 'Road / Footpath / Foot-over-bridge Encroachment' },
    { id: 'private-property-occupation', nameBn: 'ব্যক্তিগত জমি/সম্পত্তি অবৈধ দখল', nameEn: 'Illegal Occupation of Private Land / Property' },
    { id: 'government-property-occupation', nameBn: 'সরকারি জমি/সম্পত্তি অবৈধ দখল', nameEn: 'Illegal Occupation of Government Land / Property' },
  ],
  rickshaw: [
    { id: 'all', nameBn: 'সকল রিপোর্ট', nameEn: 'All Reports' },
    { id: 'charging-station-location', nameBn: 'অবৈধ অটো চার্জিং', nameEn: 'Illegal auto-rickshaw charging' },
  ],
};

export const POPULAR_DISTRICTS = [
  { id: 'all', nameBn: 'সারা বাংলাদেশ', nameEn: 'All Bangladesh' },
  { id: 'Dhaka', nameBn: 'ঢাকা', nameEn: 'Dhaka' },
  { id: 'Chattogram', nameBn: 'চট্টগ্রাম', nameEn: 'Chattogram' },
  { id: 'Sylhet', nameBn: 'সিলেট', nameEn: 'Sylhet' },
  { id: 'Rajshahi', nameBn: 'রাজশাহী', nameEn: 'Rajshahi' },
  { id: 'Khulna', nameBn: 'খুলনা', nameEn: 'Khulna' },
  { id: 'Barishal', nameBn: 'বরিশাল', nameEn: 'Barishal' },
  { id: 'Rangpur', nameBn: 'রংপুর', nameEn: 'Rangpur' },
  { id: 'Mymensingh', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh' },
];
