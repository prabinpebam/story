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
});
