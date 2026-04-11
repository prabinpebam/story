/**
 * 19 — Shapes & Vector Editing — Agnostic Eval Loop
 * Evaluates SHP-01..49. Scene: 1 rect + shape dispatch.
 * Run:  npx playwright test shapes-eval --project=chromium --headed
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, seedEllipse, seedLine, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;
test.describe('Shapes & Vector Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // SHP-01..10: Basic shapes (rect, ellipse, line, polygon, star)
  test('SHP-01..10: Shape creation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-01-10' });
    await ev.capture('baseline');
    const [rect] = await seedRects(page, 1);
    await ev.capture('rect-created');
    const ellipse = await seedEllipse(page);
    await ev.capture('ellipse-created');
    const line = await seedLine(page);
    await ev.capture('line-created');
    const report = ev.finalize();
    logReport(report);
  });

  // SHP-11..20: Shape properties (border radius, corner type)
  test('SHP-11..20: Shape properties', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-11-20' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, borderRadius: 20 });
    await page.waitForTimeout(200);
    await ev.capture('radius-20');
    await ev.dispatch('UPDATE_ELEMENT', { id: elA, borderRadius: 0 });
    await page.waitForTimeout(200);
    await ev.capture('radius-0');
    const report = ev.finalize();
    logReport(report);
  });

  // SHP-21..30: Boolean operations
  test('SHP-21..30: Boolean operations', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-21-30' });
    const [elA, elB] = await seedRects(page, 2, { spacingX: 60, width: 100, height: 80 });
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'add-B');
    await ev.capture('pre-boolean');
    // Boolean union via dispatch
    await ev.dispatch('BOOLEAN_OPERATION', { operation: 'union' });
    await page.waitForTimeout(300);
    await ev.capture('post-union');
    const report = ev.finalize();
    logReport(report);
  });

  // SHP-31..40: Mask operations
  test('SHP-31..40: Mask operations', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-31-40' });
    const [elA, elB] = await seedRects(page, 2, { spacingX: 60 });
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'add-B');
    await ev.capture('pre-mask');
    await ev.dispatch('CREATE_MASK');
    await page.waitForTimeout(300);
    await ev.capture('post-mask');
    const report = ev.finalize();
    logReport(report);
  });

  // SHP-41..49: Vector editing (deep edit, nodes)
  test('SHP-41..49: Vector deep edit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'shapes', scenario: 'SHP-41-49' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');
    // Double-click to enter deep edit
    await ev.dblClickElement(elA, 'deep-edit');
    await ev.capture('in-deep-edit');
    await ev.pressKey('Escape', 'exit-deep-edit');
    const report = ev.finalize();
    logReport(report);
  });
});
