/**
 * Eval Loop: Property Inspector — Stroke Color Operations (STK-01 → STK-13)
 *
 * Comprehensive tests for stroke/border color operations in the property inspector.
 * Covers stroke add/remove, color change, opacity, width, position (inside/center/outside),
 * visibility toggle, multiple strokes, blend modes, and gradient strokes.
 *
 * Taskflows:
 * STK-01: Add stroke with default color
 * STK-02: Change stroke color
 * STK-03: Change stroke opacity
 * STK-04: Change stroke width
 * STK-05: Stroke position — inside
 * STK-06: Stroke position — center
 * STK-07: Stroke position — outside
 * STK-08: Toggle stroke visibility off
 * STK-09: Toggle stroke visibility on
 * STK-10: Remove stroke
 * STK-11: Multiple strokes stacked
 * STK-12: Stroke blend mode
 * STK-13: Gradient stroke
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: PI Stroke Color Operations', () => {
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
      const id = `eval-stk-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x: 200, y: 200, width: 120, height: 80, rotation: 0, opacity: 1,
        fills: [{ type: 'solid', color: '#EEEEEE', opacity: 100, visible: true }],
      });
      store.dispatch('UPDATE_SELECTION', [id]);
      return id;
    });
  }

  function getStrokes(page: import('@playwright/test').Page, id: string) {
    return page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      return el?.style?.strokes ?? el?.strokes ?? [];
    }, { eid: id });
  }

  function updateStyle(page: import('@playwright/test').Page, id: string, style: any) {
    return page.evaluate(({ eid, st }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id: eid, style: st });
    }, { eid: id, st: style });
  }

  // ─── STK-01: Add stroke with default color ────────────────────────────────
  test('STK-01: Add stroke with default color', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateStyle(page, id, {
      strokes: [{
        type: 'solid', color: '#000000', width: 1,
        opacity: 100, position: 'center', visible: true,
      }],
    });
    await page.waitForTimeout(200);

    const strokes = await getStrokes(page, id);
    expect(strokes.length).toBe(1);
    expect(strokes[0].color).toBe('#000000');
    expect(strokes[0].width).toBe(1);

    const snap = await capture(page, 'stk-01-default');
    assertNoCriticalAnomalies(snap);
  });

  // ─── STK-02: Change stroke color ─────────────────────────────────────────
  test('STK-02: Change stroke color', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateStyle(page, id, {
      strokes: [{
        type: 'solid', color: '#E74C3C', width: 2,
        opacity: 100, position: 'center', visible: true,
      }],
    });
    await page.waitForTimeout(200);

    const strokes = await getStrokes(page, id);
    expect(strokes[0].color).toBe('#E74C3C');
  });

  // ─── STK-03: Change stroke opacity ───────────────────────────────────────
  test('STK-03: Change stroke opacity', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateStyle(page, id, {
      strokes: [{
        type: 'solid', color: '#000000', width: 2,
        opacity: 50, position: 'center', visible: true,
      }],
    });
    await page.waitForTimeout(200);

    const strokes = await getStrokes(page, id);
    expect(strokes[0].opacity).toBe(50);
  });

  // ─── STK-04: Change stroke width ─────────────────────────────────────────
  test('STK-04: Change stroke width', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateStyle(page, id, {
      strokes: [{
        type: 'solid', color: '#000000', width: 5,
        opacity: 100, position: 'center', visible: true,
      }],
    });
    await page.waitForTimeout(200);

    const strokes = await getStrokes(page, id);
    expect(strokes[0].width).toBe(5);
  });

  // ─── STK-05: Stroke position inside ───────────────────────────────────────
  test('STK-05: Stroke position — inside', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateStyle(page, id, {
      strokes: [{
        type: 'solid', color: '#333333', width: 3,
        opacity: 100, position: 'inside', visible: true,
      }],
    });
    await page.waitForTimeout(200);

    const strokes = await getStrokes(page, id);
    expect(strokes[0].position).toBe('inside');
  });

  // ─── STK-06: Stroke position center ───────────────────────────────────────
  test('STK-06: Stroke position — center', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateStyle(page, id, {
      strokes: [{
        type: 'solid', color: '#333333', width: 3,
        opacity: 100, position: 'center', visible: true,
      }],
    });
    await page.waitForTimeout(200);

    const strokes = await getStrokes(page, id);
    expect(strokes[0].position).toBe('center');
  });

  // ─── STK-07: Stroke position outside ──────────────────────────────────────
  test('STK-07: Stroke position — outside', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateStyle(page, id, {
      strokes: [{
        type: 'solid', color: '#333333', width: 3,
        opacity: 100, position: 'outside', visible: true,
      }],
    });
    await page.waitForTimeout(200);

    const strokes = await getStrokes(page, id);
    expect(strokes[0].position).toBe('outside');
  });

  // ─── STK-08: Toggle stroke visibility off ─────────────────────────────────
  test('STK-08: Toggle stroke visibility off', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateStyle(page, id, {
      strokes: [{
        type: 'solid', color: '#000000', width: 2,
        opacity: 100, position: 'center', visible: false,
      }],
    });
    await page.waitForTimeout(200);

    const strokes = await getStrokes(page, id);
    expect(strokes[0].visible).toBe(false);
  });

  // ─── STK-09: Toggle stroke visibility on ──────────────────────────────────
  test('STK-09: Toggle stroke visibility back on', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Start off
    await updateStyle(page, id, {
      strokes: [{
        type: 'solid', color: '#000000', width: 2,
        opacity: 100, position: 'center', visible: false,
      }],
    });
    await page.waitForTimeout(100);

    // Toggle on
    await updateStyle(page, id, {
      strokes: [{
        type: 'solid', color: '#000000', width: 2,
        opacity: 100, position: 'center', visible: true,
      }],
    });
    await page.waitForTimeout(200);

    const strokes = await getStrokes(page, id);
    expect(strokes[0].visible).toBe(true);
  });

  // ─── STK-10: Remove stroke ────────────────────────────────────────────────
  test('STK-10: Remove stroke', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Add stroke
    await updateStyle(page, id, {
      strokes: [{
        type: 'solid', color: '#000000', width: 1,
        opacity: 100, position: 'center', visible: true,
      }],
    });
    await page.waitForTimeout(100);

    // Remove
    await updateStyle(page, id, { strokes: [] });
    await page.waitForTimeout(200);

    const strokes = await getStrokes(page, id);
    expect(strokes.length).toBe(0);
  });

  // ─── STK-11: Multiple strokes ────────────────────────────────────────────
  test('STK-11: Multiple strokes stacked', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateStyle(page, id, {
      strokes: [
        { type: 'solid', color: '#FF0000', width: 1, opacity: 100, position: 'inside', visible: true },
        { type: 'solid', color: '#0000FF', width: 3, opacity: 80, position: 'outside', visible: true },
      ],
    });
    await page.waitForTimeout(200);

    const strokes = await getStrokes(page, id);
    expect(strokes.length).toBe(2);
    expect(strokes[0].color).toBe('#FF0000');
    expect(strokes[0].position).toBe('inside');
    expect(strokes[1].color).toBe('#0000FF');
    expect(strokes[1].position).toBe('outside');
    expect(strokes[1].opacity).toBe(80);
  });

  // ─── STK-12: Stroke blend mode ───────────────────────────────────────────
  test('STK-12: Stroke blend mode', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateStyle(page, id, {
      strokes: [{
        type: 'solid', color: '#FF6600', width: 2,
        opacity: 100, position: 'center', visible: true,
        blendMode: 'multiply',
      }],
    });
    await page.waitForTimeout(200);

    const strokes = await getStrokes(page, id);
    expect(strokes[0].blendMode).toBe('multiply');
  });

  // ─── STK-13: Gradient stroke ──────────────────────────────────────────────
  test('STK-13: Gradient stroke', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateStyle(page, id, {
      strokes: [{
        type: 'gradient',
        width: 3,
        opacity: 100,
        position: 'center',
        visible: true,
        value: {
          type: 'linear',
          angle: 90,
          stops: [
            { color: '#FF0000', position: 0 },
            { color: '#0000FF', position: 100 },
          ],
        },
      }],
    });
    await page.waitForTimeout(200);

    const strokes = await getStrokes(page, id);
    expect(strokes[0].type).toBe('gradient');
    expect(strokes[0].value.stops.length).toBe(2);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Stroke operations maintain store consistency', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateStyle(page, id, {
      strokes: [
        { type: 'solid', color: '#FF0000', width: 2, opacity: 80, position: 'inside', visible: true },
        { type: 'solid', color: '#0000FF', width: 4, opacity: 50, position: 'outside', visible: false, blendMode: 'screen' },
      ],
    });
    await page.waitForTimeout(200);

    const result = await page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      const strokes = el?.style?.strokes ?? el?.strokes ?? [];
      return {
        count: strokes.length,
        allHaveType: strokes.every((st: any) => typeof st.type === 'string'),
        allHaveWidth: strokes.every((st: any) => typeof st.width === 'number'),
        allHaveOpacity: strokes.every((st: any) => typeof st.opacity === 'number'),
        allHavePosition: strokes.every((st: any) => ['inside', 'center', 'outside'].includes(st.position)),
        widthPositive: strokes.every((st: any) => st.width > 0),
      };
    }, { eid: id });

    expect(result.count).toBe(2);
    expect(result.allHaveType).toBe(true);
    expect(result.allHaveWidth).toBe(true);
    expect(result.allHaveOpacity).toBe(true);
    expect(result.allHavePosition).toBe(true);
    expect(result.widthPositive).toBe(true);

    const snap = await capture(page, 'stk-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
