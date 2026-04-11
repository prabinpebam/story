/**
 * 18 — Color Picker — Agnostic Eval Loop
 * Evaluates CLR-01..39. Uses UPDATE_ELEMENT with fills to change colors.
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('Color Picker Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('CLR-01..10: Color selection', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'color-picker', scenario: 'CLR-01-10' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, fills: [{ type: 'solid', color: '#FF5500', opacity: 100, visible: true }] });
    await page.waitForTimeout(200); await ev.capture('orange');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, fills: [{ type: 'solid', color: '#00CC88', opacity: 100, visible: true }] });
    await page.waitForTimeout(200); await ev.capture('green');
    logReport(ev.finalize());
  });

  test('CLR-11..20: Hex and opacity', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'color-picker', scenario: 'CLR-11-20' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, fills: [{ type: 'solid', color: '#123456', opacity: 75, visible: true }] });
    await page.waitForTimeout(200); await ev.capture('hex-opacity');
    logReport(ev.finalize());
  });

  test('CLR-21..30: Theme colors', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'color-picker', scenario: 'CLR-21-30' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, fills: [{ type: 'solid', color: '#3B82F6', opacity: 100, visible: true, themeSlot: 0 }] });
    await page.waitForTimeout(200); await ev.capture('theme-linked');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, fills: [{ type: 'solid', color: '#3B82F6', opacity: 100, visible: true }] });
    await page.waitForTimeout(200); await ev.capture('theme-unlinked');
    logReport(ev.finalize());
  });

  test('CLR-31..39: Gradient picker', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'color-picker', scenario: 'CLR-31-39' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, fills: [{
      type: 'linear-gradient', visible: true, opacity: 100, angle: 90,
      stops: [{ color: '#FF0000', position: 0 }, { color: '#0000FF', position: 100 }],
    }] });
    await page.waitForTimeout(200); await ev.capture('gradient');
    logReport(ev.finalize());
  });
});
