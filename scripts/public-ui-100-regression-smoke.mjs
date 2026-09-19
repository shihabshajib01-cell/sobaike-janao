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

async function assertMatchingFloatingControls(page, selectors, label) {
  const metrics = await page.evaluate((targetSelectors) => {
    return targetSelectors.map((selector) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLElement)) return { selector, missing: true };
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        selector,
        missing: false,
        width: box.width,
        height: box.height,
        borderColor: style.borderColor,
        borderRadius: style.borderRadius,
        backgroundColor: style.backgroundColor,
      };
    });
  }, selectors);

  if (metrics.some((item) => item.missing)) {
    throw new Error(`${label}: missing floating control: ${JSON.stringify(metrics)}`);
  }

  for (const item of metrics) {
    if (Math.abs(item.width - 48) > 1 || Math.abs(item.height - 48) > 1) {
      throw new Error(
        `${label}: floating control is not 48x48: ${item.selector}=${Math.round(item.width)}x${Math.round(item.height)}`
      );
    }
  }

  const [reference, ...rest] = metrics;
  for (const item of rest) {
    if (
      item.borderColor !== reference.borderColor ||
      item.borderRadius !== reference.borderRadius ||
      item.backgroundColor !== reference.backgroundColor
    ) {
      throw new Error(
        `${label}: floating control styling diverged: ${JSON.stringify(metrics)}`
      );
    }
  }
}

async function assertControlAndIconSize(page, selector, label) {
  const control = page.locator(selector);
  const icon = control.locator('svg').first();
  const controlBox = await control.boundingBox();
  const iconBox = await icon.boundingBox();

  if (
    !controlBox ||
    Math.abs(controlBox.width - 48) > 1 ||
    Math.abs(controlBox.height - 48) > 1
  ) {
    throw new Error(
      `${label}: control must be 48x48; got ${controlBox ? `${Math.round(controlBox.width)}x${Math.round(controlBox.height)}` : 'not measurable'}`
    );
  }

  if (
    !iconBox ||
    Math.abs(iconBox.width - 24) > 1 ||
    Math.abs(iconBox.height - 24) > 1
  ) {
    throw new Error(
      `${label}: icon must be 24x24; got ${iconBox ? `${Math.round(iconBox.width)}x${Math.round(iconBox.height)}` : 'not measurable'}`
    );
  }
}

async function scrollDownInSteps(page, target) {
  const points = [0.34, 0.68, 1]
    .map((ratio) => Math.round(target * ratio))
    .filter((value, index, values) => value > 0 && values.indexOf(value) === index);

  for (const top of points) {
    await page.evaluate((nextTop) => {
      window.scrollTo({ top: nextTop, behavior: 'instant' });
    }, top);
    await page.waitForTimeout(120);
  }
}

