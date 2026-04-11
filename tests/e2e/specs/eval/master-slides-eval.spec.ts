/**
 * 21 — Master Slides & Layouts — Agnostic Eval Loop
 * Evaluates MST-01..30. Uses SET_MODE (not SET_EDITOR_MODE).
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('Master Slides & Layouts Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('MST-01..10: Master mode toggle', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'master-slides', scenario: 'MST-01-10' });
    await ev.capture('edit-mode');
    await ev.dispatch('SET_MODE', 'master');
    await page.waitForTimeout(300); await ev.capture('master-mode');
    await ev.dispatch('SET_MODE', 'edit');
    await page.waitForTimeout(300); await ev.capture('back-to-edit');
    logReport(ev.finalize());
  });

  test('MST-11..20: Layout operations', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'master-slides', scenario: 'MST-11-20' });
    await ev.capture('baseline');
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const state = store.getState();
      store.dispatch('UPDATE_SLIDE', { id: state.editor.activeSlideId, layoutId: 'blank' });
    });
    await page.waitForTimeout(300); await ev.capture('blank-layout');
    logReport(ev.finalize());
  });

  test('MST-21..30: Placeholders and inheritance', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'master-slides', scenario: 'MST-21-30' });
    await ev.capture('baseline');
    const phCount = await page.evaluate(() =>
      document.querySelectorAll('#slide-content .slide-element[data-is-placeholder="true"]').length
    );
    await ev.capture(`placeholders-${phCount}`);
    logReport(ev.finalize());
  });
});
