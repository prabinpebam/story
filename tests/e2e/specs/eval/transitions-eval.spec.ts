import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { logReport } from '../../helpers/eval-seeders';

async function updateSlide(page: import('@playwright/test').Page, props: Record<string, unknown>) {
  await page.evaluate((p) => {
    const store = (window as any).__TEST_STORE__;
    store.dispatch('UPDATE_SLIDE', { id: store.getState().editor.activeSlideId, ...p });
  }, props);
  await page.waitForTimeout(200);
}

let editor: EditorPage;
test.describe('Transitions Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('TRN-01..08: Transition types', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'transitions', scenario: 'TRN-01-08' });
    await ev.capture('baseline');
    await updateSlide(page, { transition: { type: 'fade', duration: 500 } });
    await ev.capture('fade');
    await updateSlide(page, { transition: { type: 'slide', duration: 500, direction: 'left' } });
    await ev.capture('slide-left');
    await updateSlide(page, { transition: { type: 'none' } });
    await ev.capture('none');
    logReport(ev.finalize());
  });

  test('TRN-09..15: Transition properties', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'transitions', scenario: 'TRN-09-15' });
    await ev.capture('baseline');
    await updateSlide(page, { transition: { type: 'fade', duration: 1000 } });
    await ev.capture('dur-1000');
    await updateSlide(page, { transition: { type: 'fade', duration: 300 } });
    await ev.capture('dur-300');
    logReport(ev.finalize());
  });

  test('TRN-16..23: Direction and preview', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'transitions', scenario: 'TRN-16-23' });
    await ev.capture('baseline');
    for (const dir of ['left', 'right', 'up', 'down']) {
      await updateSlide(page, { transition: { type: 'slide', direction: dir, duration: 500 } });
    }
    await ev.capture('directions-applied');
    logReport(ev.finalize());
  });
});