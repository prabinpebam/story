/**
 * 15 — Strokes System — Agnostic Eval Loop
 * Evaluates STK-01..28. Uses UPDATE_ELEMENT with strokes array.
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('Strokes System Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('STK-01..03: Add, toggle, delete stroke', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'strokes', scenario: 'STK-01-03' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, strokes: [{ type: 'solid', color: '#000000', weight: 2, opacity: 100, visible: true, position: 'center' }] });
    await page.waitForTimeout(200); await ev.capture('stroke-added');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, strokes: [{ type: 'solid', color: '#000000', weight: 2, opacity: 100, visible: false, position: 'center' }] });
    await page.waitForTimeout(200); await ev.capture('stroke-hidden');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, strokes: [] });
    await page.waitForTimeout(200); await ev.capture('stroke-deleted');
    logReport(ev.finalize());
  });

  test('STK-04..09: Stroke properties', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'strokes', scenario: 'STK-04-09' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, strokes: [{ type: 'solid', color: '#000000', weight: 2, opacity: 100, visible: true, position: 'center' }] });
    await page.waitForTimeout(200); await ev.capture('baseline');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, strokes: [{ type: 'solid', color: '#FF0000', weight: 2, opacity: 100, visible: true, position: 'center' }] });
    await page.waitForTimeout(200); await ev.capture('color-red');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, strokes: [{ type: 'solid', color: '#FF0000', weight: 2, opacity: 50, visible: true, position: 'center' }] });
    await page.waitForTimeout(200); await ev.capture('opacity-50');
    logReport(ev.finalize());
  });

  test('STK-10..13: Stroke color types', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'strokes', scenario: 'STK-10-13' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, strokes: [{ type: 'solid', color: '#00FF00', weight: 3, opacity: 100, visible: true, position: 'center' }] });
    await page.waitForTimeout(200); await ev.capture('green-stroke');
    logReport(ev.finalize());
  });

  test('STK-14..25: Stroke geometry', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'strokes', scenario: 'STK-14-25' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, strokes: [{ type: 'solid', color: '#000', weight: 2, opacity: 100, visible: true, position: 'center' }] });
    await page.waitForTimeout(200); await ev.capture('baseline');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, strokes: [{ type: 'solid', color: '#000', weight: 4, opacity: 100, visible: true, position: 'center' }] });
    await page.waitForTimeout(200); await ev.capture('weight-4');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, strokes: [{ type: 'solid', color: '#000', weight: 4, opacity: 100, visible: true, position: 'inside' }] });
    await page.waitForTimeout(200); await ev.capture('inside');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, strokes: [{ type: 'solid', color: '#000', weight: 4, opacity: 100, visible: true, position: 'inside', style: 'dashed', dashArray: [8, 4] }] });
    await page.waitForTimeout(200); await ev.capture('dashed');
    logReport(ev.finalize());
  });

  test('STK-26..28: Compatibility', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'strokes', scenario: 'STK-26-28' });
    const [elA, elB] = await seedRects(page, 2);
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'add-B');
    await ev.capture('multi-selected');
    logReport(ev.finalize());
  });
});
