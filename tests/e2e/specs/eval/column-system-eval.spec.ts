/**
 * 28 — Column System — Agnostic Eval Loop
 * Evaluates COL-01..22 (column-specific). Triggers via dispatch.
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('Column System Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('COL-01..08: Column count and gutter', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'column-system', scenario: 'COL-01-08' });
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_COLUMNS', { count: 3, gutter: 16 });
    await page.waitForTimeout(200); await ev.capture('3-columns');
    await ev.dispatch('UPDATE_COLUMNS', { count: 1, gutter: 0 });
    await page.waitForTimeout(200); await ev.capture('1-column');
    logReport(ev.finalize());
  });

  test('COL-09..15: Margin settings', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'column-system', scenario: 'COL-09-15' });
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_MARGINS', { top: 48, right: 48, bottom: 48, left: 48 });
    await page.waitForTimeout(200); await ev.capture('uniform-margins');
    logReport(ev.finalize());
  });

  test('COL-16..22: Guide rendering and snapping', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'column-system', scenario: 'COL-16-22' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    // Drag toward column edge for snap
    await ev.dragElement(elA, -50, 0, 'post-drag-snap');
    logReport(ev.finalize());
  });
});
