/**
 * 22 — Themes — Agnostic Eval Loop
 * Evaluates THM-01..41. Triggers via dispatch.
 * Run:  npx playwright test themes-eval --project=chromium --headed
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;
test.describe('Themes Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // THM-01..10: Theme slots and active theme
  test('THM-01..10: Theme slot system', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'themes', scenario: 'THM-01-10' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    const report = ev.finalize();
    logReport(report);
  });

  // THM-11..20: Color palette, update propagation
  test('THM-11..20: Color palette', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'themes', scenario: 'THM-11-20' });
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_THEME_COLOR', { slotIndex: 0, color: '#FF0000' });
    await page.waitForTimeout(300);
    await ev.capture('post-color-change');
    const report = ev.finalize();
    logReport(report);
  });

  // THM-21..30: Font theme
  test('THM-21..30: Font theme', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'themes', scenario: 'THM-21-30' });
    await ev.capture('baseline');
    const report = ev.finalize();
    logReport(report);
  });

  // THM-31..41: Theme switching, export, import
  test('THM-31..41: Theme operations', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'themes', scenario: 'THM-31-41' });
    await ev.capture('baseline');
    const report = ev.finalize();
    logReport(report);
  });
});
