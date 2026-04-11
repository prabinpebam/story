/**
 * 02 — Viewport & Navigation — Agnostic Eval Loop
 *
 * Evaluates VP-01 through VP-18: panning, zooming, fit-to-view,
 * zoom clamping, and viewport CSS transforms.
 *
 * Scene: 1 rect (position reference). The rect's store position stays
 * constant — only viewport (zoom/pan) changes. The engine's heuristic
 * detectors verify Store↔DOM sync, zoom display consistency (A4),
 * and interaction state transitions automatically.
 *
 * Run:  npx playwright test viewport-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Viewport & Navigation Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(
      () => !!(window as any).__TEST_CANVAS_MANAGER__,
      null,
      { timeout: 10_000 },
    );
  });

  // ─── Panning ─────────────────────────────────────────────────────────

  // VP-01: Space+drag pans the viewport
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

    const report = ev.finalize();
    logReport(report);
  });

  // VP-02: Middle mouse button pans
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

    const report = ev.finalize();
    logReport(report);
  });

  // VP-03: Scroll wheel pans (no modifier)
  test('VP-03: Pan with scroll wheel', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-03' });
    const [ref] = await seedRects(page, 1);

    await ev.capture('baseline');
    await ev.scrollWheel(0, -200, 'post-scroll-pan');

    const report = ev.finalize();
    logReport(report);
  });

  // VP-04: Hand tool (H) + drag pans
  test('VP-04: Pan with hand tool', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-04' });
    const [ref] = await seedRects(page, 1);

    await ev.capture('baseline');

    // Activate hand tool
    await ev.pressKey('h', 'hand-tool-active');

    // Drag to pan
    const start = await ev.getElementCenter(ref);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 100, start.y + 70, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    await ev.capture('post-hand-pan');

    // Restore select tool
    await ev.pressKey('v', 'select-tool-restored');

    const report = ev.finalize();
    logReport(report);
  });

  // VP-05/06: Release returns to IDLE; performance pan mode
  test('VP-05/06: Pan release and performance mode', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-05-06' });
    const [ref] = await seedRects(page, 1);

    await ev.capture('baseline');

    const start = await ev.getElementCenter(ref);

    // Begin space+drag — capture mid-drag to observe PANNING state
    await page.keyboard.down('Space');
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 50, start.y + 30, { steps: 4 });
    await page.waitForTimeout(50);
    await ev.capture('during-pan');

    // Release — engine temporal rules verify IDLE after release
    await page.mouse.up();
    await page.keyboard.up('Space');
    await page.waitForTimeout(200);
    await ev.capture('post-release');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Zooming ─────────────────────────────────────────────────────────

  // VP-07/08: Ctrl+Scroll zooms in/out
  test('VP-07/08: Zoom with Ctrl+Scroll', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-07-08' });
    const [ref] = await seedRects(page, 1);

    await ev.capture('baseline');
    await ev.scrollWheel(0, -300, 'post-zoom-in', { modifiers: ['Control'] });
    await ev.scrollWheel(0, 600, 'post-zoom-out', { modifiers: ['Control'] });

    const report = ev.finalize();
    logReport(report);
  });

  // VP-09/10: Keyboard zoom Ctrl+= / Ctrl+-
  test('VP-09/10: Zoom with keyboard', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-09-10' });
    const [ref] = await seedRects(page, 1);

    await ev.capture('baseline');
    await ev.pressKey('Control+=', 'post-zoom-in');
    await ev.pressKey('Control+=', 'post-zoom-in-2');
    await ev.pressKey('Control+-', 'post-zoom-out');

    const report = ev.finalize();
    logReport(report);
  });

  // VP-11/12: Zoom min (10%) and max (500%) clamping
  test('VP-11/12: Zoom clamp at min and max', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-11-12' });

    await ev.capture('baseline');

    // Drive to min zoom
    for (let i = 0; i < 25; i++) await page.keyboard.press('Control+-');
    await page.waitForTimeout(200);
    await ev.capture('at-min-zoom');

    // Drive to max zoom
    for (let i = 0; i < 50; i++) await page.keyboard.press('Control+=');
    await page.waitForTimeout(200);
    await ev.capture('at-max-zoom');

    const report = ev.finalize();
    logReport(report);
  });

  // VP-13: Cursor-centered zoom — world coords under cursor stay fixed
  test('VP-13: Cursor-centered zoom', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-13' });
    const [ref] = await seedRects(page, 1);

    await ev.capture('baseline');

    // Position cursor over element, then zoom at that point
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

    const report = ev.finalize();
    logReport(report);
  });

  // VP-14: Zoom display text sync — A4 detector fires if mismatched
  test('VP-14: Zoom display sync', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-14' });

    await ev.capture('baseline');
    await ev.pressKey('Control+=', 'after-zoom-in');
    await ev.pressKey('Control+-', 'after-zoom-out');
    await ev.pressKey('Control+-', 'after-zoom-out-2');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Fit & Reset ─────────────────────────────────────────────────────

  // VP-15: Fit to view
  test('VP-15: Fit to view', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-15' });
    const [ref] = await seedRects(page, 1);

    // Zoom in heavily so fit has a visible effect
    for (let i = 0; i < 10; i++) await page.keyboard.press('Control+=');
    await page.waitForTimeout(200);
    await ev.capture('zoomed-in');

    await ev.pressKey('Shift+1', 'post-fit');

    const report = ev.finalize();
    logReport(report);
  });

  // VP-16: Reset zoom to exactly 100%
  test('VP-16: Zoom to 100%', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-16' });

    // Zoom away from 100% first
    for (let i = 0; i < 5; i++) await page.keyboard.press('Control+=');
    await page.waitForTimeout(200);
    await ev.capture('pre-reset');

    await ev.pressKey('Control+1', 'post-reset-100');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Viewport Transform ─────────────────────────────────────────────

  // VP-17: CSS translate+scale applied to content layer
  test('VP-17: Content layer CSS transform', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-17' });
    const [ref] = await seedRects(page, 1);

    await ev.capture('baseline');

    // Pan to shift translate component
    const start = await ev.getElementCenter(ref);
    await page.keyboard.down('Space');
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 80, start.y - 40, { steps: 5 });
    await page.mouse.up();
    await page.keyboard.up('Space');
    await page.waitForTimeout(200);
    await ev.capture('post-pan');

    // Zoom to change scale component
    await ev.pressKey('Control+=', 'post-zoom');

    const report = ev.finalize();
    logReport(report);
  });

  // VP-18: Canvas resize on window resize
  test('VP-18: Canvas resize on window resize', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'viewport', scenario: 'VP-18' });
    const [ref] = await seedRects(page, 1);

    await ev.capture('baseline');

    // Shrink viewport
    const original = page.viewportSize() || { width: 1280, height: 720 };
    await page.setViewportSize({
      width: original.width - 200,
      height: original.height - 100,
    });
    await page.waitForTimeout(300);
    await ev.capture('after-shrink');

    // Restore
    await page.setViewportSize(original);
    await page.waitForTimeout(300);
    await ev.capture('after-restore');

    const report = ev.finalize();
    logReport(report);
  });
});
