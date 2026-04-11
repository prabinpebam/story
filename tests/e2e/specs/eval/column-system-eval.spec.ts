/**
 * 28 — Column System — Agnostic Eval Loop
 * Evaluates COL-01..22. Column/margin updates are master-level properties,
 * use UPDATE_MASTER or direct store manipulation.
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
    // Column settings live on the master — update via layout guide toggle
    await ev.dispatch('TOGGLE_LAYOUT_GUIDES');
    await page.waitForTimeout(200); await ev.capture('guides-toggled');
    await ev.dispatch('TOGGLE_LAYOUT_GUIDES');
    await page.waitForTimeout(200); await ev.capture('guides-restored');
    logReport(ev.finalize());
  });

  test('COL-09..15: Margin settings', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'column-system', scenario: 'COL-09-15' });
    await ev.capture('baseline');
    // Toggle snap to columns
    await ev.dispatch('TOGGLE_SNAP_TO_COLUMNS');
    await page.waitForTimeout(200); await ev.capture('snap-toggled');
    await ev.dispatch('TOGGLE_SNAP_TO_COLUMNS');
    await page.waitForTimeout(200); await ev.capture('snap-restored');
    logReport(ev.finalize());
  });

  test('COL-16..22: Guide rendering and snapping', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'column-system', scenario: 'COL-16-22' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.dragElement(elA, -50, 0, 'post-drag');
    logReport(ev.finalize());
  });
});