async function waitForCompactState(page, selector, compact, label) {
  try {
    await page.waitForFunction(
      ({ targetSelector, expected }) =>
        document.querySelector(targetSelector)?.getAttribute('data-compact') === expected,
      { targetSelector: selector, expected: compact ? 'true' : 'false' },
      { timeout: 5000 }
    );
  } catch {
    const state = await page.evaluate((targetSelector) => {
      const element = document.querySelector(targetSelector);
      return {
        compact: element?.getAttribute('data-compact') ?? null,
        scrollY: window.scrollY,
        maxScroll: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
      };
    }, selector);
    throw new Error(
      label + '; compact=' + state.compact + ', scrollY=' + Math.round(state.scrollY) + ', maxScroll=' + Math.round(state.maxScroll)
    );
  }
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

  const firstCard = page.locator('[id^="report-card-"]').first();
  await expectVisible(firstCard, 'No report card found on Home');
  const firstCardLink = firstCard.locator('a[href*="/report-detail/"]').first();
  await expectVisible(firstCardLink, 'Report card does not expose a native keyboard-addressable detail link');

  // Wait for semantic theme variables and the generated border utilities to settle.
  // This keeps the check strict while avoiding a false negative during stylesheet hydration.
  await page.waitForFunction(() => {
    const card = document.querySelector('[id^="report-card-"]');
    const horizontal = card?.querySelector('[data-report-divider-horizontal]');
    const verticals = card ? [...card.querySelectorAll('[data-report-divider-vertical]')] : [];
    if (!(horizontal instanceof HTMLElement) || verticals.length !== 2) return false;
    const horizontalColor = getComputedStyle(horizontal).borderTopColor;
    const verticalColors = verticals.map((element) => getComputedStyle(element).borderLeftColor);
    return Boolean(horizontalColor) && verticalColors.every((color) => Boolean(color));
  }, null, { timeout: 5000 });

  const lightDividerColors = await firstCard.evaluate((card) => {
    const horizontal = card.querySelector('[data-report-divider-horizontal]');
    const verticals = [...card.querySelectorAll('[data-report-divider-vertical]')];
    return {
      horizontal: horizontal ? getComputedStyle(horizontal).borderTopColor : '',
      verticals: verticals.map((element) => getComputedStyle(element).borderLeftColor),
    };
  });
  if (
    !lightDividerColors.horizontal ||
    lightDividerColors.verticals.length !== 2 ||
    lightDividerColors.verticals.some((color) => color !== lightDividerColors.horizontal)
  ) {
    throw new Error(`report-card divider colors diverged in light mode: ${JSON.stringify(lightDividerColors)}`);
  }

  const cardId = await firstCard.getAttribute('id');
  await firstCardLink.focus();
  if (!(await firstCardLink.evaluate((element) => element === document.activeElement))) {
    throw new Error('Report detail link did not receive keyboard focus');
  }
  await page.keyboard.press('Enter');
  await page.waitForTimeout(350);
  if (!new URL(page.url()).pathname.startsWith('/report-detail/')) {
    throw new Error(`Enter did not open report detail from ${cardId}; got ${page.url()}`);
  }

  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  const reloadedHomeFeed = page.locator('#home-virtualized-feed');
  await reloadedHomeFeed.waitFor({ state: 'attached', timeout: 15000 });
  await page.waitForFunction(
    () =>
      Number(
        document.querySelector('#home-virtualized-feed')?.getAttribute('data-loaded-count') || 0
      ) > 0,
    null,
    { timeout: 30000 }
  );
  await reloadedHomeFeed.scrollIntoViewIfNeeded();

  const childClickCard = page.locator('[id^="report-card-"]').first();
  await expectVisible(childClickCard, 'No report card found for title-click navigation check');
  await childClickCard.locator('a[href*="/report-detail/"] h3').click();
  await page.waitForTimeout(350);
  if (!new URL(page.url()).pathname.startsWith('/report-detail/')) {
    throw new Error(`Clicking report-card title did not open detail; got ${page.url()}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  await expectVisible(
    page.locator('#mobile-report-detail-back-btn'),
    'Report detail mobile back button missing'
  );
  await expectVisible(
    page.locator('#mobile-report-detail-share-btn'),
    'Report detail mobile share button missing'
  );
  await assertControlAndIconSize(page, '#mobile-report-detail-back-btn', 'Report detail back');
  await assertControlAndIconSize(page, '#mobile-report-detail-share-btn', 'Report detail share');

  if ((await page.locator('#bottom-nav').count()) !== 0) {
    throw new Error('Report detail incorrectly shows the global bottom navigation');
  }
  if ((await page.locator('#mobile-category-report').count()) !== 0) {
    throw new Error('Report detail incorrectly shows the category report action');
  }

  const detailScrollTarget = await page.evaluate(() => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(700, maxScroll);
  });
  // Compact mode starts after 96px. Short content that cannot physically cross
  // that threshold should remain expanded instead of failing an unrelated route check.
  if (detailScrollTarget > 96) {
    await scrollDownInSteps(page, detailScrollTarget);
    await waitForCompactState(
      page,
      '#mobile-report-detail-header',
      true,
      'Report detail header did not enter compact mode'
    );
    await page.waitForTimeout(650);
    await expectVisible(page.locator('#mobile-report-detail-back-btn'), 'Report detail compact back button missing');
    await expectVisible(page.locator('#mobile-report-detail-share-btn'), 'Report detail compact share button missing');
    await assertMatchingFloatingControls(
      page,
      ['#mobile-report-detail-back-btn', '#mobile-report-detail-share-btn'],
      'Report detail compact controls'
    );

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await waitForCompactState(
      page,
      '#mobile-report-detail-header',
      false,
      'Report detail header did not restore at the top'
    );
    await page.waitForTimeout(650);
  } else if ((await page.locator('#mobile-report-detail-header').getAttribute('data-compact')) !== 'false') {
    throw new Error('Short report detail should remain expanded; maxScroll=' + Math.round(detailScrollTarget) + 'px');
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
    await expectVisible(
      page.locator('#mobile-category-back-btn'),
      `${route} category back button missing`
    );
    await expectVisible(
      page.locator('#mobile-category-filter-btn'),
      `${route} category filter button missing`
    );
    await expectVisible(
      page.locator('#mobile-category-report'),
      `${route} category bottom-right report action missing`
    );

    await assertControlAndIconSize(page, '#mobile-category-back-btn', route + ' category back');
    await assertControlAndIconSize(page, '#mobile-category-filter-btn', route + ' category filter');
    await assertControlAndIconSize(page, '#mobile-category-report', route + ' category report action');

    const hero = page.locator('section[id$="-header-banner"]').first();
    const heroMedia = hero.locator('.hero-slider-media');
    await expectVisible(hero, `${route} category hero missing`);
    await expectVisible(heroMedia, `${route} category hero media missing`);
    const heroBox = await hero.boundingBox();
    const heroMediaBox = await heroMedia.boundingBox();
    if (
      !heroBox ||
      !heroMediaBox ||
      Math.abs(heroMediaBox.x - heroBox.x) > 1.5 ||
      Math.abs(heroMediaBox.width - heroBox.width) > 2
    ) {
      throw new Error(
        `${route} mobile hero media is not edge-to-edge inside the banner`
      );
    }

    if ((await page.locator('#bottom-nav').count()) !== 0) {
      throw new Error(`${route} incorrectly shows the global bottom navigation`);
    }

    if ((await page.locator('.hero-slider-mobile-cta').count()) !== 0) {
      throw new Error(`${route} still renders a report CTA inside the category hero`);
    }

    const categoryTitle = (await page.locator('#mobile-category-title').innerText()).trim();
    await page.locator('#mobile-category-report').click();
    await expectVisible(
      page.locator('#report-composer-modal'),
      `${route} category report action did not open the composer`
    );

    const stepStatus = (await page.locator('#report-composer-step-status').innerText()).trim();
    if (!/ধাপ\s*[২2]|Step\s*2/i.test(stepStatus)) {
      throw new Error(
        `${route} report composer did not start at category-selected step 2; got "${stepStatus}"`
      );
    }

    const composerCategoryTitle = (
      await page.locator('#report-composer-modal .report-composer-body h3').first().innerText()
    ).trim();
    if (composerCategoryTitle !== categoryTitle) {
      throw new Error(
        `${route} report composer category mismatch; header="${categoryTitle}", composer="${composerCategoryTitle}"`
      );
    }

    await page.locator('#report-composer-close-btn').click();
    const cancelConfirm = page.locator('#report-cancel-confirm-modal');
    if (await cancelConfirm.isVisible().catch(() => false)) {
      await page.locator('#report-cancel-btn').click();
    }
    await page.locator('#report-composer-modal').waitFor({ state: 'hidden', timeout: 10000 });
    await page.waitForTimeout(150);

    const categoryScrollTarget = await page.evaluate(() => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      return Math.min(700, maxScroll);
    });
    if (categoryScrollTarget > 96) {
      await scrollDownInSteps(page, categoryScrollTarget);
      await waitForCompactState(
        page,
        '#mobile-category-header',
        true,
        route + ' category header did not enter compact mode'
      );
      await page.waitForTimeout(650);
      await expectVisible(page.locator('#mobile-category-back-btn'), route + ' compact back button missing');
      await expectVisible(page.locator('#mobile-category-filter-btn'), route + ' compact filter button missing');
      await expectVisible(page.locator('#mobile-category-report'), route + ' compact category report action missing');
      await assertMatchingFloatingControls(
        page,
        ['#mobile-category-back-btn', '#mobile-category-filter-btn'],
        route + ' compact category controls'
      );
      const categoryReportBox = await page.locator('#mobile-category-report').boundingBox();
      if (
        !categoryReportBox ||
        Math.abs(categoryReportBox.width - 48) > 1 ||
        Math.abs(categoryReportBox.height - 48) > 1
      ) {
        throw new Error(route + ' compact category report action is not 48x48');
      }

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await waitForCompactState(
        page,
        '#mobile-category-header',
        false,
        route + ' category header did not restore at the top'
      );
      await page.waitForTimeout(650);
    } else if ((await page.locator('#mobile-category-header').getAttribute('data-compact')) !== 'false') {
      throw new Error(route + ' short category page should remain expanded; maxScroll=' + Math.round(categoryScrollTarget) + 'px');
    }

    const sectionId = route.replace(/^\//, '').replace(/-/g, '_');
    const sharedFeedSection = page.locator(
      sectionId === 'load_shedding'
        ? '#utility-filter-section'
        : `#${sectionId}-filter-section`
    );
    await expectVisible(
      sharedFeedSection,
      `${route} does not render the shared CategoryFeedView section`
    );
  }

  await context.close();
});

