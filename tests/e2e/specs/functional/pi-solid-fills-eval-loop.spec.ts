/**
 * Eval Loop: Property Inspector — Solid Fill Color Operations (SFC-01 → SFC-18)
 *
 * Comprehensive tests for solid color fill operations in the property inspector.
 * Covers hex color changes, fill stack management, fill reordering, multiple
 * fills with independent opacity/visibility/blend mode, and multi-selection updates.
 *
 * Taskflows:
 * SFC-01: Apply solid fill hex color to element
 * SFC-02: Change fill hex to a different color
 * SFC-03: Set fill opacity to 0% (fully transparent)
 * SFC-04: Set fill opacity to 50%
 * SFC-05: Restore fill opacity to 100%
 * SFC-06: Toggle fill visibility off
 * SFC-07: Toggle fill visibility back on
 * SFC-08: Add second solid fill layer
 * SFC-09: Third fill layer with different opacity
 * SFC-10: Remove middle fill from 3-layer stack
 * SFC-11: Reorder fills (swap first and last)
 * SFC-12: Fill blend mode — multiply
 * SFC-13: Fill blend mode — screen
 * SFC-14: Fill blend mode — overlay
 * SFC-15: Clear all fills results in empty array
 * SFC-16: Re-add fill after clearing
 * SFC-17: Multi-select element fill update
 * SFC-18: Each fill in stack has independent properties
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: PI Solid Fill Color Operations', () => {
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
      const id = `eval-sfc-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x: 200, y: 200, width: 120, height: 80, rotation: 0, opacity: 1,
        fills: [{ type: 'solid', color: '#4A90D9', opacity: 100, visible: true }],
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

  // ─── SFC-01: Apply solid fill hex ─────────────────────────────────────────
  test('SFC-01: Apply solid fill hex color to element', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [
      { type: 'solid', color: '#E74C3C', opacity: 100, visible: true },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].color).toBe('#E74C3C');
    expect(fills[0].type).toBe('solid');

    const snap = await capture(page, 'sfc-01-solid-red');
    assertNoCriticalAnomalies(snap);
  });

  // ─── SFC-02: Change fill hex to different color ───────────────────────────
  test('SFC-02: Change fill hex to a different color', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [
      { type: 'solid', color: '#2ECC71', opacity: 100, visible: true },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].color).toBe('#2ECC71');
  });

  // ─── SFC-03: Fill opacity 0% ─────────────────────────────────────────────
  test('SFC-03: Set fill opacity to 0% (fully transparent)', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [
      { type: 'solid', color: '#4A90D9', opacity: 0, visible: true },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].opacity).toBe(0);
  });

  // ─── SFC-04: Fill opacity 50% ────────────────────────────────────────────
  test('SFC-04: Set fill opacity to 50%', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [
      { type: 'solid', color: '#4A90D9', opacity: 50, visible: true },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].opacity).toBe(50);
  });

  // ─── SFC-05: Restore fill opacity to 100% ────────────────────────────────
  test('SFC-05: Restore fill opacity back to 100%', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Set to 25% first
    await updateFills(page, id, [
      { type: 'solid', color: '#4A90D9', opacity: 25, visible: true },
    ]);
    await page.waitForTimeout(100);

    // Restore to 100%
    await updateFills(page, id, [
      { type: 'solid', color: '#4A90D9', opacity: 100, visible: true },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].opacity).toBe(100);
  });

  // ─── SFC-06: Toggle fill visibility off ───────────────────────────────────
  test('SFC-06: Toggle fill visibility off', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [
      { type: 'solid', color: '#4A90D9', opacity: 100, visible: false },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].visible).toBe(false);
  });

  // ─── SFC-07: Toggle fill visibility back on ──────────────────────────────
  test('SFC-07: Toggle fill visibility back on', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [
      { type: 'solid', color: '#4A90D9', opacity: 100, visible: false },
    ]);
    await page.waitForTimeout(100);

    await updateFills(page, id, [
      { type: 'solid', color: '#4A90D9', opacity: 100, visible: true },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].visible).toBe(true);
  });

  // ─── SFC-08: Add second fill layer ───────────────────────────────────────
  test('SFC-08: Add second solid fill layer', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [
      { type: 'solid', color: '#4A90D9', opacity: 100, visible: true },
      { type: 'solid', color: '#FF6600', opacity: 50, visible: true },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills.length).toBe(2);
    expect(fills[0].color).toBe('#4A90D9');
    expect(fills[1].color).toBe('#FF6600');
    expect(fills[1].opacity).toBe(50);
  });

  // ─── SFC-09: Third fill layer with different opacity ─────────────────────
  test('SFC-09: Three fill layers with independent opacities', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [
      { type: 'solid', color: '#FF0000', opacity: 100, visible: true },
      { type: 'solid', color: '#00FF00', opacity: 75, visible: true },
      { type: 'solid', color: '#0000FF', opacity: 30, visible: true },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills.length).toBe(3);
    expect(fills[0].opacity).toBe(100);
    expect(fills[1].opacity).toBe(75);
    expect(fills[2].opacity).toBe(30);
  });

  // ─── SFC-10: Remove middle fill from 3-layer stack ───────────────────────
  test('SFC-10: Remove middle fill from 3-layer stack', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Set up 3 layers
    await updateFills(page, id, [
      { type: 'solid', color: '#FF0000', opacity: 100, visible: true },
      { type: 'solid', color: '#00FF00', opacity: 100, visible: true },
      { type: 'solid', color: '#0000FF', opacity: 100, visible: true },
    ]);
    await page.waitForTimeout(100);

    // Remove middle (green)
    await updateFills(page, id, [
      { type: 'solid', color: '#FF0000', opacity: 100, visible: true },
      { type: 'solid', color: '#0000FF', opacity: 100, visible: true },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills.length).toBe(2);
    expect(fills[0].color).toBe('#FF0000');
    expect(fills[1].color).toBe('#0000FF');
  });

  // ─── SFC-11: Reorder fills ───────────────────────────────────────────────
  test('SFC-11: Reorder fills (swap first and last)', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [
      { type: 'solid', color: '#AA0000', opacity: 100, visible: true },
      { type: 'solid', color: '#00AA00', opacity: 100, visible: true },
      { type: 'solid', color: '#0000AA', opacity: 100, visible: true },
    ]);
    await page.waitForTimeout(100);

    // Reorder: swap first and last
    await updateFills(page, id, [
      { type: 'solid', color: '#0000AA', opacity: 100, visible: true },
      { type: 'solid', color: '#00AA00', opacity: 100, visible: true },
      { type: 'solid', color: '#AA0000', opacity: 100, visible: true },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].color).toBe('#0000AA');
    expect(fills[2].color).toBe('#AA0000');
  });

  // ─── SFC-12: Fill blend mode multiply ────────────────────────────────────
  test('SFC-12: Fill blend mode — multiply', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [
      { type: 'solid', color: '#4A90D9', opacity: 100, visible: true, blendMode: 'multiply' },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].blendMode).toBe('multiply');
  });

  // ─── SFC-13: Fill blend mode screen ──────────────────────────────────────
  test('SFC-13: Fill blend mode — screen', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [
      { type: 'solid', color: '#4A90D9', opacity: 100, visible: true, blendMode: 'screen' },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].blendMode).toBe('screen');
  });

  // ─── SFC-14: Fill blend mode overlay ─────────────────────────────────────
  test('SFC-14: Fill blend mode — overlay', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [
      { type: 'solid', color: '#4A90D9', opacity: 100, visible: true, blendMode: 'overlay' },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].blendMode).toBe('overlay');
  });

  // ─── SFC-15: Clear all fills ─────────────────────────────────────────────
  test('SFC-15: Clear all fills results in empty array', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, []);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills.length).toBe(0);
  });

  // ─── SFC-16: Re-add fill after clearing ──────────────────────────────────
  test('SFC-16: Re-add fill after clearing', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Clear
    await updateFills(page, id, []);
    await page.waitForTimeout(100);

    // Re-add
    await updateFills(page, id, [
      { type: 'solid', color: '#9B59B6', opacity: 100, visible: true },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills.length).toBe(1);
    expect(fills[0].color).toBe('#9B59B6');
  });

  // ─── SFC-17: Multi-select fill update ────────────────────────────────────
  test('SFC-17: Multi-select element fill update', async ({ page }) => {
    const ids = await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const id1 = `eval-sfc-m1-${Date.now().toString(36)}`;
      const id2 = `eval-sfc-m2-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id: id1, type: 'rect', x: 100, y: 100, width: 80, height: 60,
        rotation: 0, opacity: 1,
        fills: [{ type: 'solid', color: '#111111', opacity: 100, visible: true }],
      });
      store.dispatch('ADD_ELEMENT', {
        id: id2, type: 'rect', x: 300, y: 100, width: 80, height: 60,
        rotation: 0, opacity: 1,
        fills: [{ type: 'solid', color: '#222222', opacity: 100, visible: true }],
      });
      store.dispatch('UPDATE_SELECTION', [id1, id2]);
      return [id1, id2];
    });
    await page.waitForTimeout(200);

    // Update both elements' fills
    for (const eid of ids) {
      await page.evaluate(({ eid }) => {
        (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
          id: eid,
          fills: [{ type: 'solid', color: '#F39C12', opacity: 100, visible: true }],
        });
      }, { eid });
    }
    await page.waitForTimeout(200);

    for (const eid of ids) {
      const fills = await getFills(page, eid);
      expect(fills[0].color).toBe('#F39C12');
    }
  });

  // ─── SFC-18: Fill stack independent properties ───────────────────────────
  test('SFC-18: Each fill in stack has independent properties', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await updateFills(page, id, [
      { type: 'solid', color: '#FF0000', opacity: 100, visible: true, blendMode: 'normal' },
      { type: 'solid', color: '#00FF00', opacity: 60, visible: false, blendMode: 'multiply' },
      { type: 'solid', color: '#0000FF', opacity: 30, visible: true, blendMode: 'screen' },
    ]);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills.length).toBe(3);

    expect(fills[0].color).toBe('#FF0000');
    expect(fills[0].opacity).toBe(100);
    expect(fills[0].visible).toBe(true);

    expect(fills[1].color).toBe('#00FF00');
    expect(fills[1].opacity).toBe(60);
    expect(fills[1].visible).toBe(false);
    expect(fills[1].blendMode).toBe('multiply');

    expect(fills[2].color).toBe('#0000FF');
    expect(fills[2].opacity).toBe(30);
    expect(fills[2].blendMode).toBe('screen');
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Solid fill operations maintain store consistency', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Perform multiple ops
    await updateFills(page, id, [
      { type: 'solid', color: '#AABBCC', opacity: 75, visible: true, blendMode: 'overlay' },
      { type: 'solid', color: '#DDEEFF', opacity: 25, visible: false },
    ]);
    await page.waitForTimeout(200);

    const result = await page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      const fills = el?.fills ?? el?.style?.fills ?? [];
      return {
        allHaveType: fills.every((f: any) => f.type === 'solid'),
        allHaveColor: fills.every((f: any) => typeof f.color === 'string'),
        allHaveOpacity: fills.every((f: any) => typeof f.opacity === 'number'),
        opacityInRange: fills.every((f: any) => f.opacity >= 0 && f.opacity <= 100),
      };
    }, { eid: id });

    expect(result.allHaveType).toBe(true);
    expect(result.allHaveColor).toBe(true);
    expect(result.allHaveOpacity).toBe(true);
    expect(result.opacityInRange).toBe(true);

    const snap = await capture(page, 'sfc-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
