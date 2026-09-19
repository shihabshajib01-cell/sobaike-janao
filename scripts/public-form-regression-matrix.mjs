import { chromium } from 'playwright';

const SITE_URL = (process.env.SITE_URL || 'https://shobaikejanao.com/').replace(/\/?$/, '/');

const routeUrl = (path) => new URL(path.replace(/^\//, ''), SITE_URL).toString();

async function seedReturningVisitor(context) {
  await context.addInitScript(() => {
    localStorage.setItem('sobaike_responsibility_notice_v1', 'accepted');
    localStorage.setItem('sobaike_location_choice_v1', 'granted');
    localStorage.removeItem('sobaike_report_draft_v1');
    localStorage.removeItem('sobaike_janao_draft_report');
  });
}

async function makeContext(browser, viewport) {
  const context = await browser.newContext({
    viewport,
    geolocation: { latitude: 23.7806, longitude: 90.4070, accuracy: 20 },
  });
  await context.grantPermissions(['geolocation'], { origin: new URL(SITE_URL).origin });
  await seedReturningVisitor(context);
  return context;
}

async function expectVisible(locator, message) {
  await locator.waitFor({ state: 'visible', timeout: 15000 });
  if (!(await locator.isVisible())) throw new Error(message);
}

async function openStep3(page, { segment, subcategory, language = 'bn' }) {
  await page.goto(routeUrl(language === 'en' ? '/en/report' : '/report'), {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await expectVisible(page.locator('#report-composer-modal'), 'report composer did not open');
  await page.locator(`#service-select-card-${segment}`).click();
  await page.locator('#composer-footer-step1-next-btn').click();
  await expectVisible(
    page.locator(`#subcategory-option-${subcategory}`),
    `${segment}/${subcategory}: complaint type missing`
  );
  await page.locator(`#subcategory-option-${subcategory}`).click();
  await page.waitForTimeout(250);
  await page.locator('#composer-footer-step2-next-btn').click();

  const rapeConsent = page.locator('#rape-pre-report-consent-modal');
  if (await rapeConsent.isVisible().catch(() => false)) {
    const agree = page.locator('#rape-consent-agree-btn');
    if (!(await agree.isDisabled())) {
      throw new Error('rape consent continue action must stay disabled before acknowledgement');
    }
    const consentCheckbox = page.locator('#rape-consent-checkbox');
    await page.locator('label[for="rape-consent-checkbox"]').click();
    if (!(await consentCheckbox.isChecked())) {
      throw new Error('rape consent checkbox did not become checked after label activation');
    }
    if (await agree.isDisabled()) {
      throw new Error('rape consent continue action did not unlock after acknowledgement');
    }
    await agree.click();
  }

  await expectVisible(
    page.locator('#composer-footer-step3-review-btn'),
    `${segment}/${subcategory}: Step 3 did not render`
  );
  await page.waitForTimeout(700);
}

async function assertComposerGeometry(page, label) {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error(`${label}: viewport missing`);
  const geometry = await page.evaluate(() => {
    const root = document.querySelector('#report-composer-modal');
    const dialog = document.querySelector('#report-composer-modal > [data-modal-dialog="true"]');
    const body = document.querySelector('.report-composer-body');
    if (!(root instanceof HTMLElement) || !(dialog instanceof HTMLElement) || !(body instanceof HTMLElement)) {
      return null;
    }
    const rootBox = root.getBoundingClientRect();
    const dialogBox = dialog.getBoundingClientRect();
    return {
      rootLeft: rootBox.left,
      rootRight: rootBox.right,
      dialogLeft: dialogBox.left,
      dialogRight: dialogBox.right,
      bodyClientWidth: body.clientWidth,
      bodyScrollWidth: body.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
    };
  });
  if (!geometry) throw new Error(`${label}: composer geometry unavailable`);
  if (
    geometry.rootLeft < -2 ||
    geometry.rootRight > viewport.width + 2 ||
    geometry.dialogLeft < -2 ||
    geometry.dialogRight > viewport.width + 2 ||
    geometry.bodyScrollWidth > geometry.bodyClientWidth + 2 ||
    geometry.documentScrollWidth > geometry.documentClientWidth + 2
  ) {
    throw new Error(`${label}: horizontal overflow detected: ${JSON.stringify(geometry)}`);
  }
}

const browser = await chromium.launch({ headless: true });
const failures = [];
const check = async (name, fn) => {
  try {
    await fn();
    console.log(`PASS: ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${name}: ${message}`);
    console.error(`FAIL: ${name}: ${message}`);
  }
};

const representativePaths = [
  {
    segment: 'harassment',
    subcategory: 'rape-sexual-violence',
    expectedAny: ['#harassment-age-group-select', '#composer-section-configured-fields'],
  },
  {
    segment: 'harassment',
    subcategory: 'sexual-harassment',
    expectedAny: ['#sexual-harassment-type-select', '#composer-section-configured-fields'],
  },
  {
    segment: 'harassment',
    subcategory: 'blackmail-coercion',
    expectedAny: ['#intimate-action-select', '#composer-section-configured-fields'],
  },
  {
    segment: 'extortion',
    subcategory: 'bribe-demanded-service',
    expectedAny: ['#bribery-department-select', '#composer-section-configured-fields'],
  },
  {
    segment: 'public_safety',
    subcategory: 'mob-justice',
    expectedAny: ['#composer-section-mob-justice'],
  },
  {
    segment: 'road_transport',
    subcategory: 'road-accident',
    expectedAny: ['#complaint-date-input', '#composer-section-configured-fields'],
  },
  {
    segment: 'load_shedding',
    subcategory: 'excess-electricity-bill',
    expectedAny: ['#recent-bill-month-input', '#composer-section-configured-fields'],
  },
  {
    segment: 'illegal_occupation',
    subcategory: 'private-property-occupation',
    expectedAny: ['#complaint-date-input', '#composer-section-configured-fields'],
  },
  {
    segment: 'rickshaw',
    subcategory: 'charging-station-location',
    expectedAny: ['#composer-section-parties'],
  },
];

await check('Representative category-specific form paths render without runtime regressions', async () => {
  const context = await makeContext(browser, { width: 390, height: 844 });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  for (const testCase of representativePaths) {
    await openStep3(page, testCase);
    const matches = await Promise.all(
      testCase.expectedAny.map(async (selector) => (await page.locator(selector).count()) > 0)
    );
    if (!matches.some(Boolean)) {
      throw new Error(
        `${testCase.segment}/${testCase.subcategory}: expected active form surface missing (${testCase.expectedAny.join(', ')})`
      );
    }

    if (
      testCase.segment === 'rickshaw' &&
      testCase.subcategory === 'charging-station-location'
    ) {
      const operatorSectionHeader = page.locator('#composer-section-parties-header');
      await expectVisible(
        operatorSectionHeader,
        'rickshaw/charging-station-location: operator section header missing'
      );
      await operatorSectionHeader.click();
      await expectVisible(
        page.locator('#operator-subject-name'),
        'rickshaw/charging-station-location: operator fields did not render after expansion'
      );
    }

    await assertComposerGeometry(page, `${testCase.segment}/${testCase.subcategory}`);
  }

  if (runtimeErrors.length) {
    throw new Error(`runtime errors: ${runtimeErrors.join(' | ')}`);
  }
  await context.close();
});

await check('Validation keeps invalid reports on Step 3 and exposes actionable errors', async () => {
  const context = await makeContext(browser, { width: 390, height: 844 });
  const page = await context.newPage();
  await openStep3(page, {
    segment: 'extortion',
    subcategory: 'shop-business',
  });
  await page.locator('#composer-footer-step3-review-btn').click();
  await page.waitForTimeout(350);

  if (!(await page.locator('#composer-footer-step3-review-btn').isVisible())) {
    throw new Error('invalid form escaped Step 3');
  }

  const state = await page.evaluate(() => ({
    invalidCount: document.querySelectorAll('[aria-invalid="true"]').length,
    alertCount: document.querySelectorAll('[role="alert"]').length,
    activeId: document.activeElement?.id || '',
  }));
  if (state.invalidCount === 0 && state.alertCount === 0) {
    throw new Error(`validation produced no accessible invalid/error state: ${JSON.stringify(state)}`);
  }
  if (!state.activeId) {
    throw new Error('validation did not move focus to an actionable field');
  }
  await context.close();
});

await check('Category/subcategory switching removes stale specialized controls', async () => {
  const context = await makeContext(browser, { width: 390, height: 844 });
  const page = await context.newPage();
  await openStep3(page, {
    segment: 'extortion',
    subcategory: 'bribe-demanded-service',
  });

  const briberyWasLegacy = (await page.locator('#bribery-service-input').count()) > 0;
  if (briberyWasLegacy) {
    await page.locator('#bribery-service-input').fill('Regression stale-state marker');
  }

  await page.locator('#composer-footer-back-btn').click();
  await expectVisible(page.locator('#subcategory-option-shop-business'), 'extortion subtype list did not restore');
  await page.locator('#subcategory-option-shop-business').click();
  await page.waitForTimeout(250);
  await page.locator('#composer-footer-step2-next-btn').click();
  await expectVisible(page.locator('#composer-footer-step3-review-btn'), 'switched subtype did not render Step 3');

  if ((await page.locator('#bribery-department-select').count()) !== 0) {
    throw new Error('bribery-only department control leaked into a non-bribery report');
  }
  if ((await page.locator('#bribery-service-input').count()) !== 0) {
    throw new Error('bribery-only service control leaked into a non-bribery report');
  }
  await context.close();
});

await check('Bangla and English form journeys preserve the same functional structure', async () => {
  for (const language of ['bn', 'en']) {
    const context = await makeContext(browser, { width: 390, height: 844 });
    const page = await context.newPage();
    await openStep3(page, {
      segment: 'harassment',
      subcategory: 'sexual-harassment',
      language,
    });
    const state = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      review: document.querySelector('#composer-footer-step3-review-btn')?.textContent?.trim() || '',
      stepStatus: document.querySelector('#report-composer-step-status')?.textContent?.trim() || '',
    }));
    if (state.lang !== language) {
      throw new Error(`${language}: document language mismatch: ${JSON.stringify(state)}`);
    }
    if (language === 'bn' && !state.review.includes('পর্যালোচনা')) {
      throw new Error(`Bangla review action is not localized: ${JSON.stringify(state)}`);
    }
    if (language === 'en' && !/Review/i.test(state.review)) {
      throw new Error(`English review action is not localized: ${JSON.stringify(state)}`);
    }
    await context.close();
  }
});

await check('Composer remains horizontally safe across the supported responsive matrix', async () => {
  const viewports = [
    { width: 320, height: 700 },
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 900 },
    { width: 1280, height: 900 },
  ];

  for (const viewport of viewports) {
    const context = await makeContext(browser, viewport);
    const page = await context.newPage();
    await openStep3(page, {
      segment: 'load_shedding',
      subcategory: 'excess-electricity-bill',
    });
    await assertComposerGeometry(page, `${viewport.width}x${viewport.height}`);

    for (const selector of [
      '#composer-footer-back-btn',
      '#composer-footer-step3-review-btn',
    ]) {
      const box = await page.locator(selector).boundingBox();
      if (!box || box.height < 44 || box.width < 44) {
        throw new Error(`${viewport.width}px: ${selector} is below the 44px interaction target`);
      }
    }
    await context.close();
  }
});

await browser.close();

if (failures.length) {
  console.error(`\nPublic form regression matrix failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log('\nPublic form regression matrix passed: category logic, validation, state reset, EN/BN parity and responsive containment are protected.');
