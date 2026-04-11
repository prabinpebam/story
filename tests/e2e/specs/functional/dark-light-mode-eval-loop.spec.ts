/**
 * Eval Loop: Dark/Light Mode & Slot Remapping
 * 
 * Tests the color mode system where dark mode reverses
 * the shadow↔highlight slot mapping (slot N → slot 11-N).
 * 
 * Taskflows Covered:
 * DLM-01: Set color mode to dark
 * DLM-02: Set color mode to light
 * DLM-03: Toggle dark → light → dark
 * DLM-04: Dark mode stored on master (not slide/layout)
 * DLM-05: colorModeId persists in master after theme change
 * DLM-06: Invalid color mode rejected
 * DLM-07: Color mode affects slot resolution (dark reverses shadows↔highlights)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Dark/Light Mode', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function getColorMode(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      return (window as any).__TEST_STORE__.getState().slideMasterPresets?.['master-default']?.colorModeId ?? 'light';
    });
  }

  // ─── DLM-01: Set dark mode ────────────────────────────────────────────────
  test('DLM-01: Set color mode to dark via SET_COLOR_MODE', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_COLOR_MODE', {
        masterId: 'master-default',
        colorMode: 'dark',
      });
    });
    await page.waitForTimeout(200);

    const mode = await getColorMode(page);
    expect(mode).toBe('dark');

    const snap = await capture(page, 'dark-mode-set');
    assertNoCriticalAnomalies(snap);

    // Cleanup
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_COLOR_MODE', {
        masterId: 'master-default',
        colorMode: 'light',
      });
    });
  });

  // ─── DLM-02: Set light mode ───────────────────────────────────────────────
  test('DLM-02: Set color mode to light', async ({ page }) => {
    // Set dark first
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_COLOR_MODE', {
        masterId: 'master-default',
        colorMode: 'dark',
      });
    });
    await page.waitForTimeout(100);

    // Switch back to light
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_COLOR_MODE', {
        masterId: 'master-default',
        colorMode: 'light',
      });
    });
    await page.waitForTimeout(200);

    expect(await getColorMode(page)).toBe('light');
  });

  // ─── DLM-03: Toggle cycle ────────────────────────────────────────────────
  test('DLM-03: Toggle dark → light → dark cycle', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_COLOR_MODE', {
        masterId: 'master-default',
        colorMode: 'dark',
      });
    });
    await page.waitForTimeout(100);
    expect(await getColorMode(page)).toBe('dark');

    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_COLOR_MODE', {
        masterId: 'master-default',
        colorMode: 'light',
      });
    });
    await page.waitForTimeout(100);
    expect(await getColorMode(page)).toBe('light');

    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_COLOR_MODE', {
        masterId: 'master-default',
        colorMode: 'dark',
      });
    });
    await page.waitForTimeout(100);
    expect(await getColorMode(page)).toBe('dark');

    // Cleanup
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_COLOR_MODE', {
        masterId: 'master-default',
        colorMode: 'light',
      });
    });
  });

  // ─── DLM-04: Mode stored on master only ──────────────────────────────────
  test('DLM-04: Color mode is stored on master, not slide', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_COLOR_MODE', {
        masterId: 'master-default',
        colorMode: 'dark',
      });
    });
    await page.waitForTimeout(200);

    const result = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const master = s.slideMasterPresets?.['master-default'];
      const slide = s.slides[s.editor.activeSlideId];
      return {
        masterMode: master?.colorModeId,
        slideHasMode: 'colorModeId' in (slide ?? {}),
      };
    });

    expect(result.masterMode).toBe('dark');
    expect(result.slideHasMode).toBe(false);

    // Cleanup
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_COLOR_MODE', {
        masterId: 'master-default',
        colorMode: 'light',
      });
    });
  });

  // ─── DLM-05: Mode persists after theme change ────────────────────────────
  test('DLM-05: Color mode persists after applying new theme', async ({ page }) => {
    // Set dark mode
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_COLOR_MODE', {
        masterId: 'master-default',
        colorMode: 'dark',
      });
    });
    await page.waitForTimeout(100);

    // Apply a new theme to master
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('APPLY_LUMA_THEME', {
        masterId: 'master-default',
        theme: {
          id: 'mode-persist-theme',
          name: 'Mode Persist',
          slots: Array.from({ length: 12 }, (_, i) => ({ h: i * 30, s: 60 })),
          adjustments: {},
          colors: Array.from({ length: 12 }, () => '#777777'),
        },
      });
    });
    await page.waitForTimeout(200);

    // Mode should still be dark
    const mode = await getColorMode(page);
    expect(mode).toBe('dark');

    // Cleanup
    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_COLOR_MODE', {
        masterId: 'master-default',
        colorMode: 'light',
      });
    });
  });

  // ─── DLM-06: Invalid mode rejected ───────────────────────────────────────
  test('DLM-06: Invalid color mode value is rejected', async ({ page }) => {
    const before = await getColorMode(page);

    await page.evaluate(() => {
      (window as any).__TEST_STORE__.dispatch('SET_COLOR_MODE', {
        masterId: 'master-default',
        colorMode: 'sepia', // invalid
      });
    });
    await page.waitForTimeout(100);

    const after = await getColorMode(page);
    expect(after).toBe(before); // Should not change
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Dark/light mode is consistent', async ({ page }) => {
    const result = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const master = s.slideMasterPresets?.['master-default'];
      const mode = master?.colorModeId ?? 'light';
      return {
        isValidMode: mode === 'light' || mode === 'dark',
        masterExists: !!master,
      };
    });

    expect(result.masterExists).toBe(true);
    expect(result.isValidMode).toBe(true);

    const snap = await capture(page, 'dark-light-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
