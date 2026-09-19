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
    if (status === 404 && url.startsWith(SITE_URL)) {
      failures.push(`${label} same-origin HTTP 404: ${url}`);
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
  await expectVisible(
    page.locator('#location-reminder-bar'),
    'location reminder did not appear after responsibility acknowledgement'
  );
  await page.locator('#location-reminder-turn-on-btn').click();
  const locationModal = page.locator('#location-consent-modal');
  await expectVisible(locationModal, 'location consent did not open from the explicit location CTA');
  await expectVisible(page.locator('#location-consent-secondary-btn'), 'Not now action missing');
  const ipFallbackResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/functions/v1/public-ip-location') &&
      response.request().method() === 'GET',
    { timeout: 10000 }
  ).catch(() => null);
  await page.locator('#location-consent-secondary-btn').click();
  await locationModal.waitFor({ state: 'hidden', timeout: 10000 });
  const ipResponse = await ipFallbackResponse;
  if (!ipResponse || !ipResponse.ok()) {
    throw new Error('Not now did not establish the approximate IP browse-location fallback');
  }
  if (await page.locator('#location-reminder-bar').isVisible().catch(() => false)) {
    throw new Error('location reminder should disappear after Not now');
  }
  const stored = await page.evaluate(() => ({
    notice: localStorage.getItem('sobaike_responsibility_notice_v1'),
    location: localStorage.getItem('sobaike_location_choice_v1'),
  }));
  if (stored.notice !== 'accepted' || stored.location !== 'not_now') throw new Error(`unexpected stored state ${JSON.stringify(stored)}`);

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(350);
  if (await page.locator('#location-reminder-bar').isVisible().catch(() => false)) {
    throw new Error('location reminder returned after refresh despite stored Not now choice');
  }
  await context.close();
});

await check('Stored Not now remains IP-only even when browser permission is already granted', async () => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    geolocation: { latitude: 23.7806, longitude: 90.4070 },
  });
  await context.grantPermissions(['geolocation'], { origin: new URL(SITE_URL).origin });
  await context.addInitScript(() => {
    localStorage.setItem('sobaike_responsibility_notice_v1', 'accepted');
    localStorage.setItem('sobaike_location_choice_v1', 'not_now');
  });

  const page = await context.newPage();
  attachRuntimeGuards(page, 'location-not-now-pregranted');
  const ipFallbackResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/functions/v1/public-ip-location') &&
      response.request().method() === 'GET',
    { timeout: 10000 }
  ).catch(() => null);

  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const ipResponse = await ipFallbackResponse;
  if (!ipResponse || !ipResponse.ok()) {
    throw new Error('stored Not now did not use approximate IP location');
  }

  await page.waitForTimeout(500);
  const choice = await page.evaluate(() => localStorage.getItem('sobaike_location_choice_v1'));
  if (choice !== 'not_now') {
    throw new Error(`stored Not now was silently upgraded to ${choice}`);
  }
  if (await page.locator('#location-reminder-bar').isVisible().catch(() => false)) {
    throw new Error('stored Not now should not show the location reminder');
  }
  await context.close();
});

await check('Escape from browse location prompt behaves exactly like Not now', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    localStorage.setItem('sobaike_responsibility_notice_v1', 'accepted');
    localStorage.removeItem('sobaike_location_choice_v1');
  });

  const page = await context.newPage();
  attachRuntimeGuards(page, 'location-escape');
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expectVisible(page.locator('#location-reminder-bar'), 'location reminder missing before Escape test');
  await page.locator('#location-reminder-turn-on-btn').click();
  const locationModal = page.locator('#location-consent-modal');
  await expectVisible(locationModal, 'location modal missing before Escape test');

  const ipFallbackResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/functions/v1/public-ip-location') &&
      response.request().method() === 'GET',
    { timeout: 10000 }
  ).catch(() => null);

  await page.keyboard.press('Escape');
  await locationModal.waitFor({ state: 'hidden', timeout: 10000 });
  const ipResponse = await ipFallbackResponse;
  if (!ipResponse || !ipResponse.ok()) {
    throw new Error('Escape did not establish approximate IP browse location');
  }

  const choice = await page.evaluate(() => localStorage.getItem('sobaike_location_choice_v1'));
  if (choice !== 'not_now') {
    throw new Error(`Escape should persist Not now; got ${choice}`);
  }

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(350);
  if (await page.locator('#location-reminder-bar').isVisible().catch(() => false)) {
    throw new Error('location reminder returned after Escape/Not now refresh');
  }
  await context.close();
});

