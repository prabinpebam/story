/**
 * Eval Loop: Fills System (FIL-01 → FIL-18)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Fills System', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function seedRect(page: import('@playwright/test').Page, overrides = {}) {
    return page.evaluate((ov) => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-fill-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x: 200, y: 200, width: 120, height: 80, rotation: 0, opacity: 1,
        fills: [{ type: 'solid', color: '#4A90D9', opacity: 100, visible: true }],
        ...ov,
      });
      store.dispatch('UPDATE_SELECTION', [id]);
      return id;
    }, overrides);
  }

  function getElementFills(page: import('@playwright/test').Page, id: string) {
    return page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId].elements[eid]?.fills
        ?? s.slides[s.editor.activeSlideId].elements[eid]?.style?.fills;
    }, { eid: id });
  }

  // ─── FIL-01: Apply solid fill via store ───────────────────────────────────
  test('FIL-01: Apply solid fill color via store', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{ type: 'solid', color: '#FF0000', opacity: 100, visible: true }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getElementFills(page, id);
    expect(fills[0].color).toBe('#FF0000');

    const snap = await capture(page, 'after-fill-red');
    assertNoCriticalAnomalies(snap);
  });

  // ─── FIL-02: Change fill opacity via store ────────────────────────────────
  test('FIL-02: Change fill opacity via store', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{ type: 'solid', color: '#4A90D9', opacity: 50, visible: true }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getElementFills(page, id);
    expect(fills[0].opacity).toBe(50);
  });

  // ─── FIL-03: Toggle fill visibility ───────────────────────────────────────
  test('FIL-03: Toggle fill visibility via store', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{ type: 'solid', color: '#4A90D9', opacity: 100, visible: false }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getElementFills(page, id);
    expect(fills[0].visible).toBe(false);
  });

  // ─── FIL-04: Multiple fills ───────────────────────────────────────────────
  test('FIL-04: Add multiple fills via store', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [
          { type: 'solid', color: '#FF0000', opacity: 100, visible: true },
          { type: 'solid', color: '#00FF00', opacity: 50, visible: true },
        ],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getElementFills(page, id);
    expect(fills.length).toBe(2);
    expect(fills[0].color).toBe('#FF0000');
    expect(fills[1].color).toBe('#00FF00');
  });

  // ─── FIL-05: Remove all fills ─────────────────────────────────────────────
  test('FIL-05: Clear all fills via store', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getElementFills(page, id);
    expect(fills.length).toBe(0);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Fill operations maintain store consistency', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{ type: 'solid', color: '#AABBCC', opacity: 75, visible: true }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const snap = await capture(page, 'fill-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
