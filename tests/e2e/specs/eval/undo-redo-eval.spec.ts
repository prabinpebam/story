/**
 * 10 — Undo / Redo — Agnostic Eval Loop
 *
 * Evaluates UND-01 through UND-22: core undo/redo operations, text edit
 * isolation, history limit, redo clear on new action, and state preservation.
 *
 * Run:  npx playwright test undo-redo-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, seedText, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Undo / Redo Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // UND-01: Undo last action
  test('UND-01: Undo last action', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'undo-redo', scenario: 'UND-01' });
    const [elA] = await seedRects(page, 1);
    await ev.capture('baseline');

    // Select and move the element
    await ev.clickElement(elA, 'selected');
    await ev.dragElement(elA, 100, 50, 'post-move');

    // Undo
    await ev.pressKey('Control+z', 'post-undo');

    const report = ev.finalize();
    logReport(report);
  });

  // UND-02: Redo undone action
  test('UND-02: Redo undone action', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'undo-redo', scenario: 'UND-02' });
    const [elA] = await seedRects(page, 1);
    await ev.capture('baseline');

    await ev.clickElement(elA, 'selected');
    await ev.dragElement(elA, 100, 50, 'post-move');
    await ev.pressKey('Control+z', 'post-undo');
    await ev.pressKey('Control+y', 'post-redo');

    const report = ev.finalize();
    logReport(report);
  });

  // UND-05: Redo cleared on new action
  test('UND-05: Redo cleared on new action', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'undo-redo', scenario: 'UND-05' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.dragElement(elA, 80, 0, 'move-1');
    await ev.pressKey('Control+z', 'post-undo');

    // New action should clear redo
    await ev.dragElement(elA, -60, 0, 'new-move');
    await ev.pressKey('Control+y', 'redo-should-noop');

    const report = ev.finalize();
    logReport(report);
  });

  // UND-07/11/12: Text edit isolation
  test('UND-07/11/12: Text edit collapses to one undo entry', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'undo-redo', scenario: 'UND-07-12' });
    const textId = await seedText(page, { content: 'Undo test' });
    await ev.capture('baseline');

    // Enter edit, type, exit
    await ev.dblClickElement(textId, 'editing');
    await ev.typeText('Additional text ', 'typed');
    await ev.pressKey('Control+Enter', 'post-exit-save');

    // Single undo should revert entire edit session
    await ev.pressKey('Control+z', 'post-undo-session');

    const report = ev.finalize();
    logReport(report);
  });

  // UND-01+UND-02 with element creation
  test('Undo/Redo element creation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'undo-redo', scenario: 'UND-create' });
    await ev.capture('empty-baseline');

    // Create an element via tool
    await page.keyboard.press('r');
    await page.waitForTimeout(200);
    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('No canvas');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);
    await ev.capture('post-create');

    // Undo should remove it
    await ev.pressKey('Control+z', 'post-undo-create');

    // Redo should bring it back
    await ev.pressKey('Control+y', 'post-redo-create');

    const report = ev.finalize();
    logReport(report);
  });
});
