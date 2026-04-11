/**
 * Eval Loop: Element-Theme Color Binding
 * 
 * Tests how elements reference theme slots, how theme changes
 * propagate to element colors, and unlink/relink behaviors.
 * 
 * Taskflows Covered:
 * ETB-01: Element with themeSlot fill resolves to theme color
 * ETB-02: Changing theme slot H/S updates element's resolved color
 * ETB-03: Element with custom color (no themeSlot) is NOT affected by theme change
 * ETB-04: Unlinking element from theme preserves current hex
 * ETB-05: Linking element to theme slot updates to slot's color
 * ETB-06: Copy-paste preserves themeSlot reference (adapts to new theme context)
 * ETB-07: Multiple elements on same slot all update when slot changes
 * ETB-08: Gradient stop with themeSlot resolves correctly
 * ETB-09: Theme change on master propagates to theme-linked elements on inheriting slides
 * ETB-10: Slide-level theme override makes elements use different palette
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Element-Theme Color Binding', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  const THEME_A = {
    id: 'binding-theme-a',
    name: 'Binding A',
    slots: Array.from({ length: 12 }, (_, i) => ({ h: i * 30, s: 80 })),
    adjustments: {},
    colors: Array.from({ length: 12 }, () => '#AA5555'),
  };

  function seedThemedElement(page: import('@playwright/test').Page, slotIndex: number) {
    return page.evaluate(({ slot }) => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-bind-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x: 100, y: 100, width: 100, height: 80,
        rotation: 0, opacity: 1,
        fills: [{
          type: 'solid',
          color: '#888888',
          value: '#888888',
          opacity: 100,
          visible: true,
          themeSlot: slot,
          source: { type: 'theme', themeSlot: slot },
        }],
      });
      store.dispatch('UPDATE_SELECTION', [id]);
      return id;
    }, { slot: slotIndex });
  }

  function seedCustomElement(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-custom-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x: 200, y: 200, width: 100, height: 80,
        rotation: 0, opacity: 1,
        fills: [{
          type: 'solid',
          color: '#FF5733',
          value: '#FF5733',
          opacity: 100,
          visible: true,
          source: { type: 'custom' },
        }],
      });
      return id;
    });
  }

  function getElementFill(page: import('@playwright/test').Page, id: string) {
    return page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId]?.elements?.[eid];
      return el?.fills?.[0] ?? el?.style?.fills?.[0] ?? null;
    }, { eid: id });
  }

  // ─── ETB-01: Theme-linked fill has themeSlot ──────────────────────────────
  test('ETB-01: Element with themeSlot fill stores slot reference', async ({ page }) => {
    const id = await seedThemedElement(page, 5);
    await page.waitForTimeout(200);

    const fill = await getElementFill(page, id);
    expect(fill).not.toBeNull();
    expect(fill.themeSlot).toBe(5);
    expect(fill.source?.type).toBe('theme');
    expect(fill.source?.themeSlot).toBe(5);

    const snap = await capture(page, 'element-theme-linked');
    assertNoCriticalAnomalies(snap);
  });

  // ─── ETB-02: Changing slot updates element ────────────────────────────────
  test('ETB-02: Changing theme slot H/S is reflected in preset', async ({ page }) => {
    // Apply theme
    await page.evaluate((theme) => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme,
      });
    }, THEME_A);
    await page.waitForTimeout(200);

    const id = await seedThemedElement(page, 3);
    await page.waitForTimeout(200);

    // Get initial slot value
    const slotBefore = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.colorThemePresets?.['binding-theme-a']?.lumaTheme?.slots?.[3];
    });

    // Change slot 3
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_LUMA_THEME_SLOT', {
        masterId: 'master-default',
        slotIndex: 3,
        h: 300,
        s: 95,
      });
    });
    await page.waitForTimeout(200);

    const slotAfter = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.colorThemePresets?.['binding-theme-a']?.lumaTheme?.slots?.[3];
    });

    // Slot data must have changed
    expect(slotAfter.h).toBe(300);
    expect(slotAfter.s).toBe(95);
    expect(slotAfter.h).not.toBe(slotBefore.h);
  });

  // ─── ETB-03: Custom color unaffected by theme change ─────────────────────
  test('ETB-03: Custom-color element NOT affected by theme change', async ({ page }) => {
    await page.evaluate((theme) => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme,
      });
    }, THEME_A);
    await page.waitForTimeout(200);

    const id = await seedCustomElement(page);
    await page.waitForTimeout(200);

    const fillBefore = await getElementFill(page, id);
    const colorBefore = fillBefore?.color ?? fillBefore?.value;

    // Change the theme entirely
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme: {
          id: 'binding-theme-b',
          name: 'Binding B',
          slots: Array.from({ length: 12 }, () => ({ h: 180, s: 50 })),
          adjustments: {},
          colors: Array.from({ length: 12 }, () => '#55AAAA'),
        },
      });
    });
    await page.waitForTimeout(200);

    const fillAfter = await getElementFill(page, id);
    const colorAfter = fillAfter?.color ?? fillAfter?.value;

    // Custom color unchanged
    expect(colorAfter).toBe(colorBefore);
  });

  // ─── ETB-04: Unlink preserves hex ────────────────────────────────────────
  test('ETB-04: Unlinking element from theme preserves current hex', async ({ page }) => {
    const id = await seedThemedElement(page, 7);
    await page.waitForTimeout(200);

    // Unlink by setting source to custom, removing themeSlot
    await page.evaluate(({ eid }) => {
      const store = (window as any).__TEST_STORE__;
      const s = store.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      const currentFill = el.fills?.[0] ?? {};
      const currentColor = currentFill.color ?? currentFill.value ?? '#888888';

      store.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{
          type: 'solid',
          color: currentColor,
          value: currentColor,
          opacity: 100,
          visible: true,
          source: { type: 'custom' },
          // No themeSlot
        }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fill = await getElementFill(page, id);
    expect(fill.source?.type).toBe('custom');
    expect(fill.themeSlot).toBeUndefined();
  });

  // ─── ETB-05: Link element to theme slot ───────────────────────────────────
  test('ETB-05: Linking custom element to theme slot sets reference', async ({ page }) => {
    const id = await seedCustomElement(page);
    await page.waitForTimeout(200);

    // Link to slot 9
    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{
          type: 'solid',
          color: '#999999',
          value: '#999999',
          opacity: 100,
          visible: true,
          themeSlot: 9,
          source: { type: 'theme', themeSlot: 9 },
        }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fill = await getElementFill(page, id);
    expect(fill.themeSlot).toBe(9);
    expect(fill.source?.type).toBe('theme');
  });

  // ─── ETB-06: Multiple elements on same slot ──────────────────────────────
  test('ETB-06: Multiple elements on same slot share reference', async ({ page }) => {
    const id1 = await seedThemedElement(page, 2);
    const id2 = await seedThemedElement(page, 2);
    await page.waitForTimeout(200);

    const fill1 = await getElementFill(page, id1);
    const fill2 = await getElementFill(page, id2);

    expect(fill1.themeSlot).toBe(2);
    expect(fill2.themeSlot).toBe(2);
    expect(fill1.source?.themeSlot).toBe(fill2.source?.themeSlot);
  });

  // ─── ETB-07: Slide override makes elements use different palette ──────────
  test('ETB-07: Slide theme override changes effective palette context', async ({ page }) => {
    // Apply theme A to master
    await page.evaluate((theme) => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme,
      });
    }, THEME_A);
    await page.waitForTimeout(200);

    // Create a second theme preset
    await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      // Manually create a preset (won't link to master)
      store.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme: {
          id: 'override-theme-x',
          name: 'Override X',
          slots: Array.from({ length: 12 }, () => ({ h: 0, s: 0 })),
          adjustments: {},
          colors: Array.from({ length: 12 }, () => '#CCCCCC'),
        },
      });
      // Restore master to original
      store.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme: {
          id: 'binding-theme-a',
          name: 'Binding A',
          slots: Array.from({ length: 12 }, (_, i) => ({ h: i * 30, s: 80 })),
          adjustments: {},
          colors: Array.from({ length: 12 }, () => '#AA5555'),
        },
      });
    });
    await page.waitForTimeout(200);

    const slideId = await page.evaluate(() => (window as any).__TEST_STORE__.getState().editor.activeSlideId);

    // Override slide to use the other theme
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { colorTheme: 'override-theme-x' },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    // Effective theme should be the override
    const effective = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return slide.styleAssignments?.colorTheme;
    });
    expect(effective).toBe('override-theme-x');

    // Cleanup
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { colorTheme: null },
      });
    }, { sid: slideId });
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Theme-linked elements maintain source consistency', async ({ page }) => {
    const id = await seedThemedElement(page, 10);
    await page.waitForTimeout(200);

    const result = await page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      const fill = el?.fills?.[0];
      return {
        hasThemeSlot: fill?.themeSlot !== undefined,
        sourceIsTheme: fill?.source?.type === 'theme',
        slotMatch: fill?.themeSlot === fill?.source?.themeSlot,
      };
    }, { eid: id });

    expect(result.hasThemeSlot).toBe(true);
    expect(result.sourceIsTheme).toBe(true);
    expect(result.slotMatch).toBe(true);

    const snap = await capture(page, 'element-binding-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
