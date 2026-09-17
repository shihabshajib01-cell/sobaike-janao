import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const SITE_URL = (process.env.SITE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/');
const failures = [];

function routeUrl(path) {
  return `${SITE_URL}#${path.startsWith('/') ? path : `/${path}`}`;
}

async function seedStableVisitor(context, theme) {
  await context.addInitScript((resolvedTheme) => {
    localStorage.setItem('sobaike_responsibility_notice_v1', 'accepted');
    localStorage.setItem('sobaike_location_choice_v1', 'not_now');
    localStorage.setItem('sobaike-janao-theme', resolvedTheme);
    localStorage.setItem('theme', resolvedTheme);
    localStorage.removeItem('sobaike_report_draft_v1');
    localStorage.removeItem('sobaike_janao_draft_report');
  }, theme);
}

async function scan(page, label, options = {}) {
  const builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  for (const selector of options.exclude || []) builder.exclude(selector);
  const result = await builder.analyze();
  if (result.violations.length) {
    for (const violation of result.violations) {
      const nodes = violation.nodes
        .slice(0, 4)
        .map((node) => `${node.target.join(' ')} — ${node.failureSummary || violation.help}`)
        .join(' | ');
      failures.push(`${label}: [${violation.impact || 'unknown'}] ${violation.id} — ${violation.help}. ${nodes}`);
    }
    return;
  }
  console.log(`PASS: ${label}`);
}

const coreRoutes = [
  '/',
  '/issues',
  '/harassment',
  '/extortion',
  '/public-safety',
  '/road-transport',
  '/load-shedding',
  '/illegal-occupation',
  '/rickshaw',
  '/search',
  '/more',
];

const browser = await chromium.launch({ headless: true });
try {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
    await seedStableVisitor(context, theme);
    const page = await context.newPage();
    for (const route of coreRoutes) {
      await page.goto(routeUrl(route), { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('#main-content').waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(450);
      await scan(page, `${theme} ${route}`);
    }
    await context.close();
  }

  const exploreContext = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  await seedStableVisitor(exploreContext, 'light');
  const explorePage = await exploreContext.newPage();
  await explorePage.goto(routeUrl('/explore'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await explorePage.locator('#main-content').waitFor({ state: 'visible', timeout: 15000 });
  await explorePage.waitForTimeout(1600);
  await scan(explorePage, 'light /explore', { exclude: ['.leaflet-container'] });
  await exploreContext.close();

  const composerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedStableVisitor(composerContext, 'light');
  const composerPage = await composerContext.newPage();
  await composerPage.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await composerPage.locator('#mobile-nav-report').click();
  await composerPage.locator('#report-composer-modal').waitFor({ state: 'visible', timeout: 15000 });
  await scan(composerPage, 'report composer modal');
  await composerContext.close();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`\nAccessibility audit found ${failures.length} WCAG violation(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('\nPublic accessibility audit passed across core light/dark routes, Explore, and the report composer.');
