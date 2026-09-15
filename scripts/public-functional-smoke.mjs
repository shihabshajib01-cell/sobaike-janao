import { chromium } from 'playwright';

const SITE_URL = (process.env.SITE_URL || 'https://shihabshajib01-cell.github.io/sobaike-janao/').replace(/\/?$/, '/');
const failures = [];
const warnings = [];
const results = [];

function pass(name) {
  results.push({ name, status: 'PASS' });
  console.log(`PASS: ${name}`);
}
function fail(name, error) {
  failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  results.push({ name, status: 'FAIL' });
  console.error(`FAIL: ${name}`, error);
}
async function check(name, fn) {
  try { await fn(); pass(name); } catch (error) { fail(name, error); }
}
function routeUrl(path) {
  return `${SITE_URL}#${path.startsWith('/') ? path : `/${path}`}`;
}
function attachRuntimeGuards(page, label) {
  page.on('pageerror', (error) => failures.push(`${label} pageerror: ${error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') warnings.push(`${label} console error: ${msg.text()}`);
  });
  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 500 && (url.startsWith(SITE_URL) || url.includes('supabase.co'))) {
      failures.push(`${label} HTTP ${status}: ${url}`);
    }
  });
}
async function seedReturningVisitor(context) {
  await context.addInitScript(() => {
    localStorage.setItem('sobaike_responsibility_notice_v1', 'accepted');
    localStorage.setItem('sobaike_location_choice_v1', 'not_now');
    localStorage.removeItem('sobaike_report_draft_v1');
  });
}
async function expectVisible(locator, message) {
  await locator.waitFor({ state: 'visible', timeout: 15000 });
  if (!(await locator.isVisible())) throw new Error(message);
}

const browser = await chromium.launch({ headless: true });

await check('First-visit responsibility -> location -> Not now flow', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  attachRuntimeGuards(page, 'first-visit');
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const notice = page.locator('#first-visit-notice-modal');
  await expectVisible(notice, 'responsibility notice did not open');
  const continueBtn = page.locator('#first-visit-acknowledge-btn');
  if (!(await continueBtn.isDisabled())) throw new Error('continue button should start disabled');
  await page.locator('label[for="first-visit-ack-checkbox"]').click();
  if (await continueBtn.isDisabled()) throw new Error('continue button did not enable after acknowledgement');
  await continueBtn.click();
  const locationModal = page.locator('#location-consent-modal');
  await expectVisible(locationModal, 'location consent did not open after acknowledgement');
  const modalButtons = locationModal.locator('button');
  if ((await modalButtons.count()) < 2) throw new Error('location consent actions missing');
  await modalButtons.nth(1).click();
  await locationModal.waitFor({ state: 'hidden', timeout: 10000 });
  await expectVisible(page.locator('#location-reminder-bar'), 'location reminder did not appear after Not now');
  const stored = await page.evaluate(() => ({
    notice: localStorage.getItem('sobaike_responsibility_notice_v1'),
    location: localStorage.getItem('sobaike_location_choice_v1'),
  }));
  if (stored.notice !== 'accepted' || stored.location !== 'not_now') throw new Error(`unexpected stored state ${JSON.stringify(stored)}`);
  await context.close();
});

await check('Browse location grant flow works with simulated coordinates', async () => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    geolocation: { latitude: 23.7806, longitude: 90.4070 },
  });
  await context.grantPermissions(['geolocation'], { origin: new URL(SITE_URL).origin });
  await context.addInitScript(() => {
    localStorage.setItem('sobaike_responsibility_notice_v1', 'accepted');
    localStorage.removeItem('sobaike_location_choice_v1');
  });
  const page = await context.newPage();
  attachRuntimeGuards(page, 'location-granted');
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const locationModal = page.locator('#location-consent-modal');
  await expectVisible(locationModal, 'location consent did not open for undecided visitor');
  const modalButtons = locationModal.locator('button');
  if ((await modalButtons.count()) < 2) throw new Error('location consent actions missing');
  await modalButtons.nth(0).click();
  await locationModal.waitFor({ state: 'hidden', timeout: 15000 });
  const choice = await page.evaluate(() => localStorage.getItem('sobaike_location_choice_v1'));
  if (choice !== 'granted') throw new Error(`expected granted location choice; got ${choice}`);
  if (await page.locator('#location-reminder-bar').isVisible().catch(() => false)) throw new Error('location reminder should be hidden after successful grant');
  await context.close();
});

const desktopRoutes = ['/', '/harassment', '/rickshaw', '/extortion', '/load-shedding', '/illegal-occupation', '/explore', '/search', '/more'];
await check('Desktop routes render without runtime crashes', async () => {
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  attachRuntimeGuards(page, 'desktop-routes');
  for (const route of desktopRoutes) {
    await page.goto(routeUrl(route), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expectVisible(page.locator('#main-content'), `${route} main content missing`);
    await page.waitForTimeout(route === '/explore' ? 1800 : 500);
    const text = (await page.locator('#main-content').innerText()).trim();
    if (!text) throw new Error(`${route} rendered empty main content`);
  }
  await context.close();
});

await check('Mobile bottom navigation works across all five primary sections', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  attachRuntimeGuards(page, 'mobile-nav');
  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expectVisible(page.locator('#bottom-nav'), 'mobile bottom navigation missing');
  const cases = [
    ['#bottom-nav-home', '#/'],
    ['#bottom-nav-harassment', '#/harassment'],
    ['#bottom-nav-charging', '#/rickshaw'],
    ['#bottom-nav-extortion', '#/extortion'],
    ['#bottom-nav-utility', '#/load-shedding'],
  ];
  for (const [selector, hash] of cases) {
    await page.locator(selector).click();
    await page.waitForTimeout(350);
    if (!page.url().includes(hash)) throw new Error(`${selector} did not navigate to ${hash}; got ${page.url()}`);
    await expectVisible(page.locator('#main-content'), `${selector} destination did not render`);
  }
  await context.close();
});

await check('Report composer opens on mobile without submitting data', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  attachRuntimeGuards(page, 'report-composer');
  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#mobile-fab-report').click();
  await expectVisible(page.locator('#report-composer-modal'), 'report composer did not open');
  const dialog = page.locator('#report-composer-modal');
  if ((await dialog.getAttribute('role')) !== 'dialog') throw new Error('report composer is missing dialog semantics');
  await context.close();
});

await check('Tablet menu, language toggle and theme controls are interactive', async () => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  attachRuntimeGuards(page, 'settings');
  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#tablet-menu-button').click();
  await expectVisible(page.locator('#tablet-drawer'), 'tablet drawer did not open');
  const lang = page.locator('#drawer-lang-toggle');
  await lang.click();
  await page.waitForTimeout(150);
  if ((await page.locator('html').getAttribute('lang')) !== 'en') throw new Error('language did not switch to English');
  const themeDark = page.locator('[role="radio"]').filter({ hasText: 'Dark' }).first();
  if (await themeDark.count()) {
    await themeDark.click();
    await page.waitForTimeout(150);
    const className = await page.locator('html').getAttribute('class');
    if (!String(className).includes('dark')) throw new Error('dark theme did not apply');
  } else {
    throw new Error('dark theme control not found');
  }
  await context.close();
});

await check('Search page accepts a query without crashing', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  attachRuntimeGuards(page, 'search');
  await page.goto(routeUrl('/search'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  const input = page.locator('input[type="search"], input[placeholder]').first();
  await expectVisible(input, 'search input not found');
  await input.fill('ঢাকা');
  await page.waitForTimeout(800);
  await expectVisible(page.locator('#main-content'), 'search page failed after query');
  await context.close();
});

await check('Public report detail route renders when a published report is available', async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Supabase test credentials are unavailable');
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_public_published_reports`, {
    method: 'POST',
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!response.ok) throw new Error(`published reports RPC returned ${response.status}`);
  const data = await response.json();
  const queue = [data];
  let reportId = null;
  while (queue.length && !reportId) {
    const item = queue.shift();
    if (Array.isArray(item)) queue.push(...item);
    else if (item && typeof item === 'object') {
      if (typeof item.id === 'string' && item.id) reportId = item.id;
      else queue.push(...Object.values(item));
    }
  }
  if (!reportId) {
    warnings.push('No published report available; report-detail browser check skipped');
    return;
  }
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  attachRuntimeGuards(page, 'report-detail');
  await page.goto(routeUrl(`/report-detail/${encodeURIComponent(reportId)}`), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expectVisible(page.locator('#main-content'), 'report detail main content missing');
  await page.waitForTimeout(1200);
  const text = (await page.locator('#main-content').innerText()).trim();
  if (!text) throw new Error('report detail rendered empty content');
  await context.close();
});

await browser.close();

console.log('\n=== PUBLIC FUNCTIONAL SMOKE SUMMARY ===');
for (const result of results) console.log(`${result.status} - ${result.name}`);
if (warnings.length) {
  console.log('\nWarnings:');
  warnings.forEach((w) => console.log(`WARN - ${w}`));
}
if (failures.length) {
  console.error('\nFailures:');
  failures.forEach((f) => console.error(`FAIL - ${f}`));
  process.exit(1);
}
console.log('\nALL NON-DESTRUCTIVE PUBLIC FUNCTIONAL SMOKE CHECKS PASSED');
