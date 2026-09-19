import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const SITE_URL = (process.env.SITE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/');
const browser = await chromium.launch({ headless: true });
const failures = [];

const routeUrl = (path) => new URL(path.replace(/^\//, ''), SITE_URL).toString();

async function seedReturningVisitor(context) {
  await context.addInitScript(() => {
    localStorage.setItem('sobaike_responsibility_notice_v1', 'accepted');
    localStorage.setItem('sobaike_location_choice_v1', 'not_now');
    localStorage.removeItem('sobaike_report_draft_v1');
    localStorage.removeItem('sobaike_janao_draft_report');
  });
}

async function scan(page, name) {
  // Let short visual state transitions settle so axe measures the stable UI state.
  await page.waitForTimeout(250);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
    .exclude('.leaflet-container')
    .analyze();

  if (result.violations.length === 0) {
    console.log(`PASS: ${name}`);
    return;
  }

  for (const violation of result.violations) {
    const nodes = violation.nodes
      .slice(0, 5)
      .map((node) => `${node.target.join(' ')} — ${node.failureSummary || node.html}`)
      .join('\n');
    failures.push(`${name}: ${violation.id} (${violation.impact || 'unknown'}) — ${violation.help}\n${nodes}`);
  }
}

async function goto(page, path) {
  await page.goto(routeUrl(path), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#main-content').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(400);
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await seedReturningVisitor(desktop);
const desktopPage = await desktop.newPage();

for (const path of ['/', '/issues', '/harassment', '/search', '/more', '/en/', '/en/issues']) {
  await goto(desktopPage, path);
  await scan(desktopPage, `desktop ${path}`);
}

await goto(desktopPage, '/explore');
const desktopExploreAnalytics = desktopPage.locator('#explore-report-analytics');
const desktopExploreHasAnalytics = await desktopExploreAnalytics
  .waitFor({ state: 'visible', timeout: 3000 })
  .then(() => true)
  .catch(() => false);
await scan(
  desktopPage,
  desktopExploreHasAnalytics ? 'desktop explore analytics' : 'desktop explore shell'
);
if (!desktopExploreHasAnalytics) {
  console.log('SKIP: desktop Explore data-dependent charts (report data unavailable in this runtime)');
}

await desktopPage.evaluate(() => {
  localStorage.setItem('sobaike-janao-theme', 'dark');
  localStorage.setItem('theme', 'dark');
});
await goto(desktopPage, '/');
await desktopPage.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark');
await scan(desktopPage, 'desktop home dark');

await goto(desktopPage, '/');
const firstReportLink = desktopPage.locator('[id^="report-card-"] a[href*="/report-detail/"]').first();
if (await firstReportLink.count()) {
  await firstReportLink.click();
  await desktopPage.locator('#main-content').waitFor({ state: 'visible', timeout: 15000 });
  await desktopPage.waitForTimeout(400);
  await scan(desktopPage, 'desktop report detail');
} else {
  console.log('SKIP: desktop report detail (no report in current dataset)');
}
await desktop.close();

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
await seedReturningVisitor(mobile);
const mobilePage = await mobile.newPage();
await goto(mobilePage, '/');
await scan(mobilePage, 'mobile home');
await goto(mobilePage, '/explore');
const mobileExploreAnalytics = mobilePage.locator('#explore-report-analytics');
const mobileExploreHasAnalytics = await mobileExploreAnalytics
  .waitFor({ state: 'visible', timeout: 3000 })
  .then(() => true)
  .catch(() => false);
await scan(
  mobilePage,
  mobileExploreHasAnalytics ? 'mobile explore analytics' : 'mobile explore shell'
);
if (!mobileExploreHasAnalytics) {
  console.log('SKIP: mobile Explore data-dependent charts (report data unavailable in this runtime)');
}
await mobilePage.locator('#mobile-nav-report').click();
await mobilePage.locator('#report-composer-modal').waitFor({ state: 'visible', timeout: 15000 });
await scan(mobilePage, 'mobile report composer step 1');

await mobilePage.locator('#service-select-card-extortion').click();
await mobilePage.locator('#composer-footer-step1-next-btn').click();
await mobilePage.locator('[id^="subcategory-option-"]').first().click();
await mobilePage.locator('#composer-footer-step2-next-btn').click();
await mobilePage.locator('#composer-footer-step3-review-btn').waitFor({ state: 'visible', timeout: 15000 });
await scan(mobilePage, 'mobile report composer step 3');
await mobilePage.locator('#composer-footer-step3-review-btn').click();
await mobilePage.waitForTimeout(250);
await scan(mobilePage, 'mobile report composer validation errors');

if (process.env.FORM_SCHEMA_SMOKE === '1') {
  await goto(mobilePage, '/__form-schema-smoke');
  await mobilePage.locator('#schema-form-smoke').waitFor({ state: 'visible', timeout: 15000 });

  for (const id of [
    'configured-input-smoke_text',
    'configured-input-smoke_select',
    'configured-field-smoke_radio',
    'configured-field-smoke_checkbox',
    'configured-field-smoke_multiselect',
    'configured-input-smoke_date',
    'configured-input-smoke_time',
    'configured-input-smoke_month',
    'configured-input-smoke_number',
    'configured-input-smoke_phone',
    'configured-input-smoke_email',
    'configured-input-smoke_url',
    'configured-field-smoke_location',
    'configured-field-smoke_subject',
    'configured-field-smoke_evidence',
    'configured-input-smoke_privacy',
  ]) {
    if ((await mobilePage.locator(`#${id}`).count()) !== 1) {
      throw new Error(`Schema runtime fixture is missing #${id}`);
    }
  }

  await scan(mobilePage, 'mobile schema form fixture');
  await mobilePage.locator('#schema-smoke-validate').click();
  await mobilePage.waitForFunction(
    () => document.getElementById('schema-smoke-status')?.getAttribute('data-schema-valid') === 'false'
  );
  await mobilePage.waitForFunction(
    () => document.activeElement?.id === 'configured-input-smoke_text'
  );
  await scan(mobilePage, 'mobile schema form validation errors');

  await mobilePage.locator('#schema-smoke-load-valid').click();
  await mobilePage.locator('#schema-smoke-validate').click();
  await mobilePage.waitForFunction(
    () => document.getElementById('schema-smoke-status')?.getAttribute('data-schema-valid') === 'true'
  );
  await scan(mobilePage, 'mobile schema form valid state');
}
await mobile.close();

const firstVisit = await browser.newContext({ viewport: { width: 390, height: 844 } });
const firstVisitPage = await firstVisit.newPage();
await firstVisitPage.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await firstVisitPage.locator('#first-visit-notice-modal').waitFor({ state: 'visible', timeout: 15000 });
await scan(firstVisitPage, 'mobile first visit modal');
await firstVisit.close();

await browser.close();

if (failures.length > 0) {
  console.error(`Accessibility browser audit failed with ${failures.length} violation group(s):`);
  for (const failure of failures) console.error(`\n---\n${failure}`);
  process.exit(1);
}

console.log('Accessibility browser audit passed with no WCAG A/AA axe violations in the tested surfaces.');
