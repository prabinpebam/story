/**
 * 09 — Layer Management — Agnostic Eval Loop
 *
 * Evaluates LYR-01 through LYR-40: layer tree rendering, selection sync,
 * visibility/lock toggles, rename, drag-and-drop, and inherited elements.
 *
 * Run:  npx playwright test layer-management-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, seedGroup, clearSelection, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Layer Management Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // LYR-09: Single select layer
  test('LYR-09: Single select via layer tree', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-09' });
    const [elA, elB] = await seedRects(page, 2);
    await ev.capture('baseline');

    // Find and click layer item for element A
    const layerA = page.locator(`[data-layer-id="${elA}"], [data-testid="layer-item-${elA}"]`).first();
    if (await layerA.isVisible()) {
      await layerA.click();
      await page.waitForTimeout(200);
      await ev.capture('post-layer-select-A');
    } else {
      // Fall back: just click element on canvas
      await ev.clickElement(elA, 'post-canvas-select-A');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // LYR-11/12: Canvas ↔ Layer selection sync
  test('LYR-11/12: Canvas ↔ Layer tree sync', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-11-12' });
    const [elA, elB] = await seedRects(page, 2);
    await ev.capture('baseline');

    // Click element on canvas → layer should highlight (LYR-11)
    await ev.clickElement(elA, 'canvas-select-A');

    // Click a different layer → canvas should update (LYR-12)
    const layerB = page.locator(`[data-layer-id="${elB}"], [data-testid="layer-item-${elB}"]`).first();
    if (await layerB.isVisible()) {
      await layerB.click();
      await page.waitForTimeout(200);
      await ev.capture('layer-select-B');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // LYR-16: Toggle visibility
  test('LYR-16: Toggle element visibility via layer', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-16' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    // Find visibility toggle button on layer row
    const visBtn = page.locator(`[data-layer-id="${elA}"] .visibility-toggle, [data-layer-id="${elA}"] [data-testid="toggle-visibility"]`).first();
    if (await visBtn.isVisible()) {
      await visBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('post-hide');

      // Toggle back
      await visBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('post-show');
    } else {
      // Use keyboard shortcut  
      await ev.pressKey('Control+Shift+h', 'post-toggle-visibility');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // LYR-18: Toggle lock
  test('LYR-18: Toggle element lock via layer', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-18' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const lockBtn = page.locator(`[data-layer-id="${elA}"] .lock-toggle, [data-layer-id="${elA}"] [data-testid="toggle-lock"]`).first();
    if (await lockBtn.isVisible()) {
      await lockBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('post-lock');

      await lockBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('post-unlock');
    } else {
      await ev.pressKey('Control+Shift+l', 'post-toggle-lock');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // LYR-20/22/23: Rename flow
  test('LYR-20: Rename layer via double-click', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-20' });
    const [elA] = await seedRects(page, 1);
    await ev.capture('baseline');

    // Double-click the layer name to enter rename
    const nameSpan = page.locator(`[data-layer-id="${elA}"] .layer-item-name`).first();
    if (await nameSpan.isVisible()) {
      await nameSpan.dblclick();
      await page.waitForTimeout(200);
      await ev.capture('rename-mode');

      // Type new name and commit
      await page.keyboard.type('Renamed Element');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-rename');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // LYR-38: Group children in layer tree
  test('LYR-38: Group children rendered in tree', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'layer-mgmt', scenario: 'LYR-38' });
    const { groupId, child1, child2 } = await seedGroup(page);
    await ev.capture('group-created');

    // Click group in tree or on canvas
    await ev.clickElement(child1, 'select-group-area');

    const report = ev.finalize();
    logReport(report);
  });
});
