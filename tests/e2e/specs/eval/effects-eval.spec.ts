/**
 * 16 — Effects System — Agnostic Eval Loop
 *
 * Evaluates EFX-01 through EFX-25: adding shadows/blurs, editing effect properties,
 * toggling visibility, reordering, and switching effect types.
 *
 * Run:  npx playwright test effects-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Effects System Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // EFX-01: Add drop shadow
  test('EFX-01: Add drop shadow', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'effects', scenario: 'EFX-01' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const addEffectBtn = page.locator('[data-testid="add-effect"], [data-testid="effect-add-btn"]').first();
    if (await addEffectBtn.isVisible()) {
      await addEffectBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('post-add-shadow');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // EFX-05: Delete effect
  test('EFX-05: Delete effect', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'effects', scenario: 'EFX-05' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const addBtn = page.locator('[data-testid="add-effect"], [data-testid="effect-add-btn"]').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('effect-added');
    }

    const delBtn = page.locator('[data-testid="effect-delete-btn"], .effect-layer .delete-btn').first();
    if (await delBtn.isVisible()) {
      await delBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('post-delete-effect');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // EFX-06: Toggle effect visibility
  test('EFX-06: Toggle effect visibility', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'effects', scenario: 'EFX-06' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const addBtn = page.locator('[data-testid="add-effect"], [data-testid="effect-add-btn"]').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(200);
    }

    const visToggle = page.locator('[data-testid="effect-visibility-toggle"], .effect-layer .visibility-toggle').first();
    if (await visToggle.isVisible()) {
      await visToggle.click();
      await page.waitForTimeout(200);
      await ev.capture('post-hide-effect');

      await visToggle.click();
      await page.waitForTimeout(200);
      await ev.capture('post-show-effect');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // EFX-12..14: Shadow offset and blur
  test('EFX-12..14: Set shadow offset and blur', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'effects', scenario: 'EFX-12-14' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const addBtn = page.locator('[data-testid="add-effect"], [data-testid="effect-add-btn"]').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(200);
    }

    // Set X offset
    const xInput = page.locator('[data-testid="effect-x-input"] input, .effect-layer [data-testid="shadow-x"] input').first();
    if (await xInput.isVisible()) {
      await xInput.fill('10');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-set-shadow-x');
    }

    // Set blur
    const blurInput = page.locator('[data-testid="effect-blur-input"] input, .effect-layer [data-testid="shadow-blur"] input').first();
    if (await blurInput.isVisible()) {
      await blurInput.fill('20');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-set-shadow-blur');
    }

    const report = ev.finalize();
    logReport(report);
  });
});