await check('Technical GPS failure persists IP fallback and does not nag on refresh', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    localStorage.setItem('sobaike_responsibility_notice_v1', 'accepted');
    localStorage.removeItem('sobaike_location_choice_v1');

    const geolocation = navigator.geolocation;
    if (geolocation) {
      geolocation.getCurrentPosition = (_success, error) => {
        window.setTimeout(() => {
          error?.({
            code: 2,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
            message: 'simulated position unavailable',
          });
        }, 0);
      };
    }
  });

  const page = await context.newPage();
  attachRuntimeGuards(page, 'location-technical-fallback');
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expectVisible(page.locator('#location-reminder-bar'), 'location reminder missing before fallback test');
  await page.locator('#location-reminder-turn-on-btn').click();
  const locationModal = page.locator('#location-consent-modal');
  await expectVisible(locationModal, 'location modal missing before fallback test');

  const ipFallbackResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/functions/v1/public-ip-location') &&
      response.request().method() === 'GET',
    { timeout: 10000 }
  ).catch(() => null);

  await page.locator('#location-consent-primary-btn').click();
  await locationModal.waitFor({ state: 'hidden', timeout: 10000 });
  const ipResponse = await ipFallbackResponse;
  if (!ipResponse || !ipResponse.ok()) {
    throw new Error('technical GPS failure did not establish IP fallback');
  }

  const choice = await page.evaluate(() => localStorage.getItem('sobaike_location_choice_v1'));
  if (choice !== 'ip_fallback') {
    throw new Error(`technical GPS fallback should persist ip_fallback; got ${choice}`);
  }

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(500);
  if (await page.locator('#location-reminder-bar').isVisible().catch(() => false)) {
    throw new Error('technical GPS fallback caused the location reminder to return after refresh');
  }
  await context.close();
});

await check('Returning denied-location visitor is not nagged after refresh', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    localStorage.setItem('sobaike_responsibility_notice_v1', 'accepted');
    localStorage.setItem('sobaike_location_choice_v1', 'denied');
  });
  const page = await context.newPage();
  attachRuntimeGuards(page, 'location-denied-returning');
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(500);
  if (await page.locator('#location-reminder-bar').isVisible().catch(() => false)) {
    throw new Error('location reminder should stay hidden for a returning visitor who already denied device location');
  }
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(500);
  if (await page.locator('#location-reminder-bar').isVisible().catch(() => false)) {
    throw new Error('location reminder reappeared after refresh for stored denied choice');
  }
  await context.close();
});

await check('Browse location grant flow works with simulated coordinates', async () => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    geolocation: { latitude: 23.7806, longitude: 90.4070 },
  });
  await context.addInitScript(() => {
    localStorage.setItem('sobaike_responsibility_notice_v1', 'accepted');
    localStorage.removeItem('sobaike_location_choice_v1');
  });
  const page = await context.newPage();
  attachRuntimeGuards(page, 'location-granted');
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expectVisible(page.locator('#location-reminder-bar'), 'location reminder did not render for undecided visitor');
  await page.locator('#location-reminder-turn-on-btn').click();
  const locationModal = page.locator('#location-consent-modal');
  await expectVisible(locationModal, 'location consent did not open from the explicit location CTA');
  await context.grantPermissions(['geolocation'], { origin: new URL(SITE_URL).origin });
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

