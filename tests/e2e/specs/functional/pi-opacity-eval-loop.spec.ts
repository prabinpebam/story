/**
 * Eval Loop: Property Inspector — Opacity System (OPA-01 → OPA-08)
 *
 * Comprehensive tests for element-level opacity vs fill-level opacity.
 * Covers element opacity 0–100%, independence from fill opacity,
 * compound opacity effects, and multi-element opacity operations.
 *
 * Taskflows:
 * OPA-01: Element opacity default is 1 (100%)
 * OPA-02: Set element opacity to 50%
 * OPA-03: Set element opacity to 0% (invisible)
 * OPA-04: Element opacity independent of fill opacity
 * OPA-05: Fill opacity independent of element opacity
 * OPA-06: Compound: element 50% + fill 50%
 * OPA-07: Multiple elements with different opacities
 * OPA-08: Restore element opacity back to 1
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: PI Opacity System', () => {
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
      const id = `eval-opa-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x: 200, y: 200, width: 120, height: 80, rotation: 0, opacity: 1,
        fills: [{ type: 'solid', color: '#4A90D9', opacity: 100, visible: true }],
        ...ov,
      });
      store.dispatch('UPDATE_SELECTION', [id]);
      return id;
    }, overrides);
  }

  function getElement(page: import('@playwright/test').Page, id: string) {
    return page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId].elements[eid];
    }, { eid: id });
  }

  // ─── OPA-01: Default element opacity ──────────────────────────────────────
  test('OPA-01: Element opacity default is 1 (100%)', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.opacity).toBe(1);

    const snap = await capture(page, 'opa-01-default');
    assertNoCriticalAnomalies(snap);
  });

  // ─── OPA-02: Set element opacity 50% ─────────────────────────────────────
  test('OPA-02: Set element opacity to 50%', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id: eid, opacity: 0.5 });
    }, { eid: id });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.opacity).toBe(0.5);
  });

  // ─── OPA-03: Set element opacity 0% ──────────────────────────────────────
  test('OPA-03: Set element opacity to 0% (invisible)', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id: eid, opacity: 0 });
    }, { eid: id });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.opacity).toBe(0);
  });

  // ─── OPA-04: Element opacity independent of fill opacity ─────────────────
  test('OPA-04: Element opacity independent of fill opacity', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Set element opacity to 0.75, fill opacity stays 100
    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id: eid, opacity: 0.75 });
    }, { eid: id });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.opacity).toBe(0.75);
    const fills = el.fills ?? el.style?.fills ?? [];
    expect(fills[0].opacity).toBe(100);
  });

  // ─── OPA-05: Fill opacity independent of element opacity ─────────────────
  test('OPA-05: Fill opacity independent of element opacity', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Change fill opacity to 30, element stays 1
    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', {
        id: eid,
        fills: [{ type: 'solid', color: '#4A90D9', opacity: 30, visible: true }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.opacity).toBe(1);
    const fills = el.fills ?? el.style?.fills ?? [];
    expect(fills[0].opacity).toBe(30);
  });

  // ─── OPA-06: Compound opacity ────────────────────────────────────────────
  test('OPA-06: Compound — element 50% + fill 50%', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('UPDATE_ELEMENT', {
        id: eid,
        opacity: 0.5,
        fills: [{ type: 'solid', color: '#4A90D9', opacity: 50, visible: true }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.opacity).toBe(0.5);
    const fills = el.fills ?? el.style?.fills ?? [];
    expect(fills[0].opacity).toBe(50);
    // Effective visual opacity = 0.5 * 0.5 = 0.25 (25%)
  });

  // ─── OPA-07: Multiple elements different opacities ────────────────────────
  test('OPA-07: Multiple elements with different opacities', async ({ page }) => {
    const ids = await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const results: string[] = [];
      for (let i = 0; i < 3; i++) {
        const id = `eval-opa-m${i}-${Date.now().toString(36)}`;
        store.dispatch('ADD_ELEMENT', {
          id, type: 'rect', x: 100 + i * 150, y: 200, width: 100, height: 80,
          rotation: 0, opacity: (i + 1) * 0.25,
          fills: [{ type: 'solid', color: '#4A90D9', opacity: 100, visible: true }],
        });
        results.push(id);
      }
      return results;
    });
    await page.waitForTimeout(200);

    const opacities = [];
    for (const eid of ids) {
      const el = await getElement(page, eid);
      opacities.push(el.opacity);
    }

    expect(opacities[0]).toBe(0.25);
    expect(opacities[1]).toBe(0.5);
    expect(opacities[2]).toBe(0.75);
  });

  // ─── OPA-08: Restore element opacity ─────────────────────────────────────
  test('OPA-08: Restore element opacity back to 1', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Set to 0.3
    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id: eid, opacity: 0.3 });
    }, { eid: id });
    await page.waitForTimeout(100);

    // Restore to 1
    await page.evaluate(({ eid }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id: eid, opacity: 1 });
    }, { eid: id });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.opacity).toBe(1);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Opacity operations maintain valid ranges', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ eid }) => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('UPDATE_ELEMENT', {
        id: eid, opacity: 0.65,
        fills: [{ type: 'solid', color: '#4A90D9', opacity: 42, visible: true }],
      });
    }, { eid: id });
    await page.waitForTimeout(200);

    const result = await page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      const fills = el?.fills ?? el?.style?.fills ?? [];
      return {
        elOpacityInRange: el.opacity >= 0 && el.opacity <= 1,
        fillOpacityInRange: fills.every((f: any) => f.opacity >= 0 && f.opacity <= 100),
        elOpacityIsNumber: typeof el.opacity === 'number',
        fillOpacityIsNumber: fills.every((f: any) => typeof f.opacity === 'number'),
      };
    }, { eid: id });

    expect(result.elOpacityInRange).toBe(true);
    expect(result.fillOpacityInRange).toBe(true);
    expect(result.elOpacityIsNumber).toBe(true);
    expect(result.fillOpacityIsNumber).toBe(true);

    const snap = await capture(page, 'opa-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
