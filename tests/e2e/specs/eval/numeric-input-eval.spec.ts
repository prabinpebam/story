/**
 * 12 — Numeric Input — Agnostic Eval Loop
 *
 * Evaluates NUM-01 through NUM-24: focus, commit, revert, scrub mode,
 * keyboard increment/decrement, mixed state, and clamping.
 *
 * Run:  npx playwright test numeric-input-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Numeric Input Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // NUM-01/02: Focus and commit value on Enter
  test('NUM-01/02: Focus input and commit on Enter', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'numeric-input', scenario: 'NUM-01-02' });
    const [elA] = await seedRects(page, 1, { width: 120, height: 80 });
    await ev.clickElement(elA, 'selected');

    const xInput = page.locator('[data-testid="position-x"] input, [data-testid="element-x"] input').first();
    if (await xInput.isVisible()) {
      await xInput.click();
      await page.waitForTimeout(100);
      await ev.capture('input-focused');

      await xInput.fill('300');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await ev.capture('post-commit-enter');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // NUM-03: Commit value on blur
  test('NUM-03: Commit value on blur', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'numeric-input', scenario: 'NUM-03' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const xInput = page.locator('[data-testid="position-x"] input, [data-testid="element-x"] input').first();
    if (await xInput.isVisible()) {
      await xInput.fill('400');
      // Blur by clicking elsewhere
      await page.locator('[data-testid="property-inspector"]').click();
      await page.waitForTimeout(200);
      await ev.capture('post-commit-blur');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // NUM-04: Revert on Escape
  test('NUM-04: Revert on Escape', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'numeric-input', scenario: 'NUM-04' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('selected-baseline');

    const xInput = page.locator('[data-testid="position-x"] input, [data-testid="element-x"] input').first();
    if (await xInput.isVisible()) {
      await xInput.fill('999');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      await ev.capture('post-revert-escape');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // NUM-13/14: Increment and decrement by 1
  test('NUM-13/14: Arrow key increment/decrement', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'numeric-input', scenario: 'NUM-13-14' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const xInput = page.locator('[data-testid="position-x"] input, [data-testid="element-x"] input').first();
    if (await xInput.isVisible()) {
      await xInput.click();
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(100);
      await ev.capture('post-increment');

      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
      await ev.capture('post-decrement');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // NUM-15/16: Increment/decrement by 10 (Shift+Arrow)
  test('NUM-15/16: Shift+Arrow step by 10', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'numeric-input', scenario: 'NUM-15-16' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const xInput = page.locator('[data-testid="position-x"] input, [data-testid="element-x"] input').first();
    if (await xInput.isVisible()) {
      await xInput.click();
      await page.waitForTimeout(100);
      await page.keyboard.press('Shift+ArrowUp');
      await page.waitForTimeout(100);
      await ev.capture('post-shift-increment');

      await page.keyboard.press('Shift+ArrowDown');
      await page.waitForTimeout(100);
      await ev.capture('post-shift-decrement');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // NUM-06..11: Scrub mode
  test('NUM-06..11: Scrub mode via mouse drag', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'numeric-input', scenario: 'NUM-06-11' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const xInput = page.locator('[data-testid="position-x"] input, [data-testid="element-x"] input').first();
    if (await xInput.isVisible()) {
      const box = await xInput.boundingBox();
      if (box) {
        // Start scrub: mousedown + move
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 10 });
        await ev.capture('mid-scrub');
        await page.mouse.up();
        await page.waitForTimeout(200);
        await ev.capture('post-scrub');
      }
    }

    const report = ev.finalize();
    logReport(report);
  });
});
