/**
 * Eval Loop: Property Inspector — Blend Modes (BLN-01 → BLN-18)
 *
 * Comprehensive tests for all CSS blend modes on fills, strokes, and elements.
 * Covers all 16 standard blend modes plus element-level and stroke-level blend modes.
 *
 * Taskflows:
 * BLN-01: Normal blend mode (default)
 * BLN-02: Multiply blend mode
 * BLN-03: Screen blend mode
 * BLN-04: Overlay blend mode
 * BLN-05: Darken blend mode
 * BLN-06: Lighten blend mode
 * BLN-07: Color dodge blend mode
 * BLN-08: Color burn blend mode
 * BLN-09: Hard light blend mode
 * BLN-10: Soft light blend mode
 * BLN-11: Difference blend mode
 * BLN-12: Exclusion blend mode
 * BLN-13: Hue blend mode
 * BLN-14: Saturation blend mode
 * BLN-15: Color blend mode
 * BLN-16: Luminosity blend mode
 * BLN-17: Element-level blend mode
 * BLN-18: Stroke blend mode
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: PI Blend Modes', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function seedRect(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-bln-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x: 200, y: 200, width: 120, height: 80, rotation: 0, opacity: 1,
        fills: [{ type: 'solid', color: '#4A90D9', opacity: 100, visible: true }],
      });
      store.dispatch('UPDATE_SELECTION', [id]);
      return id;
    });
  }

  function getFills(page: import('@playwright/test').Page, id: string) {
    return page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      return el?.fills ?? el?.style?.fills ?? [];
    }, { eid: id });
  }

  function getElement(page: import('@playwright/test').Page, id: string) {
    return page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId].elements[eid];
    }, { eid: id });
  }

  function setFillBlendMode(page: import('@playwright/test').Page, id: string, blendMode: string) {
    return page.evaluate(({ eid, bm }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{ type: 'solid', color: '#4A90D9', opacity: 100, visible: true, blendMode: bm }],
      });
    }, { eid: id, bm: blendMode });
  }

  const BLEND_MODES = [
    { id: 'normal', label: 'Normal', testId: 'BLN-01' },
    { id: 'multiply', label: 'Multiply', testId: 'BLN-02' },
    { id: 'screen', label: 'Screen', testId: 'BLN-03' },
    { id: 'overlay', label: 'Overlay', testId: 'BLN-04' },
    { id: 'darken', label: 'Darken', testId: 'BLN-05' },
    { id: 'lighten', label: 'Lighten', testId: 'BLN-06' },
    { id: 'color-dodge', label: 'Color Dodge', testId: 'BLN-07' },
    { id: 'color-burn', label: 'Color Burn', testId: 'BLN-08' },
    { id: 'hard-light', label: 'Hard Light', testId: 'BLN-09' },
    { id: 'soft-light', label: 'Soft Light', testId: 'BLN-10' },
    { id: 'difference', label: 'Difference', testId: 'BLN-11' },
    { id: 'exclusion', label: 'Exclusion', testId: 'BLN-12' },
    { id: 'hue', label: 'Hue', testId: 'BLN-13' },
    { id: 'saturation', label: 'Saturation', testId: 'BLN-14' },
    { id: 'color', label: 'Color', testId: 'BLN-15' },
    { id: 'luminosity', label: 'Luminosity', testId: 'BLN-16' },
  ];

  // ─── BLN-01 through BLN-16: All 16 fill blend modes ──────────────────────
  for (const mode of BLEND_MODES) {
    test(`${mode.testId}: Fill blend mode — ${mode.label}`, async ({ page }) => {
      const id = await seedRect(page);
      await page.waitForTimeout(200);

      await setFillBlendMode(page, id, mode.id);
      await page.waitForTimeout(200);

      const fills = await getFills(page, id);
      expect(fills[0].blendMode).toBe(mode.id);
    });
  }

  // ─── BLN-17: Element-level blend mode ────────────────────────────────────
  test('BLN-17: Element-level blend mode', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        blendMode: 'overlay',
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.blendMode).toBe('overlay');

    const snap = await capture(page, 'bln-17-element-overlay');
    assertNoCriticalAnomalies(snap);
  });

  // ─── BLN-18: Stroke blend mode ──────────────────────────────────────────
  test('BLN-18: Stroke blend mode', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        style: {
          strokes: [{
            type: 'solid', color: '#000000', width: 3,
            opacity: 100, position: 'center', visible: true,
            blendMode: 'multiply',
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
    expect(strokes[0].blendMode).toBe('multiply');
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Blend modes are valid CSS values', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        blendMode: 'screen',
        fills: [{ type: 'solid', color: '#4A90D9', opacity: 100, visible: true, blendMode: 'multiply' }],
        style: {
          strokes: [{
            type: 'solid', color: '#000000', width: 1,
            opacity: 100, position: 'center', visible: true,
            blendMode: 'overlay',
          }],
        },
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const VALID_BLEND_MODES = new Set([
      'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
      'color-dodge', 'color-burn', 'hard-light', 'soft-light',
      'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity',
    ]);

    const result = await page.evaluate(({ eid, valid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      const fills = el?.fills ?? el?.style?.fills ?? [];
      const strokes = el?.style?.strokes ?? el?.strokes ?? [];
      const validSet = new Set(valid);
      return {
        elBlendValid: !el.blendMode || validSet.has(el.blendMode),
        fillBlendsValid: fills.every((f: any) => !f.blendMode || validSet.has(f.blendMode)),
        strokeBlendsValid: strokes.every((st: any) => !st.blendMode || validSet.has(st.blendMode)),
      };
    }, { eid: id, valid: [...VALID_BLEND_MODES] });

    expect(result.elBlendValid).toBe(true);
    expect(result.fillBlendsValid).toBe(true);
    expect(result.strokeBlendsValid).toBe(true);

    const snap = await capture(page, 'bln-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
