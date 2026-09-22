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
  nameLabelBn?: string;
  nameLabelEn?: string;
  namePlaceholderBn?: string;
  namePlaceholderEn?: string;
  roleLabelBn?: string;
  roleLabelEn?: string;
  rolePlaceholderBn?: string;
  rolePlaceholderEn?: string;
  organizationLabelBn?: string;
  organizationLabelEn?: string;
  organizationPlaceholderBn?: string;
  organizationPlaceholderEn?: string;
  identifyingLabelBn?: string;
  identifyingLabelEn?: string;
  identifyingPlaceholderBn?: string;
  identifyingPlaceholderEn?: string;
  showContact?: boolean;
  showOrganization?: boolean;
  allowAdditionalParties?: boolean;
  options: SubjectOptionItem[];
}

const UNKNOWN_OPTION: SubjectOptionItem = {
  value: 'unknown',
  labelBn: 'অজ্ঞাত / নিশ্চিত নই',
  labelEn: 'Unknown / Not Sure',
};

const GENERIC_PERSON_GROUP_OPTIONS: SubjectOptionItem[] = [
  { value: 'individual', labelBn: 'ব্যক্তি', labelEn: 'Individual' },
  { value: 'group', labelBn: 'দল / গ্রুপ', labelEn: 'Group' },
  { value: 'organization', labelBn: 'প্রতিষ্ঠান / সংগঠন', labelEn: 'Organization' },
  UNKNOWN_OPTION,
];

