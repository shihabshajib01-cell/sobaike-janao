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
      <div className="bg-surface border border-subtle rounded-2xl p-5 md:p-7 space-y-4 shadow-2xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[14px] font-semibold bg-surface-subtle text-secondary border border-subtle">
            <Info className="w-4 h-4 text-secondary" />
            <span>{language === 'bn' ? 'তথ্য ও সম্পাদকীয় নির্দেশিকা' : 'Information & Editorial Guidelines'}</span>
          </div>
          <h1 className="text-[32px] leading-[42px] font-bold text-primary tracking-tight">
            {language === 'bn' ? 'সবাইকে জানাও প্ল্যাটফর্ম পরিচিতি' : 'About Sobaike Janao Platform'}
          </h1>
          <p className="text-[16px] leading-[26px] text-secondary">
            {language === 'bn'
              ? 'নাগরিক সচেতনতা, সুরক্ষানীতি, প্রতিউত্তরের অধিকার এবং জরুরি সহায়তা।'
              : 'Community awareness, moderation standards, right-of-response policy, and emergency assistance.'}
          </p>
        </div>

        {/* Mobile-Only Appearance / Theme Setting Card (md:hidden) */}
        <div className="pt-3 border-t border-subtle md:hidden space-y-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted" />
            <span className="text-[14px] font-semibold text-secondary">
              {language === 'bn' ? 'প্রদর্শন (থিম পছন্দ)' : 'Appearance'}
            </span>
          </div>
          <ThemeSelector variant="segmented" />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t border-subtle overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2.5 rounded-xl text-[16px] leading-[24px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'about'
                ? 'bg-[var(--ui-primary-action-bg)] text-[var(--ui-primary-action-text)] font-bold'
                : 'bg-surface-subtle text-secondary hover:bg-surface border border-subtle'
            }`}
          >
            {language === 'bn' ? 'প্ল্যাটফর্ম সম্পর্কে' : 'About Platform'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('helplines')}
            className={`px-4 py-2.5 rounded-xl text-[16px] leading-[24px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'helplines'
                ? 'bg-[var(--ui-primary-action-bg)] text-[var(--ui-primary-action-text)] font-bold'
                : 'bg-surface-subtle text-secondary hover:bg-surface border border-subtle'
            }`}
          >
            {language === 'bn' ? 'জরুরি ও সহায়তা সেবা' : 'Emergency & Support Resources'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('principles')}
            className={`px-4 py-2.5 rounded-xl text-[16px] leading-[24px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'principles'
                ? 'bg-[var(--ui-primary-action-bg)] text-[var(--ui-primary-action-text)] font-bold'
                : 'bg-surface-subtle text-secondary hover:bg-surface border border-subtle'
            }`}
          >
            {language === 'bn' ? 'সুরক্ষা ও মডারেশন নীতি' : 'Safety & Moderation'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('response')}
            className={`px-4 py-2.5 rounded-xl text-[16px] leading-[24px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'response'
                ? 'bg-[var(--ui-primary-action-bg)] text-[var(--ui-primary-action-text)] font-bold'
                : 'bg-surface-subtle text-secondary hover:bg-surface border border-subtle'
            }`}
          >
            {language === 'bn' ? 'প্রতিউত্তরের অধিকার' : 'Right of Response'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2.5 rounded-xl text-[16px] leading-[24px] font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'faq'
                ? 'bg-[var(--ui-primary-action-bg)] text-[var(--ui-primary-action-text)] font-bold'
                : 'bg-surface-subtle text-secondary hover:bg-surface border border-subtle'
            }`}
          >
            {language === 'bn' ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'FAQ'}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'about' && (
        <div className="bg-surface border border-subtle rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
          <div className="space-y-3">
            <h2 className="text-[20px] leading-[30px] font-bold text-primary">
              {language === 'bn' ? 'সবাইকে জানাও (Sobaike Janao) কী?' : 'What is Sobaike Janao?'}
            </h2>
            <p className="text-[16px] leading-[26px] text-secondary">
              {language === 'bn'
                ? 'সবাইকে জানাও একটি নাগরিক সচেতনতামূলক ও জনস্বার্থ ইন্টারফেস। বাংলাদেশের প্রেক্ষাপটে জনপরিসরে নারী ও নাগরিকদের সম্পর্ক, নির্যাতন ও হয়রানি, অননুমোদিত রিকশা ব্যাটারি চার্জিং ও গ্যারেজ ঝুঁকি, এবং দোকানপাট ও স্থানীয় ক্ষেত্রে চাঁদাবাজি ও জবরদস্তির মতো সুনির্দিষ্ট সমস্যাগুলো নিয়মতান্ত্রিকভাবে নথিভুক্ত করার উদ্দেশ্যে এটি নকশা করা হয়েছে।'
                : 'Sobaike Janao is a civic awareness reporting platform designed for the Bangladesh community. It enables structured civilian documentation of Relationship, Abuse & Harassment, Rickshaw Charging & Garage hazards, and Extortion & Coercion to promote community safety.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 bg-surface-subtle rounded-xl border border-subtle space-y-2">
              <span className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-[16px]">
                ১
              </span>
              <h3 className="text-[16px] font-bold text-primary">
                {language === 'bn' ? 'সম্পর্ক, নির্যাতন ও হয়রানি' : 'Relationship, Abuse & Harassment'}
              </h3>
              <p className="text-[14px] leading-[22px] text-secondary">
                {language === 'bn' ? 'সম্পর্কগত নিপীড়ন, পারিবারিক নির্যাতন ও জনপরিসরে হয়রানির রিপোর্ট।' : 'Document relationship abuse, domestic pressure, or public harassment.'}
              </p>
            </div>

            <div className="p-5 bg-surface-subtle rounded-xl border border-subtle space-y-2">
              <span className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-[16px]">
                ২
              </span>
              <h3 className="text-[16px] font-bold text-primary">
                {language === 'bn' ? 'রিকশা চার্জিং ও গ্যারেজ' : 'Rickshaw Charging & Garage'}
              </h3>
              <p className="text-[14px] leading-[22px] text-secondary">
                {language === 'bn' ? 'ঝুঁকিপূর্ণ ব্যাটারি চার্জিং, অগ্নিকাণ্ড শঙ্কা ও অননুমোদিত সংযোগের ঝুঁকি।' : 'Track hazardous electrical connections and unsafe battery garages.'}
              </p>
            </div>

            <div className="p-5 bg-surface-subtle rounded-xl border border-subtle space-y-2">
              <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-[16px]">
                ৩
              </span>
              <h3 className="text-[16px] font-bold text-primary">
                {language === 'bn' ? 'চাঁদাবাজি ও জবরদস্তি' : 'Extortion & Coercion'}
              </h3>
              <p className="text-[14px] leading-[22px] text-secondary">
                {language === 'bn' ? 'দোকান, ক্ষুদ্র ব্যবসায়ী ও কর্মক্ষেত্রে অননুমোদিত অর্থ দাবি ও চাপ।' : 'Report illicit collections, coercive demands, and unlawful levies.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'helplines' && (
        <div className="space-y-4">
          <div className="bg-surface border border-subtle rounded-2xl p-5 md:p-6 space-y-2 shadow-2xs">
            <h2 className="text-[20px] leading-[30px] font-bold text-primary flex items-center gap-2">
              <Phone className="w-5 h-5 text-rose-500" />
              <span>{language === 'bn' ? 'জরুরি ও সহায়তা সেবা' : 'Emergency & Support Resources'}</span>
            </h2>
            <p className="text-[16px] leading-[26px] text-secondary">
              {language === 'bn'
                ? 'জরুরি বা সহায়তার প্রয়োজন হলে প্রাসঙ্গিক সেবার সঙ্গে যোগাযোগ করতে নিচের তথ্য ব্যবহার করুন।'
                : 'Use the relevant contact information below when emergency or support assistance is needed.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BANGLADESH_HELPLINES.map((hl) => (
              <div
                key={hl.number}
                className="bg-surface border border-subtle rounded-xl p-5 flex items-center justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-1">
                  <span className="text-[14px] text-secondary font-medium">
                    {language === 'bn' ? hl.labelBn : hl.labelEn}
                  </span>
                  <div className="text-[24px] leading-tight font-mono font-bold text-primary">{hl.number}</div>
                  <span className="text-[14px] text-muted block">
                    {language === 'bn' ? hl.descBn : hl.descEn}
                  </span>
                </div>
                <a
                  href={`tel:${hl.number}`}
                  className="btn-primary-action px-5 py-2.5 rounded-xl text-[16px] font-semibold flex items-center gap-2 shrink-0 min-h-[44px]"
                >
                  <Phone className="w-4 h-4" />
                  <span>{language === 'bn' ? 'কল করুন' : 'Call'}</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'principles' && (
        <div className="bg-surface border border-subtle rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
          <div className="space-y-2">
            <h2 className="text-[20px] leading-[30px] font-bold text-primary flex items-center gap-2">
              <Shield className="w-5 h-5 text-secondary" />
              <span>{language === 'bn' ? 'সম্পাদকীয় ও মডারেশন মূলনীতি' : 'Editorial & Moderation Principles'}</span>
            </h2>
            <p className="text-[16px] leading-[26px] text-secondary">
              {language === 'bn'
                ? 'সবাইকে জানাও প্ল্যাটফর্মের প্রতিটি প্রতিবেদন জনস্বার্থে এবং সম্পাদকীয় পর্যালোচনার মধ্য দিয়ে প্রকাশিত হয়।'
                : 'Every report submitted to Sobaike Janao undergoes editorial moderation review before publication.'}
            </p>
          </div>

          <div className="space-y-4 text-secondary">
            <div className="p-5 bg-surface-subtle rounded-xl border border-subtle space-y-1.5">
              <h3 className="text-[18px] leading-[28px] font-bold text-primary">
                {language === 'bn' ? '১. ব্যক্তিগত তথ্যের সুরক্ষা (PII Protection)' : '1. PII Redaction'}
              </h3>
              <p className="text-[16px] leading-[26px] text-secondary">
                {language === 'bn'
                  ? 'ভুক্তভোগীর ব্যক্তিগত নিরাপত্তা অগ্রাধিকার। অভিযোগকারীর নাম, যোগাযোগের তথ্য ও ব্যক্তিগত গোপনীয় তথ্য জনসমক্ষে প্রকাশ করা হয় না।'
                  : 'Complainant identity details are kept private. Contact info is only used for editorial follow-up when explicitly permitted.'}
              </p>
            </div>

            <div className="p-5 bg-surface-subtle rounded-xl border border-subtle space-y-1.5">
              <h3 className="text-[18px] leading-[28px] font-bold text-primary">
                {language === 'bn' ? '২. যাচাইযোগ্যতা ও তথ্য স্পষ্টতা' : '2. Editorial Moderation & Standards'}
              </h3>
              <p className="text-[16px] leading-[26px] text-secondary">
                {language === 'bn'
                  ? 'প্রতিটি জমা দেওয়া প্রতিবেদন সম্পাদকীয় পর্যালোচনায় যাচাই করা হয় যেন তা নীতিমালা মেনে জনস্বার্থে উপস্থাপিত হয়।'
                  : 'All submissions are reviewed according to community moderation guidelines before public distribution.'}
              </p>
            </div>

            <div className="p-5 bg-surface-subtle rounded-xl border border-subtle space-y-1.5">
              <h3 className="text-[18px] leading-[28px] font-bold text-primary">
                {language === 'bn' ? '৩. প্রমাণ ও পারিপার্শ্বিক তথ্যের গুরুত্ব' : '3. Evidence Weight'}
              </h3>
              <p className="text-[16px] leading-[26px] text-secondary">
                {language === 'bn'
                  ? 'যথাযথ তারিখ, সময়, সুনির্দিষ্ট অবস্থান ও পারিপার্শ্বিক বিবরণ পর্যালোচনার প্রক্রিয়াকে সাহায্য করে।'
                  : 'Concrete dates, specific coordinates, and corroborating details assist in editorial review.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'response' && (
        <div className="bg-surface border border-subtle rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
          <div className="space-y-2">
            <h2 className="text-[20px] leading-[30px] font-bold text-primary flex items-center gap-2">
              <Scale className="w-5 h-5 text-secondary" />
              <span>{language === 'bn' ? 'প্রতিউত্তরের অধিকার নীতি (Right of Response)' : 'Right of Response Standards'}</span>
            </h2>
            <p className="text-[16px] leading-[26px] text-secondary">
              {language === 'bn'
                ? 'যেকোনো প্রতিবেদনে উল্লেখিত ব্যক্তি, প্রতিষ্ঠান বা সংশ্লিষ্ট পক্ষ তাদের ব্যাখ্যা বা বক্তব্য প্ল্যাটফর্মে জমা দিতে পারেন।'
                : 'Any individual or organization named in a report has the full right to submit a statement or clarification.'}
            </p>
          </div>

          <div className="p-5 bg-surface-subtle border border-subtle rounded-xl space-y-2">
            <h3 className="text-[18px] leading-[28px] font-bold text-primary">
              {language === 'bn' ? 'কীভাবে প্রতিউত্তর জমা দেবেন?' : 'How to file a response?'}
            </h3>
            <p className="text-[16px] leading-[26px] text-secondary">
              {language === 'bn'
                ? 'সংশ্লিষ্ট প্রতিবেদনের নিচে থাকা "বক্তব্য দিন" বাটনে ক্লিক করে ফরমটি পূরণ করুন। আপনার প্রতিক্রিয়া মডারেশনের জন্য জমা হবে এবং প্রকাশযোগ্য সংস্করণ প্রকাশনা প্রক্রিয়ার মাধ্যমে পরিচালিত হবে।'
                : 'Open the referenced report and select "Submit Statement" to submit your response for moderation. Any public display is handled through the publication workflow.'}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'faq' && (
        <div className="bg-surface border border-subtle rounded-2xl p-6 md:p-8 space-y-5 shadow-2xs">
          <h2 className="text-[20px] leading-[30px] font-bold text-primary flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-secondary" />
            <span>{language === 'bn' ? 'সাধারণ জিজ্ঞাসা ও প্রশ্নোত্তর' : 'Frequently Asked Questions'}</span>
          </h2>

          <div className="space-y-4">
            <div className="p-4.5 bg-surface-subtle rounded-xl border border-subtle space-y-1.5">
              <h3 className="text-[18px] leading-[28px] font-bold text-primary">
                {language === 'bn' ? 'প্রতিবেদন প্রকাশের আগে কি পর্যালোচনা করা হয়?' : 'Are reports reviewed before publishing?'}
              </h3>
              <p className="text-secondary text-[16px] leading-[26px]">
                {language === 'bn'
                  ? 'হ্যাঁ, প্রতিটি প্রতিবেদন সম্পাদকীয় টিমের পর্যালোচনায় স্থান পায় এবং প্রয়োজনীয় নিরাপত্তা ফিল্টারিং সম্পন্ন হলে জনসমক্ষে প্রকাশিত হয়।'
                  : 'Yes, each submission undergoes editorial moderation review before being published to the public feed.'}
              </p>
            </div>

            <div className="p-4.5 bg-surface-subtle rounded-xl border border-subtle space-y-1.5">
              <h3 className="text-[18px] leading-[28px] font-bold text-primary">
                {language === 'bn' ? 'প্রতিবেদন জমা দেওয়ার পর কী ঘটে?' : 'What happens after submitting a report?'}
              </h3>
              <p className="text-secondary text-[16px] leading-[26px]">
                {language === 'bn'
                  ? 'প্রতিবেদন জমা দেওয়ার পর আপনাকে একটি ইউনিক রিপোর্ট আইডি প্রদান করা হয়। মডারেশন টিম তথ্য যাচাই শেষে উপযুক্ত ব্যবস্থা গ্রহণ করে।'
                  : 'After submission, you receive a unique Report ID as reference while our team reviews the report.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </PublicPageContainer>
  );
};

