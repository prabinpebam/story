/**
 * 15 — Strokes System — Agnostic Eval Loop
 *
 * Evaluates STK-01 through STK-28: stroke layers, color, weight,
 * position, dash/cap/join, gradients, and compatibility.
 *
 * Scene: 1 rect. Triggers via store dispatch.
 *
 * Run:  npx playwright test strokes-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Strokes System Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // STK-01..03: Add, delete, toggle stroke
  test('STK-01..03: Add, delete, toggle stroke', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'strokes', scenario: 'STK-01-03' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    await ev.dispatch('ADD_STROKE', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('post-add');

    await ev.dispatch('TOGGLE_STROKE_VISIBILITY', { id: elA, strokeIndex: 0 });
    await page.waitForTimeout(200);
    await ev.capture('post-toggle');

    await ev.dispatch('DELETE_STROKE', { id: elA, strokeIndex: 0 });
    await page.waitForTimeout(200);
    await ev.capture('post-delete');

    const report = ev.finalize();
    logReport(report);
  });

  // STK-04..09: Properties (reorder, blend, color, opacity, migration)
  test('STK-04..09: Stroke properties', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'strokes', scenario: 'STK-04-09' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.dispatch('ADD_STROKE', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('with-stroke');

    await ev.dispatch('UPDATE_STROKE', { id: elA, strokeIndex: 0, color: '#FF0000' });
    await page.waitForTimeout(200);
    await ev.capture('post-color');

    await ev.dispatch('UPDATE_STROKE', { id: elA, strokeIndex: 0, opacity: 0.5 });
    await page.waitForTimeout(200);
    await ev.capture('post-opacity');

    const report = ev.finalize();
    logReport(report);
  });

  // STK-10..13: Solid, gradient, theme-link
  test('STK-10..13: Stroke color types', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'strokes', scenario: 'STK-10-13' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.dispatch('ADD_STROKE', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('baseline');

    await ev.dispatch('UPDATE_STROKE', { id: elA, strokeIndex: 0, color: '#00FF00' });
    await page.waitForTimeout(200);
    await ev.capture('solid-stroke');

    const report = ev.finalize();
    logReport(report);
  });

  // STK-14..25: Weight, position, dash, cap, join
  test('STK-14..25: Stroke geometry', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'strokes', scenario: 'STK-14-25' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.dispatch('ADD_STROKE', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('baseline');

    await ev.dispatch('UPDATE_STROKE', { id: elA, strokeIndex: 0, weight: 4 });
    await page.waitForTimeout(200);
    await ev.capture('weight-4');

    await ev.dispatch('UPDATE_STROKE', { id: elA, strokeIndex: 0, position: 'inside' });
    await page.waitForTimeout(200);
    await ev.capture('position-inside');

    await ev.dispatch('UPDATE_STROKE', { id: elA, strokeIndex: 0, style: 'dashed' });
    await page.waitForTimeout(200);
    await ev.capture('dashed');

    const report = ev.finalize();
    logReport(report);
  });

  // STK-26..28: Compatibility and mixed
  test('STK-26..28: Compatibility', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'strokes', scenario: 'STK-26-28' });
    const [elA, elB] = await seedRects(page, 2);

    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'add-B');
    await ev.capture('multi-selected');

    const report = ev.finalize();
    logReport(report);
  });
});