await check('Explore analytics provide accessible chart drilldowns', async () => {
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  await page.goto(routeUrl('/explore'), { waitUntil: 'domcontentloaded', timeout: 30000 });

  await expectVisible(page.locator('#explore-report-analytics'), 'Explore report summary did not load');
  await expectVisible(
    page.locator('#explore-category-share-donut'),
    'Category share chart did not render'
  );
  await expectVisible(
    page.locator('#explore-topic-division-matrix'),
    'Topic by division comparison did not render'
  );

  const firstMatrixCell = page.locator('#explore-topic-division-matrix td button:not([disabled])').first();
  await expectVisible(firstMatrixCell, 'No interactive topic/division matrix cell found');
  const matrixBox = await firstMatrixCell.boundingBox();
  if (!matrixBox || matrixBox.width < 44 || matrixBox.height < 44) {
    throw new Error(
      `Topic/division matrix cell is below 44px: ${matrixBox ? `${Math.round(matrixBox.width)}x${Math.round(matrixBox.height)}` : 'not measurable'}`
    );
  }

  const firstCategory = page.locator('#explore-category-distribution button[id^="distribution-row-"]').first();
  await expectVisible(firstCategory, 'No interactive category distribution row found');
  const categoryBox = await firstCategory.boundingBox();
  if (!categoryBox || categoryBox.height < 44) {
    throw new Error(
      `Category drilldown target is below 44px: ${categoryBox ? Math.round(categoryBox.height) : 'not measurable'}`
    );
  }
  await firstCategory.click();
  await page.waitForTimeout(300);
  if ((await firstCategory.getAttribute('aria-pressed')) !== 'true') {
    throw new Error('Category chart drilldown did not expose its selected state');
  }
  await expectVisible(
    page.locator('[aria-label="Active filters"], [aria-label="সক্রিয় ফিল্টার"]'),
    'Chart drilldown did not surface active-filter context'
  );

  const divisionButton = page.locator('#geographic-breakdown-divisions button').first();
  if (await divisionButton.count()) {
    const divisionBox = await divisionButton.boundingBox();
    if (!divisionBox || divisionBox.width < 44 || divisionBox.height < 44) {
      throw new Error('Division chart target is below the 44px interaction minimum');
    }
  }

  await context.close();
});

