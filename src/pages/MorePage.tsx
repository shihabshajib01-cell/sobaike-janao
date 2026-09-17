import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  Info,
  Lock,
  MapPin,
  Phone,
  Scale,
  Shield,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BANGLADESH_HELPLINES, SEGMENT_SUBCATEGORIES } from '../data/reportOptions';
import { SECTIONS, SectionKey } from '../theme/tokens';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { Accordion } from '../components/ui/Accordion';
import { CategoryIcon } from '../components/branding/CategoryIcon';

type MoreTab = 'about' | 'guide' | 'categories' | 'safety' | 'support' | 'faq';

const CATEGORY_ORDER: SectionKey[] = [
  'harassment',
  'extortion',
  'public_safety',
  'road_transport',
  'load_shedding',
  'illegal_occupation',
  'rickshaw',
];

export const MorePage: React.FC = () => {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<MoreTab>('about');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const tabs = useMemo(
    () => [
      { id: 'about' as const, icon: Info, bn: 'সম্পর্কে', en: 'About' },
      { id: 'guide' as const, icon: BookOpen, bn: 'কীভাবে জানাবেন', en: 'How to report' },
      { id: 'categories' as const, icon: FileText, bn: 'বিষয়সমূহ', en: 'Issues' },
      { id: 'safety' as const, icon: Shield, bn: 'সুরক্ষা', en: 'Safety' },
      { id: 'support' as const, icon: Phone, bn: 'সহায়তা', en: 'Support' },
      { id: 'faq' as const, icon: HelpCircle, bn: 'সাধারণ প্রশ্ন', en: 'FAQ' },
    ],
    []
  );

  const toggleFaq = (id: string) => {
    setOpenFaqId((current) => (current === id ? null : id));
  };

  const text = <T,>(bn: T, en: T): T => (language === 'bn' ? bn : en);

  return (
    <PublicPageContainer id="more-page-container">
      <section className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-5 md:p-7 space-y-5 shadow-2xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ui-surface-subtle border border-ui-stroke-subtle type-meta text-ui-content-secondary">
            <Info className="w-4 h-4 text-ui-accent" aria-hidden="true" />
            <span>{text('ব্যবহারকারী নির্দেশিকা ও জ্ঞান কেন্দ্র', 'User Guide & Knowledge Hub')}</span>
          </div>
          <h1 className="type-h1 text-ui-content-primary">{text('তথ্য ও সহায়তা', 'Information & Support')}</h1>
          <p className="type-body text-ui-content-secondary max-w-3xl">
            {text(
              'সবাইকে জানাও কীভাবে কাজ করে, কোন বিষয়ে প্রতিবেদন করা যায়, কীভাবে তথ্য জমা দেবেন এবং গোপনীয়তা ও নিরাপত্তা কীভাবে রক্ষা করা হয়—সব প্রয়োজনীয় তথ্য এখানে পাবেন।',
              'Learn how Sobaike Janao works, what you can report, how to submit information, and how privacy, review, and safety are handled.'
            )}
          </p>
        </div>

        <nav
          aria-label={text('তথ্য ও সহায়তা বিভাগ', 'Information and support sections')}
          className="flex items-center gap-2 pt-4 border-t border-ui-stroke-subtle overflow-x-auto pb-1 no-scrollbar"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] px-4 py-2.5 rounded-xl whitespace-nowrap inline-flex items-center gap-2 type-meta font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                  isActive
                    ? 'bg-ui-action-bg text-ui-action-text shadow-2xs'
                    : 'bg-ui-surface-subtle text-ui-content-secondary border border-ui-stroke-subtle'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{language === 'bn' ? tab.bn : tab.en}</span>
              </button>
            );
          })}
        </nav>
      </section>

      {activeTab === 'about' && (
        <div className="space-y-5">
          <section className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-5 md:p-7 space-y-5 shadow-2xs">
            <div className="space-y-2">
              <h2 className="type-h2 text-ui-content-primary">{text('সবাইকে জানাও কী?', 'What is Sobaike Janao?')}</h2>
              <p className="type-body text-ui-content-secondary">
                {text(
                  'সবাইকে জানাও একটি স্বাধীন নাগরিক তথ্য ও জনস্বার্থ প্ল্যাটফর্ম। নাগরিকরা এখানে জনস্বার্থসংশ্লিষ্ট সমস্যা, ঘটনা ও অভিজ্ঞতা কাঠামোবদ্ধভাবে জানাতে পারেন। জমা দেওয়া প্রতিবেদন সরাসরি প্রকাশিত হয় না; প্রকাশের আগে তা পর্যালোচনা করা হয়।',
                  'Sobaike Janao is an independent citizen-information and public-interest reporting platform. Submitted reports are structured, reviewed, and only suitable information is published.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <article className="p-4 rounded-xl bg-ui-warning-bg border border-ui-warning-border space-y-2">
                <div className="flex items-center gap-2 text-ui-warning-text">
                  <ShieldAlert className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <h3 className="type-h4">{text('সরকারি ওয়েবসাইট নয়', 'Not a government website')}</h3>
                </div>
                <p className="type-meta text-ui-content-secondary">
                  {text(
                    'এটি কোনো সরকারি দপ্তর, মন্ত্রণালয় বা রাষ্ট্রীয় অভিযোগ গ্রহণকারী ব্যবস্থা নয়।',
                    'This is not a government agency, ministry, or official grievance portal.'
                  )}
                </p>
              </article>

              <article className="p-4 rounded-xl bg-ui-info-bg border border-ui-info-border space-y-2">
                <div className="flex items-center gap-2 text-ui-info-text">
                  <Scale className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <h3 className="type-h4">{text('জিডি, মামলা বা বিচার নয়', 'Not a GD, case, or court process')}</h3>
                </div>
                <p className="type-meta text-ui-content-secondary">
                  {text(
                    'এখানে প্রতিবেদন জমা দেওয়া পুলিশে জিডি, মামলা বা কোনো আইনি সিদ্ধান্তের বিকল্প নয়।',
                    'Submitting here does not replace a police GD, legal case, regulatory complaint, or court process.'
                  )}
                </p>
              </article>
            </div>

            <div className="p-4 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle flex gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-ui-accent" aria-hidden="true" />
              <div className="space-y-1">
                <h3 className="type-h4 text-ui-content-primary">{text('প্রকাশের আগে পর্যালোচনা', 'Review before publication')}</h3>
                <p className="type-meta text-ui-content-secondary">
                  {text(
                    'প্রতিবেদন জমা দেওয়ার পর অ্যাডমিন পর্যালোচনা করে। প্রয়োজন হলে তথ্য যাচাই, সম্পাদনা বা গোপনীয়তা রক্ষার ব্যবস্থা নেওয়া হয়; অনুমোদনের পরই প্রতিবেদন জনসমক্ষে আসে।',
                    'Reports are reviewed by moderators. Information may be checked, edited, or protected for privacy before an approved report becomes public.'
                  )}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'guide' && (
        <section className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-5 md:p-7 space-y-5 shadow-2xs">
          <div className="space-y-2">
            <h2 className="type-h2 text-ui-content-primary">{text('প্রতিবেদন জমা দেওয়ার ৪ ধাপ', 'Submit a report in 4 steps')}</h2>
            <p className="type-body text-ui-content-secondary">
              {text(
                'বর্তমান রিপোর্টিং ফ্লো অনুসরণ করে সঠিক বিষয়, ধরন, ঘটনার তথ্য ও পর্যালোচনা সম্পন্ন করুন।',
                'Use the current reporting flow to choose the issue, specify the type, add incident details, and review before submitting.'
              )}
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                n: '1',
                icon: FileText,
                bn: 'বিষয় নির্বাচন করুন',
                en: 'Choose an issue',
                dbn: 'হয়রানি, চাঁদাবাজি ও ঘুষ, জননিরাপত্তা, সড়ক ও যাতায়াত, ইউটিলিটি, অবৈধ দখল বা অবৈধ অটো চার্জিং থেকে সঠিক বিষয় বেছে নিন।',
                den: 'Choose the correct issue from Harassment, Extortion & Bribery, Public Safety, Road & Transport, Utility, Illegal Occupation, or Illegal Auto-Charging.',
              },
              {
                n: '2',
                icon: CheckCircle2,
                bn: 'অভিযোগের ধরন নির্বাচন করুন',
                en: 'Choose the complaint type',
                dbn: 'নির্বাচিত বিষয়ের অধীনে প্রাসঙ্গিক সাবক্যাটাগরি বেছে নিন—যেমন ঘুষ, চুরি, ডাকাতি, ছিনতাই, মব সহিংসতা, সড়ক দুর্ঘটনা বা অবৈধ দখলের ধরন।',
                den: 'Select the relevant subcategory, such as bribery, theft, robbery, snatching, mob violence, road accident, or an occupation type.',
              },
              {
                n: '3',
                icon: MapPin,
                bn: 'ঘটনার তথ্য দিন',
                en: 'Add incident details',
                dbn: 'কী ঘটেছে, তারিখ, সময়, বিভাগ–জেলা–থানা/উপজেলা, প্রয়োজনীয় ঠিকানা এবং প্রাসঙ্গিক সংযুক্তি দিন। ব্যক্তি বা প্রতিষ্ঠানের পরিচয় জানা থাকলে কেবল প্রয়োজনীয় তথ্য যোগ করুন।',
                den: 'Add what happened, date, time, division, district, police station/upazila, useful address details, and relevant attachments. Add people or organization details only when known and useful.',
              },
              {
                n: '4',
                icon: BookOpen,
                bn: 'পর্যালোচনা করে জমা দিন',
                en: 'Review and submit',
                dbn: 'শেষ ধাপে তথ্য আবার দেখে ভুল, অপ্রয়োজনীয় ব্যক্তিগত তথ্য বা অসম্পূর্ণ অংশ ঠিক করে তারপর জমা দিন।',
                den: 'Review everything, correct mistakes, remove unnecessary personal information, and submit only when the report is complete.',
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.n} className="flex gap-3 p-4 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle">
                  <div className="w-9 h-9 rounded-full shrink-0 bg-ui-action-bg text-ui-action-text flex items-center justify-center font-bold">
                    {step.n}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-ui-accent shrink-0" aria-hidden="true" />
                      <h3 className="type-h4 text-ui-content-primary">{language === 'bn' ? step.bn : step.en}</h3>
                    </div>
                    <p className="type-meta text-ui-content-secondary">{language === 'bn' ? step.dbn : step.den}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'categories' && (
        <section className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-5 md:p-7 space-y-5 shadow-2xs">
          <div className="space-y-2">
            <h2 className="type-h2 text-ui-content-primary">{text('বর্তমান ৭টি বিষয়', '7 active issue categories')}</h2>
            <p className="type-body text-ui-content-secondary">
              {text(
                'বিষয়সমূহ পেজ এবং রিপোর্ট ফর্ম—দুই জায়গাতেই একই সক্রিয় ক্যাটাগরি ও সাবক্যাটাগরি ব্যবহার করা হয়।',
                'The Issues page and report form use the same active categories and subcategories.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CATEGORY_ORDER.map((key) => {
              const category = SECTIONS[key];
              const subcategories = SEGMENT_SUBCATEGORIES[key] || [];
              return (
                <article key={key} className="p-4 rounded-xl border border-ui-stroke-subtle bg-ui-surface-subtle space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl shrink-0 border flex items-center justify-center"
                      style={{
                        backgroundColor: `var(--sec-${key}-bg)`,
                        borderColor: `var(--sec-${key}-border)`,
                        color: `var(--sec-${key}-text)`,
                      }}
                    >
                      <CategoryIcon section={key} size="sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="type-h4 text-ui-content-primary">{language === 'bn' ? category.nameBn : category.nameEn}</h3>
                      <p className="type-meta text-ui-content-secondary mt-0.5">
                        {language === 'bn' ? category.descriptionBn : category.descriptionEn}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {subcategories.map((item) => (
                      <span
                        key={item.id}
                        className="px-2.5 py-1 rounded-full border border-ui-stroke-subtle bg-ui-surface type-meta text-ui-content-secondary"
                      >
                        {language === 'bn' ? item.nameBn : item.nameEn}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'safety' && (
        <section className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-5 md:p-7 space-y-5 shadow-2xs">
          <div className="space-y-2">
            <h2 className="type-h2 text-ui-content-primary">{text('সুরক্ষা, গোপনীয়তা ও দায়িত্বশীল প্রতিবেদন', 'Safety, privacy, and responsible reporting')}</h2>
            <p className="type-body text-ui-content-secondary">
              {text(
                'যতটুকু তথ্য ঘটনা বোঝার জন্য প্রয়োজন, ততটুকুই দিন। অপ্রয়োজনীয় ব্যক্তিগত তথ্য, গোপন নথি বা অনুমতি ছাড়া সংবেদনশীল তথ্য প্রকাশ করবেন না।',
                'Provide only the information needed to understand the incident. Avoid unnecessary personal data, confidential documents, or sensitive information you are not entitled to share.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: Lock, bn: 'অপ্রয়োজনীয় পরিচয় নয়', en: 'Avoid unnecessary identity data', dbn: 'নাম, ফোন, ঠিকানা বা পরিচয়সংক্রান্ত তথ্য শুধু প্রয়োজন হলে দিন।', den: 'Include names, phones, addresses, or identity details only when relevant.' },
              { icon: Users, bn: 'ব্যক্তি/প্রতিষ্ঠানের তথ্য ঐচ্ছিক', en: 'People and organization details are optional', dbn: 'ঘুষ, জননিরাপত্তা, সড়ক বা দখলসহ যেসব ঘটনায় ব্যক্তি বা প্রতিষ্ঠানের তথ্য সহায়ক, জানা থাকলে দিন; অনুমান করে লিখবেন না।', den: 'Where people or organization details are useful, add them only when known. Do not guess identities.' },
              { icon: Shield, bn: 'সংবেদনশীল অভিযোগে বাড়তি সতর্কতা', en: 'Extra care for sensitive reports', dbn: 'হয়রানি, সহিংসতা, মব সহিংসতা, ব্যক্তিগত জমি দখলসহ সংবেদনশীল বিষয়ে ব্যক্তিগত নিরাপত্তা ও গোপনীয়তা অগ্রাধিকার পায়।', den: 'Privacy and personal safety receive extra attention for harassment, violence, mob violence, private-property, and other sensitive reports.' },
              { icon: AlertTriangle, bn: 'জরুরি বিপদে প্ল্যাটফর্মের ওপর নির্ভর করবেন না', en: 'Do not rely on the platform during emergencies', dbn: 'তাৎক্ষণিক বিপদ, চিকিৎসা, পুলিশ বা অগ্নিনির্বাপণ সহায়তার জন্য উপযুক্ত জরুরি সেবায় যোগাযোগ করুন।', den: 'For immediate danger, medical emergencies, police, or fire response, contact the appropriate emergency service.' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.en} className="p-4 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-ui-accent shrink-0" aria-hidden="true" />
                    <h3 className="type-h4 text-ui-content-primary">{language === 'bn' ? item.bn : item.en}</h3>
                  </div>
                  <p className="type-meta text-ui-content-secondary">{language === 'bn' ? item.dbn : item.den}</p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'support' && (
        <section className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-5 md:p-7 space-y-5 shadow-2xs">
          <div className="space-y-2">
            <h2 className="type-h2 text-ui-content-primary">{text('জরুরি ও নাগরিক সহায়তা', 'Emergency & civic support')}</h2>
            <p className="type-body text-ui-content-secondary">
              {text(
                'সবাইকে জানাও জরুরি প্রতিক্রিয়া সেবা নয়। প্রয়োজন অনুযায়ী নিচের সরকারি বা বিশেষায়িত সহায়তা নম্বর ব্যবহার করুন।',
                'Sobaike Janao is not an emergency-response service. Use the appropriate public or specialist helpline when immediate assistance is required.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BANGLADESH_HELPLINES.map((item) => (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                className="p-4 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle flex items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <div className="w-10 h-10 shrink-0 rounded-xl bg-ui-surface border border-ui-stroke-subtle flex items-center justify-center text-ui-accent">
                  <Phone className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="type-h4 text-ui-content-primary">{language === 'bn' ? item.labelBn : item.labelEn}</h3>
                    <span className="type-h4 text-ui-accent shrink-0">{item.number}</span>
                  </div>
                  <p className="type-meta text-ui-content-secondary mt-1">{language === 'bn' ? item.descBn : item.descEn}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'faq' && (
        <section className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-5 md:p-7 space-y-4 shadow-2xs">
          <div className="space-y-2">
            <h2 className="type-h2 text-ui-content-primary">{text('সাধারণ প্রশ্ন', 'Frequently asked questions')}</h2>
            <p className="type-body text-ui-content-secondary">{text('বর্তমান রিপোর্টিং ব্যবস্থা সম্পর্কে সংক্ষিপ্ত উত্তর।', 'Quick answers about the current reporting system.')}</p>
          </div>

          <Accordion
            isOpen={openFaqId === 'faq-1'}
            onToggle={() => toggleFaq('faq-1')}
            title={text('১. এখানে কী ধরনের বিষয় জানানো যায়?', '1. What can I report here?')}
          >
            <p className="type-meta text-ui-content-secondary">
              {text(
                'বর্তমানে ৭টি সক্রিয় বিষয় রয়েছে: হয়রানি ও নির্যাতন, চাঁদাবাজি ও ঘুষ, জননিরাপত্তা, সড়ক ও যাতায়াত সমস্যা, ইউটিলিটি সমস্যা, অবৈধ দখল এবং অবৈধ অটো চার্জিং। প্রতিটি বিষয়ের নিজস্ব সাবক্যাটাগরি রয়েছে।',
                'There are currently 7 active issue categories: Harassment & Abuse, Extortion & Bribery, Public Safety, Road & Transport Issues, Utility Issues, Illegal Occupation, and Illegal Auto-Rickshaw Charging. Each has its own subcategories.'
              )}
            </p>
          </Accordion>

          <Accordion
            isOpen={openFaqId === 'faq-2'}
            onToggle={() => toggleFaq('faq-2')}
            title={text('২. জমা দিলেই কি প্রতিবেদন প্রকাশিত হয়?', '2. Is a report published immediately after submission?')}
          >
            <p className="type-meta text-ui-content-secondary">
              {text('না। জমা দেওয়া প্রতিবেদন পর্যালোচনা ও প্রয়োজনীয় মডারেশনের পর অনুমোদিত হলে প্রকাশিত হয়।', 'No. A submitted report is reviewed and moderated before an approved report is published.')}
            </p>
          </Accordion>

          <Accordion
            isOpen={openFaqId === 'faq-3'}
            onToggle={() => toggleFaq('faq-3')}
            title={text('৩. ব্যক্তি বা প্রতিষ্ঠানের নাম জানা না থাকলে?', '3. What if I do not know a person or organization name?')}
          >
            <p className="type-meta text-ui-content-secondary">
              {text('নাম জানা বাধ্যতামূলক নয়। যেখানে এই তথ্য ঐচ্ছিক, সেখানে পরিচিত বিবরণ, প্রতিষ্ঠান, যানবাহন বা অন্য শনাক্তকারী তথ্য জানা থাকলে দিন; অনুমান করবেন না।', 'A name is not required where party information is optional. Add known descriptions, organization, vehicle, or other identifiers when useful, but do not guess.')}
            </p>
          </Accordion>

          <Accordion
            isOpen={openFaqId === 'faq-4'}
            onToggle={() => toggleFaq('faq-4')}
            title={text('৪. জরুরি ঘটনার জন্য কি এখানে প্রতিবেদন করব?', '4. Should I use this for an emergency?')}
          >
            <p className="type-meta text-ui-content-secondary">
              {text('তাৎক্ষণিক বিপদ বা জরুরি সহায়তার জন্য প্রথমে সংশ্লিষ্ট জরুরি সেবায় যোগাযোগ করুন। এই প্ল্যাটফর্ম জরুরি প্রতিক্রিয়া সেবা নয়।', 'For immediate danger or urgent assistance, contact the appropriate emergency service first. This platform is not an emergency-response service.')}
            </p>
          </Accordion>

          <Accordion
            isOpen={openFaqId === 'faq-5'}
            onToggle={() => toggleFaq('faq-5')}
            title={text('৫. লোকেশন কেন প্রয়োজন?', '5. Why is location needed?')}
          >
            <p className="type-meta text-ui-content-secondary">
              {text('লোকেশন প্রতিবেদনকে এলাকা অনুযায়ী খুঁজতে, ফিল্টার করতে, ম্যাপে দেখতে এবং একই এলাকার সমস্যা বোঝাতে সহায়তা করে।', 'Location helps users search, filter, map, and understand reports by area.')}
            </p>
          </Accordion>
        </section>
      )}
    </PublicPageContainer>
  );
};
