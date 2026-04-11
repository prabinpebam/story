/**
 * 26 — AI Features — Agnostic Eval Loop
 *
 * Evaluates AI-01 through AI-10: provider config, code fill generation,
 * prompt refinement, and AI-powered content suggestions.
 *
 * Run:  npx playwright test ai-features-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('AI Features Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // AI-04: Generate code fill
  test('AI-04: Open code fill panel', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'ai-features', scenario: 'AI-04' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    // Open fill flyout and switch to code fill
    const swatch = page.locator('[data-testid="fill-color-swatch"], .fill-layer .color-swatch').first();
    if (await swatch.isVisible()) {
      await swatch.click();
      await page.waitForTimeout(300);

      const codeTab = page.locator('[data-testid="fill-type-code"], [data-fill-type="code"]').first();
      if (await codeTab.isVisible()) {
        await codeTab.click();
        await page.waitForTimeout(200);
        await ev.capture('code-fill-panel');
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    const report = ev.finalize();
    logReport(report);
  });

  // AI-06: Refine prompt toggle
  test('AI-06: Toggle refine prompt', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'ai-features', scenario: 'AI-06' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const swatch = page.locator('[data-testid="fill-color-swatch"], .fill-layer .color-swatch').first();
    if (await swatch.isVisible()) {
      await swatch.click();
      await page.waitForTimeout(300);

      const codeTab = page.locator('[data-testid="fill-type-code"], [data-fill-type="code"]').first();
      if (await codeTab.isVisible()) {
        await codeTab.click();
        await page.waitForTimeout(200);
      }

      const refineToggle = page.locator('[data-testid="refine-prompt-toggle"]').first();
      if (await refineToggle.isVisible()) {
        await refineToggle.click();
        await page.waitForTimeout(200);
        await ev.capture('refine-enabled');

        await refineToggle.click();
        await page.waitForTimeout(200);
        await ev.capture('refine-disabled');
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }

    const report = ev.finalize();
    logReport(report);
  });
});
