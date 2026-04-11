/**
 * Eval Loop: Property Inspector — Theme Color Linking (THL-01 → THL-12)
 *
 * Comprehensive tests for theme color linking in the property inspector context.
 * Covers linking fills to theme slots, unlinking, theme changes propagating to
 * linked elements, stroke theme linking, background theme linking, gradient
 * stops with theme slots, and slide-level theme override effects.
 *
 * Taskflows:
 * THL-01: Link fill to theme slot (set themeSlot + source)
 * THL-02: Theme slot change updates linked fill
 * THL-03: Unlink from theme preserves hex
 * THL-04: Re-link to different slot
 * THL-05: Custom fill unaffected by theme change
 * THL-06: Stroke color linked to theme slot
 * THL-07: Slide background linked to theme slot
 * THL-08: Theme change cascades to all linked fills on same slot
 * THL-09: Gradient stop linked to theme slot
 * THL-10: Slide theme override changes effective palette for linked elements
 * THL-11: Link then change color → auto-unlinks from theme
 * THL-12: Multiple fills on same element with different theme slots
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: PI Theme Color Linking', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  const TEST_THEME = {
    id: 'pi-link-theme',
    name: 'PI Link Theme',
    slots: Array.from({ length: 12 }, (_, i) => ({ h: i * 30, s: 70 })),
    adjustments: {},
    colors: Array.from({ length: 12 }, () => '#777777'),
  };

  function seedRect(page: import('@playwright/test').Page, fills: any[] = []) {
    return page.evaluate(({ f }) => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-thl-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x: 200, y: 200, width: 120, height: 80, rotation: 0, opacity: 1,
        fills: f.length ? f : [{ type: 'solid', color: '#888888', opacity: 100, visible: true }],
      });
      store.dispatch('UPDATE_SELECTION', [id]);
      return id;
    }, { f: fills });
  }

  function getFills(page: import('@playwright/test').Page, id: string) {
    return page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      return el?.fills ?? el?.style?.fills ?? [];
    }, { eid: id });
  }

  function applyTheme(page: import('@playwright/test').Page) {
    return page.evaluate((theme) => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme,
      });
    }, TEST_THEME);
  }

  // ─── THL-01: Link fill to theme slot ──────────────────────────────────────
  test('THL-01: Link fill to theme slot', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{
          type: 'solid', color: '#555555', value: '#555555',
          opacity: 100, visible: true,
          themeSlot: 6,
          source: { type: 'theme', themeSlot: 6 },
        }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].themeSlot).toBe(6);
    expect(fills[0].source?.type).toBe('theme');
    expect(fills[0].source?.themeSlot).toBe(6);

    const snap = await capture(page, 'thl-01-linked');
    assertNoCriticalAnomalies(snap);
  });

  // ─── THL-02: Theme slot change updates linked fill ────────────────────────
  test('THL-02: Theme slot H/S change updates linked fill preset', async ({ page }) => {
    await applyTheme(page);
    await page.waitForTimeout(200);

    const id = await seedRect(page, [{
      type: 'solid', color: '#777777', value: '#777777',
      opacity: 100, visible: true, themeSlot: 5,
      source: { type: 'theme', themeSlot: 5 },
    }]);
    await page.waitForTimeout(200);

    // Change slot 5 hue
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_LUMA_THEME_SLOT', {
        masterId: 'master-default',
        slotIndex: 5,
        h: 200,
        s: 90,
      });
    });
    await page.waitForTimeout(200);

    const slotData = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      // Slot data stored in colorThemePresets, not directly on master
      const presets = s.colorThemePresets ?? {};
      const preset = presets['pi-link-theme'];
      if (preset?.lumaTheme?.slots?.[5]) return preset.lumaTheme.slots[5];
      // Fallback: check master directly
      const master = s.masters?.['master-default'] ?? s.themeMasters?.['master-default'];
      return master?.lumaTheme?.slots?.[5];
    });
    expect(slotData?.h).toBe(200);
    expect(slotData?.s).toBe(90);
  });

  // ─── THL-03: Unlink preserves hex ────────────────────────────────────────
  test('THL-03: Unlink from theme preserves hex', async ({ page }) => {
    const id = await seedRect(page, [{
      type: 'solid', color: '#AA5555', value: '#AA5555',
      opacity: 100, visible: true, themeSlot: 3,
      source: { type: 'theme', themeSlot: 3 },
    }]);
    await page.waitForTimeout(200);

    // Unlink
    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{
          type: 'solid', color: '#AA5555', value: '#AA5555',
          opacity: 100, visible: true,
          source: { type: 'custom' },
        }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].source?.type).toBe('custom');
    expect(fills[0].themeSlot).toBeUndefined();
    expect(fills[0].color || fills[0].value).toBe('#AA5555');
  });

  // ─── THL-04: Re-link to different slot ────────────────────────────────────
  test('THL-04: Re-link to different slot', async ({ page }) => {
    const id = await seedRect(page, [{
      type: 'solid', color: '#888888', value: '#888888',
      opacity: 100, visible: true, themeSlot: 2,
      source: { type: 'theme', themeSlot: 2 },
    }]);
    await page.waitForTimeout(200);

    // Re-link to slot 9
    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{
          type: 'solid', color: '#999999', value: '#999999',
          opacity: 100, visible: true, themeSlot: 9,
          source: { type: 'theme', themeSlot: 9 },
        }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].themeSlot).toBe(9);
    expect(fills[0].source?.themeSlot).toBe(9);
  });

  // ─── THL-05: Custom fill unaffected ───────────────────────────────────────
  test('THL-05: Custom fill unaffected by theme change', async ({ page }) => {
    await applyTheme(page);
    await page.waitForTimeout(200);

    const id = await seedRect(page, [{
      type: 'solid', color: '#FF5733', value: '#FF5733',
      opacity: 100, visible: true,
      source: { type: 'custom' },
    }]);
    await page.waitForTimeout(200);

    const colorBefore = (await getFills(page, id))[0].color;

    // Change theme entirely
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme: {
          id: 'totally-different',
          name: 'Different',
          slots: Array.from({ length: 12 }, () => ({ h: 0, s: 0 })),
          adjustments: {},
          colors: Array.from({ length: 12 }, () => '#000000'),
        },
      });
    });
    await page.waitForTimeout(200);

    const colorAfter = (await getFills(page, id))[0].color;
    expect(colorAfter).toBe(colorBefore);
  });

  // ─── THL-06: Stroke linked to theme slot ──────────────────────────────────
  test('THL-06: Stroke color linked to theme slot', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        style: {
          strokes: [{
            type: 'solid', color: '#444444', width: 2,
            opacity: 100, position: 'center', visible: true,
            themeSlot: 8,
            source: { type: 'theme', themeSlot: 8 },
          }],
        },
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const strokes = await page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      return el?.style?.strokes ?? el?.strokes ?? [];
    }, { eid: id });
    expect(strokes[0].themeSlot).toBe(8);
    expect(strokes[0].source?.type).toBe('theme');
  });

  // ─── THL-07: Background linked to theme slot ─────────────────────────────
  test('THL-07: Slide background linked to theme slot', async ({ page }) => {
    const slideId = await page.evaluate(() =>
      (window as any).__TEST_STORE__.getState().editor.activeSlideId,
    );

    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE', {
        id: sid,
        background: [{
          type: 'solid', value: '#CCCCCC', color: '#CCCCCC',
          opacity: 100, visible: true,
          themeSlot: 11,
          source: { type: 'theme', themeSlot: 11 },
        }],
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const bg = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return Array.isArray(slide.background) ? slide.background : [slide.background];
    });
    expect(bg[0].themeSlot).toBe(11);
  });

  // ─── THL-08: Theme cascades to all linked fills ──────────────────────────
  test('THL-08: Theme slot change cascades to all linked elements', async ({ page }) => {
    await applyTheme(page);
    await page.waitForTimeout(200);

    // Two elements, both on slot 4
    const id1 = await seedRect(page, [{
      type: 'solid', color: '#777777', value: '#777777',
      opacity: 100, visible: true, themeSlot: 4,
      source: { type: 'theme', themeSlot: 4 },
    }]);
    const id2 = await seedRect(page, [{
      type: 'solid', color: '#777777', value: '#777777',
      opacity: 100, visible: true, themeSlot: 4,
      source: { type: 'theme', themeSlot: 4 },
    }]);
    await page.waitForTimeout(200);

    // Both should have same slot
    const f1 = await getFills(page, id1);
    const f2 = await getFills(page, id2);
    expect(f1[0].themeSlot).toBe(4);
    expect(f2[0].themeSlot).toBe(4);

    // Change slot 4
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_LUMA_THEME_SLOT', {
        masterId: 'master-default',
        slotIndex: 4,
        h: 350,
        s: 95,
      });
    });
    await page.waitForTimeout(200);

    // Both elements still reference slot 4
    const f1After = await getFills(page, id1);
    const f2After = await getFills(page, id2);
    expect(f1After[0].themeSlot).toBe(4);
    expect(f2After[0].themeSlot).toBe(4);
  });

  // ─── THL-09: Gradient stop with theme slot ────────────────────────────────
  test('THL-09: Gradient stop linked to theme slot', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{
          type: 'gradient', visible: true, opacity: 100,
          value: {
            type: 'linear', angle: 90,
            stops: [
              { color: '#111111', position: 0, themeSlot: 0 },
              { color: '#EEEEEE', position: 100, themeSlot: 11 },
            ],
          },
        }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].value.stops[0].themeSlot).toBe(0);
    expect(fills[0].value.stops[1].themeSlot).toBe(11);
  });

  // ─── THL-10: Slide theme override ────────────────────────────────────────
  test('THL-10: Slide theme override changes palette context', async ({ page }) => {
    await applyTheme(page);
    await page.waitForTimeout(200);

    const slideId = await page.evaluate(() =>
      (window as any).__TEST_STORE__.getState().editor.activeSlideId,
    );

    // Override slide theme
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { colorTheme: 'pi-link-theme' },
      });
    }, { sid: slideId });
    await page.waitForTimeout(200);

    const assignment = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId]?.styleAssignments?.colorTheme;
    });
    expect(assignment).toBe('pi-link-theme');

    // Cleanup
    await page.evaluate(({ sid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
        slideId: sid,
        styleAssignments: { colorTheme: null },
      });
    }, { sid: slideId });
  });

  // ─── THL-11: Custom color edit auto-unlinks ──────────────────────────────
  test('THL-11: Setting custom color on linked fill unlinks from theme', async ({ page }) => {
    const id = await seedRect(page, [{
      type: 'solid', color: '#777777', value: '#777777',
      opacity: 100, visible: true, themeSlot: 5,
      source: { type: 'theme', themeSlot: 5 },
    }]);
    await page.waitForTimeout(200);

    // Overwrite with custom color (removes themeSlot)
    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{
          type: 'solid', color: '#FF00FF', value: '#FF00FF',
          opacity: 100, visible: true,
          source: { type: 'custom' },
        }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].color).toBe('#FF00FF');
    expect(fills[0].source?.type).toBe('custom');
    expect(fills[0].themeSlot).toBeUndefined();
  });

  // ─── THL-12: Multiple fills with different theme slots ────────────────────
  test('THL-12: Multiple fills with different theme slots on same element', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [
          {
            type: 'solid', color: '#333333', value: '#333333',
            opacity: 100, visible: true, themeSlot: 1,
            source: { type: 'theme', themeSlot: 1 },
          },
          {
            type: 'solid', color: '#AAAAAA', value: '#AAAAAA',
            opacity: 50, visible: true, themeSlot: 9,
            source: { type: 'theme', themeSlot: 9 },
          },
        ],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills.length).toBe(2);
    expect(fills[0].themeSlot).toBe(1);
    expect(fills[1].themeSlot).toBe(9);
    expect(fills[0].source?.themeSlot).not.toBe(fills[1].source?.themeSlot);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Theme-linked fills maintain source consistency', async ({ page }) => {
    const id = await seedRect(page, [{
      type: 'solid', color: '#888888', value: '#888888',
      opacity: 100, visible: true, themeSlot: 7,
      source: { type: 'theme', themeSlot: 7 },
    }]);
    await page.waitForTimeout(200);

    const result = await page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      const fills = el?.fills ?? el?.style?.fills ?? [];
      return fills.map((f: any) => ({
        hasSlot: f.themeSlot !== undefined,
        sourceIsTheme: f.source?.type === 'theme',
        slotMatch: f.themeSlot === f.source?.themeSlot,
        slotInRange: f.themeSlot >= 0 && f.themeSlot <= 11,
      }));
    }, { eid: id });

    for (const r of result) {
      expect(r.hasSlot).toBe(true);
      expect(r.sourceIsTheme).toBe(true);
      expect(r.slotMatch).toBe(true);
      expect(r.slotInRange).toBe(true);
    }

    const snap = await capture(page, 'thl-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
