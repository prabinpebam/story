/**
 * Eval Loop: Slide Management (SLD-01 → SLD-06)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Slide Management', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function getSlideCount(page: import('@playwright/test').Page) {
    return page.evaluate(() => (window as any).__TEST_STORE__.getState().slideOrder.length);
  }

  function getActiveSlideId(page: import('@playwright/test').Page) {
    return page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);
  }

  // ─── SLD-01: Add slide ────────────────────────────────────────────────────
  test('SLD-01: Add slide via store dispatch', async ({ page }) => {
    const before = await getSlideCount(page);
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ADD_SLIDE');
    });
    await page.waitForTimeout(300);

    expect(await getSlideCount(page)).toBe(before + 1);
    const snap = await capture(page, 'after-add-slide');
    assertNoCriticalAnomalies(snap);
  });

  // ─── SLD-03: Duplicate slide ──────────────────────────────────────────────
  test('SLD-03: Duplicate slide', async ({ page }) => {
    const before = await getSlideCount(page);
    const activeId = await getActiveSlideId(page);
    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('DUPLICATE_SLIDE', id);
    }, { id: activeId });
    await page.waitForTimeout(300);

    expect(await getSlideCount(page)).toBe(before + 1);
  });

  // ─── SLD-04: Change active slide ──────────────────────────────────────────
  test('SLD-04: Change active slide', async ({ page }) => {
    // Add a second slide
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ADD_SLIDE');
    });
    await page.waitForTimeout(200);

    const slides = await page.evaluate(() => (window as any).__TEST_STORE__.getState().slideOrder);
    const firstId = slides[0];
    const secondId = slides[1];

    // Switch to first slide
    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('SET_ACTIVE_SLIDE', id);
    }, { id: firstId });
    await page.waitForTimeout(200);

    expect(await getActiveSlideId(page)).toBe(firstId);

    // Switch to second
    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('SET_ACTIVE_SLIDE', id);
    }, { id: secondId });
    await page.waitForTimeout(200);

    expect(await getActiveSlideId(page)).toBe(secondId);

    const snap = await capture(page, 'after-slide-switch');
    assertNoCriticalAnomalies(snap);
  });

  // ─── SLD-02: Delete slide ─────────────────────────────────────────────────
  test('SLD-02: Delete slide (keep at least 1)', async ({ page }) => {
    // Start with 2 slides
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ADD_SLIDE');
    });
    await page.waitForTimeout(200);

    const before = await getSlideCount(page);
    expect(before).toBeGreaterThanOrEqual(2);

    const activeId = await getActiveSlideId(page);
    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('DELETE_SLIDE', id);
    }, { id: activeId });
    await page.waitForTimeout(200);

    expect(await getSlideCount(page)).toBe(before - 1);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Slide operations maintain consistency', async ({ page }) => {
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('ADD_SLIDE');
      const activeId = store.getState().editor.activeSlideId;
      store.dispatch('DUPLICATE_SLIDE', activeId);
    });
    await page.waitForTimeout(300);

    const snap = await capture(page, 'slide-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
