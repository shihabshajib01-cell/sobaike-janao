/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SeoMetadata {
  title: string;
  description: string;
  robots?: string;
  ogType?: 'website' | 'article';
  ogSiteName?: string;
}

export const BRAND_NAME = {
  bn: 'সবাইকে জানাও',
  en: 'Sobaike Janao',
} as const;

export const DEFAULT_FALLBACK_SEO: Record<'bn' | 'en', SeoMetadata> = {
  bn: {
    title: 'সবাইকে জানাও | নাগরিক প্রতিবেদন প্ল্যাটফর্ম',
    description: 'সবাইকে জানাও — বাংলাদেশে জনস্বার্থ সংক্রান্ত সমস্যা ও নাগরিক অভিযোগ দায়িত্বশীলভাবে প্রকাশের মডারেটেড প্ল্যাটফর্ম।',
    robots: 'index, follow',
    ogType: 'website',
    ogSiteName: 'সবাইকে জানাও',
  },
  en: {
    title: 'Sobaike Janao | Citizen Reporting Platform',
    description: 'Sobaike Janao is a citizen reporting platform for responsibly documenting community issues and public-interest concerns in Bangladesh.',
    robots: 'index, follow',
    ogType: 'website',
    ogSiteName: 'Sobaike Janao',
  },
};

