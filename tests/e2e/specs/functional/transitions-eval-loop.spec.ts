/**
 * Eval Loop: Transitions (TRN-01 → TRN-04)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Transitions', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function getSlideTransition(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return slide?.styleAssignments?.slideTransition ?? null;
    });
  }

  // ─── TRN-01: Set crossFade transition ─────────────────────────────────────
  test('TRN-01: Apply crossFade transition via store', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: {
          slideTransition: { type: 'crossFade', durationMs: 300, easing: 'ease-in-out' },
        },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const tr = await getSlideTransition(page);
    expect(tr).not.toBeNull();
    expect(tr.type).toBe('crossFade');
    expect(tr.durationMs).toBe(300);

    const snap = await capture(page, 'transition-crossfade');
    assertNoCriticalAnomalies(snap);
  });

  // ─── TRN-02: Set push transition with direction ───────────────────────────
  test('TRN-02: Apply push transition with direction', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: {
          slideTransition: { type: 'push', direction: 'left', durationMs: 500, easing: 'ease-in-out' },
        },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const tr = await getSlideTransition(page);
    expect(tr.type).toBe('push');
    expect(tr.direction).toBe('left');
  });

  // ─── TRN-03: Remove transition (set to none) ─────────────────────────────
  test('TRN-03: Remove transition by setting null', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);

    // Set a transition first
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: {
          slideTransition: { type: 'wipe', direction: 'right', durationMs: 400, easing: 'ease-in-out' },
        },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    // Remove it
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { slideTransition: null },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const tr = await getSlideTransition(page);
    expect(tr).toBeNull();
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Transition operations maintain consistency', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: {
          slideTransition: { type: 'cover', direction: 'up', durationMs: 250, easing: 'ease-in-out' },
        },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const snap = await capture(page, 'transition-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
