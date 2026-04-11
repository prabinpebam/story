/**
 * 24 — Slide Notes — Agnostic Eval Loop
 *
 * Evaluates NOT-01 through NOT-26: notes panel open/close, text formatting,
 * auto-save, and document model.
 *
 * Run:  npx playwright test slide-notes-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Slide Notes Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // NOT-01/02: Open and close notes panel
  test('NOT-01/02: Open and close notes panel', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-notes', scenario: 'NOT-01-02' });
    await ev.capture('baseline');

    const notesBtn = page.locator('[data-testid="toggle-notes"], [data-testid="notes-panel-btn"]').first();
    if (await notesBtn.isVisible()) {
      await notesBtn.click();
      await page.waitForTimeout(300);
      await ev.capture('notes-panel-open');

      await notesBtn.click();
      await page.waitForTimeout(300);
      await ev.capture('notes-panel-closed');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // NOT-06: Type notes content
  test('NOT-06: Type notes content', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-notes', scenario: 'NOT-06' });

    const notesBtn = page.locator('[data-testid="toggle-notes"], [data-testid="notes-panel-btn"]').first();
    if (await notesBtn.isVisible()) {
      await notesBtn.click();
      await page.waitForTimeout(300);
    }

    const notesEditor = page.locator('[data-testid="notes-editor"], .notes-editor [contenteditable]').first();
    if (await notesEditor.isVisible()) {
      await notesEditor.click();
      await page.waitForTimeout(100);
      await page.keyboard.type('These are my speaker notes for slide 1.');
      await page.waitForTimeout(300);
      await ev.capture('post-type-notes');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // NOT-07/08/09: Formatting in notes
  test('NOT-07/08/09: Format notes (bold/italic/strikethrough)', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-notes', scenario: 'NOT-07-09' });

    const notesBtn = page.locator('[data-testid="toggle-notes"], [data-testid="notes-panel-btn"]').first();
    if (await notesBtn.isVisible()) {
      await notesBtn.click();
      await page.waitForTimeout(300);
    }

    const notesEditor = page.locator('[data-testid="notes-editor"], .notes-editor [contenteditable]').first();
    if (await notesEditor.isVisible()) {
      await notesEditor.click();
      await page.keyboard.type('Format this text');
      await page.keyboard.press('Control+a');
      await page.waitForTimeout(100);

      await page.keyboard.press('Control+b');
      await page.waitForTimeout(200);
      await ev.capture('post-bold');

      await page.keyboard.press('Control+i');
      await page.waitForTimeout(200);
      await ev.capture('post-italic');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // NOT-10..12: Heading levels
  test('NOT-10..12: Apply heading levels', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'slide-notes', scenario: 'NOT-10-12' });

    const notesBtn = page.locator('[data-testid="toggle-notes"], [data-testid="notes-panel-btn"]').first();
    if (await notesBtn.isVisible()) {
      await notesBtn.click();
      await page.waitForTimeout(300);
    }

    const notesEditor = page.locator('[data-testid="notes-editor"], .notes-editor [contenteditable]').first();
    if (await notesEditor.isVisible()) {
      await notesEditor.click();
      await page.keyboard.type('Heading Text');
      await page.keyboard.press('Control+a');
      await page.waitForTimeout(100);

      // Apply H1 via toolbar button
      const h1Btn = page.locator('[data-testid="notes-heading-1"], .notes-toolbar [data-heading="1"]').first();
      if (await h1Btn.isVisible()) {
        await h1Btn.click();
        await page.waitForTimeout(200);
        await ev.capture('post-heading-1');
      }
    }

    const report = ev.finalize();
    logReport(report);
  });
});
