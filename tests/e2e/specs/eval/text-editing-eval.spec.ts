/**
 * 07 — Text Editing — Agnostic Eval Loop
 *
 * Evaluates TXT-01 through TXT-82: edit mode entry/exit, typing,
 * formatting, selection, undo/redo, and empty text deletion.
 *
 * Scene: 1 text element per test. Critical state: editingElementId,
 * selectedElementIds, textContentHash, textLength in DOM layer,
 * element existence in mutation timeline.
 *
 * Run:  npx playwright test text-editing-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedText, seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Text Editing Eval Loop', () => {
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

  // ─── Edit Mode Entry ─────────────────────────────────────────────────

  // TXT-01: Double-click enters edit mode
  test('TXT-01: Enter edit by double-click', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-01' });
    const textId = await seedText(page, { content: 'Hello world' });

    await ev.clickElement(textId, 'selected');
    await ev.capture('pre-edit');
    await ev.dblClickElement(textId, 'post-dblclick-edit');

    // Exit edit mode
    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-02: Enter key enters edit mode with all selected
  test('TXT-02: Enter edit by Enter key', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-02' });
    const textId = await seedText(page, { content: 'Select me' });

    await ev.clickElement(textId, 'selected');
    await ev.capture('pre-edit');
    await ev.pressKey('Enter', 'post-enter-edit');
    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-04/05: Text tool click/drag creates element
  test('TXT-04/05: Text tool creates element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-04-05' });
    await ev.capture('baseline');

    // Click-create with text tool
    await ev.pressKey('t', 'text-tool');
    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('Canvas not found');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
    await ev.capture('post-text-create');

    // Type content so it persists
    await page.keyboard.type('New text', { delay: 30 });
    await page.waitForTimeout(200);
    await ev.capture('post-type');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Edit Mode Exit ──────────────────────────────────────────────────

  // TXT-08/09: Escape discards, Ctrl+Enter saves
  test('TXT-08/09: Exit with Escape and Ctrl+Enter', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-08-09' });
    const textId = await seedText(page, { content: 'Original' });

    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.type(' added', { delay: 30 });
    await page.waitForTimeout(150);
    await ev.capture('after-typing');

    // Ctrl+Enter saves
    await ev.pressKey('Control+Enter', 'post-save-exit');

    // Re-enter and Escape
    await ev.dblClickElement(textId, 're-editing');
    await ev.pressKey('Escape', 'post-escape-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-10: Click empty canvas exits edit
  test('TXT-10: Exit by clicking canvas', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-10' });
    const textId = await seedText(page, { content: 'Click away' });

    await ev.dblClickElement(textId, 'editing');
    await ev.capture('in-edit');
    await ev.clickEmpty('post-click-empty');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-11: Click another element exits edit
  test('TXT-11: Exit by clicking another element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-11' });
    const textId = await seedText(page, { content: 'Edit this' });
    const [rect] = await seedRects(page, 1, { startX: 500 });

    await ev.dblClickElement(textId, 'editing');
    await ev.capture('in-edit');
    await ev.clickElement(rect, 'post-click-other');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-15: Empty non-placeholder deleted on exit
  test('TXT-15: Empty text deleted on exit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-15' });
    await ev.capture('baseline');

    // Create text via tool
    await ev.pressKey('t', 'text-tool');
    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('Canvas not found');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
    await ev.capture('text-created');

    // Exit without typing → should be deleted
    await ev.pressKey('Escape', 'post-exit-empty');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Inline Formatting ───────────────────────────────────────────────

  // TXT-25..29: Bold, italic, underline, strikethrough, toggle off
  test('TXT-25..29: Inline formatting shortcuts', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-25-29' });
    const textId = await seedText(page, { content: 'Format me please' });

    await ev.dblClickElement(textId, 'editing');
    // Select all
    await ev.pressKey('Control+a', 'select-all');

    // Apply bold
    await ev.pressKey('Control+b', 'post-bold');
    // Apply italic
    await ev.pressKey('Control+i', 'post-italic');
    // Apply underline
    await ev.pressKey('Control+u', 'post-underline');
    // Toggle bold off
    await ev.pressKey('Control+b', 'post-bold-off');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Text Typing ─────────────────────────────────────────────────────

  // TXT-03: Type-to-edit (type character with text selected)
  test('TXT-03: Type-to-edit replaces content', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-03' });
    const textId = await seedText(page, { content: 'Replace me' });

    await ev.clickElement(textId, 'selected');
    await ev.capture('pre-type');

    // Type a character — should enter edit mode and replace
    await page.keyboard.type('X', { delay: 30 });
    await page.waitForTimeout(300);
    await ev.capture('post-type');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Undo/Redo in Text ───────────────────────────────────────────────

  // TXT-71/72: Text undo/redo within edit session
  test('TXT-71/72: Text undo and redo', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-71-72' });
    const textId = await seedText(page, { content: 'Undo test' });

    await ev.dblClickElement(textId, 'editing');
    await ev.pressKey('Control+a', 'select-all');
    await page.keyboard.type('New content', { delay: 30 });
    await page.waitForTimeout(200);
    await ev.capture('after-type');

    // Undo
    await ev.pressKey('Control+z', 'post-undo');
    // Redo
    await ev.pressKey('Control+Shift+z', 'post-redo');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });
});
