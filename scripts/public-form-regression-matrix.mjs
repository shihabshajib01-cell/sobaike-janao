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

async function chooseFirstSearchableOption(page, triggerSelector) {
  const trigger = page.locator(triggerSelector);
  await expectVisible(trigger, `${triggerSelector} trigger missing`);
  if (await trigger.isDisabled()) throw new Error(`${triggerSelector} is unexpectedly disabled`);
  await trigger.click();
  const listboxId = await trigger.getAttribute('aria-controls');
  if (!listboxId) throw new Error(`${triggerSelector} has no listbox relationship`);
  const option = page.locator(`#${listboxId} [role="option"]:not([disabled])`).first();
  await expectVisible(option, `${triggerSelector} has no selectable option`);
  await option.click();
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
  const step2Next = page.locator('#composer-footer-step2-next-btn');
  await step2Next.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForFunction(
    () => {
      const button = document.querySelector('#composer-footer-step2-next-btn');
      return button instanceof HTMLButtonElement && !button.disabled;
    },
    null,
    { timeout: 15000 }
  );
  await step2Next.click();

  const rapeConsent = page.locator('#rape-pre-report-consent-modal');
  if (await rapeConsent.isVisible().catch(() => false)) {
    const agree = page.locator('#rape-consent-agree-btn');
    if (!(await agree.isDisabled())) {
      throw new Error('rape consent continue action must stay disabled before acknowledgement');
    }
    const consentCheckbox = page.locator('#rape-consent-checkbox');
    await rapeConsent.locator('label[for="rape-consent-checkbox"]').click();
    if (!(await consentCheckbox.isChecked())) {
      throw new Error('rape consent acknowledgement did not check the accessible checkbox');
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
    segment: 'public_safety',
    subcategory: 'child_abduction_murder',
    expectedAny: ['#composer-section-narrative', '#child-incident-type-select'],
  },
  {
    segment: 'public_safety',
    subcategory: 'ride_sharing_safety',
    expectedAny: ['#composer-section-narrative', '#ride-sharing-platform-select'],
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
    expandSelector: '#composer-section-parties-header',
    expectedAfterExpand: '#operator-subject-name',
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
    if (testCase.expandSelector && testCase.expectedAfterExpand) {
      const toggle = page.locator(testCase.expandSelector);
      await expectVisible(toggle, `${testCase.segment}/${testCase.subcategory}: optional section toggle missing`);
      if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
        await toggle.click();
      }
      await expectVisible(
        page.locator(testCase.expectedAfterExpand),
        `${testCase.segment}/${testCase.subcategory}: expanded optional form field missing`
      );
    }
    await assertComposerGeometry(page, `${testCase.segment}/${testCase.subcategory}`);
  }

  if (runtimeErrors.length) {
    throw new Error(`runtime errors: ${runtimeErrors.join(' | ')}`);
  }
  await context.close();
});

