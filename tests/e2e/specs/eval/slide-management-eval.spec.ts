import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { logReport } from '../../helpers/eval-seeders';

async function getActiveSlideId(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);
}

let editor: EditorPage;
test.describe('Slide Management Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('SLD-01..04: Add and duplicate', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-mgmt', scenario: 'SLD-01-04' });
    await ev.capture('baseline');
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300); await ev.capture('post-add');
    const sid = await getActiveSlideId(page);
    await ev.dispatch('DUPLICATE_SLIDE', sid);
    await page.waitForTimeout(300); await ev.capture('post-duplicate');
    logReport(ev.finalize());
  });

  test('SLD-05..08: Delete slide', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-mgmt', scenario: 'SLD-05-08' });
    await ev.dispatch('ADD_SLIDE');
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300); await ev.capture('three-slides');
    const sid = await getActiveSlideId(page);
    await ev.dispatch('DELETE_SLIDE', sid);
    await page.waitForTimeout(300); await ev.capture('post-delete');
    logReport(ev.finalize());
  });

  test('SLD-09..14: Slide navigation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-mgmt', scenario: 'SLD-09-14' });
    await ev.dispatch('ADD_SLIDE');
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300); await ev.capture('three-slides');
    const slideOrder = await page.evaluate(() => (window as any).__TEST_STORE__.getState().slideOrder);
    await ev.dispatch('SELECT_SLIDE', { slideId: slideOrder[0] });
    await page.waitForTimeout(200); await ev.capture('first-slide');
    await ev.dispatch('SELECT_SLIDE', { slideId: slideOrder[slideOrder.length - 1] });
    await page.waitForTimeout(200); await ev.capture('last-slide');
    logReport(ev.finalize());
  });

  test('SLD-15..18: Layout change', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-mgmt', scenario: 'SLD-15-18' });
    await ev.capture('baseline');
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('UPDATE_SLIDE', { id: store.getState().editor.activeSlideId, layoutId: 'blank' });
    });
    await page.waitForTimeout(300); await ev.capture('post-layout');
    logReport(ev.finalize());
  });

  test('SLD-19..22: Slide clipboard', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-mgmt', scenario: 'SLD-19-22' });
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300); await ev.capture('baseline');
    const sid = await getActiveSlideId(page);
    await ev.dispatch('DUPLICATE_SLIDE', sid);
    await page.waitForTimeout(300); await ev.capture('post-duplicate');
    logReport(ev.finalize());
  });
});