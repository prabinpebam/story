/**
 * 23 — Transitions — Agnostic Eval Loop
 * Evaluates TRN-01..23. Triggers via dispatch.
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('Transitions Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('TRN-01..08: Transition type selection', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'transitions', scenario: 'TRN-01-08' });
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_SLIDE', { transition: { type: 'fade', duration: 500 } });
    await page.waitForTimeout(200); await ev.capture('post-fade');
    await ev.dispatch('UPDATE_SLIDE', { transition: { type: 'slide', duration: 500, direction: 'left' } });
    await page.waitForTimeout(200); await ev.capture('post-slide');
    await ev.dispatch('UPDATE_SLIDE', { transition: { type: 'none' } });
    await page.waitForTimeout(200); await ev.capture('post-none');
    logReport(ev.finalize());
  });

  test('TRN-09..15: Transition properties', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'transitions', scenario: 'TRN-09-15' });
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_SLIDE', { transition: { type: 'fade', duration: 1000 } });
    await page.waitForTimeout(200); await ev.capture('duration-1000');
    await ev.dispatch('UPDATE_SLIDE', { transition: { type: 'fade', duration: 300 } });
    await page.waitForTimeout(200); await ev.capture('duration-300');
    logReport(ev.finalize());
  });

  test('TRN-16..23: Direction and preview', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'transitions', scenario: 'TRN-16-23' });
    await ev.capture('baseline');
    for (const dir of ['left', 'right', 'up', 'down']) {
      await ev.dispatch('UPDATE_SLIDE', { transition: { type: 'slide', direction: dir, duration: 500 } });
      await page.waitForTimeout(150);
    }
    await ev.capture('post-directions');
    logReport(ev.finalize());
  });
});
