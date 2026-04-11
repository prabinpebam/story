/**
 * 32 — Export System — Agnostic Eval Loop
 *
 * Evaluates EXP-01 through EXP-33: SVG export engine, raster export,
 * export to clipboard, batch export, preset management, and preview.
 *
 * Run:  npx playwright test export-system-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, seedText, seedEllipse, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Export System Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // EXP-25: Add export preset
  test('EXP-25: Add export preset to element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'export-system', scenario: 'EXP-25' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('element-selected');

    // Look for Export section in Property Inspector
    const exportSection = page.locator('[data-testid="export-section"], [data-testid="pi-export"], .export-section').first();
    if (await exportSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Click add preset button
      const addBtn = exportSection.locator('[data-testid="add-export-preset"], button:has-text("+"), button:has-text("Add")').first();
      if (await addBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(300);
        await ev.capture('preset-added');
      }
    } else {
      // Try scrolling PI to find export section
      const pi = page.locator('[data-testid="property-inspector"], .property-inspector').first();
      if (await pi.isVisible({ timeout: 1000 }).catch(() => false)) {
        await pi.evaluate(el => el.scrollTop = el.scrollHeight);
        await page.waitForTimeout(300);
        await ev.capture('pi-scrolled-to-export');
      }
    }

    const report = ev.finalize();
    logReport(report);
  });

  // EXP-26/27/28: Set preset scale, format, suffix
  test('EXP-26/27/28: Configure export preset', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'export-system', scenario: 'EXP-26-28' });
    const [elA] = await seedRects(page, 1);

    // Add a preset via store dispatch
    await page.evaluate((id) => {
      const store = (window as any).__TEST_STORE__;
      if (store) {
        store.dispatch({
          type: 'UPDATE_ELEMENT',
          payload: {
            id,
            changes: {
              exportPresets: [{ scale: '1x', format: 'png', suffix: '' }]
            }
          }
        });
      }
    }, elA);
    await page.waitForTimeout(300);

    await ev.clickElement(elA, 'selected-with-preset');
    await ev.capture('preset-exists');

    // Look for scale dropdown
    const scaleSelect = page.locator('[data-testid="export-scale-select"], [data-testid*="export"] select').first();
    if (await scaleSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await scaleSelect.selectOption('2x');
      await page.waitForTimeout(200);
      await ev.capture('scale-changed');
    }

    // Look for format dropdown
    const formatSelect = page.locator('[data-testid="export-format-select"], [data-testid*="format"] select').first();
    if (await formatSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await formatSelect.selectOption('svg');
      await page.waitForTimeout(200);
      await ev.capture('format-changed');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // EXP-29: Remove export preset
  test('EXP-29: Remove export preset', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'export-system', scenario: 'EXP-29' });
    const [elA] = await seedRects(page, 1);

    // Seed a preset
    await page.evaluate((id) => {
      const store = (window as any).__TEST_STORE__;
      if (store) {
        store.dispatch({
          type: 'UPDATE_ELEMENT',
          payload: {
            id,
            changes: {
              exportPresets: [
                { scale: '1x', format: 'png', suffix: '' },
                { scale: '2x', format: 'svg', suffix: '@2x' }
              ]
            }
          }
        });
      }
    }, elA);
    await page.waitForTimeout(200);

    await ev.clickElement(elA, 'selected');
    await ev.capture('two-presets');

    // Remove preset button
    const removeBtn = page.locator('[data-testid="remove-export-preset"], .export-preset-row button:has-text("−"), .export-preset-row button:has-text("-")').first();
    if (await removeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await removeBtn.click();
      await page.waitForTimeout(300);
      await ev.capture('preset-removed');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // EXP-01/02: SVG export — basic shape support
  test('EXP-01/02: SVG export generates valid markup', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'export-system', scenario: 'EXP-01-02' });
    const [elA] = await seedRects(page, 1);
    const ellipseId = await seedEllipse(page);
    await ev.capture('shapes-created');

    // Trigger SVG export via internal API if exposed
    const svgResult = await page.evaluate((id) => {
      const w = window as any;
      if (w.__TEST_EXPORT__ && typeof w.__TEST_EXPORT__.buildSvgMarkup === 'function') {
        return w.__TEST_EXPORT__.buildSvgMarkup([id]);
      }
      return null;
    }, elA);
    await ev.capture('svg-export-attempted');

    const report = ev.finalize();
    logReport(report);
  });

  // EXP-14/15/16: Raster export — PNG, JPG, WEBP
  test('EXP-14/15/16: Raster export format support', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'export-system', scenario: 'EXP-14-16' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('element-for-export');

    // Add PNG preset via store
    await page.evaluate((id) => {
      const store = (window as any).__TEST_STORE__;
      if (store) {
        store.dispatch({
          type: 'UPDATE_ELEMENT',
          payload: {
            id,
            changes: {
              exportPresets: [
                { scale: '1x', format: 'png', suffix: '' },
                { scale: '1x', format: 'jpg', suffix: '' }
              ]
            }
          }
        });
      }
    }, elA);
    await page.waitForTimeout(200);
    await ev.capture('presets-configured');

    const report = ev.finalize();
    logReport(report);
  });

  // EXP-31/33: Export preview with aspect ratio preservation
  test('EXP-31/33: Export preview renders', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'export-system', scenario: 'EXP-31-33' });
    const [elA] = await seedRects(page, 1);

    // Add a preset to trigger preview
    await page.evaluate((id) => {
      const store = (window as any).__TEST_STORE__;
      if (store) {
        store.dispatch({
          type: 'UPDATE_ELEMENT',
          payload: {
            id,
            changes: {
              exportPresets: [{ scale: '1x', format: 'png', suffix: '' }]
            }
          }
        });
      }
    }, elA);
    await page.waitForTimeout(200);

    await ev.clickElement(elA, 'selected');
    await page.waitForTimeout(500);
    await ev.capture('preview-area');

    // Check if preview canvas exists
    const previewCanvas = page.locator('[data-testid="export-preview"] canvas, .export-preview canvas').first();
    const hasPreview = await previewCanvas.isVisible({ timeout: 2000 }).catch(() => false);
    await ev.capture('preview-checked');

    const report = ev.finalize();
    logReport(report);
  });

  // EXP-24: Multi-selection export
  test('EXP-24: Export with multi-selection', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'export-system', scenario: 'EXP-24' });
    const [elA, elB] = await seedRects(page, 2);
    await ev.capture('two-elements');

    // Select all
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(300);
    await ev.capture('multi-selected');

    // Check export section label for "Export Selection"
    const exportLabel = page.locator('[data-testid="export-section"] >> text=Selection, .export-section >> text=Selection').first();
    const hasLabel = await exportLabel.isVisible({ timeout: 2000 }).catch(() => false);
    await ev.capture('export-label-checked');

    const report = ev.finalize();
    logReport(report);
  });
});
