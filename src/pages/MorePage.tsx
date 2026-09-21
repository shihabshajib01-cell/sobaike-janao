import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  FileText,
  HelpCircle,
  Info,
  Lock,
  MapPin,
  Paperclip,
  Phone,
  Scale,
  Shield,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BANGLADESH_HELPLINES } from '../data/reportOptions';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { CategoryIcon } from '../components/branding/CategoryIcon';
import { useTaxonomy } from '../services/taxonomyService';
import { SECTIONS, SectionKey } from '../theme/tokens';
import { HorizontalScrollRail } from '../components/ui/HorizontalScrollRail';
import { Button } from '../components/ui/Button';
import { PlatformInformationDetails } from '../components/home/HomeSeoContent';

type InfoTab = 'about' | 'guide' | 'helplines' | 'principles' | 'response' | 'faq';

type CategoryGuide = {
  key: SectionKey;
  bn: string;
  en: string;
};

const CATEGORY_GUIDES: CategoryGuide[] = [
  { key: 'harassment', bn: 'হয়রানি, নির্যাতন, প্রতারণা ও অনলাইন হয়রানি', en: 'Harassment, abuse, deception and online harassment' },
  { key: 'extortion', bn: 'ঘুষ ও চাঁদাবাজি', en: 'Bribery and extortion' },
  { key: 'public_safety', bn: 'চুরি, ডাকাতি, ছিনতাই ও মব সহিংসতা', en: 'Theft, robbery, snatching and mob violence' },
  { key: 'road_transport', bn: 'সড়ক মেরামত, দুর্ঘটনা ও সড়ক অবরোধ', en: 'Road repair, accidents and road blocks' },
  { key: 'load_shedding', bn: 'লোডশেডিং, গ্যাস সংকট ও অতিরিক্ত বিদ্যুৎ বিল', en: 'Load shedding, gas shortage and excess electricity bills' },
  { key: 'illegal_occupation', bn: 'রাস্তা, ফুটপাত, ব্যক্তিগত বা সরকারি সম্পত্তির অবৈধ দখল', en: 'Illegal occupation of roads, public space, private or government property' },
  { key: 'rickshaw', bn: 'অবৈধ বা ঝুঁকিপূর্ণ অটো-রিকশা চার্জিং', en: 'Illegal or unsafe auto-rickshaw charging' },
];

const REPORT_STEPS = [
  { n: '1', icon: FileText, bn: 'বিষয় নির্বাচন করুন', en: 'Choose an issue', bnText: 'সাতটি সক্রিয় বিষয়ের মধ্যে সঠিক বিভাগ বেছে নিন।', enText: 'Choose the correct category from the seven active issue areas.' },
  { n: '2', icon: CheckCircle2, bn: 'অভিযোগের ধরন বেছে নিন', en: 'Choose the complaint type', bnText: 'নির্বাচিত বিষয়ের উপধরন বা পরিস্থিতি নির্বাচন করুন।', enText: 'Select the relevant subtype or situation for that category.' },
  { n: '3', icon: MapPin, bn: 'ঘটনার তথ্য দিন', en: 'Add incident details', bnText: 'বিবরণ, তারিখ, অবস্থান এবং প্রাসঙ্গিক অতিরিক্ত তথ্য দিন।', enText: 'Add the description, date, location and relevant supporting details.' },
  { n: '4', icon: FileCheck2, bn: 'পর্যালোচনা করে জমা দিন', en: 'Review and submit', bnText: 'সব তথ্য যাচাই করে তারপর প্রতিবেদন জমা দিন।', enText: 'Check the information before sending the report for review.' },
];