await check('Home infinite feed autoloads with bounded mounted cards', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  attachRuntimeGuards(page, 'home-infinite-performance');

  let feedRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/rest/v1/rpc/get_public_home_feed_page')) {
      feedRequests += 1;
    }
  });

  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  const feed = page.locator('#home-virtualized-feed');
  await feed.waitFor({ state: 'attached', timeout: 15000 });

  const loadedCount = async () =>
    Number((await feed.getAttribute('data-loaded-count')) || 0);

  await page.waitForFunction(() => {
    const node = document.querySelector('#home-virtualized-feed');
    return Number(node?.getAttribute('data-loaded-count') || 0) >= 10;
  });

  for (const target of [20, 30, 40, 50]) {
    if ((await loadedCount()) >= target) continue;

    const sentinel = page.locator('#home-infinite-feed-sentinel');
    await sentinel.waitFor({ state: 'attached', timeout: 15000 });
    await sentinel.scrollIntoViewIfNeeded();

    await page.waitForFunction(
      (minimum) => {
        const node = document.querySelector('#home-virtualized-feed');
        return Number(node?.getAttribute('data-loaded-count') || 0) >= minimum;
      },
      target,
      { timeout: 15000 }
    );
  }

  await page.waitForTimeout(700);

  const state = await page.evaluate(() => {
    const feedNode = document.querySelector('#home-virtualized-feed');
    const cardIds = Array.from(document.querySelectorAll('[id^="report-card-"]'))
      .map((node) => node.id);

    return {
      loaded: Number(feedNode?.getAttribute('data-loaded-count') || 0),
      mountedPages: document.querySelectorAll(
        '[data-virtualized-report-page][data-mounted="true"]'
      ).length,
      mountedCards: cardIds.length,
      uniqueMountedCards: new Set(cardIds).size,
      manualLoadMore: document.querySelectorAll('#home-load-more-button').length,
    };
  });

  if (state.loaded < 50) {
    throw new Error(`infinite feed stopped early at ${state.loaded} loaded reports`);
  }
  if (state.manualLoadMore !== 0) {
    throw new Error('manual Home load-more control returned');
  }
  if (state.mountedCards > 40 || state.mountedPages > 4) {
    throw new Error(
      `virtualization window is too large: pages=${state.mountedPages}, cards=${state.mountedCards}`
    );
  }
  if (state.mountedCards !== state.uniqueMountedCards) {
    throw new Error('duplicate mounted report IDs detected during infinite scrolling');
  }

  const expectedPages = Math.ceil(state.loaded / 10);
  if (feedRequests > expectedPages + 1) {
    throw new Error(
      `too many Home page RPCs: requests=${feedRequests}, loaded=${state.loaded}`
    );
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
  const banglaLanguage = page.locator('#drawer-lang-bn');
  const englishLanguage = page.locator('#drawer-lang-en');
  await expectVisible(banglaLanguage, 'Bangla language option missing');
  await expectVisible(englishLanguage, 'English language option missing');
  if ((await banglaLanguage.getAttribute('aria-pressed')) !== 'true') {
    throw new Error('Bangla should be selected initially');
  }
  await englishLanguage.click();
  await page.waitForTimeout(150);
  if ((await page.locator('html').getAttribute('lang')) !== 'en') throw new Error('language did not switch to English');
  if ((await page.locator('#drawer-lang-en').getAttribute('aria-pressed')) !== 'true') {
    throw new Error('English language option did not expose the selected state');
  }
  const themeDark = page
    .locator('#tablet-drawer button[aria-pressed]')
    .filter({ hasText: 'Dark' })
    .first();
  if (await themeDark.count()) {
    await themeDark.click();
    await page.waitForTimeout(150);
    const className = await page.locator('html').getAttribute('class');
    if (!String(className).includes('dark')) throw new Error('dark theme did not apply');
    if ((await themeDark.getAttribute('aria-pressed')) !== 'true') {
      throw new Error('dark theme control did not expose the selected state');
    }
  } else {
    throw new Error('dark theme control not found');
  }
  await context.close();
});

