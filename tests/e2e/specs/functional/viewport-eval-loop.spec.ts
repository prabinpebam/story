/**
 * Eval Loop: Viewport & Navigation (VP-01 → VP-11)
 */

import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture,
  bracket,
  waitForCanvasManager,
  assertNoCriticalAnomalies,
  Snapshot,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Viewport & Navigation', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  /** Read current viewport from store */
  async function getViewport(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return { zoom: s.editor.zoom, pan: { x: s.editor.pan.x, y: s.editor.pan.y } };
    });
  }

  /** Get canvas container bounding box */
  async function getContainerRect(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const c = document.getElementById('canvas-container');
      if (!c) return null;
      const r = c.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
    });
  }

  // ─── VP-01: Pan with space ─────────────────────────────────────────────────
  test('VP-01: Pan with Space+Drag', async ({ page }) => {
    const before = await getViewport(page);
    const rect = await getContainerRect(page);
    if (!rect) throw new Error('No container');

    await page.keyboard.down('Space');
    await page.mouse.move(rect.cx, rect.cy);
    await page.mouse.down();
    await page.mouse.move(rect.cx + 100, rect.cy + 50, { steps: 5 });
    await page.mouse.up();
    await page.keyboard.up('Space');
    await page.waitForTimeout(200);

    const after = await getViewport(page);
    // Pan should have shifted right and down
    expect(after.pan.x).toBeGreaterThan(before.pan.x + 50);
    expect(after.pan.y).toBeGreaterThan(before.pan.y + 20);

    const snap = await capture(page, 'after-space-pan');
    assertNoCriticalAnomalies(snap);
  });

  // ─── VP-02: Pan with middle mouse ──────────────────────────────────────────
  test('VP-02: Pan with middle mouse button', async ({ page }) => {
    const before = await getViewport(page);
    const rect = await getContainerRect(page);
    if (!rect) throw new Error('No container');

    await page.mouse.move(rect.cx, rect.cy);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(rect.cx - 80, rect.cy + 60, { steps: 5 });
    await page.mouse.up({ button: 'middle' });
    await page.waitForTimeout(200);

    const after = await getViewport(page);
    expect(after.pan.x).toBeLessThan(before.pan.x - 30);
    expect(after.pan.y).toBeGreaterThan(before.pan.y + 20);
  });

  // ─── VP-03: Pan with trackpad (scroll without Ctrl) ────────────────────────
  test('VP-03: Pan with scroll (no Ctrl)', async ({ page }) => {
    const before = await getViewport(page);
    const rect = await getContainerRect(page);
    if (!rect) throw new Error('No container');

    // Simulate vertical scroll (deltaY=100 → pan moves by that amount)
    await page.mouse.move(rect.cx, rect.cy);
    await page.mouse.wheel(0, 150);
    await page.waitForTimeout(200);

    const after = await getViewport(page);
    // Pan Y should decrease (scroll down = content moves up)
    expect(after.pan.y).toBeLessThan(before.pan.y);
  });

  // ─── VP-04: Zoom in (scroll) ──────────────────────────────────────────────
  test('VP-04: Zoom in with Ctrl+Scroll', async ({ page }) => {
    const before = await getViewport(page);
    const rect = await getContainerRect(page);
    if (!rect) throw new Error('No container');

    await page.mouse.move(rect.cx, rect.cy);
    // Ctrl+scroll up = zoom in (negative deltaY)
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -300);
    await page.keyboard.up('Control');
    await page.waitForTimeout(200);

    const after = await getViewport(page);
    expect(after.zoom).toBeGreaterThan(before.zoom);

    const snap = await capture(page, 'after-zoom-in');
    assertNoCriticalAnomalies(snap);
  });

  // ─── VP-05: Zoom out (scroll) ─────────────────────────────────────────────
  test('VP-05: Zoom out with Ctrl+Scroll', async ({ page }) => {
    const before = await getViewport(page);
    const rect = await getContainerRect(page);
    if (!rect) throw new Error('No container');

    await page.mouse.move(rect.cx, rect.cy);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, 300);
    await page.keyboard.up('Control');
    await page.waitForTimeout(200);

    const after = await getViewport(page);
    expect(after.zoom).toBeLessThan(before.zoom);
  });

  // ─── VP-06: Zoom in (keyboard via button) ──────────────────────────────────
  test('VP-06: Zoom in via button', async ({ page }) => {
    const before = await getViewport(page);

    await page.click('#btn-zoom-in');
    await page.waitForTimeout(150);

    const after = await getViewport(page);
    expect(after.zoom).toBeGreaterThan(before.zoom);
  });

  // ─── VP-07: Zoom out (keyboard via button) ─────────────────────────────────
  test('VP-07: Zoom out via button', async ({ page }) => {
    const before = await getViewport(page);

    await page.click('#btn-zoom-out');
    await page.waitForTimeout(150);

    const after = await getViewport(page);
    expect(after.zoom).toBeLessThan(before.zoom);
  });

  // ─── VP-09: Fit to view ────────────────────────────────────────────────────
  test('VP-09: Fit to view', async ({ page }) => {
    // First zoom way out to change from default
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_VIEWPORT', {
        zoom: 0.15, pan: { x: -500, y: -500 },
      });
    });
    await page.waitForTimeout(100);

    const before = await getViewport(page);
    expect(before.zoom).toBeCloseTo(0.15, 1);

    // Invoke fitToView via canvasManager (button occluded by toolbar)
    await page.evaluate(() => (window as any).__TEST_CANVAS_MANAGER__.fitToView());
    await page.waitForTimeout(200);

    const after = await getViewport(page);
    // Zoom should be something reasonable (not 0.15 anymore)
    expect(after.zoom).toBeGreaterThan(0.2);
    // Pan should center the content
    expect(after.pan.x).toBeGreaterThan(-100);
    expect(after.pan.y).toBeGreaterThan(-100);

    const snap = await capture(page, 'after-fit-to-view');
    assertNoCriticalAnomalies(snap);
  });

  // ─── VP-10: Zoom range enforcement ─────────────────────────────────────────
  test('VP-10: Zoom range enforcement (10%-500%)', async ({ page }) => {
    // Try to exceed max zoom (5.0)
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_VIEWPORT', { zoom: 4.8 });
    });
    await page.waitForTimeout(50);

    const rect = await getContainerRect(page);
    if (!rect) throw new Error('No container');

    // Zoom in a lot
    await page.mouse.move(rect.cx, rect.cy);
    await page.keyboard.down('Control');
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, -500);
      await page.waitForTimeout(50);
    }
    await page.keyboard.up('Control');
    await page.waitForTimeout(100);

    const afterMax = await getViewport(page);
    expect(afterMax.zoom).toBeLessThanOrEqual(5.0);

    // Now try to go below min zoom (0.1)
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_VIEWPORT', { zoom: 0.12 });
    });
    await page.waitForTimeout(50);

    await page.mouse.move(rect.cx, rect.cy);
    await page.keyboard.down('Control');
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(50);
    }
    await page.keyboard.up('Control');
    await page.waitForTimeout(100);

    const afterMin = await getViewport(page);
    expect(afterMin.zoom).toBeGreaterThanOrEqual(0.1);
  });

  // ─── VP-11: Zoom towards cursor ───────────────────────────────────────────
  test('VP-11: Zoom maintains cursor world position', async ({ page }) => {
    const rect = await getContainerRect(page);
    if (!rect) throw new Error('No container');

    // Place cursor at a specific spot
    const cursorX = rect.x + rect.width * 0.3;
    const cursorY = rect.y + rect.height * 0.3;
    await page.mouse.move(cursorX, cursorY);

    const before = await getViewport(page);
    // Compute world position under cursor before zoom
    const worldXBefore = (cursorX - rect.x - before.pan.x) / before.zoom;
    const worldYBefore = (cursorY - rect.y - before.pan.y) / before.zoom;

    // Zoom in
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -200);
    await page.keyboard.up('Control');
    await page.waitForTimeout(200);

    const after = await getViewport(page);
    // Compute world position under cursor after zoom
    const worldXAfter = (cursorX - rect.x - after.pan.x) / after.zoom;
    const worldYAfter = (cursorY - rect.y - after.pan.y) / after.zoom;

    // World position should remain approximately the same (within 5px tolerance)
    expect(Math.abs(worldXAfter - worldXBefore)).toBeLessThan(5);
    expect(Math.abs(worldYAfter - worldYBefore)).toBeLessThan(5);
    expect(after.zoom).toBeGreaterThan(before.zoom);
  });

  // ─── Cross-cutting: No anomalies after viewport operations ─────────────────
  test('Invariant: No critical anomalies after viewport ops', async ({ page }) => {
    const rect = await getContainerRect(page);
    if (!rect) throw new Error('No container');

    const operations = [
      { name: 'zoom-in', fn: async () => {
        await page.mouse.move(rect.cx, rect.cy);
        await page.keyboard.down('Control');
        await page.mouse.wheel(0, -200);
        await page.keyboard.up('Control');
      }},
      { name: 'zoom-out', fn: async () => {
        await page.keyboard.down('Control');
        await page.mouse.wheel(0, 200);
        await page.keyboard.up('Control');
      }},
      { name: 'pan', fn: async () => {
        await page.mouse.wheel(50, 50);
      }},
      { name: 'fit', fn: async () => {
        await page.evaluate(() => (window as any).__TEST_CANVAS_MANAGER__.fitToView());
      }},
    ];

    for (const op of operations) {
      await op.fn();
      await page.waitForTimeout(200);
      const snap = await capture(page, `after-${op.name}`);
      assertNoCriticalAnomalies(snap);
    }
  });
});
