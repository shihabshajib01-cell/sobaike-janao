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

const getTitle = (html) => html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
const getDescription = (html) =>
  attr(html, /<meta\s+[^>]*name=["']description["'][^>]*>/i, 'content');
const getCanonical = (html) =>
  attr(html, /<link\s+[^>]*rel=["']canonical["'][^>]*>/i, 'href');
const getRobots = (html) =>
  attr(html, /<meta\s+[^>]*name=["']robots["'][^>]*>/i, 'content');
const count = (html, regex) => (html.match(regex) || []).length;

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
  /index/i.test(rootRobots) && /follow/i.test(rootRobots),
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
try {
  const parsed = JSON.parse(schemaRaw);
  const graph = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
  schemaValid =
    graph.some((item) => item?.['@type'] === 'Organization') &&
    graph.some((item) => item?.['@type'] === 'WebSite') &&
    graph.some((item) =>
      ['WebPage', 'CollectionPage', 'Article'].includes(item?.['@type'])
    );
} catch {
  schemaValid = false;
}
record('Structured data graph valid', schemaValid);

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

  if (!canonical.startsWith(SITE_ORIGIN)) {
    failures.push(`Route canonical invalid: ${rel} -> ${canonical}`);
    routeFailures += 1;
  }
  if (isEnglishRoute && (!canonical.startsWith(`${SITE_ORIGIN}/en`) || htmlLang !== 'en')) {
    failures.push(`English route localization invalid: ${rel} -> ${canonical}; lang=${htmlLang}`);
    routeFailures += 1;
  }
  if (!isEnglishRoute && rel !== 'index.html' && canonical.startsWith(`${SITE_ORIGIN}/en`)) {
    failures.push(`Bangla route unexpectedly canonicalizes to English: ${rel} -> ${canonical}`);
    routeFailures += 1;
  }
  if (!title || !description) {
    failures.push(`Route metadata missing: ${rel}`);
    routeFailures += 1;
  }
  if (/index/i.test(robots) && !/noindex/i.test(robots)) {
    if ([...title].length > 60) {
      failures.push(`Indexable route title too long: ${rel} -> ${[...title].length}`);
      routeFailures += 1;
    }
    if ([...description].length < 90 || [...description].length > 160) {
      failures.push(`Indexable route description length invalid: ${rel} -> ${[...description].length}`);
      routeFailures += 1;
    }
  }
  if (!bnAlternate || !enAlternate) {
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
  } catch {
    failures.push(`Route structured data invalid: ${rel}`);
    routeFailures += 1;
  }

  if (/index/i.test(robots) && seenCanonicals.has(canonical)) {
    failures.push(`Duplicate indexable canonical: ${canonical}`);
    routeFailures += 1;
  }
  if (/index/i.test(robots)) seenCanonicals.add(canonical);

  if (/index/i.test(robots)) {
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
