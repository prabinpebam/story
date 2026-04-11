/**
 * 03 — Element Creation — Agnostic Eval Loop
 *
 * Evaluates CRE-01 through CRE-19: shape/text creation via tools,
 * click-to-create, drag-to-create, constrained creation, tool revert,
 * and empty text auto-deletion.
 *
 * Scene: empty slide (no seeded elements). Creation adds elements —
 * the engine's mutation timeline detects element-added events, the
 * heuristic detectors verify Store↔DOM sync after each creation,
 * and temporal rules check tool revert and interaction state.
 *
 * Run:  npx playwright test creation-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

/** Get canvas center and a point for drag start. */
async function getCanvasPoints(page: import('@playwright/test').Page) {
  const box = await page.locator('#canvas-container').boundingBox();
  if (!box) throw new Error('Canvas container not found');
  return {
    cx: box.x + box.width / 2,
    cy: box.y + box.height / 2,
    // Offset start point so drag creates don't overlap click creates
    sx: box.x + box.width * 0.3,
    sy: box.y + box.height * 0.3,
  };
}

test.describe('Element Creation Eval Loop', () => {
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

  // ─── Shape Tool: Click-to-Create ─────────────────────────────────────

  // CRE-01: Rectangle click → default size element appears, auto-selected
  test('CRE-01: Create rectangle via click', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-01' });
    await ev.capture('baseline');

    await ev.pressKey('r', 'rect-tool');
    const { cx, cy } = await getCanvasPoints(page);
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(300);
    await ev.capture('post-create');

    const report = ev.finalize();
    logReport(report);
  });

  // CRE-04: Ellipse click → default size ellipse
  test('CRE-04: Create ellipse via click', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-04' });
    await ev.capture('baseline');

    await ev.pressKey('o', 'ellipse-tool');
    const { cx, cy } = await getCanvasPoints(page);
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(300);
    await ev.capture('post-create');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Shape Tool: Drag-to-Create ──────────────────────────────────────

  // CRE-02: Rectangle drag defines bounding box
  test('CRE-02: Create rectangle via drag', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-02' });
    await ev.capture('baseline');

    await ev.pressKey('r', 'rect-tool');
    const { sx, sy } = await getCanvasPoints(page);
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.waitForTimeout(50);
    await ev.capture('mid-drag');
    await page.mouse.move(sx + 200, sy + 120, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    await ev.capture('post-drag-create');

    const report = ev.finalize();
    logReport(report);
  });

  // CRE-05: Ellipse drag
  test('CRE-05: Create ellipse via drag', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-05' });
    await ev.capture('baseline');

    await ev.pressKey('o', 'ellipse-tool');
    const { sx, sy } = await getCanvasPoints(page);
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(sx + 180, sy + 100, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    await ev.capture('post-drag-create');

    const report = ev.finalize();
    logReport(report);
  });

  // CRE-07: Line drag
  test('CRE-07: Create line via drag', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-07' });
    await ev.capture('baseline');

    await ev.pressKey('l', 'line-tool');
    const { sx, sy } = await getCanvasPoints(page);
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(sx + 250, sy - 30, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    await ev.capture('post-drag-create');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Constrained Creation ────────────────────────────────────────────

  // CRE-03: Shift+drag rectangle → square
  test('CRE-03: Create constrained rect (square)', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-03' });
    await ev.capture('baseline');

    await ev.pressKey('r', 'rect-tool');
    const { sx, sy } = await getCanvasPoints(page);
    await page.mouse.move(sx, sy);
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.move(sx + 150, sy + 200, { steps: 8 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await page.waitForTimeout(300);
    await ev.capture('post-constrained');

    const report = ev.finalize();
    logReport(report);
  });

  // CRE-06: Shift+drag ellipse → circle
  test('CRE-06: Create constrained ellipse (circle)', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-06' });
    await ev.capture('baseline');

    await ev.pressKey('o', 'ellipse-tool');
    const { sx, sy } = await getCanvasPoints(page);
    await page.mouse.move(sx, sy);
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.move(sx + 160, sy + 200, { steps: 8 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await page.waitForTimeout(300);
    await ev.capture('post-constrained');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Text Tool ───────────────────────────────────────────────────────

  // CRE-11: Text click → auto-size, enters edit mode
  test('CRE-11: Create text via click', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-11' });
    await ev.capture('baseline');

    await ev.pressKey('t', 'text-tool');
    const { cx, cy } = await getCanvasPoints(page);
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(500);
    await ev.capture('post-create-text');

    // Exit text edit
    await ev.pressKey('Escape', 'post-exit-edit');

    const report = ev.finalize();
    logReport(report);
  });

  // CRE-12: Text drag → fixed-width text
  test('CRE-12: Create text via drag', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-12' });
    await ev.capture('baseline');

    await ev.pressKey('t', 'text-tool');
    const { sx, sy } = await getCanvasPoints(page);
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(sx + 300, sy + 80, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    await ev.capture('post-drag-text');

    await ev.pressKey('Escape', 'post-exit-edit');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Post-Creation Behaviors ─────────────────────────────────────────

  // CRE-17/18: Newly created flag + tool reverts to select
  // The engine captures store.activeTool in every snapshot.
  // Mutation timeline shows tool transition and element-added event.
  test('CRE-17/18: Post-creation state (flag + tool revert)', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-17-18' });
    await ev.capture('baseline');

    await ev.pressKey('r', 'rect-tool');
    const { cx, cy } = await getCanvasPoints(page);
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(300);
    await ev.capture('post-create');

    // Wait briefly then capture again to observe isNewlyCreated clearing
    await page.waitForTimeout(500);
    await ev.capture('post-settle');

    const report = ev.finalize();
    logReport(report);
  });

  // CRE-19: Empty text auto-deleted on exit without typing
  test('CRE-19: Empty text deleted on exit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-19' });
    await ev.capture('baseline');

    // Create text element
    await ev.pressKey('t', 'text-tool');
    const { cx, cy } = await getCanvasPoints(page);
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(500);
    await ev.capture('text-created');

    // Exit without typing — element should be auto-deleted
    await ev.pressKey('Escape', 'post-exit-empty');

    const report = ev.finalize();
    logReport(report);
  });
});
