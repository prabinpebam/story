/**
 * 31 — Cursor Behavior — Agnostic Eval Loop
 *
 * Evaluates CUR-01 through CUR-23: tool cursors, resize-handle cursors,
 * rotation-aware mapping, cursor stack, and cursor hiding.
 *
 * Run:  npx playwright test cursor-behavior-eval --project=chromium --headed
 */

import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Cursor Behavior Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // CUR-01..05: Tool cursor changes
  test('CUR-01..05: Tool cursors change with tool activation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'cursor-behavior', scenario: 'CUR-01-05' });
    const canvas = page.locator('#canvas-container, #interaction-canvas, canvas').first();
    await ev.capture('baseline');

    // Select tool → default cursor
    await page.keyboard.press('v');
    await page.waitForTimeout(200);
    const bodyCls1 = await page.evaluate(() => document.body.className);
    await ev.capture('select-tool-cursor');

    // Hand tool → grab cursor
    await page.keyboard.press('h');
    await page.waitForTimeout(200);
    const bodyCls2 = await page.evaluate(() => document.body.className);
    await ev.capture('hand-tool-cursor');

    // Rectangle tool → crosshair cursor
    await page.keyboard.press('r');
    await page.waitForTimeout(200);
    const bodyCls3 = await page.evaluate(() => document.body.className);
    await ev.capture('shape-tool-cursor');

    // Text tool → crosshair cursor
    await page.keyboard.press('t');
    await page.waitForTimeout(200);
    const bodyCls4 = await page.evaluate(() => document.body.className);
    await ev.capture('text-tool-cursor');

    // Back to select
    await page.keyboard.press('v');
    await page.waitForTimeout(200);

    const report = ev.finalize();
    logReport(report);
  });

  // CUR-06..09: Resize handle cursors
  test('CUR-06..09: Resize handle cursors on hover', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'cursor-behavior', scenario: 'CUR-06-09' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('element-selected');

    // Handles are canvas-drawn. Compute positions from element rect.
    const rect = await ev.getElementRect(elA);

    // Hover SE handle position (bottom-right corner)
    await page.mouse.move(rect.x + rect.width, rect.y + rect.height);
    await page.waitForTimeout(200);
    await ev.capture('se-handle-hover');

    // Hover NE handle position (top-right corner)
    await page.mouse.move(rect.x + rect.width, rect.y);
    await page.waitForTimeout(200);
    await ev.capture('ne-handle-hover');

    const report = ev.finalize();
    logReport(report);
  });

  // CUR-10..13: Rotation-aware cursor mapping
  test('CUR-10..13: Rotation-aware resize cursors', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'cursor-behavior', scenario: 'CUR-10-13' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    // Rotate element 45 degrees via store dispatch
    await page.evaluate((id) => {
      const store = (window as any).__TEST_STORE__;
      if (store) {
        store.dispatch({
          type: 'UPDATE_ELEMENT',
          payload: { id, changes: { rotation: 45 } }
        });
      }
    }, elA);
    await page.waitForTimeout(300);
    await ev.capture('rotated-45');

    // Hover SE handle at computed position
    const rect = await ev.getElementRect(elA);
    await page.mouse.move(rect.x + rect.width, rect.y + rect.height);
    await page.waitForTimeout(200);
    await ev.capture('rotated-se-cursor');

    const report = ev.finalize();
    logReport(report);
  });

  // CUR-22: Cursor applied to canvas element
  test('CUR-22: Cursor applied to interaction canvas', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'cursor-behavior', scenario: 'CUR-22' });
    await ev.capture('baseline');

    // Check cursor is applied to the interaction canvas
    const cursorStyle = await page.evaluate(() => {
      const canvas = document.querySelector('#interaction-canvas') ||
                     document.querySelector('#canvas-container canvas') ||
                     document.querySelector('canvas');
      return canvas ? getComputedStyle(canvas).cursor : 'no-canvas';
    });
    await ev.capture('canvas-cursor-checked');

    // Switch tool and verify cursor changes
    await page.keyboard.press('h');
    await page.waitForTimeout(200);
    const cursorAfter = await page.evaluate(() => {
      const canvas = document.querySelector('#interaction-canvas') ||
                     document.querySelector('#canvas-container canvas') ||
                     document.querySelector('canvas');
      return canvas ? getComputedStyle(canvas).cursor : 'no-canvas';
    });
    await ev.capture('hand-cursor-on-canvas');

    await page.keyboard.press('v');
    const report = ev.finalize();
    logReport(report);
  });
});
