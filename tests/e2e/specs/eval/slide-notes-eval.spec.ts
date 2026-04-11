/**
 * 24 — Slide Notes — Agnostic Eval Loop
 * Evaluates NOT-01..26. Triggers via dispatch + keyboard.
 */
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { logReport } from '../../helpers/eval-seeders';
let editor: EditorPage;
test.describe('Slide Notes Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page); await editor.goto(); await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  test('NOT-01..10: Notes panel toggle and entry', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-notes', scenario: 'NOT-01-10' });
    await ev.capture('baseline');
    // Toggle notes panel
    await ev.dispatch('TOGGLE_NOTES_PANEL');
    await page.waitForTimeout(300); await ev.capture('notes-open');
    await ev.dispatch('TOGGLE_NOTES_PANEL');
    await page.waitForTimeout(300); await ev.capture('notes-closed');
    logReport(ev.finalize());
  });

  test('NOT-11..18: Notes editing', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-notes', scenario: 'NOT-11-18' });
    await ev.capture('baseline');
    await ev.dispatch('UPDATE_SLIDE_NOTES', { notes: 'Test speaker notes' });
    await page.waitForTimeout(200); await ev.capture('post-notes');
    await ev.dispatch('UPDATE_SLIDE_NOTES', { notes: '' });
    await page.waitForTimeout(200); await ev.capture('notes-cleared');
    logReport(ev.finalize());
  });

  test('NOT-19..26: Notes persistence and slide sync', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-notes', scenario: 'NOT-19-26' });
    await ev.dispatch('UPDATE_SLIDE_NOTES', { notes: 'Slide 1 notes' });
    await page.waitForTimeout(200); await ev.capture('notes-set');
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300); await ev.capture('new-slide');
    logReport(ev.finalize());
  });
});
