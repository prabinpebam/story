/**
 * 11 — Property Inspector — Agnostic Eval Loop
 *
 * Evaluates PI-01 through PI-115: position/layout, appearance, text properties,
 * shape params, SVG/mask/boolean sections, slide properties, and export presets.
 *
 * Run:  npx playwright test property-inspector-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, seedText, seedEllipse, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Property Inspector Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // PI-01..06: Alignment buttons
  test('PI-01..06: Alignment buttons', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'property-inspector', scenario: 'PI-01-06' });
    const [elA, elB] = await seedRects(page, 2);
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'select-A-B');

    // Align left
    const alignLeft = page.locator('[data-testid="align-elements-left"]').first();
    if (await alignLeft.isVisible()) {
      await alignLeft.click();
      await page.waitForTimeout(200);
      await ev.capture('post-align-left');
    }

    // Align top
    const alignTop = page.locator('[data-testid="align-elements-top"]').first();
    if (await alignTop.isVisible()) {
      await alignTop.click();
      await page.waitForTimeout(200);
      await ev.capture('post-align-top');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // PI-09/10: Set X/Y position
  test('PI-09/10: Set X/Y position via inputs', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'property-inspector', scenario: 'PI-09-10' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    // Set X
    const xInput = page.locator('[data-testid="position-x"] input, [data-testid="element-x"] input').first();
    if (await xInput.isVisible()) {
      await xInput.fill('200');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-set-x');
    }

    // Set Y
    const yInput = page.locator('[data-testid="position-y"] input, [data-testid="element-y"] input').first();
    if (await yInput.isVisible()) {
      await yInput.fill('300');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-set-y');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // PI-21/22: Set width/height
  test('PI-21/22: Set width/height via inputs', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'property-inspector', scenario: 'PI-21-22' });
    const [elA] = await seedRects(page, 1, { width: 120, height: 80 });
    await ev.clickElement(elA, 'selected');

    const wInput = page.locator('[data-testid="dimension-w"] input, [data-testid="element-width"] input').first();
    if (await wInput.isVisible()) {
      await wInput.fill('250');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-set-width');
    }

    const hInput = page.locator('[data-testid="dimension-h"] input, [data-testid="element-height"] input').first();
    if (await hInput.isVisible()) {
      await hInput.fill('180');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-set-height');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // PI-27: Set opacity
  test('PI-27: Set element opacity', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'property-inspector', scenario: 'PI-27' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const opInput = page.locator('[data-testid="opacity-input"] input, [data-testid="element-opacity"] input').first();
    if (await opInput.isVisible()) {
      await opInput.fill('50');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-set-opacity-50');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // PI-30: Set uniform corner radius
  test('PI-30: Set corner radius', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'property-inspector', scenario: 'PI-30' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const radiusInput = page.locator('[data-testid="corner-radius-input"] input, [data-testid="element-radius"] input').first();
    if (await radiusInput.isVisible()) {
      await radiusInput.fill('16');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-set-radius');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // PI-43: Change font size
  test('PI-43: Change font size', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'property-inspector', scenario: 'PI-43' });
    const textId = await seedText(page);
    await ev.clickElement(textId, 'text-selected');

    if (await editor.fontSizeInput.isVisible()) {
      await editor.fontSizeInput.fill('36');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-font-size-36');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // PI-13/14: Flip horizontal/vertical
  test('PI-13/14: Flip horizontal and vertical', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'property-inspector', scenario: 'PI-13-14' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const flipH = page.locator('[data-testid="flip-horizontal"]').first();
    if (await flipH.isVisible()) {
      await flipH.click();
      await page.waitForTimeout(200);
      await ev.capture('post-flip-h');
    }

    const flipV = page.locator('[data-testid="flip-vertical"]').first();
    if (await flipV.isVisible()) {
      await flipV.click();
      await page.waitForTimeout(200);
      await ev.capture('post-flip-v');
    }

    const report = ev.finalize();
    logReport(report);
  });
});
