/**
 * 16 — Effects System — Agnostic Eval Loop
 *
 * Evaluates EFX-01 through EFX-25: drop shadow, inner shadow,
 * blur, effect properties, reorder, and compatibility.
 *
 * Scene: 1 rect. Triggers via store dispatch.
 *
 * Run:  npx playwright test effects-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Effects System Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // EFX-01..04: Add effects (shadow, blur)
  test('EFX-01..04: Add effects', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'effects', scenario: 'EFX-01-04' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    await ev.dispatch('ADD_EFFECT', { id: elA, type: 'dropShadow' });
    await page.waitForTimeout(200);
    await ev.capture('post-drop-shadow');

    await ev.dispatch('ADD_EFFECT', { id: elA, type: 'innerShadow' });
    await page.waitForTimeout(200);
    await ev.capture('post-inner-shadow');

    await ev.dispatch('ADD_EFFECT', { id: elA, type: 'layerBlur' });
    await page.waitForTimeout(200);
    await ev.capture('post-blur');

    const report = ev.finalize();
    logReport(report);
  });

  // EFX-05..07: Delete, toggle, reorder
  test('EFX-05..07: Delete, toggle, reorder', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'effects', scenario: 'EFX-05-07' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.dispatch('ADD_EFFECT', { id: elA, type: 'dropShadow' });
    await page.waitForTimeout(200);
    await ev.capture('with-effect');

    await ev.dispatch('TOGGLE_EFFECT_VISIBILITY', { id: elA, effectIndex: 0 });
    await page.waitForTimeout(200);
    await ev.capture('post-toggle');

    await ev.dispatch('DELETE_EFFECT', { id: elA, effectIndex: 0 });
    await page.waitForTimeout(200);
    await ev.capture('post-delete');

    const report = ev.finalize();
    logReport(report);
  });

  // EFX-08..18: Shadow properties
  test('EFX-08..18: Shadow properties', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'effects', scenario: 'EFX-08-18' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.dispatch('ADD_EFFECT', { id: elA, type: 'dropShadow' });
    await page.waitForTimeout(200);
    await ev.capture('baseline');

    await ev.dispatch('UPDATE_EFFECT', { id: elA, effectIndex: 0, x: 10, y: 10, blur: 20, spread: 5 });
    await page.waitForTimeout(200);
    await ev.capture('post-shadow-params');

    await ev.dispatch('UPDATE_EFFECT', { id: elA, effectIndex: 0, color: '#FF0000', opacity: 0.5 });
    await page.waitForTimeout(200);
    await ev.capture('post-shadow-color');

    const report = ev.finalize();
    logReport(report);
  });

  // EFX-19..23: Blur properties
  test('EFX-19..23: Blur properties', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'effects', scenario: 'EFX-19-23' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.dispatch('ADD_EFFECT', { id: elA, type: 'layerBlur' });
    await page.waitForTimeout(200);
    await ev.capture('baseline');

    await ev.dispatch('UPDATE_EFFECT', { id: elA, effectIndex: 0, radius: 15 });
    await page.waitForTimeout(200);
    await ev.capture('post-blur-radius');

    const report = ev.finalize();
    logReport(report);
  });

  // EFX-24..25: Compatibility
  test('EFX-24/25: Multi-select compatibility', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'effects', scenario: 'EFX-24-25' });
    const [elA, elB] = await seedRects(page, 2);

    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'add-B');
    await ev.capture('multi-selected');

    const report = ev.finalize();
    logReport(report);
  });
});
