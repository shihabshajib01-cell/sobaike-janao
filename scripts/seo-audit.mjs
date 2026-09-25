import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
const SITE_ORIGIN = 'https://shobaikejanao.com';

const failures = [];
const checks = [];

const record = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  if (!ok) failures.push(detail ? `${name}: ${detail}` : name);
};

const textContent = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const attr = (html, selectorPattern, attrName) => {
  const match = html.match(selectorPattern);
  if (!match) return '';
  const tag = match[0];
  const value = tag.match(new RegExp(`${attrName}=(["'])(.*?)\\1`, 'i'));
  return value?.[2] || '';
};

const decodeHtmlEntities = (value = '') =>
  String(value)
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

const getTitle = (html) =>
  decodeHtmlEntities(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '');
const getDescription = (html) =>
  decodeHtmlEntities(
    attr(html, /<meta\s+[^>]*name=["']description["'][^>]*>/i, 'content')
  );
const getCanonical = (html) =>
  attr(html, /<link\s+[^>]*rel=["']canonical["'][^>]*>/i, 'href');
const getRobots = (html) =>
  attr(html, /<meta\s+[^>]*name=["']robots["'][^>]*>/i, 'content');
const count = (html, regex) => (html.match(regex) || []).length;
const isIndexableRobots = (robots) =>
  !/noindex/i.test(robots) && /(?:^|[,\s])index(?:[,\s]|$)/i.test(robots);

async function walk(dir) {
  const entries = await readdir(dir);
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

const rootHtml = await readFile(join(DIST, 'index.html'), 'utf8');
const rootTitle = getTitle(rootHtml);
const rootDescription = getDescription(rootHtml);
const rootCanonical = getCanonical(rootHtml);
const rootRobots = getRobots(rootHtml);
const rootText = textContent(
  rootHtml.match(/<!-- SEO_FALLBACK_START -->([\s\S]*?)<!-- SEO_FALLBACK_END -->/i)?.[1] || ''
);
const rootWords = rootText.split(/\s+/).filter(Boolean).length;
const rootInternalLinks = count(rootHtml, /href=["']\/(?!\/)[^"']*["']/gi);
const rootExternalLinks = count(rootHtml, /href=["']https:\/\/[^"']+["']/gi);
const rootOgDescription = attr(
  rootHtml,
  /<meta\s+[^>]*property=["']og:description["'][^>]*>/i,
  'content'
);
const rootOgImage = attr(rootHtml, /<meta\s+[^>]*property=["']og:image["'][^>]*>/i, 'content');
const rootOgWidth = attr(rootHtml, /<meta\s+[^>]*property=["']og:image:width["'][^>]*>/i, 'content');
const rootOgHeight = attr(rootHtml, /<meta\s+[^>]*property=["']og:image:height["'][^>]*>/i, 'content');
const rootTwitterCard = attr(rootHtml, /<meta\s+[^>]*name=["']twitter:card["'][^>]*>/i, 'content');
const rootFaviconTag = rootHtml.match(/<link\s+[^>]*rel=["']icon["'][^>]*>/i)?.[0] || '';
const rootFavicon = attr(rootHtml, /<link\s+[^>]*rel=["']icon["'][^>]*>/i, 'href');
const rootFaviconType = attr(rootFaviconTag, /<link\s+[^>]*>/i, 'type');
const rootFaviconSizes = attr(rootFaviconTag, /<link\s+[^>]*>/i, 'sizes');
const rootBnAlternate = attr(
  rootHtml,
  /<link\s+[^>]*rel=["']alternate["'][^>]*hreflang=["']bn-BD["'][^>]*>/i,
  'href'
);
const rootEnAlternate = attr(
  rootHtml,
  /<link\s+[^>]*rel=["']alternate["'][^>]*hreflang=["']en["'][^>]*>/i,
  'href'
);

record('Homepage title exists', rootTitle.length > 0, rootTitle);
record(
  'Homepage exact Latin brand signal',
  rootTitle.startsWith('Sobaike Janao') && rootHtml.includes('Sobaike Janao (সবাইকে জানাও)'),
  rootTitle
);
record(
  'Homepage title target length',
  [...rootTitle].length >= 50 && [...rootTitle].length <= 60,
  `${[...rootTitle].length} characters`
);
record(
  'Homepage description target length',
  [...rootDescription].length >= 90 && [...rootDescription].length <= 160,
  `${[...rootDescription].length} characters`
);
record('HTTPS canonical', rootCanonical === `${SITE_ORIGIN}/`, rootCanonical);
record(
  'Index/follow robots',
  isIndexableRobots(rootRobots) && /follow/i.test(rootRobots),
  rootRobots
);
record(
  'Full search preview controls',
  /max-image-preview:large/i.test(rootRobots) &&
    /max-snippet:-1/i.test(rootRobots) &&
    /max-video-preview:-1/i.test(rootRobots),
  rootRobots
);
record('Exactly one H1', count(rootHtml, /<h1\b/gi) === 1, `${count(rootHtml, /<h1\b/gi)} H1`);
record('Structured headings', count(rootHtml, /<h2\b/gi) >= 2, `${count(rootHtml, /<h2\b/gi)} H2`);
record('Substantial crawlable content', rootWords >= 500, `${rootWords} words`);
record('Internal linking', rootInternalLinks >= 10, `${rootInternalLinks} links`);
record('Relevant external linking', rootExternalLinks >= 2, `${rootExternalLinks} links`);
record('Open Graph title', /property=["']og:title["']/i.test(rootHtml));
record('Open Graph description', /property=["']og:description["']/i.test(rootHtml));
record(
  'Open Graph description target length',
  [...rootOgDescription].length >= 150 && [...rootOgDescription].length <= 160,
  `${[...rootOgDescription].length} characters`
);
record('Open Graph URL', /property=["']og:url["']/i.test(rootHtml));
record(
  'Open Graph image',
  rootOgImage === `${SITE_ORIGIN}/brand/og-social-1200x630.png`,
  rootOgImage
);
record(
  'Open Graph image dimensions',
  rootOgWidth === '1200' && rootOgHeight === '630',
  `${rootOgWidth}x${rootOgHeight}`
);
record('Twitter card', rootTwitterCard === 'summary_large_image', rootTwitterCard);
record(
  'Language alternate links',
  rootBnAlternate === `${SITE_ORIGIN}/` && rootEnAlternate === `${SITE_ORIGIN}/en/`,
  `bn=${rootBnAlternate}; en=${rootEnAlternate}`
);
record(
  'Head assets use root-absolute URLs',
  !/href=["']\.\/brand\//i.test(rootHtml) &&
    !/href=["']\.\/site\.webmanifest/i.test(rootHtml)
);
let faviconPngValid = false;
let faviconPngWidth = 0;
let faviconPngHeight = 0;
try {
  const faviconBytes = await readFile(join(DIST, 'favicon.png'));
  const pngSignature =
    faviconBytes.length >= 24 &&
    faviconBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (pngSignature) {
    faviconPngWidth = faviconBytes.readUInt32BE(16);
    faviconPngHeight = faviconBytes.readUInt32BE(20);
    faviconPngValid =
      faviconPngWidth === faviconPngHeight &&
      faviconPngWidth >= 48;
  }
} catch {
  faviconPngValid = false;
}

record(
  'Stable Google-compatible favicon declaration',
  rootFavicon === '/favicon.png' &&
    rootFaviconType === 'image/png' &&
    rootFaviconSizes === '512x512' &&
    faviconPngValid,
  `href=${rootFavicon}; type=${rootFaviconType}; sizes=${rootFaviconSizes}; png=${faviconPngWidth}x${faviconPngHeight}`
);

let faviconIcoValid = false;
let faviconIcoBytes = 0;
try {
  const icoBytes = await readFile(join(DIST, 'favicon.ico'));
  faviconIcoBytes = icoBytes.length;
  faviconIcoValid =
    icoBytes.length > 22 &&
    icoBytes[0] === 0 &&
    icoBytes[1] === 0 &&
    icoBytes[2] === 1 &&
    icoBytes[3] === 0 &&
    icoBytes.readUInt16LE(4) >= 1;
} catch {
  faviconIcoValid = false;
}
record(
  'Browser/scanner favicon.ico compatibility',
  faviconIcoValid && rootHtml.includes('href="/favicon.ico"'),
  `${faviconIcoBytes} bytes`
);
let sameOriginFontCss = '';
try {
  sameOriginFontCss = await readFile(join(DIST, 'fonts', 'fonts.css'), 'utf8');
} catch {
  sameOriginFontCss = '';
}
record(
  'Visitor-facing fonts are same-origin',
  !rootHtml.includes('fonts.googleapis.com') &&
    !rootHtml.includes('fonts.gstatic.com') &&
    !rootHtml.includes('font-style-loader.js') &&
    sameOriginFontCss.includes('@font-face') &&
    sameOriginFontCss.includes('Noto Sans') &&
    !sameOriginFontCss.includes('fonts.googleapis.com') &&
    !sameOriginFontCss.includes('fonts.gstatic.com')
);
record(
  'Legacy SVG favicon declarations removed',
  !rootHtml.includes('sobaike-janao-favicon.svg')
);

const manifestRaw = await readFile(join(DIST, 'site.webmanifest'), 'utf8');
let manifestUsesPngFavicon = false;
try {
  const manifest = JSON.parse(manifestRaw);
  manifestUsesPngFavicon =
    Array.isArray(manifest.icons) &&
    manifest.icons.some(
      (icon) =>
        icon?.src === './favicon.png' &&
        icon?.type === 'image/png' &&
        icon?.sizes === '512x512'
    ) &&
    !manifestRaw.includes('.svg');
} catch {
  manifestUsesPngFavicon = false;
}
record('Web app manifest uses the stable PNG favicon', manifestUsesPngFavicon);

const allowedBrandAssets = new Set([
  'apple-touch-icon.png',
  'og-social-1200x630.png',
  'sobaike-janao-icon-512.png',
  'sobaike-janao-wordmark-dark.svg',
  'sobaike-janao-wordmark.svg',
]);
const brandAssets = await readdir('public/brand');
const unexpectedBrandAssets = brandAssets.filter((name) => !allowedBrandAssets.has(name));
const missingBrandAssets = [...allowedBrandAssets].filter((name) => !brandAssets.includes(name));
record(
  'Legacy logo and favicon assets removed',
  unexpectedBrandAssets.length === 0 && missingBrandAssets.length === 0,
  `unexpected=${unexpectedBrandAssets.join(',') || 'none'}; missing=${missingBrandAssets.join(',') || 'none'}`
);

record(
  'Boilerplate safety copy excluded from snippets',
  /data-nosnippet/i.test(rootHtml)
);
record(
  'Prepaint fallback guard',
  rootHtml.includes("document.documentElement.classList.add('js')") &&
    rootHtml.includes('.js #seo-static-fallback{display:none!important}')
);
record(
  'Social sharing links',
  /facebook\.com\/sharer/i.test(rootHtml) && /twitter\.com\/intent\/tweet/i.test(rootHtml)
);
record('Bangla language declared', /<html\s+[^>]*lang=["']bn["']/i.test(rootHtml));

const englishRootHtml = await readFile(join(DIST, 'en', 'index.html'), 'utf8');
const englishRootCanonical = getCanonical(englishRootHtml);
const englishRootDescription = getDescription(englishRootHtml);
const englishRootText = textContent(
  englishRootHtml.match(/<!-- SEO_FALLBACK_START -->([\s\S]*?)<!-- SEO_FALLBACK_END -->/i)?.[1] || ''
);
record(
  'English homepage is prerendered',
  /<html\s+[^>]*lang=["']en["']/i.test(englishRootHtml) &&
    englishRootCanonical === `${SITE_ORIGIN}/en/`,
  englishRootCanonical
);
record(
  'English homepage has substantial crawlable content',
  englishRootText.split(/\s+/).filter(Boolean).length >= 250,
  `${englishRootText.split(/\s+/).filter(Boolean).length} words`
);
record(
  'English homepage description target length',
  [...englishRootDescription].length >= 90 && [...englishRootDescription].length <= 160,
  `${[...englishRootDescription].length} characters`
);

const schemaRaw =
  rootHtml.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)?.[1] ||
  '';
let schemaValid = false;
let siteIdentityValid = false;
let currentBrandLogoValid = false;
let publishingPrinciplesValid = false;
try {
  const parsed = JSON.parse(schemaRaw);
  const graph = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
  const organization = graph.find((item) => item?.['@type'] === 'Organization');
  const website = graph.find((item) => item?.['@type'] === 'WebSite');
  schemaValid =
    Boolean(organization) &&
    Boolean(website) &&
    graph.some((item) =>
      ['WebPage', 'CollectionPage', 'Article'].includes(item?.['@type'])
    );
  const expectedAlternateNames = ['সবাইকে জানাও', 'shobaikejanao.com'];
  const websiteAlternateNames = Array.isArray(website?.alternateName)
    ? website.alternateName
    : [website?.alternateName].filter(Boolean);
  const organizationAlternateNames = Array.isArray(organization?.alternateName)
    ? organization.alternateName
    : [organization?.alternateName].filter(Boolean);
  siteIdentityValid =
    website?.name === 'Sobaike Janao' &&
    organization?.name === 'Sobaike Janao' &&
    expectedAlternateNames.every((name) => websiteAlternateNames.includes(name)) &&
    expectedAlternateNames.every((name) => organizationAlternateNames.includes(name));
  currentBrandLogoValid =
    organization?.logo?.url === `${SITE_ORIGIN}/favicon.png` &&
    organization?.logo?.width === 512 &&
    organization?.logo?.height === 512;
  publishingPrinciplesValid =
    organization?.publishingPrinciples === `${SITE_ORIGIN}/more`;
} catch {
  schemaValid = false;
  siteIdentityValid = false;
  currentBrandLogoValid = false;
  publishingPrinciplesValid = false;
}
record('Structured data graph valid', schemaValid);
record('Structured site identity is consistent', siteIdentityValid);
record('Structured data uses current brand logo', currentBrandLogoValid);
record(
  'Publishing principles are machine-readable',
  publishingPrinciplesValid
);
record(
  'Entity description is explicit',
  schemaRaw.includes('citizen-reporting and public-interest information platform for Bangladesh')
);

const robotsTxt = await readFile(join(DIST, 'robots.txt'), 'utf8');
record(
  'robots.txt advertises sitemap',
  robotsTxt.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)
);

const homeSeoContentSource = await readFile('src/components/home/HomeSeoContent.tsx', 'utf8');
record(
  'Crawler fallback has a user-visible counterpart',
  homeSeoContentSource.includes('home-platform-information') &&
    homeSeoContentSource.includes('Responsible reporting and verification') &&
    homeSeoContentSource.includes('দায়িত্বশীল প্রতিবেদন ও যাচাই')
);

const runtimeSeoSource = await readFile('src/lib/seo.ts', 'utf8');
record(
  'Hydrated homepage title matches prerendered identity',
  runtimeSeoSource.includes(`const HOME_BN_TITLE = '${rootTitle}';`) &&
    !runtimeSeoSource.includes("title: 'সবাইকে জানাও | বাংলাদেশের নাগরিক প্রতিবেদন প্ল্যাটফর্ম'")
);
record(
  'Hydrated structured data uses the stable favicon',
  runtimeSeoSource.includes('url: \`${SITE_ORIGIN}/favicon.png\`,') &&
    !runtimeSeoSource.includes('url: \`${SITE_ORIGIN}/brand/sobaike-janao-icon-512.png\`,')
);
record(
  'Hydrated schema exposes publishing principles',
  runtimeSeoSource.includes('publishingPrinciples: \`${SITE_ORIGIN}/more\`,')
);

const heroBannerSource = await readFile(
  'src/components/category/CategoryHeroBanner.tsx',
  'utf8'
);
record(
  'Hero illustrations expose descriptive alt text',
  heroBannerSource.includes('alt={illustrationAlt}') &&
    !heroBannerSource.includes('alt=""')
);

const appShellSource = await readFile('src/components/layout/AppShell.tsx', 'utf8');
record(
  'Visible trust and policy links are exposed',
  appShellSource.includes('About, policies & help') &&
    appShellSource.includes('Reports are reviewed before publication')
);

const custom404Html = await readFile(join(DIST, '404.html'), 'utf8');
const custom404Recovery = await readFile(join(DIST, 'spa-404-recovery.js'), 'utf8');
record(
  'Custom 404 page is helpful and non-indexable',
  custom404Html.includes('id="custom-404"') &&
    /name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(custom404Html) &&
    custom404Html.includes('href="/issues"') &&
    custom404Html.includes('href="/more"')
);
record(
  '404 SPA recovery is scoped to known application routes',
  custom404Recovery.includes('dynamicRoute') &&
    custom404Recovery.includes('staticRoutes') &&
    custom404Recovery.includes("window.location.replace('/')")
);

const llmsTxt = await readFile(join(DIST, 'llms.txt'), 'utf8');
record(
  'llms.txt available',
  llmsTxt.includes('Sobaike Janao') && llmsTxt.includes(`${SITE_ORIGIN}/sitemap.xml`)
);
record(
  'llms.txt uses Markdown links',
  /\[[^\]]+\]\(https:\/\/[^)]+\)/.test(llmsTxt),
  `${(llmsTxt.match(/\[[^\]]+\]\(https:\/\/[^)]+\)/g) || []).length} Markdown links`
);

const sitemap = await readFile(join(DIST, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
record('Sitemap has URLs', sitemapUrls.length >= 10, `${sitemapUrls.length} URLs`);
record(
  'Sitemap uses HTTPS only',
  sitemapUrls.every((url) => url.startsWith(`${SITE_ORIGIN}/`))
);
record('Sitemap has no duplicates', new Set(sitemapUrls).size === sitemapUrls.length);
record(
  'Sitemap lists first-class English URLs',
  sitemapUrls.some((url) => url === `${SITE_ORIGIN}/en/`) &&
    sitemapUrls.some((url) => url.startsWith(`${SITE_ORIGIN}/en/`)) &&
    !sitemapUrls.some((url) => url.includes('?lang=en'))
);
record(
  'Sitemap includes language alternates',
  sitemap.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"') &&
    sitemap.includes('hreflang="bn-BD"') &&
    sitemap.includes('hreflang="en"')
);
const sitemapReportUrls = sitemapUrls.filter((url) => url.includes('/report-detail/'));
const sitemapReportIds = sitemapReportUrls.map((url) =>
  decodeURIComponent(url.split('/report-detail/')[1] || '')
);
const reportDataAvailable = sitemapReportIds.length > 0;
record(
  'Sitemap has one canonical URL per report',
  !reportDataAvailable ||
    new Set(sitemapReportIds).size === sitemapReportIds.length,
  reportDataAvailable
    ? `${sitemapReportIds.length} report URLs`
    : 'skipped — report data unavailable in this build environment'
);

const htmlFiles = (await walk(DIST)).filter((file) => file.endsWith(`${sep}index.html`));
const seenCanonicals = new Set();
const seenTitles = new Map();
let routeFailures = 0;

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const rel = relative(DIST, file).split(sep).join('/');
  const canonical = getCanonical(html);
  const title = getTitle(html);
  const description = getDescription(html);
  const robots = getRobots(html);
  const h1Count = count(html, /<h1\b/gi);
  const isEnglishRoute = rel === 'en/index.html' || rel.startsWith('en/');
  const isReportRoute = rel.includes('report-detail/');
  const indexable = isIndexableRobots(robots);
  const htmlLang = attr(html, /<html\s+[^>]*lang=["'][^"']+["'][^>]*>/i, 'lang');
  const bnAlternate = attr(
    html,
    /<link\s+[^>]*rel=["']alternate["'][^>]*hreflang=["']bn-BD["'][^>]*>/i,
    'href'
  );
  const enAlternate = attr(
    html,
    /<link\s+[^>]*rel=["']alternate["'][^>]*hreflang=["']en["'][^>]*>/i,
    'href'
  );
  const defaultAlternate = attr(
    html,
    /<link\s+[^>]*rel=["']alternate["'][^>]*hreflang=["']x-default["'][^>]*>/i,
    'href'
  );
  const routeFavicon = attr(
    html,
    /<link\s+[^>]*rel=["']icon["'][^>]*>/i,
    'href'
  );

  if (routeFavicon !== '/favicon.png' || html.includes('sobaike-janao-favicon.svg')) {
    failures.push(`Route favicon contract invalid: ${rel} -> ${routeFavicon}`);
    routeFailures += 1;
  }

  if (!canonical.startsWith(SITE_ORIGIN)) {
    failures.push(`Route canonical invalid: ${rel} -> ${canonical}`);
    routeFailures += 1;
  }
  if (!isReportRoute) {
    if (isEnglishRoute && (!canonical.startsWith(`${SITE_ORIGIN}/en`) || htmlLang !== 'en')) {
      failures.push(`English route localization invalid: ${rel} -> ${canonical}; lang=${htmlLang}`);
      routeFailures += 1;
    }
    if (!isEnglishRoute && rel !== 'index.html' && canonical.startsWith(`${SITE_ORIGIN}/en`)) {
      failures.push(`Bangla route unexpectedly canonicalizes to English: ${rel} -> ${canonical}`);
      routeFailures += 1;
    }
  } else {
    const canonicalIsEnglish = canonical.startsWith(`${SITE_ORIGIN}/en/`);
    const languageMatchesCanonical =
      (htmlLang === 'en' && canonicalIsEnglish) ||
      (htmlLang === 'bn' && !canonicalIsEnglish);
    if (!languageMatchesCanonical) {
      failures.push(`Report source-language canonical mismatch: ${rel} -> ${canonical}; lang=${htmlLang}`);
      routeFailures += 1;
    }
    if (indexable && isEnglishRoute !== canonicalIsEnglish) {
      failures.push(`Indexable report route is not its canonical language route: ${rel}`);
      routeFailures += 1;
    }
  }
  if (!title || !description) {
    failures.push(`Route metadata missing: ${rel}`);
    routeFailures += 1;
  }
  if (indexable) {
    if ([...title].length > 60) {
      failures.push(`Indexable route title too long: ${rel} -> ${[...title].length}`);
      routeFailures += 1;
    }
    if ([...description].length < 90 || [...description].length > 160) {
      failures.push(`Indexable route description length invalid: ${rel} -> ${[...description].length}`);
      routeFailures += 1;
    }
  }
  if (isReportRoute) {
    const exactlyOneLanguageAlternate = Boolean(bnAlternate) !== Boolean(enAlternate);
    if (!exactlyOneLanguageAlternate || !defaultAlternate) {
      failures.push(`Report source-language alternate invalid: ${rel}`);
      routeFailures += 1;
    }
  } else if (!bnAlternate || !enAlternate || !defaultAlternate) {
    failures.push(`Route language alternates missing: ${rel}`);
    routeFailures += 1;
  }
  if (h1Count !== 1) {
    failures.push(`Route H1 count invalid: ${rel} -> ${h1Count}`);
    routeFailures += 1;
  }
  const schemaRaw = html.match(
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
  )?.[1];
  try {
    const parsed = JSON.parse(schemaRaw || '');
    const graph = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
    const pageNode = graph.find((item) =>
      ['WebPage', 'CollectionPage', 'Article'].includes(item?.['@type'])
    );
    if (!pageNode || pageNode.url !== canonical) {
      failures.push(`Route structured data URL mismatch: ${rel}`);
      routeFailures += 1;
    }
    if (pageNode?.['@type'] === 'Article' && !pageNode.dateModified) {
      failures.push(`Article dateModified missing: ${rel}`);
      routeFailures += 1;
    }
    if (indexable && rel !== 'index.html' && rel !== 'en/index.html') {
      const breadcrumb = graph.find((item) => item?.['@type'] === 'BreadcrumbList');
      if (!breadcrumb || !Array.isArray(breadcrumb.itemListElement) || breadcrumb.itemListElement.length < 2) {
        failures.push(`Breadcrumb structured data missing: ${rel}`);
        routeFailures += 1;
      }
    }
  } catch {
    failures.push(`Route structured data invalid: ${rel}`);
    routeFailures += 1;
  }

  if (indexable && seenCanonicals.has(canonical)) {
    failures.push(`Duplicate indexable canonical: ${canonical}`);
    routeFailures += 1;
  }
  if (indexable) seenCanonicals.add(canonical);

  if (indexable) {
    const prior = seenTitles.get(title);
    if (prior && prior !== rel) {
      failures.push(`Duplicate indexable title: "${title}" in ${prior} and ${rel}`);
      routeFailures += 1;
    } else {
      seenTitles.set(title, rel);
    }
  }
}
record(
  'Generated route pages pass SEO invariants',
  routeFailures === 0,
  `${htmlFiles.length} route entry files checked`
);

const seoBuildSource = await readFile('scripts/build-seo-assets.mjs', 'utf8');
record(
  'Taxonomy SEO uses published lifecycle only',
  seoBuildSource.includes('active=eq.true&config_status=eq.published') &&
    seoBuildSource.includes('loadActiveSubcategories')
);

const topicFiles = htmlFiles.filter((file) => {
  const rel = relative(DIST, file).split(sep).join('/');
  return rel.startsWith('topic/') || rel.startsWith('en/topic/');
});
const topicDataAvailable = topicFiles.length > 0;
let topicFailures = 0;
let indexableTopicPages = 0;

for (const file of topicFiles) {
  const html = await readFile(file, 'utf8');
  const rel = relative(DIST, file).split(sep).join('/');
  const canonical = getCanonical(html);
  const robots = getRobots(html);
  const indexable = isIndexableRobots(robots);
  const reportLinks = count(html, /href=["'][^"']*report-detail\//gi);
  const listedInSitemap = sitemapUrls.includes(canonical);

  if (indexable) {
    indexableTopicPages += 1;
    if (reportLinks < 1) {
      failures.push(`Indexable topic has no crawlable reports: ${rel}`);
      topicFailures += 1;
    }
    if (!listedInSitemap) {
      failures.push(`Indexable topic missing from sitemap: ${rel}`);
      topicFailures += 1;
    }
  } else if (listedInSitemap) {
    failures.push(`Noindex topic unexpectedly listed in sitemap: ${rel}`);
    topicFailures += 1;
  }

  const schemaRaw = html.match(
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
  )?.[1];
  try {
    const parsed = JSON.parse(schemaRaw || '');
    const graph = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
    const pageNode = graph.find((item) => item?.['@type'] === 'CollectionPage');
    const breadcrumb = graph.find((item) => item?.['@type'] === 'BreadcrumbList');
    if (!pageNode || pageNode.url !== canonical) {
      failures.push(`Topic CollectionPage schema invalid: ${rel}`);
      topicFailures += 1;
    }
    if (
      !breadcrumb ||
      !Array.isArray(breadcrumb.itemListElement) ||
      breadcrumb.itemListElement.length < 3
    ) {
      failures.push(`Topic breadcrumb hierarchy incomplete: ${rel}`);
      topicFailures += 1;
    }
  } catch {
    failures.push(`Topic structured data invalid: ${rel}`);
    topicFailures += 1;
  }
}

record(
  'Subcategory topic pages pass SEO quality gate',
  !topicDataAvailable || topicFailures === 0,
  topicDataAvailable
    ? `${topicFiles.length} localized topic pages; ${indexableTopicPages} indexable`
    : 'skipped — taxonomy data unavailable in this build environment'
);

let collectionPagesWithTopicLinks = 0;
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const rel = relative(DIST, file).split(sep).join('/');
  if (!rel.includes('report-detail/') && /href=["'][^"']*\/topic\//i.test(html)) {
    collectionPagesWithTopicLinks += 1;
  }
}
record(
  'Crawlable category-to-topic link graph exists',
  !topicDataAvailable || collectionPagesWithTopicLinks >= 3,
  topicDataAvailable
    ? `${collectionPagesWithTopicLinks} collection pages link to topic routes`
    : 'skipped — taxonomy data unavailable in this build environment'
);

let collectionPagesWithReportLinks = 0;
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const rel = relative(DIST, file).split(sep).join('/');
  if (
    !rel.includes('report-detail/') &&
    /href=["'][^"']*report-detail\//i.test(html)
  ) {
    collectionPagesWithReportLinks += 1;
  }
}
record(
  'Crawlable internal report-link graph exists',
  !reportDataAvailable || collectionPagesWithReportLinks >= 3,
  reportDataAvailable
    ? `${collectionPagesWithReportLinks} collection/home pages link to reports`
    : 'skipped — report data unavailable in this build environment'
);

for (const item of checks) {
  console.log(`${item.ok ? 'PASS' : 'FAIL'}  ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
}

const passed = checks.filter((item) => item.ok).length;
console.log(`\nSEO technical audit: ${passed}/${checks.length} checks passed.`);

if (failures.length) {
  console.error('\nSEO audit failures:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
}
