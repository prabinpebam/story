/**
 * 25 — Presentation Mode — Agnostic Eval Loop
 *
 * Evaluates PRS-01 through PRS-50: entry/exit, navigation, builds,
 * screen overlays, grid view, kiosk mode, and presenter view.
 *
 * Run:  npx playwright test presentation-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage, PresentationPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;
let presentation: PresentationPage;

test.describe('Presentation Mode Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    presentation = new PresentationPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // PRS-01/02: Enter and exit presentation
  test('PRS-01/02: Enter and exit presentation mode', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'presentation', scenario: 'PRS-01-02' });
    await seedRects(page, 2);
    await ev.capture('edit-mode');

    await editor.startPresentation();
    await page.waitForTimeout(1000);
    await ev.capture('presentation-mode');

    await presentation.exitWithKeyboard();
    await page.waitForTimeout(500);
    await ev.capture('back-to-edit');

    const report = ev.finalize();
    logReport(report);
  });

  // PRS-05/06: Navigation (Right/Left)
  test('PRS-05/06: Navigate with arrow keys', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'presentation', scenario: 'PRS-05-06' });

    // Add multiple slides
    await editor.addSlide();
    await editor.addSlide();
    await page.waitForTimeout(300);

    await editor.startPresentation();
    await page.waitForTimeout(1000);
    await ev.capture('slide-1');

    await presentation.nextWithKeyboard();
    await ev.capture('slide-2');

    await presentation.nextWithKeyboard();
    await ev.capture('slide-3');

    await presentation.prevWithKeyboard();
    await ev.capture('back-to-slide-2');

    await presentation.exitWithKeyboard();
    await page.waitForTimeout(500);

    const report = ev.finalize();
    logReport(report);
  });

  // PRS-22: Toggle black screen
  test('PRS-22: Toggle black screen', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'presentation', scenario: 'PRS-22' });

    await editor.startPresentation();
    await page.waitForTimeout(1000);
    await ev.capture('presenting');

    // Press 'b' for black screen
    await page.keyboard.press('b');
    await page.waitForTimeout(300);
    await ev.capture('black-screen');

    // Press 'b' again to exit
    await page.keyboard.press('b');
    await page.waitForTimeout(300);
    await ev.capture('black-screen-off');

    await presentation.exitWithKeyboard();
    await page.waitForTimeout(500);

    const report = ev.finalize();
    logReport(report);
  });

  // PRS-25: Toggle grid view
  test('PRS-25: Toggle grid view', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'presentation', scenario: 'PRS-25' });

    await editor.addSlide();
    await editor.addSlide();
    await page.waitForTimeout(300);

    await editor.startPresentation();
    await page.waitForTimeout(1000);

    // Press 'g' for grid
    await page.keyboard.press('g');
    await page.waitForTimeout(500);
    await ev.capture('grid-view');

    // Close grid
    await page.keyboard.press('g');
    await page.waitForTimeout(300);
    await ev.capture('grid-closed');

    await presentation.exitWithKeyboard();
    await page.waitForTimeout(500);

    const report = ev.finalize();
    logReport(report);
  });

  // PRS-07/08: Jump to first/last slide
  test('PRS-07/08: Jump to first and last slide', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'presentation', scenario: 'PRS-07-08' });

    await editor.addSlide();
    await editor.addSlide();
    await page.waitForTimeout(300);

    await editor.startPresentation();
    await page.waitForTimeout(1000);

    // Go to last slide
    await page.keyboard.press('End');
    await page.waitForTimeout(300);
    await ev.capture('last-slide');

    // Go to first slide
    await page.keyboard.press('Home');
    await page.waitForTimeout(300);
    await ev.capture('first-slide');

    await presentation.exitWithKeyboard();
    await page.waitForTimeout(500);

    const report = ev.finalize();
    logReport(report);
  });
});
