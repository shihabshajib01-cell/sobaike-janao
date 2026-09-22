/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SeoPageType = 'website' | 'collection' | 'article';

export interface SeoBreadcrumb {
  name: string;
  path: string;
}

export interface SeoMetadata {
  title: string;
  description: string;
  robots?: string;
  ogType?: 'website' | 'article';
  ogSiteName?: string;
  canonicalPath?: string;
  image?: string;
  imageAlt?: string;
  socialDescription?: string;
  pageType?: SeoPageType;
  publishedTime?: string;
  modifiedTime?: string;
  breadcrumbs?: SeoBreadcrumb[];
}

export const SITE_ORIGIN = 'https://shobaikejanao.com';

export const BRAND_NAME = {
  bn: 'সবাইকে জানাও',
  en: 'Sobaike Janao',
} as const;

const BRAND_ALTERNATE_NAMES = ['সবাইকে জানাও', 'shobaikejanao.com'] as const;
const ENTITY_DESCRIPTION =
  'Independent, moderated citizen-reporting and public-interest information platform for Bangladesh.';

const DEFAULT_SOCIAL_IMAGE = '/brand/og-social-1200x630.png';
const HOME_BN_TITLE = 'Sobaike Janao | সবাইকে জানাও | নাগরিক প্রতিবেদন প্ল্যাটফর্ম';

const SEO_TEST_MARKER_PATTERN =
  /(test only|system verification|test post|পরীক্ষামূলক পোস্ট)/i;

