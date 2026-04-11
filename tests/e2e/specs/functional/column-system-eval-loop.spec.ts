/**
 * Eval Loop: Column System & Layout Guides (COL-01 → COL-18)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Column System', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function getActiveSlideId(page: import('@playwright/test').Page) {
    return page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);
  }

  function getLayoutGuide(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId]?.layoutGuide ?? null;
    });
  }

  // ─── COL-01: Set column count via store ───────────────────────────────────
  test('COL-01: Set column count via UPDATE_SLIDE', async ({ page }) => {
    const slideId = await getActiveSlideId(page);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        layoutGuide: {
          columns: { count: 3, gutter: 20 },
          margins: { top: 40, left: 40, right: 40, bottom: 40 },
        },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const guide = await getLayoutGuide(page);
    expect(guide).not.toBeNull();
    expect(guide.columns.count).toBe(3);
    expect(guide.columns.gutter).toBe(20);

    const snap = await capture(page, 'columns-set');
    assertNoCriticalAnomalies(snap);
  });

  // ─── COL-02: Update column count ──────────────────────────────────────────
  test('COL-02: Change column count', async ({ page }) => {
    const slideId = await getActiveSlideId(page);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        layoutGuide: {
          columns: { count: 4, gutter: 16 },
          margins: { top: 40, left: 40, right: 40, bottom: 40 },
        },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const guide = await getLayoutGuide(page);
    expect(guide.columns.count).toBe(4);
    expect(guide.columns.gutter).toBe(16);
  });

  // ─── COL-03: Set margins ──────────────────────────────────────────────────
  test('COL-03: Set layout guide margins', async ({ page }) => {
    const slideId = await getActiveSlideId(page);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        layoutGuide: {
          columns: { count: 3, gutter: 20 },
          margins: { top: 60, left: 80, right: 80, bottom: 60 },
        },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const guide = await getLayoutGuide(page);
    expect(guide.margins.left).toBe(80);
    expect(guide.margins.top).toBe(60);
  });

  // ─── COL-04: Toggle column snapping ───────────────────────────────────────
  test('COL-04: Toggle column snapping', async ({ page }) => {
    const before = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.snapToColumns);

    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('TOGGLE_SNAP_TO_COLUMNS');
    });
    await page.waitForTimeout(100);

    const after = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.snapToColumns);
    expect(after).toBe(!before);
  });

  // ─── COL-05: Clear layout guide ───────────────────────────────────────────
  test('COL-05: Clear layout guide', async ({ page }) => {
    const slideId = await getActiveSlideId(page);

    // Set, then clear
    await page.evaluate(({ sid }) => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('UPDATE_SLIDE', {
        id: sid,
        layoutGuide: { columns: { count: 3, gutter: 20 }, margins: { top: 40, left: 40, right: 40, bottom: 40 } },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        layoutGuide: null,
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const guide = await getLayoutGuide(page);
    expect(guide).toBeNull();
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Column system maintains store consistency', async ({ page }) => {
    const slideId = await getActiveSlideId(page);
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        layoutGuide: { columns: { count: 6, gutter: 12 }, margins: { top: 20, left: 20, right: 20, bottom: 20 } },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const snap = await capture(page, 'column-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
