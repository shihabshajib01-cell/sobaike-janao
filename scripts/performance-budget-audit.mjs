import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const indexPath = path.join(distDir, 'index.html');

const fail = (message) => {
  console.error(`[performance-budget] ${message}`);
  process.exitCode = 1;
};

if (!fs.existsSync(indexPath)) {
  fail('dist/index.html is missing. Run the production build first.');
  process.exit();
}

const html = fs.readFileSync(indexPath, 'utf8');

if (/Material\+Symbols|Material%20Symbols|Material Symbols/i.test(html)) {
  fail('Unused Material Symbols font must not be loaded by the initial document.');
}

const mainSourcePath = path.join(root, 'src', 'main.tsx');
if (fs.existsSync(mainSourcePath)) {
  const mainSource = fs.readFileSync(mainSourcePath, 'utf8');
  if (mainSource.includes("leaflet/dist/leaflet.css")) {
    fail('Leaflet CSS must stay route-scoped and out of the initial entry.');
  }
}

const reportCardSourcePath = path.join(
  root,
  'src',
  'components',
  'report',
  'ReportCard.tsx'
);
if (fs.existsSync(reportCardSourcePath)) {
  const reportCardSource = fs.readFileSync(reportCardSourcePath, 'utf8');
  if (reportCardSource.includes('ReportMediaGrid')) {
    fail('ReportCard must not import or mount hidden media-grid code.');
  }
}

const homePageSourcePath = path.join(root, 'src', 'pages', 'HomePage.tsx');
const virtualFeedSourcePath = path.join(
  root,
  'src',
  'components',
  'report',
  'VirtualizedReportFeed.tsx'
);
const taxonomySourcePath = path.join(root, 'src', 'services', 'taxonomyService.ts');
const heroCarouselSourcePath = path.join(
  root,
  'src',
  'components',
  'home',
  'ServiceHeroCarousel.tsx'
);
const heroBannerSourcePath = path.join(
  root,
  'src',
  'components',
  'category',
  'CategoryHeroBanner.tsx'
);
const mobileHeaderSourcePath = path.join(
  root,
  'src',
  'components',
  'layout',
  'MobileHeader.tsx'
);
if (fs.existsSync(mobileHeaderSourcePath)) {
  const mobileHeaderSource = fs.readFileSync(mobileHeaderSourcePath, 'utf8');

  if (!mobileHeaderSource.includes("window.addEventListener('scroll', handleScroll, { passive: true })")) {
    fail('Adaptive mobile navigation scroll listener must remain passive.');
  }
  if (!mobileHeaderSource.includes('window.requestAnimationFrame(evaluateScroll)')) {
    fail('Adaptive mobile navigation must coalesce scroll work through requestAnimationFrame.');
  }
  if (!mobileHeaderSource.includes('const isCompactRef = useRef(isCompact);')) {
    fail('Adaptive mobile navigation must keep compact state in a ref to avoid listener churn.');
  }
  if (!mobileHeaderSource.includes('}, [shouldUseAdaptiveHeader, updateCompactState]);')) {
    fail('Adaptive mobile navigation listener must not re-subscribe on every compact/full state transition.');
  }
}

if (fs.existsSync(homePageSourcePath)) {
  const homePageSource = fs.readFileSync(homePageSourcePath, 'utf8');

  if (!homePageSource.includes('const HOME_FEED_PAGE_SIZE = 10')) {
    fail('Home infinite feed must keep the bounded 10-report page size.');
  }
  if (!homePageSource.includes('new IntersectionObserver(')) {
    fail('Home infinite feed must use IntersectionObserver instead of scroll polling.');
  }
  if (!homePageSource.includes('loadMoreInFlightRef.current')) {
    fail('Home infinite feed must guard against duplicate concurrent page requests.');
  }
  if (!homePageSource.includes('feedGenerationRef.current')) {
    fail('Home infinite feed must reject stale page responses after feed/filter changes.');
  }
  if (!homePageSource.includes('home-infinite-feed-sentinel')) {
    fail('Home infinite feed sentinel is missing.');
  }
  if (homePageSource.includes('home-load-more-button')) {
    fail('Manual Home load-more button must not return; pagination is automatic.');
  }
}

