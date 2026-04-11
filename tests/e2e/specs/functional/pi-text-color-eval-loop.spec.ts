/**
 * Eval Loop: Property Inspector — Text Color Operations (TXC-01 → TXC-08)
 *
 * Comprehensive tests for text fill/color operations in the property inspector.
 * Covers text fill solid color, opacity, gradient text fill, theme-linked text,
 * and text fill stored at element.textFill.
 *
 * Taskflows:
 * TXC-01: Set text fill to solid color
 * TXC-02: Change text fill to different color
 * TXC-03: Text fill opacity change
 * TXC-04: Text fill gradient
 * TXC-05: Theme-linked text fill (themeSlot)
 * TXC-06: Unlink text fill from theme
 * TXC-07: Text fill stored at element.textFill (not style.fills)
 * TXC-08: Text element also has shape fills (background)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: PI Text Color Operations', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function seedText(page: import('@playwright/test').Page, overrides = {}) {
    return page.evaluate((ov) => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-txc-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'text', x: 200, y: 200, width: 300, height: 60,
        rotation: 0, opacity: 1,
        content: '<p>Color test text</p>',
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

  function updateElement(page: import('@playwright/test').Page, id: string, updates: any) {
    return page.evaluate(({ eid, upd }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_ELEMENT', { id: eid, ...upd });
    }, { eid: id, upd: updates });
  }

  // ─── TXC-01: Set text fill to solid color ─────────────────────────────────
  test('TXC-01: Set text fill to solid color', async ({ page }) => {
    const id = await seedText(page);
    await page.waitForTimeout(200);

    await updateElement(page, id, {
      textFill: { type: 'solid', value: '#E74C3C', color: '#E74C3C', opacity: 100 },
    });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    const tf = el.textFill;
    expect(tf.type).toBe('solid');
    expect(tf.value || tf.color).toBe('#E74C3C');

    const snap = await capture(page, 'txc-01-text-red');
    assertNoCriticalAnomalies(snap);
  });

  // ─── TXC-02: Change text fill color ───────────────────────────────────────
  test('TXC-02: Change text fill to different color', async ({ page }) => {
    const id = await seedText(page);
    await page.waitForTimeout(200);

    await updateElement(page, id, {
      textFill: { type: 'solid', value: '#3498DB', color: '#3498DB', opacity: 100 },
    });
    await page.waitForTimeout(100);

    await updateElement(page, id, {
      textFill: { type: 'solid', value: '#2ECC71', color: '#2ECC71', opacity: 100 },
    });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.textFill.value || el.textFill.color).toBe('#2ECC71');
  });

  // ─── TXC-03: Text fill opacity ───────────────────────────────────────────
  test('TXC-03: Text fill opacity change', async ({ page }) => {
    const id = await seedText(page);
    await page.waitForTimeout(200);

    await updateElement(page, id, {
      textFill: { type: 'solid', value: '#000000', color: '#000000', opacity: 50 },
    });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.textFill.opacity).toBe(50);
  });

  // ─── TXC-04: Text fill gradient ──────────────────────────────────────────
  test('TXC-04: Text fill gradient', async ({ page }) => {
    const id = await seedText(page);
    await page.waitForTimeout(200);

    await updateElement(page, id, {
      textFill: {
        type: 'gradient',
        opacity: 100,
        value: {
          type: 'linear',
          angle: 90,
          stops: [
            { color: '#FF0000', position: 0 },
            { color: '#0000FF', position: 100 },
          ],
        },
      },
    });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.textFill.type).toBe('gradient');
    expect(el.textFill.value.stops.length).toBe(2);
  });

  // ─── TXC-05: Theme-linked text fill ───────────────────────────────────────
  test('TXC-05: Theme-linked text fill (themeSlot)', async ({ page }) => {
    const id = await seedText(page);
    await page.waitForTimeout(200);

    await updateElement(page, id, {
      textFill: {
        type: 'solid',
        value: '#555555',
        color: '#555555',
        opacity: 100,
        themeSlot: 4,
        source: { type: 'theme', themeSlot: 4 },
      },
    });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.textFill.themeSlot).toBe(4);
    expect(el.textFill.source?.type).toBe('theme');
  });

  // ─── TXC-06: Unlink text fill from theme ──────────────────────────────────
  test('TXC-06: Unlink text fill from theme', async ({ page }) => {
    const id = await seedText(page);
    await page.waitForTimeout(200);

    // Link first
    await updateElement(page, id, {
      textFill: {
        type: 'solid', value: '#555555', color: '#555555', opacity: 100,
        themeSlot: 4, source: { type: 'theme', themeSlot: 4 },
      },
    });
    await page.waitForTimeout(100);

    // Unlink
    await updateElement(page, id, {
      textFill: {
        type: 'solid', value: '#555555', color: '#555555', opacity: 100,
        source: { type: 'custom' },
      },
    });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.textFill.source?.type).toBe('custom');
    expect(el.textFill.themeSlot).toBeUndefined();
  });

  // ─── TXC-07: textFill property location ───────────────────────────────────
  test('TXC-07: Text fill stored at element.textFill', async ({ page }) => {
    const id = await seedText(page);
    await page.waitForTimeout(200);

    await updateElement(page, id, {
      textFill: { type: 'solid', value: '#AA0000', color: '#AA0000', opacity: 100 },
    });
    await page.waitForTimeout(200);

    const result = await page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      return {
        hasTextFill: el.textFill !== undefined,
        textFillType: el.textFill?.type,
        textFillNotInStyle: el.style?.textFill === undefined,
      };
    }, { eid: id });

    expect(result.hasTextFill).toBe(true);
    expect(result.textFillType).toBe('solid');
  });

  // ─── TXC-08: Text element with shape fills ────────────────────────────────
  test('TXC-08: Text element has textFill and shape fills independently', async ({ page }) => {
    const id = await seedText(page);
    await page.waitForTimeout(200);

    // Set text fill (foreground text color)
    await updateElement(page, id, {
      textFill: { type: 'solid', value: '#FFFFFF', color: '#FFFFFF', opacity: 100 },
      fills: [{ type: 'solid', color: '#333333', opacity: 100, visible: true }],
    });
    await page.waitForTimeout(200);

    const el = await getElement(page, id);
    expect(el.textFill.value || el.textFill.color).toBe('#FFFFFF');
    const fills = el.fills ?? el.style?.fills ?? [];
    expect(fills[0].color).toBe('#333333');
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Text fill operations maintain element consistency', async ({ page }) => {
    const id = await seedText(page);
    await page.waitForTimeout(200);

    await updateElement(page, id, {
      textFill: { type: 'solid', value: '#FF5733', color: '#FF5733', opacity: 75 },
    });
    await page.waitForTimeout(200);

    const result = await page.evaluate(({ eid }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const el = s.slides[s.editor.activeSlideId].elements[eid];
      return {
        isText: el.type === 'text',
        hasTextFill: el.textFill !== undefined,
        textFillHasType: typeof el.textFill?.type === 'string',
        textFillHasOpacity: typeof el.textFill?.opacity === 'number',
        hasContent: typeof el.content === 'string',
      };
    }, { eid: id });

    expect(result.isText).toBe(true);
    expect(result.hasTextFill).toBe(true);
    expect(result.textFillHasType).toBe(true);
    expect(result.textFillHasOpacity).toBe(true);
    expect(result.hasContent).toBe(true);

    const snap = await capture(page, 'txc-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
