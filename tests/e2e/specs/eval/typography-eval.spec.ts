/**
 * 17 — Typography & Type Settings — Agnostic Eval Loop
 * Evaluates TYP-01..43. Scene: 1 text element. Triggers via dispatch.
 * Run:  npx playwright test typography-eval --project=chromium --headed
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedText, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;
test.describe('Typography Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // TYP-01..10: Text style selection, link/unlink, reset
  test('TYP-01..10: Text styles', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'typography', scenario: 'TYP-01-10' });
    const textId = await seedText(page, { content: 'Typography test', fontSize: 24 });
    await ev.clickElement(textId, 'selected');
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_ELEMENT', { id: textId, textStyleId: 'heading-1' });
    await page.waitForTimeout(200);
    await ev.capture('post-style-link');
    await ev.dispatch('UPDATE_ELEMENT', { id: textId, textStyleId: null });
    await page.waitForTimeout(200);
    await ev.capture('post-unlink');
    const report = ev.finalize();
    logReport(report);
  });

  // TYP-11..20: Font properties (family, weight, size, line-height, spacing)
  test('TYP-11..20: Font properties', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'typography', scenario: 'TYP-11-20' });
    const textId = await seedText(page, { content: 'Font props', fontSize: 24 });
    await ev.clickElement(textId, 'selected');
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_ELEMENT', { id: textId, fontSize: 36 });
    await page.waitForTimeout(200);
    await ev.capture('font-36');
    await ev.dispatch('UPDATE_ELEMENT', { id: textId, lineHeight: 1.5 });
    await page.waitForTimeout(200);
    await ev.capture('line-height-1.5');
    await ev.dispatch('UPDATE_ELEMENT', { id: textId, letterSpacing: 3 });
    await page.waitForTimeout(200);
    await ev.capture('letter-spacing-3');
    const report = ev.finalize();
    logReport(report);
  });

  // TYP-21..30: Alignment, vertical align, text fill
  test('TYP-21..30: Alignment and fill', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'typography', scenario: 'TYP-21-30' });
    const textId = await seedText(page, { content: 'Align me', fontSize: 24 });
    await ev.clickElement(textId, 'selected');
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_ELEMENT', { id: textId, textAlign: 'center' });
    await page.waitForTimeout(200);
    await ev.capture('center');
    await ev.dispatch('UPDATE_ELEMENT', { id: textId, verticalAlign: 'middle' });
    await page.waitForTimeout(200);
    await ev.capture('v-middle');
    const report = ev.finalize();
    logReport(report);
  });

  // TYP-31..37: Type settings (open type features)
  test('TYP-31..37: Type settings', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'typography', scenario: 'TYP-31-37' });
    const textId = await seedText(page, { content: 'OpenType', fontSize: 24 });
    await ev.clickElement(textId, 'selected');
    await ev.capture('baseline');
    const report = ev.finalize();
    logReport(report);
  });

  // TYP-38..43: Inline formatting, style-locked, mixed
  test('TYP-38..43: Inline and mixed', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'typography', scenario: 'TYP-38-43' });
    const textId = await seedText(page, { content: 'Format inline', fontSize: 24 });
    await ev.dblClickElement(textId, 'editing');
    await ev.pressKey('Control+a', 'select-all');
    await ev.pressKey('Control+b', 'bold');
    await ev.pressKey('Control+i', 'italic');
    await ev.pressKey('Escape', 'exit');
    const report = ev.finalize();
    logReport(report);
  });
});
