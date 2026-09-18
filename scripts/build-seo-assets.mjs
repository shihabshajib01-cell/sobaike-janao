import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const SITE_ORIGIN = 'https://shobaikejanao.com';
const DIST_DIR = 'dist';
const BRAND_LOGO = `${SITE_ORIGIN}/brand/icon-512x512.png`;
const DEFAULT_IMAGE = `${SITE_ORIGIN}/brand/og-social-1200x630.png`;

const STATIC_PAGES = [
  {
    path: '/',
    title: 'সবাইকে জানাও | বাংলাদেশের নাগরিক প্রতিবেদন প্ল্যাটফর্ম',
    description:
      'সবাইকে জানাও — বাংলাদেশে জনস্বার্থ সংক্রান্ত সমস্যা ও নাগরিক অভিযোগ দায়িত্বশীলভাবে প্রকাশের মডারেটেড প্ল্যাটফর্ম।',
    socialDescription:
      'সবাইকে জানাও — বাংলাদেশের নাগরিকদের জনস্বার্থের সমস্যা, অভিজ্ঞতা ও অভিযোগ দায়িত্বশীলভাবে প্রকাশ, খোঁজ ও অনুসরণ করার স্বাধীন, নিরাপদ ও মডারেটেড প্ল্যাটফর্ম।',
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
  },
  {
    path: '/issues',
    title: 'নাগরিক প্রতিবেদনের বিষয়সমূহ | সবাইকে জানাও',
    description:
      'জননিরাপত্তা, হয়রানি, চাঁদাবাজি, সড়ক, ইউটিলিটি ও অন্যান্য জনস্বার্থ বিষয় অনুযায়ী প্রকাশিত প্রতিবেদন দেখুন।',
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
  },
  {
    path: '/harassment',
    title: 'হয়রানি ও নির্যাতন সংক্রান্ত প্রতিবেদন | সবাইকে জানাও',
    description:
      'হয়রানি, নির্যাতন, প্রতারণা ও সংশ্লিষ্ট নাগরিক প্রতিবেদন দায়িত্বশীলভাবে প্রকাশ ও অনুসন্ধান করুন।',
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
  },
  {
    path: '/extortion',
    title: 'চাঁদাবাজি ও ঘুষ সংক্রান্ত প্রতিবেদন | সবাইকে জানাও',
    description:
      'চাঁদাবাজি, জোরপূর্বক অর্থ আদায়, ঘুষ ও সংশ্লিষ্ট জনস্বার্থ অভিযোগের প্রকাশিত প্রতিবেদন দেখুন।',
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
  },
  {
    path: '/public-safety',
    title: 'জননিরাপত্তা সংক্রান্ত প্রতিবেদন | সবাইকে জানাও',
    description:
      'চুরি, ডাকাতি, ছিনতাই, মব জাস্টিস ও অন্যান্য জননিরাপত্তা সংক্রান্ত প্রকাশিত নাগরিক প্রতিবেদন দেখুন।',
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
  },
  {
    path: '/road-transport',
    title: 'সড়ক ও যাতায়াত সমস্যা | সবাইকে জানাও',
    description:
      'সড়ক, ট্রাফিক, পরিবহন, দুর্ঘটনা, প্রতিবন্ধকতা ও যাতায়াত সমস্যার প্রকাশিত নাগরিক প্রতিবেদন দেখুন।',
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
  },
  {
    path: '/load-shedding',
    title: 'ইউটিলিটি সমস্যা | সবাইকে জানাও',
    description:
      'লোডশেডিং, গ্যাস সংকট, বিদ্যুৎ বিল ও অন্যান্য ইউটিলিটি সমস্যার প্রকাশিত নাগরিক প্রতিবেদন দেখুন।',
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
  },
  {
    path: '/illegal-occupation',
    title: 'অবৈধ দখল সংক্রান্ত প্রতিবেদন | সবাইকে জানাও',
    description:
      'রাস্তা, ফুটপাত, সরকারি বা ব্যক্তিগত সম্পত্তি ও জনস্থান দখল সংক্রান্ত প্রকাশিত নাগরিক প্রতিবেদন দেখুন।',
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
  },
  {
    path: '/rickshaw',
    title: 'অবৈধ অটো-রিকশা চার্জিং | সবাইকে জানাও',
    description:
      'অবৈধ বা ঝুঁকিপূর্ণ অটো-রিকশা চার্জিং অবস্থান ও সংশ্লিষ্ট প্রকাশিত নাগরিক প্রতিবেদন দেখুন।',
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
  },
  {
    path: '/explore',
    title: 'প্রতিবেদন খুঁজুন ও মানচিত্র | সবাইকে জানাও',
    description:
      'বিভাগ, জেলা ও এলাকা অনুযায়ী বাংলাদেশে প্রকাশিত নাগরিক প্রতিবেদন এবং মানচিত্র দেখুন।',
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
  },
  {
    path: '/more',
    title: 'তথ্য, নীতিমালা ও সহায়তা | সবাইকে জানাও',
    description:
      'প্ল্যাটফর্ম নির্দেশিকা, গোপনীয়তা, প্রতিউত্তরের অধিকার, দায়িত্বশীল প্রকাশ ও জরুরি সহায়তার তথ্য দেখুন।',
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
  },
  {
    path: '/report',
    title: 'ঘটনা বা অভিযোগ জানান | সবাইকে জানাও',
    description:
      'সবাইকে জানাও প্ল্যাটফর্মে জনস্বার্থ সংক্রান্ত ঘটনা বা অভিযোগ প্রাসঙ্গিক তথ্যসহ দায়িত্বশীলভাবে জমা দিন।',
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
  },
  {
    path: '/search',
    title: 'অনুসন্ধান | সবাইকে জানাও',
    description: 'বিষয়, এলাকা বা সংশ্লিষ্ট পক্ষের নাম দিয়ে প্রকাশিত প্রতিবেদন অনুসন্ধান করুন।',
    robots: 'noindex, follow',
    sitemap: false,
  },
];

