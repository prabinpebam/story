/**
 * 16 — Effects System — Agnostic Eval Loop
 * Evaluates EFX-01..25. Uses UPDATE_ELEMENT with style properties.
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('Effects System Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('EFX-01..04: Add effects', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'effects', scenario: 'EFX-01-04' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    // EFX-01: Drop shadow
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, style: { dropShadow: { x: 4, y: 4, blur: 8, spread: 0, color: '#00000040', blendMode: 'normal', visible: true } } });
    await page.waitForTimeout(200); await ev.capture('drop-shadow');
    // EFX-03: Layer blur
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, style: { dropShadow: { x: 4, y: 4, blur: 8, spread: 0, color: '#00000040', blendMode: 'normal', visible: true }, blur: { radius: 4, visible: true } } });
    await page.waitForTimeout(200); await ev.capture('with-blur');
    logReport(ev.finalize());
  });

  test('EFX-05..07: Delete, toggle, reorder', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'effects', scenario: 'EFX-05-07' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, style: { dropShadow: { x: 4, y: 4, blur: 8, spread: 0, color: '#00000040', blendMode: 'normal', visible: true } } });
    await page.waitForTimeout(200); await ev.capture('with-effect');
    // Toggle visibility
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, style: { dropShadow: { x: 4, y: 4, blur: 8, spread: 0, color: '#00000040', blendMode: 'normal', visible: false } } });
    await page.waitForTimeout(200); await ev.capture('effect-hidden');
    // Delete (remove from style)
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, style: {} });
    await page.waitForTimeout(200); await ev.capture('effect-removed');
    logReport(ev.finalize());
  });

  test('EFX-08..18: Shadow properties', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'effects', scenario: 'EFX-08-18' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, style: { dropShadow: { x: 0, y: 0, blur: 0, spread: 0, color: '#000000', blendMode: 'normal', visible: true } } });
    await page.waitForTimeout(200); await ev.capture('baseline');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, style: { dropShadow: { x: 10, y: 10, blur: 20, spread: 5, color: '#000000', blendMode: 'normal', visible: true } } });
    await page.waitForTimeout(200); await ev.capture('shadow-params');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, style: { dropShadow: { x: 10, y: 10, blur: 20, spread: 5, color: '#FF000080', blendMode: 'multiply', visible: true } } });
    await page.waitForTimeout(200); await ev.capture('shadow-color');
    logReport(ev.finalize());
  });

  test('EFX-19..23: Blur properties', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'effects', scenario: 'EFX-19-23' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, style: { blur: { radius: 4, visible: true } } });
    await page.waitForTimeout(200); await ev.capture('blur-4');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, style: { blur: { radius: 15, visible: true } } });
    await page.waitForTimeout(200); await ev.capture('blur-15');
    logReport(ev.finalize());
  });

  test('EFX-24/25: Multi-select compatibility', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'effects', scenario: 'EFX-24-25' });
    const [elA, elB] = await seedRects(page, 2);
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'add-B');
    await ev.capture('multi-selected');
    logReport(ev.finalize());
  });
});