await check('Explore map provides layered geographic analysis', async () => {
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  await page.goto(routeUrl('/explore'), { waitUntil: 'domcontentloaded', timeout: 30000 });

  const mapModeButton = page.locator('#explore-mode-map');
  await expectVisible(mapModeButton, 'Explore map mode control did not render');
  await mapModeButton.click();

  await expectVisible(
    page.locator('#explore-map-insight-summary'),
    'Map insight summary did not render'
  );
  await expectVisible(page.locator('#map-layer-toolbar'), 'Map layer toolbar did not render');
  await expectVisible(page.locator('#public-heatmap-card'), 'Interactive map did not render');

  for (const selector of ['#map-layer-density', '#map-layer-districts', '#map-layer-points']) {
    const control = page.locator(selector);
    await expectVisible(control, `${selector} did not render`);
    const box = await control.boundingBox();
    if (!box || box.height < 44) {
      throw new Error(
        `${selector} is below 44px: ${box ? Math.round(box.height) : 'not measurable'}`
      );
    }
  }

  const districtMode = page.locator('#map-layer-districts');
  await districtMode.click();
  if ((await districtMode.getAttribute('aria-pressed')) !== 'true') {
    throw new Error('District map layer did not expose selected state');
  }

  const pointsMode = page.locator('#map-layer-points');
  await pointsMode.click();
  if ((await pointsMode.getAttribute('aria-pressed')) !== 'true') {
    throw new Error('Point map layer did not expose selected state');
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

await check('Adaptive mobile chrome preserves visual, navigation and accessibility state', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();

  const readStandardState = async () =>
    page.evaluate(() => {
      const read = (selector) => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) return null;
        const style = getComputedStyle(element);
        return {
          ariaHidden: element.getAttribute('aria-hidden'),
          inert: element.inert,
          visibility: style.visibility,
          opacity: Number(style.opacity),
        };
      };
      return {
        scrollY: window.scrollY,
        fullTop: read('#mobile-header'),
        compactTop: read('#mobile-compact-header'),
        fullBottom: read('#bottom-nav'),
        compactBottom: read('#bottom-nav-compact'),
      };
    });

  const assertStandardExpanded = (state, label) => {
    if (!state.fullTop || state.fullTop.ariaHidden === 'true' || state.fullTop.inert || state.fullTop.visibility !== 'visible') {
      throw new Error(`${label}: full mobile header is not interactive: ${JSON.stringify(state.fullTop)}`);
    }
    if (!state.compactTop || state.compactTop.ariaHidden !== 'true' || !state.compactTop.inert || state.compactTop.visibility !== 'hidden') {
      throw new Error(`${label}: compact top navigation was not removed from interaction: ${JSON.stringify(state.compactTop)}`);
    }
    if (!state.fullBottom || state.fullBottom.ariaHidden === 'true' || state.fullBottom.inert || state.fullBottom.visibility !== 'visible') {
      throw new Error(`${label}: full bottom navigation is not interactive: ${JSON.stringify(state.fullBottom)}`);
    }
    if (!state.compactBottom || state.compactBottom.ariaHidden !== 'true' || !state.compactBottom.inert || state.compactBottom.visibility !== 'hidden') {
      throw new Error(`${label}: compact bottom navigation was not removed from interaction: ${JSON.stringify(state.compactBottom)}`);
    }
  };

  const assertStandardCompact = (state, label) => {
    if (!state.fullTop || state.fullTop.ariaHidden !== 'true' || !state.fullTop.inert || state.fullTop.visibility !== 'hidden') {
      throw new Error(`${label}: hidden full header remained interactive: ${JSON.stringify(state.fullTop)}`);
    }
    if (!state.compactTop || state.compactTop.ariaHidden === 'true' || state.compactTop.inert || state.compactTop.visibility !== 'visible') {
      throw new Error(`${label}: compact top navigation is not interactive: ${JSON.stringify(state.compactTop)}`);
    }
    if (!state.fullBottom || state.fullBottom.ariaHidden !== 'true' || !state.fullBottom.inert || state.fullBottom.visibility !== 'hidden') {
      throw new Error(`${label}: hidden full bottom navigation remained interactive: ${JSON.stringify(state.fullBottom)}`);
    }
    if (!state.compactBottom || state.compactBottom.ariaHidden === 'true' || state.compactBottom.inert || state.compactBottom.visibility !== 'visible') {
      throw new Error(`${label}: compact bottom navigation is not interactive: ${JSON.stringify(state.compactBottom)}`);
    }
  };

  const scrollIntoCompactMode = async () => {
    const target = await page.evaluate(() => Math.min(700, Math.max(0, document.documentElement.scrollHeight - window.innerHeight)));
    if (target < 160) throw new Error(`Home is not tall enough to exercise adaptive chrome: ${target}px`);
    await scrollDownInSteps(page, target);
    await page.waitForFunction(() => document.querySelector('#mobile-header')?.getAttribute('aria-hidden') === 'true', null, { timeout: 5000 });
    await page.waitForTimeout(650);
  };

  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expectVisible(page.locator('#main-content'), 'Home did not render for adaptive chrome check');
  await page.waitForTimeout(650);
  assertStandardExpanded(await readStandardState(), 'initial load');

  await scrollIntoCompactMode();
  assertStandardCompact(await readStandardState(), 'scroll down');
  await assertMatchingFloatingControls(page, ['#mobile-compact-menu-btn', '#mobile-compact-search-btn'], 'Home compact top controls');

  const compactScrollY = await page.evaluate(() => window.scrollY);
  await page.evaluate((top) => window.scrollTo({ top: Math.max(32, top - 160), behavior: 'instant' }), compactScrollY);
  await page.waitForFunction(() => document.querySelector('#mobile-header')?.getAttribute('aria-hidden') !== 'true', null, { timeout: 5000 });
  await page.waitForTimeout(650);
  assertStandardExpanded(await readStandardState(), 'scroll up');

  await scrollIntoCompactMode();
  const hiddenChromeAcceptedFocus = await page.evaluate(() => {
    const controls = [document.querySelector('#mobile-header-menu-btn'), document.querySelector('#bottom-nav-home')];
    return controls.some((control) => {
      if (!(control instanceof HTMLElement)) return true;
      control.focus();
      return document.activeElement === control;
    });
  });
  if (hiddenChromeAcceptedFocus) throw new Error('hidden adaptive mobile chrome still accepted focus');

  await page.locator('#bottom-nav-compact-context').click();
  await page.waitForFunction(() => document.querySelector('#mobile-header')?.getAttribute('aria-hidden') !== 'true', null, { timeout: 5000 });
  await page.waitForTimeout(650);
  const resetState = await readStandardState();
  assertStandardExpanded(resetState, 'compact bottom navigation reset');
  if (resetState.scrollY > 4) throw new Error(`compact bottom navigation did not return the active page to the top: ${resetState.scrollY}px`);

  await scrollIntoCompactMode();
  await page.locator('#mobile-compact-search-btn').click();
  await page.waitForURL((url) => url.pathname.endsWith('/search'), { timeout: 10000 });
  await page.waitForTimeout(650);

  // Search is intentionally a contextual/category-style page: dedicated close/title
  // header and no bottom navigation. Do not force the generic chrome contract onto it.
  await expectVisible(page.locator('#mobile-search-header'), 'Search contextual header missing after adaptive navigation');
  if (await page.locator('#bottom-nav').count()) throw new Error('Search unexpectedly rendered the standard bottom navigation');
  if (await page.locator('#bottom-nav-compact').count()) throw new Error('Search unexpectedly rendered compact bottom navigation');
  const searchState = await page.evaluate(() => ({
    scrollY: window.scrollY,
    activeElementId: document.activeElement?.id || '',
    announcement: document.querySelector('#route-change-announcement')?.textContent?.trim() || '',
  }));
  if (searchState.scrollY > 4) throw new Error(`adaptive navigation preserved stale scroll position: ${searchState.scrollY}px`);
  if (searchState.activeElementId !== 'main-content') throw new Error(`route change did not focus main content: ${JSON.stringify(searchState)}`);
  if (!searchState.announcement) throw new Error('route change was not announced to assistive technology');

  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForURL((url) => url.pathname === '/' || url.pathname.endsWith('/en'), { timeout: 10000 });
  await page.waitForTimeout(650);
  assertStandardExpanded(await readStandardState(), 'browser back route change');

  await page.goForward({ waitUntil: 'domcontentloaded' });
  await page.waitForURL((url) => url.pathname.endsWith('/search'), { timeout: 10000 });
  await page.waitForTimeout(650);
  await expectVisible(page.locator('#mobile-search-header'), 'Search contextual header missing after browser Forward');
  if ((await page.evaluate(() => document.activeElement?.id || '')) !== 'main-content') {
    throw new Error('browser Forward did not preserve route focus contract');
  }

  await context.close();
});

