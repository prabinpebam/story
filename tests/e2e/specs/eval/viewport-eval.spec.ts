/**
 * 02 — Viewport & Navigation — Agnostic Eval Loop
 *
 * Evaluates VP-01 through VP-18: panning, zooming, fit-to-view, and viewport transform.
 *
 * Run:  npx playwright test viewport-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage, CanvasHelper } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Viewport & Navigation Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // VP-01/02: Pan with Space+Drag & Middle Mouse
  test('VP-01: Pan with space+drag', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-01' });
    await seedRects(page, 2);
    await ev.capture('baseline');

    // Hold Space and drag to pan
    await page.keyboard.down('Space');
    const canvas = page.locator('#canvas-container');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 100, cy + 50, { steps: 8 });
    await page.mouse.up();
    await page.keyboard.up('Space');
    await page.waitForTimeout(200);
    await ev.capture('post-pan');

    const report = ev.finalize();
    logReport(report);
  });

  // VP-03: Pan with scroll wheel
  test('VP-03: Pan with scroll wheel', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-03' });
    await seedRects(page, 2);
    await ev.capture('baseline');

    await ev.scrollWheel(0, -200, 'post-scroll-pan');

    const report = ev.finalize();
    logReport(report);
  });

  // VP-07/08: Zoom in/out with Ctrl+Scroll
  test('VP-07/08: Zoom with Ctrl+Scroll', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-07-08' });
    await seedRects(page, 2);
    await ev.capture('baseline');

    // Zoom in
    await ev.scrollWheel(0, -300, 'post-zoom-in', { modifiers: ['Control'] });

    // Zoom out
    await ev.scrollWheel(0, 600, 'post-zoom-out', { modifiers: ['Control'] });

    const report = ev.finalize();
    logReport(report);
  });

  // VP-09/10: Zoom with keyboard
  test('VP-09/10: Zoom with keyboard', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-09-10' });
    await seedRects(page, 2);
    await ev.capture('baseline');

    await ev.pressKey('Control+=', 'post-zoom-in-key');
    await ev.pressKey('Control+=', 'post-zoom-in-key-2');
    await ev.pressKey('Control+-', 'post-zoom-out-key');

    const report = ev.finalize();
    logReport(report);
  });

  // VP-11/12: Zoom min/max enforcement
  test('VP-11/12: Zoom min/max enforcement', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-11-12' });
    await ev.capture('baseline');

    // Zoom out aggressively
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Control+-');
    }
    await page.waitForTimeout(200);
    await ev.capture('post-max-zoom-out');

    // Zoom in aggressively
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Control+=');
    }
    await page.waitForTimeout(200);
    await ev.capture('post-max-zoom-in');

    const report = ev.finalize();
    logReport(report);
  });

  // VP-14: Zoom display update
  test('VP-14: Zoom display update', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-14' });
    await ev.capture('baseline-zoom-display');

    await ev.pressKey('Control+=', 'post-zoom-in-display');
    await ev.pressKey('Control+-', 'post-zoom-out-display');

    const report = ev.finalize();
    logReport(report);
  });

  // VP-15: Fit to view
  test('VP-15: Fit to view', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-15' });
    await seedRects(page, 3);

    // First zoom in heavily
    for (let i = 0; i < 10; i++) await page.keyboard.press('Control+=');
    await page.waitForTimeout(200);
    await ev.capture('zoomed-in');

    // Fit to view with Shift+1
    await ev.pressKey('Shift+1', 'post-fit-to-view');

    const report = ev.finalize();
    logReport(report);
  });

  // VP-16: Zoom to 100%
  test('VP-16: Zoom to 100%', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-16' });

    // Zoom in first
    for (let i = 0; i < 5; i++) await page.keyboard.press('Control+=');
    await page.waitForTimeout(200);
    await ev.capture('pre-reset');

    // Reset to 100% with Ctrl+1
    await ev.pressKey('Control+1', 'post-zoom-100');

    const report = ev.finalize();
    logReport(report);
  });

  // VP-17: Content layer transform
  test('VP-17: Content layer transform applied', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-17' });
    await seedRects(page, 2);
    await ev.capture('baseline');

    // Pan then check CSS transform
    await page.keyboard.down('Space');
    const box = await page.locator('#canvas-container').boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 - 40, { steps: 5 });
      await page.mouse.up();
    }
    await page.keyboard.up('Space');
    await page.waitForTimeout(200);
    await ev.capture('post-pan-transform');

    const report = ev.finalize();
    logReport(report);
  });
});
