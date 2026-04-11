/**
 * Eval Loop: Element Creation (CRE-01 → CRE-14)
 */

import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';
import {
  capture,
  bracket,
  waitForCanvasManager,
  assertNoCriticalAnomalies,
  assertSelection,
  Snapshot,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Element Creation', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  /** Count slide elements in store */
  async function getElementCount(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return (slide.elementOrder || []).length;
    });
  }

  /** Get latest element (last in elementOrder) */
  async function getLatestElement(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      const order = slide.elementOrder || [];
      if (order.length === 0) return null;
      const id = order[order.length - 1];
      const el = slide.elements[id];
      return el ? { id: el.id, type: el.type, x: el.x, y: el.y, width: el.width, height: el.height, shapeKind: el.shapeKind } : null;
    });
  }

  /** Get active tool info */
  async function getActiveTool(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return {
        tool: s.editor.activeTool,
        options: s.editor.activeToolOptions || null,
      };
    });
  }

  /** Get screen coords for world-space canvas center */
  async function getCanvasCenter(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const { zoom, pan } = s.editor;
      const c = document.getElementById('canvas-container');
      if (!c) return null;
      const r = c.getBoundingClientRect();
      // Center of slide (960, 540 for 1920x1080)
      const worldX = 960;
      const worldY = 540;
      return {
        x: r.left + worldX * zoom + pan.x,
        y: r.top + worldY * zoom + pan.y,
      };
    });
  }

  // ─── CRE-01: Create rectangle (drag) ────────────────────────────────────────
  test('CRE-01: Create rectangle via R tool + drag', async ({ page }) => {
    const countBefore = await getElementCount(page);

    // Activate rectangle tool by pressing R
    await page.keyboard.press('r');
    await page.waitForTimeout(100);

    const tool = await getActiveTool(page);
    expect(tool.tool).toBe('shape');

    // Drag on canvas to create element (drag > 5px required)
    await canvas.drag(0.35, 0.35, 0.55, 0.55);
    await page.waitForTimeout(300);

    const countAfter = await getElementCount(page);
    expect(countAfter).toBe(countBefore + 1);

    // Tool should have auto-switched to select
    const toolAfter = await getActiveTool(page);
    expect(toolAfter.tool).toBe('select');

    const snap = await capture(page, 'after-rect-drag-create');
    assertNoCriticalAnomalies(snap);
  });

  // ─── CRE-02: Create rectangle (drag) ──────────────────────────────────────
  test('CRE-02: Create rectangle via drag', async ({ page }) => {
    const countBefore = await getElementCount(page);

    await page.keyboard.press('r');
    await page.waitForTimeout(100);

    // Drag a box on the canvas
    await canvas.drag(0.3, 0.3, 0.5, 0.5);
    await page.waitForTimeout(200);

    const countAfter = await getElementCount(page);
    expect(countAfter).toBe(countBefore + 1);

    const latest = await getLatestElement(page);
    expect(latest).not.toBeNull();
    expect(latest!.width).toBeGreaterThanOrEqual(50);
    expect(latest!.height).toBeGreaterThanOrEqual(50);

    // Tool should auto-switch back
    const toolAfter = await getActiveTool(page);
    expect(toolAfter.tool).toBe('select');

    const snap = await capture(page, 'after-rect-drag');
    assertNoCriticalAnomalies(snap);
  });

  // ─── CRE-03: Create rectangle (constrained) ───────────────────────────────
  test('CRE-03: Constrained rectangle (Shift+drag)', async ({ page }) => {
    await page.keyboard.press('r');
    await page.waitForTimeout(100);

    const rect = await page.locator('#interaction-canvas').boundingBox();
    if (!rect) throw new Error('No canvas');

    const startX = rect.x + rect.width * 0.3;
    const startY = rect.y + rect.height * 0.3;

    await page.mouse.move(startX, startY);
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.move(startX + 200, startY + 100, { steps: 5 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);

    const latest = await getLatestElement(page);
    expect(latest).not.toBeNull();
    // Constrained = square, so width ≈ height
    if (latest!.width > 10 && latest!.height > 10) {
      expect(Math.abs(latest!.width - latest!.height)).toBeLessThan(5);
    }
  });

  // ─── CRE-04: Create text (click) ──────────────────────────────────────────
  test('CRE-04: Create text via T tool + click', async ({ page }) => {
    const countBefore = await getElementCount(page);

    await page.keyboard.press('t');
    await page.waitForTimeout(100);

    const center = await getCanvasCenter(page);
    if (!center) throw new Error('No canvas center');
    await page.mouse.click(center.x, center.y);
    await page.waitForTimeout(300);

    const countAfter = await getElementCount(page);
    expect(countAfter).toBe(countBefore + 1);

    // Should be in edit mode (editingElementId set)
    const editState = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return {
        editingElementId: s.editor.editingElementId,
        isNewlyCreated: s.editor.editModeIsNewlyCreated,
      };
    });
    expect(editState.editingElementId).not.toBeNull();

    const snap = await capture(page, 'after-text-click');
    assertNoCriticalAnomalies(snap);
  });

  // ─── CRE-05: Create text (drag) ───────────────────────────────────────────
  test('CRE-05: Create text via T tool + drag', async ({ page }) => {
    const countBefore = await getElementCount(page);

    await page.keyboard.press('t');
    await page.waitForTimeout(100);

    await canvas.drag(0.3, 0.3, 0.5, 0.45);
    await page.waitForTimeout(300);

    const countAfter = await getElementCount(page);
    expect(countAfter).toBe(countBefore + 1);

    // Should be in edit mode
    const editState = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return { editingElementId: s.editor.editingElementId };
    });
    expect(editState.editingElementId).not.toBeNull();
  });

  // ─── CRE-06: Create ellipse ────────────────────────────────────────────────
  test('CRE-06: Create ellipse via O tool + drag', async ({ page }) => {
    const countBefore = await getElementCount(page);

    await page.keyboard.press('o');
    await page.waitForTimeout(100);

    await canvas.drag(0.3, 0.3, 0.5, 0.5);
    await page.waitForTimeout(200);

    const countAfter = await getElementCount(page);
    expect(countAfter).toBe(countBefore + 1);

    const latest = await getLatestElement(page);
    expect(latest).not.toBeNull();
    expect(latest!.shapeKind || latest!.type).toMatch(/ellipse|circle/i);

    const snap = await capture(page, 'after-ellipse');
    assertNoCriticalAnomalies(snap);
  });

  // ─── CRE-07: Create line ──────────────────────────────────────────────────
  test('CRE-07: Create line via L tool + drag', async ({ page }) => {
    const countBefore = await getElementCount(page);

    await page.keyboard.press('l');
    await page.waitForTimeout(100);

    await canvas.drag(0.3, 0.3, 0.6, 0.5);
    await page.waitForTimeout(200);

    const countAfter = await getElementCount(page);
    expect(countAfter).toBe(countBefore + 1);

    const snap = await capture(page, 'after-line');
    assertNoCriticalAnomalies(snap);
  });

  // ─── CRE-14: Newly created flag ───────────────────────────────────────────
  test('CRE-14: isNewlyCreated flag set on text creation', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(100);

    const center = await getCanvasCenter(page);
    if (!center) throw new Error('No canvas center');
    await page.mouse.click(center.x, center.y);
    await page.waitForTimeout(300);

    const state = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return {
        editingElementId: s.editor.editingElementId,
        isNewlyCreated: s.editor.editModeIsNewlyCreated,
      };
    });
    expect(state.editingElementId).not.toBeNull();
    expect(state.isNewlyCreated).toBe(true);
  });

  // ─── Cross-cutting invariant ──────────────────────────────────────────────
  test('Invariant: Store↔DOM sync after creation', async ({ page }) => {
    // Create a shape and verify sync
    await page.keyboard.press('r');
    await page.waitForTimeout(100);
    await canvas.drag(0.2, 0.2, 0.4, 0.4);
    await page.waitForTimeout(200);

    const snap = await capture(page, 'after-creation');
    assertNoCriticalAnomalies(snap);

    // Verify the new element exists in both store and DOM
    if (snap.store) {
      const storeIds = Object.keys(snap.store.elements);
      const domIds = new Set(snap.dom.elements.map(e => e.id));
      for (const id of storeIds) {
        if (!snap.store.elements[id].hidden) {
          expect(domIds.has(id), `Element ${id} in store but not DOM`).toBe(true);
        }
      }
    }
  });
});
