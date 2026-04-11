/**
 * 05 — Element Resize — Agnostic Eval Loop
 *
 * Evaluates RSZ-01 through RSZ-16: handle resize, constrained resize,
 * resize from center, multi-selection resize, minimum size enforcement,
 * text resize mode switching, and gizmo visibility during resize.
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
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // RSZ-01/02: Resize edge handle N/S and E/W
  test('RSZ-01/02: Resize edge handles', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-01-02' });
    const [elA] = await seedRects(page, 1, { width: 200, height: 150 });
    await ev.clickElement(elA, 'selected');

    // Grab east handle and drag
    await ev.dragHandle(elA, 'e', 60, 0, 'post-resize-east');

    // Grab south handle and drag
    await ev.dragHandle(elA, 's', 0, 40, 'post-resize-south');

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-03: Resize corner handle
  test('RSZ-03: Resize corner handle', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-03' });
    const [elA] = await seedRects(page, 1, { width: 200, height: 150 });
    await ev.clickElement(elA, 'selected');

    await ev.dragHandle(elA, 'se', 80, 60, 'post-resize-corner');

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-04: Constrained resize (Shift+drag)
  test('RSZ-04: Constrained resize', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-04' });
    const [elA] = await seedRects(page, 1, { width: 200, height: 200 });
    await ev.clickElement(elA, 'selected');

    // Shift+drag SE corner for constrained resize
    await ev.dragHandle(elA, 'se', 80, 120, 'post-constrained-resize', { modifiers: ['Shift'] });

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-09: Minimum size enforcement
  test('RSZ-09: Minimum size enforcement', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-09' });
    const [elA] = await seedRects(page, 1, { width: 100, height: 80 });
    await ev.clickElement(elA, 'selected');

    // Try to resize below minimum
    await ev.dragHandle(elA, 'se', -200, -200, 'post-resize-below-min');

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-10: Text resize triggers fixed mode
  test('RSZ-10: Text resize triggers fixed mode', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-10' });
    const textId = await seedText(page, { width: 200, height: 60 });
    await ev.clickElement(textId, 'text-selected');

    await ev.dragHandle(textId, 'e', 80, 0, 'post-text-resize');

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-06: Resize multi-selection
  test('RSZ-06: Resize multi-selection', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-06' });
    const [elA, elB] = await seedRects(page, 2, { width: 100, height: 80 });
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'select-A-B');

    // For multi-selection, drag from the furthest SE corner of the bounding box
    // Use elB (which is positioned further right/down) as reference
    await ev.dragHandle(elB, 'se', 60, 40, 'post-multi-resize');

    const report = ev.finalize();
    logReport(report);
  });
});