export const MorePage: React.FC = () => {
  const {
    language,
    browseLocation,
    browseLocationStatus,
    openLocationConsent,
    useApproximateBrowseLocation,
  } = useApp();
  const { segments } = useTaxonomy();
  const [activeTab, setActiveTab] = useState<InfoTab>('about');
  const [openFaq, setOpenFaq] = useState<string | null>('faq-1');

  const hasPreciseBrowseLocation =
    browseLocationStatus === 'available' && browseLocation?.source === 'device';
  const hasApproximateBrowseLocation =
    browseLocationStatus === 'available' && browseLocation?.source === 'ip';
  const hasApproximateBrowsePreference =
    VisitorSessionService.getLocationChoice() === 'not_now';

  const tabs: Array<{ key: InfoTab; labelBn: string; labelEn: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'about', labelBn: 'সম্পর্কে', labelEn: 'About', icon: Info },
    { key: 'guide', labelBn: 'রিপোর্ট নির্দেশিকা', labelEn: 'Reporting Guide', icon: BookOpen },
    { key: 'helplines', labelBn: 'জরুরি সহায়তা', labelEn: 'Emergency Help', icon: Phone },
    { key: 'principles', labelBn: 'সুরক্ষা ও গোপনীয়তা', labelEn: 'Privacy & Safety', icon: Shield },
    { key: 'response', labelBn: 'পর্যালোচনা ও প্রকাশ', labelEn: 'Review & Publication', icon: Scale },
    { key: 'faq', labelBn: 'সাধারণ প্রশ্ন', labelEn: 'FAQ', icon: HelpCircle },
  ];

  const faqs = [
    {
      id: 'faq-1',
      qBn: 'কোন কোন বিষয়ে প্রতিবেদন করা যায়?',
      qEn: 'What can I report?',
      aBn: 'বর্তমানে হয়রানি ও নির্যাতন, ঘুষ ও চাঁদাবাজি, জননিরাপত্তা, সড়ক ও যাতায়াত সমস্যা, ইউটিলিটি সমস্যা, অবৈধ দখল এবং অবৈধ অটো চার্জিং বিষয়ে প্রতিবেদন করা যায়।',
      aEn: 'Current reporting areas are harassment and abuse, bribery and extortion, public safety, road and transport issues, utility issues, illegal occupation, and illegal auto-rickshaw charging.',
    },
    {
      id: 'faq-2',
      qBn: 'প্রতিবেদন কি সঙ্গে সঙ্গে প্রকাশিত হয়?',
      qEn: 'Is a report published immediately?',
      aBn: 'না। জমা দেওয়া প্রতিবেদন আগে পর্যালোচনা করা হয়। প্রয়োজন হলে তথ্য যাচাই, সম্পাদনা বা গোপনীয় তথ্য আড়াল করার পর উপযুক্ত প্রতিবেদন প্রকাশ করা হয়।',
      aEn: 'No. Submitted reports are reviewed first. Suitable reports may be verified, edited, or have sensitive information redacted before publication.',
    },
    {
      id: 'faq-3',
      qBn: 'ব্যক্তির নাম দেওয়া কি বাধ্যতামূলক?',
      qEn: 'Is a person name required?',
      aBn: 'না। কোনো ব্যক্তি, দপ্তর, প্রতিষ্ঠান, যানবাহন বা সংশ্লিষ্ট পক্ষের পরিচয় জানা থাকলে প্রাসঙ্গিক তথ্য দেওয়া যায়; না জানলে অনুমান করে তথ্য দেওয়ার প্রয়োজন নেই।',
      aEn: 'No. Add a person, office, organisation, vehicle or other involved party only when the information is known and relevant. Do not guess.',
    },
    {
      id: 'faq-4',
      qBn: 'ছবি বা প্রমাণ দেওয়া কি বাধ্যতামূলক?',
      qEn: 'Are photos or evidence required?',
      aBn: 'না। সংযুক্তি ঐচ্ছিক। তবে নিরাপদ ও প্রাসঙ্গিক হলে ছবি বা নথি প্রতিবেদন বুঝতে সহায়তা করতে পারে।',
      aEn: 'No. Attachments are optional, but relevant and safe photos or documents can help reviewers understand the incident.',
    },
    {
      id: 'faq-5',
      qBn: 'এখানে প্রতিবেদন করলে কি জিডি বা মামলা হয়ে যায়?',
      qEn: 'Does reporting here create a GD or legal case?',
      aBn: 'না। সবাইকে জানাও কোনো থানা, আদালত বা সরকারি অভিযোগ ব্যবস্থা নয়। জরুরি অবস্থা বা আনুষ্ঠানিক আইনি সহায়তার জন্য সংশ্লিষ্ট কর্তৃপক্ষের সঙ্গে যোগাযোগ করুন।',
      aEn: 'No. Sobaike Janao is not a police station, court, or government complaint system. Contact the appropriate authority for emergencies or formal legal action.',
    },
  ];

  return (
    <PublicPageContainer id="more-page-container">
      <section className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-card)] p-5 md:p-7 shadow-[var(--elevation-2xs)] space-y-4">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 w-fit px-3 py-1 rounded-[var(--radius-pill)] bg-ui-surface border border-ui-stroke-subtle type-meta text-ui-content-secondary">
            <Info className="w-4 h-4 text-ui-accent" aria-hidden="true" />
            {language === 'bn' ? 'ব্যবহারকারী নির্দেশিকা ও জ্ঞান কেন্দ্র' : 'User guide & knowledge hub'}
          </p>
          <h1 className="type-h1 text-ui-content-primary">
            {language === 'bn' ? 'তথ্য ও সহায়তা' : 'Information & Support'}
          </h1>
          <p className="type-body text-ui-content-secondary max-w-3xl">
            {language === 'bn'
              ? 'কীভাবে প্রতিবেদন করবেন, কোন বিষয়গুলো এখন চালু আছে, কী তথ্য দেওয়া প্রয়োজন, কীভাবে প্রতিবেদন পর্যালোচনা ও প্রকাশ করা হয় এবং কোথায় জরুরি সহায়তা পাবেন—সবকিছু এক জায়গায়।'
              : 'Learn what you can report, what information to provide, how review and publication work, and where to find emergency help.'}
          </p>
        </div>

        <div className="pt-3 border-t border-ui-stroke-subtle">
          <HorizontalScrollRail
            ariaLabel={language === 'bn' ? 'তথ্য ও সহায়তা বিভাগ' : 'Information and support sections'}
            previousLabel={language === 'bn' ? 'আগের বিভাগগুলো দেখুন' : 'Show previous sections'}
            nextLabel={language === 'bn' ? 'পরের বিভাগগুলো দেখুন' : 'Show more sections'}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <Button
                  key={tab.key}
                  type="button"
                  variant={active ? 'primary' : 'outline'}
                  size="sm"
                  aria-pressed={active}
                  onClick={() => setActiveTab(tab.key)}
                  leftIcon={<Icon className="w-4 h-4" aria-hidden="true" />}
                  className="shrink-0"
                >
                  {language === 'bn' ? tab.labelBn : tab.labelEn}
                </Button>
              );
            })}
          </HorizontalScrollRail>
        </div>
      </section>

      {activeTab === 'about' && (
        <section className="space-y-4">
          <div className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-card)] p-5 md:p-7 shadow-[var(--elevation-2xs)] space-y-5">
            <div className="space-y-2">
              <h2 className="type-h2 text-ui-content-primary">{language === 'bn' ? 'Sobaike Janao — সবাইকে জানাও সম্পর্কে' : 'About Sobaike Janao'}</h2>
              <p className="type-body text-ui-content-secondary">
                {language === 'bn'
                  ? 'Sobaike Janao (সবাইকে জানাও) বাংলাদেশের একটি স্বাধীন, মডারেটেড নাগরিক প্রতিবেদন ও জনস্বার্থ তথ্য প্ল্যাটফর্ম, যেখানে মানুষ দায়িত্বশীলভাবে তথ্য, অভিজ্ঞতা ও পর্যবেক্ষণ প্রকাশ করতে পারেন।'
                  : 'Sobaike Janao is an independent, moderated citizen-reporting and public-interest information platform for Bangladesh, where people can responsibly publish information, experiences, and observations.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3" data-nosnippet>
              <div className="rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface p-4 space-y-2">
                <ShieldAlert className="w-5 h-5 text-ui-accent" aria-hidden="true" />
                <h3 className="type-h4 text-ui-content-primary">{language === 'bn' ? 'সরকারি ওয়েবসাইট নয়' : 'Not a government website'}</h3>
                <p className="type-meta text-ui-content-secondary">{language === 'bn' ? 'এটি কোনো সরকারি প্রতিষ্ঠান, মন্ত্রণালয় বা দাপ্তরিক অভিযোগ পোর্টাল নয়।' : 'This is not a government agency, ministry, or official complaint portal.'}</p>
              </div>
              <div className="rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface p-4 space-y-2">
                <Scale className="w-5 h-5 text-ui-accent" aria-hidden="true" />
                <h3 className="type-h4 text-ui-content-primary">{language === 'bn' ? 'থানা বা আদালত নয়' : 'Not police or a court'}</h3>
                <p className="type-meta text-ui-content-secondary">{language === 'bn' ? 'এখানে প্রতিবেদন করা জিডি, মামলা বা আনুষ্ঠানিক তদন্তের বিকল্প নয়।' : 'Reporting here does not create a GD, case, or formal investigation.'}</p>
              </div>
              <div className="rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface p-4 space-y-2">
                <AlertTriangle className="w-5 h-5 text-ui-accent" aria-hidden="true" />
                <h3 className="type-h4 text-ui-content-primary">{language === 'bn' ? 'জরুরি সেবা নয়' : 'Not an emergency service'}</h3>
                <p className="type-meta text-ui-content-secondary">{language === 'bn' ? 'তাৎক্ষণিক ঝুঁকি বা জরুরি অবস্থায় জাতীয় জরুরি সেবা বা সংশ্লিষ্ট কর্তৃপক্ষের সঙ্গে যোগাযোগ করুন।' : 'For immediate danger or emergencies, contact national emergency services or the appropriate authority.'}</p>
              </div>
            </div>
          </div>

          <div className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-card)] p-5 md:p-7 shadow-[var(--elevation-2xs)] space-y-4">
            <div className="space-y-1">
              <h2 className="type-h2 text-ui-content-primary">{language === 'bn' ? 'বর্তমান প্রতিবেদন বিষয়সমূহ' : 'Current reporting areas'}</h2>
              <p className="type-meta text-ui-content-secondary">{language === 'bn' ? 'প্ল্যাটফর্মে বর্তমানে সক্রিয় সাতটি বিষয়।' : 'The seven issue areas currently available on the platform.'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CATEGORY_GUIDES.map((item) => {
                const segment = segments[item.key];
                if (!segment) return null;
                return (
                  <div key={item.key} className="flex items-center gap-3 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface p-3.5">
                    <div className="w-10 h-10 shrink-0 rounded-[var(--radius-control)] flex items-center justify-center border border-ui-stroke-subtle bg-ui-surface text-ui-accent">
                      <CategoryIcon section={item.key} size="sm" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="type-h4 text-ui-content-primary">{language === 'bn' ? segment.nameBn || SECTIONS[item.key].nameBn : segment.nameEn || SECTIONS[item.key].nameEn}</h3>
                      <p className="type-meta text-ui-content-secondary">{language === 'bn' ? item.bn : item.en}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <PlatformInformationDetails language={language} />
        </section>
      )}

      {activeTab === 'guide' && (
        <section className="space-y-4">
          <div className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-card)] p-5 md:p-7 shadow-[var(--elevation-2xs)] space-y-4">
            <div className="space-y-1">
              <h2 className="type-h2 text-ui-content-primary">{language === 'bn' ? 'চার ধাপে প্রতিবেদন করুন' : 'Report in four steps'}</h2>
              <p className="type-meta text-ui-content-secondary">{language === 'bn' ? 'বর্তমান রিপোর্ট কম্পোজারের ধাপগুলোর সঙ্গে মিল রেখে নির্দেশিকা।' : 'Guidance aligned with the current report composer.'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REPORT_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.n} className="flex gap-3 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface p-4">
                    <div className="w-10 h-10 shrink-0 rounded-[var(--radius-pill)] bg-ui-action-bg text-ui-action-text flex items-center justify-center font-[var(--font-weight-bold)]">{step.n}</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-ui-accent" aria-hidden="true" />
                        <h3 className="type-h4 text-ui-content-primary">{language === 'bn' ? step.bn : step.en}</h3>
                      </div>
                      <p className="type-meta text-ui-content-secondary">{language === 'bn' ? step.bnText : step.enText}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-card)] p-5 md:p-7 shadow-[var(--elevation-2xs)] space-y-4">
            <h2 className="type-h2 text-ui-content-primary">{language === 'bn' ? 'কোন তথ্য প্রস্তুত রাখবেন' : 'Information to prepare'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                [MapPin, 'ঘটনার সঠিক এলাকা ও প্রয়োজনীয় বিস্তারিত ঠিকানা', 'Accurate area and any useful address details'],
                [FileText, 'সংক্ষিপ্ত কিন্তু স্পষ্ট ঘটনার বিবরণ, তারিখ ও সময়', 'A concise description, date and time'],
                [UserRound, 'জানা থাকলে সংশ্লিষ্ট ব্যক্তি, প্রতিষ্ঠান, যানবাহন বা দপ্তরের তথ্য', 'Known person, organisation, vehicle or office details when relevant'],
                [Paperclip, 'নিরাপদ ও প্রাসঙ্গিক হলে ছবি বা নথি—সংযুক্তি ঐচ্ছিক', 'Photos or documents when safe and relevant—attachments are optional'],
              ].map(([Icon, bn, en], index) => {
                const ItemIcon = Icon as React.ComponentType<{ className?: string }>;
                return (
                  <div key={index} className="flex items-start gap-3 rounded-[var(--radius-control)] border border-ui-stroke-subtle p-4">
                    <ItemIcon className="w-5 h-5 shrink-0 text-ui-accent mt-0.5" aria-hidden="true" />
                    <p className="type-body text-ui-content-secondary">{language === 'bn' ? bn as string : en as string}</p>
                  </div>
                );
              })}
            </div>
            <div className="rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface p-4 space-y-1">
              <h3 className="type-h4 text-ui-content-primary">{language === 'bn' ? 'ঘুষ প্রতিবেদনে অতিরিক্ত তথ্য' : 'Extra details for bribery reports'}</h3>
              <p className="type-meta text-ui-content-secondary">{language === 'bn' ? 'প্রযোজ্য হলে দপ্তর, সেবা বা প্রক্রিয়া এবং টাকার পরিমাণ যোগ করুন। এগুলো মূল ঘটনার বিবরণ ও অবস্থানের বিকল্প নয়।' : 'When relevant, add the office, service/process and amount of money. These supplement the core incident description and location.'}</p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'helplines' && (
        <section className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-card)] p-5 md:p-7 shadow-[var(--elevation-2xs)] space-y-4">
          <div className="space-y-1">
            <h2 className="type-h2 text-ui-content-primary">{language === 'bn' ? 'জরুরি ও জাতীয় সহায়তা' : 'Emergency & national support'}</h2>
            <p className="type-body text-ui-content-secondary">{language === 'bn' ? 'সবাইকে জানাও জরুরি সেবা নয়। তাৎক্ষণিক সহায়তার প্রয়োজন হলে প্রাসঙ্গিক জাতীয় হেল্পলাইনে যোগাযোগ করুন।' : 'Sobaike Janao is not an emergency service. Use the relevant national helpline when immediate support is needed.'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BANGLADESH_HELPLINES.map((hl) => (
              <a key={hl.number} href={`tel:${hl.number}`} className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus">
                <div className="min-w-0">
                  <h3 className="type-h4 text-ui-content-primary">{language === 'bn' ? hl.labelBn : hl.labelEn}</h3>
                  <p className="type-meta text-ui-content-secondary">{language === 'bn' ? hl.descBn : hl.descEn}</p>
                </div>
                <p className="type-h3 text-ui-accent shrink-0">{hl.number}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'principles' && (
        <section className="space-y-4">
          <div className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-card)] p-5 md:p-7 shadow-[var(--elevation-2xs)] space-y-4">
            <h2 className="type-h2 text-ui-content-primary">{language === 'bn' ? 'সুরক্ষা ও গোপনীয়তার মূল নীতি' : 'Privacy & safety principles'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                [Lock, 'অপ্রয়োজনীয় ব্যক্তিগত তথ্য দেবেন না', 'Avoid unnecessary personal information'],
                [UserRound, 'নাম বা পরিচয় জানা না থাকলে অনুমান করে লিখবেন না', 'Do not guess names or identities you do not know'],
                [Paperclip, 'সংযুক্তিতে ব্যক্তিগত বা সংবেদনশীল তথ্য থাকলে সতর্ক থাকুন', 'Use care when attachments contain personal or sensitive information'],
                [Shield, 'প্রকাশের আগে প্রতিবেদন পর্যালোচনা ও প্রয়োজনীয় রেডাকশন করা হতে পারে', 'Reports may be reviewed and sensitive details redacted before publication'],
              ].map(([Icon, bn, en], index) => {
                const ItemIcon = Icon as React.ComponentType<{ className?: string }>;
                return (
                  <div key={index} className="flex items-start gap-3 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface p-4">
                    <ItemIcon className="w-5 h-5 shrink-0 text-ui-accent mt-0.5" aria-hidden="true" />
                    <p className="type-body text-ui-content-secondary">{language === 'bn' ? bn as string : en as string}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            id="location-preference-card"
            className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-card)] p-5 md:p-7 shadow-[var(--elevation-2xs)] space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 shrink-0 rounded-[var(--radius-control)] bg-ui-surface border border-ui-stroke-subtle flex items-center justify-center">
                <MapPin className="w-5 h-5 text-ui-accent" aria-hidden="true" />
              </div>
              <div className="min-w-0 space-y-1">
                <h2 className="type-h2 text-ui-content-primary">
                  {language === 'bn' ? 'লোকেশন পছন্দ' : 'Location preference'}
                </h2>
                <p
                  id="location-preference-status"
                  className="type-body text-ui-content-secondary"
                >
                  {hasPreciseBrowseLocation
                    ? language === 'bn'
                      ? 'এখন ডিভাইসের নির্ভুল লোকেশন ব্যবহার হচ্ছে।'
                      : 'Precise device location is currently being used.'
                    : hasApproximateBrowseLocation
                    ? language === 'bn'
                      ? 'এখন আনুমানিক এলাকার লোকেশন ব্যবহার হচ্ছে।'
                      : 'Approximate area location is currently being used.'
                    : hasApproximateBrowsePreference
                    ? language === 'bn'
                      ? 'আনুমানিক এলাকার লোকেশন নির্বাচন করা আছে, তবে এটি সাময়িকভাবে পাওয়া যাচ্ছে না।'
                      : 'Approximate area location is selected, but it is temporarily unavailable.'
                    : language === 'bn'
                    ? 'বর্তমানে কোনো লোকেশন পাওয়া যাচ্ছে না।'
                    : 'Location is currently unavailable.'}
                </p>
                <p className="type-meta text-ui-content-muted">
                  {language === 'bn'
                    ? 'এটি শুধু ব্রাউজিং ও কাছাকাছি প্রতিবেদন দেখানোর জন্য। প্রতিবেদন জমা দেওয়ার সময় আলাদাভাবে ডিভাইস লোকেশন প্রয়োজন।'
                    : 'This preference is for browsing and nearby reports only. Report submission still requires a separate device-location check.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              {!hasPreciseBrowseLocation && (
                <Button
                  id="location-preference-use-precise"
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => openLocationConsent('browse')}
                  leftIcon={<MapPin className="w-4 h-4" aria-hidden="true" />}
                >
                  {language === 'bn' ? 'নির্ভুল লোকেশন ব্যবহার করুন' : 'Use precise location'}
                </Button>
              )}

              {hasPreciseBrowseLocation && (
                <Button
                  id="location-preference-use-approximate"
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    void useApproximateBrowseLocation();
                  }}
                >
                  {language === 'bn' ? 'আনুমানিক লোকেশন ব্যবহার করুন' : 'Use approximate location'}
                </Button>
              )}

              {!hasPreciseBrowseLocation && !hasApproximateBrowseLocation && (
                <Button
                  id="location-preference-retry-approximate"
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    void useApproximateBrowseLocation();
                  }}
                >
                  {language === 'bn' ? 'আনুমানিক লোকেশন আবার চেষ্টা করুন' : 'Retry approximate location'}
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'response' && (
        <section className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-card)] p-5 md:p-7 shadow-[var(--elevation-2xs)] space-y-5">
          <div className="space-y-1">
            <h2 className="type-h2 text-ui-content-primary">{language === 'bn' ? 'জমা দেওয়ার পর কী হয়?' : 'What happens after submission?'}</h2>
            <p className="type-body text-ui-content-secondary">{language === 'bn' ? 'প্রতিবেদন প্রকাশের আগে প্রশাসনিক পর্যালোচনার মধ্য দিয়ে যায়।' : 'Reports go through administrative review before publication.'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-[var(--radius-control)] border border-ui-stroke-subtle p-4 space-y-2"><FileCheck2 className="w-5 h-5 text-ui-accent" aria-hidden="true" /><h3 className="type-h4 text-ui-content-primary">{language === 'bn' ? '১. পর্যালোচনা' : '1. Review'}</h3><p className="type-meta text-ui-content-secondary">{language === 'bn' ? 'বিষয়, উপধরন, বিবরণ, অবস্থান, সংযুক্তি ও প্রাসঙ্গিক তথ্য দেখা হয়।' : 'Category, subtype, description, location, attachments and relevant details are reviewed.'}</p></div>
            <div className="rounded-[var(--radius-control)] border border-ui-stroke-subtle p-4 space-y-2"><Shield className="w-5 h-5 text-ui-accent" aria-hidden="true" /><h3 className="type-h4 text-ui-content-primary">{language === 'bn' ? '২. প্রয়োজনীয় ব্যবস্থা' : '2. Moderation'}</h3><p className="type-meta text-ui-content-secondary">{language === 'bn' ? 'প্রয়োজনে সম্পাদনা, তথ্য আড়াল, প্রত্যাখ্যান বা অতিরিক্ত যাচাই করা হতে পারে।' : 'A report may be edited, redacted, rejected or checked further when needed.'}</p></div>
            <div className="rounded-[var(--radius-control)] border border-ui-stroke-subtle p-4 space-y-2"><CheckCircle2 className="w-5 h-5 text-ui-accent" aria-hidden="true" /><h3 className="type-h4 text-ui-content-primary">{language === 'bn' ? '৩. প্রকাশ' : '3. Publication'}</h3><p className="type-meta text-ui-content-secondary">{language === 'bn' ? 'অনুমোদিত প্রতিবেদন সংশ্লিষ্ট বিষয়, অনুসন্ধান, ফিল্টার ও মানচিত্রে দেখা যেতে পারে।' : 'Approved reports may appear in category feeds, search, filters and map views.'}</p></div>
          </div>
          <div className="rounded-[var(--radius-control)] bg-ui-surface border border-ui-stroke-subtle p-4">
            <p className="type-meta text-ui-content-secondary">{language === 'bn' ? 'প্রকাশিত হওয়া মানে অভিযোগটি আদালত, পুলিশ বা সরকারি কর্তৃপক্ষ কর্তৃক সত্য প্রমাণিত হয়েছে—এমন নয়।' : 'Publication does not mean an allegation has been proven by a court, police, or government authority.'}</p>
          </div>
        </section>
      )}

      {activeTab === 'faq' && (
        <section className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-card)] p-5 md:p-7 shadow-[var(--elevation-2xs)] space-y-3">
          <div className="space-y-1 pb-2">
            <h2 className="type-h2 text-ui-content-primary">{language === 'bn' ? 'সাধারণ প্রশ্ন' : 'Frequently asked questions'}</h2>
            <p className="type-meta text-ui-content-secondary">{language === 'bn' ? 'বর্তমান রিপোর্টিং ব্যবস্থা সম্পর্কে গুরুত্বপূর্ণ প্রশ্নের উত্তর।' : 'Key answers about the current reporting system.'}</p>
          </div>
          {faqs.map((faq) => {
            const open = openFaq === faq.id;
            return (
              <div key={faq.id} className="rounded-[var(--radius-control)] border border-ui-stroke-subtle overflow-hidden">
                <button type="button" aria-expanded={open} onClick={() => setOpenFaq(open ? null : faq.id)} className="w-full min-h-12 flex items-center justify-between gap-3 px-4 py-3 text-left bg-ui-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus">
                  <h3 className="type-h4 text-ui-content-primary">{language === 'bn' ? faq.qBn : faq.qEn}</h3>
                  <ChevronDown className={`w-5 h-5 shrink-0 text-ui-content-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {open && <p className="type-body text-ui-content-secondary px-4 py-4 border-t border-ui-stroke-subtle">{language === 'bn' ? faq.aBn : faq.aEn}</p>}
              </div>
            );
          })}
        </section>
      )}
    </PublicPageContainer>
  );
};