/**
 * 22 — Themes — Agnostic Eval Loop
 *
 * Evaluates THM-01 through THM-41: theme manager, 12-slot luma-locked palette,
 * harmony generation, light/dark mode, and theme cascade.
 *
 * Run:  npx playwright test themes-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Themes Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // THM-01: Open theme manager
  test('THM-01: Open theme manager', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'themes', scenario: 'THM-01' });
    await ev.capture('baseline');

    // Open theme manager panel (Ctrl+Shift+T or via menu)
    const themeBtn = page.locator('[data-testid="color-theme-btn"], [data-testid="open-theme-manager"]').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);
      await ev.capture('theme-manager-open');
    } else {
      await page.keyboard.press('Control+Shift+t');
      await page.waitForTimeout(300);
      await ev.capture('theme-manager-open');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // THM-03: Create new theme
  test('THM-03: Create new theme', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'themes', scenario: 'THM-03' });

    const themeBtn = page.locator('[data-testid="color-theme-btn"], [data-testid="open-theme-manager"]').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);
    }

    const addThemeBtn = page.locator('[data-testid="add-theme"], [data-testid="create-new-theme"]').first();
    if (await addThemeBtn.isVisible()) {
      await addThemeBtn.click();
      await page.waitForTimeout(300);
      await ev.capture('post-create-theme');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // THM-33/34: Set light/dark mode
  test('THM-33/34: Toggle light/dark mode', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'themes', scenario: 'THM-33-34' });
    await ev.capture('baseline');

    const themeBtn = page.locator('[data-testid="color-theme-btn"], [data-testid="open-theme-manager"]').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);
    }

    // Toggle to light mode
    const lightBtn = page.locator('[data-testid="theme-mode-light"], [data-mode="light"]').first();
    if (await lightBtn.isVisible()) {
      await lightBtn.click();
      await page.waitForTimeout(300);
      await ev.capture('post-light-mode');
    }

    // Toggle to dark mode
    const darkBtn = page.locator('[data-testid="theme-mode-dark"], [data-mode="dark"]').first();
    if (await darkBtn.isVisible()) {
      await darkBtn.click();
      await page.waitForTimeout(300);
      await ev.capture('post-dark-mode');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // THM-24..30: Harmony generation
  test('THM-24..30: Harmony generation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'themes', scenario: 'THM-24-30' });

    const themeBtn = page.locator('[data-testid="color-theme-btn"], [data-testid="open-theme-manager"]').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);
    }

    const harmonySelect = page.locator('[data-testid="harmony-select"], [data-testid="harmony-mode"]').first();
    if (await harmonySelect.isVisible()) {
      await harmonySelect.click();
      await page.waitForTimeout(200);
      const analogous = page.locator('[data-harmony="analogous"], [data-testid="harmony-analogous"]').first();
      if (await analogous.isVisible()) {
        await analogous.click();
        await page.waitForTimeout(300);
        await ev.capture('post-analogous-harmony');
      }
    }

    const report = ev.finalize();
    logReport(report);
  });
});
