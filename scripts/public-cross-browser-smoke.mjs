import { firefox, webkit } from 'playwright';

const siteUrl = process.env.SITE_URL || 'http://127.0.0.1:4173/';

const engines = [
  ['firefox', firefox],
  ['webkit', webkit],
];

const viewports = [
  { label: 'mobile', width: 390, height: 844 },
  { label: 'desktop', width: 1536, height: 960 },
];

const failures = [];

const expectVisible = async (locator, label) => {
  try {
    await locator.waitFor({ state: 'visible', timeout: 15000 });
  } catch {
    throw new Error(label + ' is not visible');
  }
};

for (const [engineName, launcher] of engines) {
  const browser = await launcher.launch({ headless: true });
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const label = engineName + '/' + viewport.label;

      try {
        // Seed persisted preferences on the real site origin, then reload.
        // This avoids engine-specific localStorage behavior on the initial
        // about:blank document while still testing first-paint restoration.
        await page.goto(siteUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.evaluate(() => {
          localStorage.setItem('sobaike_responsibility_notice_v1', 'accepted');
          localStorage.setItem('sobaike-janao-theme', 'light');
        });
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
        await expectVisible(page.locator('#main-content'), label + ' main content');

        if ((await page.locator('html').getAttribute('lang')) !== 'bn') {
          throw new Error(label + ' Bangla route did not set html lang=bn');
        }

        const rootTheme = await page.locator('html').getAttribute('data-theme');
        if (rootTheme !== 'light') {
          throw new Error(label + ' stored light theme was not restored');
        }

        await page.evaluate(() => localStorage.setItem('sobaike-janao-theme', 'dark'));
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
        if ((await page.locator('html').getAttribute('data-theme')) !== 'dark') {
          throw new Error(label + ' stored dark theme was not restored');
        }
        if (!(await page.locator('html').evaluate((el) => el.classList.contains('dark')))) {
          throw new Error(label + ' dark class was not applied with stored dark theme');
        }

        await page.evaluate(() => localStorage.setItem('sobaike-janao-theme', 'system'));
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
        if ((await page.locator('html').getAttribute('data-theme')) !== 'dark') {
          throw new Error(label + ' system dark preference was not resolved');
        }

        await page.emulateMedia({ colorScheme: 'light' });
        await page.waitForFunction(
          () => document.documentElement.getAttribute('data-theme') === 'light',
          null,
          { timeout: 5000 }
        );

        await page.goto(new URL('/en', siteUrl).href, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await expectVisible(page.locator('#main-content'), label + ' English main content');

        if ((await page.locator('html').getAttribute('lang')) !== 'en') {
          throw new Error(label + ' English route did not set html lang=en');
        }

        if (viewport.label === 'mobile') {
          await expectVisible(page.locator('#mobile-header'), label + ' mobile header');
          await expectVisible(page.locator('#bottom-nav'), label + ' bottom navigation');
          const menuButton = page.locator('#mobile-header-menu-btn');
          await expectVisible(menuButton, label + ' mobile menu button');
          await menuButton.click();
          await expectVisible(page.locator('#mobile-menu-drawer'), label + ' mobile menu drawer');
        } else {
          await expectVisible(page.locator('#desktop-left-rail'), label + ' desktop navigation rail');
        }
      } catch (error) {
        failures.push(label + ': ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}

if (failures.length) {
  console.error('Cross-browser smoke failed:\n' + failures.join('\n'));
  process.exit(1);
}

console.log('Cross-browser smoke passed for Firefox and WebKit on mobile and desktop.');