export const STATIC_ROUTE_SEO: Record<string, Record<'bn' | 'en', SeoMetadata>> = {
  '/': {
    bn: {
      title: 'সবাইকে জানাও | নাগরিক প্রতিবেদন প্ল্যাটফর্ম',
      description: 'সবাইকে জানাও — বাংলাদেশে জনস্বার্থ সংক্রান্ত সমস্যা ও নাগরিক অভিযোগ দায়িত্বশীলভাবে প্রকাশের মডারেটেড প্ল্যাটফর্ম।',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'সবাইকে জানাও',
    },
    en: {
      title: 'Sobaike Janao | Citizen Reporting Platform',
      description: 'Sobaike Janao is a citizen reporting platform for responsibly documenting community issues and public-interest concerns in Bangladesh.',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'Sobaike Janao',
    },
  },
  '/harassment': {
    bn: {
      title: 'হয়রানি ও নির্যাতনের বিরুদ্ধে জানান | সবাইকে জানাও',
      description: 'শারীরিক বা মানসিক নির্যাতন, প্রতারণা ও অনলাইনে হেনস্তার অভিযোগ দায়িত্বশীলভাবে প্রকাশ করুন।',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'সবাইকে জানাও',
    },
    en: {
      title: 'Report Harassment & Abuse | Sobaike Janao',
      description: 'Report physical or psychological abuse, relationship deception, or online harassment responsibly.',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'Sobaike Janao',
    },
  },
  '/rickshaw': {
    bn: {
      title: 'অবৈধ চার্জিং স্টেশন প্রকাশ করুন | সবাইকে জানাও',
      description: 'আবাসিক বা ঝুঁকিপূর্ণ এলাকায় অননুমোদিত চার্জিং স্টেশন ও অনিরাপদ সংযোগের তথ্য জানান।',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'সবাইকে জানাও',
    },
    en: {
      title: 'Expose Unsafe Charging Stations | Sobaike Janao',
      description: 'Report locations and hazards of unauthorized auto-rickshaw battery charging stations.',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'Sobaike Janao',
    },
  },
  '/extortion': {
    bn: {
      title: 'চাঁদাবাজির তথ্য প্রকাশ করুন | সবাইকে জানাও',
      description: 'দোকানপাট, বাজার, পরিবহন স্ট্যান্ড বা নির্মাণকাজে জোরপূর্বক অর্থ আদায় ও হুমকির বিরুদ্ধে তথ্য দিন।',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'সবাইকে জানাও',
    },
    en: {
      title: 'Report Local Extortion | Sobaike Janao',
      description: 'Report forced collections, extortion, and coercive illegal demands in local areas.',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'Sobaike Janao',
    },
  },
  '/load-shedding': {
    bn: {
      title: 'ইউটিলিটি সেবা অভিযোগ | সবাইকে জানাও',
      description: 'লোডশেডিং, গ্যাস সংকট বা অতিরিক্ত বিদ্যুৎ বিল সংক্রান্ত সমস্যা দায়িত্বশীলভাবে জানান।',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'সবাইকে জানাও',
    },
    en: {
      title: 'Utility Service Complaints | Sobaike Janao',
      description: 'Report load shedding, gas shortages, or excess electricity bill issues responsibly.',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'Sobaike Janao',
    },
  },
  '/illegal-occupation': {
    bn: {
      title: 'অবৈধ দখল রিপোর্টিং | সবাইকে জানাও',
      description: 'এই রিপোর্টিং সেবাটি প্রস্তুত করা হচ্ছে এবং এখনো চালু হয়নি।',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'সবাইকে জানাও',
    },
    en: {
      title: 'Illegal Occupation Reporting | Sobaike Janao',
      description: 'This reporting service is being prepared and is not available yet.',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'Sobaike Janao',
    },
  },
  '/explore': {
    bn: {
      title: 'প্রতিবেদন খুঁজুন ও মানচিত্র | সবাইকে জানাও',
      description: 'বিভাগ, জেলা ও এলাকা অনুযায়ী বাংলাদেশে প্রকাশিত নাগরিক প্রতিবেদন এবং মানচিত্র দেখুন।',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'সবাইকে জানাও',
    },
    en: {
      title: 'Explore Reports & Map | Sobaike Janao',
      description: 'Explore moderated citizen reports and incident maps across Bangladesh districts.',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'Sobaike Janao',
    },
  },
  '/search': {
    bn: {
      title: 'অনুসন্ধান | সবাইকে জানাও',
      description: 'বিষয়, এলাকা বা সংশ্লিষ্ট পক্ষের নাম দিয়ে প্রকাশিত প্রতিবেদন অনুসন্ধান করুন।',
      robots: 'noindex, follow',
      ogType: 'website',
      ogSiteName: 'সবাইকে জানাও',
    },
    en: {
      title: 'Search Reports | Sobaike Janao',
      description: 'Search published citizen reports, locations, and reported entities.',
      robots: 'noindex, follow',
      ogType: 'website',
      ogSiteName: 'Sobaike Janao',
    },
  },
  '/more': {
    bn: {
      title: 'তথ্য ও সম্পাদকীয় নির্দেশিকা | সবাইকে জানাও',
      description: 'নাগরিক সচেতনতা, সুরক্ষানীতি, প্রতিউত্তরের অধিকার এবং জরুরি সহায়তা।',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'সবাইকে জানাও',
    },
    en: {
      title: 'Information & Guidelines | Sobaike Janao',
      description: 'Platform guidelines, privacy policies, right of response standards, and emergency helplines.',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'Sobaike Janao',
    },
  },
  '/report': {
    bn: {
      title: 'অভিযোগ বা ঘটনা জানান | সবাইকে জানাও',
      description: 'সবাইকে জানাও প্ল্যাটফর্মে জনস্বার্থ সংক্রান্ত ঘটনা বা অভিযোগ দায়িত্বশীলভাবে জানান।',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'সবাইকে জানাও',
    },
    en: {
      title: 'Report an Incident | Sobaike Janao',
      description: 'Submit an incident report or public complaint responsibly on Sobaike Janao.',
      robots: 'index, follow',
      ogType: 'website',
      ogSiteName: 'Sobaike Janao',
    },
  },
};

/**
 * Sets or updates a <meta> element in <head> safely without duplicates.
 */
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

/**
 * Updates or creates the JSON-LD structured data in <head>.
 */
