/**
 * 29 — Keyboard Shortcuts — Agnostic Eval Loop
 *
 * Evaluates KEY-01 through KEY-58: tool shortcuts, edit shortcuts,
 * arrange shortcuts, view shortcuts, and input blocking.
 *
 * Run:  npx playwright test keyboard-shortcuts-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, seedText, getState, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Keyboard Shortcuts Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // KEY-01..09: Tool switching shortcuts
  test('KEY-01..05: Tool shortcuts V/H/T/R/O', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'keyboard-shortcuts', scenario: 'KEY-01-05' });
    await ev.capture('baseline');

    // Select tool
    await ev.pressKey('v', 'tool-select');
    const s1 = await getState(page);
    await ev.capture('select-tool');

    // Hand tool
    await ev.pressKey('h', 'tool-hand');
    await ev.capture('hand-tool');

    // Text tool
    await ev.pressKey('t', 'tool-text');
    await ev.capture('text-tool');

    // Rectangle tool
    await ev.pressKey('r', 'tool-rectangle');
    await ev.capture('rectangle-tool');

    // Ellipse tool
    await ev.pressKey('o', 'tool-ellipse');
    await ev.capture('ellipse-tool');

    // Back to select
    await ev.pressKey('v', 'back-to-select');

    const report = ev.finalize();
    logReport(report);
  });

  // KEY-06/07: Line and arrow tools
  test('KEY-06/07: Line and arrow tools L / Shift+L', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'keyboard-shortcuts', scenario: 'KEY-06-07' });

    await ev.pressKey('l', 'tool-line');
    await ev.capture('line-tool');

    await page.keyboard.press('Shift+l');
    await page.waitForTimeout(200);
    await ev.capture('arrow-tool');

    await ev.pressKey('v', 'back-to-select');
    const report = ev.finalize();
    logReport(report);
  });

  // KEY-10/11: Undo/Redo
  test('KEY-10/11: Undo and Redo', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'keyboard-shortcuts', scenario: 'KEY-10-11' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-delete');

    // Delete then undo
    await page.keyboard.press('Delete');
    await page.waitForTimeout(200);
    await ev.capture('post-delete');

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
    await ev.capture('post-undo');

    await page.keyboard.press('Control+Shift+z');
    await page.waitForTimeout(300);
    await ev.capture('post-redo');

    const report = ev.finalize();
    logReport(report);
  });

  // KEY-12..17: Cut/Copy/Paste/Duplicate/Delete
  test('KEY-12..17: Clipboard and delete shortcuts', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'keyboard-shortcuts', scenario: 'KEY-12-17' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('selected');

    // Duplicate
    await page.keyboard.press('Control+d');
    await page.waitForTimeout(300);
    await ev.capture('post-duplicate');

    // Select all
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(200);
    await ev.capture('select-all');

    // Copy
    await page.keyboard.press('Control+c');
    await page.waitForTimeout(200);
    
    // Delete all
    await page.keyboard.press('Delete');
    await page.waitForTimeout(200);
    await ev.capture('post-delete-all');

    // Paste
    await page.keyboard.press('Control+v');
    await page.waitForTimeout(300);
    await ev.capture('post-paste');

    const report = ev.finalize();
    logReport(report);
  });

  // KEY-18/19: Select All / Deselect
  test('KEY-18/19: Select all and Escape deselect', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'keyboard-shortcuts', scenario: 'KEY-18-19' });
    await seedRects(page, 3);
    await ev.capture('elements-seeded');

    await page.keyboard.press('Control+a');
    await page.waitForTimeout(200);
    await ev.capture('all-selected');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await ev.capture('all-deselected');

    const report = ev.finalize();
    logReport(report);
  });

  // KEY-20..23: Z-order arrange shortcuts
  test('KEY-20..23: Arrange z-order shortcuts', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'keyboard-shortcuts', scenario: 'KEY-20-23' });
    const [elA, elB] = await seedRects(page, 2);
    await ev.clickElement(elA, 'selected-A');
    await ev.capture('base-order');

    // Bring to front
    await page.keyboard.press('Control+Shift+]');
    await page.waitForTimeout(200);
    await ev.capture('bring-to-front');

    // Send to back
    await page.keyboard.press('Control+Shift+[');
    await page.waitForTimeout(200);
    await ev.capture('send-to-back');

    // Bring forward
    await page.keyboard.press('Control+]');
    await page.waitForTimeout(200);
    await ev.capture('bring-forward');

    // Send backward
    await page.keyboard.press('Control+[');
    await page.waitForTimeout(200);
    await ev.capture('send-backward');

    const report = ev.finalize();
    logReport(report);
  });

  // KEY-24/25: Group / Ungroup
  test('KEY-24/25: Group and Ungroup shortcuts', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'keyboard-shortcuts', scenario: 'KEY-24-25' });
    await seedRects(page, 2);
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(200);
    await ev.capture('both-selected');

    // Group
    await page.keyboard.press('Control+g');
    await page.waitForTimeout(300);
    await ev.capture('grouped');

    // Ungroup
    await page.keyboard.press('Control+Shift+g');
    await page.waitForTimeout(300);
    await ev.capture('ungrouped');

    const report = ev.finalize();
    logReport(report);
  });

  // KEY-26: Lock element
  test('KEY-26: Lock element shortcut', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'keyboard-shortcuts', scenario: 'KEY-26' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-lock');

    await page.keyboard.press('Control+l');
    await page.waitForTimeout(300);
    await ev.capture('locked');

    const report = ev.finalize();
    logReport(report);
  });

  // KEY-28..31: Zoom shortcuts
  test('KEY-28..31: Zoom in/out/fit/actual', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'keyboard-shortcuts', scenario: 'KEY-28-31' });
    await ev.capture('baseline-zoom');

    // Zoom in
    await page.keyboard.press('Control+=');
    await page.waitForTimeout(300);
    await ev.capture('zoom-in');

    // Zoom out
    await page.keyboard.press('Control+-');
    await page.waitForTimeout(300);
    await ev.capture('zoom-out');

    // Fit to screen
    await page.keyboard.press('Control+0');
    await page.waitForTimeout(300);
    await ev.capture('fit-screen');

    // Actual size
    await page.keyboard.press('Control+1');
    await page.waitForTimeout(300);
    await ev.capture('actual-size');

    const report = ev.finalize();
    logReport(report);
  });

  // KEY-39..43: Slide management shortcuts
  test('KEY-39..43: Slide shortcuts', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'keyboard-shortcuts', scenario: 'KEY-39-43' });
    await ev.capture('one-slide');

    // New slide
    await page.keyboard.press('Control+m');
    await page.waitForTimeout(400);
    await ev.capture('new-slide');

    // Duplicate slide
    await page.keyboard.press('Control+Shift+d');
    await page.waitForTimeout(400);
    await ev.capture('duplicate-slide');

    const report = ev.finalize();
    logReport(report);
  });

  // KEY-49..52: Text formatting shortcuts
  test('KEY-49..52: Bold/Italic/Underline/Strike in text edit', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'keyboard-shortcuts', scenario: 'KEY-49-52' });
    const textId = await seedText(page, 'Hello World');
    await ev.capture('text-seeded');

    // Double-click to enter text edit
    await ev.dblClickElement(textId, 'enter-edit');
    await page.waitForTimeout(400);

    // Select all text inside
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(200);

    // Bold
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(200);
    await ev.capture('bold-applied');

    // Italic
    await page.keyboard.press('Control+i');
    await page.waitForTimeout(200);
    await ev.capture('italic-applied');

    // Underline
    await page.keyboard.press('Control+u');
    await page.waitForTimeout(200);
    await ev.capture('underline-applied');

    // Strikethrough
    await page.keyboard.press('Control+Shift+x');
    await page.waitForTimeout(200);
    await ev.capture('strikethrough-applied');

    const report = ev.finalize();
    logReport(report);
  });

  // KEY-58: Input blocking — shortcuts blocked when focused on input
  test('KEY-58: Shortcuts blocked in input fields', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'keyboard-shortcuts', scenario: 'KEY-58' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-input-focus');

    // Find any number input in the property inspector
    const numInput = page.locator('[data-testid*="input"], .property-inspector input').first();
    if (await numInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await numInput.click();
      await page.waitForTimeout(200);

      // Press 'r' — should NOT switch to rectangle tool
      await page.keyboard.press('r');
      await page.waitForTimeout(200);
      await ev.capture('r-pressed-in-input');
    }

    const report = ev.finalize();
    logReport(report);
  });
});
