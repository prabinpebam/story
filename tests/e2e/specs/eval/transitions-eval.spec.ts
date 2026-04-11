/**
 * 23 — Transitions — Agnostic Eval Loop
 *
 * Evaluates TRN-01 through TRN-23: transition types, direction grids,
 * duration, cascade resolution, and morph matching.
 *
 * Run:  npx playwright test transitions-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Transitions Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // TRN-01..07: Set transition types
  test('TRN-01..07: Set transition types', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'transitions', scenario: 'TRN-01-07' });
    await ev.capture('baseline');

    // Open transition picker in PI
    const transBtn = page.locator('[data-testid="transition-picker"], [data-testid="open-transition"]').first();
    if (await transBtn.isVisible()) {
      await transBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('picker-open');

      // Try cross-fade
      const crossFade = page.locator('[data-transition="cross-fade"], [data-testid="transition-cross-fade"]').first();
      if (await crossFade.isVisible()) {
        await crossFade.click();
        await page.waitForTimeout(200);
        await ev.capture('post-cross-fade');
      }

      // Try wipe
      const wipe = page.locator('[data-transition="wipe"], [data-testid="transition-wipe"]').first();
      if (await wipe.isVisible()) {
        await wipe.click();
        await page.waitForTimeout(200);
        await ev.capture('post-wipe');
      }
    }

    const report = ev.finalize();
    logReport(report);
  });

  // TRN-12: Set transition duration
  test('TRN-12: Set transition duration', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'transitions', scenario: 'TRN-12' });
    await ev.capture('baseline');

    const durationInput = page.locator('[data-testid="transition-duration"] input').first();
    if (await durationInput.isVisible()) {
      await durationInput.fill('800');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-set-duration-800');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // TRN-11: Select direction
  test('TRN-11: Select transition direction', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'transitions', scenario: 'TRN-11' });

    // First set a directional transition
    const transBtn = page.locator('[data-testid="transition-picker"], [data-testid="open-transition"]').first();
    if (await transBtn.isVisible()) {
      await transBtn.click();
      await page.waitForTimeout(200);
      const wipe = page.locator('[data-transition="wipe"], [data-testid="transition-wipe"]').first();
      if (await wipe.isVisible()) {
        await wipe.click();
        await page.waitForTimeout(200);
      }
    }

    // Click a direction in the grid
    const directionCell = page.locator('[data-testid="direction-grid"] [data-direction], .direction-grid button').nth(2);
    if (await directionCell.isVisible()) {
      await directionCell.click();
      await page.waitForTimeout(200);
      await ev.capture('post-set-direction');
    }

    const report = ev.finalize();
    logReport(report);
  });
});
