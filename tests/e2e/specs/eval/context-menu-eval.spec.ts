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
});