export const REPORT_SUBJECT_CONFIGS: Record<string, ReportSubjectConfig> = {
  // Rickshaw - existing solved operator flow
  'rickshaw:charging-station-location': {
    sectionTitleBn: 'চার্জিং স্টেশন / পরিচালনাকারীর তথ্য',
    sectionTitleEn: 'Charging station / operator information',
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
    sectionTitleBn: 'চার্জিং স্টেশন / পরিচালনাকারীর তথ্য',
    sectionTitleEn: 'Charging station / operator information',
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
    sectionTitleBn: 'ঘুষের সঙ্গে সংশ্লিষ্ট ব্যক্তি / দপ্তরের তথ্য',
    sectionTitleEn: 'Person / office involved in the bribery',
    questionBn: 'ঘুষের সঙ্গে কোন ব্যক্তি, কর্মকর্তা বা দপ্তর জড়িত ছিল?',
    questionEn: 'Which person, officer, or office was involved in the bribery?',
    nameLabelBn: 'ব্যক্তি / কর্মকর্তা / দপ্তরের নাম',
    nameLabelEn: 'Person / officer / office name',
    namePlaceholderBn: 'নাম বা পরিচিতি জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter the name or known identity if known',
    roleLabelBn: 'পদবি / দায়িত্ব',
    roleLabelEn: 'Designation / responsibility',
    rolePlaceholderBn: 'যেমন: কর্মকর্তা, কর্মচারী, সেবা প্রদানকারী',
    rolePlaceholderEn: 'e.g. Officer, Employee, Service provider',
    organizationLabelBn: 'দপ্তর / প্রতিষ্ঠান / সংস্থা',
    organizationLabelEn: 'Office / organization / agency',
    organizationPlaceholderBn: 'সংশ্লিষ্ট দপ্তর, প্রতিষ্ঠান বা সংস্থার নাম',
    organizationPlaceholderEn: 'Related office, organization, or agency',
    identifyingPlaceholderBn: 'কাউন্টার, কক্ষ, শাখা, চেহারা বা অন্য শনাক্তকারী তথ্য',
    identifyingPlaceholderEn: 'Counter, room, branch, appearance, or other identifying details',
    options: [
      { value: 'individual', labelBn: 'ব্যক্তি / কর্মকর্তা', labelEn: 'Person / Officer' },
      { value: 'organization', labelBn: 'দপ্তর / প্রতিষ্ঠান', labelEn: 'Office / Organization' },
      { value: 'group', labelBn: 'একাধিক ব্যক্তি / দল', labelEn: 'Multiple people / Group' },
      UNKNOWN_OPTION,
    ],
  },
  'extortion:bribe-paid': {
    sectionTitleBn: 'ঘুষ গ্রহণকারী ব্যক্তি / দপ্তরের তথ্য',
    sectionTitleEn: 'Person / office receiving the bribe',
    questionBn: 'কে ঘুষ গ্রহণ করেছে বা কোন দপ্তর / সেবা প্রদানকারীর সঙ্গে ঘটনাটি ঘটেছে?',
    questionEn: 'Who received the bribe, or which office / service provider was involved?',
    nameLabelBn: 'ব্যক্তি / কর্মকর্তা / দপ্তরের নাম',
    nameLabelEn: 'Person / officer / office name',
    namePlaceholderBn: 'নাম বা পরিচিতি জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter the name or known identity if known',
    roleLabelBn: 'পদবি / দায়িত্ব',
    roleLabelEn: 'Designation / responsibility',
    rolePlaceholderBn: 'যেমন: কর্মকর্তা, কর্মচারী, সেবা প্রদানকারী',
    rolePlaceholderEn: 'e.g. Officer, Employee, Service provider',
    organizationLabelBn: 'দপ্তর / প্রতিষ্ঠান / সংস্থা',
    organizationLabelEn: 'Office / organization / agency',
    organizationPlaceholderBn: 'সংশ্লিষ্ট দপ্তর, প্রতিষ্ঠান বা সংস্থার নাম',
    organizationPlaceholderEn: 'Related office, organization, or agency',
    identifyingPlaceholderBn: 'কাউন্টার, কক্ষ, শাখা, চেহারা বা অন্য শনাক্তকারী তথ্য',
    identifyingPlaceholderEn: 'Counter, room, branch, appearance, or other identifying details',
    options: [
      { value: 'individual', labelBn: 'ব্যক্তি / কর্মকর্তা', labelEn: 'Person / Officer' },
      { value: 'organization', labelBn: 'দপ্তর / প্রতিষ্ঠান', labelEn: 'Office / Organization' },
      { value: 'group', labelBn: 'একাধিক ব্যক্তি / দল', labelEn: 'Multiple people / Group' },
      UNKNOWN_OPTION,
    ],
  },

  // Extortion
  'extortion:shop-business': {
    sectionTitleBn: 'চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: 'Extortion party information',
    questionBn: 'চাঁদা কে দাবি করছে?',
    questionEn: 'Who is demanding the money?',
    namePlaceholderBn: 'চাঁদা দাবিকারীর নাম বা পরিচিত নাম জানা থাকলে লিখুন',
    namePlaceholderEn: "Enter the person's or party's name if known",
    options: [
      { value: 'individual', labelBn: 'ব্যক্তি / চাঁদা দাবিকারী', labelEn: 'Individual' },
      { value: 'group', labelBn: 'দল / সিন্ডিকেট', labelEn: 'Group / Syndicate' },
      { value: 'organization', labelBn: 'সমিতি / কমিটি / সংগঠন', labelEn: 'Association / Committee / Organization' },
      UNKNOWN_OPTION,
    ],
  },
  'extortion:transport-movement': {
    sectionTitleBn: 'চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: 'Extortion party information',
    questionBn: 'চাঁদা কে আদায় করছে?',
    questionEn: 'Who is collecting the money?',
    namePlaceholderBn: 'চাঁদা আদায়কারীর নাম বা পরিচিত নাম জানা থাকলে লিখুন',
    namePlaceholderEn: "Enter the collector's or party's name if known",
    options: [
      { value: 'individual', labelBn: 'চাঁদা আদায়কারী ব্যক্তি', labelEn: 'Individual Collector' },
      { value: 'group', labelBn: 'দল / সিন্ডিকেট', labelEn: 'Group / Syndicate' },
      { value: 'organization', labelBn: 'স্ট্যান্ড / পরিবহন সমিতি / কমিটি', labelEn: 'Stand / Transport Association / Committee' },
      UNKNOWN_OPTION,
    ],
  },
  'extortion:construction-property': {
    sectionTitleBn: 'চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: 'Extortion party information',
    questionBn: 'চাঁদা বা বাধা কে দিচ্ছে?',
    questionEn: 'Who is demanding money or creating the obstruction?',
    namePlaceholderBn: 'নাম বা পরিচিতি জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter the name or known identity if known',
    options: [
      { value: 'individual', labelBn: 'ব্যক্তি / চাঁদা দাবিকারী', labelEn: 'Individual' },
      { value: 'group', labelBn: 'দল / সিন্ডিকেট', labelEn: 'Group / Syndicate' },
      { value: 'organization', labelBn: 'স্থানীয় সংগঠন / কমিটি', labelEn: 'Local Organization / Committee' },
      UNKNOWN_OPTION,
    ],
  },
  'extortion:threat-money-demand': {
    sectionTitleBn: 'চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: 'Extortion party information',
    questionBn: 'হুমকি দিয়ে টাকা কে দাবি করছে?',
    questionEn: 'Who is making the threatening demand?',
    namePlaceholderBn: 'নাম বা পরিচিতি জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter the name or known identity if known',
    options: [
      { value: 'individual', labelBn: 'ব্যক্তি', labelEn: 'Individual' },
      { value: 'group', labelBn: 'দল / সিন্ডিকেট', labelEn: 'Group / Syndicate' },
      { value: 'organization', labelBn: 'সংগঠন / গ্রুপ', labelEn: 'Organization / Group' },
      { value: 'unknown', labelBn: 'অজ্ঞাত / ফোন বা অনলাইন পরিচিতি মাত্র', labelEn: 'Unknown / Phone or Online Identity Only' },
    ],
  },
  'extortion:extortion-other': {
    sectionTitleBn: 'চাঁদা দাবিকারীর তথ্য',
    sectionTitleEn: 'Extortion party information',
    questionBn: 'চাঁদা বা অর্থ কে দাবি করছে?',
    questionEn: 'Who is demanding the money?',
    namePlaceholderBn: 'নাম বা পরিচিতি জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter the name or known identity if known',
    options: GENERIC_PERSON_GROUP_OPTIONS,
  },
  'extortion:default': {
    sectionTitleBn: 'সংশ্লিষ্ট ব্যক্তি / প্রতিষ্ঠানের তথ্য',
    sectionTitleEn: 'Related person / organization information',
    questionBn: 'ঘটনার সঙ্গে সংশ্লিষ্ট ব্যক্তি, দল বা প্রতিষ্ঠান সম্পর্কে জানা তথ্য দিন।',
    questionEn: 'Add any known information about the person, group, or organization involved.',
    namePlaceholderBn: 'নাম বা পরিচিতি জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter the name or known identity if known',
    options: GENERIC_PERSON_GROUP_OPTIONS,
  },

  // Public Safety
  'public_safety:theft': {
    sectionTitleBn: 'সন্দেহভাজন / জড়িত ব্যক্তির তথ্য',
    sectionTitleEn: 'Suspect / involved party information',
    questionBn: 'চুরির সঙ্গে জড়িত ব্যক্তি বা দল সম্পর্কে কোনো তথ্য জানা আছে?',
    questionEn: 'Do you know anything about the person or group involved in the theft?',
    nameLabelBn: 'নাম / পরিচিতি',
    nameLabelEn: 'Name / known identity',
    namePlaceholderBn: 'নাম জানা থাকলে লিখুন; না জানলে খালি রাখুন',
    namePlaceholderEn: 'Enter the name if known; otherwise leave blank',
    roleLabelBn: 'ভূমিকা / সম্পর্ক',
    roleLabelEn: 'Role / connection',
    organizationLabelBn: 'দল / প্রতিষ্ঠান',
    organizationLabelEn: 'Group / organization',
    identifyingPlaceholderBn: 'চেহারা, পোশাক, যানবাহন, নম্বরপ্লেট বা অন্য শনাক্তকারী তথ্য',
    identifyingPlaceholderEn: 'Appearance, clothing, vehicle, plate number, or other identifying details',
    options: GENERIC_PERSON_GROUP_OPTIONS,
  },
  'public_safety:robbery': {
    sectionTitleBn: 'ডাকাত / জড়িত পক্ষের তথ্য',
    sectionTitleEn: 'Robber / involved party information',
    questionBn: 'ডাকাত বা জড়িত দল সম্পর্কে কোনো তথ্য জানা আছে?',
    questionEn: 'Do you know anything about the robber or group involved?',
    nameLabelBn: 'নাম / পরিচিতি',
    nameLabelEn: 'Name / known identity',
    namePlaceholderBn: 'নাম জানা থাকলে লিখুন; না জানলে খালি রাখুন',
    namePlaceholderEn: 'Enter the name if known; otherwise leave blank',
    organizationLabelBn: 'দল / গ্রুপ',
    organizationLabelEn: 'Group',
    identifyingPlaceholderBn: 'চেহারা, পোশাক, অস্ত্রের বর্ণনা, যানবাহন বা অন্য শনাক্তকারী তথ্য',
    identifyingPlaceholderEn: 'Appearance, clothing, weapon description, vehicle, or other identifying details',
    options: GENERIC_PERSON_GROUP_OPTIONS,
  },
  'public_safety:snatching': {
    sectionTitleBn: 'ছিনতাইকারী / জড়িত ব্যক্তির তথ্য',
    sectionTitleEn: 'Snatcher / involved party information',
    questionBn: 'ছিনতাইকারী বা জড়িত ব্যক্তি / দল সম্পর্কে কোনো তথ্য জানা আছে?',
    questionEn: 'Do you know anything about the snatcher or other people involved?',
    nameLabelBn: 'নাম / পরিচিতি',
    nameLabelEn: 'Name / known identity',
    namePlaceholderBn: 'নাম জানা থাকলে লিখুন; না জানলে খালি রাখুন',
    namePlaceholderEn: 'Enter the name if known; otherwise leave blank',
    organizationLabelBn: 'দল / গ্রুপ',
    organizationLabelEn: 'Group',
    identifyingPlaceholderBn: 'চেহারা, পোশাক, মোটরসাইকেল / যানবাহন, নম্বরপ্লেট বা অন্য শনাক্তকারী তথ্য',
    identifyingPlaceholderEn: 'Appearance, clothing, motorcycle / vehicle, plate number, or other identifying details',
    options: GENERIC_PERSON_GROUP_OPTIONS,
  },
  'public_safety:ride_sharing_safety': {
    sectionTitleBn: 'চালক / যাত্রী / সংশ্লিষ্ট পক্ষের তথ্য',
    sectionTitleEn: 'Driver / passenger / related party information',
    questionBn: 'ঘটনার সঙ্গে সংশ্লিষ্ট চালক, যাত্রী বা অন্য পক্ষ সম্পর্কে জানা তথ্য দিন।',
    questionEn: 'Add any known information about the driver, passenger, or other party involved in the incident.',
    nameLabelBn: 'নাম / অ্যাপে দেখানো পরিচিতি',
    nameLabelEn: 'Name / identity shown in the app',
    namePlaceholderBn: 'অ্যাপে দেখানো নাম বা পরিচিতি জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter the name or identity shown in the app if known',
    roleLabelBn: 'সংশ্লিষ্ট ব্যক্তির ভূমিকা',
    roleLabelEn: 'Related person role',
    rolePlaceholderBn: 'যেমন: চালক, যাত্রী বা অন্য সংশ্লিষ্ট ব্যক্তি',
    rolePlaceholderEn: 'e.g. Driver, passenger, or another related person',
    identifyingLabelBn: 'অন্যান্য শনাক্তকারী তথ্য',
    identifyingLabelEn: 'Other identifying details',
    identifyingPlaceholderBn: 'চেহারা, পোশাক, যানবাহনের বর্ণনা বা অন্য শনাক্তকারী তথ্য',
    identifyingPlaceholderEn: 'Appearance, clothing, vehicle description, or other identifying details',
    showContact: false,
    showOrganization: false,
    allowAdditionalParties: false,
    options: [
      { value: 'individual', labelBn: 'ব্যক্তি', labelEn: 'Individual' },
      UNKNOWN_OPTION,
    ],
  },
  'public_safety:default': {
    sectionTitleBn: 'সন্দেহভাজন / জড়িত পক্ষের তথ্য',
    sectionTitleEn: 'Suspect / involved party information',
    questionBn: 'ঘটনার সঙ্গে জড়িত ব্যক্তি বা দল সম্পর্কে জানা তথ্য দিন।',
    questionEn: 'Add any known information about the person or group involved.',
    namePlaceholderBn: 'নাম জানা থাকলে লিখুন; না জানলে খালি রাখুন',
    namePlaceholderEn: 'Enter the name if known; otherwise leave blank',
    identifyingPlaceholderBn: 'চেহারা, পোশাক, যানবাহন বা অন্য শনাক্তকারী তথ্য',
    identifyingPlaceholderEn: 'Appearance, clothing, vehicle, or other identifying details',
    options: GENERIC_PERSON_GROUP_OPTIONS,
  },

  // Road & Transport Issues
  'road_transport:road-repair-delay': {
    sectionTitleBn: 'দায়িত্বপ্রাপ্ত কর্তৃপক্ষ / ঠিকাদারের তথ্য',
    sectionTitleEn: 'Responsible authority / contractor information',
    questionBn: 'দায়িত্বপ্রাপ্ত কর্তৃপক্ষ, ঠিকাদার বা প্রতিষ্ঠানের তথ্য জানা থাকলে যোগ করুন।',
    questionEn: 'Add the responsible authority, contractor, or organization if known.',
    nameLabelBn: 'কর্তৃপক্ষ / ঠিকাদার / পরিচিত নাম',
    nameLabelEn: 'Authority / contractor / known name',
    namePlaceholderBn: 'কর্তৃপক্ষ, ঠিকাদার বা পরিচিত নাম জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter the authority, contractor, or known name if available',
    roleLabelBn: 'দায়িত্ব / পদবি',
    roleLabelEn: 'Responsibility / designation',
    organizationLabelBn: 'দপ্তর / প্রতিষ্ঠান / ঠিকাদারি সংস্থা',
    organizationLabelEn: 'Office / organization / contractor',
    organizationPlaceholderBn: 'সংশ্লিষ্ট দপ্তর বা প্রতিষ্ঠানের নাম',
    organizationPlaceholderEn: 'Related office or organization name',
    identifyingPlaceholderBn: 'প্রকল্পের নাম, সাইনবোর্ড, কাজের প্যাকেজ বা অন্য শনাক্তকারী তথ্য',
    identifyingPlaceholderEn: 'Project name, signboard, work package, or other identifying details',
    options: [
      { value: 'organization', labelBn: 'সরকারি / স্থানীয় কর্তৃপক্ষ', labelEn: 'Government / Local Authority' },
      { value: 'business', labelBn: 'ঠিকাদার / প্রতিষ্ঠান', labelEn: 'Contractor / Business' },
      { value: 'individual', labelBn: 'দায়িত্বপ্রাপ্ত ব্যক্তি', labelEn: 'Responsible Person' },
      UNKNOWN_OPTION,
    ],
  },
  'road_transport:road-accident': {
    sectionTitleBn: 'জড়িত ব্যক্তি / যানবাহনের তথ্য',
    sectionTitleEn: 'Involved person / vehicle information',
    questionBn: 'দুর্ঘটনায় জড়িত ব্যক্তি বা যানবাহন সম্পর্কে জানা তথ্য যোগ করুন।',
    questionEn: 'Add any known information about a person or vehicle involved in the accident.',
    nameLabelBn: 'ব্যক্তি / চালক / যানবাহনের পরিচিতি',
    nameLabelEn: 'Person / driver / vehicle identity',
    namePlaceholderBn: 'নাম বা যানবাহনের পরিচিতি জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter the name or vehicle identity if known',
    roleLabelBn: 'ভূমিকা',
    roleLabelEn: 'Role',
    rolePlaceholderBn: 'যেমন: চালক, যাত্রী, পথচারী, মালিক',
    rolePlaceholderEn: 'e.g. Driver, Passenger, Pedestrian, Owner',
    organizationLabelBn: 'পরিবহন / প্রতিষ্ঠান',
    organizationLabelEn: 'Transport / organization',
    identifyingPlaceholderBn: 'যানবাহনের ধরন, রং, নম্বরপ্লেট বা অন্য শনাক্তকারী তথ্য',
    identifyingPlaceholderEn: 'Vehicle type, color, plate number, or other identifying details',
    options: GENERIC_PERSON_GROUP_OPTIONS,
  },
  'road_transport:road-block': {
    sectionTitleBn: 'অবরোধ / প্রতিবন্ধকতার সঙ্গে সংশ্লিষ্ট তথ্য',
    sectionTitleEn: 'Road obstruction related information',
    questionBn: 'অবরোধ বা চলাচলে প্রতিবন্ধকতার সঙ্গে সংশ্লিষ্ট ব্যক্তি, দল, যানবাহন বা প্রতিষ্ঠান সম্পর্কে জানা তথ্য দিন।',
    questionEn: 'Add any known information about a person, group, vehicle, or organization related to the obstruction.',
    nameLabelBn: 'নাম / পরিচিতি',
    nameLabelEn: 'Name / known identity',
    namePlaceholderBn: 'নাম, যানবাহন বা পরিচিতি জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter a name, vehicle, or known identity if available',
    organizationLabelBn: 'দল / প্রতিষ্ঠান / সংস্থা',
    organizationLabelEn: 'Group / organization',
    identifyingPlaceholderBn: 'যানবাহন, সাইনবোর্ড, অবস্থান বা অন্য প্রাসঙ্গিক শনাক্তকারী তথ্য',
    identifyingPlaceholderEn: 'Vehicle, signage, location clue, or other relevant identifying details',
    options: GENERIC_PERSON_GROUP_OPTIONS,
  },
  'road_transport:default': {
    sectionTitleBn: 'সংশ্লিষ্ট ব্যক্তি / প্রতিষ্ঠানের তথ্য',
    sectionTitleEn: 'Related person / organization information',
    questionBn: 'ঘটনার সঙ্গে সংশ্লিষ্ট ব্যক্তি, যানবাহন বা প্রতিষ্ঠানের জানা তথ্য দিন।',
    questionEn: 'Add any known information about a related person, vehicle, or organization.',
    namePlaceholderBn: 'নাম বা পরিচিতি জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter the name or known identity if available',
    options: GENERIC_PERSON_GROUP_OPTIONS,
  },

  // Illegal Occupation
  'illegal_occupation:road-public-space-encroachment': {
    sectionTitleBn: 'দখলকারী ব্যক্তি / প্রতিষ্ঠানের তথ্য',
    sectionTitleEn: 'Occupier / organization information',
    questionBn: 'রাস্তা, ফুটপাত বা জনস্থান কে দখল করেছে—জানা তথ্য যোগ করুন।',
    questionEn: 'Add any known information about who is occupying the road, footpath, or public space.',
    nameLabelBn: 'দখলকারী ব্যক্তি / দোকান / প্রতিষ্ঠানের নাম',
    nameLabelEn: 'Occupier / shop / organization name',
    namePlaceholderBn: 'নাম বা পরিচিতি জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter the name or known identity if available',
    organizationLabelBn: 'দোকান / ব্যবসা / প্রতিষ্ঠান / সংগঠন',
    organizationLabelEn: 'Shop / business / organization',
    identifyingPlaceholderBn: 'দোকানের সাইনবোর্ড, স্থাপনা, যানবাহন বা অন্য শনাক্তকারী তথ্য',
    identifyingPlaceholderEn: 'Shop sign, structure, vehicle, or other identifying details',
    options: [
      { value: 'business', labelBn: 'দোকান / ব্যবসা', labelEn: 'Shop / Business' },
      { value: 'individual', labelBn: 'ব্যক্তি', labelEn: 'Individual' },
      { value: 'group', labelBn: 'দল / একাধিক ব্যক্তি', labelEn: 'Group / Multiple People' },
      { value: 'organization', labelBn: 'প্রতিষ্ঠান / সংগঠন', labelEn: 'Organization' },
      UNKNOWN_OPTION,
    ],
  },
  'illegal_occupation:private-property-occupation': {
    sectionTitleBn: 'দখলকারী ব্যক্তি / প্রতিষ্ঠানের তথ্য',
    sectionTitleEn: 'Occupier / organization information',
    questionBn: 'ব্যক্তিগত জমি বা সম্পত্তি কে দখল করেছে—জানা তথ্য যোগ করুন।',
    questionEn: 'Add any known information about who is occupying the private land or property.',
    nameLabelBn: 'দখলকারীর নাম / পরিচিতি',
    nameLabelEn: 'Occupier name / known identity',
    namePlaceholderBn: 'নাম বা পরিচিতি জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter the name or known identity if available',
    organizationLabelBn: 'প্রতিষ্ঠান / সংগঠন / দল',
    organizationLabelEn: 'Organization / group',
    identifyingPlaceholderBn: 'দখলকারীর বর্ণনা, সাইনবোর্ড, স্থাপনা বা অন্য শনাক্তকারী তথ্য',
    identifyingPlaceholderEn: 'Description, signage, structure, or other identifying details',
    options: GENERIC_PERSON_GROUP_OPTIONS,
  },
  'illegal_occupation:government-property-occupation': {
    sectionTitleBn: 'দখলকারী ব্যক্তি / প্রতিষ্ঠানের তথ্য',
    sectionTitleEn: 'Occupier / organization information',
    questionBn: 'সরকারি জমি বা সম্পত্তি কে দখল করেছে—জানা তথ্য যোগ করুন।',
    questionEn: 'Add any known information about who is occupying the government land or property.',
    nameLabelBn: 'দখলকারীর নাম / পরিচিতি',
    nameLabelEn: 'Occupier name / known identity',
    namePlaceholderBn: 'নাম বা পরিচিতি জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter the name or known identity if available',
    organizationLabelBn: 'প্রতিষ্ঠান / সংগঠন / দল',
    organizationLabelEn: 'Organization / group',
    identifyingPlaceholderBn: 'দখলকারীর বর্ণনা, সাইনবোর্ড, স্থাপনা বা অন্য শনাক্তকারী তথ্য',
    identifyingPlaceholderEn: 'Description, signage, structure, or other identifying details',
    options: GENERIC_PERSON_GROUP_OPTIONS,
  },
  'illegal_occupation:default': {
    sectionTitleBn: 'দখলকারী ব্যক্তি / প্রতিষ্ঠানের তথ্য',
    sectionTitleEn: 'Occupier / organization information',
    questionBn: 'দখলের সঙ্গে সংশ্লিষ্ট ব্যক্তি বা প্রতিষ্ঠান সম্পর্কে জানা তথ্য দিন।',
    questionEn: 'Add any known information about the person or organization involved in the occupation.',
    namePlaceholderBn: 'নাম বা পরিচিতি জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter the name or known identity if available',
    options: GENERIC_PERSON_GROUP_OPTIONS,
  },
};

