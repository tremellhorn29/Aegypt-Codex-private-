// Optional end-to-end checks: npm install --no-save playwright
// Start python -m http.server 8000 then run node tests/browser.cjs.
const assert = require("node:assert/strict");
const { chromium } = require(require.resolve("playwright", {
  paths: [process.cwd(), process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)
}));
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://127.0.0.1:8000");
  await page.locator("#fightBtn").waitFor();
  assert.equal(await page.locator(".rival-card").count(), 3);
  assert.equal(await page.locator(".rival-card:disabled").count(), 2);
  assert.equal(await page.locator("#menuWins").textContent(), "0");
  await page.locator("#fightBtn").tap();
  assert.equal(await page.locator("#menuOverlay").isVisible(), false);
  assert.equal(await page.locator("#roundLabel").textContent(), "ROUND 1");
  await page.waitForTimeout(1100);
  assert.ok(Number(await page.locator("#timer").textContent()) < 50);
  await page.locator("#pauseBtn").tap();
  assert.equal(await page.locator("#pauseOverlay").isVisible(), true);
  const frozen = await page.locator("#timer").textContent();
  await page.waitForTimeout(350);
  assert.equal(await page.locator("#timer").textContent(), frozen);
  await page.locator("#resumeBtn").tap();
  assert.equal(await page.locator("#pauseOverlay").isVisible(), false);
  await page.locator("[data-action='jab']").tap();
  await page.locator("[data-hold='right']").dispatchEvent("pointerdown", { pointerId: 1, pointerType: "touch" });
  await page.waitForTimeout(250);
  await page.locator("[data-hold='right']").dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch" });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: require("node:path").join(require("node:os").tmpdir(), "fastln-street-kings-mobile.png") });
  await page.locator("#pauseBtn").tap();
  await page.locator("#quitBtn").tap();
  assert.equal(await page.locator("#menuOverlay").isVisible(), true);
  await page.setViewportSize({width: 844, height: 390});
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.setViewportSize({width: 1280, height: 900});
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.deepEqual(errors, []);
  await browser.close();
  console.log("Street Kings browser checks passed: fight, timer, pause, touch, quit and responsive layout.");
})().catch(e => { console.error(e); process.exit(1); });