/**
 * 20 — Slide Management — Agnostic Eval Loop
 * Evaluates SLD-01..22. Uses correct store actions (ADD_SLIDE, DELETE_SLIDE, DUPLICATE_SLIDE, UPDATE_SLIDE).
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('Slide Management Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('SLD-01..04: Add and duplicate slides', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-mgmt', scenario: 'SLD-01-04' });
    await ev.capture('baseline');
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300); await ev.capture('post-add');
    await ev.dispatch('DUPLICATE_SLIDE');
    await page.waitForTimeout(300); await ev.capture('post-duplicate');
    logReport(ev.finalize());
  });

  test('SLD-05..08: Delete and reorder', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-mgmt', scenario: 'SLD-05-08' });
    await ev.dispatch('ADD_SLIDE');
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300); await ev.capture('three-slides');
    await ev.dispatch('DELETE_SLIDE');
    await page.waitForTimeout(300); await ev.capture('post-delete');
    logReport(ev.finalize());
  });

  test('SLD-09..14: Slide navigation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-mgmt', scenario: 'SLD-09-14' });
    await ev.dispatch('ADD_SLIDE');
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300); await ev.capture('baseline');
    await ev.pressKey('PageDown', 'next-slide');
    await ev.pressKey('PageUp', 'prev-slide');
    logReport(ev.finalize());
  });

  test('SLD-15..18: Layout change', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-mgmt', scenario: 'SLD-15-18' });
    await ev.capture('baseline');
    // Use UPDATE_SLIDE with correct slide ID
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const state = store.getState();
      store.dispatch('UPDATE_SLIDE', { id: state.editor.activeSlideId, layoutId: 'blank' });
    });
    await page.waitForTimeout(300); await ev.capture('post-layout');
    logReport(ev.finalize());
  });

  test('SLD-19..22: Slide clipboard', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-mgmt', scenario: 'SLD-19-22' });
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300); await ev.capture('baseline');
    await ev.dispatch('DUPLICATE_SLIDE');
    await page.waitForTimeout(300); await ev.capture('post-duplicate');
    logReport(ev.finalize());
  });
});
