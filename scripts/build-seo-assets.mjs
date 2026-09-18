import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const SITE_ORIGIN = 'https://shobaikejanao.com';
const DIST_DIR = 'dist';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/brand/icon-512x512.png`;
const TODAY = new Date().toISOString().slice(0, 10);

const STATIC_PAGES = [
  {
    path: '/',
    title: 'সবাইকে জানাও | বাংলাদেশের নাগরিক প্রতিবেদন প্ল্যাটফর্ম',
    description:
      'সবাইকে জানাও — বাংলাদেশে জনস্বার্থ সংক্রান্ত সমস্যা ও নাগরিক অভিযোগ দায়িত্বশীলভাবে প্রকাশের মডারেটেড প্ল্যাটফর্ম।',
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

const canonicalUrl = (path) =>
  path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path.replace(/\/$/, '')}`;

function injectStaticFallback(html, page) {
  if (page.path === '/') return html;

  const heading = htmlEscape(String(page.title || '').replace(/\s*\|\s*সবাইকে জানাও\s*$/, ''));
  const description = htmlEscape(page.description || '');
  const contextCopy =
    page.type === 'article'
      ? 'এটি সবাইকে জানাও প্ল্যাটফর্মে প্রকাশিত একটি জনস্বার্থ প্রতিবেদন। প্রতিবেদনটি পড়ার সময় ঘটনার বিবরণ, প্রকাশের তারিখ, এলাকা, উপলব্ধ উৎস এবং পরবর্তী আপডেট একসঙ্গে বিবেচনা করুন। প্রকাশিত কোনো প্রতিবেদন নিজে থেকে আদালতের রায়, সরকারি সিদ্ধান্ত বা অপরাধ প্রমাণের সমতুল্য নয়।'
      : 'এই পৃষ্ঠায় সংশ্লিষ্ট বিষয়ের প্রকাশিত নাগরিক প্রতিবেদন দেখা যায়। সঠিক প্রেক্ষাপট বোঝার জন্য প্রতিটি প্রতিবেদনের শিরোনাম, বিবরণ, এলাকা, প্রকাশের সময়, উৎস এবং উপলব্ধ আপডেট দেখুন। জনস্বার্থের তথ্য দায়িত্বশীলভাবে ব্যবহার করুন এবং জরুরি সহায়তার জন্য ৯৯৯ অথবা সংশ্লিষ্ট সরকারি হটলাইনে যোগাযোগ করুন।';

  const fallback = `
      <!-- SEO_FALLBACK_START -->
      <main id="seo-static-fallback" class="mx-auto w-full max-w-5xl px-4 py-8 md:px-6 lg:px-8">
        <header class="space-y-3">
          <h1>${heading}</h1>
          <p>${description}</p>
        </header>

        <nav aria-label="প্রধান পৃষ্ঠা" class="mt-6">
          <p><strong>দ্রুত লিংক:</strong></p>
          <p>
            <a href="/">হোম</a> ·
            <a href="/issues">বিষয়সমূহ</a> ·
            <a href="/report">প্রতিবেদন করুন</a> ·
            <a href="/explore">মানচিত্র ও এলাকা</a> ·
            <a href="/search">অনুসন্ধান</a> ·
            <a href="/more">তথ্য ও নির্দেশিকা</a>
          </p>
        </nav>

        <section class="mt-8 space-y-3">
          <h2>পৃষ্ঠা সম্পর্কে</h2>
          <p>${htmlEscape(contextCopy)}</p>
        </section>

        <section class="mt-8 space-y-3">
          <h2>সম্পর্কিত প্রতিবেদন ও বিষয়</h2>
          <p>
            আরও প্রকাশিত তথ্য দেখতে
            <a href="/public-safety">জননিরাপত্তা</a>,
            <a href="/harassment">হয়রানি ও নির্যাতন</a>,
            <a href="/extortion">চাঁদাবাজি ও ঘুষ</a>,
            <a href="/road-transport">সড়ক ও যাতায়াত</a>,
            <a href="/load-shedding">ইউটিলিটি সমস্যা</a>,
            <a href="/illegal-occupation">অবৈধ দখল</a> এবং
            <a href="/rickshaw">অবৈধ অটো-রিকশা চার্জিং</a> বিভাগগুলো দেখুন।
          </p>
          <p>
            সরকারি তথ্যের জন্য
            <a href="https://bangladesh.gov.bd/" rel="noopener noreferrer">বাংলাদেশ জাতীয় তথ্য বাতায়ন</a>
            ব্যবহার করুন।
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
  const canonical = canonicalUrl(page.path);
  const title = htmlEscape(page.title);
  const description = htmlEscape(page.description);
  const robots = htmlEscape(page.robots || 'index, follow, max-image-preview:large');
  const type = page.type === 'article' ? 'article' : 'website';

  let html = template
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
      /<meta property="og:title" content="[^"]*" \/>/,
      `<meta property="og:title" content="${title}" />`
    )
    .replace(
      /<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${description}" />`
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
      /<meta name="twitter:title" content="[^"]*" \/>/,
      `<meta name="twitter:title" content="${title}" />`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*" \/>/,
      `<meta name="twitter:description" content="${description}" />`
    );

  if (page.type === 'article' && page.publishedAt) {
    html = html.replace(
      '</head>',
      `    <meta property="article:published_time" content="${htmlEscape(page.publishedAt)}" />\n  </head>`
    );
  }

  const pageSchema =
    page.type === 'article'
      ? {
          '@type': 'Article',
          '@id': `${canonical}#webpage`,
          url: canonical,
          headline: page.title,
          description: page.description,
          inLanguage: 'bn-BD',
          mainEntityOfPage: { '@id': `${canonical}#webpage` },
          isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
          ...(page.publishedAt ? { datePublished: page.publishedAt } : {}),
          image: DEFAULT_IMAGE,
        }
      : {
          '@type': page.collection ? 'CollectionPage' : 'WebPage',
          '@id': `${canonical}#webpage`,
          url: canonical,
          name: page.title,
          description: page.description,
          inLanguage: 'bn-BD',
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
          url: DEFAULT_IMAGE,
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
  const title = cleanText(report.titleBn || report.titleEn || id);
  const description = cleanText(
    report.summaryBn ||
      report.summaryEn ||
      report.descriptionBn ||
      report.descriptionEn ||
      'সবাইকে জানাও প্ল্যাটফর্মে প্রকাশিত নাগরিক প্রতিবেদন।'
  );

  return {
    path: `/report-detail/${encodeURIComponent(id)}`,
    title: `${title} | সবাইকে জানাও`,
    description,
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
    type: 'article',
    publishedAt: report.publishedAt || null,
  };
}