const STATIC_ENGLISH = {
  '/': {
    title: 'Sobaike Janao | Citizen Reporting Platform',
    description:
      'Sobaike Janao is a moderated citizen reporting platform for responsibly documenting community issues and public-interest concerns in Bangladesh.',
    socialDescription:
      'Sobaike Janao helps people in Bangladesh responsibly publish, discover, and follow moderated public-interest reports, community issues, and citizen concerns.',
  },
  '/issues': {
    title: 'Citizen Reporting Topics | Sobaike Janao',
    description:
      'Browse moderated public-interest reports by topic, including public safety, harassment, extortion, roads, utilities, illegal occupation, and more.',
  },
  '/harassment': {
    title: 'Harassment & Abuse Reports | Sobaike Janao',
    description:
      'Browse moderated citizen reports related to harassment, abuse, deception, and other public-interest safety concerns in Bangladesh.',
  },
  '/extortion': {
    title: 'Extortion & Bribery Reports | Sobaike Janao',
    description:
      'Browse moderated reports about extortion, coercive collections, bribery, and related public-interest concerns across Bangladesh.',
  },
  '/public-safety': {
    title: 'Public Safety Reports | Sobaike Janao',
    description:
      'Browse moderated citizen reports about theft, robbery, snatching, mob violence, and other public-safety concerns across Bangladesh.',
  },
  '/road-transport': {
    title: 'Road & Transport Reports | Sobaike Janao',
    description:
      'Browse moderated reports about roads, traffic, transport, accidents, obstructions, and mobility issues across Bangladesh.',
  },
  '/load-shedding': {
    title: 'Utility Issue Reports | Sobaike Janao',
    description:
      'Browse moderated reports about load shedding, gas shortages, electricity billing, and other utility issues across Bangladesh.',
  },
  '/illegal-occupation': {
    title: 'Illegal Occupation Reports | Sobaike Janao',
    description:
      'Browse moderated citizen reports about illegal occupation of roads, footpaths, public spaces, and property across Bangladesh.',
  },
  '/rickshaw': {
    title: 'Auto-rickshaw Charging Reports | Sobaike Janao',
    description:
      'Browse moderated reports about illegal or unsafe auto-rickshaw charging locations and related public-interest incidents.',
  },
  '/explore': {
    title: 'Explore Reports & Map | Sobaike Janao',
    description:
      'Explore moderated citizen reports and incident maps across Bangladesh by division, district, area, and reporting topic.',
  },
  '/more': {
    title: 'Information, Policies & Help | Sobaike Janao',
    description:
      'Read platform guidelines, privacy information, right-of-response standards, responsible publishing guidance, and emergency help.',
  },
  '/report': {
    title: 'Report an Incident | Sobaike Janao',
    description:
      'Submit a public-interest incident or complaint responsibly with relevant details, context, and supporting information.',
  },
  '/search': {
    title: 'Search Reports | Sobaike Janao',
    description:
      'Search published citizen reports by topic, location, or reported party on the Sobaike Janao public-interest platform.',
  },
};

const htmlEscape = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const xmlEscape = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const cleanText = (value, fallback = '') =>
  String(value ?? fallback)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);

