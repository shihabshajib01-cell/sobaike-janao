import React from 'react';
import { Link } from 'react-router-dom';

export interface HomeSeoContentProps {
  language: 'bn' | 'en';
}

/**
 * User-visible counterpart to the non-JS crawl fallback in index.html.
 * Keeping the same information available to real users prevents the SEO
 * fallback from becoming crawler-only content while keeping the home feed compact.
 */
export const HomeSeoContent: React.FC<HomeSeoContentProps> = ({ language }) => {
  const isBn = language === 'bn';
  const localizedPath = (path: string) =>
    language === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path;

  return (
    <section
      id="home-platform-information"
      className="ui-card p-5 md:p-6 space-y-3"
      aria-labelledby="home-platform-information-title"
    >
      <h2 id="home-platform-information-title" className="type-h2 text-ui-content-primary">
        {isBn ? 'সবাইকে জানাও সম্পর্কে' : 'About Sobaike Janao'}
      </h2>
      <p className="type-body text-ui-content-secondary">
        {isBn
          ? 'সবাইকে জানাও বাংলাদেশের নাগরিকদের জনস্বার্থে তথ্য, অভিজ্ঞতা ও পর্যবেক্ষণ দায়িত্বশীলভাবে প্রকাশ করার একটি স্বাধীন, মডারেটেড প্ল্যাটফর্ম। এটি কোনো সরকারি সংস্থা বা আইনশৃঙ্খলা রক্ষাকারী প্রতিষ্ঠানের ওয়েবসাইট নয়।'
          : 'Sobaike Janao is an independent, moderated platform where people in Bangladesh can responsibly publish public-interest information, experiences, and observations. It is not a government or law-enforcement website.'}
      </p>

      <details className="group border-t border-ui-stroke-subtle pt-3">
        <summary className="cursor-pointer type-body font-[var(--font-weight-semibold)] text-ui-content-primary">
          {isBn ? 'প্ল্যাটফর্ম, প্রতিবেদন ও নিরাপদ ব্যবহার সম্পর্কে বিস্তারিত' : 'Read more about reporting and safe use'}
        </summary>

        <div className="pt-4 space-y-6">
          <section className="space-y-2">
            <h3 className="type-h3 text-ui-content-primary">
              {isBn ? 'কী ধরনের বিষয় এখানে প্রকাশ করা যায়' : 'What can be reported'}
            </h3>
            <p className="type-body text-ui-content-secondary">
              {isBn
                ? 'প্ল্যাটফর্মে জননিরাপত্তা, হয়রানি ও নির্যাতন, চাঁদাবাজি ও ঘুষ, সড়ক ও যাতায়াত সমস্যা, ইউটিলিটি সমস্যা, অবৈধ দখল এবং অবৈধ অটো-রিকশা চার্জিংসহ জনস্বার্থের বিভিন্ন বিষয় নিয়ে প্রতিবেদন করা যায়। প্রতিটি প্রতিবেদনে প্রাসঙ্গিক ঘটনা, স্থান, সময়, বিবরণ এবং যেখানে উপযুক্ত সেখানে সমর্থনকারী তথ্য যোগ করা যেতে পারে। প্রকাশিত প্রতিবেদনগুলো বিষয় ও এলাকা অনুযায়ী দেখা যায়, যাতে নাগরিকরা একই ধরনের সমস্যা সম্পর্কে তথ্য খুঁজে পেতে পারেন।'
                : 'Reports can cover public safety, harassment and abuse, extortion and bribery, road and transport problems, utility issues, illegal occupation, unsafe auto-rickshaw charging, and other public-interest concerns. A report may include the relevant event, location, time, description, and supporting information where appropriate. Published reports can be explored by topic and area so people can find related issues and understand local patterns.'}
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

          <section className="space-y-2">
            <h3 className="type-h3 text-ui-content-primary">
              {isBn ? 'দায়িত্বশীল প্রতিবেদন ও যাচাই' : 'Responsible reporting and verification'}
            </h3>
            <p className="type-body text-ui-content-secondary">
              {isBn
                ? 'প্রকাশের আগে সঠিক, সত্য ও প্রাসঙ্গিক তথ্য দেওয়ার চেষ্টা করুন। কারও সুনাম নষ্ট করার উদ্দেশ্যে ভিত্তিহীন অভিযোগ, অনুমানকে নিশ্চিত তথ্য হিসেবে উপস্থাপন, অথবা অপ্রাসঙ্গিক ব্যক্তিগত তথ্য প্রকাশ করা উচিত নয়। প্ল্যাটফর্মের মডারেশন ও প্রকাশ নীতি জনস্বার্থের তথ্যকে পরিষ্কারভাবে উপস্থাপন করতে সহায়তা করে এবং যেখানে প্রযোজ্য সেখানে সংশ্লিষ্ট পক্ষের প্রতিক্রিয়া বা পরবর্তী আপডেটও প্রকাশ করা হতে পারে। কোনো প্রতিবেদন দেখার সময় শিরোনাম, ঘটনার বিবরণ, প্রকাশের তারিখ, এলাকা, সংশ্লিষ্ট বিভাগ এবং উপলব্ধ উৎস বা সমর্থনকারী তথ্য একসঙ্গে বিবেচনা করুন।'
                : 'Before publishing, provide information that is accurate, relevant, and presented in good faith. Do not use the platform for baseless accusations intended to damage someone’s reputation, present assumptions as confirmed facts, or expose unnecessary personal information. Moderation and publication rules are intended to keep public-interest information clear and responsible. When reading a report, consider its title, description, publication date, location, category, cited sources, supporting information, and later updates together.'}
            </p>
            <p className="type-body text-ui-content-secondary">
              {isBn
                ? 'একটি প্রকাশিত প্রতিবেদন নিজে থেকে আদালতের রায়, সরকারি সিদ্ধান্ত বা অপরাধ প্রমাণের সমতুল্য নয়। পাঠকের জন্য প্রেক্ষাপট, উৎস, সংশ্লিষ্ট পক্ষের প্রতিক্রিয়া এবং পরবর্তী আপডেট দেখা গুরুত্বপূর্ণ।'
                : 'A published report is not, by itself, a court judgment, an official government determination, or proof of criminal liability. Context, sources, responses from relevant parties, and later updates matter when interpreting any report.'}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="type-h3 text-ui-content-primary">
              {isBn ? 'প্রতিবেদন প্রকাশের প্রক্রিয়া' : 'How publication works'}
            </h3>
            <p className="type-body text-ui-content-secondary">
              {isBn
                ? 'নতুন প্রতিবেদন জমা দেওয়ার সময় প্রথমে উপযুক্ত বিষয় নির্বাচন করে ঘটনার প্রয়োজনীয় তথ্য দিন। ঘটনার স্থান, সময়, সংক্ষিপ্ত বিবরণ এবং প্রাসঙ্গিক সমর্থনকারী তথ্য থাকলে তা যুক্ত করুন। জমা দেওয়া তথ্য প্রকাশের আগে প্ল্যাটফর্মের নীতিমালা অনুযায়ী পর্যালোচনা ও মডারেশন হতে পারে। উদ্দেশ্য হলো অভিযোগকে উত্তেজনাপূর্ণভাবে ছড়িয়ে দেওয়া নয়; বরং জনস্বার্থের তথ্যকে পরিষ্কার, প্রাসঙ্গিক ও অনুসন্ধানযোগ্যভাবে উপস্থাপন করা। প্রকাশিত হওয়ার পর একটি প্রতিবেদন সংশ্লিষ্ট বিভাগ, এলাকা এবং অন্যান্য প্রাসঙ্গিক তথ্যের সঙ্গে দেখা যায়।'
                : 'When submitting a new report, choose the appropriate topic and provide the information needed to understand the event. Add the location, time, a clear description, and relevant supporting information when available. Submissions may be reviewed and moderated before publication under the platform’s rules. The goal is not to amplify accusations sensationally, but to present public-interest information clearly, responsibly, and in a form that can be searched and followed over time.'}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="type-h3 text-ui-content-primary">
              {isBn ? 'গোপনীয়তা, প্রতিক্রিয়া ও নিরাপদ ব্যবহার' : 'Privacy, response, and safe use'}
            </h3>
            <p className="type-body text-ui-content-secondary">
              {isBn
                ? 'জনস্বার্থের প্রতিবেদন প্রকাশের সময় ব্যক্তিগত ও সংবেদনশীল তথ্য ব্যবহারে সতর্ক থাকা প্রয়োজন। প্রয়োজনের অতিরিক্ত ফোন নম্বর, পরিচয়পত্র নম্বর, ব্যক্তিগত ঠিকানা বা এমন তথ্য প্রকাশ করবেন না যা কারও নিরাপত্তা বা গোপনীয়তা অযথা ঝুঁকিতে ফেলতে পারে। কোনো প্রতিবেদনে আপনি সরাসরি সংশ্লিষ্ট হলে প্ল্যাটফর্মে উপলব্ধ প্রতিউত্তর বা সংশোধন প্রক্রিয়া সম্পর্কে তথ্য ও নির্দেশিকা পৃষ্ঠা দেখুন।'
                : 'Be careful with personal and sensitive information. Do not publish unnecessary phone numbers, identity-document numbers, private addresses, or other information that may create avoidable privacy or safety risks. If a report directly concerns you, review the platform information and guidance for response and correction options.'}
            </p>
            <p className="type-body text-ui-content-secondary">
              {isBn
                ? 'সবাইকে জানাও জরুরি প্রতিক্রিয়া সেবা নয় এবং কোনো সরকারি তদন্ত সংস্থার বিকল্পও নয়। জীবন, নিরাপত্তা বা চলমান অপরাধের তাৎক্ষণিক ঝুঁকি থাকলে ওয়েবসাইটে প্রতিবেদন প্রকাশের অপেক্ষা না করে ৯৯৯ বা সংশ্লিষ্ট কর্তৃপক্ষের সঙ্গে যোগাযোগ করুন।'
                : 'Sobaike Janao is not an emergency-response service and does not replace a government investigative authority. If there is an immediate risk to life or safety, or an ongoing crime, contact 999 or the appropriate authority rather than waiting to publish a report here.'}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="type-h3 text-ui-content-primary">
              {isBn ? 'প্রতিবেদন খোঁজা ও এলাকার তথ্য দেখা' : 'Finding reports and local information'}
            </h3>
            <p className="type-body text-ui-content-secondary">
              {isBn ? (
                <>
                  <Link to={localizedPath('/explore')}>এক্সপ্লোর</Link> থেকে বিভাগ, জেলা ও এলাকা অনুযায়ী প্রকাশিত প্রতিবেদন দেখুন।
                  নির্দিষ্ট বিষয় বা সংশ্লিষ্ট পক্ষ খুঁজতে <Link to={localizedPath('/search')}>অনুসন্ধান</Link> ব্যবহার করুন।
                  নতুন ঘটনা জানাতে <Link to={localizedPath('/report')}>প্রতিবেদন করুন</Link> এবং নীতি, গোপনীয়তা,
                  প্রতিউত্তরের অধিকার ও জরুরি সহায়তার তথ্যের জন্য <Link to={localizedPath('/more')}>তথ্য ও নির্দেশিকা</Link> দেখুন।
                </>
              ) : (
                <>
                  Use <Link to={localizedPath('/explore')}>Explore</Link> to browse published reports by division, district, and area.
                  Use <Link to={localizedPath('/search')}>Search</Link> for a specific topic or reported party.
                  <Link to={localizedPath('/report')}> Submit a report</Link> for a new public-interest incident, and see
                  <Link to={localizedPath('/more')}> information and guidance</Link> for platform policies, privacy, right of response,
                  and emergency-help information.
                </>
              )}
            </p>
          </section>
        </div>
      </details>
    </section>
  );
};
