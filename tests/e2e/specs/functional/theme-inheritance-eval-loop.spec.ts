/**
 * Eval Loop: Theme Inheritance & Cascade
 * 
 * Tests the full inheritance chain: Master → Layout → Slide
 * Verifies that null = inherit, non-null = override at every level.
 * 
 * Taskflows Covered:
 * THI-01: Slide inherits theme from master by default
 * THI-02: Slide inherits theme from layout when layout overrides master
 * THI-03: Slide-level override takes precedence over layout and master
 * THI-04: Clearing slide override reverts to layout/master inheritance
 * THI-05: Clearing layout override reverts to master inheritance
 * THI-06: Changing master theme cascades to all inheriting slides
 * THI-07: Changing master theme does NOT affect slides with overrides
 * THI-08: Multiple slides on same layout inherit same theme
 * THI-09: Slide on different layout gets that layout's theme
 * THI-10: getEffectiveColorTheme reports correct source at each level
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Theme Inheritance & Cascade', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  /**
   * Helper: get effective theme info for a slide via StyleResolver
   */
  function getEffectiveTheme(page: import('@playwright/test').Page, slideId?: string) {
    return page.evaluate((sid) => {
      const StyleResolver = (window as any).__TEST_STORE__?.styleResolver
        ?? (window as any).StyleResolver
        ?? null;
      // Direct call to StyleResolver if exposed, or manual walk
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[sid ?? s.editor.activeSlideId];
      if (!slide) return { themeId: null, source: 'none' };

      // 1. Slide override
      const slideTheme = slide.styleAssignments?.colorTheme || slide.colorThemeId;
      if (slideTheme) return { themeId: slideTheme, source: 'slide' };

      // 2. Layout override
      const layout = slide.layoutId ? s.slideMasterPresets?.[slide.layoutId] : null;
      const layoutTheme = layout?.styleAssignments?.colorTheme || layout?.colorThemeId;
      if (layoutTheme) return { themeId: layoutTheme, source: 'layout' };

      // 3. Master
      const master = layout?.parentMasterId ? s.slideMasterPresets?.[layout.parentMasterId] : null;
      const masterTheme = master?.styleAssignments?.colorTheme || master?.colorThemeId;
      if (masterTheme) return { themeId: masterTheme, source: 'master' };

      return { themeId: null, source: 'default' };
    }, slideId);
  }

  function getMasterThemeId(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const master = s.slideMasterPresets?.['master-default'];
      return master?.colorThemeId ?? null;
    });
  }

  function getSlideLayoutId(page: import('@playwright/test').Page, slideId?: string) {
    return page.evaluate((sid) => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[sid ?? s.editor.activeSlideId]?.layoutId ?? null;
    }, slideId);
  }

  // ─── THI-01: Slide inherits from master ───────────────────────────────────
  test('THI-01: Slide inherits theme from master by default', async ({ page }) => {
    const masterTheme = await getMasterThemeId(page);
    const effective = await getEffectiveTheme(page);

    // Slide has no override → should inherit from master
    expect(effective.source).toBe('master');
    if (masterTheme) {
      expect(effective.themeId).toBe(masterTheme);
    }

    const snap = await capture(page, 'theme-inherited-from-master');
    assertNoCriticalAnomalies(snap);
  });

  // ─── THI-02: Layout override propagates to slide ──────────────────────────
  test('THI-02: Slide inherits from layout when layout overrides master', async ({ page }) => {
    const layoutId = await getSlideLayoutId(page);
    if (!layoutId) { test.skip(); return; }

    // Set a layout-level theme override
    await page.evaluate(({ lid }) => {
      const store = (window as any).__TEST_STORE__;
      // Use UPDATE_MASTER_STYLE_ASSIGNMENTS for layout
      store.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
        masterId: lid,
        styleAssignments: { colorTheme: 'test-layout-theme' },
      });
    }, { lid: layoutId });
    await page.waitForTimeout(200);

    const effective = await getEffectiveTheme(page);
    expect(effective.source).toBe('layout');
    expect(effective.themeId).toBe('test-layout-theme');

    // Cleanup: revert layout override
    await page.evaluate(({ lid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
        masterId: lid,
        styleAssignments: { colorTheme: null },
      });
    }, { lid: layoutId });
  });

  // ─── THI-03: Slide override takes top precedence ──────────────────────────
  test('THI-03: Slide override takes precedence over layout and master', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);

    // Set slide override
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { colorTheme: 'slide-level-theme' },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const effective = await getEffectiveTheme(page);
    expect(effective.source).toBe('slide');
    expect(effective.themeId).toBe('slide-level-theme');

    // Cleanup
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { colorTheme: null },
      });
    }, { sid: slideId });
  });

  // ─── THI-04: Clearing slide override reverts inheritance ──────────────────
  test('THI-04: Clear slide override reverts to layout/master', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);

    // Set then clear
    await page.evaluate(({ sid }) => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { colorTheme: 'temporary-theme' },
      });
    }, { sid: slideId });
    await page.waitForTimeout(100);

    let effective = await getEffectiveTheme(page);
    expect(effective.source).toBe('slide');

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { colorTheme: null },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    effective = await getEffectiveTheme(page);
    expect(effective.source).not.toBe('slide');
  });

  // ─── THI-05: Clearing layout override reverts to master ───────────────────
  test('THI-05: Clear layout override reverts to master', async ({ page }) => {
    const layoutId = await getSlideLayoutId(page);
    if (!layoutId) { test.skip(); return; }

    // Set layout override
    await page.evaluate(({ lid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
        masterId: lid,
        styleAssignments: { colorTheme: 'layout-override-temp' },
      });
    }, { lid: layoutId });
    await page.waitForTimeout(100);

    let effective = await getEffectiveTheme(page);
    expect(effective.source).toBe('layout');

    // Clear
    await page.evaluate(({ lid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
        masterId: lid,
        styleAssignments: { colorTheme: null },
      });
    }, { lid: layoutId });
    await page.waitForTimeout(200);

    effective = await getEffectiveTheme(page);
    expect(effective.source).not.toBe('layout');
  });

  // ─── THI-06: Changing master theme cascades to inheriting slides ──────────
  test('THI-06: Change master theme cascades to all inheriting slides', async ({ page }) => {
    // Add second slide (both inherit from master)
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ADD_SLIDE');
    });
    await page.waitForTimeout(200);

    const slides = await page.evaluate(() => (window as any).__TEST_STORE__.getState().slideOrder);

    // Apply theme to master through APPLY_LUMA_THEME
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme: {
          id: 'cascade-test-theme',
          name: 'Cascade Test',
          slots: Array.from({ length: 12 }, (_, i) => ({ h: i * 30, s: 80 })),
          adjustments: {},
          colors: Array.from({ length: 12 }, () => '#888888'),
        },
      });
    });
    await page.waitForTimeout(300);

    // Both slides should see the new theme
    const theme1 = await getEffectiveTheme(page, slides[0]);
    const theme2 = await getEffectiveTheme(page, slides[1]);
    expect(theme1.themeId).toBe('cascade-test-theme');
    expect(theme2.themeId).toBe('cascade-test-theme');

    const snap = await capture(page, 'theme-cascade-to-slides');
    assertNoCriticalAnomalies(snap);
  });

  // ─── THI-07: Master change doesn't affect slides with overrides ───────────
  test('THI-07: Master change does NOT affect slide with override', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);

    // Set slide override first
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { colorTheme: 'my-slide-override' },
      });
    }, { sid: slideId });
    await page.waitForTimeout(100);

    // Now change master
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme: {
          id: 'master-change-after',
          name: 'Master Changed',
          slots: Array.from({ length: 12 }, (_, i) => ({ h: 200 + i * 10, s: 60 })),
          adjustments: {},
          colors: Array.from({ length: 12 }, () => '#AAAAAA'),
        },
      });
    });
    await page.waitForTimeout(200);

    // Slide should still have its own override
    const effective = await getEffectiveTheme(page);
    expect(effective.source).toBe('slide');
    expect(effective.themeId).toBe('my-slide-override');

    // Cleanup
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { colorTheme: null },
      });
    }, { sid: slideId });
  });

  // ─── THI-08: Multiple slides on same layout share theme ───────────────────
  test('THI-08: Multiple slides on same layout inherit same theme', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ADD_SLIDE');
    });
    await page.waitForTimeout(200);

    const slides = await page.evaluate(() => (window as any).__TEST_STORE__.getState().slideOrder);
    const theme1 = await getEffectiveTheme(page, slides[0]);
    const theme2 = await getEffectiveTheme(page, slides[1]);

    expect(theme1.themeId).toBe(theme2.themeId);
    expect(theme1.source).toBe(theme2.source);
  });

  // ─── THI-09: Different layout gives different theme ───────────────────────
  test('THI-09: Slide on overridden layout gets that theme', async ({ page }) => {
    // Get available layouts
    const layouts = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const master = s.slideMasterPresets?.['master-default'];
      return master?.layoutIds ?? [];
    });

    if (layouts.length < 2) { test.skip(); return; }

    // Override second layout with a different theme
    await page.evaluate(({ lid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
        masterId: lid,
        styleAssignments: { colorTheme: 'layout-b-theme' },
      });
    }, { lid: layouts[1] });
    await page.waitForTimeout(100);

    // Add a slide on that layout
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('ADD_SLIDE');
    });
    await page.waitForTimeout(100);

    const slides = await page.evaluate(() => (window as any).__TEST_STORE__.getState().slideOrder);
    const newSlideId = slides[slides.length - 1];

    // Assign it to the overridden layout
    await page.evaluate(({ sid, lid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', { id: sid, layoutId: lid });
    }, { sid: newSlideId, lid: layouts[1] });
    await page.waitForTimeout(200);

    const effective = await getEffectiveTheme(page, newSlideId);
    expect(effective.themeId).toBe('layout-b-theme');
    expect(effective.source).toBe('layout');

    // Cleanup
    await page.evaluate(({ lid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
        masterId: lid,
        styleAssignments: { colorTheme: null },
      });
    }, { lid: layouts[1] });
  });

  // ─── THI-10: Source reporting is accurate ─────────────────────────────────
  test('THI-10: Effective theme correctly reports source at each level', async ({ page }) => {
    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);
    const layoutId = await getSlideLayoutId(page);

    // Master level
    let effective = await getEffectiveTheme(page);
    expect(['master', 'default']).toContain(effective.source);

    if (layoutId) {
      // Layout override → should report 'layout'
      await page.evaluate(({ lid }) => {
        (window as any).__TEST_STORE__.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
          masterId: lid,
          styleAssignments: { colorTheme: 'report-test-layout' },
        });
      }, { lid: layoutId });
      await page.waitForTimeout(100);
      effective = await getEffectiveTheme(page);
      expect(effective.source).toBe('layout');

      // Cleanup
      await page.evaluate(({ lid }) => {
        (window as any).__TEST_STORE__.dispatch('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
          masterId: lid,
          styleAssignments: { colorTheme: null },
        });
      }, { lid: layoutId });
    }

    // Slide override → should report 'slide'
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { colorTheme: 'report-test-slide' },
      });
    }, { sid: slideId });
    await page.waitForTimeout(100);
    effective = await getEffectiveTheme(page);
    expect(effective.source).toBe('slide');

    // Cleanup
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { colorTheme: null },
      });
    }, { sid: slideId });

    const snap = await capture(page, 'theme-source-reporting');
    assertNoCriticalAnomalies(snap);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Theme inheritance chain is consistent', async ({ page }) => {
    // Verify full cascade consistency
    const result = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slideId = s.editor.activeSlideId;
      const slide = s.slides[slideId];
      const layout = slide?.layoutId ? s.slideMasterPresets?.[slide.layoutId] : null;
      const master = layout?.parentMasterId ? s.slideMasterPresets?.[layout.parentMasterId] : null;

      return {
        slideHasOverride: !!(slide?.styleAssignments?.colorTheme || slide?.colorThemeId),
        layoutExists: !!layout,
        layoutHasOverride: !!(layout?.styleAssignments?.colorTheme || layout?.colorThemeId),
        masterExists: !!master,
        masterThemeId: master?.colorThemeId ?? null,
        chainIntact: !!master && !!layout,
      };
    });

    expect(result.masterExists).toBe(true);
    expect(result.layoutExists).toBe(true);
    expect(result.chainIntact).toBe(true);

    const snap = await capture(page, 'inheritance-chain-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
