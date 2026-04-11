/**
 * 08 — Context Menu — Agnostic Eval Loop
 *
 * Evaluates CTX-01 through CTX-82: context menu actions across all zones.
 *
 * Agnostic approach: Every context menu action has a keyboard shortcut
 * equivalent. The eval uses shortcuts as triggers (same store effect).
 * Right-click is used to observe menu open/close via screenshots.
 * The engine's detectors verify state changes from the actions.
 *
 * Scene: 1–2 rects per test. Critical state: element existence,
 * selectedElementIds, elementOrder, locked/hidden flags.
 *
 * Run:  npx playwright test context-menu-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, seedText, seedGroup, clearSelection, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Context Menu Eval Loop', () => {
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

  // ─── Canvas Empty Zone (CTX-01..07) ──────────────────────────────────

  // CTX-01: Right-click empty canvas opens menu (screenshot captures it)
  test('CTX-01: Open canvas empty menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-01' });
    await ev.capture('baseline');
    await ev.rightClickEmpty('post-right-click');
    // Close menu
    await ev.pressKey('Escape', 'post-close');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-03: Select all from canvas (shortcut equivalent)
  test('CTX-03: Select all from canvas', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-03' });
    const [elA, elB] = await seedRects(page, 2);

    await ev.clickEmpty('deselect');
    await ev.capture('pre-select-all');
    await ev.selectAll('post-select-all');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Canvas Element Zone (CTX-08..28) ────────────────────────────────

  // CTX-08: Right-click element opens element menu
  test('CTX-08: Open element context menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-08' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'post-right-click');
    await ev.pressKey('Escape', 'post-close');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-09/10/11: Cut, Copy, Paste (via shortcuts)
  test('CTX-09..11: Cut, Copy, Paste elements', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-09-11' });
    const [elA, elB] = await seedRects(page, 2);

    // CTX-10: Copy
    await ev.clickElement(elA, 'select-A');
    await ev.pressKey('Control+c', 'post-copy');

    // CTX-11: Paste
    await ev.pressKey('Control+v', 'post-paste');

    // CTX-09: Cut
    await ev.clickElement(elB, 'select-B');
    await ev.pressKey('Control+x', 'post-cut');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-12: Duplicate element
  test('CTX-12: Duplicate element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-12' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-duplicate');
    await ev.pressKey('Control+d', 'post-duplicate');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-13: Delete element
  test('CTX-13: Delete element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-13' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-delete');
    await ev.pressKey('Delete', 'post-delete');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-14/15: Group and Ungroup
  test('CTX-14/15: Group and Ungroup', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-14-15' });
    const [elA, elB] = await seedRects(page, 2);

    // Select both
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'add-B');
    await ev.capture('pre-group');

    // CTX-14: Group
    await ev.pressKey('Control+g', 'post-group');

    // CTX-15: Ungroup
    await ev.pressKey('Control+Shift+g', 'post-ungroup');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-16..19: Z-order arrange (via shortcuts)
  test('CTX-16..19: Arrange z-order', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-16-19' });
    const [elA, elB, elC] = await seedRects(page, 3);

    await ev.clickElement(elA, 'select-A');
    await ev.capture('pre-arrange');

    // CTX-16: Bring to front
    await ev.pressKey('Control+Shift+]', 'post-bring-front');
    // CTX-18: Send backward
    await ev.pressKey('Control+[', 'post-send-backward');
    // CTX-17: Bring forward
    await ev.pressKey('Control+]', 'post-bring-forward');
    // CTX-19: Send to back
    await ev.pressKey('Control+Shift+[', 'post-send-back');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-26: Lock/Unlock element
  test('CTX-26: Lock element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-26' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-lock');

    // Lock via dispatch (shortcut Ctrl+Shift+L)
    await ev.dispatch('TOGGLE_ELEMENT_LOCK', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('post-lock');

    // Unlock
    await ev.dispatch('TOGGLE_ELEMENT_LOCK', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('post-unlock');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-27: Hide/Show element
  test('CTX-27: Hide element', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-27' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-hide');

    await ev.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('post-hide');

    // Show again
    await ev.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('post-show');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Text Editing Zone (CTX-29..38) ──────────────────────────────────

  // CTX-29: Right-click in text edit opens text-specific menu
  test('CTX-29: Text editing context menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-29' });
    const textId = await seedText(page, { content: 'Right-click me' });

    await ev.dblClickElement(textId, 'editing');
    await ev.rightClickElement(textId, 'post-right-click');
    await ev.pressKey('Escape', 'close-menu');
    await ev.pressKey('Escape', 'exit-edit');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-30..32: Cut/Copy/Paste text in edit mode (via shortcuts)
  test('CTX-30..32: Text clipboard shortcuts', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-30-32' });
    const textId = await seedText(page, { content: 'Clipboard text' });

    await ev.dblClickElement(textId, 'editing');
    await ev.pressKey('Control+a', 'select-all');

    // CTX-31: Copy
    await ev.pressKey('Control+c', 'post-copy');
    // CTX-30: Cut
    await ev.pressKey('Control+x', 'post-cut');
    // CTX-32: Paste
    await ev.pressKey('Control+v', 'post-paste');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-33..36: Text formatting from menu (via shortcuts)
  test('CTX-33..36: Text formatting shortcuts', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-33-36' });
    const textId = await seedText(page, { content: 'Format me' });

    await ev.dblClickElement(textId, 'editing');
    await ev.pressKey('Control+a', 'select-all');

    await ev.pressKey('Control+b', 'post-bold');
    await ev.pressKey('Control+i', 'post-italic');
    await ev.pressKey('Control+u', 'post-underline');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-38: Exit editing from menu (Escape)
  test('CTX-38: Exit editing via Escape', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-38' });
    const textId = await seedText(page, { content: 'Exit me' });

    await ev.dblClickElement(textId, 'editing');
    await ev.capture('in-edit');
    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Keyboard Navigation (CTX-69..78) ────────────────────────────────

  // CTX-69/70/73/74: Arrow nav, Enter activate, Escape close
  test('CTX-69..74: Keyboard navigation in menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-69-74' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');

    // CTX-69: Arrow down
    await ev.pressKey('ArrowDown', 'nav-down');
    await ev.pressKey('ArrowDown', 'nav-down-2');
    // CTX-70: Arrow up
    await ev.pressKey('ArrowUp', 'nav-up');
    // CTX-74: Escape closes
    await ev.pressKey('Escape', 'post-close');

    const report = ev.finalize();
    logReport(report);
  });
});
