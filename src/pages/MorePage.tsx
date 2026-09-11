import React, { useState } from 'react';
import { Phone, Shield, Scale, Info, HelpCircle, Palette } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BANGLADESH_HELPLINES } from '../data/reportOptions';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';

export const MorePage: React.FC = () => {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<'about' | 'helplines' | 'principles' | 'response' | 'faq'>('about');

  return (
    <PublicPageContainer id="more-page-container">
      {/* Page Header */}
      <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-5 md:p-7 space-y-4 shadow-2xs">
        <div className="space-y-1.5">
          <h1 className="text-[32px] leading-[42px] font-bold text-ui-content-primary tracking-tight">
            {language === 'bn' ? 'তথ্য ও সহায়তা' : 'Information & support'}
          </h1>
        </div>

        {/* Mobile-Only Appearance / Theme Setting Card (md:hidden) */}
        <div className="pt-3 border-t border-ui-stroke-subtle md:hidden space-y-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-ui-content-muted" aria-hidden="true" />
            <span className="text-[14px] font-semibold text-ui-content-secondary">
              {language === 'bn' ? 'প্রদর্শন' : 'Appearance'}
            </span>
          </div>
          <ThemeSelector variant="segmented" />
        </div>

        {/* Tab Navigation */}
        <div
          aria-label={language === 'bn' ? 'তথ্য ও সহায়তা বিভাগ' : 'Information and support sections'}
          className="flex items-center gap-2 pt-2 border-t border-ui-stroke-subtle overflow-x-auto pb-1"
        >
          <button
            aria-pressed={activeTab === 'about'}
            type="button"
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2.5 rounded-xl text-[16px] leading-[24px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              activeTab === 'about'
                ? 'bg-ui-action-bg text-ui-action-text font-bold'
                : 'bg-ui-surface-subtle text-ui-content-secondary border border-ui-stroke-subtle'
            }`}
          >
            {language === 'bn' ? 'সম্পর্কে' : 'About'}
          </button>

          <button
            aria-pressed={activeTab === 'helplines'}
            type="button"
            onClick={() => setActiveTab('helplines')}
            className={`px-4 py-2.5 rounded-xl text-[16px] leading-[24px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              activeTab === 'helplines'
                ? 'bg-ui-action-bg text-ui-action-text font-bold'
                : 'bg-ui-surface-subtle text-ui-content-secondary border border-ui-stroke-subtle'
            }`}
          >
            {language === 'bn' ? 'সহায়তা' : 'Help'}
          </button>

          <button
            aria-pressed={activeTab === 'principles'}
            type="button"
            onClick={() => setActiveTab('principles')}
            className={`px-4 py-2.5 rounded-xl text-[16px] leading-[24px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              activeTab === 'principles'
                ? 'bg-ui-action-bg text-ui-action-text font-bold'
                : 'bg-ui-surface-subtle text-ui-content-secondary border border-ui-stroke-subtle'
            }`}
          >
            {language === 'bn' ? 'সুরক্ষা' : 'Safety'}
          </button>

          <button
            aria-pressed={activeTab === 'response'}
            type="button"
            onClick={() => setActiveTab('response')}
            className={`px-4 py-2.5 rounded-xl text-[16px] leading-[24px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              activeTab === 'response'
                ? 'bg-ui-action-bg text-ui-action-text font-bold'
                : 'bg-ui-surface-subtle text-ui-content-secondary border border-ui-stroke-subtle'
            }`}
          >
            {language === 'bn' ? 'প্রতিউত্তর' : 'Right of response'}
          </button>

          <button
            aria-pressed={activeTab === 'faq'}
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2.5 rounded-xl text-[16px] leading-[24px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              activeTab === 'faq'
                ? 'bg-ui-action-bg text-ui-action-text font-bold'
                : 'bg-ui-surface-subtle text-ui-content-secondary border border-ui-stroke-subtle'
            }`}
          >
            {language === 'bn' ? 'সাধারণ প্রশ্ন' : 'FAQ'}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'about' && (
        <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
          <div className="space-y-3">
            <h2 className="text-[20px] leading-[30px] font-bold text-ui-content-primary">
              {language === 'bn' ? 'সবাইকে জানাও কী?' : 'What is Sobaike Janao?'}
            </h2>
            <p className="text-[16px] leading-[26px] text-ui-content-secondary">
              {language === 'bn'
                ? 'সবাইকে জানাও-তে মানুষ জনস্বার্থের সমস্যা ও হয়রানির ঘটনা জানাতে পারেন। উপযুক্ত প্রতিবেদন পর্যালোচনার পর প্রকাশ করা হয়।'
                : 'Sobaike Janao lets people report issues that affect their community. Suitable reports are reviewed before publication.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
              <span className="w-9 h-9 rounded-xl bg-[var(--sec-harassment-bg)] text-[var(--sec-harassment-text)] border border-[var(--sec-harassment-border)] flex items-center justify-center font-bold text-[16px]">
                ১
              </span>
              <h3 className="text-[16px] font-bold text-ui-content-primary">
                {language === 'bn' ? 'হয়রানি ও নির্যাতন' : 'Harassment & abuse'}
              </h3>
              <p className="text-[14px] leading-[22px] text-ui-content-secondary">
                {language === 'bn' ? 'শারীরিক বা মানসিক নির্যাতন, নিপীড়ন ও অনলাইনে হেনস্তার তথ্য।' : 'Report incidents of harassment, abuse, or safety violations.'}
              </p>
            </div>

            <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
              <span className="w-9 h-9 rounded-xl bg-[var(--sec-rickshaw-bg)] text-[var(--sec-rickshaw-text)] border border-[var(--sec-rickshaw-border)] flex items-center justify-center font-bold text-[16px]">
                ২
              </span>
              <h3 className="text-[16px] font-bold text-ui-content-primary">
                {language === 'bn' ? 'অননুমোদিত চার্জিং স্টেশন' : 'Unsafe charging stations'}
              </h3>
              <p className="text-[14px] leading-[22px] text-ui-content-secondary">
                {language === 'bn' ? 'অনুমোদনহীন ব্যাটারি চার্জিং স্টেশন ও ঝুঁকিপূর্ণ বৈদ্যুতিক সংযোগের তথ্য।' : 'Report unauthorized or unsafe auto-rickshaw battery charging stations.'}
              </p>
            </div>

            <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
              <span className="w-9 h-9 rounded-xl bg-[var(--sec-extortion-bg)] text-[var(--sec-extortion-text)] border border-[var(--sec-extortion-border)] flex items-center justify-center font-bold text-[16px]">
                ৩
              </span>
              <h3 className="text-[16px] font-bold text-ui-content-primary">
                {language === 'bn' ? 'চাঁদাবাজি' : 'Extortion'}
              </h3>
              <p className="text-[14px] leading-[22px] text-ui-content-secondary">
                {language === 'bn' ? 'দোকানপাট, পরিবহন বা এলাকায় অবৈধ চাঁদা দাবি ও হুমকির তথ্য।' : 'Report extortion, illegal tolls, or coercive demands.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'helplines' && (
        <div className="space-y-4">
          <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-5 md:p-6 space-y-2 shadow-2xs">
            <h2 className="text-[20px] leading-[30px] font-bold text-ui-content-primary flex items-center gap-2">
              <Phone className="w-5 h-5 text-ui-accent" aria-hidden="true" />
              <span>{language === 'bn' ? 'জরুরি সহায়তা' : 'Emergency help'}</span>
            </h2>
            <p className="text-[16px] leading-[26px] text-ui-content-secondary">
              {language === 'bn'
                ? 'জরুরি সহায়তার জন্য নিচের উপযুক্ত সেবায় যোগাযোগ করুন।'
                : 'Need urgent help? Contact the appropriate service below.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BANGLADESH_HELPLINES.map((hl) => (
              <div
                key={hl.number}
                className="bg-ui-surface border border-ui-stroke-subtle rounded-xl p-5 flex items-center justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-1">
                  <span className="text-[14px] text-ui-content-secondary font-medium">
                    {language === 'bn' ? hl.labelBn : hl.labelEn}
                  </span>
                  <div className="text-[24px] leading-tight font-mono font-bold text-ui-content-primary">{hl.number}</div>
                  <span className="text-[14px] text-ui-content-muted block">
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
        </div>
      )}

      {activeTab === 'principles' && (
        <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
          <div className="space-y-2">
            <h2 className="text-[20px] leading-[30px] font-bold text-ui-content-primary flex items-center gap-2">
              <Shield className="w-5 h-5 text-ui-content-secondary" aria-hidden="true" />
              <span>{language === 'bn' ? 'সুরক্ষা ও মডারেশন' : 'Safety & moderation'}</span>
            </h2>
            <p className="text-[16px] leading-[26px] text-ui-content-secondary">
              {language === 'bn'
                ? 'সবাইকে জানাও প্ল্যাটফর্মের প্রতিবেদন জনস্বার্থে এবং পর্যালোচনার মাধ্যমে প্রকাশিত হয়।'
                : 'Reports submitted to Sobaike Janao are reviewed before publication.'}
            </p>
          </div>

          <div className="space-y-4 text-ui-content-secondary">
            <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-1.5">
              <h3 className="text-[18px] leading-[28px] font-bold text-ui-content-primary">
                {language === 'bn' ? '১. ব্যক্তিগত তথ্যের সুরক্ষা' : '1. PII protection'}
              </h3>
              <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                {language === 'bn'
                  ? 'ভুক্তভোগীর ব্যক্তিগত নিরাপত্তা অগ্রাধিকার। অভিযোগকারীর নাম, যোগাযোগের তথ্য ও ব্যক্তিগত গোপনীয় তথ্য জনসমক্ষে প্রকাশ করা হয় না।'
                  : 'Complainant identity details are kept private. Contact info is only used for follow-up when explicitly permitted.'}
              </p>
            </div>

            <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-1.5">
              <h3 className="text-[18px] leading-[28px] font-bold text-ui-content-primary">
                {language === 'bn' ? '২. পর্যালোচনার মানদণ্ড' : '2. Review standards'}
              </h3>
              <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                {language === 'bn'
                  ? 'প্রতিটি জমা দেওয়া প্রতিবেদন পর্যালোচনায় যাচাই করা হয় যেন তা নীতিমালা মেনে জনস্বার্থে উপস্থাপিত হয়।'
                  : 'Submissions are reviewed according to community guidelines before publication.'}
              </p>
            </div>

            <div className="p-5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-1.5">
              <h3 className="text-[18px] leading-[28px] font-bold text-ui-content-primary">
                {language === 'bn' ? '৩. সুনির্দিষ্ট বিবরণ' : '3. Corroborating details'}
              </h3>
              <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                {language === 'bn'
                  ? 'যথাযথ তারিখ, সময়, সুনির্দিষ্ট অবস্থান ও বিবরণ পর্যালোচনার প্রক্রিয়াকে সাহায্য করে।'
                  : 'Concrete dates, specific locations, and clear descriptions assist in the review process.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'response' && (
        <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
          <div className="space-y-2">
            <h2 className="text-[20px] leading-[30px] font-bold text-ui-content-primary flex items-center gap-2">
              <Scale className="w-5 h-5 text-ui-content-secondary" aria-hidden="true" />
              <span>{language === 'bn' ? 'প্রতিউত্তরের অধিকার' : 'Right of response'}</span>
            </h2>
            <p className="text-[16px] leading-[26px] text-ui-content-secondary">
              {language === 'bn'
                ? 'প্রতিবেদনে উল্লিখিত যেকোনো ব্যক্তি বা প্রতিষ্ঠান তাদের বক্তব্য বা ব্যাখ্যা জমা দিতে পারেন।'
                : 'Any person or organization mentioned in a report has the right to submit a response or clarification.'}
            </p>
          </div>

          <div className="p-5 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl space-y-2">
            <h3 className="text-[18px] leading-[28px] font-bold text-ui-content-primary">
              {language === 'bn' ? 'কীভাবে প্রতিউত্তর জমা দেবেন?' : 'How to submit a response?'}
            </h3>
            <p className="text-[16px] leading-[26px] text-ui-content-secondary">
              {language === 'bn'
                ? 'সংশ্লিষ্ট প্রতিবেদনে গিয়ে "জবাব দিন" বাটনে ক্লিক করে বক্তব্য জমা দিন। পর্যালোচনার পর তা প্রকাশনা প্রক্রিয়ার মাধ্যমে পরিচালিত হয়।'
                : 'Open the report and select "Submit response" to submit your statement for review. Approved responses are displayed alongside the report.'}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'faq' && (
        <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-6 md:p-8 space-y-5 shadow-2xs">
          <h2 className="text-[20px] leading-[30px] font-bold text-ui-content-primary flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-ui-content-secondary" aria-hidden="true" />
            <span>{language === 'bn' ? 'সাধারণ প্রশ্ন' : 'Frequently asked questions'}</span>
          </h2>

          <div className="space-y-4">
            <div className="p-4.5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-1.5">
              <h3 className="text-[18px] leading-[28px] font-bold text-ui-content-primary">
                {language === 'bn' ? 'প্রতিবেদন প্রকাশের আগে কি পর্যালোচনা করা হয়?' : 'Are reports reviewed before publishing?'}
              </h3>
              <p className="text-ui-content-secondary text-[16px] leading-[26px]">
                {language === 'bn'
                  ? 'হ্যাঁ, প্রতিটি প্রতিবেদন নীতিমালার আলোকে পর্যালোচনার পর জনসমক্ষে প্রকাশিত হয়।'
                  : 'Yes, submissions undergo moderation review before being published.'}
              </p>
            </div>

            <div className="p-4.5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-1.5">
              <h3 className="text-[18px] leading-[28px] font-bold text-ui-content-primary">
                {language === 'bn' ? 'প্রতিবেদন জমা দেওয়ার পর কী ঘটে?' : 'What happens after submitting a report?'}
              </h3>
              <p className="text-ui-content-secondary text-[16px] leading-[26px]">
                {language === 'bn'
                  ? 'প্রতিবেদন জমা দেওয়ার পর একটি রেফারেন্স আইডি প্রদান করা হয় এবং সম্পাদকীয় দল তথ্য যাচাই করে।'
                  : 'After submission, you receive a reference ID while our team reviews the report.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </PublicPageContainer>
  );
};