await check('Child safety keeps the established report format with only the approved minimum fields', async () => {
  const context = await makeContext(browser, { width: 390, height: 844 });
  const page = await context.newPage();
  await openStep3(page, {
    segment: 'public_safety',
    subcategory: 'child_abduction_murder',
  });

  for (const selector of [
    '#composer-section-narrative',
    '#complaint-title-input',
    '#complaint-desc-input',
    '#child-incident-type-select',
    '#complaint-date-input',
    '#complaint-time-input',
    '#composer-section-location',
    '#complaint-division-select',
    '#complaint-district-select',
    '#complaint-thana-select',
    '#complaint-address-input',
  ]) {
    await expectVisible(page.locator(selector), `child safety: expected standard control missing: ${selector}`);
  }

  for (const selector of [
    '#composer-section-configured-fields',
    '#complaint-frequency-select',
    '#composer-section-parties',
    '#composer-section-attachments',
    '#composer-section-identity',
    '#toggle-keep-identity-private',
    '#configured-input-police_report_filed',
    '#configured-input-police_case_reference',
  ]) {
    if ((await page.locator(selector).count()) > 0) {
      throw new Error(`child safety: unapproved control/parallel form surface is present: ${selector}`);
    }
  }

  await page.locator('#complaint-title-input').fill('শিশু অপহরণের অভিযোগ');
  await page.locator('#complaint-desc-input').fill('পরীক্ষামূলক রিপোর্ট: ঘটনার সংক্ষিপ্ত বিবরণ।');
  await page.locator('#child-incident-type-select').selectOption('abduction');
  await page.locator('#complaint-date-input').fill('2026-09-19');
  await page.waitForFunction(
    () => {
      const el = document.querySelector('#complaint-division-select');
      return el instanceof HTMLButtonElement && !el.disabled;
    },
    null,
    { timeout: 15000 }
  );
  await chooseFirstSearchableOption(page, '#complaint-division-select');
  await chooseFirstSearchableOption(page, '#complaint-district-select');
  await chooseFirstSearchableOption(page, '#complaint-thana-select');
  await page.locator('#complaint-address-input').fill('পরীক্ষামূলক বিস্তারিত ঠিকানা');

  await page.locator('#composer-footer-step3-review-btn').click();
  await expectVisible(page.locator('#review-section-incident'), 'child safety: review incident section missing');
  await expectVisible(page.locator('#review-child-incident-type'), 'child safety: incident type not integrated into standard review');
  await expectVisible(page.locator('#review-section-location'), 'child safety: standard review location section missing');
  await page.locator('#review-section-location-header').click();
  await expectVisible(
    page.locator('#review-section-location-panel'),
    'child safety: standard review location details did not expand'
  );
  const locationReviewText = await page.locator('#review-section-location').innerText();
  if (!locationReviewText.includes('পরীক্ষামূলক বিস্তারিত ঠিকানা')) {
    throw new Error('child safety: detailed address did not survive into standard review');
  }

  for (const selector of [
    '#review-section-attachments',
    '#review-section-parties',
    '#review-section-identity',
    '#composer-section-configured-fields-review',
  ]) {
    if ((await page.locator(selector).count()) > 0) {
      throw new Error(`child safety: unapproved review surface is present: ${selector}`);
    }
  }
  const reviewText = await page.locator('#review-section-incident').innerText();
  if (/পুনরাবৃত্তি|Frequency/i.test(reviewText)) {
    throw new Error('child safety: hidden frequency leaked into review');
  }

  await assertComposerGeometry(page, 'public_safety/child_abduction_murder standard format');
  await context.close();
});

