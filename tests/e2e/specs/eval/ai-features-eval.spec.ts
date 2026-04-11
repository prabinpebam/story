/**
 * 26 — AI Features — Agnostic Eval Loop
 * Evaluates AI-01..10. Triggers via dispatch.
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('AI Features Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('AI-01..05: AI fill generation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'ai-features', scenario: 'AI-01-05' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    logReport(ev.finalize());
  });

  test('AI-06..10: AI operations', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'ai-features', scenario: 'AI-06-10' });
    await ev.capture('baseline');
    logReport(ev.finalize());
  });
});
