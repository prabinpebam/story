/**
 * 18 — Color Picker — Agnostic Eval Loop
 *
 * Evaluates CLR-01 through CLR-39: HSB area, hue/alpha sliders, eyedropper,
 * hex input, theme swatches, and context-specific color pickers.
 *
 * Run:  npx playwright test color-picker-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Color Picker Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // CLR-01/02: Click and drag in HSB area
  test('CLR-01/02: HSB color area interaction', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'color-picker', scenario: 'CLR-01-02' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    // Open fill flyout
    const swatch = page.locator('[data-testid="fill-color-swatch"], .fill-layer .color-swatch').first();
    if (await swatch.isVisible()) {
      await swatch.click();
      await page.waitForTimeout(300);

      // Click in HSB area
      const hsbArea = page.locator('[data-testid="hsb-area"], .color-area').first();
      if (await hsbArea.isVisible()) {
        const box = await hsbArea.boundingBox();
        if (box) {
          await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.4);
          await page.waitForTimeout(200);
          await ev.capture('post-hsb-click');

          // Drag in HSB area
          await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.2, { steps: 8 });
          await page.mouse.up();
          await page.waitForTimeout(200);
          await ev.capture('post-hsb-drag');
        }
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    const report = ev.finalize();
    logReport(report);
  });

  // CLR-05/06: Hue slider
  test('CLR-05/06: Hue slider interaction', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'color-picker', scenario: 'CLR-05-06' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const swatch = page.locator('[data-testid="fill-color-swatch"], .fill-layer .color-swatch').first();
    if (await swatch.isVisible()) {
      await swatch.click();
      await page.waitForTimeout(300);

      const hueSlider = page.locator('[data-testid="hue-slider"], .hue-slider').first();
      if (await hueSlider.isVisible()) {
        const box = await hueSlider.boundingBox();
        if (box) {
          await page.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);
          await page.waitForTimeout(200);
          await ev.capture('post-hue-click');
        }
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    const report = ev.finalize();
    logReport(report);
  });

  // CLR-13: Edit hex value
  test('CLR-13: Edit hex value in color picker', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'color-picker', scenario: 'CLR-13' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const swatch = page.locator('[data-testid="fill-color-swatch"], .fill-layer .color-swatch').first();
    if (await swatch.isVisible()) {
      await swatch.click();
      await page.waitForTimeout(300);

      const hexInput = page.locator('[data-testid="color-hex-input"] input, .color-picker .hex-input input').first();
      if (await hexInput.isVisible()) {
        await hexInput.fill('E91E63');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);
        await ev.capture('post-hex-input');
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    const report = ev.finalize();
    logReport(report);
  });

  // CLR-19: Click theme swatch
  test('CLR-19: Click theme swatch', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'color-picker', scenario: 'CLR-19' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const swatch = page.locator('[data-testid="fill-color-swatch"], .fill-layer .color-swatch').first();
    if (await swatch.isVisible()) {
      await swatch.click();
      await page.waitForTimeout(300);

      const themeSwatch = page.locator('[data-testid="theme-swatch"], .theme-color-swatch').first();
      if (await themeSwatch.isVisible()) {
        await themeSwatch.click();
        await page.waitForTimeout(200);
        await ev.capture('post-theme-swatch-click');
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    const report = ev.finalize();
    logReport(report);
  });

  // CLR-27: Click default color
  test('CLR-27: Click default palette color', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'color-picker', scenario: 'CLR-27' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const swatch = page.locator('[data-testid="fill-color-swatch"], .fill-layer .color-swatch').first();
    if (await swatch.isVisible()) {
      await swatch.click();
      await page.waitForTimeout(300);

      const defaultColor = page.locator('[data-testid="default-color"], .default-color-swatch').first();
      if (await defaultColor.isVisible()) {
        await defaultColor.click();
        await page.waitForTimeout(200);
        await ev.capture('post-default-color-click');
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    const report = ev.finalize();
    logReport(report);
  });
});