const SEO_TEST_MARKER_PATTERN =
  /(test only|system verification|test post|পরীক্ষামূলক পোস্ট)/i;

function truncateSeoText(value, maxLength) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  if (maxLength <= 1) return clean.slice(0, maxLength);
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildBrandedSeoTitle(title, brand = 'সবাইকে জানাও', maxLength = 60) {
  const cleanTitle = String(title || '').replace(/\s+/g, ' ').trim();
  const cleanBrand = String(brand || '').replace(/\s+/g, ' ').trim();
  const suffix = cleanBrand ? ` | ${cleanBrand}` : '';
  const available = Math.max(1, maxLength - suffix.length);
  return `${truncateSeoText(cleanTitle, available)}${suffix}`;
}

function normalizeSeoDescription(value, language = 'bn', minLength = 90, maxLength = 155) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (!clean) {
    return language === 'bn'
      ? 'সবাইকে জানাও প্ল্যাটফর্মে প্রকাশিত নাগরিক প্রতিবেদন, প্রাসঙ্গিক তথ্য, এলাকা, উৎস ও আপডেট দেখুন।'
      : 'Read this published citizen report on Sobaike Janao with its relevant details, location, sources, and updates.';
  }

  let result = clean;
  if (result.length < minLength) {
    const suffix =
      language === 'bn'
        ? ' বিস্তারিত, এলাকা, উৎস ও পরবর্তী আপডেট সবাইকে জানাও প্ল্যাটফর্মে দেখুন।'
        : ' Review the relevant details, location, sources, and updates on Sobaike Janao.';
    result = `${result.replace(/[।.!?]+$/, '')}.${suffix}`;
  }
  return truncateSeoText(result, maxLength);
}

function isSeoIndexableReport(report) {
  const haystack = [
    report.titleBn,
    report.titleEn,
    report.summaryBn,
    report.summaryEn,
    report.descriptionBn,
    report.descriptionEn,
  ]
    .filter(Boolean)
    .join(' ');

  const longestDescription = Math.max(
    String(report.summaryBn || report.descriptionBn || '').trim().length,
    String(report.summaryEn || report.descriptionEn || '').trim().length
  );

  return !SEO_TEST_MARKER_PATTERN.test(haystack) && longestDescription >= 50;
}

