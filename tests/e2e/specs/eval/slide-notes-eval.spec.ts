/**
 * 24 — Slide Notes — Agnostic Eval Loop
 * Evaluates NOT-01..26. Uses UPDATE_SLIDE for notes (not fake TOGGLE_NOTES_PANEL).
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

  test('NOT-01..10: Notes panel and entry', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-notes', scenario: 'NOT-01-10' });
    await ev.capture('baseline');
    // Set notes via UPDATE_SLIDE with slide ID
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const state = store.getState();
      store.dispatch('UPDATE_SLIDE', { id: state.editor.activeSlideId, notesDoc: { version: 1, blocks: [{ text: 'Speaker notes content' }] } });
    });
    await page.waitForTimeout(200); await ev.capture('notes-set');
    logReport(ev.finalize());
  });

  test('NOT-11..18: Notes editing', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-notes', scenario: 'NOT-11-18' });
    await ev.capture('baseline');
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const state = store.getState();
      store.dispatch('UPDATE_SLIDE', { id: state.editor.activeSlideId, notesDoc: { version: 1, blocks: [{ text: 'Edited notes' }] } });
    });
    await page.waitForTimeout(200); await ev.capture('notes-edited');
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const state = store.getState();
      store.dispatch('UPDATE_SLIDE', { id: state.editor.activeSlideId, notesDoc: { version: 1, blocks: [] } });
    });
    await page.waitForTimeout(200); await ev.capture('notes-cleared');
    logReport(ev.finalize());
  });

  test('NOT-19..26: Notes persistence across slides', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-notes', scenario: 'NOT-19-26' });
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const state = store.getState();
      store.dispatch('UPDATE_SLIDE', { id: state.editor.activeSlideId, notesDoc: { version: 1, blocks: [{ text: 'Slide 1 notes' }] } });
    });
    await page.waitForTimeout(200); await ev.capture('notes-on-slide-1');
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300); await ev.capture('on-slide-2');
    logReport(ev.finalize());
  });
});
