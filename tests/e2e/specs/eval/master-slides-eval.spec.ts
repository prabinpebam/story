/**
 * 21 — Master Slides & Layouts — Agnostic Eval Loop
 * Evaluates MST-01..30. Triggers via dispatch.
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

  // MST-01..10: Master mode entry/exit
  test('MST-01..10: Master mode toggle', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'master-slides', scenario: 'MST-01-10' });
    await ev.capture('edit-mode');
    await ev.dispatch('SET_EDITOR_MODE', 'master');
    await page.waitForTimeout(300);
    await ev.capture('master-mode');
    await ev.dispatch('SET_EDITOR_MODE', 'edit');
    await page.waitForTimeout(300);
    await ev.capture('back-to-edit');
    const report = ev.finalize();
    logReport(report);
  });

  // MST-11..20: Layout management
  test('MST-11..20: Layout operations', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'master-slides', scenario: 'MST-11-20' });
    await ev.capture('baseline');
    await ev.dispatch('CHANGE_SLIDE_LAYOUT', { layoutId: 'blank' });
    await page.waitForTimeout(300);
    await ev.capture('blank-layout');
    const report = ev.finalize();
    logReport(report);
  });

  // MST-21..30: Placeholder management, inheritance
  test('MST-21..30: Placeholders and inheritance', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'master-slides', scenario: 'MST-21-30' });
    await ev.capture('baseline');
    // Check for placeholder elements
    const phCount = await page.evaluate(() =>
      document.querySelectorAll('#slide-content .slide-element[data-is-placeholder="true"]').length
    );
    await ev.capture(`placeholders-${phCount}`);
    const report = ev.finalize();
    logReport(report);
  });
});