export function getReportSubjectConfig(
  segment: SectionKey,
  subcategoryId?: string
): ReportSubjectConfig | null {
  const exactKey = `${segment}:${subcategoryId || ''}`;
  if (REPORT_SUBJECT_CONFIGS[exactKey]) {
    return REPORT_SUBJECT_CONFIGS[exactKey];
  }

  const defaultKey = `${segment}:default`;
  if (REPORT_SUBJECT_CONFIGS[defaultKey]) {
    return REPORT_SUBJECT_CONFIGS[defaultKey];
  }

  // Never leak another category's language into an unrelated report.
  return null;
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

  // Graceful fallback for legacy drafts or unexpected values.
  switch (value) {
    case 'business':
      return language === 'bn' ? 'ব্যবসা / প্রতিষ্ঠান' : 'Business / Organization';
    case 'group':
      return language === 'bn' ? 'দল / গ্রুপ' : 'Group';
    case 'organization':
      return language === 'bn' ? 'প্রতিষ্ঠান / কর্তৃপক্ষ' : 'Organization / Authority';
    case 'individual':
      return language === 'bn' ? 'ব্যক্তি' : 'Individual';
    case 'unknown':
    default:
      return language === 'bn' ? 'অজ্ঞাত / নিশ্চিত নই' : 'Unknown / Not Sure';
  }
}