function truncateSeoText(value: string, maxLength: number): string {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  if (maxLength <= 1) return clean.slice(0, maxLength);
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildBrandedSeoTitle(
  title: string,
  brand: string,
  maxLength = 60
): string {
  const cleanTitle = String(title || '').replace(/\s+/g, ' ').trim();
  const cleanBrand = String(brand || '').replace(/\s+/g, ' ').trim();
  const suffix = cleanBrand ? ` | ${cleanBrand}` : '';
  const available = Math.max(1, maxLength - suffix.length);
  return `${truncateSeoText(cleanTitle, available)}${suffix}`;
}

export function buildReportSeoTitle(
  title: string,
  brand: string,
  reportId: string,
  maxLength = 60
): string {
  const shortId = String(reportId || '').replace(/^SJ-\d{4}-/i, '').slice(-6);
  const discriminator = shortId ? ` · ${shortId}` : '';
  const cleanBrand = String(brand || '').replace(/\s+/g, ' ').trim();
  const suffix = `${discriminator}${cleanBrand ? ` | ${cleanBrand}` : ''}`;
  const cleanTitle = String(title || '').replace(/\s+/g, ' ').trim();
  const available = Math.max(1, maxLength - suffix.length);
  return `${truncateSeoText(cleanTitle, available)}${suffix}`;
}

export function normalizeSeoDescription(
  value: string,
  language: 'bn' | 'en',
  minLength = 90,
  maxLength = 155
): string {
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

  if (result.length < minLength) {
    result +=
      language === 'bn'
        ? ' জনস্বার্থের প্রেক্ষাপট ও সর্বশেষ তথ্যও যাচাই করুন।'
        : ' Check the public-interest context and latest published information as well.';
  }

  return truncateSeoText(result, maxLength);
}

export function isSeoIndexableReportContent(
  titleBn?: string | null,
  titleEn?: string | null,
  descriptionBn?: string | null,
  descriptionEn?: string | null
): boolean {
  const haystack = [titleBn, titleEn, descriptionBn, descriptionEn]
    .filter(Boolean)
    .join(' ');
  const longestDescription = Math.max(
    String(descriptionBn || '').trim().length,
    String(descriptionEn || '').trim().length
  );

  return !SEO_TEST_MARKER_PATTERN.test(haystack) && longestDescription >= 50;
}

export const DEFAULT_FALLBACK_SEO: Record<'bn' | 'en', SeoMetadata> = {
  bn: {
    title: HOME_BN_TITLE,
    description:
      'Sobaike Janao (সবাইকে জানাও) বাংলাদেশের স্বাধীন, মডারেটেড নাগরিক প্রতিবেদন ও জনস্বার্থ তথ্য প্ল্যাটফর্ম—বিষয় ও এলাকা অনুযায়ী প্রতিবেদন দেখুন ও ঘটনা জানান।',
    socialDescription:
      'সবাইকে জানাও — বাংলাদেশের নাগরিকদের জনস্বার্থের সমস্যা, অভিজ্ঞতা ও অভিযোগ দায়িত্বশীলভাবে প্রকাশ, খোঁজ ও অনুসরণ করার স্বাধীন, নিরাপদ ও মডারেটেড প্ল্যাটফর্ম।',
    robots: 'index, follow, max-image-preview:large',
    ogType: 'website',
    ogSiteName: 'সবাইকে জানাও',
    canonicalPath: '/',
    pageType: 'website',
  },
  en: {
    title: 'Sobaike Janao | Citizen Reporting Platform',
    description:
      'Sobaike Janao is an independent, moderated citizen-reporting and public-interest information platform for Bangladesh, organized by topic and area.',
    robots: 'index, follow, max-image-preview:large',
    ogType: 'website',
    ogSiteName: 'Sobaike Janao',
    canonicalPath: '/',
    pageType: 'website',
  },
};

const routeSeo = (
  bn: Pick<SeoMetadata, 'title' | 'description' | 'socialDescription'>,
  en: Pick<SeoMetadata, 'title' | 'description' | 'socialDescription'>,
  canonicalPath: string,
  pageType: SeoPageType = 'website',
  robots = 'index, follow, max-image-preview:large'
): Record<'bn' | 'en', SeoMetadata> => ({
  bn: {
    ...bn,
    robots,
    ogType: pageType === 'article' ? 'article' : 'website',
    ogSiteName: BRAND_NAME.bn,
    canonicalPath,
    pageType,
  },
  en: {
    ...en,
    robots,
    ogType: pageType === 'article' ? 'article' : 'website',
    ogSiteName: BRAND_NAME.en,
    canonicalPath,
    pageType,
  },
});

export const STATIC_ROUTE_SEO: Record<string, Record<'bn' | 'en', SeoMetadata>> = {
  '/': routeSeo(
    {
      title: HOME_BN_TITLE,
      description:
        'Sobaike Janao (সবাইকে জানাও) বাংলাদেশের স্বাধীন, মডারেটেড নাগরিক প্রতিবেদন ও জনস্বার্থ তথ্য প্ল্যাটফর্ম—বিষয় ও এলাকা অনুযায়ী প্রতিবেদন দেখুন ও ঘটনা জানান।',
      socialDescription:
        'সবাইকে জানাও — বাংলাদেশের নাগরিকদের জনস্বার্থের সমস্যা, অভিজ্ঞতা ও অভিযোগ দায়িত্বশীলভাবে প্রকাশ, খোঁজ ও অনুসরণ করার স্বাধীন, নিরাপদ ও মডারেটেড প্ল্যাটফর্ম।',
    },
    {
      title: 'Sobaike Janao | Citizen Reporting Platform',
      description:
        'Sobaike Janao is an independent, moderated citizen-reporting and public-interest information platform for Bangladesh, organized by topic and area.',
    },
    '/'
  ),
  '/issues': routeSeo(
    {
      title: 'নাগরিক প্রতিবেদনের বিষয়সমূহ | সবাইকে জানাও',
      description:
        'জননিরাপত্তা, হয়রানি, চাঁদাবাজি, সড়ক, ইউটিলিটি ও অন্যান্য জনস্বার্থ বিষয় অনুযায়ী প্রকাশিত প্রতিবেদন দেখুন।',
    },
    {
      title: 'Citizen Reporting Topics | Sobaike Janao',
      description:
        'Browse moderated public-interest reports by topic, including public safety, harassment, extortion, roads, utilities, and more.',
    },
    '/issues',
    'collection'
  ),
  '/harassment': routeSeo(
    {
      title: 'হয়রানি ও নির্যাতন সংক্রান্ত প্রতিবেদন | সবাইকে জানাও',
      description:
        'হয়রানি, নির্যাতন, প্রতারণা ও সংশ্লিষ্ট নাগরিক প্রতিবেদন দায়িত্বশীলভাবে প্রকাশ ও অনুসন্ধান করুন।',
    },
    {
      title: 'Harassment & Abuse Reports | Sobaike Janao',
      description:
        'Browse and submit moderated citizen reports related to harassment, abuse, deception, and connected concerns.',
    },
    '/harassment',
    'collection'
  ),
  '/extortion': routeSeo(
    {
      title: 'চাঁদাবাজি ও ঘুষ সংক্রান্ত প্রতিবেদন | সবাইকে জানাও',
      description:
        'চাঁদাবাজি, জোরপূর্বক অর্থ আদায়, ঘুষ ও সংশ্লিষ্ট জনস্বার্থ অভিযোগের প্রকাশিত প্রতিবেদন দেখুন।',
    },
    {
      title: 'Extortion & Bribery Reports | Sobaike Janao',
      description:
        'Browse moderated public reports about extortion, coercive collections, bribery, and related public-interest concerns.',
    },
    '/extortion',
    'collection'
  ),
  '/public-safety': routeSeo(
    {
      title: 'জননিরাপত্তা সংক্রান্ত প্রতিবেদন | সবাইকে জানাও',
      description:
        'চুরি, ডাকাতি, ছিনতাই, মব জাস্টিস ও অন্যান্য জননিরাপত্তা সংক্রান্ত প্রকাশিত নাগরিক প্রতিবেদন দেখুন।',
    },
    {
      title: 'Public Safety Reports | Sobaike Janao',
      description:
        'Browse moderated citizen reports about theft, robbery, snatching, mob violence, and other public-safety concerns.',
    },
    '/public-safety',
    'collection'
  ),
  '/road-transport': routeSeo(
    {
      title: 'সড়ক ও যাতায়াত সমস্যা | সবাইকে জানাও',
      description:
        'সড়ক, ট্রাফিক, পরিবহন, দুর্ঘটনা, প্রতিবন্ধকতা ও যাতায়াত সমস্যার প্রকাশিত নাগরিক প্রতিবেদন দেখুন।',
    },
    {
      title: 'Road & Transport Reports | Sobaike Janao',
      description:
        'Browse moderated reports about roads, traffic, transport, accidents, obstructions, and mobility issues in Bangladesh.',
    },
    '/road-transport',
    'collection'
  ),
  '/load-shedding': routeSeo(
    {
      title: 'ইউটিলিটি সমস্যা | সবাইকে জানাও',
      description:
        'লোডশেডিং, গ্যাস সংকট, বিদ্যুৎ বিল ও অন্যান্য ইউটিলিটি সমস্যার প্রকাশিত নাগরিক প্রতিবেদন দেখুন।',
    },
    {
      title: 'Utility Issue Reports | Sobaike Janao',
      description:
        'Browse moderated reports about load shedding, gas shortages, electricity billing, and other utility issues.',
    },
    '/load-shedding',
    'collection'
  ),
  '/illegal-occupation': routeSeo(
    {
      title: 'অবৈধ দখল সংক্রান্ত প্রতিবেদন | সবাইকে জানাও',
      description:
        'রাস্তা, ফুটপাত, সরকারি বা ব্যক্তিগত সম্পত্তি ও জনস্থান দখল সংক্রান্ত প্রকাশিত নাগরিক প্রতিবেদন দেখুন।',
    },
    {
      title: 'Illegal Occupation Reports | Sobaike Janao',
      description:
        'Browse moderated citizen reports about illegal occupation of roads, footpaths, public spaces, and property.',
    },
    '/illegal-occupation',
    'collection'
  ),
  '/rickshaw': routeSeo(
    {
      title: 'অবৈধ অটো-রিকশা চার্জিং | সবাইকে জানাও',
      description:
        'অবৈধ বা ঝুঁকিপূর্ণ অটো-রিকশা চার্জিং অবস্থান ও সংশ্লিষ্ট প্রকাশিত নাগরিক প্রতিবেদন দেখুন।',
    },
    {
      title: 'Illegal Auto-rickshaw Charging Reports | Sobaike Janao',
      description:
        'Browse moderated reports about illegal or unsafe auto-rickshaw charging locations and related incidents.',
    },
    '/rickshaw',
    'collection'
  ),
  '/explore': routeSeo(
    {
      title: 'প্রতিবেদন খুঁজুন ও মানচিত্র | সবাইকে জানাও',
      description:
        'বিভাগ, জেলা ও এলাকা অনুযায়ী বাংলাদেশে প্রকাশিত নাগরিক প্রতিবেদন এবং মানচিত্র দেখুন।',
    },
    {
      title: 'Explore Reports & Map | Sobaike Janao',
      description:
        'Explore moderated citizen reports and incident maps across Bangladesh by division, district, and area.',
    },
    '/explore',
    'collection'
  ),
  '/search': routeSeo(
    {
      title: 'অনুসন্ধান | সবাইকে জানাও',
      description: 'বিষয়, এলাকা বা সংশ্লিষ্ট পক্ষের নাম দিয়ে প্রকাশিত প্রতিবেদন অনুসন্ধান করুন।',
    },
    {
      title: 'Search Reports | Sobaike Janao',
      description: 'Search published citizen reports, locations, and reported entities.',
    },
    '/search',
    'website',
    'noindex, follow'
  ),
  '/more': routeSeo(
    {
      title: 'তথ্য, নীতিমালা ও সহায়তা | সবাইকে জানাও',
      description:
        'প্ল্যাটফর্ম নির্দেশিকা, গোপনীয়তা, প্রতিউত্তরের অধিকার, দায়িত্বশীল প্রকাশ ও জরুরি সহায়তার তথ্য দেখুন।',
    },
    {
      title: 'Information, Policies & Help | Sobaike Janao',
      description:
        'Read platform guidelines, privacy information, right-of-response standards, responsible publishing guidance, and emergency help.',
    },
    '/more'
  ),
  '/report': routeSeo(
    {
      title: 'ঘটনা বা অভিযোগ জানান | সবাইকে জানাও',
      description:
        'সবাইকে জানাও প্ল্যাটফর্মে জনস্বার্থ সংক্রান্ত ঘটনা বা অভিযোগ প্রাসঙ্গিক তথ্যসহ দায়িত্বশীলভাবে জমা দিন।',
    },
    {
      title: 'Report an Incident | Sobaike Janao',
      description:
        'Submit a public-interest incident or complaint responsibly with relevant details on Sobaike Janao.',
    },
    '/report'
  ),
};

function setMetaTag(attributeName: 'name' | 'property', key: string, content: string): void {
  if (typeof document === 'undefined') return;
  const selector = `meta[${attributeName}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, key);
    element.setAttribute('data-seo-managed', 'true');
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function removeMetaTag(attributeName: 'name' | 'property', key: string): void {
  if (typeof document === 'undefined') return;
  document.head.querySelector(`meta[${attributeName}="${key}"]`)?.remove();
}

function setLinkTag(rel: string, href: string): void {
  if (typeof document === 'undefined') return;
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    element.setAttribute('data-seo-managed', 'true');
    document.head.appendChild(element);
  }
  element.href = href;
}

function setAlternateLinkTag(hreflang: string, href: string): void {
  if (typeof document === 'undefined') return;
  let element = document.head.querySelector<HTMLLinkElement>(
    `link[rel="alternate"][hreflang="${hreflang}"]`
  );
  if (!element) {
    element = document.createElement('link');
    element.rel = 'alternate';
    element.hreflang = hreflang;
    element.setAttribute('data-seo-managed', 'true');
    document.head.appendChild(element);
  }
  element.href = href;
}

function localizedCanonicalUrl(pathname: string, language: 'bn' | 'en'): string {
  const normalized = normalizeCanonicalPath(pathname);
  if (language === 'en') {
    const englishPath = normalized === '/' ? '/en/' : `/en${normalized}`;
    return new URL(englishPath, SITE_ORIGIN).toString();
  }
  return new URL(normalized, SITE_ORIGIN).toString();
}

function normalizeCanonicalPath(pathname?: string): string {
  const raw = pathname || '/';
  const clean = raw.split('?')[0].split('#')[0] || '/';
  if (clean === '/') return '/';
  return `/${clean.replace(/^\/+|\/+$/g, '')}`;
}

function absoluteUrl(value: string): string {
  try {
    return new URL(value, SITE_ORIGIN).toString();
  } catch {
    return `${SITE_ORIGIN}/`;
  }
}

function updateJsonLd(
  metadata: SeoMetadata,
  language: 'bn' | 'en',
  canonicalUrl: string
): void {
  if (typeof document === 'undefined') return;
  let scriptElement = document.head.querySelector<HTMLScriptElement>('#seo-jsonld');

  if (!scriptElement) {
    scriptElement = document.createElement('script');
    scriptElement.id = 'seo-jsonld';
    scriptElement.type = 'application/ld+json';
    scriptElement.setAttribute('data-seo-managed', 'true');
    document.head.appendChild(scriptElement);
  }

  const organizationId = `${SITE_ORIGIN}/#organization`;
  const websiteId = `${SITE_ORIGIN}/#website`;
  const pageId = `${canonicalUrl}#webpage`;
  const locale = language === 'bn' ? 'bn-BD' : 'en';

  const organization = {
    '@type': 'Organization',
    '@id': organizationId,
    url: `${SITE_ORIGIN}/`,
    name: 'Sobaike Janao',
    alternateName: [...BRAND_ALTERNATE_NAMES],
    description: ENTITY_DESCRIPTION,
    areaServed: {
      '@type': 'Country',
      name: 'Bangladesh',
    },
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_ORIGIN}/favicon.png`,
      width: 512,
      height: 512,
    },
  };

  const website = {
    '@type': 'WebSite',
    '@id': websiteId,
    url: `${SITE_ORIGIN}/`,
    name: 'Sobaike Janao',
    alternateName: [...BRAND_ALTERNATE_NAMES],
    description: ENTITY_DESCRIPTION,
    publisher: { '@id': organizationId },
  };

  const pageType =
    metadata.pageType === 'article'
      ? 'Article'
      : metadata.pageType === 'collection'
      ? 'CollectionPage'
      : 'WebPage';

  const page: Record<string, unknown> = {
    '@type': pageType,
    '@id': pageId,
    url: canonicalUrl,
    name: metadata.title,
    description: metadata.description,
    inLanguage: locale,
    isPartOf: { '@id': websiteId },
    publisher: { '@id': organizationId },
  };

  if (metadata.image) {
    page.image = absoluteUrl(metadata.image);
  }

  const breadcrumbItems = (metadata.breadcrumbs || [])
    .filter((item) => item.name && item.path)
    .map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: localizedCanonicalUrl(item.path, language),
    }));
  const breadcrumbId = `${canonicalUrl}#breadcrumb`;

  if (breadcrumbItems.length >= 2) {
    page.breadcrumb = { '@id': breadcrumbId };
  }

  if (metadata.pageType === 'article') {
    page.headline = metadata.title;
    page.mainEntityOfPage = { '@id': pageId };
    if (metadata.publishedTime) page.datePublished = metadata.publishedTime;
    if (metadata.modifiedTime) page.dateModified = metadata.modifiedTime;
  }

  scriptElement.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      website,
      page,
      ...(breadcrumbItems.length >= 2
        ? [
            {
              '@type': 'BreadcrumbList',
              '@id': breadcrumbId,
              itemListElement: breadcrumbItems,
            },
          ]
        : []),
    ],
  });
}

