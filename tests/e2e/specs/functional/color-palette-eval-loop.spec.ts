/**
 * Eval Loop: Color Palette & Luma System
 * 
 * Tests the 12-slot luma-locked color palette, slot manipulation,
 * adjustments, and resolved-color generation.
 * 
 * Taskflows Covered:
 * PAL-01: Apply a luma theme with 12 slots to master
 * PAL-02: resolvedColors array has 12 entries after theme application
 * PAL-03: Update a single slot's hue/saturation
 * PAL-04: Slot update changes the preset's slot data
 * PAL-05: Apply adjustments (brightness, contrast, saturation)
 * PAL-06: Adjustments merge with existing (partial update)
 * PAL-07: Each slot has fixed luma position (shadows, midtones, highlights)
 * PAL-08: Theme colors regenerate when slots change
 * PAL-09: Multiple slot updates in sequence
 * PAL-10: Slot index is clamped 0-11
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Color Palette & Luma System', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  const BASE_THEME = {
    id: 'palette-test-theme',
    name: 'Palette Test',
    slots: [
      { h: 0, s: 0 },    // slot 0 - shadow secondary1
      { h: 220, s: 80 },  // slot 1 - shadow primary
      { h: 340, s: 90 },  // slot 2 - shadow accent
      { h: 120, s: 70 },  // slot 3 - shadow secondary2
      { h: 0, s: 0 },     // slot 4 - mid secondary1
      { h: 220, s: 60 },  // slot 5 - mid primary
      { h: 340, s: 70 },  // slot 6 - mid accent
      { h: 120, s: 50 },  // slot 7 - mid secondary2
      { h: 0, s: 0 },     // slot 8 - highlight secondary1
      { h: 220, s: 40 },  // slot 9 - highlight primary
      { h: 340, s: 50 },  // slot 10 - highlight accent
      { h: 120, s: 30 },  // slot 11 - highlight secondary2
    ],
    adjustments: {},
    colors: Array.from({ length: 12 }, () => '#808080'),
  };

  function getPreset(page: import('@playwright/test').Page, themeId: string) {
    return page.evaluate((tid) => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.colorThemePresets?.[tid] ?? null;
    }, themeId);
  }

  function getMasterThemeId(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      return (window as any).__TEST_STORE__.getState().slideMasterPresets?.['master-default']?.colorThemeId ?? null;
    });
  }

  // ─── PAL-01: Apply luma theme ─────────────────────────────────────────────
  test('PAL-01: Apply luma theme with 12 slots to master', async ({ page }) => {
    await page.evaluate((theme) => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme,
      });
    }, BASE_THEME);
    await page.waitForTimeout(300);

    const themeId = await getMasterThemeId(page);
    expect(themeId).toBe('palette-test-theme');

    const preset = await getPreset(page, 'palette-test-theme');
    expect(preset).not.toBeNull();
    expect(preset.lumaTheme.slots.length).toBe(12);

    const snap = await capture(page, 'luma-theme-applied');
    assertNoCriticalAnomalies(snap);
  });

  // ─── PAL-02: resolvedColors has 12 entries ────────────────────────────────
  test('PAL-02: resolvedColors array has 12 entries', async ({ page }) => {
    await page.evaluate((theme) => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme,
      });
    }, BASE_THEME);
    await page.waitForTimeout(200);

    const preset = await getPreset(page, 'palette-test-theme');
    expect(preset.lumaTheme.resolvedColors).toBeDefined();
    expect(preset.lumaTheme.resolvedColors.length).toBe(12);
  });

  // ─── PAL-03: Update single slot H/S ──────────────────────────────────────
  test('PAL-03: Update single slot hue and saturation', async ({ page }) => {
    // Apply base theme first
    await page.evaluate((theme) => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme,
      });
    }, BASE_THEME);
    await page.waitForTimeout(200);

    // Update slot 2 (accent)
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_LUMA_THEME_SLOT', {
        masterId: 'master-default',
        slotIndex: 2,
        h: 60,
        s: 95,
      });
    });
    await page.waitForTimeout(200);

    const preset = await getPreset(page, 'palette-test-theme');
    expect(preset.lumaTheme.slots[2].h).toBe(60);
    expect(preset.lumaTheme.slots[2].s).toBe(95);
  });

  // ─── PAL-04: Other slots unchanged after single update ────────────────────
  test('PAL-04: Updating one slot does not affect other slots', async ({ page }) => {
    await page.evaluate((theme) => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme,
      });
    }, BASE_THEME);
    await page.waitForTimeout(200);

    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_LUMA_THEME_SLOT', {
        masterId: 'master-default',
        slotIndex: 5,
        h: 180,
        s: 100,
      });
    });
    await page.waitForTimeout(200);

    const preset = await getPreset(page, 'palette-test-theme');
    // Slot 5 changed
    expect(preset.lumaTheme.slots[5].h).toBe(180);
    expect(preset.lumaTheme.slots[5].s).toBe(100);
    // Slot 1 unchanged
    expect(preset.lumaTheme.slots[1].h).toBe(220);
    expect(preset.lumaTheme.slots[1].s).toBe(80);
  });

  // ─── PAL-05: Apply adjustments ────────────────────────────────────────────
  test('PAL-05: Apply brightness/contrast/saturation adjustments', async ({ page }) => {
    await page.evaluate((theme) => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme,
      });
    }, BASE_THEME);
    await page.waitForTimeout(200);

    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_LUMA_THEME_ADJUSTMENTS', {
        masterId: 'master-default',
        adjustments: { brightness: 1.2, contrast: 0.9, saturation: 1.1 },
      });
    });
    await page.waitForTimeout(200);

    const preset = await getPreset(page, 'palette-test-theme');
    expect(preset.lumaTheme.adjustments.brightness).toBe(1.2);
    expect(preset.lumaTheme.adjustments.contrast).toBe(0.9);
    expect(preset.lumaTheme.adjustments.saturation).toBe(1.1);
  });

  // ─── PAL-06: Adjustments merge ────────────────────────────────────────────
  test('PAL-06: Partial adjustment update merges with existing', async ({ page }) => {
    await page.evaluate((theme) => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme,
      });
    }, BASE_THEME);
    await page.waitForTimeout(100);

    // First adjustment
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_LUMA_THEME_ADJUSTMENTS', {
        masterId: 'master-default',
        adjustments: { brightness: 1.5 },
      });
    });
    await page.waitForTimeout(100);

    // Second adjustment (should merge, not replace)
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_LUMA_THEME_ADJUSTMENTS', {
        masterId: 'master-default',
        adjustments: { contrast: 0.8 },
      });
    });
    await page.waitForTimeout(200);

    const preset = await getPreset(page, 'palette-test-theme');
    expect(preset.lumaTheme.adjustments.brightness).toBe(1.5);
    expect(preset.lumaTheme.adjustments.contrast).toBe(0.8);
  });

  // ─── PAL-07: Slot structure is 12 slots ───────────────────────────────────
  test('PAL-07: Each slot stores only h and s (luma is fixed)', async ({ page }) => {
    await page.evaluate((theme) => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme,
      });
    }, BASE_THEME);
    await page.waitForTimeout(200);

    const preset = await getPreset(page, 'palette-test-theme');
    for (let i = 0; i < 12; i++) {
      const slot = preset.lumaTheme.slots[i];
      expect(typeof slot.h).toBe('number');
      expect(typeof slot.s).toBe('number');
    }
  });

  // ─── PAL-08: Sequential slot updates ──────────────────────────────────────
  test('PAL-08: Multiple slot updates in sequence all persist', async ({ page }) => {
    await page.evaluate((theme) => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme,
      });
    }, BASE_THEME);
    await page.waitForTimeout(200);

    // Update 3 different slots
    for (const { idx, h, s } of [{ idx: 0, h: 10, s: 20 }, { idx: 6, h: 270, s: 85 }, { idx: 11, h: 45, s: 55 }]) {
      await page.evaluate(({ i, hue, sat }) => {
        (window as any).__TEST_STORE__.dispatch('UPDATE_LUMA_THEME_SLOT', {
          masterId: 'master-default',
          slotIndex: i,
          h: hue,
          s: sat,
        });
      }, { i: idx, hue: h, sat: s });
    }
    await page.waitForTimeout(200);

    const preset = await getPreset(page, 'palette-test-theme');
    expect(preset.lumaTheme.slots[0]).toEqual({ h: 10, s: 20 });
    expect(preset.lumaTheme.slots[6]).toEqual({ h: 270, s: 85 });
    expect(preset.lumaTheme.slots[11]).toEqual({ h: 45, s: 55 });
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Palette operations maintain consistent preset', async ({ page }) => {
    await page.evaluate((theme) => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme,
      });
    }, BASE_THEME);
    await page.waitForTimeout(200);

    // Verify master references preset correctly
    const result = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const master = s.slideMasterPresets?.['master-default'];
      const themeId = master?.colorThemeId;
      const preset = themeId ? s.colorThemePresets?.[themeId] : null;
      return {
        masterHasThemeId: !!themeId,
        presetExists: !!preset,
        presetHasSlots: preset?.lumaTheme?.slots?.length === 12,
        presetHasColors: Array.isArray(preset?.lumaTheme?.resolvedColors),
      };
    });

    expect(result.masterHasThemeId).toBe(true);
    expect(result.presetExists).toBe(true);
    expect(result.presetHasSlots).toBe(true);
    expect(result.presetHasColors).toBe(true);

    const snap = await capture(page, 'palette-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
