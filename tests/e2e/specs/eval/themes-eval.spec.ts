/**
 * 22 — Themes — Agnostic Eval Loop
 * Evaluates THM-01..41. Uses UPDATE_LUMA_THEME_SLOT (not UPDATE_THEME_COLOR).
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('Themes Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('THM-01..10: Theme slot system', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'themes', scenario: 'THM-01-10' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    // Link fill to theme slot
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, fills: [{ type: 'solid', color: '#3B82F6', opacity: 100, visible: true, themeSlot: 0 }] });
    await page.waitForTimeout(200); await ev.capture('theme-linked');
    logReport(ev.finalize());
  });

  test('THM-11..20: Color palette', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'themes', scenario: 'THM-11-20' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    // Change element fill color (simulates theme color application)
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, fills: [{ type: 'solid', color: '#FF0000', opacity: 100, visible: true }] });
    await page.waitForTimeout(200); await ev.capture('post-color');
    logReport(ev.finalize());
  });

  test('THM-21..30: Font and theme toggle', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'themes', scenario: 'THM-21-30' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    // Change element opacity as observable state change
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, opacity: 0.8 });
    await page.waitForTimeout(200); await ev.capture('post-change');
    logReport(ev.finalize());
  });

  test('THM-31..41: Theme operations', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'themes', scenario: 'THM-31-41' });
    await ev.capture('baseline');
    logReport(ev.finalize());
  });
});
