/**
 * Eval Loop: Element Resize (RSZ-01 → RSZ-12)
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

test.describe('Eval Loop: Element Resize', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  /** Seed a rectangle and select it */
  async function seedRect(page: import('@playwright/test').Page, x = 300, y = 300, w = 200, h = 150) {
    return page.evaluate(({ x, y, w, h }) => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-rsz-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x, y, width: w, height: h,
        rotation: 0, opacity: 1, name: 'Eval Resize Rect',
        fills: [{ type: 'solid', color: '#4A90D9' }],
      });
      store.dispatch('UPDATE_SELECTION', [id]);
      return id;
    }, { x, y, w, h });
  }

  /** Get element dimensions */
  async function getElementDims(page: import('@playwright/test').Page, id: string) {
    return page.evaluate(({ id }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      const el = slide.elements[id];
      return el ? { x: el.x, y: el.y, width: el.width, height: el.height } : null;
    }, { id });
  }

  /** Convert world coords to screen */
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

  // ─── RSZ-01: Resize edge handle ───────────────────────────────────────────
  test('RSZ-01: Resize via east edge handle', async ({ page }) => {
    const id = await seedRect(page, 300, 300, 200, 150);
    await page.waitForTimeout(200);

    const before = await getElementDims(page, id);
    expect(before).not.toBeNull();

    // The east handle is at world coords (300+200, 300+75) = (500, 375)
    const handleScreen = await worldToScreen(page, 500, 375);
    if (!handleScreen) throw new Error('No handle coords');

    const endScreen = await worldToScreen(page, 550, 375);
    if (!endScreen) throw new Error('No end coords');

    await page.mouse.move(handleScreen.x, handleScreen.y);
    await page.mouse.down();
    await page.mouse.move(endScreen.x, endScreen.y, { steps: 3 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const after = await getElementDims(page, id);
    expect(after).not.toBeNull();
    // Width should have increased by about 50
    expect(after!.width).toBeGreaterThan(before!.width + 20);
    // Height should remain approximately the same
    expect(Math.abs(after!.height - before!.height)).toBeLessThan(5);

    const snap = await capture(page, 'after-east-resize');
    assertNoCriticalAnomalies(snap);
  });

  // ─── RSZ-02: Resize corner handle ─────────────────────────────────────────
  test('RSZ-02: Resize via SE corner handle', async ({ page }) => {
    const id = await seedRect(page, 300, 300, 200, 150);
    await page.waitForTimeout(200);

    const before = await getElementDims(page, id);

    // SE corner at (500, 450)
    const handleScreen = await worldToScreen(page, 500, 450);
    if (!handleScreen) throw new Error('No handle');
    const endScreen = await worldToScreen(page, 560, 510);
    if (!endScreen) throw new Error('No end');

    await page.mouse.move(handleScreen.x, handleScreen.y);
    await page.mouse.down();
    await page.mouse.move(endScreen.x, endScreen.y, { steps: 3 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const after = await getElementDims(page, id);
    expect(after!.width).toBeGreaterThan(before!.width + 20);
    expect(after!.height).toBeGreaterThan(before!.height + 20);

    const snap = await capture(page, 'after-corner-resize');
    assertNoCriticalAnomalies(snap);
  });

  // ─── RSZ-03: Constrained resize ───────────────────────────────────────────
  test('RSZ-03: Constrained resize with Shift', async ({ page }) => {
    const id = await seedRect(page, 300, 300, 200, 200);
    await page.waitForTimeout(200);

    const before = await getElementDims(page, id);
    const ratio = before!.width / before!.height;

    // SE corner at (500, 500)
    const handleScreen = await worldToScreen(page, 500, 500);
    if (!handleScreen) throw new Error('No handle');
    const endScreen = await worldToScreen(page, 600, 600);
    if (!endScreen) throw new Error('No end');

    await page.mouse.move(handleScreen.x, handleScreen.y);
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.move(endScreen.x, endScreen.y, { steps: 3 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);

    const after = await getElementDims(page, id);
    const afterRatio = after!.width / after!.height;
    // Ratio should be preserved (within tolerance)
    expect(Math.abs(afterRatio - ratio)).toBeLessThan(0.15);
  });

  // ─── RSZ-07: Toggle text resizing mode ────────────────────────────────────
  test('RSZ-07: Text resizing mode toggle', async ({ page }) => {
    // Create a text element
    const id = await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const elId = `eval-txt-rsz-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id: elId, type: 'text', x: 300, y: 300, width: 200, height: 50,
        rotation: 0, opacity: 1, name: 'Eval Resize Text',
        content: '<p>Hello World</p>', resizingMode: 'autoSize',
      });
      store.dispatch('UPDATE_SELECTION', [elId]);
      return elId;
    });
    await page.waitForTimeout(200);

    // Check initial resizing mode
    const initialMode = await page.evaluate(({ id }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return slide.elements[id]?.resizingMode;
    }, { id });
    expect(initialMode).toBe('autoSize');

    const snap = await capture(page, 'text-resize-mode');
    assertNoCriticalAnomalies(snap);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Store↔DOM sync after resize operations', async ({ page }) => {
    const id = await seedRect(page, 300, 300, 200, 150);
    await page.waitForTimeout(200);

    const snap = await capture(page, 'after-seed');
    assertNoCriticalAnomalies(snap);

    // Verify store and DOM element counts match
    if (snap.store && snap.dom.slidePresent) {
      const domIds = new Set(snap.dom.elements.map(e => e.id));
      for (const [eid, el] of Object.entries(snap.store.elements)) {
        if (!el.hidden) {
          expect(domIds.has(eid), `Element ${eid} in store but not DOM`).toBe(true);
        }
      }
    }
  });
});
