/**
 * 03 — Element Creation — Agnostic Eval Loop
 *
 * Evaluates CRE-01 through CRE-19: shape/text/image creation via tools,
 * drag-to-create, click-to-create, post-creation auto-select, and tool revert.
 *
 * Run:  npx playwright test creation-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Element Creation Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // CRE-01: Create rectangle via click
  test('CRE-01: Create rectangle via click', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-01' });
    await ev.capture('baseline');

    // Activate rect tool
    await page.keyboard.press('r');
    await page.waitForTimeout(200);
    await ev.capture('tool-active');

    // Click on canvas to create default rect
    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('No canvas');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);
    await ev.capture('post-create-rect');

    const report = ev.finalize();
    logReport(report);
  });

  // CRE-02: Create rectangle via drag
  test('CRE-02: Create rectangle via drag', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-02' });
    await ev.capture('baseline');

    await page.keyboard.press('r');
    await page.waitForTimeout(200);

    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('No canvas');
    const startX = box.x + box.width * 0.3;
    const startY = box.y + box.height * 0.3;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 200, startY + 120, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    await ev.capture('post-drag-create-rect');

    const report = ev.finalize();
    logReport(report);
  });

  // CRE-03: Constrained rectangle (Shift+drag)
  test('CRE-03: Create constrained rect (square)', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-03' });
    await ev.capture('baseline');

    await page.keyboard.press('r');
    await page.waitForTimeout(200);

    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('No canvas');
    const startX = box.x + box.width * 0.3;
    const startY = box.y + box.height * 0.3;
    await page.mouse.move(startX, startY);
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.move(startX + 150, startY + 200, { steps: 8 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await page.waitForTimeout(300);
    await ev.capture('post-constrained-rect');

    const report = ev.finalize();
    logReport(report);
  });

  // CRE-04: Create ellipse via click
  test('CRE-04: Create ellipse via click', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-04' });
    await ev.capture('baseline');

    await page.keyboard.press('o');
    await page.waitForTimeout(200);

    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('No canvas');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);
    await ev.capture('post-create-ellipse');

    const report = ev.finalize();
    logReport(report);
  });

  // CRE-07: Create line
  test('CRE-07: Create line via drag', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-07' });
    await ev.capture('baseline');

    await page.keyboard.press('l');
    await page.waitForTimeout(200);

    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('No canvas');
    const startX = box.x + box.width * 0.2;
    const startY = box.y + box.height * 0.5;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 300, startY - 50, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    await ev.capture('post-create-line');

    const report = ev.finalize();
    logReport(report);
  });

  // CRE-11: Create text via click
  test('CRE-11: Create text via click', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-11' });
    await ev.capture('baseline');

    await page.keyboard.press('t');
    await page.waitForTimeout(200);
    await ev.capture('text-tool-active');

    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('No canvas');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
    await ev.capture('post-create-text');

    const report = ev.finalize();
    logReport(report);
  });

  // CRE-12: Create text via drag
  test('CRE-12: Create text via drag', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-12' });
    await ev.capture('baseline');

    await page.keyboard.press('t');
    await page.waitForTimeout(200);

    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('No canvas');
    const startX = box.x + box.width * 0.25;
    const startY = box.y + box.height * 0.4;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 300, startY + 80, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    await ev.capture('post-drag-create-text');

    const report = ev.finalize();
    logReport(report);
  });

  // CRE-18: Tool revert to select
  test('CRE-18: Tool reverts to select after creation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-18' });
    await ev.capture('baseline');

    // Create a rect
    await page.keyboard.press('r');
    await page.waitForTimeout(200);
    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('No canvas');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);
    await ev.capture('post-create');

    // Verify tool reverted (captured in store layer)
    const report = ev.finalize();
    logReport(report);
  });

  // CRE-19: Empty text deletion on exit
  test('CRE-19: Empty text deleted on exit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'creation', scenario: 'CRE-19' });
    await ev.capture('baseline');

    // Create text element
    await page.keyboard.press('t');
    await page.waitForTimeout(200);
    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('No canvas');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
    await ev.capture('text-created-editing');

    // Exit without typing — press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await ev.capture('post-exit-empty-text');

    const report = ev.finalize();
    logReport(report);
  });
});
