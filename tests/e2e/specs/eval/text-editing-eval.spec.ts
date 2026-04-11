/**
 * 07 — Text Editing — Agnostic Eval Loop
 *
 * Evaluates TXT-01 through TXT-82: edit mode entry/exit, typing,
 * inline formatting, alignment, lists, clipboard, resize modes,
 * placeholder lifecycle, undo/redo, and content safety.
 *
 * Scene: 1 text element per test (or 1 text + 1 rect for exit-by-click tests).
 * Critical state: editingElementId, textContentHash, textLength,
 * element existence, activeTool in mutation timeline.
 *
 * Run:  npx playwright test text-editing-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedText, seedRects, clearSelection, logReport } from '../../helpers/eval-seeders';

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

  // ─── Edit Mode Entry (TXT-01..07) ────────────────────────────────────

  // TXT-01: Double-click enters edit mode
  test('TXT-01: Enter edit by double-click', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-01' });
    const textId = await seedText(page, { content: 'Hello world' });

    await ev.clickElement(textId, 'selected');
    await ev.capture('pre-edit');
    await ev.dblClickElement(textId, 'post-dblclick-edit');
    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-02: Enter key enters edit mode with all content selected
  test('TXT-02: Enter edit by Enter key', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-02' });
    const textId = await seedText(page, { content: 'Select all' });

    await ev.clickElement(textId, 'selected');
    await ev.capture('pre-edit');
    await ev.pressKey('Enter', 'post-enter-edit');
    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-03: Type character with text selected enters edit and replaces
  test('TXT-03: Type-to-edit replaces content', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-03' });
    const textId = await seedText(page, { content: 'Replace me' });

    await ev.clickElement(textId, 'selected');
    await ev.capture('pre-type');
    await page.keyboard.type('X', { delay: 30 });
    await page.waitForTimeout(300);
    await ev.capture('post-type');
    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-04: Text tool click creates element and enters edit
  test('TXT-04: Text tool click creates element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-04' });
    await ev.capture('baseline');

    await ev.pressKey('t', 'text-tool');
    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('Canvas not found');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
    await ev.capture('post-create-editing');

    await page.keyboard.type('Created text', { delay: 30 });
    await page.waitForTimeout(200);
    await ev.capture('post-type');
    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-05: Text tool drag creates sized element
  test('TXT-05: Text tool drag creates sized element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-05' });
    await ev.capture('baseline');

    await ev.pressKey('t', 'text-tool');
    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('Canvas not found');
    const sx = box.x + box.width * 0.25;
    const sy = box.y + box.height * 0.35;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(sx + 300, sy + 80, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    await ev.capture('post-drag-create');

    await page.keyboard.type('Sized text', { delay: 30 });
    await page.waitForTimeout(200);
    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Edit Mode Exit (TXT-08..17) ─────────────────────────────────────

  // TXT-08: Escape exits edit mode
  test('TXT-08: Exit with Escape', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-08' });
    const textId = await seedText(page, { content: 'Escape test' });

    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.type(' added', { delay: 30 });
    await page.waitForTimeout(150);
    await ev.capture('after-typing');
    await ev.pressKey('Escape', 'post-escape');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-09: Ctrl+Enter saves and exits
  test('TXT-09: Exit with Ctrl+Enter (save)', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-09' });
    const textId = await seedText(page, { content: 'Save test' });

    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.type(' saved', { delay: 30 });
    await page.waitForTimeout(150);
    await ev.capture('after-typing');
    await ev.pressKey('Control+Enter', 'post-save-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-10: Click empty canvas exits edit
  test('TXT-10: Exit by clicking empty canvas', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-10' });
    const textId = await seedText(page, { content: 'Click away' });

    await ev.dblClickElement(textId, 'editing');
    await ev.capture('in-edit');
    await ev.clickEmpty('post-click-empty');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-11: Click another element exits edit and selects new element
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

  // TXT-12: Tab exits and selects next element
  test('TXT-12: Tab exits edit and selects next', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-12' });
    const textId = await seedText(page, { content: 'Tab test' });
    const [rect] = await seedRects(page, 1, { startX: 500 });

    await ev.dblClickElement(textId, 'editing');
    await ev.capture('in-edit');
    await ev.pressTab('post-tab');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-15: Empty non-placeholder text deleted on exit
  test('TXT-15: Empty text deleted on exit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-15' });
    await ev.capture('baseline');

    // Create via text tool
    await ev.pressKey('t', 'text-tool');
    const box = await page.locator('#canvas-container').boundingBox();
    if (!box) throw new Error('Canvas not found');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
    await ev.capture('text-created');

    // Exit without typing — element should be auto-deleted
    await ev.pressKey('Escape', 'post-exit-empty');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Text Selection (TXT-18..24) ─────────────────────────────────────

  // TXT-18/19/20/21: Click, double-click word, triple-click paragraph, Ctrl+A
  test('TXT-18..21: Selection modes in edit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-18-21' });
    const textId = await seedText(page, { content: 'Hello world test' });

    await ev.dblClickElement(textId, 'editing');

    // TXT-18: Single click places caret
    const pos = await ev.getElementCenter(textId);
    await page.mouse.click(pos.x - 20, pos.y);
    await page.waitForTimeout(100);
    await ev.capture('post-click-caret');

    // TXT-19: Double-click selects word
    await page.mouse.dblclick(pos.x, pos.y);
    await page.waitForTimeout(100);
    await ev.capture('post-dblclick-word');

    // TXT-20: Triple-click selects paragraph
    await page.mouse.click(pos.x, pos.y, { clickCount: 3 });
    await page.waitForTimeout(100);
    await ev.capture('post-tripleclick-para');

    // TXT-21: Ctrl+A selects all
    await ev.pressKey('Control+a', 'post-ctrl-a');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-22/23: Extend selection with Shift+Arrow, Ctrl+Shift+Arrow
  test('TXT-22/23: Extend selection with arrows', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-22-23' });
    const textId = await seedText(page, { content: 'Extend selection test' });

    await ev.dblClickElement(textId, 'editing');
    // Place caret at start
    await ev.pressKey('Home', 'at-start');

    // TXT-22: Shift+Right extends character by character
    await ev.pressKey('Shift+ArrowRight', 'extend-1');
    await ev.pressKey('Shift+ArrowRight', 'extend-2');
    await ev.pressKey('Shift+ArrowRight', 'extend-3');

    // TXT-23: Ctrl+Shift+Right extends by word
    await ev.pressKey('Control+Shift+ArrowRight', 'extend-word');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Inline Formatting (TXT-25..33) ──────────────────────────────────

  // TXT-25..29: Bold, italic, underline, strikethrough, toggle off
  test('TXT-25..29: Inline formatting shortcuts', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-25-29' });
    const textId = await seedText(page, { content: 'Format this text' });

    await ev.dblClickElement(textId, 'editing');
    await ev.pressKey('Control+a', 'select-all');

    // TXT-25: Bold
    await ev.pressKey('Control+b', 'post-bold');
    // TXT-26: Italic
    await ev.pressKey('Control+i', 'post-italic');
    // TXT-27: Underline
    await ev.pressKey('Control+u', 'post-underline');
    // TXT-28: Strikethrough (Ctrl+Shift+X)
    await ev.pressKey('Control+Shift+x', 'post-strikethrough');
    // TXT-29: Toggle bold off
    await ev.pressKey('Control+b', 'post-bold-off');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-33: Create link with Ctrl+K
  test('TXT-33: Create link', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-33' });
    const textId = await seedText(page, { content: 'Link this word' });

    await ev.dblClickElement(textId, 'editing');
    await ev.pressKey('Control+a', 'select-all');

    // Ctrl+K triggers link prompt — handle the dialog
    page.once('dialog', async dialog => {
      await dialog.accept('https://example.com');
    });
    await ev.pressKey('Control+k', 'post-link');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Text Alignment (TXT-34..37) ─────────────────────────────────────

  // TXT-34..37: Alignment via keyboard/dispatch
  test('TXT-34..37: Text alignment', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-34-37' });
    const textId = await seedText(page, { content: 'Align this text content here' });

    await ev.dblClickElement(textId, 'editing');
    await ev.capture('editing-baseline');

    // Alignment via execCommand dispatch
    await page.evaluate(() => document.execCommand('justifyCenter'));
    await page.waitForTimeout(150);
    await ev.capture('post-center');

    await page.evaluate(() => document.execCommand('justifyRight'));
    await page.waitForTimeout(150);
    await ev.capture('post-right');

    await page.evaluate(() => document.execCommand('justifyLeft'));
    await page.waitForTimeout(150);
    await ev.capture('post-left');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── List Handling (TXT-38..47) ───────────────────────────────────────

  // TXT-38/39/40: Apply bullet, numbered, remove list
  test('TXT-38..40: List create and remove', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-38-40' });
    const textId = await seedText(page, { content: 'List item one' });

    await ev.dblClickElement(textId, 'editing');
    await ev.pressKey('Control+a', 'select-all');
    await ev.capture('pre-list');

    // TXT-38: Bullet list
    await page.evaluate(() => document.execCommand('insertUnorderedList'));
    await page.waitForTimeout(150);
    await ev.capture('post-bullet');

    // TXT-40: Remove list (toggle off)
    await page.evaluate(() => document.execCommand('insertUnorderedList'));
    await page.waitForTimeout(150);
    await ev.capture('post-remove-list');

    // TXT-39: Numbered list
    await page.evaluate(() => document.execCommand('insertOrderedList'));
    await page.waitForTimeout(150);
    await ev.capture('post-numbered');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-41..43: Auto-detect list markers (-, *, 1., a.)
  test('TXT-41..43: Auto-detect list markers', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-41-43' });
    const textId = await seedText(page, { content: '' });

    await ev.dblClickElement(textId, 'editing');
    await ev.capture('editing-empty');

    // TXT-41: Type "- " to trigger bullet auto-detect
    await page.keyboard.type('- ', { delay: 50 });
    await page.waitForTimeout(300);
    await ev.capture('post-bullet-autodetect');

    // Type some content then Enter for new item
    await page.keyboard.type('First item', { delay: 30 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    await ev.capture('post-new-list-item');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-44/45: Indent/outdent list with Tab/Shift+Tab
  test('TXT-44/45: List indent and outdent', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-44-45' });
    const textId = await seedText(page, { content: '' });

    await ev.dblClickElement(textId, 'editing');

    // Create a bullet list with items
    await page.evaluate(() => document.execCommand('insertUnorderedList'));
    await page.keyboard.type('Item 1', { delay: 30 });
    await page.keyboard.press('Enter');
    await page.keyboard.type('Item 2', { delay: 30 });
    await page.waitForTimeout(150);
    await ev.capture('list-created');

    // TXT-44: Tab indents
    await page.keyboard.press('Tab');
    await page.waitForTimeout(150);
    await ev.capture('post-indent');

    // TXT-45: Shift+Tab outdents
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    await page.waitForTimeout(150);
    await ev.capture('post-outdent');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-46: Enter on empty list item exits list
  test('TXT-46: Empty enter exits list', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-46' });
    const textId = await seedText(page, { content: '' });

    await ev.dblClickElement(textId, 'editing');
    await page.evaluate(() => document.execCommand('insertUnorderedList'));
    await page.keyboard.type('Item', { delay: 30 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    await ev.capture('empty-list-item');

    // TXT-46: Enter on empty item exits list
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await ev.capture('post-exit-list');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Clipboard (TXT-48..55) ──────────────────────────────────────────

  // TXT-54/55: Cut and copy
  test('TXT-54/55: Cut and copy text', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-54-55' });
    const textId = await seedText(page, { content: 'Cut and copy this' });

    await ev.dblClickElement(textId, 'editing');
    await ev.pressKey('Control+a', 'select-all');
    await ev.capture('pre-clipboard');

    // TXT-55: Copy
    await ev.pressKey('Control+c', 'post-copy');

    // TXT-54: Cut
    await ev.pressKey('Control+x', 'post-cut');

    // Paste back
    await ev.pressKey('Control+v', 'post-paste');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Resize Modes (TXT-56..59) ───────────────────────────────────────

  // TXT-56..59: Auto-size, fixed-width, fixed, resize converts
  test('TXT-56..59: Text resize modes', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-56-59' });
    const textId = await seedText(page, { content: 'Resize mode text' });

    await ev.clickElement(textId, 'selected');
    await ev.capture('baseline');

    // TXT-59: Resize by dragging handle → converts to fixed mode
    await ev.dragHandle(textId, 'e', 100, 0, 'post-resize-fixed');

    // TXT-56: Set auto-size via dispatch
    await ev.dispatch('UPDATE_ELEMENT', { id: textId, resizing: 'autoSize' });
    await page.waitForTimeout(200);
    await ev.capture('post-autosize');

    // TXT-57: Set fixed-width via dispatch
    await ev.dispatch('UPDATE_ELEMENT', { id: textId, resizing: 'fixedWidth' });
    await page.waitForTimeout(200);
    await ev.capture('post-fixedwidth');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Undo/Redo (TXT-71..74) ──────────────────────────────────────────

  // TXT-71/72: Browser-native text undo/redo within edit session
  test('TXT-71/72: Text undo and redo', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-71-72' });
    const textId = await seedText(page, { content: 'Undo test' });

    await ev.dblClickElement(textId, 'editing');
    await ev.pressKey('Control+a', 'select-all');
    await page.keyboard.type('New content', { delay: 30 });
    await page.waitForTimeout(200);
    await ev.capture('after-type');

    // TXT-71: Undo
    await ev.pressKey('Control+z', 'post-undo');
    // TXT-72: Redo
    await ev.pressKey('Control+Shift+z', 'post-redo');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-73/74: Session collapses to one undo / cancel discards
  test('TXT-73/74: Edit session undo collapse', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-73-74' });
    const textId = await seedText(page, { content: 'Session undo' });

    await ev.capture('before-edit');

    // Enter, type, exit (save) — creates one undo entry
    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.type(' modified', { delay: 30 });
    await page.waitForTimeout(150);
    await ev.pressKey('Control+Enter', 'post-save-exit');

    // App-level undo should revert the entire edit session
    await ev.pressKey('Control+z', 'post-app-undo');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Content Debounce (TXT-75..77) ────────────────────────────────────

  // TXT-77: No-op save when content unchanged
  test('TXT-77: No-op save on unchanged', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-77' });
    const textId = await seedText(page, { content: 'Unchanged' });

    await ev.capture('before-edit');

    // Enter and exit without changes
    await ev.dblClickElement(textId, 'enter-edit');
    await ev.pressKey('Escape', 'post-exit-unchanged');

    // Capture should show no element mutations (no pushTextEdit)
    await ev.capture('after-noop');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Content Safety (TXT-78..82) ──────────────────────────────────────

  // TXT-78..82: Paste safety — test via typing rather than clipboard
  // (browser clipboard restrictions prevent direct paste injection)
  // Instead, verify the sanitizer by checking content hash stability
  test('TXT-78..82: Content safety via typing lifecycle', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-78-82' });
    const textId = await seedText(page, { content: 'Safe content' });

    await ev.dblClickElement(textId, 'editing');
    await ev.pressKey('Control+a', 'select-all');

    // Type normal content — should be clean
    await page.keyboard.type('Normal safe text <b>bold</b>', { delay: 20 });
    await page.waitForTimeout(200);
    await ev.capture('post-type');

    // Select all and cut/paste cycle
    await ev.pressKey('Control+a', 'select-all-2');
    await ev.pressKey('Control+c', 'copy');
    await ev.pressKey('Control+v', 'paste');
    await page.waitForTimeout(200);
    await ev.capture('post-paste-cycle');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });
});
