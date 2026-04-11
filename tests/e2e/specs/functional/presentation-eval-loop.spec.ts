/**
 * Eval Loop: Presentation Mode (PRS-01 → PRS-20)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Presentation Mode', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function getMode(page: import('@playwright/test').Page) {
    return page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.mode);
  }

  // ─── PRS-01: Start presentation ───────────────────────────────────────────
  test('PRS-01: Start presentation via store dispatch', async ({ page }) => {
    const modeBefore = await getMode(page);
    expect(modeBefore).toBe('edit');

    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_MODE', 'presentation');
    });
    await page.waitForTimeout(500);

    const modeAfter = await getMode(page);
    expect(modeAfter).toBe('presentation');

    const snap = await capture(page, 'presentation-started');
    assertNoCriticalAnomalies(snap);
  });

  // ─── PRS-03: Exit presentation ────────────────────────────────────────────
  test('PRS-03: Exit presentation with Escape', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_MODE', 'presentation');
    });
    await page.waitForTimeout(500);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const mode = await getMode(page);
    expect(mode).toBe('edit');
  });

  // ─── PRS-04: Navigate between slides ───────────────────────────────────
  test('PRS-04: Navigate to next slide via SET_ACTIVE_SLIDE', async ({ page }) => {
    // Add second slide
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ADD_SLIDE');
    });
    await page.waitForTimeout(200);

    const slides = await page.evaluate(() => (window as any).__TEST_STORE__.getState().slideOrder);
    expect(slides.length).toBeGreaterThanOrEqual(2);

    // Navigate to second slide
    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('SET_ACTIVE_SLIDE', id);
    }, { id: slides[1] });
    await page.waitForTimeout(300);

    const activeId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);
    expect(activeId).toBe(slides[1]);

    const snap = await capture(page, 'navigated-next-slide');
    assertNoCriticalAnomalies(snap);
  });

  // ─── PRS-05: Navigate back to first slide ──────────────────────────────
  test('PRS-05: Navigate back to previous slide', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ADD_SLIDE');
    });
    await page.waitForTimeout(200);

    const slides = await page.evaluate(() => (window as any).__TEST_STORE__.getState().slideOrder);

    // Go to slide 2
    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('SET_ACTIVE_SLIDE', id);
    }, { id: slides[1] });
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId)).toBe(slides[1]);

    // Go back to slide 1
    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('SET_ACTIVE_SLIDE', id);
    }, { id: slides[0] });
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId)).toBe(slides[0]);
  });

  // ─── PRS-20: Mode persists after tool keys ───────────────────────────────
  test('PRS-20: Presentation mode persists despite key presses', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_MODE', 'presentation');
    });
    await page.waitForTimeout(500);

    // Press various keys — mode should remain presentation
    await page.keyboard.press('r');
    await page.keyboard.press('t');
    await page.keyboard.press('v');
    await page.waitForTimeout(200);

    const mode = await getMode(page);
    expect(mode).toBe('presentation');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Presentation mode enters and exits cleanly', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_MODE', 'presentation');
    });
    await page.waitForTimeout(500);
    const snap1 = await capture(page, 'in-presentation');
    assertNoCriticalAnomalies(snap1);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const snap2 = await capture(page, 'after-exit-presentation');
    assertNoCriticalAnomalies(snap2);
  });
});
