/**
 * Eval Loop: Snapping & Alignment (SNA-01 → SNA-10)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Snapping & Alignment', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function seedTwoRects(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const ts = Date.now().toString(36);
      const id1 = `eval-snap-a-${ts}`;
      const id2 = `eval-snap-b-${ts}`;
      store.dispatch('ADD_ELEMENT', { id: id1, type: 'rect', x: 100, y: 100, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#4A90D9' }] });
      store.dispatch('ADD_ELEMENT', { id: id2, type: 'rect', x: 300, y: 250, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#D94A4A' }] });
      store.dispatch('UPDATE_SELECTION', [id1, id2]);
      return { id1, id2 };
    });
  }

  function seedThreeRects(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const ts = Date.now().toString(36);
      const id1 = `eval-snap-a-${ts}`;
      const id2 = `eval-snap-b-${ts}`;
      const id3 = `eval-snap-c-${ts}`;
      store.dispatch('ADD_ELEMENT', { id: id1, type: 'rect', x: 50, y: 100, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#4A90D9' }] });
      store.dispatch('ADD_ELEMENT', { id: id2, type: 'rect', x: 200, y: 200, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#D94A4A' }] });
      store.dispatch('ADD_ELEMENT', { id: id3, type: 'rect', x: 400, y: 300, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#49D94A' }] });
      store.dispatch('UPDATE_SELECTION', [id1, id2, id3]);
      return { id1, id2, id3 };
    });
  }

  function getElementPos(page: import('@playwright/test').Page, id: string) {
    return page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      return { x: el.x, y: el.y, width: el.width, height: el.height };
    }, { eid: id });
  }

  // ─── SNA-01: Align left ──────────────────────────────────────────────────
  test('SNA-01: Align selected elements left', async ({ page }) => {
    const { id1, id2 } = await seedTwoRects(page);
    await page.waitForTimeout(200);

    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ALIGN_ELEMENTS', 'left');
    });
    await page.waitForTimeout(200);

    const pos1 = await getElementPos(page, id1);
    const pos2 = await getElementPos(page, id2);
    expect(pos1.x).toBe(pos2.x);

    const snap = await capture(page, 'aligned-left');
    assertNoCriticalAnomalies(snap);
  });

  // ─── SNA-02: Align center ────────────────────────────────────────────────
  test('SNA-02: Align selected elements center', async ({ page }) => {
    const { id1, id2 } = await seedTwoRects(page);
    await page.waitForTimeout(200);

    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ALIGN_ELEMENTS', 'center');
    });
    await page.waitForTimeout(200);

    const pos1 = await getElementPos(page, id1);
    const pos2 = await getElementPos(page, id2);
    const center1 = pos1.x + pos1.width / 2;
    const center2 = pos2.x + pos2.width / 2;
    expect(Math.abs(center1 - center2)).toBeLessThan(1);
  });

  // ─── SNA-03: Align right ──────────────────────────────────────────────────
  test('SNA-03: Align selected elements right', async ({ page }) => {
    const { id1, id2 } = await seedTwoRects(page);
    await page.waitForTimeout(200);

    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ALIGN_ELEMENTS', 'right');
    });
    await page.waitForTimeout(200);

    const pos1 = await getElementPos(page, id1);
    const pos2 = await getElementPos(page, id2);
    expect(Math.abs((pos1.x + pos1.width) - (pos2.x + pos2.width))).toBeLessThan(1);
  });

  // ─── SNA-04: Align top ───────────────────────────────────────────────────
  test('SNA-04: Align selected elements top', async ({ page }) => {
    const { id1, id2 } = await seedTwoRects(page);
    await page.waitForTimeout(200);

    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ALIGN_ELEMENTS', 'top');
    });
    await page.waitForTimeout(200);

    const pos1 = await getElementPos(page, id1);
    const pos2 = await getElementPos(page, id2);
    expect(pos1.y).toBe(pos2.y);
  });

  // ─── SNA-05: Distribute horizontal ───────────────────────────────────────
  test('SNA-05: Distribute elements horizontally', async ({ page }) => {
    const { id1, id2, id3 } = await seedThreeRects(page);
    await page.waitForTimeout(200);

    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('DISTRIBUTE_ELEMENTS', 'horizontal');
    });
    await page.waitForTimeout(200);

    const p1 = await getElementPos(page, id1);
    const p2 = await getElementPos(page, id2);
    const p3 = await getElementPos(page, id3);

    // After horizontal distribution, center-to-center spacing should be equal
    const centers = [p1, p2, p3].map(p => p.x + p.width / 2).sort((a, b) => a - b);
    const gap1 = centers[1] - centers[0];
    const gap2 = centers[2] - centers[1];
    expect(Math.abs(gap1 - gap2)).toBeLessThan(2);
  });

  // ─── SNA-06: Toggle snap to objects ───────────────────────────────────────
  test('SNA-06: Toggle snap to objects', async ({ page }) => {
    const before = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.snapToObject);

    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('TOGGLE_SNAP_TO_OBJECT');
    });
    await page.waitForTimeout(100);

    const after = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.snapToObject);
    expect(after).toBe(!before);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Alignment operations maintain consistency', async ({ page }) => {
    await seedTwoRects(page);
    await page.waitForTimeout(200);

    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ALIGN_ELEMENTS', 'center');
    });
    await page.waitForTimeout(200);

    const snap = await capture(page, 'alignment-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
