/**
 * Eval Loop: Context Menu (CTX-01 → CTX-28)
 */

import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture,
  waitForCanvasManager,
  assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Context Menu', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  async function seedRect(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-ctx-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x: 300, y: 300, width: 200, height: 150,
        rotation: 0, opacity: 1, name: 'Eval Ctx Rect',
        fills: [{ type: 'solid', color: '#4A90D9' }],
      });
      store.dispatch('UPDATE_SELECTION', [id]);
      return id;
    });
  }

  async function worldToScreen(page: import('@playwright/test').Page, wx: number, wy: number) {
    return page.evaluate(({ wx, wy }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const { zoom, pan } = s.editor;
      const c = document.getElementById('canvas-container');
      if (!c) return null;
      const r = c.getBoundingClientRect();
      return { x: r.left + wx * zoom + pan.x, y: r.top + wy * zoom + pan.y };
    }, { wx, wy });
  }

  // ─── CTX-01: Open on empty canvas ─────────────────────────────────────────
  test('CTX-01: Right-click empty canvas shows context menu', async ({ page }) => {
    const bounds = await page.locator('#interaction-canvas').boundingBox();
    if (!bounds) throw new Error('No canvas');

    await page.mouse.click(bounds.x + 15, bounds.y + 15, { button: 'right' });
    await page.waitForTimeout(200);

    // Check that context menu appeared
    const menuVisible = await page.evaluate(() => {
      const menu = document.querySelector('.context-menu');
      return menu ? getComputedStyle(menu).display !== 'none' : false;
    });
    expect(menuVisible).toBe(true);

    const snap = await capture(page, 'ctx-empty-canvas');
    assertNoCriticalAnomalies(snap);
  });

  // ─── CTX-02: Open on selected element ─────────────────────────────────────
  test('CTX-02: Right-click element shows element context menu', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    const coords = await worldToScreen(page, 400, 375);
    if (!coords) throw new Error('No coords');

    await page.mouse.click(coords.x, coords.y, { button: 'right' });
    await page.waitForTimeout(200);

    const menuVisible = await page.evaluate(() => {
      const menu = document.querySelector('.context-menu');
      return menu ? getComputedStyle(menu).display !== 'none' : false;
    });
    expect(menuVisible).toBe(true);

    const snap = await capture(page, 'ctx-element');
    assertNoCriticalAnomalies(snap);
  });

  // ─── CTX-05: Close by click outside ───────────────────────────────────────
  test('CTX-05: Click outside closes context menu', async ({ page }) => {
    const bounds = await page.locator('#interaction-canvas').boundingBox();
    if (!bounds) throw new Error('No canvas');

    // Open menu
    await page.mouse.click(bounds.x + 15, bounds.y + 15, { button: 'right' });
    await page.waitForTimeout(200);

    // Click elsewhere to close
    await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.waitForTimeout(200);

    const menuVisible = await page.evaluate(() => {
      const menu = document.querySelector('.context-menu');
      if (!menu) return false;
      return getComputedStyle(menu).display !== 'none';
    });
    expect(menuVisible).toBe(false);
  });

  // ─── CTX-06: Close by escape ──────────────────────────────────────────────
  test('CTX-06: Escape closes context menu', async ({ page }) => {
    const bounds = await page.locator('#interaction-canvas').boundingBox();
    if (!bounds) throw new Error('No canvas');

    await page.mouse.click(bounds.x + 15, bounds.y + 15, { button: 'right' });
    await page.waitForTimeout(200);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    const menuVisible = await page.evaluate(() => {
      const menu = document.querySelector('.context-menu');
      if (!menu) return false;
      return getComputedStyle(menu).display !== 'none';
    });
    expect(menuVisible).toBe(false);
  });

  // ─── CTX-14: Duplicate ────────────────────────────────────────────────────
  test('CTX-14: Duplicate via Ctrl+D', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    const countBefore = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return (slide.elementOrder || []).length;
    });

    // Click element to ensure it is selected
    const coords = await worldToScreen(page, 400, 375);
    if (coords) await page.mouse.click(coords.x, coords.y);
    await page.waitForTimeout(100);

    await page.keyboard.press('Control+d');
    await page.waitForTimeout(200);

    const countAfter = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return (slide.elementOrder || []).length;
    });
    expect(countAfter).toBe(countBefore + 1);

    const snap = await capture(page, 'after-duplicate');
    assertNoCriticalAnomalies(snap);
  });

  // ─── CTX-15: Delete ───────────────────────────────────────────────────────
  test('CTX-15: Delete element with Delete key', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    const coords = await worldToScreen(page, 400, 375);
    if (coords) await page.mouse.click(coords.x, coords.y);
    await page.waitForTimeout(100);

    const countBefore = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return (slide.elementOrder || []).length;
    });

    await page.keyboard.press('Delete');
    await page.waitForTimeout(200);

    const countAfter = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return (slide.elementOrder || []).length;
    });
    expect(countAfter).toBe(countBefore - 1);

    const snap = await capture(page, 'after-delete');
    assertNoCriticalAnomalies(snap);
  });

  // ─── CTX-20: Group ────────────────────────────────────────────────────────
  test('CTX-20: Group with Ctrl+G', async ({ page }) => {
    // Seed two elements
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const s = Date.now().toString(36);
      store.dispatch('ADD_ELEMENT', { id: `g1-${s}`, type: 'rect', x: 100, y: 100, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#50C878' }] });
      store.dispatch('ADD_ELEMENT', { id: `g2-${s}`, type: 'rect', x: 200, y: 100, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#9B59B6' }] });
      store.dispatch('UPDATE_SELECTION', [`g1-${s}`, `g2-${s}`]);
    });
    await page.waitForTimeout(200);

    await page.keyboard.press('Control+g');
    await page.waitForTimeout(200);

    // Check that a group was created
    const hasGroup = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return Object.values(slide.elements).some((el: any) => el.type === 'group');
    });
    expect(hasGroup).toBe(true);

    const snap = await capture(page, 'after-group');
    assertNoCriticalAnomalies(snap);
  });

  // ─── CTX-21: Ungroup ──────────────────────────────────────────────────────
  test('CTX-21: Ungroup with Ctrl+Shift+G', async ({ page }) => {
    // Seed two elements and group them
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const s = Date.now().toString(36);
      store.dispatch('ADD_ELEMENT', { id: `ug1-${s}`, type: 'rect', x: 100, y: 100, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#50C878' }] });
      store.dispatch('ADD_ELEMENT', { id: `ug2-${s}`, type: 'rect', x: 200, y: 100, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#9B59B6' }] });
      store.dispatch('UPDATE_SELECTION', [`ug1-${s}`, `ug2-${s}`]);
      store.dispatch('GROUP_ELEMENTS');
    });
    await page.waitForTimeout(200);

    await page.keyboard.press('Control+Shift+g');
    await page.waitForTimeout(200);

    // Check no groups remain
    const groupCount = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return Object.values(slide.elements).filter((el: any) => el.type === 'group').length;
    });
    expect(groupCount).toBe(0);

    const snap = await capture(page, 'after-ungroup');
    assertNoCriticalAnomalies(snap);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: No anomalies during context menu lifecycle', async ({ page }) => {
    await seedRect(page);
    await page.waitForTimeout(200);

    const coords = await worldToScreen(page, 400, 375);
    if (!coords) throw new Error('No coords');

    // Open menu
    await page.mouse.click(coords.x, coords.y, { button: 'right' });
    await page.waitForTimeout(200);
    const snap1 = await capture(page, 'menu-open');
    assertNoCriticalAnomalies(snap1);

    // Close menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const snap2 = await capture(page, 'menu-closed');
    assertNoCriticalAnomalies(snap2);
  });
});
