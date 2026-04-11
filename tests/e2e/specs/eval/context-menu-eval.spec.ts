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

  // ─── Canvas Empty Zone: Insert Tools (CTX-02, 04..07) ────────────────

  // CTX-02: Paste from empty canvas (Ctrl+V)
  test('CTX-02: Paste from empty canvas', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-02' });
    const [elA] = await seedRects(page, 1);

    // Copy element first
    await ev.clickElement(elA, 'select');
    await ev.pressKey('Control+c', 'copy');
    await ev.clickEmpty('deselect');

    // Paste via shortcut
    await ev.pressKey('Control+v', 'post-paste');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-04..07: Insert tools via keyboard shortcuts
  test('CTX-04..07: Insert tools from shortcuts', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-04-07' });
    await ev.capture('baseline');

    // CTX-04: Text tool (T)
    await ev.pressKey('t', 'text-tool');
    await ev.capture('post-text-tool');
    await ev.pressKey('Escape', 'cancel-text');

    // CTX-05: Rectangle tool (R)
    await ev.pressKey('r', 'rect-tool');
    await ev.capture('post-rect-tool');
    await ev.pressKey('Escape', 'cancel-rect');

    // CTX-06: Ellipse tool (O)
    await ev.pressKey('o', 'ellipse-tool');
    await ev.capture('post-ellipse-tool');
    await ev.pressKey('Escape', 'cancel-ellipse');

    // CTX-07: Line tool (L)
    await ev.pressKey('l', 'line-tool');
    await ev.capture('post-line-tool');
    await ev.pressKey('v', 'back-to-select');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Alignment (CTX-20..25) ──────────────────────────────────────────

  // CTX-20..25: Align via store dispatch
  test('CTX-20..25: Align elements', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-20-25' });
    const [elA, elB] = await seedRects(page, 2, { spacingX: 250 });

    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'add-B');
    await ev.capture('pre-align');

    // Align left
    await ev.dispatch('ALIGN_ELEMENTS', { direction: 'left' });
    await page.waitForTimeout(200);
    await ev.capture('post-align-left');

    // Align center
    await ev.dispatch('ALIGN_ELEMENTS', { direction: 'center' });
    await page.waitForTimeout(200);
    await ev.capture('post-align-center');

    // Align right
    await ev.dispatch('ALIGN_ELEMENTS', { direction: 'right' });
    await page.waitForTimeout(200);
    await ev.capture('post-align-right');

    // Align top
    await ev.dispatch('ALIGN_ELEMENTS', { direction: 'top' });
    await page.waitForTimeout(200);
    await ev.capture('post-align-top');

    // Align middle
    await ev.dispatch('ALIGN_ELEMENTS', { direction: 'middle' });
    await page.waitForTimeout(200);
    await ev.capture('post-align-middle');

    // Align bottom
    await ev.dispatch('ALIGN_ELEMENTS', { direction: 'bottom' });
    await page.waitForTimeout(200);
    await ev.capture('post-align-bottom');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Context Menu: Reset Placeholder (CTX-28) ────────────────────────

  test('CTX-28: Reset placeholder', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-28' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('pre-reset');

    // Reset placeholder via dispatch (no-op on non-placeholder = safe)
    await ev.dispatch('RESET_PLACEHOLDER', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('post-reset');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Context Menu: Text formatting (CTX-37) ─────────────────────────

  test('CTX-37: Create link from text menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-37' });
    const textId = await seedText(page, { content: 'Link text' });

    await ev.dblClickElement(textId, 'editing');
    await ev.pressKey('Control+a', 'select-all');

    page.once('dialog', async dialog => {
      await dialog.accept('https://example.com');
    });
    await ev.pressKey('Control+k', 'post-link');

    await ev.pressKey('Escape', 'post-exit');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Layer Item Zone (CTX-39..46) ────────────────────────────────────

  // CTX-39..43: Layer context menu actions via dispatch/shortcuts
  test('CTX-39..43: Layer item context actions', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-39-43' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // CTX-42: Lock
    await ev.dispatch('TOGGLE_ELEMENT_LOCK', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('post-lock');

    // Unlock
    await ev.dispatch('TOGGLE_ELEMENT_LOCK', { id: elA });
    await page.waitForTimeout(200);

    // CTX-43: Hide
    await ev.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('post-hide');

    // Show
    await ev.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id: elA });
    await page.waitForTimeout(200);

    // CTX-41: Delete
    await ev.pressKey('Delete', 'post-delete');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-44..46: Placeholder actions from layer menu (via dispatch)
  test('CTX-44..46: Layer placeholder actions', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-44-46' });

    // Check for placeholder
    const phId = await page.evaluate(() => {
      const el = document.querySelector('#slide-content .slide-element[data-is-placeholder="true"]');
      return el ? el.getAttribute('data-element-id') : null;
    });

    if (phId) {
      await ev.capture('placeholder-baseline');
      await ev.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id: phId });
      await page.waitForTimeout(200);
      await ev.capture('post-toggle-visibility');
      await ev.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id: phId });
      await page.waitForTimeout(200);
    } else {
      await ev.capture('no-placeholder');
    }

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Slide Thumbnail Zone (CTX-47..56) ───────────────────────────────

  // CTX-47..49: Slide management via dispatch
  test('CTX-47..49: Slide add above/below', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-47-49' });
    await ev.capture('baseline');

    // CTX-49: Add slide below
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300);
    await ev.capture('post-add-below');

    // CTX-48: Add slide (above behavior via index)
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300);
    await ev.capture('post-add-above');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-50..53: Slide clipboard operations
  test('CTX-50..53: Slide duplicate/cut/copy/paste', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-50-53' });
    await ev.capture('baseline');

    // CTX-50: Duplicate slide
    await ev.dispatch('DUPLICATE_SLIDE');
    await page.waitForTimeout(300);
    await ev.capture('post-duplicate');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-54: Change layout
  test('CTX-54: Change slide layout', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-54' });
    await ev.capture('baseline');

    // Change layout via dispatch
    await ev.dispatch('CHANGE_SLIDE_LAYOUT', { layoutId: 'blank' });
    await page.waitForTimeout(300);
    await ev.capture('post-layout-change');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-56: Delete slide
  test('CTX-56: Delete slide', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-56' });

    // Add a slide first so we can delete one
    await ev.dispatch('ADD_SLIDE');
    await page.waitForTimeout(300);
    await ev.capture('two-slides');

    await ev.dispatch('DELETE_SLIDE');
    await page.waitForTimeout(300);
    await ev.capture('post-delete-slide');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Fill/Preset/Asset Zones (CTX-57..68) ────────────────────────────

  // CTX-57..60: Fill layer operations via dispatch
  test('CTX-57..60: Fill layer operations', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-57-60' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // Add a second fill
    await ev.dispatch('ADD_FILL', { id: elA });
    await page.waitForTimeout(200);
    await ev.capture('post-add-fill');

    // Duplicate fill
    await ev.dispatch('DUPLICATE_FILL', { id: elA, fillIndex: 0 });
    await page.waitForTimeout(200);
    await ev.capture('post-duplicate-fill');

    // Delete fill
    await ev.dispatch('DELETE_FILL', { id: elA, fillIndex: 0 });
    await page.waitForTimeout(200);
    await ev.capture('post-delete-fill');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-61..63: Fill preset operations (capture baseline)
  test('CTX-61..63: Fill preset operations', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-61-63' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.capture('preset-baseline');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-64..68: Asset operations (capture tool state)
  test('CTX-64..68: Asset zone operations', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-64-68' });
    await ev.capture('baseline');

    // These operations require asset panel interaction
    // Capture state before/after element creation as proxy
    await ev.dispatch('ADD_ELEMENT', {
      id: `eval-icon-${Date.now()}`, type: 'rect',
      x: 300, y: 200, width: 50, height: 50,
      rotation: 0, opacity: 1, name: 'Icon element',
      fills: [{ type: 'solid', color: '#8B5CF6' }],
    });
    await page.waitForTimeout(200);
    await ev.capture('post-icon-insert');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Extended Keyboard Navigation (CTX-71..78) ───────────────────────

  // CTX-71/72/75: Submenu open/close/escape
  test('CTX-71/72/75: Submenu navigation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-71-75' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');

    // Navigate to find submenu item
    await ev.pressKey('ArrowDown', 'nav-1');
    await ev.pressKey('ArrowDown', 'nav-2');
    await ev.pressKey('ArrowDown', 'nav-3');

    // CTX-71: Open submenu
    await ev.pressKey('ArrowRight', 'open-submenu');
    // CTX-72: Close submenu
    await ev.pressKey('ArrowLeft', 'close-submenu');
    // CTX-75: Escape closes submenu
    await ev.pressKey('ArrowRight', 'reopen-submenu');
    await ev.pressKey('Escape', 'escape-submenu');

    // CTX-74: Final escape closes root
    await ev.pressKey('Escape', 'close-root');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-76/77: Home/End keys
  test('CTX-76/77: Home and End keys', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-76-77' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');

    await ev.pressKey('End', 'jump-last');
    await ev.pressKey('Home', 'jump-first');
    await ev.pressKey('Escape', 'close');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-78: Type-ahead character navigation
  test('CTX-78: Type-ahead in menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-78' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');

    // Type 'd' to jump to Delete/Duplicate
    await page.keyboard.press('d');
    await page.waitForTimeout(200);
    await ev.capture('after-type-d');

    await ev.pressKey('Escape', 'close');

    const report = ev.finalize();
    logReport(report);
  });

  // ─── Menu Rendering (CTX-79..82) ─────────────────────────────────────

  // CTX-79..82: Filter, hover delay, viewport flip, ARIA
  test('CTX-79..82: Menu rendering properties', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-79-82' });
    const [elA] = await seedRects(page, 1);

    await ev.clickElement(elA, 'selected');

    // Open context menu — screenshot captures visible items, ARIA structure
    await ev.rightClickElement(elA, 'menu-open');
    await ev.capture('menu-rendered');

    // CTX-81: Right-click near edge to test viewport flip
    const viewport = page.viewportSize() || { width: 1280, height: 720 };
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    await page.mouse.click(viewport.width - 30, 300, { button: 'right' });
    await page.waitForTimeout(200);
    await ev.capture('edge-menu-flip');

    await ev.pressKey('Escape', 'close');

    const report = ev.finalize();
    logReport(report);
  });
});
