/**
 * 27 — Collaboration — Agnostic Eval Loop
 *
 * Evaluates COL-01 through COL-26: connection status, presence,
 * operation types, and local-first behavior. Since real collaboration
 * requires a second peer, tests validate single-client state consistency.
 *
 * Run:  npx playwright test collaboration-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Collaboration Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // COL-13: Local-first operation (element creation is instantly visible)
  test('COL-13: Local-first element creation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'collaboration', scenario: 'COL-13' });
    await ev.capture('baseline');

    // Create element — should appear instantly (local-first)
    await page.keyboard.press('r');
    await page.waitForTimeout(200);
    const box = await page.locator('#canvas-container').boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(300);
    }
    await ev.capture('post-local-create');

    const report = ev.finalize();
    logReport(report);
  });

  // COL-20/22: Element insert and update locally
  test('COL-20/22: Element insert and update ops', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'collaboration', scenario: 'COL-20-22' });
    const [elA] = await seedRects(page, 1);
    await ev.capture('element-exists');

    // Update: move element
    await ev.clickElement(elA, 'selected');
    await ev.dragElement(elA, 80, 40, 'post-move-update');

    const report = ev.finalize();
    logReport(report);
  });

  // COL-21: Element delete locally
  test('COL-21: Element delete op', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'collaboration', scenario: 'COL-21' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-delete');

    await page.keyboard.press('Delete');
    await page.waitForTimeout(200);
    await ev.capture('post-delete');

    const report = ev.finalize();
    logReport(report);
  });
});
