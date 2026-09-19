import { chromium } from 'playwright';

const SITE_URL = (process.env.SITE_URL || 'https://shobaikejanao.com/').replace(/\/?$/, '/');

function routeUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalized.replace(/^\//, ''), SITE_URL).toString();
}

async function seedReturningVisitor(context) {
  await context.addInitScript(() => {
    localStorage.setItem('sobaike_responsibility_notice_v1', 'accepted');
    localStorage.setItem('sobaike_location_choice_v1', 'granted');
    localStorage.removeItem('sobaike_report_draft_v1');
    localStorage.removeItem('sobaike_janao_draft_report');
  });
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
  const optionBox = await option.boundingBox();
  if (!optionBox || optionBox.height < 44) {
    throw new Error(`${triggerSelector} option is below 44px minimum target`);
  }
  await option.click();
}

const browser = await chromium.launch({ headless: true });
const origin = new URL(SITE_URL).origin;
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  geolocation: { latitude: 23.7806, longitude: 90.4070, accuracy: 20 },
});
await context.grantPermissions(['geolocation'], { origin });
await seedReturningVisitor(context);
const page = await context.newPage();

const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(error.message));

try {
  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expectVisible(page.locator('#mobile-nav-report'), 'mobile report action missing');
  await page.locator('#mobile-nav-report').click();
  await expectVisible(page.locator('#report-composer-modal'), 'report composer did not open');

  // Step 1: Public Safety.
  await page.locator('#service-select-card-public_safety').click();
  const step1Next = page.locator('#composer-footer-step1-next-btn');
  if (await step1Next.isDisabled()) throw new Error('Step 1 Continue stayed disabled after category selection');
  await step1Next.click();

  // Step 2: verify standards-compliant radio keyboard behavior before choosing Mob Justice.
  const group = page.locator('[role="radiogroup"]');
  await expectVisible(group, 'complaint type radio group missing');
  const firstRadio = group.locator('[role="radio"]').first();
  await firstRadio.focus();
  await page.keyboard.press('ArrowDown');
  const checkedAfterArrow = group.locator('[role="radio"][aria-checked="true"]');
  if ((await checkedAfterArrow.count()) !== 1) throw new Error('Arrow-key radio selection did not produce one checked option');

  const mobJustice = page.locator('#subcategory-option-mob-justice');
  await expectVisible(mobJustice, 'Mob Justice complaint type missing');
  await mobJustice.click();
  if ((await mobJustice.getAttribute('aria-checked')) !== 'true') throw new Error('Mob Justice did not become selected');
  await page.locator('#composer-footer-step2-next-btn').click();

  // Step 3: required Mob Justice classification fields.
  await expectVisible(page.locator('#composer-section-mob-justice'), 'Mob Justice details section missing');
  for (const selector of ['#mob-justice-trigger', '#mob-justice-outcome', '#mob-justice-ongoing-status']) {
    const control = page.locator(selector);
    await expectVisible(control, `${selector} missing`);
    await control.selectOption({ index: 1 });
    const box = await control.boundingBox();
    if (!box || box.height < 44) throw new Error(`${selector} is below 44px minimum target`);
  }
  await page.locator('#mob-justice-targeted-count').fill('2');

  await page.locator('#complaint-title-input').fill('Mob justice regression test');
  await page.locator('#complaint-desc-input').fill(
    'Non-destructive browser regression coverage for the public reporting journey and review step.'
  );
  const today = await page.evaluate(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const composerBody = page.locator('.report-composer-body');
  const composerBodyBox = await composerBody.boundingBox();
  if (!composerBodyBox) throw new Error('Report composer body is not measurable');
  for (const selector of ['#complaint-date-input', '#complaint-time-input']) {
    const control = page.locator(selector);
    await expectVisible(control, `${selector} missing in Step 3`);
    const box = await control.boundingBox();
    if (!box) throw new Error(`${selector} is not measurable`);
    const rightEdge = box.x + box.width;
    const bodyRightEdge = composerBodyBox.x + composerBodyBox.width;
    if (box.x < composerBodyBox.x - 1 || rightEdge > bodyRightEdge + 1) {
      throw new Error(
        `${selector} overflows the mobile composer: control ${Math.round(box.x)}..${Math.round(rightEdge)}, body ${Math.round(composerBodyBox.x)}..${Math.round(bodyRightEdge)}`
      );
    }
  }
  await page.locator('#complaint-date-input').fill(today);

  // The granted geolocation should unlock the dependent incident-location controls.
  await page.waitForFunction(() => {
    const el = document.querySelector('#complaint-division-select');
    return el instanceof HTMLButtonElement && !el.disabled;
  }, null, { timeout: 15000 });
  await chooseFirstSearchableOption(page, '#complaint-division-select');
  await chooseFirstSearchableOption(page, '#complaint-district-select');
  await chooseFirstSearchableOption(page, '#complaint-thana-select');

  // Validate and reach Step 4. Never submit: this smoke is intentionally non-destructive.
  await page.locator('#composer-footer-step3-review-btn').click();
  const submit = page.locator('#composer-footer-step4-submit-btn');
  await expectVisible(submit, 'Step 4 review did not render after valid Mob Justice details');
  const submitBox = await submit.boundingBox();
  if (!submitBox || submitBox.height < 44) throw new Error('Step 4 submit action is below 44px minimum target');

  // Close cleanly without submitting anything.
  await page.locator('#report-composer-close-btn').click();
  await expectVisible(page.locator('#report-cancel-confirm-modal'), 'cancel confirmation missing from review step');
  await page.locator('#report-cancel-btn').click();
  await page.locator('#report-composer-modal').waitFor({ state: 'hidden', timeout: 10000 });

  if (runtimeErrors.length) throw new Error(`runtime errors: ${runtimeErrors.join(' | ')}`);
  console.log('Public composer 100% regression smoke passed: Public Safety → Mob Justice → valid details → review.');
} finally {
  await context.close();
  await browser.close();
}
