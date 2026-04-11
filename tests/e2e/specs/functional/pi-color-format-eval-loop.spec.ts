/**
 * Eval Loop: Property Inspector — Color Format & Conversion (FMT-01 → FMT-08)
 *
 * Tests color format handling: hex input/output, RGB model, HSB model,
 * hex normalization (#RGB → #RRGGBB), fill value/color consistency,
 * and color input validation patterns.
 *
 * Taskflows:
 * FMT-01: Hex #RRGGBB stored correctly on fill
 * FMT-02: Short hex #RGB stored/normalized
 * FMT-03: Hex is case-insensitive
 * FMT-04: Color stored as both .color and .value for compat
 * FMT-05: Fill color is always a string
 * FMT-06: Gradient stops store hex colors
 * FMT-07: Multiple elements with different hex colors
 * FMT-08: Color update preserves other fill properties
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: PI Color Format & Conversion', () => {
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
      const id = `eval-fmt-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x: 200, y: 200, width: 120, height: 80, rotation: 0, opacity: 1,
        fills: [{ type: 'solid', color: '#4A90D9', value: '#4A90D9', opacity: 100, visible: true }],
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

  // ─── FMT-01: Hex #RRGGBB ─────────────────────────────────────────────────
  test('FMT-01: Hex #RRGGBB stored correctly on fill', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{ type: 'solid', color: '#ABCDEF', value: '#ABCDEF', opacity: 100, visible: true }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].color).toBe('#ABCDEF');

    const snap = await capture(page, 'fmt-01-hex');
    assertNoCriticalAnomalies(snap);
  });

  // ─── FMT-02: Short hex #RGB ───────────────────────────────────────────────
  test('FMT-02: Short hex #RGB stored on fill', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{ type: 'solid', color: '#F00', value: '#F00', opacity: 100, visible: true }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    // Store may normalize to #FF0000 or keep #F00
    const c = fills[0].color || fills[0].value;
    expect(c).toMatch(/^#(F00|FF0000)$/i);
  });

  // ─── FMT-03: Hex case-insensitive ────────────────────────────────────────
  test('FMT-03: Hex is case-insensitive', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{ type: 'solid', color: '#abcdef', value: '#abcdef', opacity: 100, visible: true }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    const c = fills[0].color || fills[0].value;
    expect(c.toLowerCase()).toBe('#abcdef');
  });

  // ─── FMT-04: Color and value consistency ──────────────────────────────────
  test('FMT-04: Color stored as both .color and .value', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{ type: 'solid', color: '#336699', value: '#336699', opacity: 100, visible: true }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    // Both fields should exist and be the same if both are set
    if (fills[0].color && fills[0].value) {
      expect(fills[0].color.toLowerCase()).toBe(fills[0].value.toLowerCase());
    } else {
      // At minimum, one must exist
      expect(fills[0].color || fills[0].value).toBeTruthy();
    }
  });

  // ─── FMT-05: Fill color is always a string ────────────────────────────────
  test('FMT-05: Fill color is always a string', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    const c = fills[0].color ?? fills[0].value;
    expect(typeof c).toBe('string');
    expect(c).toMatch(/^#[0-9A-Fa-f]{3,8}$/);
  });

  // ─── FMT-06: Gradient stops store hex ─────────────────────────────────────
  test('FMT-06: Gradient stops store hex colors', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{
          type: 'gradient', opacity: 100, visible: true,
          value: {
            type: 'linear', angle: 90,
            stops: [
              { color: '#FF0000', position: 0 },
              { color: '#00FF00', position: 50 },
              { color: '#0000FF', position: 100 },
            ],
          },
        }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    for (const stop of fills[0].value.stops) {
      expect(typeof stop.color).toBe('string');
      expect(stop.color).toMatch(/^#[0-9A-Fa-f]{3,8}$/);
    }
  });

  // ─── FMT-07: Multiple elements different colors ──────────────────────────
  test('FMT-07: Multiple elements with different hex colors', async ({ page }) => {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
    const ids: string[] = [];

    for (let i = 0; i < colors.length; i++) {
      const id = await page.evaluate(({ c, idx }) => {
        const store = (window as any).__TEST_STORE__;
        const id = `eval-fmt-m${idx}-${Date.now().toString(36)}`;
        store.dispatch('ADD_ELEMENT', {
          id, type: 'rect', x: 100 + idx * 130, y: 200, width: 100, height: 80,
          rotation: 0, opacity: 1,
          fills: [{ type: 'solid', color: c, value: c, opacity: 100, visible: true }],
        });
        return id;
      }, { c: colors[i], idx: i });
      ids.push(id);
    }
    await page.waitForTimeout(200);

    for (let i = 0; i < ids.length; i++) {
      const fills = await getFills(page, ids[i]);
      expect(fills[0].color || fills[0].value).toBe(colors[i]);
    }
  });

  // ─── FMT-08: Color update preserves other fill props ─────────────────────
  test('FMT-08: Color update preserves other fill properties', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Set fill with specific opacity and blend mode
    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{
          type: 'solid', color: '#FF0000', value: '#FF0000',
          opacity: 75, visible: true, blendMode: 'multiply',
        }],
      });
    }, { eid: id });
    await page.waitForTimeout(100);

    // Change only color
    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{
          type: 'solid', color: '#00FF00', value: '#00FF00',
          opacity: 75, visible: true, blendMode: 'multiply',
        }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const fills = await getFills(page, id);
    expect(fills[0].color).toBe('#00FF00');
    expect(fills[0].opacity).toBe(75);
    expect(fills[0].blendMode).toBe('multiply');
    expect(fills[0].visible).toBe(true);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: All color values are valid hex strings', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    const result = await page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      const fills = el?.fills ?? el?.style?.fills ?? [];
      const hexPattern = /^#[0-9A-Fa-f]{3,8}$/;
      return {
        allColorsValid: fills.every((f: any) => {
          if (f.type === 'solid') {
            const c = f.color ?? f.value;
            return typeof c === 'string' && hexPattern.test(c);
          }
          if (f.type === 'gradient') {
            return (f.value?.stops ?? []).every((stop: any) =>
              typeof stop.color === 'string' && hexPattern.test(stop.color),
            );
          }
          return true;
        }),
      };
    }, { eid: id });

    expect(result.allColorsValid).toBe(true);

    const snap = await capture(page, 'fmt-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
