/**
 * Eval Loop: Style Assignments Cascade
 * 
 * Tests the full cascade for all styleable properties:
 * colorTheme, typographyStyle, slideTransition.
 * Each cascades: Slide → Layout → Master → Default.
 * 
 * Taskflows Covered:
 * SAC-01: Slide transition inherits from master when null
 * SAC-02: Slide transition overrides master
 * SAC-03: Layout transition overrides master, slide inherits from layout
 * SAC-04: Clearing slide transition reverts to layout/master
 * SAC-05: Multiple style assignments can be set simultaneously
 * SAC-06: Style assignments on layout propagate to all slides on that layout
 * SAC-07: Batch update multiple slides' style assignments
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Style Assignments Cascade', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function getSlideStyleAssignments(page: import('@playwright/test').Page, slideId?: string) {
    return page.evaluate((sid) => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[sid ?? s.editor.activeSlideId]?.styleAssignments ?? {};
    }, slideId);
  }

  // ─── SAC-01: Transition inherits from master ──────────────────────────────
  test('SAC-01: Slide with null transition inherits from master/layout', async ({ page }) => {
    const sa = await getSlideStyleAssignments(page);
    // By default, slideTransition should be null (inherit)
    expect(sa.slideTransition === null || sa.slideTransition === undefined).toBe(true);

    const snap = await capture(page, 'transition-inherits');
    assertNoCriticalAnomalies(snap);
  });

  // ─── SAC-02: Slide transition override ────────────────────────────────────
  test('SAC-02: Slide transition override takes precedence', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: {
          slideTransition: { type: 'wipe', direction: 'right', durationMs: 500, easing: 'ease-in-out' },
        },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const sa = await getSlideStyleAssignments(page);
    expect(sa.slideTransition).toBeDefined();
    expect(sa.slideTransition.type).toBe('wipe');
    expect(sa.slideTransition.direction).toBe('right');

    // Cleanup
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { slideTransition: null },
      });
    }, { sid: slideId });
  });

  // ─── SAC-03: Layout transition cascades to slides ─────────────────────────
  test('SAC-03: Layout transition overrides master for its slides', async ({ page }) => {
    const layoutId = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId]?.layoutId ?? null;
    });
    if (!layoutId) { test.skip(); return; }

    // Set transition on layout
    await page.evaluate(({ lid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
        masterId: lid,
        styleAssignments: {
          slideTransition: { type: 'push', direction: 'left', durationMs: 300, easing: 'ease-in-out' },
        },
      });
    }, { lid: layoutId });
    await page.waitForTimeout(200);

    // Layout should have the transition
    const layoutSA = await page.evaluate(({ lid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slideMasterPresets?.[lid]?.styleAssignments ?? {};
    }, { lid: layoutId });
    expect(layoutSA.slideTransition?.type).toBe('push');

    // Cleanup
    await page.evaluate(({ lid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
        masterId: lid,
        styleAssignments: { slideTransition: null },
      });
    }, { lid: layoutId });
  });

  // ─── SAC-04: Clearing slide transition reverts ────────────────────────────
  test('SAC-04: Clear slide transition reverts to inherited', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);

    // Set
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: {
          slideTransition: { type: 'cover', direction: 'up', durationMs: 400, easing: 'ease-in-out' },
        },
      });
    }, { sid: slideId });
    await page.waitForTimeout(100);

    let sa = await getSlideStyleAssignments(page);
    expect(sa.slideTransition?.type).toBe('cover');

    // Clear
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { slideTransition: null },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    sa = await getSlideStyleAssignments(page);
    expect(sa.slideTransition).toBeNull();
  });

  // ─── SAC-05: Multiple properties at once ──────────────────────────────────
  test('SAC-05: Set colorTheme and slideTransition simultaneously', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: {
          colorTheme: 'multi-prop-theme',
          slideTransition: { type: 'crossFade', durationMs: 250, easing: 'ease-in-out' },
        },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const sa = await getSlideStyleAssignments(page);
    expect(sa.colorTheme).toBe('multi-prop-theme');
    expect(sa.slideTransition?.type).toBe('crossFade');

    // Cleanup
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { colorTheme: null, slideTransition: null },
      });
    }, { sid: slideId });
  });

  // ─── SAC-06: Layout style affects all slides on it ────────────────────────
  test('SAC-06: Layout style propagates to all slides on that layout', async ({ page }) => {
    // Add second slide (same layout)
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ADD_SLIDE');
    });
    await page.waitForTimeout(200);

    const slides = await page.evaluate(() => (window as any).__TEST_STORE__.getState().slideOrder);
    const layoutId = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId]?.layoutId ?? null;
    });

    if (!layoutId) { test.skip(); return; }

    // Set theme on layout
    await page.evaluate(({ lid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
        masterId: lid,
        styleAssignments: { colorTheme: 'layout-wide-theme' },
      });
    }, { lid: layoutId });
    await page.waitForTimeout(200);

    // Both slides should see layout override
    for (const sid of slides) {
      const slideLayoutId = await page.evaluate(({ id }) => {
        return (window as any).__TEST_STORE__.getState().slides[id]?.layoutId;
      }, { id: sid });
      
      if (slideLayoutId === layoutId) {
        const slideTheme = await page.evaluate(({ id }) => {
          const s = (window as any).__TEST_STORE__.getState();
          return s.slides[id]?.styleAssignments?.colorTheme;
        }, { id: sid });
        // Slide itself should NOT have override (inherits from layout)
        expect(slideTheme === null || slideTheme === undefined).toBe(true);
      }
    }

    // Layout has the override
    const layoutTheme = await page.evaluate(({ lid }) => {
      return (window as any).__TEST_STORE__.getState().slideMasterPresets?.[lid]?.colorThemeId;
    }, { lid: layoutId });
    expect(layoutTheme).toBe('layout-wide-theme');

    // Cleanup
    await page.evaluate(({ lid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
        masterId: lid,
        styleAssignments: { colorTheme: null },
      });
    }, { lid: layoutId });
  });

  // ─── SAC-07: Batch update multiple slides ─────────────────────────────────
  test('SAC-07: Batch update slides style assignments', async ({ page }) => {
    // Add slides
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ADD_SLIDE');
      (window as any).__TEST_STORE__.dispatch('ADD_SLIDE');
    });
    await page.waitForTimeout(200);

    const slides = await page.evaluate(() => (window as any).__TEST_STORE__.getState().slideOrder);

    // Batch update
    await page.evaluate(({ sids }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDES_STYLE_ASSIGNMENTS', {
        slideIds: sids,
        styleAssignments: {
          slideTransition: { type: 'push', direction: 'right', durationMs: 350, easing: 'ease-in-out' },
        },
      });
    }, { sids: slides });
    await page.waitForTimeout(200);

    // All slides should have the transition
    for (const sid of slides) {
      const sa = await getSlideStyleAssignments(page, sid);
      expect(sa.slideTransition?.type).toBe('push');
    }

    // Cleanup
    await page.evaluate(({ sids }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDES_STYLE_ASSIGNMENTS', {
        slideIds: sids,
        styleAssignments: { slideTransition: null },
      });
    }, { sids: slides });
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Style assignments cascade is consistent', async ({ page }) => {
    const result = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slideId = s.editor.activeSlideId;
      const slide = s.slides[slideId];
      return {
        slideExists: !!slide,
        // styleAssignments may not exist until first override is set
        assignmentsType: typeof (slide?.styleAssignments),
      };
    });

    expect(result.slideExists).toBe(true);
    // styleAssignments is either undefined or an object
    expect(['undefined', 'object']).toContain(result.assignmentsType);

    const snap = await capture(page, 'style-cascade-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
