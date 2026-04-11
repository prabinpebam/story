/**
 * 10 — Undo / Redo — Agnostic Eval Loop
 *
 * Evaluates UND-01 through UND-22: undo/redo stack, text edit isolation,
 * session collapse, state preservation, and interaction patterns.
 *
 * Scene: 1-2 rects + 1 text. Critical state: element positions/existence
 * before/after undo cycle, editingElementId, mutation timeline.
 *
 * Run:  npx playwright test undo-redo-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, seedText, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Undo / Redo Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(
      () => !!(window as any).__TEST_CANVAS_MANAGER__,
      null,
      { timeout: 10_000 },
    );
  });

  // ─── Core Operations (UND-01..06) ─────────────────────────────────────

  // UND-01/02: Basic undo and redo
  test('UND-01/02: Undo and redo', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'undo-redo', scenario: 'UND-01-02' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // Make a change: move element
    await ev.dragElement(elA, 100, 50, 'post-move');

    // UND-01: Undo
    await ev.pressKey('Control+z', 'post-undo');

    // UND-02: Redo
    await ev.pressKey('Control+Shift+z', 'post-redo');

    const report = ev.finalize();
    logReport(report);
  });

  // UND-03/04: Undo/redo disabled when empty
  test('UND-03/04: Undo/redo disabled when empty', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'undo-redo', scenario: 'UND-03-04' });

    // Fresh state — no undo/redo available
    await ev.capture('fresh-state');

    // Try undo on empty stack (should be no-op)
    await ev.pressKey('Control+z', 'undo-empty');
    await ev.pressKey('Control+Shift+z', 'redo-empty');

    const report = ev.finalize();
    logReport(report);
  });

  // UND-05: Redo cleared on new action after undo
  test('UND-05: Redo cleared on new action', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'undo-redo', scenario: 'UND-05' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');

    // Move, undo, then do a different action
    await ev.dragElement(elA, 80, 40, 'post-move');
    await ev.pressKey('Control+z', 'post-undo');

    // New action (move again) — should clear redo stack
    await ev.dragElement(elA, -50, -30, 'new-action');

    // Redo should be no-op now
    await ev.pressKey('Control+Shift+z', 'redo-should-noop');

    const report = ev.finalize();
    logReport(report);
  });

  // UND-06: History limit (50 entries)
  test('UND-06: History limit enforcement', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'undo-redo', scenario: 'UND-06' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // Generate many undo entries via nudge
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight');
    }
    await page.waitForTimeout(200);
    await ev.capture('after-10-nudges');

    // Undo all — won't exceed 50 but verifies stack works
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Control+z');
    }
    await page.waitForTimeout(200);
    await ev.capture('after-undo-all');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Text Edit Isolation (UND-07..14) ─────────────────────────────────

  // UND-07..13: Text edit session isolation and collapse
  test('UND-07..13: Text edit undo isolation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'undo-redo', scenario: 'UND-07-13' });
    const textId = await seedText(page, { content: 'Undo isolation' });

    await ev.capture('baseline');

    // Enter edit (UND-07: pause)
    await ev.dblClickElement(textId, 'enter-edit');

    // Type content (UND-08: pushes skipped while paused)
    await page.keyboard.type(' modified', { delay: 30 });
    await page.waitForTimeout(200);
    await ev.capture('typed-in-edit');

    // UND-09/10: Browser undo/redo inside text edit
    await ev.pressKey('Control+z', 'browser-undo');
    await ev.pressKey('Control+Shift+z', 'browser-redo');

    // UND-11/12: Exit → session collapses to one entry
    await ev.pressKey('Control+Enter', 'exit-save');

    // UND-01: App-level undo reverts entire text edit session
    await ev.pressKey('Control+z', 'app-undo-text');

    const report = ev.finalize();
    logReport(report);
  });

  // UND-13: No-op on unchanged session
  test('UND-13: No-op on unchanged exit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'undo-redo', scenario: 'UND-13' });
    const textId = await seedText(page, { content: 'No change' });

    await ev.capture('before');

    // Enter and exit without changing
    await ev.dblClickElement(textId, 'enter-edit');
    await ev.pressKey('Escape', 'exit-unchanged');

    await ev.capture('after-noop');

    const report = ev.finalize();
    logReport(report);
  });

  // UND-14: Cancel session discards changes
  test('UND-14: Cancel text edit session', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'undo-redo', scenario: 'UND-14' });
    const textId = await seedText(page, { content: 'Cancel me' });

    await ev.capture('before');

    await ev.dblClickElement(textId, 'enter-edit');
    await page.keyboard.type(' CHANGED', { delay: 30 });
    await page.waitForTimeout(150);
    await ev.capture('typed');

    // Escape cancels/discards
    await ev.pressKey('Escape', 'post-cancel');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Text Edit Undo Entry (UND-15..17) ────────────────────────────────

  test('UND-15..17: Text undo/redo entry', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'undo-redo', scenario: 'UND-15-17' });
    const textId = await seedText(page, { content: 'Entry test' });

    await ev.capture('original');

    // Make text edit
    await ev.dblClickElement(textId, 'editing');
    await ev.pressKey('Control+a', 'select-all');
    await page.keyboard.type('New text', { delay: 30 });
    await page.waitForTimeout(150);
    await ev.pressKey('Control+Enter', 'save-exit');

    // UND-16: Undo text edit — content should revert
    await ev.pressKey('Control+z', 'undo-text');

    // UND-17: Redo text edit — content should re-apply
    await ev.pressKey('Control+Shift+z', 'redo-text');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── State Preservation (UND-18..20) ──────────────────────────────────

  test('UND-18..20: State preservation on undo', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'undo-redo', scenario: 'UND-18-20' });
    const [elA, elB] = await seedRects(page, 2);

    // Select A, move it
    await ev.clickElement(elA, 'select-A');
    await ev.capture('pre-move');
    await ev.dragElement(elA, 80, 40, 'post-move');

    // Change selection to B
    await ev.clickElement(elB, 'select-B');

    // Undo the move — should restore A's position
    await ev.pressKey('Control+z', 'undo-move');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Interaction Patterns (UND-21..22) ────────────────────────────────

  test('UND-21/22: Interaction undo patterns', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'undo-redo', scenario: 'UND-21-22' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // Multiple nudges (UND-22: each is separate entry)
    await ev.pressKey('ArrowRight', 'nudge-1');
    await ev.pressKey('ArrowRight', 'nudge-2');
    await ev.pressKey('ArrowRight', 'nudge-3');

    // Undo each one
    await ev.pressKey('Control+z', 'undo-3');
    await ev.pressKey('Control+z', 'undo-2');
    await ev.pressKey('Control+z', 'undo-1');

    const report = ev.finalize();
    logReport(report);
  });
});
