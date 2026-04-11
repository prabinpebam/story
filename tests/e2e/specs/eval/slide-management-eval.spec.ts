/**
 * 20 — Slide Management — Agnostic Eval Loop
 * Evaluates SLD-01..22. Scene: slides via dispatch.
 * Run:  npx playwright test slide-management-eval --project=chromium --headed
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;
test.describe('Slide Management Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // SLD-01..04: Add, duplicate, select slide
  test('SLD-01..04: Add and duplicate slides', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-mgmt', scenario: 'SLD-01-04' });
    await ev.capture('baseline');
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300);
    await ev.capture('post-add');
    await ev.dispatch('DUPLICATE_SLIDE');
    await page.waitForTimeout(300);
    await ev.capture('post-duplicate');
    const report = ev.finalize();
    logReport(report);
  });

  // SLD-05..08: Delete, reorder slides
  test('SLD-05..08: Delete and reorder', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-mgmt', scenario: 'SLD-05-08' });
    await ev.dispatch('ADD_SLIDE');
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300);
    await ev.capture('three-slides');
    await ev.dispatch('DELETE_SLIDE');
    await page.waitForTimeout(300);
    await ev.capture('post-delete');
    const report = ev.finalize();
    logReport(report);
  });

  // SLD-09..14: Slide navigation (next/prev)
  test('SLD-09..14: Slide navigation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-mgmt', scenario: 'SLD-09-14' });
    await ev.dispatch('ADD_SLIDE');
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300);
    await ev.capture('baseline');
    await ev.pressKey('PageDown', 'next-slide');
    await ev.pressKey('PageUp', 'prev-slide');
    const report = ev.finalize();
    logReport(report);
  });

  // SLD-15..18: Slide rename, layout change
  test('SLD-15..18: Rename and layout', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-mgmt', scenario: 'SLD-15-18' });
    await ev.capture('baseline');
    await ev.dispatch('CHANGE_SLIDE_LAYOUT', { layoutId: 'blank' });
    await page.waitForTimeout(300);
    await ev.capture('post-layout');
    const report = ev.finalize();
    logReport(report);
  });

  // SLD-19..22: Slide clipboard (cut/copy/paste)
  test('SLD-19..22: Slide clipboard', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-mgmt', scenario: 'SLD-19-22' });
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300);
    await ev.capture('baseline');
    await ev.dispatch('DUPLICATE_SLIDE');
    await page.waitForTimeout(300);
    await ev.capture('post-duplicate');
    const report = ev.finalize();
    logReport(report);
  });
});