if (fs.existsSync(virtualFeedSourcePath)) {
  const virtualFeedSource = fs.readFileSync(virtualFeedSourcePath, 'utf8');
  if (!virtualFeedSource.includes('data-virtualized-report-page')) {
    fail('Home long-feed virtualization page markers are missing.');
  }
  if (!virtualFeedSource.includes('new IntersectionObserver(')) {
    fail('Home virtualization must mount pages using IntersectionObserver.');
  }
  if (!virtualFeedSource.includes('new ResizeObserver(')) {
    fail('Home virtualization must measure variable-height report pages.');
  }
  if (!virtualFeedSource.includes("data-mounted={isMounted ? 'true' : 'false'}")) {
    fail('Home virtualization must expose mounted/unmounted page state.');
  }
  if (!virtualFeedSource.includes('height: \`\${placeholderHeight}px\`')) {
    fail('Home virtualization must preserve measured placeholder height.');
  }
} else {
  fail('VirtualizedReportFeed source is missing.');
}

if (fs.existsSync(reportCardSourcePath)) {
  const reportCardSource = fs.readFileSync(reportCardSourcePath, 'utf8');
  if (!reportCardSource.includes('React.memo(ReportCardComponent)')) {
    fail('Feed ReportCard must stay memoized for append-only Home updates.');
  }
}

if (fs.existsSync(mainSourcePath)) {
  const mainSource = fs.readFileSync(mainSourcePath, 'utf8');
  if (
    !mainSource.includes('scheduleIdleTask') ||
    !mainSource.includes("import('./services/bannerRuntime')")
  ) {
    fail('Banner CMS hydration must stay outside the first-paint request burst.');
  }
}

if (fs.existsSync(taxonomySourcePath)) {
  const taxonomySource = fs.readFileSync(taxonomySourcePath, 'utf8');
  if (
    !taxonomySource.includes('scheduleTaxonomyFetch') ||
    !taxonomySource.includes('scheduleIdleTask')
  ) {
    fail('Taxonomy network hydration must stay idle-scheduled.');
  }
}

if (fs.existsSync(heroCarouselSourcePath) && fs.existsSync(heroBannerSourcePath)) {
  const heroCarouselSource = fs.readFileSync(heroCarouselSourcePath, 'utf8');
  const heroBannerSource = fs.readFileSync(heroBannerSourcePath, 'utf8');
  if (
    !heroCarouselSource.includes('shouldHydrateMedia') ||
    !heroCarouselSource.includes('deferIllustration={!shouldHydrateMedia}') ||
    !heroBannerSource.includes('data-hero-media-deferred')
  ) {
    fail('Home hero must hydrate only the active/neighbor media window.');
  }
}

const toLocalPath = (url) => {
  const clean = url.split('?')[0].split('#')[0].replace(/^\.?\//, '').replace(/^\//, '');
  return path.join(distDir, clean);
};
const gzipBytes = (file) => zlib.gzipSync(fs.readFileSync(file), { level: 9 }).length;
const kb = (bytes) => (bytes / 1024).toFixed(1);

const moduleMatch = html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["']/i);
if (!moduleMatch) {
  fail('Could not find the production module entry in dist/index.html.');
} else {
  const entryPath = toLocalPath(moduleMatch[1]);
  if (!fs.existsSync(entryPath)) {
    fail(`Entry chunk is missing: ${moduleMatch[1]}`);
  } else {
    const raw = fs.statSync(entryPath).size;
    const gzip = gzipBytes(entryPath);
    const maxRaw = 525 * 1024;
    const maxGzip = 155 * 1024;
    console.log(`[performance-budget] entry: ${kb(raw)} KB raw / ${kb(gzip)} KB gzip`);
    if (raw > maxRaw) fail(`Entry chunk exceeds ${kb(maxRaw)} KB raw budget.`);
    if (gzip > maxGzip) fail(`Entry chunk exceeds ${kb(maxGzip)} KB gzip budget.`);
  }
}

const cssMatches = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi)];
let cssGzipTotal = 0;
for (const match of cssMatches) {
  const cssPath = toLocalPath(match[1]);
  if (fs.existsSync(cssPath)) cssGzipTotal += gzipBytes(cssPath);
}
const maxCssGzip = 26 * 1024;
console.log(`[performance-budget] critical CSS: ${kb(cssGzipTotal)} KB gzip`);
if (cssGzipTotal > maxCssGzip) {
  fail(`Critical CSS exceeds ${kb(maxCssGzip)} KB gzip budget.`);
}


