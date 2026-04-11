/**
 * Eval Loop: Property Inspector — Gradient Fill Operations (GRD-01 → GRD-13)
 *
 * Comprehensive tests for gradient fill operations in the property inspector.
 * Covers linear, radial, angular, diamond gradient types, stop management,
 * gradient angle/position changes, type switching, and gradient+solid stacks.
 *
 * Taskflows:
 * GRD-01: Apply linear gradient fill
 * GRD-02: Apply radial gradient fill
 * GRD-03: Apply angular (conic) gradient fill
 * GRD-04: Apply diamond gradient fill
 * GRD-05: Change linear gradient angle
 * GRD-06: Add gradient stop (3 stops)
 * GRD-07: Remove gradient stop (back to 2)
 * GRD-08: Change gradient stop color
 * GRD-09: Change gradient stop position
 * GRD-10: Gradient with per-stop opacity
 * GRD-11: Switch gradient type (linear → radial)
 * GRD-12: Mixed fill stack (solid + gradient)
 * GRD-13: Gradient stop with themeSlot reference
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: PI Gradient Fill Operations', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function seedRect(page: import('@playwright/test').Page, overrides = {}) {
    return page.evaluate((ov) => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-grd-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x: 200, y: 200, width: 140, height: 100, rotation: 0, opacity: 1,
        fills: [{ type: 'solid', color: '#CCCCCC', opacity: 100, visible: true }],
        ...ov,
      });
      store.dispatch('UPDATE_SELECTION', [id]);
      return id;
    }, overrides);
  }

  function getFills(page: import('@playwright/test').Page, id: string) {
    return page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      return el?.fills ?? el?.style?.fills ?? [];
    }, { eid: id });
  }

  function updateFills(page: import('@playwright/test').Page, id: string, fills: any[]) {
    return page.evaluate(({ eid, f }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id: eid, fills: f });
    }, { eid: id, f: fills });
  }

  // ─── GRD-01: Linear gradient ─────────────────────────────────────────────
  test('GRD-01: Apply linear gradient fill', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [{
      type: 'gradient',
      visible: true,
      opacity: 100,
      value: {
        type: 'linear',
        angle: 90,
        stops: [
          { color: '#000000', position: 0 },
          { color: '#FFFFFF', position: 100 },
        ],
      },
    }]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].type).toBe('gradient');
    expect(fills[0].value.type).toBe('linear');
    expect(fills[0].value.angle).toBe(90);
    expect(fills[0].value.stops.length).toBe(2);

    const snap = await capture(page, 'grd-01-linear');
    assertNoCriticalAnomalies(snap);
  });

  // ─── GRD-02: Radial gradient ─────────────────────────────────────────────
  test('GRD-02: Apply radial gradient fill', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [{
      type: 'gradient',
      visible: true,
      opacity: 100,
      value: {
        type: 'radial',
        stops: [
          { color: '#FF0000', position: 0 },
          { color: '#0000FF', position: 100 },
        ],
        centerX: 0.5,
        centerY: 0.5,
      },
    }]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].value.type).toBe('radial');
    expect(fills[0].value.centerX).toBe(0.5);
    expect(fills[0].value.centerY).toBe(0.5);
  });

  // ─── GRD-03: Angular (conic) gradient ─────────────────────────────────────
  test('GRD-03: Apply angular (conic) gradient fill', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [{
      type: 'gradient',
      visible: true,
      opacity: 100,
      value: {
        type: 'angular',
        angle: 0,
        stops: [
          { color: '#FF0000', position: 0 },
          { color: '#00FF00', position: 50 },
          { color: '#0000FF', position: 100 },
        ],
      },
    }]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].value.type).toBe('angular');
    expect(fills[0].value.stops.length).toBe(3);
  });

  // ─── GRD-04: Diamond gradient ─────────────────────────────────────────────
  test('GRD-04: Apply diamond gradient fill', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [{
      type: 'gradient',
      visible: true,
      opacity: 100,
      value: {
        type: 'diamond',
        angle: 45,
        stops: [
          { color: '#FFD700', position: 0 },
          { color: '#8B4513', position: 100 },
        ],
      },
    }]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].value.type).toBe('diamond');
  });

  // ─── GRD-05: Change linear gradient angle ─────────────────────────────────
  test('GRD-05: Change linear gradient angle', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [{
      type: 'gradient', visible: true, opacity: 100,
      value: {
        type: 'linear', angle: 90,
        stops: [{ color: '#000000', position: 0 }, { color: '#FFFFFF', position: 100 }],
      },
    }]);
    await page.waitForTimeout(100);

    // Change angle to 180
    await updateFills(page, id, [{
      type: 'gradient', visible: true, opacity: 100,
      value: {
        type: 'linear', angle: 180,
        stops: [{ color: '#000000', position: 0 }, { color: '#FFFFFF', position: 100 }],
      },
    }]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].value.angle).toBe(180);
  });

  // ─── GRD-06: Add gradient stop ────────────────────────────────────────────
  test('GRD-06: Add gradient stop (3 stops)', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [{
      type: 'gradient', visible: true, opacity: 100,
      value: {
        type: 'linear', angle: 90,
        stops: [
          { color: '#FF0000', position: 0 },
          { color: '#FFFF00', position: 50 },
          { color: '#00FF00', position: 100 },
        ],
      },
    }]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].value.stops.length).toBe(3);
    expect(fills[0].value.stops[1].color).toBe('#FFFF00');
    expect(fills[0].value.stops[1].position).toBe(50);
  });

  // ─── GRD-07: Remove gradient stop ────────────────────────────────────────
  test('GRD-07: Remove gradient stop (back to 2)', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Start with 3 stops
    await updateFills(page, id, [{
      type: 'gradient', visible: true, opacity: 100,
      value: {
        type: 'linear', angle: 90,
        stops: [
          { color: '#FF0000', position: 0 },
          { color: '#FFFF00', position: 50 },
          { color: '#00FF00', position: 100 },
        ],
      },
    }]);
    await page.waitForTimeout(100);

    // Remove middle stop
    await updateFills(page, id, [{
      type: 'gradient', visible: true, opacity: 100,
      value: {
        type: 'linear', angle: 90,
        stops: [
          { color: '#FF0000', position: 0 },
          { color: '#00FF00', position: 100 },
        ],
      },
    }]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].value.stops.length).toBe(2);
  });

  // ─── GRD-08: Change gradient stop color ───────────────────────────────────
  test('GRD-08: Change gradient stop color', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [{
      type: 'gradient', visible: true, opacity: 100,
      value: {
        type: 'linear', angle: 90,
        stops: [
          { color: '#000000', position: 0 },
          { color: '#FFFFFF', position: 100 },
        ],
      },
    }]);
    await page.waitForTimeout(100);

    // Change first stop to red
    await updateFills(page, id, [{
      type: 'gradient', visible: true, opacity: 100,
      value: {
        type: 'linear', angle: 90,
        stops: [
          { color: '#E74C3C', position: 0 },
          { color: '#FFFFFF', position: 100 },
        ],
      },
    }]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].value.stops[0].color).toBe('#E74C3C');
  });

  // ─── GRD-09: Change gradient stop position ────────────────────────────────
  test('GRD-09: Change gradient stop position', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [{
      type: 'gradient', visible: true, opacity: 100,
      value: {
        type: 'linear', angle: 90,
        stops: [
          { color: '#000000', position: 0 },
          { color: '#888888', position: 50 },
          { color: '#FFFFFF', position: 100 },
        ],
      },
    }]);
    await page.waitForTimeout(100);

    // Move middle stop from 50 to 75
    await updateFills(page, id, [{
      type: 'gradient', visible: true, opacity: 100,
      value: {
        type: 'linear', angle: 90,
        stops: [
          { color: '#000000', position: 0 },
          { color: '#888888', position: 75 },
          { color: '#FFFFFF', position: 100 },
        ],
      },
    }]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].value.stops[1].position).toBe(75);
  });

  // ─── GRD-10: Per-stop opacity ─────────────────────────────────────────────
  test('GRD-10: Gradient with per-stop opacity', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [{
      type: 'gradient', visible: true, opacity: 100,
      value: {
        type: 'linear', angle: 0,
        stops: [
          { color: '#FF0000', position: 0, opacity: 100 },
          { color: '#FF0000', position: 100, opacity: 0 },
        ],
      },
    }]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].value.stops[0].opacity).toBe(100);
    expect(fills[0].value.stops[1].opacity).toBe(0);
  });

  // ─── GRD-11: Switch gradient type ────────────────────────────────────────
  test('GRD-11: Switch gradient type (linear → radial)', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Start with linear
    await updateFills(page, id, [{
      type: 'gradient', visible: true, opacity: 100,
      value: {
        type: 'linear', angle: 90,
        stops: [{ color: '#000000', position: 0 }, { color: '#FFFFFF', position: 100 }],
      },
    }]);
    await page.waitForTimeout(100);

    // Switch to radial, keep stops
    await updateFills(page, id, [{
      type: 'gradient', visible: true, opacity: 100,
      value: {
        type: 'radial',
        stops: [{ color: '#000000', position: 0 }, { color: '#FFFFFF', position: 100 }],
        centerX: 0.5, centerY: 0.5,
      },
    }]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].value.type).toBe('radial');
    // Stops preserved
    expect(fills[0].value.stops.length).toBe(2);
  });

  // ─── GRD-12: Mixed fill stack ────────────────────────────────────────────
  test('GRD-12: Mixed fill stack (solid + gradient)', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [
      { type: 'solid', color: '#FFFFFF', opacity: 100, visible: true },
      {
        type: 'gradient', visible: true, opacity: 75,
        value: {
          type: 'linear', angle: 45,
          stops: [{ color: '#FF0000', position: 0 }, { color: '#0000FF', position: 100 }],
        },
      },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills.length).toBe(2);
    expect(fills[0].type).toBe('solid');
    expect(fills[1].type).toBe('gradient');
    expect(fills[1].opacity).toBe(75);
  });

  // ─── GRD-13: Gradient stop with themeSlot ─────────────────────────────────
  test('GRD-13: Gradient stop with themeSlot reference', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [{
      type: 'gradient', visible: true, opacity: 100,
      value: {
        type: 'linear', angle: 90,
        stops: [
          { color: '#333333', position: 0, themeSlot: 1 },
          { color: '#EEEEEE', position: 100, themeSlot: 10 },
        ],
      },
    }]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].value.stops[0].themeSlot).toBe(1);
    expect(fills[0].value.stops[1].themeSlot).toBe(10);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Gradient fill operations maintain structure', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [{
      type: 'gradient', visible: true, opacity: 100,
      value: {
        type: 'linear', angle: 135,
        stops: [
          { color: '#FF5733', position: 0 },
          { color: '#33FF57', position: 50 },
          { color: '#3357FF', position: 100 },
        ],
      },
    }]);
    await page.waitForTimeout(200);

    const result = await page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      const fills = el?.fills ?? el?.style?.fills ?? [];
      const grad = fills[0];
      return {
        isGradient: grad?.type === 'gradient',
        hasValue: typeof grad?.value === 'object',
        hasType: typeof grad?.value?.type === 'string',
        hasStops: Array.isArray(grad?.value?.stops),
        stopsHaveColor: (grad?.value?.stops ?? []).every((s: any) => typeof s.color === 'string'),
        stopsHavePosition: (grad?.value?.stops ?? []).every((s: any) => typeof s.position === 'number'),
        stopsOrdered: (grad?.value?.stops ?? []).every((s: any, i: number, arr: any[]) =>
          i === 0 || s.position >= arr[i - 1].position,
        ),
      };
    }, { eid: id });

    expect(result.isGradient).toBe(true);
    expect(result.hasValue).toBe(true);
    expect(result.hasType).toBe(true);
    expect(result.hasStops).toBe(true);
    expect(result.stopsHaveColor).toBe(true);
    expect(result.stopsHavePosition).toBe(true);
    expect(result.stopsOrdered).toBe(true);

    const snap = await capture(page, 'grd-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