await check('Ride-sharing Safety extends the established core intake without a parallel form', async () => {
  const context = await makeContext(browser, { width: 390, height: 844 });
  const page = await context.newPage();
  await openStep3(page, {
    segment: 'public_safety',
    subcategory: 'ride_sharing_safety',
  });

  for (const selector of [
    '#composer-section-narrative',
    '#complaint-title-input',
    '#complaint-desc-input',
    '#ride-sharing-platform-select',
    '#ride-sharing-incident-type-select',
    '#ride-sharing-role-select',
    '#ride-sharing-vehicle-type-select',
    '#complaint-date-input',
    '#complaint-time-input',
    '#complaint-frequency-select',
    '#composer-section-location',
    '#composer-section-parties',
    '#composer-section-attachments',
  ]) {
    await expectVisible(page.locator(selector), `ride-sharing safety: expected core-intake control missing: ${selector}`);
  }

  if ((await page.locator('#composer-section-configured-fields').count()) > 0) {
    throw new Error('ride-sharing safety: parallel schema form surface must not replace the core intake');
  }

  await page.locator('#complaint-title-input').fill('রাইড-শেয়ারিং নিরাপত্তা ঘটনা');
  await page.locator('#complaint-desc-input').fill('পরীক্ষামূলক রিপোর্ট: রাইড চলাকালে নিরাপত্তাজনিত ঘটনার সংক্ষিপ্ত বিবরণ।');
  await page.locator('#ride-sharing-platform-select').selectOption('pathao');
  await page.locator('#ride-sharing-incident-type-select').selectOption('route_deviation');
  await page.locator('#ride-sharing-role-select').selectOption('passenger');
  await page.locator('#ride-sharing-vehicle-type-select').selectOption('motorcycle');
  await page.locator('#complaint-date-input').fill('2026-09-19');

  const partyHeader = page.locator('#composer-section-parties-header');
  await expectVisible(partyHeader, 'ride-sharing safety: related-party section header missing');
  if ((await partyHeader.getAttribute('aria-expanded')) !== 'true') {
    await partyHeader.click();
  }

  for (const selector of [
    '#extortion-subject-name',
    '#extortion-role',
    '#ride-sharing-vehicle-registration-input',
    '#ride-sharing-trip-id-input',
    '#extortion-identifying-desc',
  ]) {
    await expectVisible(page.locator(selector), `ride-sharing safety: expected related-party field missing: ${selector}`);
  }
  for (const selector of ['#extortion-contact', '#extortion-org']) {
    if ((await page.locator(selector).count()) > 0) {
      throw new Error(`ride-sharing safety: unrelated/private field must not be shown: ${selector}`);
    }
  }
  const partyText = await page.locator('#composer-section-parties').innerText();
  for (const expected of [
    'চালক / যাত্রী / সংশ্লিষ্ট পক্ষের তথ্য',
    'নাম / অ্যাপে দেখানো পরিচিতি',
    'সংশ্লিষ্ট ব্যক্তির ভূমিকা',
    'যানবাহনের রেজিস্ট্রেশন নম্বর',
    'রাইড / ট্রিপ আইডি',
  ]) {
    if (!partyText.includes(expected)) {
      throw new Error(`ride-sharing safety: related-party copy is missing ${expected}`);
    }
  }

  await page.locator('#extortion-subject-name').fill('অ্যাপে দেখানো নাম');
  await page.locator('#extortion-role').fill('চালক');
  await page.locator('#ride-sharing-vehicle-registration-input').fill('ঢাকা মেট্রো-গ ১২-৩৪৫৬');
  await page.locator('#ride-sharing-trip-id-input').fill('PATHAO-TEST-123');

  await chooseFirstSearchableOption(page, '#complaint-division-select');
  await chooseFirstSearchableOption(page, '#complaint-district-select');
  await chooseFirstSearchableOption(page, '#complaint-thana-select');

  await page.locator('#composer-footer-step3-review-btn').click();
  await expectVisible(page.locator('#review-section-incident'), 'ride-sharing safety: standard review incident section missing');
  await expectVisible(page.locator('#review-section-location'), 'ride-sharing safety: standard review location section missing');
  await expectVisible(page.locator('#review-section-parties'), 'ride-sharing safety: standard review related-party section missing');
  await page.locator('#review-section-parties-header').click();
  const partyReviewText = await page.locator('#review-section-parties').innerText();
  for (const expected of ['অ্যাপে দেখানো নাম', 'চালক', 'ঢাকা মেট্রো-গ ১২-৩৪৫৬', 'PATHAO-TEST-123']) {
    if (!partyReviewText.includes(expected)) {
      throw new Error(`ride-sharing safety: related-party review is missing ${expected}`);
    }
  }
  if (/ফোন\s*\/\s*যোগাযোগ|দল\s*\/\s*প্রতিষ্ঠান\s*\/\s*সংগঠন/.test(partyReviewText)) {
    throw new Error('ride-sharing safety: hidden phone/organization fields leaked into review');
  }

  if ((await page.locator('#composer-section-configured-fields-review').count()) > 0) {
    throw new Error('ride-sharing safety: separate configured-fields review must not be present');
  }

  const reviewText = await page.locator('#review-section-incident').innerText();
  for (const expected of ['Pathao', 'ভুল পথে নেওয়া', 'যাত্রী', 'মোটরসাইকেল']) {
    if (!reviewText.includes(expected)) {
      throw new Error(`ride-sharing safety: standard review is missing ${expected}`);
    }
  }

  await assertComposerGeometry(page, 'public_safety/ride_sharing_safety core intake');
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