const assetDir = path.join(distDir, 'assets');
if (fs.existsSync(assetDir)) {
  const jsAssets = fs.readdirSync(assetDir)
    .filter((name) => name.endsWith('.js'))
    .map((name) => ({
      name,
      path: path.join(assetDir, name),
    }));

  const supabaseChunk = jsAssets.find((asset) => /^supabase-.*\.js$/i.test(asset.name));
  if (supabaseChunk) {
    const gzip = gzipBytes(supabaseChunk.path);
    const maxSupabaseGzip = 70 * 1024;
    console.log(`[performance-budget] supabase chunk: ${kb(gzip)} KB gzip`);
    if (gzip > maxSupabaseGzip) {
      fail(`Supabase chunk exceeds ${kb(maxSupabaseGzip)} KB gzip budget.`);
    }
  }

  const maxLazyChunkGzip = 90 * 1024;
  for (const asset of jsAssets) {
    if (moduleMatch && asset.path === toLocalPath(moduleMatch[1])) continue;
    const gzip = gzipBytes(asset.path);
    if (gzip > maxLazyChunkGzip) {
      fail(`Lazy chunk ${asset.name} exceeds ${kb(maxLazyChunkGzip)} KB gzip budget.`);
    }
  }
}

const heroDir = path.join(root, 'public', 'illustrations', 'services');
if (fs.existsSync(heroDir)) {
  const heroFiles = fs.readdirSync(heroDir)
    .filter((name) => /\.(?:avif|webp|jpe?g|png)$/i.test(name))
    .map((name) => ({
      name,
      bytes: fs.statSync(path.join(heroDir, name)).size,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  const maxHeroBytes = 220 * 1024;
  const largest = heroFiles[0];
  if (largest) {
    console.log(`[performance-budget] largest service hero: ${largest.name} (${kb(largest.bytes)} KB)`);
  }
  for (const hero of heroFiles) {
    if (hero.bytes > maxHeroBytes) {
      fail(`Service hero ${hero.name} exceeds ${kb(maxHeroBytes)} KB asset budget.`);
    }
  }
}


const migrationsDir = path.join(root, 'supabase', 'migrations');
if (fs.existsSync(migrationsDir)) {
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  let latestHomeFeedMigration = null;
  let latestHomeFeedSource = '';
  let allMigrationSource = '';

  for (const name of migrationFiles) {
    const source = fs.readFileSync(path.join(migrationsDir, name), 'utf8');
    allMigrationSource += '\n' + source;
    if (/create\s+or\s+replace\s+function\s+public\.get_public_home_feed_page\s*\(/i.test(source)) {
      latestHomeFeedMigration = name;
      latestHomeFeedSource = source;
    }
  }

  if (!latestHomeFeedMigration) {
    fail('No authoritative get_public_home_feed_page migration was found.');
  } else {
    if (/v_source\s*:=\s*public\.get_public_home_feed\s*\(/i.test(latestHomeFeedSource)) {
      fail(
        `Home page RPC regressed to full-feed materialization in ${latestHomeFeedMigration}. Rank/page IDs before JSON construction instead.`
      );
    }

    if (!/unnest\s*\(\s*v_page_ids\s*\)/i.test(latestHomeFeedSource)) {
      fail(
        `Home page RPC in ${latestHomeFeedMigration} must build public JSON from the bounded page ID set only.`
      );
    }

    if (!/operator\s*\(\s*extensions\.<->\s*\)/i.test(latestHomeFeedSource)) {
      fail(
        `Home page RPC in ${latestHomeFeedMigration} must keep spatial-index KNN ordering for the location-first feed.`
      );
    }

    if (!/idx_complaints_public_feed_geo/i.test(allMigrationSource)) {
      fail('The public Home feed spatial index migration is missing.');
    }

    if (/lower\s*\(\s*coalesce\s*\(\s*c\.district/i.test(latestHomeFeedSource)) {
      fail('Home district filters must match the lower(district) feed indexes exactly.');
    }

    if (
      /coalesce\s*\(\s*c\.public_view_count\s*,\s*0\s*\)/i.test(latestHomeFeedSource) ||
      /coalesce\s*\(\s*c\.public_share_count\s*,\s*0\s*\)/i.test(latestHomeFeedSource)
    ) {
      fail('Home popularity ordering must not hide NOT NULL engagement columns behind COALESCE.');
    }

    const indexAlignmentMigration = path.join(
      migrationsDir,
      '20260919101933_finish_home_feed_scale_guards.sql'
    );
    if (!fs.existsSync(indexAlignmentMigration)) {
      fail('Home feed index-alignment migration is missing.');
    } else {
      const indexAlignmentSource = fs.readFileSync(indexAlignmentMigration, 'utf8');
      if (
        !indexAlignmentSource.includes('idx_complaints_public_feed_popular') ||
        !indexAlignmentSource.includes("date_trunc('second', created_at at time zone 'UTC')")
      ) {
        fail('Popular Home feed index must match the production ranking order.');
      }
    }

    if (!process.exitCode) {
      console.log(
        `[performance-budget] scalable Home feed contract: ${latestHomeFeedMigration}`
      );
    }
  }
}

if (!process.exitCode) {
  console.log('[performance-budget] PASS');
}