await check('Contextual Search keeps category-style mobile chrome in Bangla and English', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();

  for (const testCase of [
    { path: '/search', title: 'অনুসন্ধান', lang: 'bn' },
    { path: '/en/search', title: 'Search', lang: 'en' },
  ]) {
    await page.goto(routeUrl(testCase.path), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expectVisible(page.locator('#mobile-search-header'), testCase.path + ' contextual header missing');
    const state = await page.evaluate(() => ({
      title: document.querySelector('#mobile-search-title')?.textContent?.trim() || '',
      close: Boolean(document.querySelector('#mobile-search-close-btn')),
      bottom: Boolean(document.querySelector('#bottom-nav')),
      compactBottom: Boolean(document.querySelector('#bottom-nav-compact')),
      language: document.documentElement.lang,
    }));
    if (state.title !== testCase.title || !state.close || state.bottom || state.compactBottom || state.language !== testCase.lang) {
      throw new Error(`${testCase.path} contextual chrome contract is wrong: ${JSON.stringify(state)}`);
    }
  }
  await context.close();
});

await check('Compact bottom context follows remaining non-primary routes in Bangla and English', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();

  for (const testCase of [
    { path: '/more', expectedPath: '/more', expectedLabel: 'আরও', lang: 'bn' },
    { path: '/en/more', expectedPath: '/en/more', expectedLabel: 'More', lang: 'en' },
  ]) {
    await page.goto(routeUrl(testCase.path), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expectVisible(page.locator('#main-content'), testCase.path + ' did not render');
    const state = await page.evaluate(() => {
      const link = document.querySelector('#bottom-nav-compact-context');
      return {
        href: link?.getAttribute('href') || '',
        label: link?.getAttribute('aria-label') || '',
        current: link?.getAttribute('aria-current') || '',
        language: document.documentElement.lang,
      };
    });
    if (!state.href.endsWith(testCase.expectedPath) || state.label !== testCase.expectedLabel || state.current !== 'page' || state.language !== testCase.lang) {
      throw new Error(`${testCase.path} compact context semantics are wrong: ${JSON.stringify(state)}`);
    }
  }
  await context.close();
});

