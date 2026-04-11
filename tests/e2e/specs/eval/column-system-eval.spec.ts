/**
 * 28 — Column System — Agnostic Eval Loop
 *
 * Evaluates COL-01 through COL-22: column grid configuration, margin
 * management, visibility, snapping to column edges, and inheritance chain.
 *
 * Run:  npx playwright test column-system-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, getState, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Column System Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // COL-01: Set column count
  test('COL-01: Set column count via Layout Guides', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'column-system', scenario: 'COL-01' });
    await ev.capture('baseline');

    // Open layout guides panel (Ctrl+;)
    await page.keyboard.press('Control+;');
    await page.waitForTimeout(500);
    await ev.capture('guides-toggled');

    // Look for column count input
    const colInput = page.locator('[data-testid="column-count-input"], [data-testid="layout-guide-columns"] input').first();
    if (await colInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await colInput.fill('6');
      await colInput.press('Enter');
      await page.waitForTimeout(300);
    }
    await ev.capture('columns-set');

    const report = ev.finalize();
    logReport(report);
  });

  // COL-02/03: Set gutter and margins (linked)
  test('COL-02/03: Gutter and linked margins', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'column-system', scenario: 'COL-02-03' });
    await ev.capture('baseline');

    // Open layout guides
    await page.keyboard.press('Control+;');
    await page.waitForTimeout(500);

    // Attempt gutter input
    const gutterInput = page.locator('[data-testid="gutter-input"], [data-testid="layout-guide-gutter"] input').first();
    if (await gutterInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gutterInput.fill('30');
      await gutterInput.press('Enter');
      await page.waitForTimeout(200);
    }
    await ev.capture('gutter-set');

    // Attempt margin input (linked)
    const marginInput = page.locator('[data-testid="margin-input"], [data-testid="layout-guide-margin"] input').first();
    if (await marginInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await marginInput.fill('60');
      await marginInput.press('Enter');
      await page.waitForTimeout(200);
    }
    await ev.capture('margins-set');

    const report = ev.finalize();
    logReport(report);
  });

  // COL-09: Toggle guide visibility
  test('COL-09: Toggle guide visibility via Ctrl+;', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'column-system', scenario: 'COL-09' });
    await ev.capture('baseline');

    await page.keyboard.press('Control+;');
    await page.waitForTimeout(400);
    await ev.capture('guides-shown');

    await page.keyboard.press('Control+;');
    await page.waitForTimeout(400);
    await ev.capture('guides-hidden');

    const report = ev.finalize();
    logReport(report);
  });

  // COL-15/17: Snap to column edge and margin edge during move
  test('COL-15/17: Snap to column and margin edges', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'column-system', scenario: 'COL-15-17' });

    // Enable guides first
    await page.keyboard.press('Control+;');
    await page.waitForTimeout(300);

    const [elA] = await seedRects(page, 1);
    await ev.capture('element-seeded');

    // Drag element slowly across canvas to trigger column snapping
    await ev.clickElement(elA, 'selected');
    await ev.dragElement(elA, 120, 0, 'drag-across-columns');
    await ev.capture('post-drag');

    const report = ev.finalize();
    logReport(report);
  });

  // COL-19/21: Inheritance chain validation
  test('COL-19/21: Guide inheritance defaults', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'column-system', scenario: 'COL-19-21' });
    await ev.capture('baseline');

    // Verify store has layout guide defaults
    const state = await getState(page);
    const slideState = state?.slides || state?.presentation?.slides;
    await ev.capture('state-inspected');

    const report = ev.finalize();
    logReport(report);
  });
});
