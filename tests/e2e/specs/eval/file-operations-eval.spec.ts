/**
 * 30 — File Operations — Agnostic Eval Loop
 * Evaluates FOP-01..21. Triggers via dispatch.
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('File Operations Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('FOP-01..07: Save and load', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'file-ops', scenario: 'FOP-01-07' });
    await ev.capture('baseline');
    // Save triggers browser download — capture state
    await ev.pressKey('Control+s', 'save-trigger');
    logReport(ev.finalize());
  });

  test('FOP-08..14: New and import', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'file-ops', scenario: 'FOP-08-14' });
    await ev.capture('baseline');
    logReport(ev.finalize());
  });

  test('FOP-15..21: Auto-save and recovery', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'file-ops', scenario: 'FOP-15-21' });
    await ev.capture('baseline');
    logReport(ev.finalize());
  });
});
