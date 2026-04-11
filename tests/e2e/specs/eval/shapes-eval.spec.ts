/**
 * 19 — Shapes & Vector Editing — Agnostic Eval Loop
 * Evaluates SHP-01..49. Uses correct store actions.
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, seedEllipse, seedLine, logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('Shapes & Vector Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('SHP-01..10: Shape creation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-01-10' });
    await ev.capture('baseline');
    const [rect] = await seedRects(page, 1);
    await ev.capture('rect');
    const ellipse = await seedEllipse(page);
    await ev.capture('ellipse');
    const line = await seedLine(page);
    await ev.capture('line');
    logReport(ev.finalize());
  });

  test('SHP-11..20: Shape properties', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-11-20' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, borderRadius: 20 });
    await page.waitForTimeout(200); await ev.capture('radius-20');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, borderRadius: 0 });
    await page.waitForTimeout(200); await ev.capture('radius-0');
    logReport(ev.finalize());
  });

  test('SHP-21..30: Boolean operations', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-21-30' });
    const [elA, elB] = await seedRects(page, 2, { spacingX: 60, width: 100, height: 80 });
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'add-B');
    await ev.capture('pre-boolean');
    await ev.dispatch('CREATE_BOOLEAN_FROM_SELECTION', { operation: 'union' });
    await page.waitForTimeout(300); await ev.capture('post-union');
    logReport(ev.finalize());
  });

  test('SHP-31..40: Mask operations', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-31-40' });
    const [elA, elB] = await seedRects(page, 2, { spacingX: 60 });
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'add-B');
    await ev.capture('pre-mask');
    await ev.dispatch('CREATE_MASK_FROM_SELECTION');
    await page.waitForTimeout(300); await ev.capture('post-mask');
    logReport(ev.finalize());
  });

  test('SHP-41..49: Vector deep edit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-41-49' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.dblClickElement(elA, 'deep-edit');
    await ev.pressKey('Escape', 'exit-deep');
    logReport(ev.finalize());
  });
});
