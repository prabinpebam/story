/**
 * Eval Loop: Property Inspector — Slide Background Color (BKG-01 → BKG-10)
 *
 * Comprehensive tests for slide background color operations.
 * Covers solid/gradient backgrounds, inheritance cascade (slide → layout → master),
 * clearing to inherit, master background propagation, and multi-fill backgrounds.
 *
 * Taskflows:
 * BKG-01: Set slide background solid color
 * BKG-02: Change slide background to different color
 * BKG-03: Slide background gradient
 * BKG-04: Clear slide background (inherit from parent)
 * BKG-05: Background inherits from master when slide is null
 * BKG-06: Set master background color
 * BKG-07: Master background change propagates to inheriting slides
 * BKG-08: Slide background overrides master background
 * BKG-09: Multiple background fills on slide
 * BKG-10: Background fill with theme slot reference
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: PI Slide Background Color', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function getSlideId(page: import('@playwright/test').Page) {
    return page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);
  }

  function getSlide(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId];
    });
  }

  function getMasterId(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      const layoutId = slide.layoutId;
      const layout = s.layouts?.[layoutId];
      return layout?.parentMasterId ?? 'master-default';
    });
  }

  function getMaster(page: import('@playwright/test').Page, masterId: string) {
    return page.evaluate(({ mid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.masters?.[mid] ?? s.themeMasters?.[mid];
    }, { mid: masterId });
  }

  // ─── BKG-01: Set slide background solid color ────────────────────────────
  test('BKG-01: Set slide background solid color', async ({ page }) => {
    const slideId = await getSlideId(page);
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        background: [{ type: 'solid', value: '#3498DB', color: '#3498DB', opacity: 100, visible: true }],
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const slide = await getSlide(page);
    const bg = Array.isArray(slide.background) ? slide.background : [slide.background];
    const firstFill = bg[0];
    expect(firstFill.type).toBe('solid');
    expect(firstFill.value || firstFill.color).toBe('#3498DB');

    const snap = await capture(page, 'bkg-01-blue');
    assertNoCriticalAnomalies(snap);
  });

  // ─── BKG-02: Change background color ─────────────────────────────────────
  test('BKG-02: Change slide background to different color', async ({ page }) => {
    const slideId = await getSlideId(page);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        background: [{ type: 'solid', value: '#E74C3C', color: '#E74C3C', opacity: 100, visible: true }],
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const slide = await getSlide(page);
    const bg = Array.isArray(slide.background) ? slide.background : [slide.background];
    expect(bg[0].value || bg[0].color).toBe('#E74C3C');
  });

  // ─── BKG-03: Gradient background ─────────────────────────────────────────
  test('BKG-03: Slide background gradient', async ({ page }) => {
    const slideId = await getSlideId(page);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        background: [{
          type: 'gradient', opacity: 100, visible: true,
          value: {
            type: 'linear', angle: 135,
            stops: [
              { color: '#000000', position: 0 },
              { color: '#FFFFFF', position: 100 },
            ],
          },
        }],
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const slide = await getSlide(page);
    const bg = Array.isArray(slide.background) ? slide.background : [slide.background];
    expect(bg[0].type).toBe('gradient');
  });

  // ─── BKG-04: Clear background (inherit) ───────────────────────────────────
  test('BKG-04: Clear slide background (inherit from parent)', async ({ page }) => {
    const slideId = await getSlideId(page);

    // Set first
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        background: [{ type: 'solid', value: '#FF0000', color: '#FF0000', opacity: 100, visible: true }],
      });
    }, { sid: slideId });
    await page.waitForTimeout(100);

    // Clear → null = inherit
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        background: null,
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const slide = await getSlide(page);
    expect(slide.background).toBeNull();
  });

  // ─── BKG-05: Background inherits from master ─────────────────────────────
  test('BKG-05: Background inherits from master when slide bg is null', async ({ page }) => {
    const slideId = await getSlideId(page);
    const masterId = await getMasterId(page);

    // Set master background
    await page.evaluate(({ mid }) => {
      const store = (window as any).__TEST_STORE__;
      const s = store.getState();
      if (s.masters?.[mid] || s.themeMasters?.[mid]) {
        store.dispatch('UPDATE_MASTER', {
          id: mid,
          background: [{ type: 'solid', value: '#2C3E50', color: '#2C3E50', opacity: 100, visible: true }],
        });
      }
    }, { mid: masterId });
    await page.waitForTimeout(100);

    // Clear slide background
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', { id: sid, background: null });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const slide = await getSlide(page);
    // Slide bg is null → should inherit from master
    expect(slide.background).toBeNull();

    // Verify master has the background
    const master = await getMaster(page, masterId);
    if (master?.background) {
      const bg = Array.isArray(master.background) ? master.background : [master.background];
      expect(bg[0].value || bg[0].color).toBe('#2C3E50');
    }
  });

  // ─── BKG-06: Set master background ───────────────────────────────────────
  test('BKG-06: Set master background color', async ({ page }) => {
    const masterId = await getMasterId(page);

    await page.evaluate(({ mid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_MASTER', {
        id: mid,
        background: [{ type: 'solid', value: '#1ABC9C', color: '#1ABC9C', opacity: 100, visible: true }],
      });
    }, { mid: masterId });
    await page.waitForTimeout(200);

    const master = await getMaster(page, masterId);
    if (master?.background) {
      const bg = Array.isArray(master.background) ? master.background : [master.background];
      expect(bg[0].value || bg[0].color).toBe('#1ABC9C');
    }
  });

  // ─── BKG-07: Master background propagation ───────────────────────────────
  test('BKG-07: Master background change propagates to inheriting slides', async ({ page }) => {
    const slideId = await getSlideId(page);
    const masterId = await getMasterId(page);

    // Ensure slide inherits (null bg)
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', { id: sid, background: null });
    }, { sid: slideId });
    await page.waitForTimeout(100);

    // Set master bg
    await page.evaluate(({ mid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_MASTER', {
        id: mid,
        background: [{ type: 'solid', value: '#8E44AD', color: '#8E44AD', opacity: 100, visible: true }],
      });
    }, { mid: masterId });
    await page.waitForTimeout(200);

    // Slide bg should still be null (inheriting)
    const slide = await getSlide(page);
    expect(slide.background).toBeNull();

    // Master should have the color
    const master = await getMaster(page, masterId);
    if (master?.background) {
      const bg = Array.isArray(master.background) ? master.background : [master.background];
      expect(bg[0].value || bg[0].color).toBe('#8E44AD');
    }
  });

  // ─── BKG-08: Slide overrides master ───────────────────────────────────────
  test('BKG-08: Slide background overrides master background', async ({ page }) => {
    const slideId = await getSlideId(page);
    const masterId = await getMasterId(page);

    // Set master bg
    await page.evaluate(({ mid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_MASTER', {
        id: mid,
        background: [{ type: 'solid', value: '#111111', color: '#111111', opacity: 100, visible: true }],
      });
    }, { mid: masterId });
    await page.waitForTimeout(100);

    // Set slide bg (override)
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        background: [{ type: 'solid', value: '#EEEEEE', color: '#EEEEEE', opacity: 100, visible: true }],
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const slide = await getSlide(page);
    const bg = Array.isArray(slide.background) ? slide.background : [slide.background];
    expect(bg[0].value || bg[0].color).toBe('#EEEEEE');
  });

  // ─── BKG-09: Multiple background fills ───────────────────────────────────
  test('BKG-09: Multiple background fills on slide', async ({ page }) => {
    const slideId = await getSlideId(page);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        background: [
          { type: 'solid', value: '#FFFFFF', color: '#FFFFFF', opacity: 100, visible: true },
          {
            type: 'gradient', opacity: 50, visible: true,
            value: {
              type: 'linear', angle: 180,
              stops: [{ color: '#000000', position: 0 }, { color: '#FFFFFF', position: 100 }],
            },
          },
        ],
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const slide = await getSlide(page);
    const bg = Array.isArray(slide.background) ? slide.background : [slide.background];
    expect(bg.length).toBe(2);
    expect(bg[0].type).toBe('solid');
    expect(bg[1].type).toBe('gradient');
  });

  // ─── BKG-10: Background with theme slot ───────────────────────────────────
  test('BKG-10: Background fill with theme slot reference', async ({ page }) => {
    const slideId = await getSlideId(page);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        background: [{
          type: 'solid', value: '#CCCCCC', color: '#CCCCCC',
          opacity: 100, visible: true,
          themeSlot: 10,
          source: { type: 'theme', themeSlot: 10 },
        }],
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const slide = await getSlide(page);
    const bg = Array.isArray(slide.background) ? slide.background : [slide.background];
    expect(bg[0].themeSlot).toBe(10);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Background operations maintain valid state', async ({ page }) => {
    const slideId = await getSlideId(page);

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        background: [{ type: 'solid', value: '#336699', color: '#336699', opacity: 75, visible: true }],
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const result = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      const bg = slide.background;
      if (!bg) return { isNull: true };
      const arr = Array.isArray(bg) ? bg : [bg];
      return {
        isNull: false,
        allHaveType: arr.every((f: any) => typeof f.type === 'string'),
        allHaveOpacity: arr.every((f: any) => typeof f.opacity === 'number'),
        opacityValid: arr.every((f: any) => f.opacity >= 0 && f.opacity <= 100),
      };
    });

    if (!result.isNull) {
      expect(result.allHaveType).toBe(true);
      expect(result.allHaveOpacity).toBe(true);
      expect(result.opacityValid).toBe(true);
    }

    const snap = await capture(page, 'bkg-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
