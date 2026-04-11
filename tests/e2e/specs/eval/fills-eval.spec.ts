/**
 * 14 — Fills System — Agnostic Eval Loop
 *
 * Evaluates FIL-01 through FIL-74: fill stack management, solid/gradient/image
 * fill editing, theme linking, color picker, and multi-selection behavior.
 *
 * Run:  npx playwright test fills-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Fills System Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // FIL-01: Add fill layer
  test('FIL-01: Add fill layer', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-01' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const addFillBtn = page.locator('[data-testid="add-fill"], [data-testid="fill-add-btn"]').first();
    if (await addFillBtn.isVisible()) {
      await addFillBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('post-add-fill');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // FIL-03: Toggle fill visibility
  test('FIL-03: Toggle fill visibility', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-03' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const visToggle = page.locator('[data-testid="fill-visibility-toggle"], .fill-layer .visibility-toggle').first();
    if (await visToggle.isVisible()) {
      await visToggle.click();
      await page.waitForTimeout(200);
      await ev.capture('post-hide-fill');

      await visToggle.click();
      await page.waitForTimeout(200);
      await ev.capture('post-show-fill');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // FIL-06: Edit fill hex input
  test('FIL-06: Edit fill hex color', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-06' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const hexInput = page.locator('[data-testid="fill-hex-input"] input, .fill-layer .hex-input input').first();
    if (await hexInput.isVisible()) {
      await hexInput.fill('FF5733');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-hex-change');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // FIL-07: Edit fill opacity
  test('FIL-07: Edit fill opacity', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-07' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const opInput = page.locator('[data-testid="fill-opacity-input"] input, .fill-layer .opacity-input input').first();
    if (await opInput.isVisible()) {
      await opInput.fill('50');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-fill-opacity-50');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // FIL-08: Open fill flyout (color picker)
  test('FIL-08: Open fill flyout', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-08' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const fillSwatch = page.locator('[data-testid="fill-color-swatch"], .fill-layer .color-swatch').first();
    if (await fillSwatch.isVisible()) {
      await fillSwatch.click();
      await page.waitForTimeout(300);
      await ev.capture('flyout-open');

      // Close flyout
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      await ev.capture('flyout-closed');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // FIL-14: Switch fill type
  test('FIL-14: Switch fill type to gradient', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-14' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    // Open the flyout first
    const fillSwatch = page.locator('[data-testid="fill-color-swatch"], .fill-layer .color-swatch').first();
    if (await fillSwatch.isVisible()) {
      await fillSwatch.click();
      await page.waitForTimeout(300);

      // Switch to gradient
      const gradTab = page.locator('[data-testid="fill-type-gradient"], [data-fill-type="gradient"]').first();
      if (await gradTab.isVisible()) {
        await gradTab.click();
        await page.waitForTimeout(200);
        await ev.capture('post-switch-gradient');
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    const report = ev.finalize();
    logReport(report);
  });

  // FIL-02: Delete fill layer
  test('FIL-02: Delete fill layer', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'fills', scenario: 'FIL-02' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    // First add a second fill
    const addBtn = page.locator('[data-testid="add-fill"], [data-testid="fill-add-btn"]').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('two-fills');
    }

    // Delete (via context menu or delete button)
    const delBtn = page.locator('[data-testid="fill-delete-btn"], .fill-layer .delete-btn').first();
    if (await delBtn.isVisible()) {
      await delBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('post-delete-fill');
    }

    const report = ev.finalize();
    logReport(report);
  });
});
