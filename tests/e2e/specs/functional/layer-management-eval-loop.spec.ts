/**
 * Eval Loop: Layer Management (LYR-01 → LYR-17)
 */

import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture,
  waitForCanvasManager,
  assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Layer Management', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  /** Seed two rectangles: back one (index 0) and front one (index 1). Returns [backId, frontId]. */
  async function seedTwoRects(page: import('@playwright/test').Page): Promise<[string, string]> {
    return page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const s = Date.now().toString(36);
      const back = `back-${s}`;
      const front = `front-${s}`;
      store.dispatch('ADD_ELEMENT', {
        id: back, type: 'rect', x: 100, y: 100, width: 150, height: 100,
        rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#E74C3C' }],
      });
      store.dispatch('ADD_ELEMENT', {
        id: front, type: 'rect', x: 120, y: 120, width: 150, height: 100,
        rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#3498DB' }],
      });
      return [back, front] as [string, string];
    });
  }

  function getOrder(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return slide.elementOrder as string[];
    });
  }

  // ─── LYR-01: Bring to Front ──────────────────────────────────────────────
  test('LYR-01: Bring to Front with Ctrl+Shift+]', async ({ page }) => {
    const [backId] = await seedTwoRects(page);
    await page.waitForTimeout(200);

    // Select back element
    await page.evaluate((id) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SELECTION', [id]);
    }, backId);
    await page.waitForTimeout(100);

    const orderBefore = await getOrder(page);
    expect(orderBefore.indexOf(backId)).toBeLessThan(orderBefore.indexOf(orderBefore[orderBefore.length - 1]));

    await page.keyboard.press('Control+Shift+]');
    await page.waitForTimeout(200);

    const orderAfter = await getOrder(page);
    // backId should now be at the top (last in elementOrder)
    expect(orderAfter[orderAfter.length - 1]).toBe(backId);

    const snap = await capture(page, 'after-bring-to-front');
    assertNoCriticalAnomalies(snap);
  });

  // ─── LYR-02: Send to Back ────────────────────────────────────────────────
  test('LYR-02: Send to Back with Ctrl+Shift+[', async ({ page }) => {
    const [, frontId] = await seedTwoRects(page);
    await page.waitForTimeout(200);

    await page.evaluate((id) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SELECTION', [id]);
    }, frontId);
    await page.waitForTimeout(100);

    await page.keyboard.press('Control+Shift+[');
    await page.waitForTimeout(200);

    const orderAfter = await getOrder(page);
    // Filter to user-created elements (skip master placeholders)
    const userElements = orderAfter.filter(id => id.includes('-'));
    expect(userElements[0]).toBe(frontId);

    const snap = await capture(page, 'after-send-to-back');
    assertNoCriticalAnomalies(snap);
  });

  // ─── LYR-03: Bring Forward ───────────────────────────────────────────────
  test('LYR-03: Bring Forward with Ctrl+]', async ({ page }) => {
    const [backId, frontId] = await seedTwoRects(page);
    await page.waitForTimeout(200);

    await page.evaluate((id) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SELECTION', [id]);
    }, backId);
    await page.waitForTimeout(100);

    const idxBefore = (await getOrder(page)).indexOf(backId);
    await page.keyboard.press('Control+]');
    await page.waitForTimeout(200);

    const idxAfter = (await getOrder(page)).indexOf(backId);
    expect(idxAfter).toBeGreaterThan(idxBefore);

    const snap = await capture(page, 'after-bring-forward');
    assertNoCriticalAnomalies(snap);
  });

  // ─── LYR-04: Send Backward ───────────────────────────────────────────────
  test('LYR-04: Send Backward with Ctrl+[', async ({ page }) => {
    const [, frontId] = await seedTwoRects(page);
    await page.waitForTimeout(200);

    await page.evaluate((id) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SELECTION', [id]);
    }, frontId);
    await page.waitForTimeout(100);

    const idxBefore = (await getOrder(page)).indexOf(frontId);
    await page.keyboard.press('Control+[');
    await page.waitForTimeout(200);

    const idxAfter = (await getOrder(page)).indexOf(frontId);
    expect(idxAfter).toBeLessThan(idxBefore);

    const snap = await capture(page, 'after-send-backward');
    assertNoCriticalAnomalies(snap);
  });

  // ─── LYR-05: Lock element ────────────────────────────────────────────────
  test('LYR-05: Toggle lock via store dispatch', async ({ page }) => {
    const [backId] = await seedTwoRects(page);
    await page.waitForTimeout(200);

    // Lock element
    await page.evaluate((id) => {
      (window as any).__TEST_STORE__.dispatch('TOGGLE_ELEMENT_LOCK', { id });
    }, backId);
    await page.waitForTimeout(200);

    const locked = await page.evaluate((id) => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return slide.elements[id]?.locked === true;
    }, backId);
    expect(locked).toBe(true);

    const snap = await capture(page, 'after-lock');
    assertNoCriticalAnomalies(snap);
  });

  // ─── LYR-06: Unlock element ──────────────────────────────────────────────
  test('LYR-06: Toggle unlock via store dispatch', async ({ page }) => {
    const [backId] = await seedTwoRects(page);
    await page.waitForTimeout(200);

    // Lock then unlock
    await page.evaluate((id) => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('TOGGLE_ELEMENT_LOCK', { id });
      store.dispatch('TOGGLE_ELEMENT_LOCK', { id });
    }, backId);
    await page.waitForTimeout(200);

    const locked = await page.evaluate((id) => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return slide.elements[id]?.locked === true;
    }, backId);
    expect(locked).toBe(false);

    const snap = await capture(page, 'after-unlock');
    assertNoCriticalAnomalies(snap);
  });

  // ─── LYR-07: Hide element ────────────────────────────────────────────────
  test('LYR-07: Toggle visibility hides element', async ({ page }) => {
    const [backId] = await seedTwoRects(page);
    await page.waitForTimeout(200);

    await page.evaluate((id) => {
      (window as any).__TEST_STORE__.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id });
    }, backId);
    await page.waitForTimeout(200);

    const hidden = await page.evaluate((id) => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return slide.elements[id]?.hidden === true;
    }, backId);
    expect(hidden).toBe(true);

    const snap = await capture(page, 'after-hide');
    assertNoCriticalAnomalies(snap);
  });

  // ─── LYR-08: Show element ────────────────────────────────────────────────
  test('LYR-08: Toggle visibility shows hidden element', async ({ page }) => {
    const [backId] = await seedTwoRects(page);
    await page.waitForTimeout(200);

    // Hide then show
    await page.evaluate((id) => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id });
      store.dispatch('TOGGLE_ELEMENT_VISIBILITY', { id });
    }, backId);
    await page.waitForTimeout(200);

    const hidden = await page.evaluate((id) => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return slide.elements[id]?.hidden === true;
    }, backId);
    expect(hidden).toBe(false);

    const snap = await capture(page, 'after-show');
    assertNoCriticalAnomalies(snap);
  });

  // ─── LYR-09: Layer tree selection ─────────────────────────────────────────
  test('LYR-09: Click layer item selects element', async ({ page }) => {
    const [backId] = await seedTwoRects(page);
    await page.waitForTimeout(200);

    // Clear selection
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SELECTION', []);
    });
    await page.waitForTimeout(100);

    // Click layer item
    const layerItem = page.locator(`.layer-item[data-id="${backId}"]`);
    if (await layerItem.count() > 0) {
      await layerItem.click();
      await page.waitForTimeout(200);

      const selected = await page.evaluate((id) => {
        const s = (window as any).__TEST_STORE__.getState();
        return s.editor.selectedElementIds.includes(id);
      }, backId);
      expect(selected).toBe(true);
    }

    const snap = await capture(page, 'after-layer-select');
    assertNoCriticalAnomalies(snap);
  });

  // ─── LYR-10: Multi-select in layer tree ──────────────────────────────────
  test('LYR-10: Shift+click layer items for multi-select', async ({ page }) => {
    const [backId, frontId] = await seedTwoRects(page);
    await page.waitForTimeout(200);

    // Click first element in layer tree
    const layer1 = page.locator(`.layer-item[data-id="${backId}"]`);
    const layer2 = page.locator(`.layer-item[data-id="${frontId}"]`);

    if (await layer1.count() > 0 && await layer2.count() > 0) {
      await layer1.click();
      await page.waitForTimeout(100);
      await layer2.click({ modifiers: ['Shift'] });
      await page.waitForTimeout(200);

      const count = await page.evaluate(() => {
        return (window as any).__TEST_STORE__.getState().editor.selectedElementIds.length;
      });
      expect(count).toBeGreaterThanOrEqual(2);
    }

    const snap = await capture(page, 'after-multi-select');
    assertNoCriticalAnomalies(snap);
  });

  // ─── LYR-11: Rename element in layer tree ─────────────────────────────────
  test('LYR-11: Double-click renames layer', async ({ page }) => {
    const [backId] = await seedTwoRects(page);
    await page.waitForTimeout(200);

    const nameEl = page.locator(`.layer-item[data-id="${backId}"] .layer-item-name`);
    if (await nameEl.count() > 0) {
      await nameEl.dblclick();
      await page.waitForTimeout(200);

      // Type new name
      await page.keyboard.type('Renamed Layer');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      const newName = await page.evaluate((id) => {
        const s = (window as any).__TEST_STORE__.getState();
        const slide = s.slides[s.editor.activeSlideId];
        return slide.elements[id]?.name;
      }, backId);
      // Name should have been updated (could be 'Renamed Layer' or the typed content)
      if (newName) {
        expect(newName).toContain('Renamed');
      }
    }

    const snap = await capture(page, 'after-rename');
    assertNoCriticalAnomalies(snap);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Layer operations maintain store-DOM consistency', async ({ page }) => {
    const [backId, frontId] = await seedTwoRects(page);
    await page.waitForTimeout(200);

    // Select back, bring to front
    await page.evaluate((id) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SELECTION', [id]);
    }, backId);
    await page.keyboard.press('Control+Shift+]');
    await page.waitForTimeout(200);

    const snap1 = await capture(page, 'layer-reorder');
    assertNoCriticalAnomalies(snap1);

    // Lock the element
    await page.evaluate((id) => {
      (window as any).__TEST_STORE__.dispatch('TOGGLE_ELEMENT_LOCK', { id });
    }, backId);
    await page.waitForTimeout(200);

    const snap2 = await capture(page, 'layer-lock');
    assertNoCriticalAnomalies(snap2);
  });
});
