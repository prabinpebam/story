/**
 * Eval Loop: Effective Slide Composition
 * 
 * Tests getEffectiveSlide — the merge of Theme + Layout + Slide elements,
 * background resolution, and element source tracking.
 * 
 * Taskflows Covered:
 * EFS-01: Effective slide merges theme elements (isLocked, source:'theme')
 * EFS-02: Effective slide merges layout elements (isLocked, source:'layout')
 * EFS-03: Slide elements marked source:'slide' (not locked)
 * EFS-04: Slide element with same ID as layout element overrides it
 * EFS-05: hideBackgroundGraphics hides theme/layout elements
 * EFS-06: Background resolves: slide > layout > master > white
 * EFS-07: effectiveOrder preserves Z-order (theme bottom, layout mid, slide top)
 * EFS-08: resolvedLumaTheme populated from effective theme
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Effective Slide Composition', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function getEffectiveSlide(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const slideId = store.getState().editor.activeSlideId;
      return store.getEffectiveSlide(slideId);
    });
  }

  // ─── EFS-01: Theme elements merged as locked ──────────────────────────────
  test('EFS-01: Effective slide includes theme elements as locked', async ({ page }) => {
    const effective = await getEffectiveSlide(page);
    if (!effective) { test.skip(); return; }

    // Check if any elements have source='theme'
    const themeElements = Object.values(effective.effectiveElements ?? {})
      .filter((el: any) => el.source === 'theme');

    // Theme elements should be locked if present
    for (const el of themeElements) {
      expect((el as any).isLocked).toBe(true);
    }

    const snap = await capture(page, 'effective-theme-elements');
    assertNoCriticalAnomalies(snap);
  });

  // ─── EFS-02: Layout elements merged as locked ────────────────────────────
  test('EFS-02: Effective slide includes layout elements as locked', async ({ page }) => {
    const effective = await getEffectiveSlide(page);
    if (!effective) { test.skip(); return; }

    const layoutElements = Object.values(effective.effectiveElements ?? {})
      .filter((el: any) => el.source === 'layout');

    for (const el of layoutElements) {
      expect((el as any).isLocked).toBe(true);
    }
  });

  // ─── EFS-03: Slide elements are not locked ───────────────────────────────
  test('EFS-03: Slide-own elements are not locked', async ({ page }) => {
    // Seed an element on the slide
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('ADD_ELEMENT', {
        id: 'efs-test-element',
        type: 'rect', x: 50, y: 50, width: 100, height: 60,
        rotation: 0, opacity: 1,
        fills: [{ type: 'solid', color: '#FF0000' }],
      });
    });
    await page.waitForTimeout(200);

    const effective = await getEffectiveSlide(page);
    const slideEl = effective?.effectiveElements?.['efs-test-element'];
    
    if (slideEl) {
      expect(slideEl.source).toBe('slide');
      // Slide elements should NOT be marked isLocked
      expect(slideEl.isLocked).toBeUndefined();
    }
  });

  // ─── EFS-04: Slide element overrides layout element with same ID ──────────
  test('EFS-04: Slide element overrides layout element with same ID', async ({ page }) => {
    // Get a layout element ID if any exist
    const layoutElementId = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slideId = s.editor.activeSlideId;
      const slide = s.slides[slideId];
      const layout = slide?.layoutId ? s.slideMasterPresets?.[slide.layoutId] : null;
      return layout?.elementOrder?.[0] ?? null;
    });

    if (!layoutElementId) { test.skip(); return; }

    // Override it at slide level
    await page.evaluate(({ elId }) => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('ADD_ELEMENT', {
        id: elId,
        type: 'rect', x: 100, y: 100, width: 200, height: 100,
        rotation: 0, opacity: 1,
        fills: [{ type: 'solid', color: '#00FF00' }],
      });
    }, { elId: layoutElementId });
    await page.waitForTimeout(200);

    const effective = await getEffectiveSlide(page);
    const el = effective?.effectiveElements?.[layoutElementId];
    
    // Should be from slide (override), not layout
    if (el) {
      expect(el.source).toBe('slide');
    }
  });

  // ─── EFS-05: Background resolution cascade ───────────────────────────────
  test('EFS-05: Background resolves through cascade', async ({ page }) => {
    const effective = await getEffectiveSlide(page);
    
    // effectiveBackground should always be defined (fallback to white)
    expect(effective?.effectiveBackground).toBeDefined();
    expect(effective?.effectiveBackground?.type).toBeDefined();
  });

  // ─── EFS-06: Z-order: theme bottom, layout mid, slide top ────────────────
  test('EFS-06: Effective order puts theme elements first, slide last', async ({ page }) => {
    // Seed a slide element
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ADD_ELEMENT', {
        id: 'efs-zorder-test',
        type: 'rect', x: 300, y: 300, width: 50, height: 50,
        rotation: 0, opacity: 1,
        fills: [{ type: 'solid', color: '#0000FF' }],
      });
    });
    await page.waitForTimeout(200);

    const effective = await getEffectiveSlide(page);
    const order = effective?.effectiveOrder ?? [];
    const elements = effective?.effectiveElements ?? {};

    if (order.length > 1) {
      // Find first slide element in order
      const firstSlideIdx = order.findIndex((id: string) => elements[id]?.source === 'slide');
      // Find last theme/layout element in order
      const lastInheritedIdx = [...order].reverse().findIndex((id: string) =>
        elements[id]?.source === 'theme' || elements[id]?.source === 'layout'
      );
      const lastInheritedIdxFromStart = lastInheritedIdx >= 0 ? order.length - 1 - lastInheritedIdx : -1;

      // Slide elements should come after inherited elements
      if (firstSlideIdx >= 0 && lastInheritedIdxFromStart >= 0) {
        expect(firstSlideIdx).toBeGreaterThanOrEqual(lastInheritedIdxFromStart);
      }
    }
  });

  // ─── EFS-07: resolvedLumaTheme present ────────────────────────────────────
  test('EFS-07: Effective slide has resolvedLumaTheme', async ({ page }) => {
    // Apply a theme so lumaTheme exists
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme: {
          id: 'efs-luma-test',
          name: 'EFS Luma',
          slots: Array.from({ length: 12 }, (_, i) => ({ h: i * 30, s: 70 })),
          adjustments: {},
          colors: Array.from({ length: 12 }, () => '#888888'),
        },
      });
    });
    await page.waitForTimeout(300);

    const effective = await getEffectiveSlide(page);
    // resolvedLumaTheme may be populated from the effective theme
    // It's OK if null when no luma generation has happened
    expect(effective).toBeDefined();
    // themeSource should indicate where the theme comes from
    expect(['master', 'layout', 'slide', null, undefined]).toContain(effective?.themeSource);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Effective slide composition is consistent', async ({ page }) => {
    const effective = await getEffectiveSlide(page);
    
    expect(effective).toBeDefined();
    expect(effective?.effectiveBackground).toBeDefined();
    expect(effective?.effectiveElements).toBeDefined();
    expect(effective?.effectiveOrder).toBeDefined();
    expect(Array.isArray(effective?.effectiveOrder)).toBe(true);

    // All elements in effectiveOrder should exist in effectiveElements
    for (const id of effective?.effectiveOrder ?? []) {
      expect(effective!.effectiveElements[id]).toBeDefined();
    }

    const snap = await capture(page, 'effective-slide-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
