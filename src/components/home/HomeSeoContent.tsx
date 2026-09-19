import React from 'react';
import { Link } from 'react-router-dom';

export interface PlatformInformationDetailsProps {
  language: 'bn' | 'en';
}

/**
 * Detailed platform information belongs in Information & Support, not in the
 * home report feed. This keeps the feed focused while preserving a complete,
 * user-visible information architecture with useful internal links.
 */
export const PlatformInformationDetails: React.FC<PlatformInformationDetailsProps> = ({ language }) => {
  const isBn = language === 'bn';
  const localizedPath = (path: string) =>
    language === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path;

  return (
    <section
      id="home-platform-information"
      className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-card)] p-5 md:p-7 shadow-[var(--elevation-2xs)] space-y-5"
      aria-labelledby="platform-information-details-title"
    >
      <div className="space-y-1">
        <h2 id="platform-information-details-title" className="type-h2 text-ui-content-primary">
          {isBn ? 'প্ল্যাটফর্ম, প্রতিবেদন ও নিরাপদ ব্যবহার' : 'Platform, reporting & safe use'}
        </h2>
        <p className="type-meta text-ui-content-secondary">
          {isBn
            ? 'প্রতিবেদন দেখা, যাচাই, প্রকাশ, গোপনীয়তা ও নিরাপদ ব্যবহারের বিস্তারিত তথ্য।'
            : 'Detailed guidance on finding, reviewing, publishing and safely using reports.'}
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="type-h3 text-ui-content-primary">
          {isBn ? 'বিষয় ও প্রতিবেদন খোঁজা' : 'Topics and finding reports'}
        </h3>
        <p className="type-body text-ui-content-secondary">
          {isBn
            ? 'প্রকাশিত প্রতিবেদন বিষয় ও এলাকা অনুযায়ী দেখা যায়। বর্তমানে জননিরাপত্তা, হয়রানি ও নির্যাতন, চাঁদাবাজি ও ঘুষ, সড়ক ও যাতায়াত, ইউটিলিটি সমস্যা, অবৈধ দখল এবং অবৈধ অটো-রিকশা চার্জিং বিষয়ে প্রতিবেদন পাওয়া যায়।'
            : 'Published reports can be explored by topic and area. Current reporting areas include public safety, harassment and abuse, extortion and bribery, road and transport, utility issues, illegal occupation, and unsafe auto-rickshaw charging.'}
        </p>
        <p className="type-body text-ui-content-secondary">
          {isBn ? (
            <>
              বিভাগগুলো দেখুন: <Link to={localizedPath('/public-safety')}>জননিরাপত্তা</Link>,{' '}
              <Link to={localizedPath('/harassment')}>হয়রানি ও নির্যাতন</Link>,{' '}
              <Link to={localizedPath('/extortion')}>চাঁদাবাজি ও ঘুষ</Link>,{' '}
              <Link to={localizedPath('/road-transport')}>সড়ক ও যাতায়াত</Link>,{' '}
              <Link to={localizedPath('/load-shedding')}>ইউটিলিটি সমস্যা</Link>,{' '}
              <Link to={localizedPath('/illegal-occupation')}>অবৈধ দখল</Link> এবং{' '}
              <Link to={localizedPath('/rickshaw')}>অবৈধ অটো-রিকশা চার্জিং</Link>।
            </>
          ) : (
            <>
              Browse <Link to={localizedPath('/public-safety')}>public safety</Link>,{' '}
              <Link to={localizedPath('/harassment')}>harassment and abuse</Link>,{' '}
              <Link to={localizedPath('/extortion')}>extortion and bribery</Link>,{' '}
              <Link to={localizedPath('/road-transport')}>road and transport</Link>,{' '}
              <Link to={localizedPath('/load-shedding')}>utility issues</Link>,{' '}
              <Link to={localizedPath('/illegal-occupation')}>illegal occupation</Link>, and{' '}
              <Link to={localizedPath('/rickshaw')}>unsafe auto-rickshaw charging</Link>.
            </>
          )}
        </p>
      </section>

      <section className="space-y-2 pt-4 border-t border-ui-stroke-subtle">
        <h3 className="type-h3 text-ui-content-primary">
          {isBn ? 'দায়িত্বশীল প্রতিবেদন ও যাচাই' : 'Responsible reporting and verification'}
        </h3>
        <p className="type-body text-ui-content-secondary">
          {isBn
            ? 'প্রকাশের আগে সঠিক, সত্য ও প্রাসঙ্গিক তথ্য দেওয়ার চেষ্টা করুন। কারও সুনাম নষ্ট করার উদ্দেশ্যে ভিত্তিহীন অভিযোগ, অনুমানকে নিশ্চিত তথ্য হিসেবে উপস্থাপন, অথবা অপ্রাসঙ্গিক ব্যক্তিগত তথ্য প্রকাশ করা উচিত নয়। কোনো প্রতিবেদন দেখার সময় শিরোনাম, ঘটনার বিবরণ, প্রকাশের তারিখ, এলাকা, সংশ্লিষ্ট বিভাগ এবং উপলব্ধ উৎস বা সমর্থনকারী তথ্য একসঙ্গে বিবেচনা করুন।'
            : 'Before publishing, provide information that is accurate, relevant and presented in good faith. Do not use the platform for baseless accusations intended to damage someone’s reputation, present assumptions as confirmed facts, or expose unnecessary personal information. When reading a report, consider its title, description, publication date, location, category, cited sources and supporting information together.'}
        </p>
        <p className="type-body text-ui-content-secondary">
          {isBn
            ? 'একটি প্রকাশিত প্রতিবেদন নিজে থেকে আদালতের রায়, সরকারি সিদ্ধান্ত বা অপরাধ প্রমাণের সমতুল্য নয়। প্রেক্ষাপট, উৎস, সংশ্লিষ্ট পক্ষের প্রতিক্রিয়া এবং পরবর্তী আপডেট গুরুত্বপূর্ণ।'
            : 'A published report is not, by itself, a court judgment, an official government determination, or proof of criminal liability. Context, sources, relevant-party responses and later updates matter.'}
        </p>
      </section>

      <section className="space-y-2 pt-4 border-t border-ui-stroke-subtle">
        <h3 className="type-h3 text-ui-content-primary">
          {isBn ? 'প্রতিবেদন প্রকাশের প্রক্রিয়া' : 'How publication works'}
        </h3>
        <p className="type-body text-ui-content-secondary">
          {isBn
            ? 'নতুন প্রতিবেদন জমা দেওয়ার সময় উপযুক্ত বিষয় নির্বাচন করে ঘটনার প্রয়োজনীয় তথ্য দিন। স্থান, সময়, সংক্ষিপ্ত বিবরণ এবং প্রাসঙ্গিক সমর্থনকারী তথ্য থাকলে তা যুক্ত করুন। জমা দেওয়া তথ্য প্রকাশের আগে প্ল্যাটফর্মের নীতিমালা অনুযায়ী পর্যালোচনা ও মডারেশন হতে পারে। উদ্দেশ্য হলো জনস্বার্থের তথ্যকে পরিষ্কার, প্রাসঙ্গিক ও অনুসন্ধানযোগ্যভাবে উপস্থাপন করা।'
            : 'When submitting a new report, choose the appropriate topic and provide the information needed to understand the event. Add the location, time, a clear description and relevant supporting information when available. Submissions may be reviewed and moderated before publication so public-interest information is presented clearly, responsibly and in a searchable form.'}
        </p>
      </section>

      <section className="space-y-2 pt-4 border-t border-ui-stroke-subtle">
        <h3 className="type-h3 text-ui-content-primary">
          {isBn ? 'গোপনীয়তা, প্রতিক্রিয়া ও নিরাপদ ব্যবহার' : 'Privacy, response and safe use'}
        </h3>
        <p className="type-body text-ui-content-secondary">
          {isBn
            ? 'ব্যক্তিগত ও সংবেদনশীল তথ্য ব্যবহারে সতর্ক থাকুন। প্রয়োজনের অতিরিক্ত ফোন নম্বর, পরিচয়পত্র নম্বর, ব্যক্তিগত ঠিকানা বা এমন তথ্য প্রকাশ করবেন না যা কারও নিরাপত্তা বা গোপনীয়তা অযথা ঝুঁকিতে ফেলতে পারে। কোনো প্রতিবেদনে আপনি সরাসরি সংশ্লিষ্ট হলে প্ল্যাটফর্মে উপলব্ধ প্রতিউত্তর বা সংশোধন প্রক্রিয়া অনুসরণ করুন।'
            : 'Be careful with personal and sensitive information. Do not publish unnecessary phone numbers, identity-document numbers, private addresses or other information that may create avoidable privacy or safety risks. If a report directly concerns you, use the platform’s available response or correction process.'}
        </p>
        <p className="type-body text-ui-content-secondary">
          {isBn
            ? 'সবাইকে জানাও জরুরি প্রতিক্রিয়া সেবা নয় এবং কোনো সরকারি তদন্ত সংস্থার বিকল্পও নয়। জীবন, নিরাপত্তা বা চলমান অপরাধের তাৎক্ষণিক ঝুঁকি থাকলে ওয়েবসাইটে প্রতিবেদন প্রকাশের অপেক্ষা না করে ৯৯৯ বা সংশ্লিষ্ট কর্তৃপক্ষের সঙ্গে যোগাযোগ করুন।'
            : 'Sobaike Janao is not an emergency-response service and does not replace a government investigative authority. If there is an immediate risk to life or safety, or an ongoing crime, contact 999 or the appropriate authority rather than waiting to publish a report here.'}
        </p>
      </section>

      <section className="space-y-2 pt-4 border-t border-ui-stroke-subtle">
        <h3 className="type-h3 text-ui-content-primary">
          {isBn ? 'আরও খুঁজুন, দেখুন বা প্রতিবেদন করুন' : 'Explore, search or report'}
        </h3>
        <p className="type-body text-ui-content-secondary">
          {isBn ? (
            <>
              <Link to={localizedPath('/explore')}>এক্সপ্লোর</Link> থেকে এলাকা অনুযায়ী প্রকাশিত প্রতিবেদন দেখুন। নির্দিষ্ট বিষয় বা সংশ্লিষ্ট পক্ষ খুঁজতে <Link to={localizedPath('/search')}>অনুসন্ধান</Link> ব্যবহার করুন। নতুন ঘটনা জানাতে <Link to={localizedPath('/report')}>প্রতিবেদন করুন</Link>।
            </>
          ) : (
            <>
              Use <Link to={localizedPath('/explore')}>Explore</Link> to browse published reports by area, <Link to={localizedPath('/search')}>Search</Link> for a specific topic or reported party, or <Link to={localizedPath('/report')}>submit a report</Link> for a new public-interest incident.
            </>
          )}
        </p>
      </section>
    </section>
  );
};

// Temporary compatibility export for any older imports while the component is
// fully owned by the Information & Support page.
export const HomeSeoContent = PlatformInformationDetails;
