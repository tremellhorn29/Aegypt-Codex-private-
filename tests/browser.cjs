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
  // Simulate a standard-layout DualShock 4 exposed by Safari after its first button press.
  await page.evaluate(() => {
    const down = new Set();
    window.__testPadDown = down;
    window.__testPad = { index: 0, id: "DUALSHOCK 4 Wireless Controller",
      connected: true, mapping: "standard", axes: [0, 0],
      buttons: Array.from({ length: 17 }, (_, i) => ({ get pressed() { return down.has(i); }, get value() { return down.has(i) ? 1 : 0; } }))
    };
    Object.defineProperty(navigator, "getGamepads", { configurable: true, value: () => [window.__testPad] });
  });
  await page.waitForTimeout(100);
  assert.match(await page.locator("#controllerStatus").textContent(), /CONNECTED/);
  await page.evaluate(() => window.__testPadDown.add(9)); // OPTIONS pauses.
  await page.waitForTimeout(100);
  assert.equal(await page.locator("#pauseOverlay").isVisible(), true);
  await page.evaluate(() => { window.__testPadDown.delete(9); window.__testPadDown.add(0); }); // ✕ resumes.
  await page.waitForTimeout(100);
  assert.equal(await page.locator("#pauseOverlay").isVisible(), false);
  await page.evaluate(() => { window.__testPadDown.delete(0); window.__testPadDown.add(3); }); // △ kick.
  await page.waitForTimeout(100);
  assert.ok(Number(await page.locator("#playerStamina").evaluate(el => parseFloat(el.style.width))) < 100);
  await page.evaluate(() => window.__testPadDown.clear());
  await page.waitForTimeout(70);
  // Losing the controller must pause instead of advancing a running match.
  await page.evaluate(() => { Object.defineProperty(navigator, "getGamepads", { configurable: true, value: () => [] }); });
  await page.waitForTimeout(100);
  assert.equal(await page.locator("#pauseOverlay").isVisible(), true);
  await page.locator("#resumeBtn").tap();
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