export function applySeoMetadata(metadata: SeoMetadata, language: 'bn' | 'en'): void {
  if (typeof document === 'undefined') return;

  document.documentElement.lang = language === 'bn' ? 'bn' : 'en';

  const normalizedDescription = normalizeSeoDescription(metadata.description, language);
  const normalizedMetadata: SeoMetadata = {
    ...metadata,
    description: normalizedDescription,
  };

  if (metadata.title && document.title !== metadata.title) {
    document.title = metadata.title;
  }

  if (normalizedDescription) {
    setMetaTag('name', 'description', normalizedDescription);
  }

  const robots = metadata.robots || 'index, follow, max-image-preview:large';
  setMetaTag('name', 'robots', robots);
  setMetaTag('name', 'googlebot', robots);

  const canonicalPath = normalizeCanonicalPath(
    metadata.canonicalPath ||
      (typeof window !== 'undefined' ? window.location.pathname : '/')
  );
  const canonicalUrl = localizedCanonicalUrl(canonicalPath, language);
  setLinkTag('canonical', canonicalUrl);
  setAlternateLinkTag('bn-BD', localizedCanonicalUrl(canonicalPath, 'bn'));
  setAlternateLinkTag('en', localizedCanonicalUrl(canonicalPath, 'en'));
  setAlternateLinkTag('x-default', localizedCanonicalUrl(canonicalPath, 'bn'));

  const image = absoluteUrl(metadata.image || DEFAULT_SOCIAL_IMAGE);
  const socialDescription = normalizeSeoDescription(
    metadata.socialDescription || normalizedDescription,
    language
  );
  const isDefaultSocialImage = !metadata.image;
  const imageAlt =
    metadata.imageAlt ||
    (language === 'bn' ? 'সবাইকে জানাও' : 'Sobaike Janao');

  setMetaTag('property', 'og:title', metadata.title);
  setMetaTag('property', 'og:description', socialDescription);
  setMetaTag('property', 'og:type', metadata.ogType || 'website');
  setMetaTag('property', 'og:site_name', metadata.ogSiteName || BRAND_NAME[language]);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:locale', language === 'bn' ? 'bn_BD' : 'en_US');
  setMetaTag('property', 'og:image', image);
  setMetaTag('property', 'og:image:alt', imageAlt);
  if (isDefaultSocialImage) {
    setMetaTag('property', 'og:image:width', '1200');
    setMetaTag('property', 'og:image:height', '630');
    setMetaTag('property', 'og:image:type', 'image/png');
  } else {
    removeMetaTag('property', 'og:image:width');
    removeMetaTag('property', 'og:image:height');
    removeMetaTag('property', 'og:image:type');
  }

  setMetaTag('name', 'twitter:card', isDefaultSocialImage ? 'summary_large_image' : 'summary');
  setMetaTag('name', 'twitter:title', metadata.title);
  setMetaTag('name', 'twitter:description', socialDescription);
  setMetaTag('name', 'twitter:image', image);
  setMetaTag('name', 'twitter:image:alt', imageAlt);

  if (metadata.pageType === 'article') {
    if (metadata.publishedTime) {
      setMetaTag('property', 'article:published_time', metadata.publishedTime);
    } else {
      removeMetaTag('property', 'article:published_time');
    }

    if (metadata.modifiedTime) {
      setMetaTag('property', 'article:modified_time', metadata.modifiedTime);
    } else {
      removeMetaTag('property', 'article:modified_time');
    }
  } else {
    removeMetaTag('property', 'article:published_time');
    removeMetaTag('property', 'article:modified_time');
  }

  updateJsonLd(normalizedMetadata, language, canonicalUrl);
}

