import { chromium } from 'playwright';

const SITE_URL = (process.env.SITE_URL || 'https://shobaikejanao.com/').replace(/\/?$/, '/');

const CATEGORY_ROUTES = [
  '/harassment',
  '/extortion',
  '/public-safety',
  '/road-transport',
  '/load-shedding',
  '/illegal-occupation',
  '/rickshaw',
];

const EXPECTED_ISSUE_CARD_IDS = [
  'issues-card-harassment',
  'issues-card-extortion',
  'issues-card-public_safety',
  'issues-card-road_transport',
  'issues-card-load_shedding',
  'issues-card-illegal_occupation',
  'issues-card-rickshaw',
].sort();

const failures = [];

function routeUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalized.replace(/^\//, ''), SITE_URL).toString();
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

async function check(name, fn) {
  try {
    await fn();
    console.log(`PASS: ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${name}: ${message}`);
    console.error(`FAIL: ${name}: ${message}`);
  }
}

const browser = await chromium.launch({ headless: true });

await check('All seven category routes render on desktop', async () => {
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();

  for (const route of CATEGORY_ROUTES) {
    await page.goto(routeUrl(route), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expectVisible(page.locator('#main-content'), `${route} main content missing`);
    await page.waitForTimeout(450);
    const text = (await page.locator('#main-content').innerText()).trim();
    if (!text) throw new Error(`${route} rendered empty main content`);
    if ((await page.locator('#desktop-category-filter-slot').count()) !== 1) {
      throw new Error(`${route} is not using the shared category feed/filter presentation`);
    }
  }

  await context.close();
});

await check('Issues remains one-card-per-row regardless of popularity order', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  await page.goto(routeUrl('/issues'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expectVisible(page.locator('#issues-category-grid'), 'Issues category list missing');

  const cards = page.locator('#issues-category-grid [id^="issues-card-"]');
  const count = await cards.count();
  if (count !== 7) throw new Error(`expected 7 issue cards, found ${count}`);

  const ids = (await cards.evaluateAll((nodes) => nodes.map((node) => node.id))).sort();
  if (JSON.stringify(ids) !== JSON.stringify(EXPECTED_ISSUE_CARD_IDS)) {
    throw new Error(`issue-card set mismatch: ${JSON.stringify(ids)}`);
  }

  const boxes = [];
  for (let index = 0; index < count; index += 1) {
    const box = await cards.nth(index).boundingBox();
    if (!box) throw new Error(`issue card ${index + 1} is not measurable`);
    boxes.push(box);
  }

  boxes.sort((a, b) => a.y - b.y);
  for (let index = 1; index < boxes.length; index += 1) {
    const previous = boxes[index - 1];
    const current = boxes[index];
    if (current.y < previous.y + previous.height - 2) {
      throw new Error('issue cards overlap or render in more than one column');
    }
  }

  await context.close();
});

await check('Issues direct route remains visible on tablet and desktop', async () => {
  const viewports = [
    { width: 1024, height: 768, label: 'tablet' },
    { width: 1365, height: 900, label: 'desktop' },
  ];

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    await seedReturningVisitor(context);
    const page = await context.newPage();
    await page.goto(routeUrl('/issues'), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expectVisible(page.locator('#issues-page-container'), `Issues page hidden on ${viewport.label}`);
    await expectVisible(page.locator('#issues-category-grid'), `Issues category list hidden on ${viewport.label}`);
    const cardCount = await page.locator('#issues-category-grid [id^="issues-card-"]').count();
    if (cardCount !== 7) throw new Error(`${viewport.label} Issues route expected 7 cards, found ${cardCount}`);
    await context.close();
  }
});

await check('Home uses the shared filter rail and report cards are keyboard reachable', async () => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expectVisible(page.locator('#home-feed-filter-rail'), 'Home shared filter rail missing');

  const firstCard = page.locator('[id^="report-card-"][role="link"]').first();
  await expectVisible(firstCard, 'No keyboard-addressable report card found on Home');
  if ((await firstCard.getAttribute('tabindex')) !== '0') {
    throw new Error('Report card is not in the keyboard tab order');
  }

  const cardId = await firstCard.getAttribute('id');
  await firstCard.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(350);
  if (!new URL(page.url()).pathname.startsWith('/report-detail/')) {
    throw new Error(`Enter did not open report detail from ${cardId}; got ${page.url()}`);
  }

  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  const childClickCard = page.locator('[id^="report-card-"][role="link"]').first();
  await expectVisible(childClickCard, 'No report card found for child-click navigation check');
  await childClickCard.locator('h3').click();
  await page.waitForTimeout(350);
  if (!new URL(page.url()).pathname.startsWith('/report-detail/')) {
    throw new Error(`Clicking report-card title did not open detail; got ${page.url()}`);
  }

  await context.close();
});

await check('All seven category pages preserve the shared mobile navigation contract', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();

  for (const route of CATEGORY_ROUTES) {
    await page.goto(routeUrl(route), { waitUntil: 'domcontentloaded', timeout: 30000 });
    try {
      await expectVisible(page.locator('#mobile-category-header'), `${route} category header missing`);
    } catch (error) {
      const currentUrl = page.url();
      const fallbackHeaderVisible = await page.locator('#mobile-header').isVisible().catch(() => false);
      throw new Error(
        `${route} category header missing; url=${currentUrl}; genericHeaderVisible=${fallbackHeaderVisible}; ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
    if ((await page.locator('#bottom-nav').count()) !== 0) {
      throw new Error(`${route} incorrectly shows the global bottom navigation`);
    }
    if ((await page.locator('#desktop-category-filter-slot').count()) !== 1) {
      throw new Error(`${route} does not resolve through the shared CategoryFeedView`);
    }
  }

  await context.close();
});

await check('Key mobile controls preserve the 44px minimum interaction target', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expectVisible(page.locator('#bottom-nav'), 'bottom navigation missing');

  const selectors = ['#bottom-nav-home', '#bottom-nav-issues', '#mobile-nav-report', '#bottom-nav-explore'];
  for (const selector of selectors) {
    const box = await page.locator(selector).boundingBox();
    if (!box) throw new Error(`${selector} is not measurable`);
    if (box.width < 44 || box.height < 44) {
      throw new Error(`${selector} is ${Math.round(box.width)}x${Math.round(box.height)}, below 44px minimum`);
    }
  }

  await context.close();
});

await check('Dark semantic surfaces retain distinct visual hierarchy', async () => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#tablet-menu-button').click();
  await expectVisible(page.locator('#tablet-drawer'), 'tablet drawer missing');

  const themeOptions = page.locator('#tablet-drawer [role="radiogroup"] [role="radio"]');
  const themeOptionCount = await themeOptions.count();
  if (themeOptionCount !== 3) {
    throw new Error(`expected 3 theme options, found ${themeOptionCount}`);
  }
  const darkOption = themeOptions.nth(1);
  await expectVisible(darkOption, 'dark theme control missing');
  await darkOption.click();
  await page.waitForTimeout(150);

  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      page: style.getPropertyValue('--ui-page').trim(),
      surface: style.getPropertyValue('--ui-surface').trim(),
      subtle: style.getPropertyValue('--ui-surface-subtle').trim(),
      elevated: style.getPropertyValue('--ui-surface-elevated').trim(),
      borderSubtle: style.getPropertyValue('--ui-border-subtle').trim(),
      border: style.getPropertyValue('--ui-border').trim(),
      borderStrong: style.getPropertyValue('--ui-border-strong').trim(),
    };
  });

  const surfaceValues = new Set([tokens.page, tokens.surface, tokens.subtle, tokens.elevated]);
  if (surfaceValues.size !== 4) throw new Error(`dark surface hierarchy collapsed: ${JSON.stringify(tokens)}`);
  const borderValues = new Set([tokens.borderSubtle, tokens.border, tokens.borderStrong]);
  if (borderValues.size !== 3) throw new Error(`dark border hierarchy collapsed: ${JSON.stringify(tokens)}`);

  await context.close();
});

await browser.close();

if (failures.length) {
  console.error(`\nPublic UI 100% regression smoke failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('\nPublic UI 100% regression smoke passed.');
