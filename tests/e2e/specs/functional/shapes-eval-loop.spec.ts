/**
 * Eval Loop: Shapes (SHP-01 → SHP-17)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Shapes', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function getElementCount(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return (slide.elementOrder || []).length;
    });
  }

  function getLatest(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      const order = slide.elementOrder || [];
      if (!order.length) return null;
      const el = slide.elements[order[order.length - 1]];
      return el ? { id: el.id, type: el.type, shapeKind: el.shapeKind, width: el.width, height: el.height } : null;
    });
  }

  // ─── SHP-01: Create shape with tool ───────────────────────────────────────
  test('SHP-01: Create rectangle with R tool', async ({ page }) => {
    const before = await getElementCount(page);
    await page.keyboard.press('r');
    await page.waitForTimeout(100);
    await canvas.drag(0.3, 0.3, 0.5, 0.5);
    await page.waitForTimeout(200);

    expect(await getElementCount(page)).toBe(before + 1);
    const el = await getLatest(page);
    expect(el).not.toBeNull();
    expect(el!.type).toBe('rect');

    const snap = await capture(page, 'shape-rect');
    assertNoCriticalAnomalies(snap);
  });

  // ─── SHP-02: Constrained shape ────────────────────────────────────────────
  test('SHP-02: Constrained ellipse with Shift', async ({ page }) => {
    await page.keyboard.press('o');
    await page.waitForTimeout(100);

    const rect = await page.locator('#interaction-canvas').boundingBox();
    if (!rect) throw new Error('No canvas');
    const sx = rect.x + rect.width * 0.3;
    const sy = rect.y + rect.height * 0.3;

    await page.mouse.move(sx, sy);
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.move(sx + 200, sy + 150, { steps: 5 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);

    const el = await getLatest(page);
    expect(el).not.toBeNull();
    if (el!.width > 10 && el!.height > 10) {
      expect(Math.abs(el!.width - el!.height)).toBeLessThan(5);
    }
  });

  // ─── SHP-03: Delete shape ─────────────────────────────────────────────────
  test('SHP-03: Delete selected shape', async ({ page }) => {
    await page.keyboard.press('r');
    await page.waitForTimeout(100);
    await canvas.drag(0.3, 0.3, 0.5, 0.5);
    await page.waitForTimeout(200);

    const before = await getElementCount(page);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(200);

    expect(await getElementCount(page)).toBe(before - 1);
  });

  // ─── SHP-04: Duplicate shape ──────────────────────────────────────────────
  test('SHP-04: Duplicate with Ctrl+D', async ({ page }) => {
    await page.keyboard.press('r');
    await page.waitForTimeout(100);
    await canvas.drag(0.3, 0.3, 0.5, 0.5);
    await page.waitForTimeout(200);

    const before = await getElementCount(page);
    await page.keyboard.press('Control+d');
    await page.waitForTimeout(200);

    expect(await getElementCount(page)).toBe(before + 1);
  });

  // ─── SHP-10: Group shapes ─────────────────────────────────────────────────
  test('SHP-10: Group two shapes', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const s = Date.now().toString(36);
      store.dispatch('ADD_ELEMENT', { id: `sg1-${s}`, type: 'rect', x: 100, y: 100, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#E74C3C' }] });
      store.dispatch('ADD_ELEMENT', { id: `sg2-${s}`, type: 'rect', x: 200, y: 100, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#3498DB' }] });
      store.dispatch('UPDATE_SELECTION', [`sg1-${s}`, `sg2-${s}`]);
    });
    await page.waitForTimeout(200);

    await page.keyboard.press('Control+g');
    await page.waitForTimeout(200);

    const hasGroup = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return Object.values(slide.elements).some((el: any) => el.type === 'group');
    });
    expect(hasGroup).toBe(true);
  });

  // ─── SHP-11: Ungroup shapes ───────────────────────────────────────────────
  test('SHP-11: Ungroup with Ctrl+Shift+G', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const s = Date.now().toString(36);
      store.dispatch('ADD_ELEMENT', { id: `ug1-${s}`, type: 'rect', x: 100, y: 100, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#E74C3C' }] });
      store.dispatch('ADD_ELEMENT', { id: `ug2-${s}`, type: 'rect', x: 200, y: 100, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#3498DB' }] });
      store.dispatch('UPDATE_SELECTION', [`ug1-${s}`, `ug2-${s}`]);
      store.dispatch('GROUP_ELEMENTS');
    });
    await page.waitForTimeout(200);

    await page.keyboard.press('Control+Shift+g');
    await page.waitForTimeout(200);

    const groupCount = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return Object.values(slide.elements).filter((el: any) => el.type === 'group').length;
    });
    expect(groupCount).toBe(0);
  });

  // ─── SHP-14: Apply fill ───────────────────────────────────────────────────
  test('SHP-14: Apply fill color via store', async ({ page }) => {
    const id = await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-fill-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', { id, type: 'rect', x: 200, y: 200, width: 150, height: 100, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#000000' }] });
      store.dispatch('UPDATE_SELECTION', [id]);
      return id;
    });
    await page.waitForTimeout(200);

    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, fills: [{ type: 'solid', color: '#FF5733' }] });
    }, { id });
    await page.waitForTimeout(200);

    const el = await page.evaluate((eid) => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId].elements[eid];
    }, id);
    expect(el.fills[0].color).toBe('#FF5733');
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Shape operations maintain consistency', async ({ page }) => {
    await page.keyboard.press('r');
    await page.waitForTimeout(100);
    await canvas.drag(0.2, 0.2, 0.4, 0.4);
    await page.waitForTimeout(200);

    const snap = await capture(page, 'shape-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
