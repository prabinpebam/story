/**
 * 19 — Shapes & Vector Editing — Agnostic Eval Loop
 *
 * Evaluates SHP-01 through SHP-49: shape creation, parametric editing,
 * vector path editing, boolean operations, and mask composition.
 *
 * Run:  npx playwright test shapes-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, seedEllipse, seedLine, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Shapes & Vector Editing Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // SHP-01: Create rectangle
  test('SHP-01: Create rectangle', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-01' });
    await ev.capture('baseline');

    await page.keyboard.press('r');
    await page.waitForTimeout(200);
    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('No canvas');
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    await ev.capture('post-create-rect');

    const report = ev.finalize();
    logReport(report);
  });

  // SHP-02: Create ellipse
  test('SHP-02: Create ellipse', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-02' });
    await ev.capture('baseline');

    await page.keyboard.press('o');
    await page.waitForTimeout(200);
    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('No canvas');
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    await ev.capture('post-create-ellipse');

    const report = ev.finalize();
    logReport(report);
  });

  // SHP-06: Constrain to square/circle
  test('SHP-06: Constrained shape (Shift+drag)', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-06' });
    await ev.capture('baseline');

    await page.keyboard.press('r');
    await page.waitForTimeout(200);
    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('No canvas');
    const sx = box.x + box.width * 0.3;
    const sy = box.y + box.height * 0.3;
    await page.keyboard.down('Shift');
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(sx + 150, sy + 220, { steps: 8 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await page.waitForTimeout(300);
    await ev.capture('post-constrained-square');

    const report = ev.finalize();
    logReport(report);
  });

  // SHP-14: Set uniform corner radius
  test('SHP-14: Set corner radius', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-14' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const radiusInput = page.locator('[data-testid="corner-radius-input"] input, [data-testid="element-radius"] input').first();
    if (await radiusInput.isVisible()) {
      await radiusInput.fill('20');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-radius-20');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // SHP-28: Create boolean union
  test('SHP-28: Create boolean union', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-28' });
    // Seed two overlapping rects
    const [elA, elB] = await seedRects(page, 2, { startX: 150, spacingX: 80, width: 120, height: 80 });
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'select-A-B');

    // Use keyboard shortcut or menu for boolean union
    const unionBtn = page.locator('[data-testid="boolean-union"]').first();
    if (await unionBtn.isVisible()) {
      await unionBtn.click();
      await page.waitForTimeout(300);
      await ev.capture('post-boolean-union');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // SHP-39: Create mask
  test('SHP-39: Create mask', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-39' });
    const [elA, elB] = await seedRects(page, 2, { spacingX: 0, width: 120 });
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'select-A-B');

    const maskBtn = page.locator('[data-testid="create-mask"]').first();
    if (await maskBtn.isVisible()) {
      await maskBtn.click();
      await page.waitForTimeout(300);
      await ev.capture('post-create-mask');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // SHP-03: Create line
  test('SHP-03: Create line', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-03' });
    await ev.capture('baseline');

    await page.keyboard.press('l');
    await page.waitForTimeout(200);
    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('No canvas');
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    await ev.capture('post-create-line');

    const report = ev.finalize();
    logReport(report);
  });
});
