// Read-only post-deployment verification of the real public Bangladesh-only map.
// Runs after Deploy succeeds so it cannot mistake a passing build for a live UI.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const origin = new URL(process.env.SITE_URL || 'https://shobaikejanao.com/').origin + '/';
mkdirSync('map-smoke-artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];

async function exercise({ label, route, viewport, theme, selectDistrict }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 600 });
  await context.addInitScript((chosenTheme) => {
    localStorage.setItem('sobaike_responsibility_notice_v1', 'accepted');
    localStorage.setItem('sobaike_location_choice_v1', 'not_now');
    localStorage.setItem('sobaike-janao-theme', chosenTheme);
  }, theme);
  const page = await context.newPage();
  const mapTileRequests = [];
  page.on('request', (request) => {
    if (/basemaps\.cartocdn\.com|tile\.openstreetmap\.org|maps\.googleapis\.com/.test(request.url())) {
      mapTileRequests.push(request.url());
    }
  });
  const screenshot = async (name) => {
    await page.screenshot({ path: 'map-smoke-artifacts/' + label + '-' + name + '.png', fullPage: true });
  };
  try {
    const target = new URL(route, origin).toString();
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const mapMode = page.locator('#explore-mode-map');
    await mapMode.waitFor({ state: 'visible', timeout: 45000 });
    await mapMode.click();
    const canvas = page.locator('#public-heatmap-card');
    await canvas.waitFor({ state: 'visible', timeout: 15000 });
    const districts = page.locator('#public-heatmap-card path[data-district-id]');
    await districts.first().waitFor({ state: 'attached', timeout: 25000 });
    const count = await districts.count();
    assert.equal(count, 64, label + ' must render all 64 polygon paths');
    assert.equal(await page.locator('#public-heatmap-card .leaflet-tile').count(), 0,
      label + ' must not render world map tiles');
    assert.equal(mapTileRequests.length, 0, label + ' made an out-of-scope map request');

    const legend = page.locator('#district-map-legend');
    await legend.waitFor({ state: 'visible' });
    await canvas.scrollIntoViewIfNeeded();
    const area = await canvas.boundingBox();
    const legendArea = await legend.boundingBox();
    assert(area && legendArea);
    assert(legendArea.y >= area.y + area.height - 2, label + ' legend covers the map canvas');
    assert(area.height >= (viewport.width < 600 ? 450 : 500), label + ' map height is unexpectedly short');

    const bounds = await districts.evaluateAll((nodes) => {
      const active = nodes.map((n) => n.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
      const minX = Math.min(...active.map((r) => r.x));
      const minY = Math.min(...active.map((r) => r.y));
      const maxX = Math.max(...active.map((r) => r.right));
      const maxY = Math.max(...active.map((r) => r.bottom));
      return { left: minX, top: minY, right: maxX, bottom: maxY };
    });
    assert(bounds.right - bounds.left > area.width * 0.35, label + ' Bangladesh is too small horizontally');
    assert(bounds.bottom - bounds.top > area.height * 0.50, label + ' Bangladesh is too small vertically');
    await screenshot('country');

    if (selectDistrict) {
      const gazipur = page.locator('[data-district-id="gazipur"]');
      await gazipur.click();
      const cardButton = page.locator('button[aria-controls="mobile-area-sheet"]');
      await cardButton.waitFor({ state: 'visible', timeout: 10000 });
      const card = cardButton.locator('xpath=ancestor::div[contains(@class,"ui-radius-card")]');
      await card.scrollIntoViewIfNeeded();
      const cardArea = await card.boundingBox();
      const footer = await page.locator('#main-content footer').boundingBox();
      const nav = await page.locator('#bottom-nav').boundingBox();
      assert(cardArea && footer && nav);
      assert(footer.y - (cardArea.y + cardArea.height) < 140,
        label + ' excessive vertical gap separates district card and footer');
      // Scroll the actionable card above the fixed mobile bar, not behind it.
      await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      const visibleButton = await cardButton.boundingBox();
      const visibleNav = await page.locator('#bottom-nav').boundingBox();
      assert(visibleButton && visibleNav && visibleButton.y + visibleButton.height < visibleNav.y - 4,
        label + ' district details action is covered by the mobile nav');
      await screenshot('selected');
      const reset = page.locator('#public-heatmap-card button[title="সারাদেশ ভিউ"]');
      await reset.click();
      await cardButton.waitFor({ state: 'detached', timeout: 10000 });
    }
    console.log('PASS ' + label + ': Bangladesh only, all 64 districts, clean legend, correct framing');
  } catch (err) {
    await screenshot('failure').catch(() => {});
    failures.push(label + ': ' + (err instanceof Error ? err.stack : String(err)));
  } finally {
    await context.close();
  }
}

await exercise({ label: 'bn-mobile', route: 'explore', viewport: { width: 390, height: 844 }, theme: 'light', selectDistrict: true });
await exercise({ label: 'bn-mobile-dark', route: 'explore', viewport: { width: 390, height: 844 }, theme: 'dark', selectDistrict: false });
await exercise({ label: 'en-desktop', route: 'en/explore', viewport: { width: 1440, height: 900 }, theme: 'light', selectDistrict: false });
await browser.close();
if (failures.length) {
  console.error(failures.join('\n\n'));
  process.exitCode = 1;
} else {
  console.log('PASS: live Bangladesh-only mobile/light/dark, selected district, English desktop');
}
