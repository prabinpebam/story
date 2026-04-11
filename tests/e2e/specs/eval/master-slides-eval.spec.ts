/**
 * 21 — Master Slides & Layouts — Agnostic Eval Loop
 *
 * Evaluates MST-01 through MST-30: master list, editing, layout management,
 * placeholder additions, guide inheritance, presets, and style cascade.
 *
 * Run:  npx playwright test master-slides-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Master Slides & Layouts Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // MST-04: Enter master edit mode
  test('MST-04: Enter master edit mode', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'master-slides', scenario: 'MST-04' });
    await ev.capture('edit-mode-baseline');

    await editor.editMaster();
    await page.waitForTimeout(500);
    await ev.capture('post-enter-master-mode');

    await editor.closeMaster();
    await page.waitForTimeout(500);
    await ev.capture('post-exit-master-mode');

    const report = ev.finalize();
    logReport(report);
  });

  // MST-06: Edit master name
  test('MST-06: Edit master name', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'master-slides', scenario: 'MST-06' });

    await editor.editMaster();
    await page.waitForTimeout(500);
    await ev.capture('in-master-mode');

    const nameInput = page.locator('[data-testid="master-name-input"] input').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Custom Master');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-rename-master');
    }

    await editor.closeMaster();
    await page.waitForTimeout(300);

    const report = ev.finalize();
    logReport(report);
  });

  // MST-13: Add element to master
  test('MST-13: Add element to master', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'master-slides', scenario: 'MST-13' });

    await editor.editMaster();
    await page.waitForTimeout(500);
    await ev.capture('master-mode');

    // Create a rect on master
    await page.keyboard.press('r');
    await page.waitForTimeout(200);
    const box = await page.locator('#canvas-container').boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(300);
    }
    await ev.capture('post-add-to-master');

    await editor.closeMaster();
    await page.waitForTimeout(500);
    await ev.capture('back-in-edit-mode');

    const report = ev.finalize();
    logReport(report);
  });

  // MST-22/23: Open preset picker and apply
  test('MST-22/23: Apply layout preset', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'master-slides', scenario: 'MST-22-23' });

    await editor.editMaster();
    await page.waitForTimeout(500);

    const presetPicker = page.locator('[data-testid="layout-preset-picker"]').first();
    if (await presetPicker.isVisible()) {
      await presetPicker.click();
      await page.waitForTimeout(300);
      await ev.capture('preset-picker-open');

      const firstPreset = page.locator('[data-testid="layout-preset-option"]').first();
      if (await firstPreset.isVisible()) {
        await firstPreset.click();
        await page.waitForTimeout(300);
        await ev.capture('post-apply-preset');
      }
    }

    await editor.closeMaster();
    await page.waitForTimeout(300);

    const report = ev.finalize();
    logReport(report);
  });
});
