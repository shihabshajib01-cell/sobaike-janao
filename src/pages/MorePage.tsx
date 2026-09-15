import React, { useState } from 'react';
import { 
  Phone, 
  Shield, 
  Scale, 
  Info, 
  HelpCircle, 
  Palette, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  MapPin, 
  UserCheck, 
  Users, 
  Lock, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Building2,
  FileSearch,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BANGLADESH_HELPLINES } from '../data/reportOptions';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { Accordion } from '../components/ui/Accordion';

export const MorePage: React.FC = () => {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<'about' | 'guide' | 'helplines' | 'principles' | 'response' | 'faq'>('about');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <PublicPageContainer id="more-page-container">
      {/* Page Header */}
      <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-5 md:p-7 space-y-4 shadow-2xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ui-surface-subtle border border-ui-stroke-subtle text-[13px] font-medium text-ui-content-secondary">
            <Info className="w-3.5 h-3.5 text-ui-accent" />
            <span>{language === 'bn' ? 'ব্যবহারকারী নির্দেশিকা ও জ্ঞান কেন্দ্র' : 'User Guide & Knowledge Hub'}</span>
          </div>
          <h1 className="text-[28px] md:text-[32px] leading-[38px] md:leading-[42px] font-bold text-ui-content-primary tracking-tight">
            {language === 'bn' ? 'তথ্য ও সহায়তা' : 'Information & Support'}
          </h1>
          <p className="text-[15px] md:text-[16px] leading-[24px] text-ui-content-secondary max-w-3xl">
            {language === 'bn'
              ? 'সবাইকে জানাও প্ল্যাটফর্মের উদ্দেশ্য, পরিচালনা পদ্ধতি, প্রতিবেদন করার নিয়মকানুন, গোপনীয়তা নীতি এবং জরুরি সহায়তার সম্পূর্ণ নির্দেশিকা।'
              : 'Complete guide to Sobaike Janao\'s purpose, reporting workflows, privacy policies, moderation standards, and emergency resources.'}
          </p>
        </div>

        {/* Mobile-Only Appearance / Theme Setting Card (md:hidden) */}
        <div className="pt-3 border-t border-ui-stroke-subtle md:hidden space-y-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-ui-content-muted" aria-hidden="true" />
            <p className="text-[14px] font-semibold text-ui-content-secondary">
              {language === 'bn' ? 'প্রদর্শন' : 'Appearance'}
            </p>
          </div>
          <ThemeSelector variant="segmented" />
        </div>

        {/* Tab Navigation */}
        <div
          aria-label={language === 'bn' ? 'তথ্য ও সহায়তা বিভাগ' : 'Information and support sections'}
          className="flex items-center gap-2 pt-2 border-t border-ui-stroke-subtle overflow-x-auto pb-1 no-scrollbar"
        >
          <button
            aria-pressed={activeTab === 'about'}
            type="button"
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2.5 rounded-xl text-[15px] leading-[22px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              activeTab === 'about'
                ? 'bg-ui-action-bg text-ui-action-text font-bold shadow-2xs'
                : 'bg-ui-surface-subtle text-ui-content-secondary border border-ui-stroke-subtle hover:bg-ui-surface'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>{language === 'bn' ? 'সম্পর্কে' : 'About'}</span>
          </button>

          <button
            aria-pressed={activeTab === 'guide'}
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2.5 rounded-xl text-[15px] leading-[22px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              activeTab === 'guide'
                ? 'bg-ui-action-bg text-ui-action-text font-bold shadow-2xs'
                : 'bg-ui-surface-subtle text-ui-content-secondary border border-ui-stroke-subtle hover:bg-ui-surface'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{language === 'bn' ? 'ব্যবহার নির্দেশিকা' : 'User Guide'}</span>
          </button>

          <button
            aria-pressed={activeTab === 'helplines'}
            type="button"
            onClick={() => setActiveTab('helplines')}
            className={`px-4 py-2.5 rounded-xl text-[15px] leading-[22px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              activeTab === 'helplines'
                ? 'bg-ui-action-bg text-ui-action-text font-bold shadow-2xs'
                : 'bg-ui-surface-subtle text-ui-content-secondary border border-ui-stroke-subtle hover:bg-ui-surface'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>{language === 'bn' ? 'সহায়তা' : 'Support'}</span>
          </button>

          <button
            aria-pressed={activeTab === 'principles'}
            type="button"
            onClick={() => setActiveTab('principles')}
            className={`px-4 py-2.5 rounded-xl text-[15px] leading-[22px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              activeTab === 'principles'
                ? 'bg-ui-action-bg text-ui-action-text font-bold shadow-2xs'
                : 'bg-ui-surface-subtle text-ui-content-secondary border border-ui-stroke-subtle hover:bg-ui-surface'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{language === 'bn' ? 'সুরক্ষা ও গোপনীয়তা' : 'Privacy & Safety'}</span>
          </button>

          <button
            aria-pressed={activeTab === 'response'}
            type="button"
            onClick={() => setActiveTab('response')}
            className={`px-4 py-2.5 rounded-xl text-[15px] leading-[22px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              activeTab === 'response'
                ? 'bg-ui-action-bg text-ui-action-text font-bold shadow-2xs'
                : 'bg-ui-surface-subtle text-ui-content-secondary border border-ui-stroke-subtle hover:bg-ui-surface'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{language === 'bn' ? 'প্রতিউত্তর ও অংশগ্রহণ' : 'Response & Participation'}</span>
          </button>

          <button
            aria-pressed={activeTab === 'faq'}
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2.5 rounded-xl text-[15px] leading-[22px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              activeTab === 'faq'
                ? 'bg-ui-action-bg text-ui-action-text font-bold shadow-2xs'
                : 'bg-ui-surface-subtle text-ui-content-secondary border border-ui-stroke-subtle hover:bg-ui-surface'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{language === 'bn' ? 'সাধারণ প্রশ্ন (FAQ)' : 'FAQ'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: সম্পর্কে (ABOUT) */}
      {/* ========================================================= */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
            <div className="space-y-3">
              <h2 className="text-[22px] md:text-[24px] leading-[32px] font-bold text-ui-content-primary">
                {language === 'bn' ? 'সবাইকে জানাও কী?' : 'What is Sobaike Janao?'}
              </h2>
              <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                {language === 'bn'
                  ? 'সবাইকে জানাও একটি স্বাধীন নাগরিক তথ্য ও জনস্বার্থ প্ল্যাটফর্ম। এখানে নাগরিকরা জনস্বার্থসংশ্লিষ্ট ঘটনা, সমস্যা ও অভিজ্ঞতা কাঠামোবদ্ধভাবে জানাতে পারেন। জমা দেওয়া প্রতিবেদন সরাসরি প্রকাশিত হয় না; প্রকাশের আগে তা পর্যালোচনা করা হয়।'
                  : 'Sobaike Janao is an independent citizen information and public-interest reporting platform. It gives citizens a structured place to report public-interest incidents, document what happened, provide relevant context, and make suitable information visible after review.'}
              </p>
            </div>

            {/* Crucial Positionings Callout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 bg-ui-warning-bg border border-ui-warning-border rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-ui-warning-text font-bold text-[16px]">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>{language === 'bn' ? 'এটি কোনো সরকারি ওয়েবসাইট নয়' : 'Not a Government Website'}</span>
                </div>
                <p className="text-[14px] leading-[22px] text-ui-content-secondary">
                  {language === 'bn'
                    ? 'সবাইকে জানাও কোনো সরকারি বা রাষ্ট্রীয় প্রতিষ্ঠান নয়। আমাদের কোনো সরকারি অনুমোদন, সিলমোহর বা দাপ্তরিক কর্তৃত্ব নেই।'
                    : 'Sobaike Janao is not a government portal, agency, or ministry. We have no official endorsement, seals, or administrative authority.'}
                </p>
              </div>

              <div className="p-5 bg-ui-info-bg border border-ui-info-border rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-ui-info-text font-bold text-[16px]">
                  <Scale className="w-5 h-5 shrink-0" />
                  <span>{language === 'bn' ? 'আইন প্রয়োগকারী সংস্থা নয়' : 'Not Law Enforcement or Court'}</span>
                </div>
                <p className="text-[14px] leading-[22px] text-ui-content-secondary">
                  {language === 'bn'
                    ? 'এটি পুলিশ স্টেশন, আদালত বা নিয়ন্ত্রণকারী সংস্থা নয়। এখানে প্রতিবেদন করা মানে জিডি বা মামলা করা বা বিচার চাওয়া নয়।'
                    : 'Filing a report here is not a police complaint, GD, case, or regulatory investigation. We do not arrest, prosecute, or adjudicate.'}
                </p>
              </div>
            </div>

            {/* Publication notice */}
            <div className="p-5 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl space-y-2">
              <h3 className="text-[18px] leading-[26px] font-bold text-ui-content-primary flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-ui-warning-text shrink-0" />
                <span>{language === 'bn' ? 'প্রকাশিত প্রতিবেদন ও আইনি অবস্থান' : 'Published Reports & Legal Position'}</span>
              </h3>
              <p className="text-[16px] leading-[26px] text-ui-content-secondary font-medium">
                {language === 'bn'
                  ? '“প্রকাশিত প্রতিবেদন কোনো ব্যক্তি বা প্রতিষ্ঠানকে আইনগতভাবে দোষী প্রমাণ করে না।”'
                  : '"A published report does not legally prove guilt of any person or organization."'}
              </p>
              <p className="text-[14px] leading-[22px] text-ui-content-muted">
                {language === 'bn'
                  ? 'প্রকাশিত তথ্যগুলো নাগরিক জমা দেওয়া এবং পর্যালোচিত তথ্য। প্ল্যাটফর্মের কাজ জনস্বার্থে তথ্য দৃশ্যমান করা এবং নাগরিক অংশগ্রহণ উৎসাহিত করা—কোনো বিচারিক রায় দেওয়া বা অপরাধী সাব্যস্ত করা নয়।'
                  : 'Published items represent citizen-submitted and reviewed information. Our role is public-interest visibility and citizen participation—not judicial findings or criminal convictions.'}
              </p>
            </div>

            {/* Active Categories */}
            <div className="space-y-4 pt-4 border-t border-ui-stroke-subtle">
              <h3 className="text-[18px] leading-[26px] font-bold text-ui-content-primary">
                {language === 'bn' ? 'বর্তমান সক্রিয় ক্যাটাগরি ও সেবা' : 'Currently Active Categories & Services'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
                  <span className="inline-block px-2.5 py-1 rounded-md text-[13px] font-bold bg-[var(--sec-harassment-bg)] text-[var(--sec-harassment-text)] border border-[var(--sec-harassment-border)]">
                    {language === 'bn' ? 'হয়রানি' : 'Harassment'}
                  </span>
                  <h4 className="text-[16px] font-bold text-ui-content-primary">
                    {language === 'bn' ? 'হয়রানি ও নির্যাতন' : 'Harassment & Abuse'}
                  </h4>
                  <p className="text-[14px] leading-[22px] text-ui-content-secondary">
                    {language === 'bn' ? 'শারীরিক বা মানসিক নির্যাতন, নিপীড়ন ও হয়রানির ঘটনা।' : 'Report safety violations, abuse, or harassment incidents.'}
                  </p>
                </div>

                <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
                  <span className="inline-block px-2.5 py-1 rounded-md text-[13px] font-bold bg-[var(--sec-rickshaw-bg)] text-[var(--sec-rickshaw-text)] border border-[var(--sec-rickshaw-border)]">
                    {language === 'bn' ? 'অটো চার্জিং' : 'Auto-Charging'}
                  </span>
                  <h4 className="text-[16px] font-bold text-ui-content-primary">
                    {language === 'bn' ? 'অবৈধ অটো চার্জিং' : 'Illegal Auto Charging'}
                  </h4>
                  <p className="text-[14px] leading-[22px] text-ui-content-secondary">
                    {language === 'bn' ? 'ঝুঁকিপূর্ণ ও অবৈধ অটো-রিকশা চার্জিং স্টেশনের তথ্য।' : 'Report unsafe and illegal charging station locations.'}
                  </p>
                </div>

                <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
                  <span className="inline-block px-2.5 py-1 rounded-md text-[13px] font-bold bg-[var(--sec-extortion-bg)] text-[var(--sec-extortion-text)] border border-[var(--sec-extortion-border)]">
                    {language === 'bn' ? 'চাঁদাবাজি' : 'Extortion'}
                  </span>
                  <h4 className="text-[16px] font-bold text-ui-content-primary">
                    {language === 'bn' ? 'চাঁদাবাজি ও জোরপূর্বক আদায়' : 'Extortion & Coercion'}
                  </h4>
                  <p className="text-[14px] leading-[22px] text-ui-content-secondary">
                    {language === 'bn' ? 'অবৈধ চাঁদা দাবি, হুমকি ও বলপ্রয়োগের তথ্য।' : 'Report illegal tolls, extortion demands, and coercion.'}
                  </p>
                </div>

                <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
                  <span className="inline-block px-2.5 py-1 rounded-md text-[13px] font-bold bg-ui-warning-bg text-ui-warning-text border border-ui-warning-border">
                    {language === 'bn' ? 'ইউটিলিটি' : 'Utility'}
                  </span>
                  <h4 className="text-[16px] font-bold text-ui-content-primary">
                    {language === 'bn' ? 'ইউটিলিটি ও বিদ্যুৎ সমস্যা' : 'Utility & Load Shedding'}
                  </h4>
                  <p className="text-[14px] leading-[22px] text-ui-content-secondary">
                    {language === 'bn' ? 'দীর্ঘ লোডশেডিং, গ্যাস সংকট বা অতিরিক্ত বিদ্যুৎ বিল।' : 'Report load shedding, gas shortages, or billing issues.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ব্যবহার নির্দেশিকা (USER GUIDE) */}
      {/* ========================================================= */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
            <div className="space-y-2">
              <h2 className="text-[22px] md:text-[24px] leading-[32px] font-bold text-ui-content-primary flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-ui-accent" />
                <span>{language === 'bn' ? 'প্রতিবেদন করার ধাপসমূহ' : 'Step-by-Step Reporting Guide'}</span>
              </h2>
              <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                {language === 'bn'
                  ? 'সহজ ও কাঠামোবদ্ধ প্রক্রিয়ায় আপনার তথ্য জমা দেওয়ার সম্পূর্ণ নির্দেশিকা।'
                  : 'Follow these straightforward steps to submit structured and useful information.'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl space-y-2">
                <div className="flex items-center gap-3">
                  <p className="w-8 h-8 rounded-lg bg-ui-accent text-ui-content-inverse flex items-center justify-center font-bold text-[15px]">১</p>
                  <h3 className="text-[18px] font-bold text-ui-content-primary">
                    {language === 'bn' ? 'সেবা বা ক্যাটাগরি নির্বাচন' : 'Choose Category'}
                  </h3>
                </div>
                <p className="text-[15px] leading-[24px] text-ui-content-secondary pl-11">
                  {language === 'bn'
                    ? 'হোমপেজ বা মেনু থেকে উপযুক্ত সমস্যা বা সেবাটি বেছে নিন (যেমন: হয়রানি, অবৈধ অটো চার্জিং, চাঁদাবাজি বা ইউটিলিটি সমস্যা)।'
                    : 'Select the relevant category from the homepage or navigation menu that matches the incident.'}
                </p>
              </div>

              <div className="p-5 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl space-y-2">
                <div className="flex items-center gap-3">
                  <p className="w-8 h-8 rounded-lg bg-ui-accent text-ui-content-inverse flex items-center justify-center font-bold text-[15px]">২</p>
                  <h3 className="text-[18px] font-bold text-ui-content-primary">
                    {language === 'bn' ? 'ঘটনার ধরন ও বিবরণ দিন' : 'Provide Details & Context'}
                  </h3>
                </div>
                <p className="text-[15px] leading-[24px] text-ui-content-secondary pl-11">
                  {language === 'bn'
                    ? 'ঘটনার সুনির্দিষ্ট শিরোনাম, বিস্তারিত বিবরণ, তারিখ ও সময় প্রদান করুন। ক্যাটাগরি অনুযায়ী নির্দিষ্ট প্রশ্ন বা বিলের তথ্য থাকলে তা পূরণ করুন।'
                    : 'Provide a clear title, detailed description, date, and time. Fill in category-specific fields (such as electricity billing info where required).'}
                </p>
              </div>

              <div className="p-5 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl space-y-2">
                <div className="flex items-center gap-3">
                  <p className="w-8 h-8 rounded-lg bg-ui-accent text-ui-content-inverse flex items-center justify-center font-bold text-[15px]">৩</p>
                  <h3 className="text-[18px] font-bold text-ui-content-primary">
                    {language === 'bn' ? 'অবস্থান নির্ধারণ করুন' : 'Specify Incident Location'}
                  </h3>
                </div>
                <p className="text-[15px] leading-[24px] text-ui-content-secondary pl-11">
                  {language === 'bn'
                    ? 'ঘটনাটি কোথায় ঘটেছে তার বিভাগ, জেলা, উপজেলা/থানা এবং সুনির্দিষ্ট ঠিকানা উল্লেখ করুন। মানচিত্র থেকেও অবস্থান চিহ্নিত করা যায়।'
                    : 'Select the division, district, upazila/thana, and exact address where the incident took place. You can also pin it on the map.'}
                </p>
              </div>

              <div className="p-5 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl space-y-2">
                <div className="flex items-center gap-3">
                  <p className="w-8 h-8 rounded-lg bg-ui-accent text-ui-content-inverse flex items-center justify-center font-bold text-[15px]">৪</p>
                  <h3 className="text-[18px] font-bold text-ui-content-primary">
                    {language === 'bn' ? 'প্রমাণ বা ছবি যুক্ত করুন (ঐচ্ছিক)' : 'Attach Evidence (Optional)'}
                  </h3>
                </div>
                <p className="text-[15px] leading-[24px] text-ui-content-secondary pl-11">
                  {language === 'bn'
                    ? 'যদি আপনার কাছে প্রাসঙ্গিক ছবি বা প্রমাণ থাকে তবে তা আপলোড করুন। গোপনীয়তা রক্ষার্থে অপ্রয়োজনীয় ব্যক্তিগত ছবি দেওয়া থেকে বিরত থাকুন।'
                    : 'Upload relevant supporting images or evidence if available. Avoid uploading unnecessary private personal photos.'}
                </p>
              </div>

              <div className="p-5 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl space-y-2">
                <div className="flex items-center gap-3">
                  <p className="w-8 h-8 rounded-lg bg-ui-accent text-ui-content-inverse flex items-center justify-center font-bold text-[15px]">৫</p>
                  <h3 className="text-[18px] font-bold text-ui-content-primary">
                    {language === 'bn' ? 'যাচাই ও জমা দিন' : 'Review & Submit'}
                  </h3>
                </div>
                <p className="text-[15px] leading-[24px] text-ui-content-secondary pl-11">
                  {language === 'bn'
                    ? 'রিভিউ ধাপে সমস্ত তথ্য একবার দেখে নিন। প্রয়োজনে এডিট করে সংশোধন করুন এবং চূড়ান্ত জমা দিন। সফল জমার পর একটি রেফারেন্স আইডি দেওয়া হবে।'
                    : 'Review all entered information on the summary screen. Edit if needed, then submit. A reference ID will be provided upon success.'}
                </p>
              </div>
            </div>

            {/* Draft & Good Report tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-ui-stroke-subtle">
              <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
                <h4 className="text-[16px] font-bold text-ui-content-primary flex items-center gap-2">
                  <Clock className="w-4 h-4 text-ui-accent" />
                  <span>{language === 'bn' ? 'ড্রাফট ও অসমাপ্ত প্রতিবেদন' : 'Drafts & Resuming'}</span>
                </h4>
                <p className="text-[14px] leading-[22px] text-ui-content-secondary">
                  {language === 'bn'
                    ? 'আপনার ব্রাউজারে অসমাপ্ত প্রতিবেদন স্বয়ংক্রিয়ভাবে সংরক্ষিত হতে পারে, যা পরবর্তীতে পুনরায় চালু করা সম্ভব। তবে এটি ডিভাইস বা ব্রাউজার পরিবর্তনের সাথে সিঙ্ক হয় না।'
                    : 'Unfinished reports may be saved locally in your browser so you can resume later. Drafts are not permanently synced across different devices.'}
                </p>
              </div>

              <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
                <h4 className="text-[16px] font-bold text-ui-content-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-ui-accent" />
                  <span>{language === 'bn' ? 'কার্যকর প্রতিবেদন লেখার টিপস' : 'Tips for a Good Report'}</span>
                </h4>
                <p className="text-[14px] leading-[22px] text-ui-content-secondary">
                  {language === 'bn'
                    ? 'সুনির্দিষ্ট তথ্য দিন, অনুমানের ওপর ভিত্তি করে কথা বলবেন না, শালীন ভাষা ব্যবহার করুন এবং ঘটনাস্থলের সঠিক সময় ও স্থান উল্লেখ করুন।'
                    : 'Be factual and specific, avoid unverified assumptions, maintain respectful language, and provide accurate time and location.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: সহায়তা (SUPPORT & HELPLINES) */}
      {/* ========================================================= */}
      {activeTab === 'helplines' && (
        <div className="space-y-6">
          <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
            <div className="p-5 bg-ui-error-bg border border-ui-error-border rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-ui-error-text font-bold text-[18px]">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <span>{language === 'bn' ? 'জরুরি পরিস্থিতিতে কী করবেন?' : 'What to Do in an Emergency'}</span>
              </div>
              <p className="text-[15px] leading-[24px] text-ui-content-secondary">
                {language === 'bn'
                  ? '“সবাইকে জানাও জরুরি প্রতিক্রিয়া সেবা নয়।” তাৎক্ষণিক বিপদে বা জরুরি আইনগত সহায়তার জন্য এখানে প্রতিবেদন দিয়ে অপেক্ষা না করে সরাসরি উপযুক্ত সরকারি জরুরি সেবায় যোগাযোগ করুন।'
                  : '"Sobaike Janao is not an emergency response service." In immediate danger or urgent distress, contact official emergency services directly rather than waiting for publication.'}
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-[20px] leading-[30px] font-bold text-ui-content-primary flex items-center gap-2">
                <Phone className="w-5 h-5 text-ui-accent" />
                <span>{language === 'bn' ? 'জরুরি ও সরকারি সহায়তা নম্বরসমূহ' : 'Official Emergency & Support Hotlines'}</span>
              </h2>
              <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                {language === 'bn'
                  ? 'বাংলাদেশের জরুরি ও হেল্পলাইন নম্বরগুলোতে সরাসরি কল করতে নিচের বাটনগুলো ব্যবহার করুন।'
                  : 'Tap below to quickly call verified national helplines in Bangladesh.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BANGLADESH_HELPLINES.map((hl) => (
                <div
                  key={hl.number}
                  className="bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl p-5 flex items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1 min-w-0">
                    <span className="text-[14px] text-ui-content-secondary font-medium">
                      {language === 'bn' ? hl.labelBn : hl.labelEn}
                    </span>
                    <div className="text-[24px] leading-tight font-mono font-bold text-ui-content-primary">{hl.number}</div>
                    <span className="text-[14px] text-ui-content-muted block truncate">
                      {language === 'bn' ? hl.descBn : hl.descEn}
                    </span>
                  </div>
                  <a
                    href={`tel:${hl.number}`}
                    className="btn-primary-action px-5 py-2.5 rounded-xl text-[16px] font-semibold flex items-center gap-2 shrink-0 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
                  >
                    <Phone className="w-4 h-4" aria-hidden="true" />
                    <span>{language === 'bn' ? 'কল করুন' : 'Call'}</span>
                  </a>
                </div>
              ))}
            </div>

            {/* Platform vs Official comparison */}
            <div className="space-y-4 pt-6 border-t border-ui-stroke-subtle">
              <h3 className="text-[18px] leading-[26px] font-bold text-ui-content-primary">
                {language === 'bn' ? 'সবাইকে জানাও বনাম সরকারি/আইনি প্রক্রিয়া' : 'Sobaike Janao vs. Official Legal Process'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
                  <h4 className="text-[16px] font-bold text-ui-content-primary">
                    {language === 'bn' ? 'সবাইকে জানাও প্ল্যাটফর্ম' : 'Sobaike Janao Platform'}
                  </h4>
                  <ul className="space-y-1.5 text-[14px] leading-[22px] text-ui-content-secondary list-disc pl-4">
                    <li>{language === 'bn' ? 'স্বাধীন নাগরিক তথ্য প্ল্যাটফর্ম' : 'Independent citizen info platform'}</li>
                    <li>{language === 'bn' ? 'জনস্বার্থে প্রতিবেদন প্রকাশ ও পর্যালোচনা' : 'Public interest reporting & review'}</li>
                    <li>{language === 'bn' ? 'নাগরিক অংশগ্রহণ ও সচেতনতা বৃদ্ধি' : 'Citizen participation & awareness'}</li>
                  </ul>
                </div>

                <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
                  <h4 className="text-[16px] font-bold text-ui-content-primary">
                    {language === 'bn' ? 'সরকারি / আইনি প্রক্রিয়া' : 'Official / Legal Process'}
                  </h4>
                  <ul className="space-y-1.5 text-[14px] leading-[22px] text-ui-content-secondary list-disc pl-4">
                    <li>{language === 'bn' ? 'থানা, পুলিশ বা আদালতে জিডি/মামলা' : 'Police GD, formal case, or court filing'}</li>
                    <li>{language === 'bn' ? 'আইনশৃঙ্খলা রক্ষাকারী বাহিনীর তদন্ত' : 'Official law enforcement investigation'}</li>
                    <li>{language === 'bn' ? 'আইনি প্রতিকার ও বিচারিক ব্যবস্থা' : 'Legal enforcement & adjudication'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: সুরক্ষা ও গোপনীয়তা (PRIVACY & SAFETY) */}
      {/* ========================================================= */}
      {activeTab === 'principles' && (
        <div className="space-y-6">
          <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
            <div className="space-y-2">
              <h2 className="text-[22px] md:text-[24px] leading-[32px] font-bold text-ui-content-primary flex items-center gap-2">
                <Shield className="w-6 h-6 text-ui-accent" />
                <span>{language === 'bn' ? 'সুরক্ষা, গোপনীয়তা ও মডারেশন নীতি' : 'Privacy, Safety & Moderation Policy'}</span>
              </h2>
              <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                {language === 'bn'
                  ? 'নাগরিকদের ব্যক্তিগত গোপনীয়তা রক্ষা এবং মানসম্মত তথ্য প্রকাশে আমাদের সুনির্দিষ্ট নীতিমালা।'
                  : 'Our standards for protecting complainant privacy, managing evidence, and reviewing reports.'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
                <h3 className="text-[18px] leading-[26px] font-bold text-ui-content-primary flex items-center gap-2">
                  <Lock className="w-5 h-5 text-ui-accent" />
                  <span>{language === 'bn' ? '১. প্রতিবেদকের পরিচয় ও গোপনীয়তা' : '1. Complainant Privacy'}</span>
                </h3>
                <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                  {language === 'bn'
                    ? '“প্রতিবেদকের পরিচয় জনসমক্ষে দেখানোর জন্য নয়।” অভিযোগকারীর নাম, ফোন নম্বর বা ব্যক্তিগত যোগাযোগের তথ্য জনসমক্ষে প্রকাশ করা হয় না। এই তথ্যগুলো শুধুমাত্র সম্পাদকীয় যোগাযোগ বা ফলোআপের জন্য সংরক্ষিত থাকে (যেখানে প্রযোজ্য)।'
                    : '"Complainant identity is not for public display." Personal contact details and names are kept private and are never published publicly.'}
                </p>
              </div>

              <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
                <h3 className="text-[18px] leading-[26px] font-bold text-ui-content-primary flex items-center gap-2">
                  <FileText className="w-5 h-5 text-ui-accent" />
                  <span>{language === 'bn' ? '২. প্রমাণ ও ছবি সংক্রান্ত নীতি' : '2. Evidence & Image Policy'}</span>
                </h3>
                <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                  {language === 'bn'
                    ? 'জমা দেওয়া ছবি বা প্রমাণ প্রতিবেদন বুঝতে সাহায্য করে। তবে সব জমাকৃত প্রমাণ স্বয়ংক্রিয়ভাবে প্রকাশ পায় না; মডারেশনের পর শুধুমাত্র উপযুক্ত ও জনস্বার্থমূলক প্রমাণ দৃশ্যমান করা হয়। অপ্রয়োজনীয় ব্যক্তিগত ছবি আপলোড করা থেকে বিরত থাকুন।'
                    : 'Submitted evidence helps reviewers understand context. Not all uploaded evidence is published publicly; only appropriate materials pass review.'}
                </p>
              </div>

              <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
                <h3 className="text-[18px] leading-[26px] font-bold text-ui-content-primary flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-ui-accent" />
                  <span>{language === 'bn' ? '৩. লোকেশন বা অবস্থান নীতি' : '3. Location Privacy'}</span>
                </h3>
                <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                  {language === 'bn'
                    ? 'বর্তমান ডিভাইস লোকেশন (ব্রাউজার/জিপিএস অনুমতি সাপেক্ষে) শুধুমাত্র নিকটস্থ তথ্য বা মানচিত্র কেন্দ্রিক অভিজ্ঞতার জন্য ব্যবহৃত হতে পারে। অন্যদিকে, \'ঘটনার লোকেশন\' হলো সেই স্থান যেখানে রিপোর্টেড সমস্যাটি ঘটেছে—এই দুটি সম্পূর্ণ আলাদা।'
                    : 'Device location (when permitted) is used only for nearby context. This is strictly separate from the "incident location" where the reported event occurred.'}
                </p>
              </div>

              <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
                <h3 className="text-[18px] leading-[26px] font-bold text-ui-content-primary flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-ui-accent" />
                  <span>{language === 'bn' ? '৪. পর্যালোচনার মানদণ্ড ও সীমানা' : '4. Moderation Standards'}</span>
                </h3>
                <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                  {language === 'bn'
                    ? 'প্রতিটি প্রতিবেদন প্রকাশ পূর্বে প্রাসঙ্গিকতা, শালীনতা, গোপনীয়তা এবং সঠিকতা যাচাইয়ের জন্য পর্যালোচনা করা হয়। তবে মনে রাখবেন: “পর্যালোচনা মানেই অভিযোগের সত্যতা সম্পর্কে কোনো আইনি সিদ্ধান্ত বা তদন্ত নয়।”'
                    : 'Reports undergo review for relevance, civility, and safety before publication. Remember: "Review does not constitute legal verification or official investigation."'}
                </p>
              </div>

              <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
                <h3 className="text-[18px] leading-[26px] font-bold text-ui-content-primary flex items-center gap-2">
                  <Users className="w-5 h-5 text-ui-accent" />
                  <span>{language === 'bn' ? '৫. নাগরিক দায়িত্ব' : '5. Citizen Responsibility'}</span>
                </h3>
                <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                  {language === 'bn'
                    ? 'সদুপায়ে এবং বাস্তব তথ্যের ভিত্তিতে প্রতিবেদন করুন। জেনেশুনে মিথ্যা তথ্য ছড়ানো, ব্যক্তিগত আক্রোশ মেটানো বা মানহানিকর অপব্যবহার থেকে বিরত থাকুন।'
                    : 'Submit reports in good faith with truthful information. Avoid knowingly false statements, personal vendettas, or defamatory misuse.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: প্রতিউত্তর ও অংশগ্রহণ (RESPONSE & PARTICIPATION) */}
      {/* ========================================================= */}
      {activeTab === 'response' && (
        <div className="space-y-6">
          <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
            <div className="space-y-2">
              <h2 className="text-[22px] md:text-[24px] leading-[32px] font-bold text-ui-content-primary flex items-center gap-2">
                <Scale className="w-6 h-6 text-ui-accent" />
                <span>{language === 'bn' ? 'প্রতিউত্তর ও নাগরিক অংশগ্রহণের নিয়মাবলী' : 'Response & Participation Guidelines'}</span>
              </h2>
              <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                {language === 'bn'
                  ? 'প্রকাশিত প্রতিবেদনের বিষয়ে অতিরিক্ত তথ্য দেওয়া অথবা উল্লেখিত পক্ষ হিসেবে বক্তব্য পেশ করার সুযোগ।'
                  : 'How citizens can contribute additional details and how mentioned parties can submit responses.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-6 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-ui-accent-soft text-ui-accent flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-[18px] font-bold text-ui-content-primary">
                  {language === 'bn' ? 'আমার কাছে তথ্য আছে বা আমিও ভুক্তভোগী' : 'I Have Info or Am a Victim'}
                </h3>
                <p className="text-[15px] leading-[24px] text-ui-content-secondary">
                  {language === 'bn'
                    ? 'কোনো প্রকাশিত প্রতিবেদনের সাথে মিল রয়েছে এমন ঘটনা বা অতিরিক্ত তথ্য আপনার কাছে থাকলে আপনি "আমার কাছে তথ্য আছে" অপশনের মাধ্যমে তা যুক্ত করতে পারেন। পর্যালোচনার পর তা প্রাসঙ্গিক প্রতিবেদনে যুক্ত হয়।'
                    : 'If you have additional context or experienced a similar incident related to an existing report, use the contribution option to submit details for review.'}
                </p>
              </div>

              <div className="p-6 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-ui-accent-soft text-ui-accent flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="text-[18px] font-bold text-ui-content-primary">
                  {language === 'bn' ? 'আমি উল্লেখিত ব্যক্তি বা পক্ষ' : 'I Am the Mentioned Person or Party'}
                </h3>
                <p className="text-[15px] leading-[24px] text-ui-content-secondary">
                  {language === 'bn'
                    ? 'কোনো প্রতিবেদনে আপনার বা আপনার প্রতিষ্ঠানের নাম উল্লেখ থাকলে আপনি প্রতিউত্তর বা স্পষ্টীকরণ জমা দিতে পারেন। পর্যালোচনার পর তা সংশ্লিষ্ট প্রতিবেদনের নিচে প্রকাশিত হতে পারে।'
                    : 'If you or your organization are mentioned in a report, you may submit a clarification or response. Approved statements are displayed alongside the report.'}
                </p>
              </div>
            </div>

            {/* Information discovery guide */}
            <div className="space-y-4 pt-6 border-t border-ui-stroke-subtle">
              <h3 className="text-[18px] leading-[26px] font-bold text-ui-content-primary flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-ui-accent" />
                <span>{language === 'bn' ? 'তথ্য ও প্রতিবেদন অনুসন্ধানের উপায়' : 'How to Discover Information'}</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-1.5">
                  <h4 className="text-[16px] font-bold text-ui-content-primary">
                    {language === 'bn' ? 'মূলপাতা ও ক্যাটাগরি' : 'Home & Categories'}
                  </h4>
                  <p className="text-[14px] leading-[22px] text-ui-content-secondary">
                    {language === 'bn' ? 'সর্বশেষ প্রকাশিত প্রতিবেদন ও নির্দিষ্ট সেবা পেজ থেকে তথ্য ব্রাউজ করুন।' : 'Browse recent published reports and dedicated service feeds.'}
                  </p>
                </div>

                <div className="p-4 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-1.5">
                  <h4 className="text-[16px] font-bold text-ui-content-primary">
                    {language === 'bn' ? 'অনুসন্ধান (Search)' : 'Search'}
                  </h4>
                  <p className="text-[14px] leading-[22px] text-ui-content-secondary">
                    {language === 'bn' ? 'কীওয়ার্ড, জেলা বা শিরোনাম দিয়ে নির্দিষ্ট প্রতিবেদন খুঁজুন।' : 'Search reports instantly by keywords, districts, or titles.'}
                  </p>
                </div>

                <div className="p-4 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-1.5">
                  <h4 className="text-[16px] font-bold text-ui-content-primary">
                    {language === 'bn' ? 'এক্সপ্লোর ও ম্যাপ' : 'Explore & Map'}
                  </h4>
                  <p className="text-[14px] leading-[22px] text-ui-content-secondary">
                    {language === 'bn' ? 'ম্যাপ হিটম্যাপ ও জেলাভিত্তিক পরিসংখ্যা এবং টাইমলাইন দেখুন।' : 'Explore geographic heatmaps, district rankings, and UTC timeline analytics.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: সাধারণ প্রশ্ন (FAQ) */}
      {/* ========================================================= */}
      {activeTab === 'faq' && (
        <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
          <div className="space-y-2">
            <h2 className="text-[22px] md:text-[24px] leading-[32px] font-bold text-ui-content-primary flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-ui-accent" />
              <span>{language === 'bn' ? 'সাধারণ জিজ্ঞাসা ও প্রশ্নাবলী (FAQ)' : 'Frequently Asked Questions'}</span>
            </h2>
            <p className="text-[16px] leading-[26px] text-ui-content-secondary">
              {language === 'bn'
                ? 'প্ল্যাটফর্মের কার্যপদ্ধতি ও নিয়মকানুন নিয়ে সাধারণ জিজ্ঞাসাগুলোর উত্তর।'
                : 'Clear answers to common questions about Sobaike Janao platform operations.'}
            </p>
          </div>

          <div className="space-y-3">
            <Accordion
              id="faq-1"
              isOpen={openFaqId === 'faq-1'}
              onToggle={() => toggleFaq('faq-1')}
              title={language === 'bn' ? '১. সবাইকে জানাও কি সরকারি ওয়েবসাইট?' : '1. Is Sobaike Janao a government website?'}
            >
              <p className="text-ui-content-secondary text-[15px] leading-[24px]">
                {language === 'bn'
                  ? 'না। এটি সম্পূর্ণ স্বাধীন একটি নাগরিক তথ্য ও জনস্বার্থ প্ল্যাটফর্ম। এর সাথে সরকারি কোনো দপ্তরের প্রাতিষ্ঠানিক সংযোগ বা অনুমোদন নেই।'
                  : 'No. It is a completely independent citizen information and public-interest platform with no official government affiliation or endorsement.'}
              </p>
            </Accordion>

            <Accordion
              id="faq-2"
              isOpen={openFaqId === 'faq-2'}
              onToggle={() => toggleFaq('faq-2')}
              title={language === 'bn' ? '২. এটি কি পুলিশ বা আইনশৃঙ্খলা রক্ষাকারী সংস্থা?' : '2. Is this a police or law enforcement agency?'}
            >
              <p className="text-ui-content-secondary text-[15px] leading-[24px]">
                {language === 'bn'
                  ? 'না। এটি পুলিশ, আদালত বা কোনো নিয়ন্ত্রণকারী সংস্থা নয়। এখানে প্রতিবেদন করা মানে পুলিশে অভিযোগ করা বা জিডি/মামলা দায়ের করা নয়।'
                  : 'No. It is not police, a court, or a regulatory agency. Submitting a report here does not file a police complaint, GD, or formal legal case.'}
              </p>
            </Accordion>

            <Accordion
              id="faq-3"
              isOpen={openFaqId === 'faq-3'}
              onToggle={() => toggleFaq('faq-3')}
              title={language === 'bn' ? '৩. প্রকাশিত প্রতিবেদন কি প্রমাণ করে যে অভিযোগটি সত্য?' : '3. Does a published report prove the allegation is true?'}
            >
              <p className="text-ui-content-secondary text-[15px] leading-[24px]">
                {language === 'bn'
                  ? 'না। প্রকাশিত প্রতিবেদনগুলো নাগরিক জমা দেওয়া এবং পর্যালোচিত তথ্য। এটি কোনো আইনি রায়, বিচারিক সিদ্ধান্ত বা অপরাধের প্রমাণপত্র নয়।'
                  : 'No. Published reports represent citizen-submitted and reviewed information. They are never judicial findings, legal proofs, or formal determinations of guilt.'}
              </p>
            </Accordion>

            <Accordion
              id="faq-4"
              isOpen={openFaqId === 'faq-4'}
              onToggle={() => toggleFaq('faq-4')}
              title={language === 'bn' ? '৪. কী ধরনের ঘটনা বা সমস্যা এখানে জানানো যাবে?' : '4. What kind of issues can I report?'}
            >
              <p className="text-ui-content-secondary text-[15px] leading-[24px]">
                {language === 'bn'
                  ? 'বর্তমানে নির্দিষ্ট ৪টি ক্যাটাগরিতে তথ্য জানানো যায়: হয়রানি ও নির্যাতন, অবৈধ অটো-রিকশা চার্জিং, চাঁদাবাজি এবং ইউটিলিটি/বিদ্যুৎ সমস্যা।'
                  : 'Currently, you can report across 4 active categories: Harassment & Abuse, Illegal Auto-Charging, Extortion, and Utility/Load Shedding.'}
              </p>
            </Accordion>

            <Accordion
              id="faq-5"
              isOpen={openFaqId === 'faq-5'}
              onToggle={() => toggleFaq('faq-5')}
              title={language === 'bn' ? '৫. জমা দেওয়ার সাথে সাথেই কি প্রতিবেদন প্রকাশিত হয়?' : '5. Are reports published immediately upon submission?'}
            >
              <p className="text-ui-content-secondary text-[15px] leading-[24px]">
                {language === 'bn'
                  ? 'না। প্রতিটি প্রতিবেদন প্রকাশের পূর্বে আমাদের সম্পাদকীয় দল ও মডারেশন নীতিমালার আলোকে পর্যালোচনা করে।'
                  : 'No. Every report goes through moderation and review before public publication.'}
              </p>
            </Accordion>

            <Accordion
              id="faq-6"
              isOpen={openFaqId === 'faq-6'}
              onToggle={() => toggleFaq('faq-6')}
              title={language === 'bn' ? '৬. আমার ব্যক্তিগত তথ্য কি প্রকাশ পাবে?' : '6. Will my personal information be published?'}
            >
              <p className="text-ui-content-secondary text-[15px] leading-[24px]">
                {language === 'bn'
                  ? 'না। অভিযোগকারীর নাম, ফোন নম্বর ও ব্যক্তিগত গোপনীয় তথ্য জনসমক্ষে প্রকাশ করা হয় না।'
                  : 'No. Complainant names, phone numbers, and private contact details are kept strictly confidential and never displayed publicly.'}
              </p>
            </Accordion>

            <Accordion
              id="faq-7"
              isOpen={openFaqId === 'faq-7'}
              onToggle={() => toggleFaq('faq-7')}
              title={language === 'bn' ? '৭. জরুরি পরিস্থিতিতে আমার কী করা উচিত?' : '7. What should I do in an emergency?'}
            >
              <p className="text-ui-content-secondary text-[15px] leading-[24px]">
                {language === 'bn'
                  ? 'তাৎক্ষণিক বিপদে পড়লে সবাইকে জানাও-তে প্রতিবেদন দিয়ে অপেক্ষা না করে অবিলম্বে জাতীয় জরুরি সেবা ৯৯৯ বা সংশ্লিষ্ট আইন প্রয়োগকারী সংস্থায় যোগাযোগ করুন।'
                  : 'In immediate danger, do not wait for Sobaike Janao publication—immediately contact National Emergency Service 999 or official authorities.'}
              </p>
            </Accordion>
          </div>
        </div>
      )}
    </PublicPageContainer>
  );
};