function subjectPage(subject) {
  return {
    path: `/subject/${encodeURIComponent(subject)}`,
    title: `${cleanText(subject)} সংক্রান্ত প্রতিবেদন | সবাইকে জানাও`,
    description: `${cleanText(subject)} সংক্রান্ত প্রকাশিত নাগরিক প্রতিবেদন ও সংশ্লিষ্ট পক্ষের বক্তব্য।`,
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
  // This protects search engines from duplicate indexable titles/content.
  const establishedStaticPath = `/${slug}`;
  if (STATIC_PAGES.some((page) => page.path === establishedStaticPath)) {
    return null;
  }

  const path = `/category/${encodeURIComponent(slug)}`;
  const name = cleanText(segment.name_bn || segment.name_en || segment.id);
  const description = cleanText(
    segment.description_bn ||
      segment.description_en ||
      `${name} সংক্রান্ত প্রকাশিত নাগরিক প্রতিবেদন দেখুন।`
  );

  return {
    path,
    title: `${name} | সবাইকে জানাও`,
    description,
    robots: 'index, follow, max-image-preview:large',
    sitemap: true,
    collection: true,
  };
}

async function main() {
  const template = await readFile(join(DIST_DIR, 'index.html'), 'utf8');
  const districts = await loadDistricts();
  const [reports, segments] = await Promise.all([loadPublishedReports(), loadActiveSegments()]);

  const pages = [...STATIC_PAGES];
  const seenPaths = new Set(pages.map((page) => page.path));

  for (const segment of segments) {
    const page = dynamicCategoryPage(segment);
    if (page && !seenPaths.has(page.path)) {
      pages.push(page);
      seenPaths.add(page.path);
    }
  }

  const districtIdsWithReports = new Set();

  for (const report of reports) {
    const page = reportPage(report);
    if (page && !seenPaths.has(page.path)) {
      pages.push(page);
      seenPaths.add(page.path);
    }

    const districtId = resolveDistrictId(report.district, districts);
    if (districtId) districtIdsWithReports.add(districtId);

    const subject = cleanText(report.reportedSubject);
    if (subject) {
      const subjectRoute = subjectPage(subject);
      if (!seenPaths.has(subjectRoute.path)) {
        pages.push(subjectRoute);
        seenPaths.add(subjectRoute.path);
      }
    }
  }

  for (const district of districts) {
    if (!districtIdsWithReports.has(district.id)) continue;
    const path = `/location/${encodeURIComponent(district.id)}`;
    if (seenPaths.has(path)) continue;

    pages.push({
      path,
      title: `${district.nameBn} এলাকার প্রতিবেদন | সবাইকে জানাও`,
      description: `${district.nameBn} এলাকার প্রকাশিত নাগরিক প্রতিবেদন ও জনস্বার্থ রেকর্ড।`,
      robots: 'index, follow, max-image-preview:large',
      sitemap: true,
      collection: true,
    });
    seenPaths.add(path);
  }

  const rootPage = pages.find((page) => page.path === '/');
  if (rootPage) {
    await writeFile(join(DIST_DIR, 'index.html'), injectMeta(template, rootPage), 'utf8');
  }

  await Promise.all(pages.map((page) => writeRouteHtml(template, page)));

  const sitemapEntries = pages
    .filter((page) => page.sitemap)
    .map((page) => {
      const lastmod = page.publishedAt
        ? new Date(page.publishedAt).toISOString().slice(0, 10)
        : TODAY;
      return [
        '  <url>',
        `    <loc>${xmlEscape(canonicalUrl(page.path))}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        '  </url>',
      ].join('\n');
    });

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
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
