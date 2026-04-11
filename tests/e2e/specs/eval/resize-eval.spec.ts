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

  // RSZ-07: Resize group (all children scale proportionally)
  test('RSZ-07: Resize group', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-07' });
    const [elA, elB] = await seedRects(page, 2, { width: 100, height: 80 });

    // Group them
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'add-B');
    await ev.pressKey('Control+g', 'post-group');
    await ev.capture('pre-resize-group');

    // Resize the group via SE handle of first element (proxy for group gizmo)
    await ev.dragHandle(elB, 'se', 60, 40, 'post-resize-group');

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-08: Resize with snapping
  test('RSZ-08: Resize with snapping', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-08' });
    const [elA, elB] = await seedRects(page, 2, { spacingX: 250, width: 120, height: 80 });

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-resize');

    // Drag east handle toward elB to trigger snap
    const posB = await ev.getElementCenter(elB);
    const rectA = await ev.getElementRect(elA);
    const handleX = rectA.x + rectA.width;
    const handleY = rectA.y + rectA.height / 2;
    await page.mouse.move(handleX, handleY);
    await page.mouse.down();
    await page.mouse.move(posB.x - 60, handleY, { steps: 10 });
    await page.waitForTimeout(50);
    await ev.capture('during-snap-resize');
    await page.mouse.up();
    await page.waitForTimeout(200);
    await ev.capture('post-snap-resize');

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-11: Shift+drag text scales font size + dimensions
  test('RSZ-11: Text scale transform', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-11' });
    const textId = await seedText(page, { content: 'Scale me', width: 200, height: 60 });

    await ev.clickElement(textId, 'selected');
    await ev.capture('pre-scale');
    await ev.dragHandle(textId, 'se', 80, 60, 'post-scale', { modifiers: ['Shift'] });

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-12: Auto-resize position adjust based on textAlign
  test('RSZ-12: Text auto-resize position adjust', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-12' });
    const textId = await seedText(page, { content: 'Auto resize', width: 200 });

    await ev.clickElement(textId, 'selected');
    await ev.capture('pre-auto-resize');

    // Type more content to trigger auto-resize
    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.type(' with extra long text content that wraps', { delay: 20 });
    await page.waitForTimeout(300);
    await ev.capture('post-type-resize');
    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-13/14: Gizmo hidden during resize, shown after
  test('RSZ-13/14: Gizmo visibility during resize', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-13-14' });
    const [elA] = await seedRects(page, 1, { width: 150, height: 100 });

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-resize-gizmo-visible');

    // Start resize — capture during interaction
    const rect = await ev.getElementRect(elA);
    const cx = rect.x + rect.width;
    const cy = rect.y + rect.height;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 40, cy + 30, { steps: 4 });
    await page.waitForTimeout(50);
    await ev.capture('during-resize-gizmo-hidden');
    await page.mouse.up();
    await page.waitForTimeout(200);
    await ev.capture('post-resize-gizmo-restored');

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-15: Text overlay stays visible during resize
  test('RSZ-15: Text overlay stays during resize', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-15' });
    const textId = await seedText(page, { content: 'Resize overlay', width: 200, height: 60 });

    await ev.clickElement(textId, 'selected');
    await ev.capture('pre-text-resize');
    await ev.dragHandle(textId, 'e', 80, 0, 'post-text-resize');

    const report = ev.finalize();
    logReport(report);
  });

  // RSZ-16: Scale tool (K key)
  test('RSZ-16: Scale tool activation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'resize', scenario: 'RSZ-16' });
    const [elA] = await seedRects(page, 1, { width: 150, height: 100 });

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-scale-tool');

    // Activate scale tool
    await ev.pressKey('k', 'scale-tool-active');
    await ev.capture('post-scale-tool');

    // Return to select
    await ev.pressKey('v', 'select-tool');

    const report = ev.finalize();
    logReport(report);
  });
});
