/**
 * 05 — Element Resize — Agnostic Eval Loop
 *
 * Evaluates RSZ-01 through RSZ-16: handle resize (edge, corner),
 * constrained, center-anchored, multi-selection, minimum size,
 * and text resize mode.
 *
 * Scene: 1–2 rects. Critical state: element width, height, x, y,
 * interaction state (RESIZING), activeHandle, mutation timeline
 * for dimension deltas.
 *
 * Run:  npx playwright test resize-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, seedText, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Element Resize Eval Loop', () => {
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

  // ─── Handle Resize ───────────────────────────────────────────────────

  // RSZ-01: Resize N/S edge handle (height only)
  test('RSZ-01: Resize edge N/S', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-01' });
    const [elA] = await seedRects(page, 1, { width: 150, height: 100 });

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-resize');
    await ev.dragHandle(elA, 's', 0, 60, 'post-resize-south');

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-02: Resize E/W edge handle (width only)
  test('RSZ-02: Resize edge E/W', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-02' });
    const [elA] = await seedRects(page, 1, { width: 150, height: 100 });

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-resize');
    await ev.dragHandle(elA, 'e', 80, 0, 'post-resize-east');

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-03: Resize corner handle (free resize)
  test('RSZ-03: Resize corner SE', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-03' });
    const [elA] = await seedRects(page, 1, { width: 150, height: 100 });

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-resize');
    await ev.dragHandle(elA, 'se', 80, 60, 'post-resize-se');

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-04: Constrained resize (Shift+drag corner)
  test('RSZ-04: Constrained resize', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-04' });
    const [elA] = await seedRects(page, 1, { width: 150, height: 100 });

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-resize');
    await ev.dragHandle(elA, 'se', 100, 80, 'post-constrained', { modifiers: ['Shift'] });

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-05: Resize from center (Alt+drag)
  test('RSZ-05: Resize from center', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-05' });
    const [elA] = await seedRects(page, 1, { width: 150, height: 100 });

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-resize');
    await ev.dragHandle(elA, 'se', 50, 40, 'post-center-resize', { modifiers: ['Alt'] });

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-06: Resize multi-selection
  test('RSZ-06: Resize multi-selection', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-06' });
    const [elA, elB] = await seedRects(page, 2, { width: 100, height: 80 });

    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'add-B');
    await ev.capture('pre-resize');

    // Drag the SE corner of the multi-selection bounding box
    // Use elB (rightmost) as reference for the SE corner
    await ev.dragHandle(elB, 'se', 60, 40, 'post-multi-resize');

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-09: Minimum size enforcement
  test('RSZ-09: Minimum size enforcement', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-09' });
    const [elA] = await seedRects(page, 1, { width: 150, height: 100 });

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-resize');

    // Drag NW corner far past SE to try to make size negative/tiny
    await ev.dragHandle(elA, 'nw', 200, 150, 'post-min-size');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Text Resize ─────────────────────────────────────────────────────

  // RSZ-10: Resize text triggers fixed mode
  test('RSZ-10: Text resize triggers fixed mode', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-10' });
    const textId = await seedText(page, { width: 200, height: 60 });

    await ev.clickElement(textId, 'selected');
    await ev.capture('pre-resize');
    await ev.dragHandle(textId, 'e', 100, 0, 'post-text-resize');

    const report = ev.finalize();
    logReport(report);
  });
});
