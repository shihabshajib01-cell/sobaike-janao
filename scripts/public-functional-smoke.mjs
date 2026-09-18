import { chromium } from 'playwright';

const SITE_URL = (process.env.SITE_URL || 'https://shobaikejanao.com/').replace(/\/?$/, '/');
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
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalized.replace(/^\//, ''), SITE_URL).toString();
}

function currentPath(page) {
  return new URL(page.url()).pathname;
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
    localStorage.removeItem('sobaike_janao_draft_report');
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
  await expectVisible(page.locator('#location-consent-secondary-btn'), 'Not now action missing');
  await page.locator('#location-consent-secondary-btn').click();
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
  await expectVisible(page.locator('#location-consent-primary-btn'), 'Turn on location action missing');
  await page.locator('#location-consent-primary-btn').click();
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

await check('Mobile navigation, issue rows and category controls follow the approved contract', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  attachRuntimeGuards(page, 'mobile-nav');
  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expectVisible(page.locator('#bottom-nav'), 'mobile bottom navigation missing');

  const cases = [
    ['#bottom-nav-home', '/'],
    ['#bottom-nav-issues', '/issues'],
    ['#bottom-nav-explore', '/explore'],
  ];
  for (const [selector, path] of cases) {
    await page.locator(selector).click();
    await page.waitForTimeout(path === '/explore' ? 900 : 350);
    if (currentPath(page) !== path) throw new Error(`${selector} did not navigate to ${path}; got ${page.url()}`);
    await expectVisible(page.locator('#main-content'), `${selector} destination did not render`);
  }

  await page.goto(routeUrl('/issues'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expectVisible(page.locator('#issues-category-grid'), 'Issues category list did not render');
  const firstCard = await page.locator('#issues-card-harassment').boundingBox();
  const secondCard = await page.locator('#issues-card-extortion').boundingBox();
  if (!firstCard || !secondCard) throw new Error('Issue category cards are not measurable');
  if (secondCard.y <= firstCard.y + firstCard.height - 2) throw new Error('Issue categories are not stacked one per row');

  await page.locator('#issues-card-harassment').click();
  await page.waitForTimeout(350);
  if (currentPath(page) !== '/harassment') throw new Error(`Issue card did not navigate to harassment; got ${page.url()}`);
  await expectVisible(page.locator('#mobile-category-header'), 'contextual category header missing');
  await expectVisible(page.locator('#mobile-category-filter-btn'), 'Harassment category filter action missing');
  if ((await page.locator('#bottom-nav').count()) !== 0) throw new Error('Bottom navigation should be hidden on category pages');
  if ((await page.locator('#mobile-category-location-filter-select').count()) !== 0) throw new Error('Harassment should keep its existing filter behavior');

  await page.locator('#mobile-category-back-btn').click();
  await page.waitForTimeout(350);
  if (currentPath(page) !== '/issues') throw new Error(`category back did not return to Issues; got ${page.url()}`);

  await page.locator('#issues-card-extortion').click();
  await page.waitForTimeout(350);
  if (currentPath(page) !== '/extortion') throw new Error(`Issue card did not navigate to extortion; got ${page.url()}`);
  await expectVisible(page.locator('#mobile-category-filter-btn'), 'mobile category filter action missing');
  await page.locator('#mobile-category-filter-btn').click();
  await expectVisible(page.locator('#extortion-filter-sheet'), 'mobile category filter sheet did not open');
  await expectVisible(page.locator('#extortion-filter-division'), 'mobile division filter missing');
  await expectVisible(page.locator('#extortion-filter-district'), 'mobile district filter missing');
  await page.locator('#extortion-filter-apply-btn').click();
  await page.locator('#extortion-filter-sheet').waitFor({ state: 'hidden', timeout: 10000 });
  if ((await page.locator('#bottom-nav').count()) !== 0) throw new Error('Bottom navigation should be hidden on extortion category page');
  if ((await page.getByText('জরুরি সহায়তার জন্য ৯৯৯', { exact: false }).count()) !== 0) throw new Error('Removed emergency assistance strip is still visible');

  await context.close();
});

await check('Legacy hash links migrate to clean URLs', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  attachRuntimeGuards(page, 'legacy-hash');
  await page.goto(`${SITE_URL}#/harassment`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(350);
  if (currentPath(page) !== '/harassment') {
    throw new Error(`legacy hash route did not migrate; got ${page.url()}`);
  }
  if (new URL(page.url()).hash.startsWith('#/')) {
    throw new Error(`legacy hash fragment was not removed; got ${page.url()}`);
  }
  await context.close();
});

await check('Report composer has no draft persistence and uses the approved two-action cancel flow', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedReturningVisitor(context);
  await context.addInitScript(() => {
    localStorage.setItem('sobaike_janao_draft_report', JSON.stringify({ segment: 'harassment', currentStep: 4, title: 'legacy draft' }));
  });
  const page = await context.newPage();
  attachRuntimeGuards(page, 'report-composer');
  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#mobile-nav-report').click();
  await expectVisible(page.locator('#report-composer-modal'), 'report composer did not open');
  const dialog = page.locator('#report-composer-modal');
  if ((await dialog.getAttribute('role')) !== 'dialog') throw new Error('report composer is missing dialog semantics');
  if ((await page.getByText('সংরক্ষিত খসড়া', { exact: true }).count()) !== 0) throw new Error('legacy saved-draft recovery UI is still present');
  const legacyDraft = await page.evaluate(() => localStorage.getItem('sobaike_janao_draft_report'));
  if (legacyDraft !== null) throw new Error('legacy draft localStorage was not cleared');

  await page.locator('#service-select-card-harassment').click();
  await page.locator('#report-composer-close-btn').click();
  const confirm = page.locator('#report-cancel-confirm-modal');
  await expectVisible(confirm, 'cancel-report confirmation did not open');
  await expectVisible(page.locator('#report-continue-editing-btn'), 'Continue editing action is missing');
  await expectVisible(page.locator('#report-cancel-btn'), 'Cancel reporting action is missing');
  if ((await confirm.locator('button').count()) !== 2) throw new Error('cancel-report confirmation must contain exactly two buttons');
  if ((await page.locator('#draft-save-exit-btn, #draft-discard-btn, [id^="draft-recovery-"]').count()) !== 0) throw new Error('removed draft actions are still present');

  await page.locator('#report-continue-editing-btn').click();
  await confirm.waitFor({ state: 'hidden', timeout: 10000 });
  await expectVisible(page.locator('#report-composer-modal'), 'composer should remain open after Continue editing');

  await page.locator('#report-composer-close-btn').click();
  await expectVisible(confirm, 'cancel-report confirmation did not reopen');
  await page.locator('#report-cancel-btn').click();
  await page.locator('#report-composer-modal').waitFor({ state: 'hidden', timeout: 10000 });
  const storedDrafts = await page.evaluate(() => ({
    current: localStorage.getItem('sobaike_janao_draft_report'),
    legacy: localStorage.getItem('sobaike_report_draft_v1'),
  }));
  if (storedDrafts.current !== null || storedDrafts.legacy !== null) throw new Error('draft storage exists after cancellation: ' + JSON.stringify(storedDrafts));
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

  const citizenButton = page.locator('#btn-respond-citizen-info');
  if (await citizenButton.count()) {
    await citizenButton.click();
    const citizenModal = page.locator('#citizen-action-modal');
    await expectVisible(citizenModal, 'citizen information modal did not open');

    const citizenDescription = page.locator('#citizen-description-input');
    const citizenDraft = 'Smoke test unsaved citizen information';
    await citizenDescription.fill(citizenDraft);
    await page.locator('#citizen-action-modal-close').click();

    const citizenDiscard = page.locator('#citizen-action-discard-confirm-modal');
    await expectVisible(citizenDiscard, 'citizen dirty-close confirmation did not open');

    const citizenParentIsInert = await citizenModal.evaluate((element) => Boolean(element.inert));
    if (!citizenParentIsInert) {
      throw new Error('citizen modal was not isolated while nested discard confirmation was open');
    }

    await page.locator('#citizen-action-discard-confirm-modal-keep-editing-btn').click();
    await citizenDiscard.waitFor({ state: 'hidden', timeout: 10000 });

    if ((await citizenDescription.inputValue()) !== citizenDraft) {
      throw new Error('citizen draft was lost after choosing to keep editing');
    }

    await page.locator('#citizen-action-modal-close').click();
    await expectVisible(citizenDiscard, 'citizen discard confirmation did not reopen');
    await page.locator('#citizen-action-discard-confirm-modal-discard-btn').click();
    await citizenModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  const subjectButton = page.locator('#btn-respond-subject-party');
  if (await subjectButton.count()) {
    await subjectButton.click();
    const subjectModal = page.locator('#subject-response-modal');
    await expectVisible(subjectModal, 'subject response modal did not open');

    const subjectNameInput = page.locator('#subject-responder-name-input');
    const subjectDraft = 'Smoke Test Responder';
    await subjectNameInput.fill(subjectDraft);
    await page.locator('#subject-response-modal-close').click();

    const subjectDiscard = page.locator('#subject-response-discard-confirm-modal');
    await expectVisible(subjectDiscard, 'subject dirty-close confirmation did not open');

    const subjectParentIsInert = await subjectModal.evaluate((element) => Boolean(element.inert));
    if (!subjectParentIsInert) {
      throw new Error('subject response modal was not isolated while nested discard confirmation was open');
    }

    await page.locator('#subject-response-discard-confirm-modal-keep-editing-btn').click();
    await subjectDiscard.waitFor({ state: 'hidden', timeout: 10000 });

    if ((await subjectNameInput.inputValue()) !== subjectDraft) {
      throw new Error('subject response draft was lost after choosing to keep editing');
    }

    await page.locator('#subject-response-modal-close').click();
    await expectVisible(subjectDiscard, 'subject discard confirmation did not reopen');
    await page.locator('#subject-response-discard-confirm-modal-discard-btn').click();
    await subjectModal.waitFor({ state: 'hidden', timeout: 10000 });
  }

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