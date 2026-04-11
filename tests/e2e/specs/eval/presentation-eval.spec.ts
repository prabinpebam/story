/**
 * 25 — Presentation Mode — Agnostic Eval Loop
 * Evaluates PRS-01..50. Uses SET_MODE (not SET_EDITOR_MODE).
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('Presentation Mode Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('PRS-01..10: Enter and exit presentation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'presentation', scenario: 'PRS-01-10' });
    await seedRects(page, 1);
    await ev.capture('edit-mode');
    await ev.dispatch('SET_MODE', 'presentation');
    await page.waitForTimeout(500); await ev.capture('presentation-mode');
    await ev.pressKey('Escape', 'post-exit');
    logReport(ev.finalize());
  });

  test('PRS-11..20: Slide navigation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'presentation', scenario: 'PRS-11-20' });
    await ev.dispatch('ADD_SLIDE');
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300);
    await ev.dispatch('SET_MODE', 'presentation');
    await page.waitForTimeout(500); await ev.capture('in-presentation');
    await ev.pressKey('ArrowRight', 'next');
    await ev.pressKey('ArrowLeft', 'prev');
    await ev.pressKey('Escape', 'exit');
    logReport(ev.finalize());
  });

  test('PRS-21..30: Presentation rendering', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'presentation', scenario: 'PRS-21-30' });
    await seedRects(page, 2);
    await ev.capture('pre-present');
    await ev.dispatch('SET_MODE', 'presentation');
    await page.waitForTimeout(500); await ev.capture('presenting');
    await ev.pressKey('Escape', 'exit');
    logReport(ev.finalize());
  });

  test('PRS-31..40: Keyboard controls', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'presentation', scenario: 'PRS-31-40' });
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300);
    await ev.dispatch('SET_MODE', 'presentation');
    await page.waitForTimeout(500); await ev.capture('baseline');
    await ev.pressKey('Space', 'next-via-space');
    await ev.pressKey('Escape', 'exit');
    logReport(ev.finalize());
  });

  test('PRS-41..50: Fullscreen, viewport, gating, ARIA', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'presentation', scenario: 'PRS-41-50' });
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300);
    await ev.capture('baseline');
    await ev.dispatch('SET_MODE', 'presentation');
    await page.waitForTimeout(500); await ev.capture('presentation');
    await ev.pressKey('ArrowRight', 'navigate');
    await ev.pressKey('Escape', 'exit');
    logReport(ev.finalize());
  });
});