function updateJsonLd(language: 'bn' | 'en'): void {
  if (typeof document === 'undefined') return;
  let scriptElement = document.head.querySelector<HTMLScriptElement>('#seo-jsonld');

  if (!scriptElement) {
    scriptElement = document.createElement('script');
    scriptElement.id = 'seo-jsonld';
    scriptElement.type = 'application/ld+json';
    scriptElement.setAttribute('data-seo-managed', 'true');
    document.head.appendChild(scriptElement);
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Sobaike Janao',
    alternateName: 'সবাইকে জানাও',
    inLanguage: [language, language === 'bn' ? 'en' : 'bn'],
  };

  scriptElement.textContent = JSON.stringify(structuredData);
}

/**
 * Applies full SEO metadata to the active document.
 */
export function applySeoMetadata(metadata: SeoMetadata, language: 'bn' | 'en'): void {
  if (typeof document === 'undefined') return;

  // 1. Document Title
  if (metadata.title && document.title !== metadata.title) {
    document.title = metadata.title;
  }

  // 2. Meta Description
  if (metadata.description) {
    setMetaTag('name', 'description', metadata.description);
  }

  // 3. Robots
  const robots = metadata.robots || 'index, follow';
  setMetaTag('name', 'robots', robots);

  // 4. Open Graph
  setMetaTag('property', 'og:title', metadata.title);
  setMetaTag('property', 'og:description', metadata.description);
  setMetaTag('property', 'og:type', metadata.ogType || 'website');
  setMetaTag('property', 'og:site_name', metadata.ogSiteName || BRAND_NAME[language]);

  // 5. Twitter / X
  setMetaTag('name', 'twitter:card', 'summary');
  setMetaTag('name', 'twitter:title', metadata.title);
  setMetaTag('name', 'twitter:description', metadata.description);

  // 6. JSON-LD Structured Data
  updateJsonLd(language);
}

/**
 * Resolves static SEO metadata for a given path and language.
 */
export function getStaticSeo(pathname: string, language: 'bn' | 'en'): SeoMetadata {
  const normalizedPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  const routeMatch = STATIC_ROUTE_SEO[normalizedPath];

  if (routeMatch) {
    return routeMatch[language];
  }

  // Dynamic route prefixes fallback while loading
  if (normalizedPath.startsWith('/report-detail/')) {
    return {
      title: language === 'bn' ? 'প্রতিবেদন লোড হচ্ছে... | সবাইকে জানাও' : 'Loading Report... | Sobaike Janao',
      description: DEFAULT_FALLBACK_SEO[language].description,
      robots: 'noindex, follow',
      ogType: 'article',
      ogSiteName: BRAND_NAME[language],
    };
  }

  if (normalizedPath.startsWith('/location/')) {
    return {
      title: language === 'bn' ? 'এলাকার প্রতিবেদন লোড হচ্ছে... | সবাইকে জানাও' : 'Loading Location Reports... | Sobaike Janao',
      description: DEFAULT_FALLBACK_SEO[language].description,
      robots: 'noindex, follow',
      ogType: 'website',
      ogSiteName: BRAND_NAME[language],
    };
  }

  if (normalizedPath.startsWith('/subject/')) {
    return {
      title: language === 'bn' ? 'সত্ত্বার তথ্য লোড হচ্ছে... | সবাইকে জানাও' : 'Loading Subject Reports... | Sobaike Janao',
      description: DEFAULT_FALLBACK_SEO[language].description,
      robots: 'noindex, follow',
      ogType: 'website',
      ogSiteName: BRAND_NAME[language],
    };
  }

  // Unknown route
  return {
    title: language === 'bn' ? 'পৃষ্ঠা পাওয়া যায়নি | সবাইকে জানাও' : 'Page Not Found | Sobaike Janao',
    description: DEFAULT_FALLBACK_SEO[language].description,
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogSiteName: BRAND_NAME[language],
  };
}
