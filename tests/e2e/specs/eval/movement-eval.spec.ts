/**
 * 04 — Element Movement — Agnostic Eval Loop
 *
 * Evaluates MOV-01 through MOV-17: canvas drag, keyboard nudge,
 * multi-selection drag, escape-cancel, and layer tree reordering.
 *
 * Run:  npx playwright test movement-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, clearSelection, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Element Movement Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // MOV-01: Drag single element
  test('MOV-01: Drag single element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'movement', scenario: 'MOV-01' });
    const [elA] = await seedRects(page, 1);
    await ev.capture('baseline');

    await ev.clickElement(elA, 'pre-drag');
    await ev.dragElement(elA, 100, 60, 'post-drag');

    const report = ev.finalize();
    logReport(report);
  });

  // MOV-02: Drag multi-selection
  test('MOV-02: Drag multi-selection', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'movement', scenario: 'MOV-02' });
    const [elA, elB] = await seedRects(page, 2);
    await ev.capture('baseline');

    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'select-A-B');
    await ev.dragElement(elA, 80, 40, 'post-multi-drag');

    const report = ev.finalize();
    logReport(report);
  });

  // MOV-04: Escape during drag
  test('MOV-04: Escape during drag', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'movement', scenario: 'MOV-04' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'pre-drag');
    await ev.capture('selected');

    // Start drag
    const pos = await ev.getElementCenter(elA);
    await page.mouse.move(pos.x, pos.y);
    await page.mouse.down();
    await page.mouse.move(pos.x + 100, pos.y + 80, { steps: 5 });
    await ev.capture('mid-drag');

    // Escape to cancel
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await page.waitForTimeout(200);
    await ev.capture('post-escape');

    const report = ev.finalize();
    logReport(report);
  });

  // MOV-07: Nudge 1px
  test('MOV-07: Nudge 1px', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'movement', scenario: 'MOV-07' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    await ev.pressKey('ArrowRight', 'post-nudge-right');
    await ev.pressKey('ArrowDown', 'post-nudge-down');

    const report = ev.finalize();
    logReport(report);
  });

  // MOV-08: Nudge 10px
  test('MOV-08: Nudge 10px (Shift+Arrow)', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'movement', scenario: 'MOV-08' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    await ev.pressKey('Shift+ArrowRight', 'post-nudge-10-right');
    await ev.pressKey('Shift+ArrowDown', 'post-nudge-10-down');

    const report = ev.finalize();
    logReport(report);
  });

  // MOV-06: Drag locked element
  test('MOV-06: Drag locked element (blocked)', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'movement', scenario: 'MOV-06' });
    const [elA] = await seedRects(page, 1);

    // Lock the element
    await page.evaluate((id) => {
      (window as any).__TEST_STORE__?.dispatch('UPDATE_ELEMENT', { id, locked: true });
    }, elA);
    await page.waitForTimeout(200);
    await ev.capture('locked-baseline');

    // Try to click (should not select)
    const pos = await ev.getElementCenter(elA);
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(200);
    await ev.capture('post-click-locked');

    const report = ev.finalize();
    logReport(report);
  });
});
