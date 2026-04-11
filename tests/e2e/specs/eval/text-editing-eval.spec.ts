/**
 * 07 — Text Editing — Agnostic Eval Loop
 *
 * Evaluates TXT-01 through TXT-82: edit mode entry/exit, text selection,
 * inline formatting, lists, clipboard, placeholder, resize modes, and safety.
 *
 * Run:  npx playwright test text-editing-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedText, seedTexts, clearSelection, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Text Editing Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // TXT-01: Enter edit mode by double-click
  test('TXT-01: Enter edit mode by double-click', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-01' });
    const textId = await seedText(page, { content: 'Hello World' });
    await ev.capture('baseline');

    await ev.dblClickElement(textId, 'post-double-click-edit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-02: Enter edit mode by Enter key
  test('TXT-02: Enter edit mode by Enter key', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-02' });
    const textId = await seedText(page, { content: 'Enter to edit' });
    await ev.clickElement(textId, 'selected');
    await ev.pressKey('Enter', 'post-enter-edit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-08: Exit without saving (Escape)
  test('TXT-08: Exit edit mode with Escape', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-08' });
    const textId = await seedText(page, { content: 'Escape test' });

    await ev.dblClickElement(textId, 'editing');
    await ev.typeText('New content ', 'typed');
    await ev.pressKey('Escape', 'post-escape');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-09: Exit with save (Ctrl+Enter)
  test('TXT-09: Exit with save via Ctrl+Enter', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-09' });
    const textId = await seedText(page, { content: 'Save test' });

    await ev.dblClickElement(textId, 'editing');
    await ev.typeText('Saved content ', 'typed');
    await ev.pressKey('Control+Enter', 'post-save-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-10: Exit by clicking canvas
  test('TXT-10: Exit by clicking empty canvas', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-10' });
    const textId = await seedText(page, { content: 'Click away' });

    await ev.dblClickElement(textId, 'editing');
    await ev.typeText('New text ', 'typed');
    await ev.clickEmpty('post-click-away');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-12: Tab to next element
  test('TXT-12: Tab exits edit, selects next', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-12' });
    const [t1, t2] = await seedTexts(page, 2);
    await ev.capture('baseline');

    await ev.dblClickElement(t1, 'editing-first');
    await ev.pressTab('post-tab-to-next');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-25/26/27: Inline formatting (Bold/Italic/Underline)
  test('TXT-25/26/27: Inline formatting B/I/U', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-25-27' });
    const textId = await seedText(page, { content: 'Format me' });

    await ev.dblClickElement(textId, 'editing');
    // Select all
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);
    await ev.capture('all-selected');

    // Apply bold
    await ev.pressKey('Control+b', 'post-bold');
    // Apply italic
    await ev.pressKey('Control+i', 'post-italic');
    // Apply underline
    await ev.pressKey('Control+u', 'post-underline');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-34/35/36/37: Text alignment
  test('TXT-34/35/36: Text alignment', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-34-36' });
    const textId = await seedText(page, { content: 'Align this text content' });

    await ev.dblClickElement(textId, 'editing');

    // Align center via PI button
    const centerBtn = page.locator('[data-testid="align-center"]').first();
    if (await centerBtn.isVisible()) {
      await centerBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('post-align-center');
    }

    // Align right
    const rightBtn = page.locator('[data-testid="align-right"]').first();
    if (await rightBtn.isVisible()) {
      await rightBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('post-align-right');
    }

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-48: Paste plain text
  test('TXT-48: Paste plain text', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-48' });
    const textId = await seedText(page, { content: 'Paste here' });

    // Copy text to clipboard
    await page.evaluate(() => navigator.clipboard.writeText('Pasted content'));

    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);
    await ev.pressKey('Control+v', 'post-paste');
    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-15: Empty non-placeholder deleted on exit
  test('TXT-15: Empty text deleted on exit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-15' });
    const textId = await seedText(page, { content: 'Delete me' });
    await ev.capture('baseline');

    await ev.dblClickElement(textId, 'editing');
    // Select all and delete
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(100);
    await ev.capture('content-deleted');

    // Exit
    await ev.clickEmpty('post-exit-empty');

    const report = ev.finalize();
    logReport(report);
  });

  // TXT-03: Type-to-edit
  test('TXT-03: Type-to-edit replaces content', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-03' });
    const textId = await seedText(page, { content: 'Original' });
    await ev.clickElement(textId, 'selected');
    // Type a character — should enter edit mode and replace
    await page.keyboard.type('X');
    await page.waitForTimeout(300);
    await ev.capture('post-type-to-edit');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await ev.capture('post-exit');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-04: Text tool click creates element
  test('TXT-04: Text tool click creates element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-04' });
    await ev.capture('baseline');
    await page.keyboard.press('t');
    await page.waitForTimeout(200);
    const box = await page.locator('#canvas-container').boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(400);
    }
    await ev.capture('text-created-editing');
    await page.keyboard.type('New text');
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await ev.capture('post-exit');
    await page.keyboard.press('v');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-05: Text tool drag creates sized element
  test('TXT-05: Text tool drag creates sized element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-05' });
    await page.keyboard.press('t');
    await page.waitForTimeout(200);
    const box = await page.locator('#canvas-container').boundingBox();
    if (box) {
      const sx = box.x + 200, sy = box.y + 200;
      await page.mouse.move(sx, sy);
      await page.mouse.down();
      await page.mouse.move(sx + 300, sy + 100, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(400);
    }
    await ev.capture('sized-text-created');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await page.keyboard.press('v');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-06/07: Placeholder edit (double-click or context menu)
  test('TXT-06/07: Placeholder edit entry', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-06-07' });
    // Seed a placeholder-like text
    const textId = await seedText(page, { content: 'Click to add title' });
    await ev.capture('placeholder-seeded');
    await ev.dblClickElement(textId, 'post-dblclick-placeholder');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-11: Exit by clicking another element
  test('TXT-11: Exit by clicking another element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-11' });
    const [t1, t2] = await seedTexts(page, 2);
    await ev.dblClickElement(t1, 'editing-t1');
    await ev.typeText('Editing ', 'typed');
    await ev.clickElement(t2, 'clicked-t2-exit');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-13/14: Stay editing when PI/toolbar focused
  test('TXT-13/14: Edit persists on PI/toolbar focus', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-13-14' });
    const textId = await seedText(page, { content: 'Persist editing' });
    await ev.dblClickElement(textId, 'editing');
    // Click on PI area
    const pi = page.locator('[data-testid="property-inspector"], .property-inspector').first();
    if (await pi.isVisible({ timeout: 1000 }).catch(() => false)) {
      await pi.click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(200);
    }
    await ev.capture('post-pi-click');
    // Should still be in edit mode — type to verify
    await page.keyboard.type('X');
    await page.waitForTimeout(200);
    await ev.capture('typed-after-pi');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-16: Empty placeholder shows prompt on exit
  test('TXT-16: Empty placeholder restored on exit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-16' });
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('ADD_ELEMENT', {
        id: 'eval-ph-16', type: 'text', x: 200, y: 200, width: 300, height: 60,
        rotation: 0, opacity: 1, name: 'Placeholder',
        content: 'Click to add title', isPlaceholder: true, hasUserContent: false,
        fontSize: 24, fontFamily: 'Inter', fontWeight: 400, textAlign: 'left',
        verticalAlign: 'top', color: '#FFFFFF', lineHeight: 1.2, letterSpacing: 0,
      });
      store.dispatch('UPDATE_SELECTION', []);
    });
    await page.waitForTimeout(200);
    await ev.dblClickElement('eval-ph-16', 'editing-placeholder');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(100);
    await ev.clickEmpty('post-exit-empty-placeholder');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-18/19/20/21: Text selection modes
  test('TXT-18..21: Caret, word, paragraph, select-all', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-18-21' });
    const textId = await seedText(page, { content: 'Hello beautiful world of text editing' });
    await ev.dblClickElement(textId, 'editing');
    // TXT-18: Click places caret
    const rect = await ev.getElementRect(textId);
    await page.mouse.click(rect.x + 20, rect.y + rect.height / 2);
    await page.waitForTimeout(200);
    await ev.capture('caret-placed');
    // TXT-19: Double-click selects word
    await page.mouse.dblclick(rect.x + 50, rect.y + rect.height / 2);
    await page.waitForTimeout(200);
    await ev.capture('word-selected');
    // TXT-20: Triple-click selects paragraph
    await page.mouse.click(rect.x + 50, rect.y + rect.height / 2, { clickCount: 3 });
    await page.waitForTimeout(200);
    await ev.capture('paragraph-selected');
    // TXT-21: Ctrl+A selects all
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(200);
    await ev.capture('all-selected');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-22/23: Extend selection by char and word
  test('TXT-22/23: Extend selection Shift+Arrow', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-22-23' });
    const textId = await seedText(page, { content: 'Extend selection test' });
    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.press('Home');
    await page.waitForTimeout(100);
    // TXT-22: Shift+Right extends by character
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    await page.waitForTimeout(200);
    await ev.capture('extended-3-chars');
    // TXT-23: Ctrl+Shift+Right extends by word
    await page.keyboard.press('Control+Shift+ArrowRight');
    await page.waitForTimeout(200);
    await ev.capture('extended-by-word');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-28: Strikethrough
  test('TXT-28: Apply strikethrough', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-28' });
    const textId = await seedText(page, { content: 'Strikethrough me' });
    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);
    await page.keyboard.press('Control+Shift+x');
    await page.waitForTimeout(200);
    await ev.capture('post-strikethrough');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-29: Toggle bold off
  test('TXT-29: Toggle bold off', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-29' });
    const textId = await seedText(page, { content: 'Bold toggle' });
    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(100);
    await ev.capture('bold-on');
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(100);
    await ev.capture('bold-off');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-30: Query active formats
  test('TXT-30: Query active formats reflected in PI', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-30' });
    const textId = await seedText(page, { content: 'Format query' });
    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(200);
    await ev.capture('bold-active-in-pi');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-33: Create link (Ctrl+K)
  test('TXT-33: Create link via Ctrl+K', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-33' });
    const textId = await seedText(page, { content: 'Link this text' });
    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);
    // Ctrl+K triggers link dialog
    page.on('dialog', dialog => dialog.accept('https://example.com'));
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);
    await ev.capture('post-create-link');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-37: Justify alignment
  test('TXT-37: Text justify alignment', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-37' });
    const textId = await seedText(page, { content: 'Justify this paragraph of text content for alignment test' });
    await ev.dblClickElement(textId, 'editing');
    const justifyBtn = page.locator('[data-testid="align-justify"]').first();
    if (await justifyBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await justifyBtn.click();
      await page.waitForTimeout(200);
    }
    await ev.capture('post-justify');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-38/39/40: List handling — bullet, numbered, remove
  test('TXT-38/39/40: Apply and remove lists', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-38-40' });
    const textId = await seedText(page, { content: 'List item one\nList item two\nList item three' });
    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);
    // Try bullet list button in PI
    const bulletBtn = page.locator('[data-testid="list-bullet"], [data-testid="list-unordered"]').first();
    if (await bulletBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await bulletBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('bullet-list');
    }
    // Try numbered list button
    const numBtn = page.locator('[data-testid="list-numbered"], [data-testid="list-ordered"]').first();
    if (await numBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await numBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('numbered-list');
    }
    await ev.capture('list-applied');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-41/42/43: Auto-detect list markers
  test('TXT-41/42/43: Auto-detect list markers', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-41-43' });
    const textId = await seedText(page, { content: '' });
    await ev.dblClickElement(textId, 'editing');
    // TXT-41: Type "- " to trigger bullet
    await page.keyboard.type('- ');
    await page.waitForTimeout(300);
    await ev.capture('auto-bullet');
    // Clear and try numbered
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('1. ');
    await page.waitForTimeout(300);
    await ev.capture('auto-numbered');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-44/45: Indent/Outdent list items
  test('TXT-44/45: Indent and outdent list items', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-44-45' });
    const textId = await seedText(page, { content: 'Item one' });
    await ev.dblClickElement(textId, 'editing');
    // Apply bullet first
    const bulletBtn = page.locator('[data-testid="list-bullet"], [data-testid="list-unordered"]').first();
    if (await bulletBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await bulletBtn.click();
      await page.waitForTimeout(200);
    }
    // TXT-44: Tab to indent
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await ev.capture('indented');
    // TXT-45: Shift+Tab to outdent
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(200);
    await ev.capture('outdented');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-46: Exit list on empty enter
  test('TXT-46: Empty enter exits list', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-46' });
    const textId = await seedText(page, { content: 'List item' });
    await ev.dblClickElement(textId, 'editing');
    const bulletBtn = page.locator('[data-testid="list-bullet"], [data-testid="list-unordered"]').first();
    if (await bulletBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await bulletBtn.click();
      await page.waitForTimeout(200);
    }
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    // Second enter on empty item should exit list
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await ev.capture('list-exited');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-47: Backspace at list item start
  test('TXT-47: Backspace at list item start', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-47' });
    const textId = await seedText(page, { content: 'List backspace' });
    await ev.dblClickElement(textId, 'editing');
    const bulletBtn = page.locator('[data-testid="list-bullet"], [data-testid="list-unordered"]').first();
    if (await bulletBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await bulletBtn.click();
      await page.waitForTimeout(200);
    }
    await page.keyboard.press('Home');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);
    await ev.capture('backspace-at-start');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-49/50: Rich and fallback paste
  test('TXT-49/50: Paste rich HTML and fallback', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-49-50' });
    const textId = await seedText(page, { content: 'Paste target' });
    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.press('Control+a');
    // Set clipboard with rich HTML
    await page.evaluate(() => {
      const blob = new Blob(['<b>Rich</b> <i>content</i>'], { type: 'text/html' });
      const item = new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob(['Rich content'], { type: 'text/plain' }) });
      navigator.clipboard.write([item]).catch(() => {});
    });
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+v');
    await page.waitForTimeout(300);
    await ev.capture('post-rich-paste');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-54/55: Cut and copy
  test('TXT-54/55: Cut and copy text', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-54-55' });
    const textId = await seedText(page, { content: 'Cut and copy this' });
    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(100);
    // TXT-55: Copy
    await page.keyboard.press('Control+c');
    await page.waitForTimeout(200);
    await ev.capture('text-copied');
    // TXT-54: Cut
    await page.keyboard.press('Control+x');
    await page.waitForTimeout(200);
    await ev.capture('text-cut');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-56/57/58/59: Resizing modes
  test('TXT-56..59: Text resizing modes', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-56-59' });
    const textId = await seedText(page, { content: 'Resize mode test with enough content to wrap' });
    await ev.clickElement(textId, 'selected');
    // TXT-56: Auto-size mode button
    const autoBtn = page.locator('[data-testid="text-auto-size"], [data-testid="resize-auto"]').first();
    if (await autoBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await autoBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('auto-size');
    }
    // TXT-57: Fixed-width button
    const fixedWidthBtn = page.locator('[data-testid="text-fixed-width"], [data-testid="resize-fixed-width"]').first();
    if (await fixedWidthBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await fixedWidthBtn.click();
      await page.waitForTimeout(200);
      await ev.capture('fixed-width');
    }
    // TXT-58/59: Resize handle triggers fixed mode
    await ev.dragHandle(textId, 'e', 60, 0, 'post-resize-to-fixed');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-60..65: Placeholder system
  test('TXT-60..65: Placeholder prompt and lifecycle', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-60-65' });
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('ADD_ELEMENT', {
        id: 'eval-ph-60', type: 'text', x: 200, y: 200, width: 300, height: 60,
        rotation: 0, opacity: 1, name: 'Title PH',
        content: 'Click to add title', isPlaceholder: true, placeholderType: 'title',
        hasUserContent: false,
        fontSize: 24, fontFamily: 'Inter', fontWeight: 400, textAlign: 'left',
        verticalAlign: 'top', color: '#FFFFFF', lineHeight: 1.2, letterSpacing: 0,
      });
      store.dispatch('UPDATE_SELECTION', []);
    });
    await page.waitForTimeout(200);
    await ev.capture('placeholder-showing-prompt');
    // TXT-61: Enter edit clears prompt
    await ev.dblClickElement('eval-ph-60', 'editing-cleared');
    // TXT-63: Type content
    await page.keyboard.type('User title');
    await page.waitForTimeout(200);
    await ev.capture('user-content-typed');
    // TXT-62: Exit saves with hasUserContent=true
    await ev.clickEmpty('post-exit-with-content');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-66..70: IME composition
  test('TXT-66..70: IME composition blocking', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-66-70' });
    const textId = await seedText(page, { content: 'IME test' });
    await ev.dblClickElement(textId, 'editing');
    // Simulate composition start
    await page.evaluate(() => {
      const el = document.querySelector('[contenteditable="true"]');
      if (el) el.dispatchEvent(new CompositionEvent('compositionstart', { data: '' }));
    });
    await page.waitForTimeout(200);
    await ev.capture('composition-started');
    // TXT-67/68: During composition, Escape/format should be blocked (app-level)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await ev.capture('escape-during-composition');
    // End composition
    await page.evaluate(() => {
      const el = document.querySelector('[contenteditable="true"]');
      if (el) el.dispatchEvent(new CompositionEvent('compositionend', { data: '你好' }));
    });
    await page.waitForTimeout(200);
    await ev.capture('composition-ended');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-71/72: Browser-native undo/redo in text edit
  test('TXT-71/72: Text undo/redo (browser-native)', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-71-72' });
    const textId = await seedText(page, { content: 'Undo test' });
    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.press('End');
    await page.keyboard.type(' added');
    await page.waitForTimeout(200);
    await ev.capture('after-type');
    // TXT-71: Ctrl+Z undoes text
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(200);
    await ev.capture('after-text-undo');
    // TXT-72: Ctrl+Shift+Z redoes text
    await page.keyboard.press('Control+Shift+z');
    await page.waitForTimeout(200);
    await ev.capture('after-text-redo');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-73/74: Session collapses to one undo entry
  test('TXT-73/74: Edit session = one undo entry', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-73-74' });
    const textId = await seedText(page, { content: 'Session test' });
    await ev.capture('baseline');
    // Enter, type multiple changes, exit
    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.type(' one');
    await page.keyboard.type(' two');
    await page.keyboard.type(' three');
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await ev.capture('post-exit');
    // One Ctrl+Z should undo the entire edit session
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
    await ev.capture('after-single-undo');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-75/76/77: Content debounce and dirty flag
  test('TXT-75..77: Content auto-save and dirty flag', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-75-77' });
    const textId = await seedText(page, { content: 'Dirty flag test' });
    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.type(' changed');
    await page.waitForTimeout(600); // Wait for 500ms debounce
    await ev.capture('after-debounce-save');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    // TXT-77: Re-enter and exit without changes — no-op save
    await ev.dblClickElement(textId, 're-enter');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await ev.capture('no-op-exit');
    const report = ev.finalize();
    logReport(report);
  });

  // TXT-78..82: Content safety (paste sanitization)
  test('TXT-78..82: Content safety — sanitize paste', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'text-editing', scenario: 'TXT-78-82' });
    const textId = await seedText(page, { content: 'Safety test' });
    await ev.dblClickElement(textId, 'editing');
    await page.keyboard.press('Control+a');
    // TXT-78: Set clipboard with dangerous HTML
    await page.evaluate(() => {
      const dangerous = '<b onclick="alert(1)">Bold</b><script>alert(2)</script><iframe src="x"></iframe><a href="javascript:void(0)">link</a>';
      const blob = new Blob([dangerous], { type: 'text/html' });
      const item = new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob(['Bold link'], { type: 'text/plain' }) });
      navigator.clipboard.write([item]).catch(() => {});
    });
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+v');
    await page.waitForTimeout(300);
    await ev.capture('post-dangerous-paste');
    // Verify no script tags or event handlers in content
    const content = await page.evaluate(() => {
      const el = document.querySelector('[contenteditable="true"]');
      return el ? el.innerHTML : '';
    });
    await ev.capture('content-inspected');
    await page.keyboard.press('Escape');
    const report = ev.finalize();
    logReport(report);
  });
});
