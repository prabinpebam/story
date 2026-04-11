/**
 * 27 — Collaboration — Agnostic Eval Loop
 * Evaluates COL-01..26. Triggers via dispatch.
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('Collaboration Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('COL-01..10: Presence and cursors', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'collaboration', scenario: 'COL-01-10' });
    await ev.capture('baseline');
    logReport(ev.finalize());
  });

  test('COL-11..20: Real-time sync', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'collaboration', scenario: 'COL-11-20' });
    await ev.capture('baseline');
    logReport(ev.finalize());
  });

  test('COL-21..26: Conflict resolution', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'collaboration', scenario: 'COL-21-26' });
    await ev.capture('baseline');
    logReport(ev.finalize());
  });
});