await check('English SEO variant is prerendered, URL-addressable and self-canonical', async () => {
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  attachRuntimeGuards(page, 'english-seo');
  await page.goto(routeUrl('/en/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(500);

  if ((await page.locator('html').getAttribute('lang')) !== 'en') {
    throw new Error('English /en/ URL did not render with html lang=en');
  }

  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  if (canonical !== routeUrl('/en/')) {
    throw new Error(`English URL is not self-canonical: ${canonical}`);
  }

  const bnAlternate = await page.locator('link[rel="alternate"][hreflang="bn-BD"]').getAttribute('href');
  const enAlternate = await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute('href');
  if (bnAlternate !== routeUrl('/') || enAlternate !== routeUrl('/en/')) {
    throw new Error(`language alternates invalid: bn=${bnAlternate}, en=${enAlternate}`);
  }

  await page.goto(routeUrl('/en/public-safety'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(300);
  if ((await page.locator('html').getAttribute('lang')) !== 'en') {
    throw new Error('English category route lost html lang=en');
  }
  const categoryCanonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  if (categoryCanonical !== routeUrl('/en/public-safety')) {
    throw new Error(`English category canonical is incorrect: ${categoryCanonical}`);
  }

  await context.close();
});

await check('Legacy ?lang=en links migrate to /en paths', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  attachRuntimeGuards(page, 'legacy-english-url');
  await page.goto(routeUrl('/public-safety?lang=en'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(500);
  if (!page.url().includes('/en/public-safety') || page.url().includes('lang=en')) {
    throw new Error(`legacy English URL was not migrated: ${page.url()}`);
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

await check('Issues category counts match the live published report feed', async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Supabase test credentials are unavailable');

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  const [popularityResponse, reportsResponse] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/rpc/get_public_category_popularity`, {
      method: 'POST',
      headers,
      body: '{}',
    }),
    fetch(`${supabaseUrl}/rest/v1/rpc/get_public_published_reports`, {
      method: 'POST',
      headers,
      body: '{}',
    }),
  ]);

  if (!popularityResponse.ok) {
    throw new Error(`category popularity RPC returned ${popularityResponse.status}`);
  }
  if (!reportsResponse.ok) {
    throw new Error(`published reports RPC returned ${reportsResponse.status}`);
  }

  const popularityRows = await popularityResponse.json();
  const publishedPayload = await reportsResponse.json();

  if (!Array.isArray(popularityRows)) {
    throw new Error('category popularity RPC did not return a row array');
  }

  const liveCounts = new Map();
  const queue = [publishedPayload];
  while (queue.length) {
    const item = queue.shift();
    if (Array.isArray(item)) {
      queue.push(...item);
      continue;
    }
    if (!item || typeof item !== 'object') continue;

    if (typeof item.segment === 'string' && item.segment) {
      liveCounts.set(item.segment, (liveCounts.get(item.segment) || 0) + 1);
      continue;
    }

    queue.push(...Object.values(item));
  }

  for (const row of popularityRows) {
    const segmentId = row?.segment_id;
    if (typeof segmentId !== 'string' || !segmentId) continue;

    const issuesCount = Number(row.published_post_count || 0);
    const liveCount = Number(liveCounts.get(segmentId) || 0);

    if (issuesCount !== liveCount) {
      throw new Error(
        `issues count mismatch for ${segmentId}: issues=${issuesCount}, live-feed=${liveCount}`
      );
    }
  }
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

  const robots = await page.locator('meta[name="robots"]').getAttribute('content');
  if (!robots || !/index/i.test(robots) || /noindex/i.test(robots)) {
    throw new Error(`published report became non-indexable after hydration: ${robots}`);
  }

  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  if (!canonical || !canonical.includes(`/report-detail/${encodeURIComponent(reportId)}`)) {
    throw new Error(`published report canonical is incorrect: ${canonical}`);
  }

  const title = await page.title();
  if ([...title].length > 60) {
    throw new Error(`published report SEO title is too long: ${[...title].length}`);
  }

  const description = await page.locator('meta[name="description"]').getAttribute('content');
  const descriptionLength = [...(description || '')].length;
  if (descriptionLength < 90 || descriptionLength > 160) {
    throw new Error(`published report meta description length is ${descriptionLength}`);
  }

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