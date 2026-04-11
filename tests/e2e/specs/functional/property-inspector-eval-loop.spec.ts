/**
 * Eval Loop: Property Inspector (PI-01 → PI-36)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Property Inspector', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  async function seedRect(page: import('@playwright/test').Page, x = 300, y = 300) {
    return page.evaluate(({ x, y }) => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-pi-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x, y, width: 200, height: 150,
        rotation: 0, opacity: 1,
        fills: [{ type: 'solid', color: '#4A90D9' }],
      });
      store.dispatch('UPDATE_SELECTION', [id]);
      return id;
    }, { x, y });
  }

  async function seedText(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-pi-txt-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'text', x: 300, y: 300, width: 300, height: 60,
        rotation: 0, opacity: 1, content: '<p>PI test text</p>',
      });
      store.dispatch('UPDATE_SELECTION', [id]);
      return id;
    });
  }

  function getElement(page: import('@playwright/test').Page, id: string) {
    return page.evaluate((eid) => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      return slide.elements[eid];
    }, id);
  }

  // ─── PI-01: PI opens on selection ─────────────────────────────────────────
  test('PI-01: Property inspector visible when element selected', async ({ page }) => {
    await seedRect(page);
    await page.waitForTimeout(300);

    const piVisible = await page.evaluate(() => {
      const pi = document.querySelector('.property-inspector');
      return pi ? getComputedStyle(pi).display !== 'none' : false;
    });
    expect(piVisible).toBe(true);

    const snap = await capture(page, 'pi-visible');
    assertNoCriticalAnomalies(snap);
  });

  // ─── PI-03: Position X via store ──────────────────────────────────────────
  test('PI-03: Update position X via store dispatch', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, x: 500 });
    }, { id });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.x).toBe(500);

    const snap = await capture(page, 'after-x-update');
    assertNoCriticalAnomalies(snap);
  });

  // ─── PI-04: Position Y via store ──────────────────────────────────────────
  test('PI-04: Update position Y via store dispatch', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, y: 500 });
    }, { id });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.y).toBe(500);
  });

  // ─── PI-05/06: Width and Height ───────────────────────────────────────────
  test('PI-05: Update width via store dispatch', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, width: 400 });
    }, { id });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.width).toBe(400);
  });

  test('PI-06: Update height via store dispatch', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, height: 400 });
    }, { id });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.height).toBe(400);
  });

  // ─── PI-07: Rotation ──────────────────────────────────────────────────────
  test('PI-07: Update rotation via store dispatch', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, rotation: 45 });
    }, { id });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.rotation).toBe(45);
  });

  // ─── PI-10: Opacity ───────────────────────────────────────────────────────
  test('PI-10: Update opacity via store dispatch', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, opacity: 0.5 });
    }, { id });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.opacity).toBeCloseTo(0.5, 1);

    const snap = await capture(page, 'after-opacity');
    assertNoCriticalAnomalies(snap);
  });

  // ─── PI-15: Corner radius ─────────────────────────────────────────────────
  test('PI-15: Update corner radius via store dispatch', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, borderRadius: 20 });
    }, { id });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.borderRadius).toBe(20);
  });

  // ─── PI-32: Multi-element update ──────────────────────────────────────────
  test('PI-32: Multi-element property update', async ({ page }) => {
    const ids = await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const s = Date.now().toString(36);
      const a = `pi-a-${s}`, b = `pi-b-${s}`;
      store.dispatch('ADD_ELEMENT', { id: a, type: 'rect', x: 100, y: 100, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#E74C3C' }] });
      store.dispatch('ADD_ELEMENT', { id: b, type: 'rect', x: 200, y: 200, width: 80, height: 60, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#3498DB' }] });
      store.dispatch('UPDATE_SELECTION', [a, b]);
      return { a, b };
    });
    await page.waitForTimeout(200);

    // Update opacity on both
    await page.evaluate(({ a, b }) => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('UPDATE_ELEMENT', { id: a, opacity: 0.3 });
      store.dispatch('UPDATE_ELEMENT', { id: b, opacity: 0.3 });
    }, ids);
    await page.waitForTimeout(200);

    const elA = await getElement(page, ids.a);
    const elB = await getElement(page, ids.b);
    expect(elA.opacity).toBeCloseTo(0.3, 1);
    expect(elB.opacity).toBeCloseTo(0.3, 1);
  });

  // ─── PI-33: PI-to-canvas sync ─────────────────────────────────────────────
  test('PI-33: Store change reflects in DOM', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    await page.evaluate(({ id }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id, x: 600, y: 400 });
    }, { id });
    await page.waitForTimeout(300);

    const snap = await capture(page, 'store-to-dom-sync');
    assertNoCriticalAnomalies(snap);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: PI updates maintain store-DOM consistency', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Multiple property changes
    await page.evaluate(({ id }) => {
      const store = (window as any).__TEST_STORE__;
      store.dispatch('UPDATE_ELEMENT', { id, x: 400, y: 250, width: 300, rotation: 30, opacity: 0.7 });
    }, { id });
    await page.waitForTimeout(300);

    const snap = await capture(page, 'pi-multi-update');
    assertNoCriticalAnomalies(snap);
  });
});
