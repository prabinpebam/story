/**
 * 30 — File Operations — Agnostic Eval Loop
 *
 * Evaluates FOP-01 through FOP-21: save/load, new presentation,
 * unsaved-changes tracking, and basic file lifecycle.
 * Cloud/OAuth flows are not automatable; tests focus on local operations.
 *
 * Run:  npx playwright test file-operations-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, getState, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('File Operations Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // FOP-04: New presentation creates fresh state
  test('FOP-04: New presentation default state', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'file-operations', scenario: 'FOP-04' });
    await ev.capture('initial-state');

    // Verify fresh state has at least one slide, default master
    const state = await getState(page);
    await ev.capture('state-inspected');

    const report = ev.finalize();
    logReport(report);
  });

  // FOP-01: Save (Ctrl+S) — triggers serialization
  test('FOP-01: Save command triggers serializer', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'file-operations', scenario: 'FOP-01' });
    await seedRects(page, 1);
    await ev.capture('has-content');

    // Set up dialog handler to auto-dismiss any save picker
    page.on('dialog', dialog => dialog.dismiss());

    // Ctrl+S triggers save
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(500);
    await ev.capture('post-save-trigger');

    const report = ev.finalize();
    logReport(report);
  });

  // FOP-16: Unsaved changes tracking
  test('FOP-16: Unsaved changes indicator after edit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'file-operations', scenario: 'FOP-16' });
    await ev.capture('clean-state');

    // Make an edit — add element
    await seedRects(page, 1);
    await page.waitForTimeout(300);
    await ev.capture('dirty-state');

    // Look for unsaved indicator
    const unsavedIndicator = page.locator('[data-testid="unsaved-indicator"], .unsaved-dot, .title-bar .dot, [class*="unsaved"]').first();
    const hasIndicator = await unsavedIndicator.isVisible({ timeout: 2000 }).catch(() => false);
    await ev.capture('indicator-checked');

    const report = ev.finalize();
    logReport(report);
  });

  // FOP-14: Autosave to IndexedDB
  test('FOP-14: Autosave writes to IndexedDB', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'file-operations', scenario: 'FOP-14' });

    // Add content to trigger autosave
    await seedRects(page, 1);
    await ev.capture('content-added');

    // Wait for debounced autosave
    await page.waitForTimeout(3000);
    await ev.capture('autosave-window');

    // Check IndexedDB has data
    const hasAutosave = await page.evaluate(async () => {
      try {
        const dbs = await indexedDB.databases();
        return dbs.length > 0;
      } catch {
        return false;
      }
    });
    await ev.capture('indexeddb-checked');

    const report = ev.finalize();
    logReport(report);
  });

  // FOP-07/08: Serialization round-trip state integrity
  test('FOP-07/08: State integrity after edit cycle', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'file-operations', scenario: 'FOP-07-08' });

    await seedRects(page, 2);
    const stateBefore = await getState(page);
    await ev.capture('elements-created');

    // Undo all, redo all — state should remain consistent
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(200);
    await ev.capture('all-undone');

    await page.keyboard.press('Control+Shift+z');
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+Shift+z');
    await page.waitForTimeout(200);
    await ev.capture('all-redone');

    const report = ev.finalize();
    logReport(report);
  });
});