const canonicalUrl = (path) =>
  path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path.replace(/\/$/, '')}`;

function englishPath(path) {
  const normalized = path === '/' ? '/' : `/${String(path).replace(/^\/+|\/+$/g, '')}`;
  return normalized === '/' ? '/en' : `/en${normalized}`;
}

function localizedUrl(path, language) {
  return language === 'en'
    ? `${SITE_ORIGIN}${englishPath(path)}${path === '/' ? '/' : ''}`
    : canonicalUrl(path);
}

function localizePage(page, language) {
  const logicalPath = page.path;
  const staticEnglish = STATIC_ENGLISH[logicalPath];
  const title =
    language === 'en'
      ? page.titleEn || staticEnglish?.title || page.title
      : page.title;
  const description =
    language === 'en'
      ? page.descriptionEn || staticEnglish?.description || page.description
      : page.description;
  const socialDescription =
    language === 'en'
      ? page.socialDescriptionEn || staticEnglish?.socialDescription || description
      : page.socialDescription || description;

  return {
    ...page,
    logicalPath,
    language,
    path: language === 'en' ? englishPath(logicalPath) : logicalPath,
    title,
    description,
    socialDescription,
  };
}

function injectStaticFallback(html, page) {
  const language = page.language || 'bn';
  const logicalPath = page.logicalPath || page.path;
  const isEnglish = language === 'en';

  // The source template already contains the full Bangla homepage fallback.
  if (logicalPath === '/' && !isEnglish) return html;

  const brandPattern = isEnglish
    ? /\s*\|\s*Sobaike Janao\s*$/
    : /\s*\|\s*সবাইকে জানাও\s*$/;
  const heading = htmlEscape(String(page.title || '').replace(brandPattern, ''));
  const description = htmlEscape(page.description || '');
  const href = (path) => (isEnglish ? englishPath(path) : path);

  if (logicalPath === '/' && isEnglish) {
    const fallback = `
      <!-- SEO_FALLBACK_START -->
      <main id="seo-static-fallback" class="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 lg:px-8">
        <header class="space-y-3">
          <h1>${heading}</h1>
          <p>${description}</p>
        </header>

        <nav aria-label="Main pages" class="mt-6">
          <p><strong>Quick links:</strong></p>
          <p>
            <a href="${href('/')}">Home</a> ·
            <a href="${href('/issues')}">Topics</a> ·
            <a href="${href('/report')}">Submit a report</a> ·
            <a href="${href('/explore')}">Explore map and areas</a> ·
            <a href="${href('/search')}">Search</a> ·
            <a href="${href('/more')}">Information and guidance</a>
          </p>
        </nav>

        <section class="mt-8 space-y-3">
          <h2>What can be reported</h2>
          <p>
            Sobaike Janao is an independent, moderated public-interest reporting platform for people in Bangladesh.
            Reports can cover public safety, harassment and abuse, extortion and bribery, road and transport
            problems, utility issues, illegal occupation, unsafe auto-rickshaw charging, and other community
            concerns. A useful report should explain what happened, where and when it happened, and include
            relevant supporting information when it is appropriate and safe to publish.
          </p>
          <p>
            Browse <a href="${href('/public-safety')}">public safety</a>,
            <a href="${href('/harassment')}">harassment and abuse</a>,
            <a href="${href('/extortion')}">extortion and bribery</a>,
            <a href="${href('/road-transport')}">road and transport</a>,
            <a href="${href('/load-shedding')}">utility issues</a>,
            <a href="${href('/illegal-occupation')}">illegal occupation</a>, and
            <a href="${href('/rickshaw')}">auto-rickshaw charging</a> reports.
          </p>
        </section>

        <section class="mt-8 space-y-3">
          <h2>Responsible reporting and verification</h2>
          <p>
            Submit information accurately, in good faith, and with enough context for readers to understand the
            public-interest issue. Do not present assumptions as confirmed facts, use the platform to make
            knowingly baseless accusations, or expose unnecessary private information. Moderation helps keep
            reports clear and relevant, and later updates or responses from relevant parties may add important
            context to a published report.
          </p>
          <p>
            A published report is not, by itself, a court judgment, an official government determination, or proof
            of criminal liability. Readers should consider the report description, location, publication date,
            available sources, supporting material, responses, and subsequent updates together.
          </p>
        </section>

        <section class="mt-8 space-y-3">
          <h2>Privacy, response and safe use</h2>
          <p>
            Avoid publishing unnecessary phone numbers, identity-document numbers, private addresses, or other
            sensitive information that could create avoidable privacy or safety risks. If a report directly
            concerns you, review the platform guidance for response and correction options. Sobaike Janao is not
            an emergency-response service and does not replace a government investigative authority.
          </p>
          <p>
            If there is an immediate risk to life or safety, or an ongoing crime, contact 999 or the appropriate
            authority instead of waiting to publish a report on the website.
          </p>
        </section>

        <section class="mt-8 space-y-3">
          <h2>Find reports and local information</h2>
          <p>
            Use <a href="${href('/explore')}">Explore</a> to browse published reports by division, district and
            area. Use <a href="${href('/search')}">Search</a> for a topic or reported party.
            <a href="${href('/report')}">Submit a report</a> for a new public-interest incident and see
            <a href="${href('/more')}">information and guidance</a> for platform rules, privacy, right of response
            and emergency-help information.
          </p>
        </section>
      </main>
      <!-- SEO_FALLBACK_END -->`;

    return html.replace(
      /<!-- SEO_FALLBACK_START -->[\s\S]*?<!-- SEO_FALLBACK_END -->/,
      fallback.trim()
    );
  }

  const contextCopy =
    page.type === 'article'
      ? isEnglish
        ? 'This is a public-interest report published on Sobaike Janao. Read the report together with its publication date, location, available sources, supporting information, responses, and later updates. A published report is not by itself a court judgment, an official government decision, or proof of criminal liability.'
        : 'এটি সবাইকে জানাও প্ল্যাটফর্মে প্রকাশিত একটি জনস্বার্থ প্রতিবেদন। প্রতিবেদনটি পড়ার সময় ঘটনার বিবরণ, প্রকাশের তারিখ, এলাকা, উপলব্ধ উৎস এবং পরবর্তী আপডেট একসঙ্গে বিবেচনা করুন। প্রকাশিত কোনো প্রতিবেদন নিজে থেকে আদালতের রায়, সরকারি সিদ্ধান্ত বা অপরাধ প্রমাণের সমতুল্য নয়।'
      : isEnglish
        ? 'This page contains moderated public-interest citizen reports for the selected topic or area. Review each report together with its description, location, publication time, sources, supporting information, and available updates. For emergencies, contact 999 or the appropriate official service.'
        : 'এই পৃষ্ঠায় সংশ্লিষ্ট বিষয়ের প্রকাশিত নাগরিক প্রতিবেদন দেখা যায়। সঠিক প্রেক্ষাপট বোঝার জন্য প্রতিটি প্রতিবেদনের শিরোনাম, বিবরণ, এলাকা, প্রকাশের সময়, উৎস এবং উপলব্ধ আপডেট দেখুন। জনস্বার্থের তথ্য দায়িত্বশীলভাবে ব্যবহার করুন এবং জরুরি সহায়তার জন্য ৯৯৯ অথবা সংশ্লিষ্ট সরকারি হটলাইনে যোগাযোগ করুন।';

  const fallback = `
      <!-- SEO_FALLBACK_START -->
      <main id="seo-static-fallback" class="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 lg:px-8">
        <header class="space-y-3">
          <h1>${heading}</h1>
          <p>${description}</p>
        </header>

        <nav aria-label="${isEnglish ? 'Main pages' : 'প্রধান পৃষ্ঠা'}" class="mt-6">
          <p><strong>${isEnglish ? 'Quick links:' : 'দ্রুত লিংক:'}</strong></p>
          <p>
            <a href="${href('/')}">${isEnglish ? 'Home' : 'হোম'}</a> ·
            <a href="${href('/issues')}">${isEnglish ? 'Topics' : 'বিষয়সমূহ'}</a> ·
            <a href="${href('/report')}">${isEnglish ? 'Submit a report' : 'প্রতিবেদন করুন'}</a> ·
            <a href="${href('/explore')}">${isEnglish ? 'Explore' : 'মানচিত্র ও এলাকা'}</a> ·
            <a href="${href('/search')}">${isEnglish ? 'Search' : 'অনুসন্ধান'}</a> ·
            <a href="${href('/more')}">${isEnglish ? 'Information' : 'তথ্য ও নির্দেশিকা'}</a>
          </p>
        </nav>

        <section class="mt-8 space-y-3">
          <h2>${isEnglish ? 'About this page' : 'পৃষ্ঠা সম্পর্কে'}</h2>
          <p>${htmlEscape(contextCopy)}</p>
        </section>

        <section class="mt-8 space-y-3">
          <h2>${isEnglish ? 'Related reports and topics' : 'সম্পর্কিত প্রতিবেদন ও বিষয়'}</h2>
          <p>
            <a href="${href('/public-safety')}">${isEnglish ? 'Public safety' : 'জননিরাপত্তা'}</a>,
            <a href="${href('/harassment')}">${isEnglish ? 'harassment and abuse' : 'হয়রানি ও নির্যাতন'}</a>,
            <a href="${href('/extortion')}">${isEnglish ? 'extortion and bribery' : 'চাঁদাবাজি ও ঘুষ'}</a>,
            <a href="${href('/road-transport')}">${isEnglish ? 'road and transport' : 'সড়ক ও যাতায়াত'}</a>,
            <a href="${href('/load-shedding')}">${isEnglish ? 'utility issues' : 'ইউটিলিটি সমস্যা'}</a>,
            <a href="${href('/illegal-occupation')}">${isEnglish ? 'illegal occupation' : 'অবৈধ দখল'}</a>
            ${isEnglish ? 'and' : 'এবং'}
            <a href="${href('/rickshaw')}">${isEnglish ? 'auto-rickshaw charging' : 'অবৈধ অটো-রিকশা চার্জিং'}</a>.
          </p>
        </section>
      </main>
      <!-- SEO_FALLBACK_END -->`;

  return html.replace(
    /<!-- SEO_FALLBACK_START -->[\s\S]*?<!-- SEO_FALLBACK_END -->/,
    fallback.trim()
  );
}

function injectMeta(template, page) {
  const language = page.language || 'bn';
  const logicalPath = page.logicalPath || page.path;
  const canonical = localizedUrl(logicalPath, language);
  const bnCanonical = localizedUrl(logicalPath, 'bn');
  const enCanonical = localizedUrl(logicalPath, 'en');
  const titleText = truncateSeoText(page.title, 60);
  const descriptionText = normalizeSeoDescription(page.description, language);
  const socialDescriptionText = page.socialDescription
    ? truncateSeoText(page.socialDescription, 160)
    : descriptionText;
  const title = htmlEscape(titleText);
  const description = htmlEscape(descriptionText);
  const socialDescription = htmlEscape(socialDescriptionText);
  const robots = htmlEscape(page.robots || 'index, follow, max-image-preview:large');
  const type = page.type === 'article' ? 'article' : 'website';

  let html = template
    .replace(
      /<html lang="[^"]+">/,
      `<html lang="${language === 'en' ? 'en' : 'bn'}">`
    )
    .replace(/<title>.*?<\/title>/s, `<title>${title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${description}" />`
    )
    .replace(
      /<meta name="robots" content="[^"]*" \/>/,
      `<meta name="robots" content="${robots}" />`
    )
    .replace(
      /<meta name="googlebot" content="[^"]*" \/>/,
      `<meta name="googlebot" content="${robots}" />`
    )
    .replace(
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${htmlEscape(canonical)}" />`
    )
    .replace(
      /<link rel="alternate" hreflang="bn-BD" href="[^"]*" \/>/,
      `<link rel="alternate" hreflang="bn-BD" href="${htmlEscape(bnCanonical)}" />`
    )
    .replace(
      /<link rel="alternate" hreflang="en" href="[^"]*" \/>/,
      `<link rel="alternate" hreflang="en" href="${htmlEscape(enCanonical)}" />`
    )
    .replace(
      /<link rel="alternate" hreflang="x-default" href="[^"]*" \/>/,
      `<link rel="alternate" hreflang="x-default" href="${htmlEscape(bnCanonical)}" />`
    )
    .replace(
      /<meta property="og:title" content="[^"]*" \/>/,
      `<meta property="og:title" content="${title}" />`
    )
    .replace(
      /<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${socialDescription}" />`
    )
    .replace(
      /<meta property="og:type" content="[^"]*" \/>/,
      `<meta property="og:type" content="${type}" />`
    )
    .replace(
      /<meta property="og:url" content="[^"]*" \/>/,
      `<meta property="og:url" content="${htmlEscape(canonical)}" />`
    )
    .replace(
      /<meta property="og:locale" content="[^"]*" \/>/,
      `<meta property="og:locale" content="${language === 'en' ? 'en_US' : 'bn_BD'}" />`
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*" \/>/,
      `<meta name="twitter:title" content="${title}" />`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*" \/>/,
      `<meta name="twitter:description" content="${socialDescription}" />`
    );

  if (page.type === 'article' && page.publishedAt) {
    const articleMeta = [
      `    <meta property="article:published_time" content="${htmlEscape(page.publishedAt)}" />`,
      page.modifiedAt
        ? `    <meta property="article:modified_time" content="${htmlEscape(page.modifiedAt)}" />`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
    html = html.replace('</head>', `${articleMeta}\n  </head>`);
  }

  const pageSchema =
    page.type === 'article'
      ? {
          '@type': 'Article',
          '@id': `${canonical}#webpage`,
          url: canonical,
          headline: titleText,
          description: descriptionText,
          inLanguage: language === 'en' ? 'en' : 'bn-BD',
          mainEntityOfPage: { '@id': `${canonical}#webpage` },
          isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
          ...(page.publishedAt ? { datePublished: page.publishedAt } : {}),
          ...(page.modifiedAt ? { dateModified: page.modifiedAt } : {}),
          image: DEFAULT_IMAGE,
        }
      : {
          '@type': page.collection ? 'CollectionPage' : 'WebPage',
          '@id': `${canonical}#webpage`,
          url: canonical,
          name: titleText,
          description: descriptionText,
          inLanguage: language === 'en' ? 'en' : 'bn-BD',
          isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        };

  const organizationId = `${SITE_ORIGIN}/#organization`;
  const websiteId = `${SITE_ORIGIN}/#website`;

  const structured = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        url: `${SITE_ORIGIN}/`,
        name: 'Sobaike Janao',
        alternateName: 'সবাইকে জানাও',
        logo: {
          '@type': 'ImageObject',
          url: BRAND_LOGO,
        },
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: `${SITE_ORIGIN}/`,
        name: 'Sobaike Janao',
        alternateName: 'সবাইকে জানাও',
        publisher: { '@id': organizationId },
      },
      {
        ...pageSchema,
        publisher: { '@id': organizationId },
      },
    ],
  };

  html = html.replace(
    /<script type="application\/ld\+json" id="seo-jsonld">[\s\S]*?<\/script>/,
    `<script type="application/ld+json" id="seo-jsonld">${JSON.stringify(structured)}</script>`
  );

  return injectStaticFallback(html, page);
}

