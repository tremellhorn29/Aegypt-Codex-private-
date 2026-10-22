// npm install --no-save playwright && npx playwright install chromium
// Start a static server on port 8000, then: node tests/browser.cjs
const assert = require('node:assert/strict');
const { chromium } = require(require.resolve('playwright', { paths: [process.cwd(), process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean) }));
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const decisions = { nova: 'cleanRelease', rex: 'negotiator', mina: 'authenticCover', kai: 'industryDoor', jett: 'schoolHandled' };
  await page.goto('http://127.0.0.1:8000');
  assert.equal(await page.locator('#continueBtn').isDisabled(), true);
  await page.locator('#newGameBtn').tap(); await page.locator('#startRunBtn').tap();
  const before = await page.locator('.player').evaluate(n => parseFloat(n.style.left));
  await page.keyboard.down('d'); await page.waitForTimeout(150); await page.keyboard.up('d');
  assert.ok(await page.locator('.player').evaluate(n => parseFloat(n.style.left)) > before);
  await page.locator('#phoneBtn').tap(); await page.locator('[data-app="jobs"]').tap();
  assert.equal(await page.locator('[data-activity="shift"]').isDisabled(), true);
  await page.keyboard.press('Escape');
  // Reproduce a legacy save: crew met, finale pending, no stored mission stage.
  await page.evaluate(decisions => { localStorage.removeItem('fastln_save_v3'); localStorage.setItem('fastln_save_v2', JSON.stringify({ decisions, reputation: 40, stats: { money: 20, energy: 70, knowledge: 20, relationships: 20, legacy: 3 } })); }, decisions);
  await page.reload(); await page.locator('#continueBtn').tap();
  await page.locator('.choice-btn').first().waitFor();
  await page.locator('#touchBack').tap(); // Cancelling finale must not softlock it.
  await page.locator('#touchBack').tap();
  await page.locator('.choice-btn').nth(1).waitFor();
  await page.locator('.choice-btn').nth(1).tap();
  await page.waitForTimeout(80); await page.locator('#touchBack').tap();
  await page.locator('#phoneBtn').tap(); await page.locator('[data-app="calendar"]').tap();
  await page.locator('#sleepBtn').tap(); await page.locator('#confirmSleep').tap();
  assert.match(await page.locator('#dayStatus').textContent(), /DAY 2/);
  await page.locator('[data-app="jobs"]').tap(); await page.locator('[data-activity="shift"]').tap();
  assert.equal(await page.locator('#moneyValue').textContent(), '55');
  assert.equal(await page.locator('[data-activity="shift"]').isDisabled(), true);
  await page.locator('[data-app="school"]').tap(); await page.locator('[data-activity="study"]').tap();
  await page.locator('[data-app="calendar"]').tap(); await page.locator('[data-activity="family"]').tap();
  assert.match(await page.locator('#dayStatus').textContent(), /0\/3/);
  const legacy = Number(await page.locator('#legacyValue').textContent());
  await page.reload(); await page.locator('#continueBtn').tap();
  assert.match(await page.locator('#dayStatus').textContent(), /DAY 2.*0\/3/);
  assert.equal(await page.locator('#moneyValue').textContent(), '55');
  await page.locator('#phoneBtn').tap(); await page.locator('[data-app="calendar"]').tap();
  await page.locator('#sleepBtn').tap(); await page.locator('#cancelSleep').tap();
  assert.match(await page.locator('#dayStatus').textContent(), /DAY 2/);
  await page.locator('#sleepBtn').tap(); await page.locator('#confirmSleep').tap();
  assert.equal(Number(await page.locator('#legacyValue').textContent()), legacy + 1);
  await page.locator('[data-app="jobs"]').tap();
  assert.match(await page.locator('.activity-card').first().textContent(), /\+50 money/);
  await page.screenshot({ path: require('node:path').join(require('node:os').tmpdir(), 'fastln-daily-life-mobile.png') });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.setViewportSize({ width: 844, height: 390 });
  assert.ok(await page.locator('.phone-content').evaluate(n => n.clientHeight > 60));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  assert.equal(await page.locator('#pauseOverlay').isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#pauseOverlay').isVisible(), false);
  assert.deepEqual(errors, []);
  await browser.close(); console.log('Browser checks passed: mobile actions, finale cancel, save migration/reload, day loop, rewards, landscape, desktop pause.');
})().catch(e => { console.error(e); process.exit(1); });
