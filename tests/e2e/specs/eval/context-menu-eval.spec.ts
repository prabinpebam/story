/**
 * 08 — Context Menu — Agnostic Eval Loop
 *
 * Evaluates CTX-01 through CTX-82: canvas empty menu, element menu,
 * text editing menu, layer menu, slide thumbnail menu, keyboard navigation,
 * submenu behavior, and ARIA attributes.
 *
 * Run:  npx playwright test context-menu-eval --project=chromium --headed
 */

import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages';
import { EvalSession } from '../../helpers/eval-engine';
import { seedRects, seedText, logReport } from '../../helpers/eval-seeders';

let editor: EditorPage;

test.describe('Context Menu Eval Loop', () => {
  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await page.waitForFunction(() => !!(window as any).__TEST_CANVAS_MANAGER__, null, { timeout: 10_000 });
  });

  // CTX-01: Open canvas empty menu
  test('CTX-01: Open canvas empty context menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-01' });
    await ev.capture('baseline');

    await ev.rightClickEmpty('post-right-click-empty');

    // Check menu appeared
    const menu = page.locator('[role="menu"], .context-menu');
    if (await menu.first().isVisible()) {
      await ev.capture('menu-visible');
    }

    // Close by pressing Escape
    await ev.pressKey('Escape', 'post-close-menu');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-02: Paste from empty canvas menu
  test('CTX-02: Paste from empty canvas menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-02' });
    const [elA] = await seedRects(page, 1);
    // Copy element first
    await ev.clickElement(elA, 'select');
    await ev.pressKey('Control+c', 'copy');
    // Click empty area to deselect
    await page.mouse.click(50, 50);
    await page.waitForTimeout(200);

    // Right-click empty canvas, choose Paste
    await ev.rightClickEmpty('menu-open');
    const pasteItem = page.locator('[role="menuitem"]:has-text("Paste"), .context-menu-item:has-text("Paste")').first();
    if (await pasteItem.isVisible()) {
      await pasteItem.click();
      await page.waitForTimeout(300);
    }
    await ev.capture('post-paste');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-03: Select All from canvas menu
  test('CTX-03: Select All from canvas menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-03' });
    await seedRects(page, 3);
    await page.mouse.click(50, 50);
    await page.waitForTimeout(200);

    await ev.rightClickEmpty('menu-open');
    const selectAllItem = page.locator('[role="menuitem"]:has-text("Select All"), .context-menu-item:has-text("Select All")').first();
    if (await selectAllItem.isVisible()) {
      await selectAllItem.click();
      await page.waitForTimeout(300);
    }
    await ev.capture('post-select-all');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-04..07: Insert submenu items (text, rectangle, ellipse, line)
  test('CTX-04..07: Insert tools from canvas menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-04-07' });
    await ev.capture('baseline');

    for (const toolLabel of ['Text', 'Rectangle', 'Ellipse', 'Line']) {
      await ev.rightClickEmpty(`pre-insert-${toolLabel}`);
      const insertItem = page.locator('[role="menuitem"]:has-text("Insert"), .context-menu-item:has-text("Insert")').first();
      if (await insertItem.isVisible()) {
        await insertItem.hover();
        await page.waitForTimeout(300);
        const subItem = page.locator(`[role="menuitem"]:has-text("${toolLabel}"), .context-menu-item:has-text("${toolLabel}")`).first();
        if (await subItem.isVisible()) {
          await subItem.click();
          await page.waitForTimeout(200);
        }
      }
      await ev.capture(`post-insert-${toolLabel}`);
      // Reset tool
      await ev.pressKey('Escape', `reset-${toolLabel}`);
    }

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-08: Open element context menu
  test('CTX-08: Open element context menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-08' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    await ev.rightClickElement(elA, 'post-right-click-element');

    const menu = page.locator('[role="menu"], .context-menu');
    if (await menu.first().isVisible()) {
      await ev.capture('element-menu-visible');
    }

    await ev.pressKey('Escape', 'post-close');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-09: Cut element via context menu
  test('CTX-09: Cut element from menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-09' });
    const [elA, elB] = await seedRects(page, 2);
    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');
    const cutItem = page.locator('[role="menuitem"]:has-text("Cut"), .context-menu-item:has-text("Cut")').first();
    if (await cutItem.isVisible()) {
      await cutItem.click();
      await page.waitForTimeout(300);
    }
    await ev.capture('post-cut');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-10: Copy element via context menu
  test('CTX-10: Copy element from menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-10' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');
    const copyItem = page.locator('[role="menuitem"]:has-text("Copy"), .context-menu-item:has-text("Copy")').first();
    if (await copyItem.isVisible()) {
      await copyItem.click();
      await page.waitForTimeout(300);
    }
    await ev.capture('post-copy');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-11: Paste on element via context menu
  test('CTX-11: Paste on element from menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-11' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.pressKey('Control+c', 'copy-first');
    await ev.rightClickElement(elA, 'menu-open');
    const pasteItem = page.locator('[role="menuitem"]:has-text("Paste"), .context-menu-item:has-text("Paste")').first();
    if (await pasteItem.isVisible()) {
      await pasteItem.click();
      await page.waitForTimeout(300);
    }
    await ev.capture('post-paste');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-12: Duplicate element via context menu
  test('CTX-12: Duplicate element from menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-12' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');

    // Click Duplicate menu item
    const dupItem = page.locator('[role="menuitem"]:has-text("Duplicate"), .context-menu-item:has-text("Duplicate")').first();
    if (await dupItem.isVisible()) {
      await dupItem.click();
      await page.waitForTimeout(300);
    }
    await ev.capture('post-duplicate');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-13: Delete element via context menu
  test('CTX-13: Delete element from menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-13' });
    const [elA, elB] = await seedRects(page, 2);
    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');

    const delItem = page.locator('[role="menuitem"]:has-text("Delete"), .context-menu-item:has-text("Delete")').first();
    if (await delItem.isVisible()) {
      await delItem.click();
      await page.waitForTimeout(300);
    }
    await ev.capture('post-delete');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-14/15: Group and Ungroup
  test('CTX-14/15: Group and Ungroup from menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-14-15' });
    const [elA, elB] = await seedRects(page, 2);

    // Select both
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'select-A-B');

    // Group via Ctrl+G
    await ev.pressKey('Control+g', 'post-group');

    // Right-click to ungroup
    const pos = await ev.getElementCenter(elA);
    await page.mouse.click(pos.x, pos.y, { button: 'right' });
    await page.waitForTimeout(200);

    const ungroupItem = page.locator('[role="menuitem"]:has-text("Ungroup"), .context-menu-item:has-text("Ungroup")').first();
    if (await ungroupItem.isVisible()) {
      await ungroupItem.click();
      await page.waitForTimeout(300);
    }
    await ev.capture('post-ungroup');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-16..19: Arrange z-order from context menu
  test('CTX-16..19: Arrange z-order from menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-16-19' });
    const [elA, elB, elC] = await seedRects(page, 3);
    await ev.clickElement(elA, 'selected');

    for (const label of ['Bring to Front', 'Send Backward', 'Bring Forward', 'Send to Back']) {
      await ev.rightClickElement(elA, `pre-${label}`);
      // Look for Arrange submenu first
      const arrangeItem = page.locator('[role="menuitem"]:has-text("Arrange"), .context-menu-item:has-text("Arrange")').first();
      if (await arrangeItem.isVisible()) {
        await arrangeItem.hover();
        await page.waitForTimeout(300);
      }
      const actionItem = page.locator(`[role="menuitem"]:has-text("${label}"), .context-menu-item:has-text("${label}")`).first();
      if (await actionItem.isVisible()) {
        await actionItem.click();
        await page.waitForTimeout(200);
      } else {
        await ev.pressKey('Escape', `close-${label}`);
      }
      await ev.capture(`post-${label.replace(/\s+/g, '-')}`);
    }
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-20..25: Align from context menu
  test('CTX-20..25: Align from element menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-20-25' });
    const [elA, elB] = await seedRects(page, 2);
    await ev.clickElement(elA, 'select-A');
    await ev.shiftClickElement(elB, 'select-both');

    for (const dir of ['Left', 'Center', 'Right', 'Top', 'Middle', 'Bottom']) {
      await page.mouse.click(400, 300, { button: 'right' });
      await page.waitForTimeout(200);
      const alignItem = page.locator('[role="menuitem"]:has-text("Align"), .context-menu-item:has-text("Align")').first();
      if (await alignItem.isVisible()) {
        await alignItem.hover();
        await page.waitForTimeout(300);
      }
      const dirItem = page.locator(`[role="menuitem"]:has-text("${dir}"), .context-menu-item:has-text("${dir}")`).first();
      if (await dirItem.isVisible()) {
        await dirItem.click();
        await page.waitForTimeout(200);
      } else {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);
      }
      await ev.capture(`post-align-${dir}`);
    }
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-26: Lock element from context menu
  test('CTX-26: Lock element from menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-26' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');

    const lockItem = page.locator('[role="menuitem"]:has-text("Lock"), .context-menu-item:has-text("Lock")').first();
    if (await lockItem.isVisible()) {
      await lockItem.click();
      await page.waitForTimeout(200);
    }
    await ev.capture('post-lock');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-27: Hide element from context menu
  test('CTX-27: Hide element from menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-27' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');
    const hideItem = page.locator('[role="menuitem"]:has-text("Hide"), .context-menu-item:has-text("Hide")').first();
    if (await hideItem.isVisible()) {
      await hideItem.click();
      await page.waitForTimeout(200);
    }
    await ev.capture('post-hide');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-28: Reset placeholder from context menu
  test('CTX-28: Reset placeholder from menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-28' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');
    const resetItem = page.locator('[role="menuitem"]:has-text("Reset"), .context-menu-item:has-text("Reset")').first();
    if (await resetItem.isVisible()) {
      await resetItem.click();
      await page.waitForTimeout(200);
    } else {
      await ev.pressKey('Escape', 'no-reset-option');
    }
    await ev.capture('post-reset');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-29: Open text editing context menu
  test('CTX-29: Text editing context menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-29' });
    const textId = await seedText(page, { content: 'Right-click me' });

    await ev.dblClickElement(textId, 'editing');
    await ev.rightClickElement(textId, 'post-right-click-text-edit');

    const menu = page.locator('[role="menu"], .context-menu');
    if (await menu.first().isVisible()) {
      await ev.capture('text-menu-visible');
    }
    await ev.pressKey('Escape', 'post-close');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-30..32: Cut/Copy/Paste text in text editing menu
  test('CTX-30..32: Text clipboard from menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-30-32' });
    const textId = await seedText(page, { content: 'Clipboard test text' });
    await ev.dblClickElement(textId, 'editing');
    // Select all text
    await ev.pressKey('Control+a', 'select-all');

    // Cut
    await ev.rightClickElement(textId, 'menu-for-cut');
    const cutItem = page.locator('[role="menuitem"]:has-text("Cut"), .context-menu-item:has-text("Cut")').first();
    if (await cutItem.isVisible()) { await cutItem.click(); await page.waitForTimeout(200); }
    await ev.capture('post-cut-text');

    // Paste (may be disabled due to browser clipboard restrictions)
    await ev.rightClickElement(textId, 'menu-for-paste');
    const pasteItem = page.locator('[role="menuitem"]:has-text("Paste"):not([aria-disabled="true"]), .context-menu-item:has-text("Paste"):not(.disabled)').first();
    if (await pasteItem.isVisible({ timeout: 1000 }).catch(() => false)) {
      await pasteItem.click(); await page.waitForTimeout(200);
    } else {
      await ev.pressKey('Escape', 'paste-disabled');
    }
    await ev.capture('post-paste-text');

    // Select all and Copy
    await ev.pressKey('Control+a', 'select-all-2');
    await ev.rightClickElement(textId, 'menu-for-copy');
    const copyItem = page.locator('[role="menuitem"]:has-text("Copy"), .context-menu-item:has-text("Copy")').first();
    if (await copyItem.isVisible()) { await copyItem.click(); await page.waitForTimeout(200); }
    await ev.capture('post-copy-text');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-33..36: Formatting from text editing menu
  test('CTX-33..36: Text formatting from menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-33-36' });
    const textId = await seedText(page, { content: 'Format me' });
    await ev.dblClickElement(textId, 'editing');
    await ev.pressKey('Control+a', 'select-all');

    for (const fmt of ['Bold', 'Italic', 'Underline', 'Strikethrough']) {
      await ev.rightClickElement(textId, `menu-for-${fmt}`);
      const fmtItem = page.locator(`[role="menuitem"]:has-text("${fmt}"), .context-menu-item:has-text("${fmt}")`).first();
      if (await fmtItem.isVisible()) {
        await fmtItem.click();
        await page.waitForTimeout(200);
      } else {
        await ev.pressKey('Escape', `no-${fmt}`);
      }
      await ev.capture(`post-${fmt}`);
    }
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-37: Create link from text editing menu
  test('CTX-37: Create link from text menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-37' });
    const textId = await seedText(page, { content: 'Link this' });
    await ev.dblClickElement(textId, 'editing');
    await ev.pressKey('Control+a', 'select-all');

    await ev.rightClickElement(textId, 'menu-open');
    const linkItem = page.locator('[role="menuitem"]:has-text("Link"), .context-menu-item:has-text("Link")').first();
    if (await linkItem.isVisible()) {
      await linkItem.click();
      await page.waitForTimeout(300);
    } else {
      await ev.pressKey('Escape', 'no-link-option');
    }
    await ev.capture('post-link');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-38: Exit editing from text menu
  test('CTX-38: Exit editing from text menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-38' });
    const textId = await seedText(page, { content: 'Exit me' });
    await ev.dblClickElement(textId, 'editing');

    await ev.rightClickElement(textId, 'menu-open');
    const exitItem = page.locator('[role="menuitem"]:has-text("Exit"), .context-menu-item:has-text("Exit")').first();
    if (await exitItem.isVisible()) {
      await exitItem.click();
      await page.waitForTimeout(200);
    } else {
      await ev.pressKey('Escape', 'no-exit-option');
      await ev.pressKey('Escape', 'exit-text-edit');
    }
    await ev.capture('post-exit');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-39..46: Layer item context menu
  test('CTX-39..43: Layer item context menu basics', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-39-43' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.capture('baseline');

    // Right-click layer row (actual DOM uses .layer-item with data-id)
    const layerRow = page.locator('.layer-item[data-id]').first();
    if (await layerRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await layerRow.click({ button: 'right' });
      await page.waitForTimeout(200);
      await ev.capture('layer-menu-open');

      // Try Rename
      const renameItem = page.locator('[role="menuitem"]:has-text("Rename"), .context-menu-item:has-text("Rename")').first();
      if (await renameItem.isVisible()) {
        await renameItem.click();
        await page.waitForTimeout(200);
        await ev.pressKey('Escape', 'cancel-rename');
      }
      await ev.capture('post-rename-attempt');

      // Reopen and try Lock
      await layerRow.click({ button: 'right' });
      await page.waitForTimeout(200);
      const lockItem = page.locator('[role="menuitem"]:has-text("Lock"), .context-menu-item:has-text("Lock")').first();
      if (await lockItem.isVisible()) {
        await lockItem.click();
        await page.waitForTimeout(200);
      }
      await ev.capture('post-layer-lock');

      // Reopen and try Visibility
      await layerRow.click({ button: 'right' });
      await page.waitForTimeout(200);
      const hideItem = page.locator('[role="menuitem"]:has-text("Hide"), .context-menu-item:has-text("Hide"), [role="menuitem"]:has-text("Show"), .context-menu-item:has-text("Show")').first();
      if (await hideItem.isVisible()) {
        await hideItem.click();
        await page.waitForTimeout(200);
      }
      await ev.capture('post-layer-visibility');

      // Reopen and try Delete
      await layerRow.click({ button: 'right' });
      await page.waitForTimeout(200);
      const delItem = page.locator('[role="menuitem"]:has-text("Delete"), .context-menu-item:has-text("Delete")').first();
      if (await delItem.isVisible()) {
        await delItem.click();
        await page.waitForTimeout(200);
      }
      await ev.capture('post-layer-delete');
    } else {
      await ev.capture('no-layer-panel');
    }
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-44..46: Layer placeholder actions
  test('CTX-44..46: Layer placeholder context actions', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-44-46' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const layerRow = page.locator('.layer-item[data-id]').first();
    if (await layerRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await layerRow.click({ button: 'right' });
      await page.waitForTimeout(200);
      // Look for placeholder-specific items
      const editPH = page.locator('[role="menuitem"]:has-text("Edit Placeholder"), .context-menu-item:has-text("Edit Placeholder")').first();
      const resetPH = page.locator('[role="menuitem"]:has-text("Reset to Master"), .context-menu-item:has-text("Reset to Master")').first();
      const togglePH = page.locator('[role="menuitem"]:has-text("Placeholder"), .context-menu-item:has-text("Placeholder")').first();

      if (await editPH.isVisible()) { await editPH.click(); await page.waitForTimeout(200); }
      else if (await resetPH.isVisible()) { await resetPH.click(); await page.waitForTimeout(200); }
      else if (await togglePH.isVisible()) { await togglePH.click(); await page.waitForTimeout(200); }
      else { await page.keyboard.press('Escape'); }
    }
    await ev.capture('post-placeholder-action');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-69/70: Keyboard navigation in menu
  test('CTX-69/70: Keyboard navigation in context menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-69-70' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');

    // Navigate with ArrowDown/ArrowUp
    await ev.pressKey('ArrowDown', 'post-arrow-down');
    await ev.pressKey('ArrowDown', 'post-arrow-down-2');
    await ev.pressKey('ArrowUp', 'post-arrow-up');

    // Close with Escape
    await ev.pressKey('Escape', 'post-escape');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-47: Slide thumbnail context menu
  test('CTX-47: Slide thumbnail context menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-47' });
    await ev.capture('baseline');

    // Right-click first slide thumbnail
    const thumb = page.locator('[data-testid="slide-thumbnail-0"], .slide-thumbnail').first();
    if (await thumb.isVisible()) {
      await thumb.click({ button: 'right' });
      await page.waitForTimeout(200);
      await ev.capture('slide-menu-open');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
    await ev.capture('post-close');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-48..49: Add slide above/below from slide menu
  test('CTX-48..49: Add slide above/below from thumbnail menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-48-49' });
    await ev.capture('baseline');
    const thumb = page.locator('[data-testid="slide-thumbnail-0"], .slide-thumbnail').first();

    // Add slide below
    if (await thumb.isVisible()) {
      await thumb.click({ button: 'right' });
      await page.waitForTimeout(200);
      const belowItem = page.locator('[role="menuitem"]:has-text("Below"), .context-menu-item:has-text("Below")').first();
      if (await belowItem.isVisible()) {
        await belowItem.click();
        await page.waitForTimeout(300);
      } else {
        await page.keyboard.press('Escape');
      }
    }
    await ev.capture('post-add-below');

    // Add slide above
    const thumbAgain = page.locator('[data-testid="slide-thumbnail-0"], .slide-thumbnail').first();
    if (await thumbAgain.isVisible()) {
      await thumbAgain.click({ button: 'right' });
      await page.waitForTimeout(200);
      const aboveItem = page.locator('[role="menuitem"]:has-text("Above"), .context-menu-item:has-text("Above")').first();
      if (await aboveItem.isVisible()) {
        await aboveItem.click();
        await page.waitForTimeout(300);
      } else {
        await page.keyboard.press('Escape');
      }
    }
    await ev.capture('post-add-above');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-50..53: Slide clipboard ops from thumbnail menu
  test('CTX-50..53: Slide clipboard ops from thumbnail menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-50-53' });
    const thumb = page.locator('[data-testid="slide-thumbnail-0"], .slide-thumbnail').first();

    // Duplicate slide
    if (await thumb.isVisible()) {
      await thumb.click({ button: 'right' });
      await page.waitForTimeout(200);
      const dupItem = page.locator('[role="menuitem"]:has-text("Duplicate"), .context-menu-item:has-text("Duplicate")').first();
      if (await dupItem.isVisible()) { await dupItem.click(); await page.waitForTimeout(300); }
      else { await page.keyboard.press('Escape'); }
    }
    await ev.capture('post-duplicate-slide');

    // Copy slide
    const thumb2 = page.locator('[data-testid="slide-thumbnail-0"], .slide-thumbnail').first();
    if (await thumb2.isVisible()) {
      await thumb2.click({ button: 'right' });
      await page.waitForTimeout(200);
      const copyItem = page.locator('[role="menuitem"]:has-text("Copy"), .context-menu-item:has-text("Copy")').first();
      if (await copyItem.isVisible()) { await copyItem.click(); await page.waitForTimeout(200); }
      else { await page.keyboard.press('Escape'); }
    }
    await ev.capture('post-copy-slide');

    // Paste slide
    if (await thumb2.isVisible()) {
      await thumb2.click({ button: 'right' });
      await page.waitForTimeout(200);
      const pasteItem = page.locator('[role="menuitem"]:has-text("Paste"), .context-menu-item:has-text("Paste")').first();
      if (await pasteItem.isVisible()) { await pasteItem.click(); await page.waitForTimeout(300); }
      else { await page.keyboard.press('Escape'); }
    }
    await ev.capture('post-paste-slide');

    // Cut slide
    if (await thumb2.isVisible()) {
      await thumb2.click({ button: 'right' });
      await page.waitForTimeout(200);
      const cutItem = page.locator('[role="menuitem"]:has-text("Cut"), .context-menu-item:has-text("Cut")').first();
      if (await cutItem.isVisible()) { await cutItem.click(); await page.waitForTimeout(300); }
      else { await page.keyboard.press('Escape'); }
    }
    await ev.capture('post-cut-slide');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-54: Change layout from slide menu
  test('CTX-54: Change layout from slide menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-54' });
    const thumb = page.locator('[data-testid="slide-thumbnail-0"], .slide-thumbnail').first();
    if (await thumb.isVisible()) {
      await thumb.click({ button: 'right' });
      await page.waitForTimeout(200);
      const layoutItem = page.locator('[role="menuitem"]:has-text("Layout"), .context-menu-item:has-text("Layout")').first();
      if (await layoutItem.isVisible()) {
        await layoutItem.hover();
        await page.waitForTimeout(300);
        // Click first layout option
        const layoutOption = page.locator('[role="menuitem"]').nth(1);
        if (await layoutOption.isVisible()) {
          await layoutOption.click();
          await page.waitForTimeout(300);
        }
      } else {
        await page.keyboard.press('Escape');
      }
    }
    await ev.capture('post-layout-change');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-55: Rename slide from thumbnail menu
  test('CTX-55: Rename slide from thumbnail menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-55' });
    const thumb = page.locator('[data-testid="slide-thumbnail-0"], .slide-thumbnail').first();
    if (await thumb.isVisible()) {
      await thumb.click({ button: 'right' });
      await page.waitForTimeout(200);
      const renameItem = page.locator('[role="menuitem"]:has-text("Rename"), .context-menu-item:has-text("Rename")').first();
      if (await renameItem.isVisible()) {
        await renameItem.click();
        await page.waitForTimeout(200);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);
      } else {
        await page.keyboard.press('Escape');
      }
    }
    await ev.capture('post-rename');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-56: Delete slide from thumbnail menu
  test('CTX-56: Delete slide from thumbnail menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-56' });
    // Add a second slide so we can delete one
    await page.evaluate(() => (window as any).__TEST_STORE__.dispatch({ type: 'ADD_SLIDE' }));
    await page.waitForTimeout(300);

    const thumb = page.locator('[data-testid="slide-thumbnail-1"], .slide-thumbnail').last();
    if (await thumb.isVisible()) {
      await thumb.click({ button: 'right' });
      await page.waitForTimeout(200);
      const delItem = page.locator('[role="menuitem"]:has-text("Delete"), .context-menu-item:has-text("Delete")').first();
      if (await delItem.isVisible()) {
        await delItem.click();
        await page.waitForTimeout(300);
      } else {
        await page.keyboard.press('Escape');
      }
    }
    await ev.capture('post-delete-slide');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-57..60: Fill layer context menu
  test('CTX-57..60: Fill layer context menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-57-60' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    // Look for fill layer row in property inspector
    const fillRow = page.locator('.fill-row, .fill-layer, [data-testid*="fill"]').first();
    if (await fillRow.isVisible()) {
      await fillRow.click({ button: 'right' });
      await page.waitForTimeout(200);
      await ev.capture('fill-menu-open');

      // Try Move Up, Move Down, Duplicate, Delete
      for (const action of ['Move Up', 'Move Down', 'Duplicate', 'Delete']) {
        const item = page.locator(`[role="menuitem"]:has-text("${action}"), .context-menu-item:has-text("${action}")`).first();
        if (await item.isVisible()) {
          await ev.capture(`fill-${action.replace(/\s+/g, '-')}-available`);
        }
      }
      await page.keyboard.press('Escape');
    }
    await ev.capture('post-fill-menu');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-61..63: Fill preset context menu
  test('CTX-61..63: Fill preset context menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-61-63' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    const presetItem = page.locator('.fill-preset, [data-testid*="preset"]').first();
    if (await presetItem.isVisible()) {
      await presetItem.click({ button: 'right' });
      await page.waitForTimeout(200);
      await ev.capture('preset-menu-open');
      await page.keyboard.press('Escape');
    }
    await ev.capture('post-preset-menu');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-64..65: Asset icon context menu
  test('CTX-64..65: Asset icon context menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-64-65' });
    await ev.capture('baseline');

    const iconItem = page.locator('.asset-icon, [data-testid*="icon-asset"]').first();
    if (await iconItem.isVisible()) {
      await iconItem.click({ button: 'right' });
      await page.waitForTimeout(200);
      await ev.capture('icon-menu-open');
      const insertIcon = page.locator('[role="menuitem"]:has-text("Insert"), .context-menu-item:has-text("Insert")').first();
      if (await insertIcon.isVisible()) { await insertIcon.click(); await page.waitForTimeout(200); }
      else { await page.keyboard.press('Escape'); }
    }
    await ev.capture('post-icon-menu');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-66..68: Asset image context menu
  test('CTX-66..68: Asset image context menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-66-68' });
    await ev.capture('baseline');

    const imgItem = page.locator('.asset-image, [data-testid*="image-asset"]').first();
    if (await imgItem.isVisible()) {
      await imgItem.click({ button: 'right' });
      await page.waitForTimeout(200);
      await ev.capture('image-menu-open');
      const insertImg = page.locator('[role="menuitem"]:has-text("Insert"), .context-menu-item:has-text("Insert")').first();
      if (await insertImg.isVisible()) { await insertImg.click(); await page.waitForTimeout(200); }
      else { await page.keyboard.press('Escape'); }
    }
    await ev.capture('post-image-menu');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-71..75: Submenu keyboard nav
  test('CTX-71..75: Submenu keyboard navigation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-71-75' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');

    // Navigate to item with submenu (Arrange or Align)
    await ev.pressKey('ArrowDown', 'nav-down');
    await ev.pressKey('ArrowDown', 'nav-down-2');
    await ev.pressKey('ArrowDown', 'nav-down-3');
    // Try opening submenu
    await ev.pressKey('ArrowRight', 'open-submenu');
    await ev.capture('submenu-open');

    // Close submenu
    await ev.pressKey('ArrowLeft', 'close-submenu');
    await ev.capture('submenu-closed');

    // Escape closes submenu only if open
    await ev.pressKey('ArrowRight', 'reopen-submenu');
    await ev.pressKey('Escape', 'escape-submenu');
    await ev.capture('after-escape-submenu');

    // Escape closes root
    await ev.pressKey('Escape', 'escape-root');
    await ev.capture('menu-fully-closed');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-73: Activate menu item with Enter
  test('CTX-73: Activate item with Enter', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-73' });
    const [elA, elB] = await seedRects(page, 2);
    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');

    // Nav to Duplicate and press Enter
    const items = page.locator('[role="menuitem"]:not([aria-disabled="true"]), .context-menu-item:not(.disabled)');
    const count = await items.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      await ev.pressKey('ArrowDown', `nav-${i}`);
    }
    await ev.pressKey('Enter', 'activate');
    await ev.capture('post-enter-activate');

    const report = ev.finalize();
    logReport(report);
  });

  // CTX-76..77: Home/End keys in menu
  test('CTX-76..77: Home/End keys in menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-76-77' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');

    await ev.pressKey('End', 'jump-to-last');
    await ev.capture('after-end');
    await ev.pressKey('Home', 'jump-to-first');
    await ev.capture('after-home');

    await ev.pressKey('Escape', 'close');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-78: Type-ahead in menu
  test('CTX-78: Type-ahead character navigation', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-78' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');

    // Type 'd' to jump to Delete/Duplicate
    await page.keyboard.press('d');
    await page.waitForTimeout(200);
    await ev.capture('after-type-d');
    // Type 'd' again to cycle
    await page.keyboard.press('d');
    await page.waitForTimeout(200);
    await ev.capture('after-type-d-2');

    await ev.pressKey('Escape', 'close');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-79: Filter invisible items
  test('CTX-79: Menu filters invisible items', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-79' });
    // Open canvas empty menu — items with visible:false should be filtered
    await ev.rightClickEmpty('menu-open');
    const menu = page.locator('[role="menu"], .context-menu').first();
    if (await menu.isVisible()) {
      // Count visible items vs separators
      const items = menu.locator('[role="menuitem"], .context-menu-item');
      const separators = menu.locator('[role="separator"], .context-menu-separator');
      await ev.capture('menu-structure');
    }
    await ev.pressKey('Escape', 'close');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-80: Submenu hover delay
  test('CTX-80: Submenu hover delay', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-80' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');

    // Find item with submenu (Arrange/Align)
    const arrangeItem = page.locator('[role="menuitem"][aria-haspopup="true"], [role="menuitem"]:has-text("Arrange"), .context-menu-item:has-text("Arrange")').first();
    if (await arrangeItem.isVisible()) {
      await arrangeItem.hover();
      await ev.capture('hover-start');
      await page.waitForTimeout(400);
      await ev.capture('after-hover-delay');
    }
    await ev.pressKey('Escape', 'close');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-81: Viewport flip
  test('CTX-81: Viewport flip for overflow', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-81' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');

    // Right-click near right edge to trigger potential flip
    const viewport = page.viewportSize() || { width: 1280, height: 720 };
    await page.mouse.click(viewport.width - 50, 300, { button: 'right' });
    await page.waitForTimeout(200);
    await ev.capture('edge-menu-open');

    const menu = page.locator('[role="menu"], .context-menu').first();
    if (await menu.isVisible()) {
      const box = await menu.boundingBox();
      if (box) {
        await ev.capture(`menu-at-x${Math.round(box.x)}`);
      }
    }
    await ev.pressKey('Escape', 'close');
    const report = ev.finalize();
    logReport(report);
  });

  // CTX-82: ARIA attributes
  test('CTX-82: ARIA attributes on context menu', async ({ page }) => {
    const ev = new EvalSession(page, { category: 'context-menu', scenario: 'CTX-82' });
    const [elA] = await seedRects(page, 1);
    await ev.clickElement(elA, 'selected');
    await ev.rightClickElement(elA, 'menu-open');

    // Check ARIA roles
    const menu = page.locator('[role="menu"]').first();
    const menuItems = page.locator('[role="menuitem"]');
    const separators = page.locator('[role="separator"]');

    const menuVisible = await menu.isVisible().catch(() => false);
    const itemCount = await menuItems.count();
    const sepCount = await separators.count();
    await ev.capture(`aria-menu=${menuVisible}-items=${itemCount}-seps=${sepCount}`);

    // Check for disabled items
    const disabledItems = page.locator('[role="menuitem"][aria-disabled="true"]');
    const disabledCount = await disabledItems.count();
    await ev.capture(`disabled-items=${disabledCount}`);

    // Check for submenu indicators
    const hasPopup = page.locator('[role="menuitem"][aria-haspopup="true"]');
    const popupCount = await hasPopup.count();
    await ev.capture(`haspopup-items=${popupCount}`);

    await ev.pressKey('Escape', 'close');
    const report = ev.finalize();
    logReport(report);
  });
});
