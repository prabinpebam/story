/**
 * 17 — Typography Styles — Agnostic Eval Loop
 *
 * Evaluates TYP-01 through TYP-43: text style application, font changes,
 * OpenType features, variable fonts, and inline formatting.
 *
 * Run:  npx playwright test typography-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedText, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Typography Styles Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // TYP-07: Change font family
  test('TYP-07: Change font family', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'typography', scenario: 'TYP-07' });
    const textId = await seedText(page, { content: 'Font family test' });
    await ev.clickElement(textId, 'selected');

    if (await editor.fontFamilySelect.isVisible()) {
      await editor.fontFamilySelect.click();
      await page.waitForTimeout(200);
      // Select a different font from dropdown
      const option = page.locator('.font-option, [data-testid="font-option"]').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(300);
      }
      await ev.capture('post-font-change');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // TYP-08: Change font weight
  test('TYP-08: Change font weight', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'typography', scenario: 'TYP-08' });
    const textId = await seedText(page, { content: 'Weight test' });
    await ev.clickElement(textId, 'selected');

    if (await editor.fontWeightSelect.isVisible()) {
      await editor.fontWeightSelect.click();
      await page.waitForTimeout(200);
      const boldOption = page.locator('[data-weight="700"], option[value="700"]').first();
      if (await boldOption.isVisible()) {
        await boldOption.click();
        await page.waitForTimeout(200);
      }
      await ev.capture('post-weight-change');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // TYP-09: Change font size
  test('TYP-09: Change font size', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'typography', scenario: 'TYP-09' });
    const textId = await seedText(page, { content: 'Size test', fontSize: 24 });
    await ev.clickElement(textId, 'selected');

    if (await editor.fontSizeInput.isVisible()) {
      await editor.fontSizeInput.fill('48');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-font-size-48');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // TYP-10: Set line height
  test('TYP-10: Set line height', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'typography', scenario: 'TYP-10' });
    const textId = await seedText(page, { content: 'Line height test' });
    await ev.clickElement(textId, 'selected');

    if (await editor.lineHeightInput.isVisible()) {
      await editor.lineHeightInput.fill('1.8');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-line-height-1.8');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // TYP-11: Set letter spacing
  test('TYP-11: Set letter spacing', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'typography', scenario: 'TYP-11' });
    const textId = await seedText(page, { content: 'Letter spacing' });
    await ev.clickElement(textId, 'selected');

    if (await editor.letterSpacingInput.isVisible()) {
      await editor.letterSpacingInput.fill('2');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-letter-spacing-2');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // TYP-13/14: Toggle underline and strikethrough
  test('TYP-13/14: Toggle underline and strikethrough', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'typography', scenario: 'TYP-13-14' });
    const textId = await seedText(page, { content: 'Decorations test' });
    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);

    await ev.pressKey('Control+u', 'post-underline');
    await ev.pressKey('Control+Shift+x', 'post-strikethrough');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TYP-01: Apply text style
  test('TYP-01: Apply text style from PI', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'typography', scenario: 'TYP-01' });
    const textId = await seedText(page, { content: 'Style test' });
    await ev.clickElement(textId, 'selected');

    const styleSelect = page.locator('[data-testid="text-style-select"]').first();
    if (await styleSelect.isVisible()) {
      await styleSelect.click();
      await page.waitForTimeout(200);
      const firstStyle = page.locator('[data-testid="text-style-option"]').first();
      if (await firstStyle.isVisible()) {
        await firstStyle.click();
        await page.waitForTimeout(200);
      }
      await ev.capture('post-apply-style');
    }

    const report = ev.finalize();
    logReport(report);
  });
});
