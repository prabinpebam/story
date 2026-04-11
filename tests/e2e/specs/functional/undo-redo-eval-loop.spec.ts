/**
 * Eval Loop: Undo / Redo (UND-01 → UND-15)
 */

import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture,
  waitForCanvasManager,
  assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Undo / Redo', () => {
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
      const id = `eval-undo-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x: 200, y: 200, width: 150, height: 100,
        rotation: 0, opacity: 1,
        fills: [{ type: 'solid', color: '#3498DB' }],
      });
      return id;
    });
  }

  function getElementCount(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return (slide.elementOrder || []).length;
    });
  }

  function elementExists(page: import('@playwright/test').Page, id: string) {
    return page.evaluate((eid) => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return !!slide.elements[eid];
    }, id);
  }

  // ─── UND-01: Undo add element ─────────────────────────────────────────────
  test('UND-01: Ctrl+Z undoes add element', async ({ page }) => {
    const countBefore = await getElementCount(page);
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    const countAfterAdd = await getElementCount(page);
    expect(countAfterAdd).toBe(countBefore + 1);

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);

    const countAfterUndo = await getElementCount(page);
    expect(countAfterUndo).toBe(countBefore);

    const snap = await capture(page, 'after-undo-add');
    assertNoCriticalAnomalies(snap);
  });

  // ─── UND-02: Redo add element ─────────────────────────────────────────────
  test('UND-02: Ctrl+Shift+Z redoes add element', async ({ page }) => {
    const countBefore = await getElementCount(page);
    await seedRect(page);
    await page.waitForTimeout(200);

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
    expect(await getElementCount(page)).toBe(countBefore);

    await page.keyboard.press('Control+Shift+z');
    await page.waitForTimeout(300);

    expect(await getElementCount(page)).toBe(countBefore + 1);

    const snap = await capture(page, 'after-redo-add');
    assertNoCriticalAnomalies(snap);
  });

  // ─── UND-03: Redo with Ctrl+Y ─────────────────────────────────────────────
  test('UND-03: Ctrl+Y also redoes', async ({ page }) => {
    const countBefore = await getElementCount(page);
    await seedRect(page);
    await page.waitForTimeout(200);

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
    expect(await getElementCount(page)).toBe(countBefore);

    await page.keyboard.press('Control+y');
    await page.waitForTimeout(300);

    expect(await getElementCount(page)).toBe(countBefore + 1);

    const snap = await capture(page, 'after-redo-y');
    assertNoCriticalAnomalies(snap);
  });

  // ─── UND-04: Undo delete element ──────────────────────────────────────────
  test('UND-04: Undo restores deleted element', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Select and delete
    await page.evaluate((eid) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SELECTION', [eid]);
    }, id);
    await page.waitForTimeout(100);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(200);

    expect(await elementExists(page, id)).toBe(false);

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);

    expect(await elementExists(page, id)).toBe(true);

    const snap = await capture(page, 'after-undo-delete');
    assertNoCriticalAnomalies(snap);
  });

  // ─── UND-05: Undo move ────────────────────────────────────────────────────
  test('UND-05: Undo restores element position after move', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Get original position
    const posBefore = await page.evaluate((eid) => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      const el = slide.elements[eid];
      return { x: el.x, y: el.y };
    }, id);

    // Move via store
    await page.evaluate((eid) => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('UPDATE_ELEMENT', { id: eid, x: 500, y: 500 });
    }, id);
    await page.waitForTimeout(200);

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);

    const posAfter = await page.evaluate((eid) => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      const el = slide.elements[eid];
      return { x: el.x, y: el.y };
    }, id);

    expect(posAfter.x).toBe(posBefore.x);
    expect(posAfter.y).toBe(posBefore.y);

    const snap = await capture(page, 'after-undo-move');
    assertNoCriticalAnomalies(snap);
  });

  // ─── UND-06: Multiple undo ────────────────────────────────────────────────
  test('UND-06: Multiple undos work sequentially', async ({ page }) => {
    const countBase = await getElementCount(page);

    const id1 = await seedRect(page);
    await page.waitForTimeout(200);
    const id2 = await seedRect(page);
    await page.waitForTimeout(200);

    expect(await getElementCount(page)).toBe(countBase + 2);

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
    expect(await getElementCount(page)).toBe(countBase + 1);

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
    expect(await getElementCount(page)).toBe(countBase);

    const snap = await capture(page, 'after-multi-undo');
    assertNoCriticalAnomalies(snap);
  });

  // ─── UND-07: Redo cleared by new action ───────────────────────────────────
  test('UND-07: New action clears redo stack', async ({ page }) => {
    const countBase = await getElementCount(page);
    await seedRect(page);
    await page.waitForTimeout(200);

    // Undo
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
    expect(await getElementCount(page)).toBe(countBase);

    // New action (adds new element, should clear redo)
    await seedRect(page);
    await page.waitForTimeout(200);
    expect(await getElementCount(page)).toBe(countBase + 1);

    // Redo should do nothing — redo stack was cleared
    await page.keyboard.press('Control+Shift+z');
    await page.waitForTimeout(300);
    expect(await getElementCount(page)).toBe(countBase + 1);

    const snap = await capture(page, 'redo-cleared');
    assertNoCriticalAnomalies(snap);
  });

  // ─── UND-08: Undo layer reorder ──────────────────────────────────────────
  test('UND-08: Undo restores layer order', async ({ page }) => {
    // Seed two elements
    const ids = await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const s = Date.now().toString(36);
      const a = `undo-a-${s}`, b = `undo-b-${s}`;
      store.dispatch('ADD_ELEMENT', { id: a, type: 'rect', x: 100, y: 100, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#E74C3C' }] });
      store.dispatch('ADD_ELEMENT', { id: b, type: 'rect', x: 120, y: 120, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#3498DB' }] });
      return { a, b };
    });
    await page.waitForTimeout(200);

    // Select first, bring to front
    await page.evaluate((id) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SELECTION', [id]);
    }, ids.a);
    await page.waitForTimeout(100);

    const orderBefore = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId].elementOrder.slice();
    });

    await page.keyboard.press('Control+Shift+]');
    await page.waitForTimeout(200);

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);

    const orderAfterUndo = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId].elementOrder.slice();
    });

    expect(orderAfterUndo).toEqual(orderBefore);

    const snap = await capture(page, 'after-undo-reorder');
    assertNoCriticalAnomalies(snap);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Undo/redo maintains store-DOM consistency', async ({ page }) => {
    // Add, undo, redo, capture at each step
    const countBase = await getElementCount(page);
    await seedRect(page);
    await page.waitForTimeout(200);

    const snap1 = await capture(page, 'after-add');
    assertNoCriticalAnomalies(snap1);

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);

    const snap2 = await capture(page, 'after-undo');
    assertNoCriticalAnomalies(snap2);

    await page.keyboard.press('Control+Shift+z');
    await page.waitForTimeout(300);

    const snap3 = await capture(page, 'after-redo');
    assertNoCriticalAnomalies(snap3);
  });
});