await check('Reduced-motion adaptive chrome has no hidden interaction lock', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expectVisible(page.locator('#main-content'), 'Home did not render for reduced-motion check');

  const target = await page.evaluate(() => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(700, maxScroll);
  });
  if (target < 160) {
    throw new Error(`Home is not tall enough for reduced-motion adaptive chrome: ${target}px`);
  }

  await scrollDownInSteps(page, target);
  await page.waitForFunction(
    () => document.querySelector('#mobile-header')?.getAttribute('aria-hidden') === 'true',
    null,
    { timeout: 5000 }
  );

  const compactY = await page.evaluate(() => window.scrollY);
  await page.evaluate((top) => {
    window.scrollTo({ top: Math.max(32, top - 180), behavior: 'instant' });
  }, compactY);

  await page.waitForFunction(
    () => document.querySelector('#mobile-header')?.getAttribute('aria-hidden') !== 'true',
    null,
    { timeout: 450 }
  );

  await context.close();
});

await check('Dark semantic surfaces retain distinct visual hierarchy', async () => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  await seedReturningVisitor(context);
  const page = await context.newPage();
  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#tablet-menu-button').click();
  await expectVisible(page.locator('#tablet-drawer'), 'tablet drawer missing');

  const themeOptions = page.locator(
    '#tablet-drawer [role="group"][aria-label="থিম"] button[aria-pressed], #tablet-drawer [role="group"][aria-label="Theme"] button[aria-pressed]'
  );
  const themeOptionCount = await themeOptions.count();
  if (themeOptionCount !== 3) {
    throw new Error(`expected 3 theme options, found ${themeOptionCount}`);
  }
  const darkOption = themeOptions.nth(1);
  await expectVisible(darkOption, 'dark theme control missing');
  await darkOption.click();
  await page.waitForTimeout(150);
  if ((await darkOption.getAttribute('aria-pressed')) !== 'true') {
    throw new Error('dark theme control did not expose selected state');
  }

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

  const firstCard = page.locator('[id^="report-card-"]').first();
  await expectVisible(firstCard, 'No report card found for dark divider parity check');
  const darkDividerColors = await firstCard.evaluate((card) => {
    const horizontal = card.querySelector('[data-report-divider-horizontal]');
    const verticals = [...card.querySelectorAll('[data-report-divider-vertical]')];
    return {
      horizontal: horizontal ? getComputedStyle(horizontal).borderTopColor : '',
      verticals: verticals.map((element) => getComputedStyle(element).borderLeftColor),
    };
  });
  if (
    !darkDividerColors.horizontal ||
    darkDividerColors.verticals.length !== 2 ||
    darkDividerColors.verticals.some((color) => color !== darkDividerColors.horizontal)
  ) {
    throw new Error(`report-card divider colors diverged in dark mode: ${JSON.stringify(darkDividerColors)}`);
  }

  await context.close();
});

await browser.close();

if (failures.length) {
  console.error(`\nPublic UI 100% regression smoke failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('\nPublic UI 100% regression smoke passed.');
