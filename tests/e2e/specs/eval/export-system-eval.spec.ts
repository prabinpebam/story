/**
 * 32 — Export System — Agnostic Eval Loop
 * Evaluates EXP-01..33. Triggers via dispatch.
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('Export System Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('EXP-01..10: Export formats', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'export', scenario: 'EXP-01-10' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    logReport(ev.finalize());
  });

  test('EXP-11..20: Export quality and scale', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'export', scenario: 'EXP-11-20' });
    await ev.capture('baseline');
    logReport(ev.finalize());
  });

  test('EXP-21..33: Export presets and batch', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'export', scenario: 'EXP-21-33' });
    await ev.capture('baseline');
    logReport(ev.finalize());
  });
});
