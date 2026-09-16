import { SectionKey } from '../theme/tokens';
import { SubcategoryOption } from './reportOptions';

/**
 * Phase 1 taxonomy additions.
 *
 * Existing reportOptions stay intact so solved complaint flows are not rewritten.
 * This extension is merged by TaxonomyService and acts as a local/offline fallback
 * for the same IDs stored in Supabase.
 */
export const PHASE1_SUBCATEGORIES: Partial<Record<SectionKey, SubcategoryOption[]>> = {
  extortion: [
    {
      id: 'bribe-service-demand',
      nameBn: 'সেবা পেতে ঘুষ দাবি',
      nameEn: 'Bribe Demanded for a Service',
      descriptionBn: 'সরকারি বা বেসরকারি কোনো সেবা, অনুমোদন বা সুবিধা পেতে ঘুষ দাবি করা হয়েছে।',
      descriptionEn: 'A bribe was demanded to provide a service, approval, or benefit.',
    },
    {
      id: 'bribe-paid',
      nameBn: 'ঘুষ প্রদান',
      nameEn: 'Bribe Paid',
      descriptionBn: 'কোনো সেবা, অনুমোদন বা সুবিধার জন্য ঘুষ বা অবৈধ অর্থ প্রদান করা হয়েছে।',
      descriptionEn: 'A bribe or illegal payment was made for a service, approval, or benefit.',
    },
  ],
  public_safety: [
    {
      id: 'theft',
      nameBn: 'চুরি',
      nameEn: 'Theft',
      descriptionBn: 'ব্যক্তিগত বা ব্যবসায়িক সম্পদ চুরির ঘটনা জানান।',
      descriptionEn: 'Report theft of personal or business property.',
    },
    {
      id: 'robbery-dacoity',
      nameBn: 'ডাকাতি',
      nameEn: 'Robbery / Dacoity',
      descriptionBn: 'বলপ্রয়োগ, হুমকি বা সংঘবদ্ধভাবে সম্পদ নেওয়ার ঘটনা জানান।',
      descriptionEn: 'Report robbery or dacoity involving force, threats, or an organized group.',
    },
    {
      id: 'snatching',
      nameBn: 'ছিনতাই',
      nameEn: 'Snatching',
      descriptionBn: 'রাস্তায় বা জনসমাগমস্থলে জোর করে জিনিস ছিনিয়ে নেওয়ার ঘটনা জানান।',
      descriptionEn: 'Report snatching in streets, transport areas, or other public places.',
    },
  ],
  road_transport: [
    {
      id: 'road-repair-delay',
      nameBn: 'রাস্তা মেরামতে বিলম্ব',
      nameEn: 'Road Repair Delay',
      descriptionBn: 'দীর্ঘদিন ধরে রাস্তা ভাঙা, খোঁড়াখুঁড়ি বা অসমাপ্ত মেরামতের সমস্যা জানান।',
      descriptionEn: 'Report long-running damaged roads, excavation, or delayed/unfinished repairs.',
    },
    {
      id: 'road-accident',
      nameBn: 'সড়ক দুর্ঘটনা',
      nameEn: 'Road Accident',
      descriptionBn: 'সড়ক দুর্ঘটনার স্থান, সময় ও প্রাসঙ্গিক তথ্য জানান।',
      descriptionEn: 'Report the location, time, and relevant details of a road accident.',
    },
    {
      id: 'road-block-obstruction',
      nameBn: 'সড়ক অবরোধ / চলাচলে প্রতিবন্ধকতা',
      nameEn: 'Road Block / Obstruction',
      descriptionBn: 'প্রতিবাদ, দুর্ঘটনা, নির্মাণকাজ, যানবাহন বা অন্য কারণে সড়ক বন্ধ বা চলাচলে বাধার তথ্য জানান।',
      descriptionEn: 'Report road blocks or obstructions caused by demonstrations, accidents, roadwork, vehicles, or other causes.',
    },
  ],
  illegal_occupation: [
    {
      id: 'road-footpath-overbridge-encroachment',
      nameBn: 'রাস্তা / ফুটপাত / ফুটওভার ব্রিজ দখল',
      nameEn: 'Road / Footpath / Foot-over-bridge Encroachment',
      descriptionBn: 'দোকান, স্টল, স্থাপনা বা অন্যভাবে রাস্তা, ফুটপাত বা ফুটওভার ব্রিজ দখলের তথ্য জানান।',
      descriptionEn: 'Report shops, stalls, structures, or other encroachment on roads, footpaths, or foot-over-bridges.',
    },
    {
      id: 'private-land-property-occupation',
      nameBn: 'ব্যক্তিগত জমি/সম্পত্তি অবৈধ দখল',
      nameEn: 'Illegal Occupation of Private Land / Property',
      descriptionBn: 'ব্যক্তিগত জমি বা সম্পত্তি অবৈধভাবে দখলের অভিযোগ জানান।',
      descriptionEn: 'Report alleged illegal occupation of privately owned land or property.',
    },
    {
      id: 'government-land-property-occupation',
      nameBn: 'সরকারি জমি/সম্পত্তি অবৈধ দখল',
      nameEn: 'Illegal Occupation of Government Land / Property',
      descriptionBn: 'সরকারি জমি, ভবন বা অন্য সম্পত্তি অবৈধভাবে দখলের তথ্য জানান।',
      descriptionEn: 'Report alleged illegal occupation of government land, buildings, or other public property.',
    },
  ],
};

export const getPhase1Subcategories = (segment: SectionKey): SubcategoryOption[] =>
  PHASE1_SUBCATEGORIES[segment] || [];