async function writeRouteHtml(template, page) {
  if (page.path === '/') return;
  const safePath = page.path.replace(/^\/+|\/+$/g, '');
  if (!safePath) return;
  const target = join(DIST_DIR, safePath, 'index.html');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, injectMeta(template, page), 'utf8');
}

async function loadDistricts() {
  const source = await readFile('src/data/districts.ts', 'utf8');
  const block = source.match(/export const BANGLADESH_DISTRICTS:[\s\S]*?= \[([\s\S]*?)\];/);
  if (!block) return [];

  const rows = [];
  const rowRegex =
    /\{\s*id:\s*'([^']+)'\s*,\s*nameBn:\s*'([^']+)'\s*,\s*nameEn:\s*(?:"([^"]+)"|'([^']+)')/g;

  for (const match of block[1].matchAll(rowRegex)) {
    rows.push({
      id: match[1],
      nameBn: match[2],
      nameEn: match[3] || match[4] || match[1],
    });
  }
  return rows;
}

async function fetchSupabaseJson(path, options = {}) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase SEO fetch failed (${response.status}) for ${path}`);
  }

  return response.json();
}

async function loadPublishedReports() {
  try {
    const rows = await fetchSupabaseJson('rpc/get_public_published_reports', {
      method: 'POST',
      body: '{}',
    });
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.warn('[seo-build] Published reports unavailable:', error.message);
    return [];
  }
}

async function loadActiveSegments() {
  try {
    const rows = await fetchSupabaseJson(
      'segments?select=id,slug,name_bn,name_en,description_bn,description_en,active&active=eq.true&order=sort_order.asc'
    );
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.warn('[seo-build] Active segments unavailable:', error.message);
    return [];
  }
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function resolveDistrictId(raw, districts) {
  const needle = normalize(raw);
  if (!needle) return null;
  const match = districts.find(
    (district) =>
      normalize(district.id) === needle ||
      normalize(district.nameEn) === needle ||
      normalize(district.nameBn) === needle
  );
  return match?.id || null;
}

function reportPage(report) {
  const id = cleanText(report.id);
  if (!id) return null;
  const rawTitleBn = cleanText(report.titleBn || report.titleEn || id);
  const rawTitleEn = cleanText(report.titleEn || report.titleBn || id);
  const rawDescriptionBn = cleanText(
    report.summaryBn ||
      report.descriptionBn ||
      report.summaryEn ||
      report.descriptionEn ||
      'সবাইকে জানাও প্ল্যাটফর্মে প্রকাশিত নাগরিক প্রতিবেদন।'
  );
  const rawDescriptionEn = cleanText(
    report.summaryEn ||
      report.descriptionEn ||
      report.summaryBn ||
      report.descriptionBn ||
      'Published citizen report on Sobaike Janao.'
  );
  const indexable = isSeoIndexableReport(report);

  return {
    path: `/report-detail/${encodeURIComponent(id)}`,
    title: buildBrandedSeoTitle(rawTitleBn),
    titleEn: buildBrandedSeoTitle(rawTitleEn, 'Sobaike Janao'),
    description: normalizeSeoDescription(rawDescriptionBn, 'bn'),
    descriptionEn: normalizeSeoDescription(rawDescriptionEn, 'en'),
    robots: indexable
      ? 'index, follow, max-image-preview:large'
      : 'noindex, follow',
    sitemap: indexable,
    type: 'article',
    publishedAt: report.publishedAt || null,
    modifiedAt: report.updatedAt || report.publishedAt || null,
  };
}

function subjectPage(subject) {
  const name = cleanText(subject);
  return {
    path: `/subject/${encodeURIComponent(subject)}`,
    title: buildBrandedSeoTitle(`${name} সংক্রান্ত প্রতিবেদন`),
    titleEn: buildBrandedSeoTitle(`Reports related to ${name}`, 'Sobaike Janao'),
    description: normalizeSeoDescription(
      `${name} সংক্রান্ত প্রকাশিত নাগরিক প্রতিবেদন ও সংশ্লিষ্ট পক্ষের বক্তব্য দেখুন।`,
      'bn'
    ),
    descriptionEn: normalizeSeoDescription(
      `Browse published citizen reports and available responses related to ${name} on Sobaike Janao.`,
      'en'
    ),
    robots: 'noindex, follow',
    sitemap: false,
    collection: true,
  };
}

function dynamicCategoryPage(segment) {
  const slug = cleanText(segment.slug || segment.id).replace(/^\/category\//, '').replace(/^\//, '');
  if (!slug) return null;

  // Do not publish a second /category/... URL when this taxonomy item already has
  // an established top-level canonical route (for example /load-shedding).
  const establishedStaticPath = `/${slug}`;
  if (STATIC_PAGES.some((page) => page.path === establishedStaticPath)) {
    return null;
  }

  const path = `/category/${encodeURIComponent(slug)}`;
  const nameBn = cleanText(segment.name_bn || segment.name_en || segment.id);
  const nameEn = cleanText(segment.name_en || segment.name_bn || segment.id);
  const descriptionBn = cleanText(
    segment.description_bn ||
      `${nameBn} সংক্রান্ত প্রকাশিত নাগরিক প্রতিবেদন, এলাকা, উৎস ও সর্বশেষ আপডেট দেখুন।`
  );
  const descriptionEn = cleanText(
    segment.description_en ||
      `Browse moderated citizen reports, locations, sources, and the latest updates about ${nameEn}.`
  );

  return {
    path,
    title: buildBrandedSeoTitle(nameBn),
    titleEn: buildBrandedSeoTitle(nameEn, 'Sobaike Janao'),
    description: normalizeSeoDescription(descriptionBn, 'bn'),
    descriptionEn: normalizeSeoDescription(descriptionEn, 'en'),
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
    collection: true,
  };
}

async function main() {
  const template = await readFile(join(DIST_DIR, 'index.html'), 'utf8');
  const districts = await loadDistricts();
  const [reports, segments] = await Promise.all([loadPublishedReports(), loadActiveSegments()]);

  const basePages = [...STATIC_PAGES];
  const seenPaths = new Set(basePages.map((page) => page.path));

  for (const segment of segments) {
    const page = dynamicCategoryPage(segment);
    if (page && !seenPaths.has(page.path)) {
      basePages.push(page);
      seenPaths.add(page.path);
    }
  }

  const districtIdsWithReports = new Set();

  for (const report of reports) {
    const page = reportPage(report);
    if (page && !seenPaths.has(page.path)) {
      basePages.push(page);
      seenPaths.add(page.path);
    }

    const districtId = resolveDistrictId(report.district, districts);
    if (districtId) districtIdsWithReports.add(districtId);

    const subject = cleanText(report.reportedSubject);
    if (subject) {
      const subjectRoute = subjectPage(subject);
      if (!seenPaths.has(subjectRoute.path)) {
        basePages.push(subjectRoute);
        seenPaths.add(subjectRoute.path);
      }
    }
  }

  for (const district of districts) {
    if (!districtIdsWithReports.has(district.id)) continue;
    const path = `/location/${encodeURIComponent(district.id)}`;
    if (seenPaths.has(path)) continue;

    basePages.push({
      path,
      title: buildBrandedSeoTitle(`${district.nameBn} এলাকার প্রতিবেদন`),
      titleEn: buildBrandedSeoTitle(`Reports from ${district.nameEn}`, 'Sobaike Janao'),
      description: normalizeSeoDescription(
        `${district.nameBn} এলাকার প্রকাশিত নাগরিক প্রতিবেদন, জনস্বার্থের ঘটনা, সংশ্লিষ্ট বিষয় ও সর্বশেষ আপডেট দেখুন।`,
        'bn'
      ),
      descriptionEn: normalizeSeoDescription(
        `Browse published citizen reports, public-interest incidents, related topics, and the latest updates from ${district.nameEn}, Bangladesh.`,
        'en'
      ),
      robots: 'index, follow, max-image-preview:large',
      sitemap: true,
      collection: true,
    });
    seenPaths.add(path);
  }

  const pages = basePages.flatMap((page) => [
    localizePage(page, 'bn'),
    localizePage(page, 'en'),
  ]);

  const rootPage = pages.find(
    (page) => page.language === 'bn' && page.logicalPath === '/'
  );
  if (rootPage) {
    await writeFile(join(DIST_DIR, 'index.html'), injectMeta(template, rootPage), 'utf8');
  }

  await Promise.all(pages.map((page) => writeRouteHtml(template, page)));

  const sitemapEntries = pages
    .filter((page) => page.sitemap)
    .map((page) => {
      const lines = [
        '  <url>',
        `    <loc>${xmlEscape(localizedUrl(page.logicalPath, page.language))}</loc>`,
        `    <xhtml:link rel="alternate" hreflang="bn-BD" href="${xmlEscape(localizedUrl(page.logicalPath, 'bn'))}" />`,
        `    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(localizedUrl(page.logicalPath, 'en'))}" />`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(localizedUrl(page.logicalPath, 'bn'))}" />`,
      ];
      const freshness = page.modifiedAt || page.publishedAt;
      if (freshness) {
        lines.push(`    <lastmod>${new Date(freshness).toISOString().slice(0, 10)}</lastmod>`);
      }
      lines.push('  </url>');
      return lines.join('\n');
    });

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...sitemapEntries,
    '</urlset>',
    '',
  ].join('\n');

  await writeFile(join(DIST_DIR, 'sitemap.xml'), sitemap, 'utf8');

  const robots = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n');

  await writeFile(join(DIST_DIR, 'robots.txt'), robots, 'utf8');

  console.log(
    `[seo-build] Generated ${pages.length - 1} route entry pages and ${sitemapEntries.length} sitemap URLs.`
  );
}

main().catch((error) => {
  console.error('[seo-build] Failed:', error);
  process.exitCode = 1;
});
