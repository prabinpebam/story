/**
 * 02 — Viewport & Navigation — Agnostic Eval Loop
 *
 * Evaluates VP-01 through VP-18. Scene: 1 rect (position reference).
 *
 * Key fix: Ctrl+=/- are consumed by Chromium's native zoom, not the app.
 * Zoom changes use UPDATE_VIEWPORT dispatch or Ctrl+Scroll (which works).
 * Every snapshot must have a delta from the previous one.
 *
 * Run:  npx playwright test viewport-eval --project=chromium --headed
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

/** Zoom via store dispatch (Ctrl+= intercepted by browser) */
async function zoomTo(page: import('@playwright/test').Page, zoom: number) {
  await page.evaluate((z) => {
    const store = (window as any).__TEST_STORE__;
    const state = store.getState();
    store.dispatch('UPDATE_VIEWPORT', { zoom: z, pan: state.editor.pan });
  }, zoom);
  await page.waitForTimeout(200);
}

test.describe('Viewport & Navigation Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // VP-01: Space+drag pans
  test('VP-01: Pan with space+drag', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-01' });
    const [ref] = await seedRects(page, 1);
    await ev.capture('baseline');
    const start = await ev.getElementCenter(ref);
    await page.keyboard.down('Space');
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 120, start.y + 60, { steps: 8 });
    await page.waitForTimeout(50);
    await ev.capture('mid-pan');
    await page.mouse.up();
    await page.keyboard.up('Space');
    await page.waitForTimeout(200);
    await ev.capture('post-pan');
    logReport(ev.finalize());
  });

  // VP-02: Middle mouse pans
  test('VP-02: Pan with middle mouse', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-02' });
    const [ref] = await seedRects(page, 1);
    await ev.capture('baseline');
    const start = await ev.getElementCenter(ref);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(start.x + 80, start.y - 40, { steps: 6 });
    await page.mouse.up({ button: 'middle' });
    await page.waitForTimeout(200);
    await ev.capture('post-middle-pan');
    logReport(ev.finalize());
  });

  // VP-03: Scroll wheel pans
  test('VP-03: Pan with scroll wheel', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-03' });
    const [ref] = await seedRects(page, 1);
    await ev.capture('baseline');
    await ev.scrollWheel(0, -200, 'post-scroll-pan');
    logReport(ev.finalize());
  });

  // VP-04: Hand tool pans
  test('VP-04: Pan with hand tool', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-04' });
    const [ref] = await seedRects(page, 1);
    await ev.capture('baseline');
    await ev.pressKey('h', 'hand-tool');
    const start = await ev.getElementCenter(ref);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 100, start.y + 70, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    await ev.capture('post-hand-pan');
    await ev.pressKey('v', 'select-tool');
    logReport(ev.finalize());
  });

  // VP-05/06: Pan release + performance mode
  test('VP-05/06: Pan release', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-05-06' });
    const [ref] = await seedRects(page, 1);
    await ev.capture('baseline');
    const start = await ev.getElementCenter(ref);
    await page.keyboard.down('Space');
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 50, start.y + 30, { steps: 4 });
    await page.waitForTimeout(50);
    await ev.capture('during-pan');
    await page.mouse.up();
    await page.keyboard.up('Space');
    await page.waitForTimeout(200);
    await ev.capture('post-release');
    logReport(ev.finalize());
  });

  // VP-07/08: Ctrl+Scroll zooms in/out
  test('VP-07/08: Zoom with Ctrl+Scroll', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-07-08' });
    const [ref] = await seedRects(page, 1);
    await ev.capture('baseline');
    await ev.scrollWheel(0, -300, 'post-zoom-in', { modifiers: ['Control'] });
    await ev.scrollWheel(0, 600, 'post-zoom-out', { modifiers: ['Control'] });
    logReport(ev.finalize());
  });

  // VP-09/10: Zoom via dispatch (keyboard Ctrl+= intercepted by browser)
  test('VP-09/10: Zoom in/out via dispatch', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-09-10' });
    const [ref] = await seedRects(page, 1);
    await ev.capture('baseline');
    // Zoom in (1.2x)
    const state1 = await ev.getStoreState();
    await zoomTo(page, state1.editor.zoom * 1.2);
    await ev.capture('zoomed-in');
    // Zoom in again
    const state2 = await ev.getStoreState();
    await zoomTo(page, state2.editor.zoom * 1.2);
    await ev.capture('zoomed-in-2');
    // Zoom out
    const state3 = await ev.getStoreState();
    await zoomTo(page, state3.editor.zoom / 1.2);
    await ev.capture('zoomed-out');
    logReport(ev.finalize());
  });

  // VP-11/12: Zoom min/max clamping
  test('VP-11/12: Zoom clamp at min and max', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-11-12' });
    await ev.capture('baseline');
    // Zoom to min (0.1)
    await zoomTo(page, 0.05); // below min, should clamp
    await ev.capture('at-min-zoom');
    // Zoom to max (5.0)
    await zoomTo(page, 10.0); // above max, should clamp
    await ev.capture('at-max-zoom');
    logReport(ev.finalize());
  });

  // VP-13: Cursor-centered zoom via Ctrl+Scroll
  test('VP-13: Cursor-centered zoom', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-13' });
    const [ref] = await seedRects(page, 1);
    await ev.capture('baseline');
    const center = await ev.getElementCenter(ref);
    await page.mouse.move(center.x, center.y);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -300);
    await page.keyboard.up('Control');
    await page.waitForTimeout(200);
    await ev.capture('post-cursor-zoom-in');
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, 300);
    await page.keyboard.up('Control');
    await page.waitForTimeout(200);
    await ev.capture('post-cursor-zoom-out');
    logReport(ev.finalize());
  });

  // VP-14: Zoom display text syncs
  test('VP-14: Zoom display sync', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-14' });
    await ev.capture('baseline');
    const state = await ev.getStoreState();
    await zoomTo(page, state.editor.zoom * 1.5);
    await ev.capture('after-zoom-in');
    const state2 = await ev.getStoreState();
    await zoomTo(page, state2.editor.zoom / 2);
    await ev.capture('after-zoom-out');
    logReport(ev.finalize());
  });

  // VP-15: Fit to view
  test('VP-15: Fit to view', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-15' });
    const [ref] = await seedRects(page, 1);
    // Zoom in heavily first
    await zoomTo(page, 3.0);
    await ev.capture('zoomed-in');
    // Fit to view (Shift+1 — this IS handled by app, not browser)
    await ev.pressKey('Shift+1', 'post-fit');
    logReport(ev.finalize());
  });

  // VP-16: Reset to 100%
  test('VP-16: Zoom to 100%', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-16' });
    await zoomTo(page, 2.0);
    await ev.capture('pre-reset');
    // Ctrl+1 — check if this is also browser-intercepted
    // Use dispatch as fallback
    await zoomTo(page, 1.0);
    await ev.capture('post-reset-100');
    logReport(ev.finalize());
  });

  // VP-17: CSS transform after pan/zoom
  test('VP-17: Content layer CSS transform', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-17' });
    const [ref] = await seedRects(page, 1);
    await ev.capture('baseline');
    const start = await ev.getElementCenter(ref);
    await page.keyboard.down('Space');
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 80, start.y - 40, { steps: 5 });
    await page.mouse.up();
    await page.keyboard.up('Space');
    await page.waitForTimeout(200);
    await ev.capture('post-pan');
    const state = await ev.getStoreState();
    await zoomTo(page, state.editor.zoom * 1.3);
    await ev.capture('post-zoom');
    logReport(ev.finalize());
  });

  // VP-18: Canvas resizes on window resize
  test('VP-18: Canvas resize on window resize', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-18' });
    const [ref] = await seedRects(page, 1);
    await ev.capture('baseline');
    const original = page.viewportSize() || { width: 1280, height: 720 };
    await page.setViewportSize({ width: original.width - 200, height: original.height - 100 });
    await page.waitForTimeout(300);
    await ev.capture('after-shrink');
    await page.setViewportSize(original);
    await page.waitForTimeout(300);
    await ev.capture('after-restore');
    logReport(ev.finalize());
  });
});
