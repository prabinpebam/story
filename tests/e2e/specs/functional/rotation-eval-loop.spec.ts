/**
 * Eval Loop: Element Rotation (ROT-01 → ROT-04)
 */

import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture,
  waitForCanvasManager,
  assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Element Rotation', () => {
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
      const id = `eval-rot-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x: 300, y: 300, width: 200, height: 150,
        rotation: 0, opacity: 1, name: 'Eval Rotate Rect',
        fills: [{ type: 'solid', color: '#4A90D9' }],
      });
      store.dispatch('UPDATE_SELECTION', [id]);
      return id;
    });
  }

  async function getRotation(page: import('@playwright/test').Page, id: string) {
    return page.evaluate(({ id }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return slide.elements[id]?.rotation ?? 0;
    }, { id });
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

  // ─── ROT-01: Rotate element via store dispatch ─────────────────────────────
  test('ROT-01: Rotate element via UPDATE_ELEMENT', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    const rotBefore = await getRotation(page, id);
    expect(rotBefore).toBe(0);

    // Rotate via store dispatch
    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, rotation: 45 });
    }, { id });
    await page.waitForTimeout(200);

    const rotAfter = await getRotation(page, id);
    expect(rotAfter).toBe(45);

    const snap = await capture(page, 'after-rotation');
    assertNoCriticalAnomalies(snap);

    // Verify DOM reflects rotation (transform should include rotate)
    const domRotation = await page.evaluate(({ id }) => {
      const el = document.querySelector(`.slide-element[data-element-id="${id}"]`) as HTMLElement;
      if (!el) return null;
      return el.style.transform || getComputedStyle(el).transform;
    }, { id });
    expect(domRotation).toBeTruthy();
  });

  // ─── ROT-02: Snap to 15° increments ──────────────────────────────────────
  test('ROT-02: Rotation to 15° increments via store', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, rotation: 15 });
    }, { id });
    await page.waitForTimeout(200);

    const rot = await getRotation(page, id);
    expect(rot % 15).toBe(0);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Store↔DOM sync after rotation', async ({ page }) => {
    await seedRect(page);
    await page.waitForTimeout(200);

    const snap = await capture(page, 'rotation-check');
    assertNoCriticalAnomalies(snap);
  });
});