export function getStaticSeo(pathname: string, language: 'bn' | 'en'): SeoMetadata {
  const normalizedPath =
    pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  const routeMatch = STATIC_ROUTE_SEO[normalizedPath];

  if (routeMatch) {
    return routeMatch[language];
  }

  if (normalizedPath.startsWith('/report-detail/')) {
    return {
      title:
        language === 'bn'
          ? 'প্রতিবেদন লোড হচ্ছে... | সবাইকে জানাও'
          : 'Loading Report... | Sobaike Janao',
      description: DEFAULT_FALLBACK_SEO[language].description,
      robots: 'noindex, follow',
      ogType: 'article',
      ogSiteName: BRAND_NAME[language],
      canonicalPath: normalizedPath,
      pageType: 'article',
    };
  }

  if (normalizedPath.startsWith('/location/')) {
    return {
      title:
        language === 'bn'
          ? 'এলাকার প্রতিবেদন লোড হচ্ছে... | সবাইকে জানাও'
          : 'Loading Location Reports... | Sobaike Janao',
      description: DEFAULT_FALLBACK_SEO[language].description,
      robots: 'noindex, follow',
      ogType: 'website',
      ogSiteName: BRAND_NAME[language],
      canonicalPath: normalizedPath,
      pageType: 'collection',
    };
  }

  if (normalizedPath.startsWith('/subject/')) {
    return {
      title:
        language === 'bn'
          ? 'সংশ্লিষ্ট পক্ষের প্রতিবেদন | সবাইকে জানাও'
          : 'Subject Reports | Sobaike Janao',
      description: DEFAULT_FALLBACK_SEO[language].description,
      robots: 'noindex, follow',
      ogType: 'website',
      ogSiteName: BRAND_NAME[language],
      canonicalPath: normalizedPath,
      pageType: 'collection',
    };
  }

  if (normalizedPath.startsWith('/category/')) {
    return {
      title:
        language === 'bn'
          ? 'বিষয়ভিত্তিক প্রতিবেদন | সবাইকে জানাও'
          : 'Topic Reports | Sobaike Janao',
      description: DEFAULT_FALLBACK_SEO[language].description,
      robots: 'noindex, follow',
      ogType: 'website',
      ogSiteName: BRAND_NAME[language],
      canonicalPath: normalizedPath,
      pageType: 'collection',
    };
  }

  if (normalizedPath.startsWith('/topic/')) {
    return {
      title:
        language === 'bn'
          ? 'উপবিষয়ের প্রতিবেদন | সবাইকে জানাও'
          : 'Subtopic Reports | Sobaike Janao',
      description: DEFAULT_FALLBACK_SEO[language].description,
      robots: 'noindex, follow',
      ogType: 'website',
      ogSiteName: BRAND_NAME[language],
      canonicalPath: normalizedPath,
      pageType: 'collection',
    };
  }

  return {
    title:
      language === 'bn'
        ? 'পৃষ্ঠা পাওয়া যায়নি | সবাইকে জানাও'
        : 'Page Not Found | Sobaike Janao',
    description: DEFAULT_FALLBACK_SEO[language].description,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogSiteName: BRAND_NAME[language],
    canonicalPath: normalizedPath,
    pageType: 'website',
  };
}
