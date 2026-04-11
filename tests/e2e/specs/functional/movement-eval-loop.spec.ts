/**
 * Eval Loop: Element Movement & Dragging (MOV-01 → MOV-11)
 */

import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture,
  bracket,
  waitForCanvasManager,
  assertNoCriticalAnomalies,
  assertSelection,
  Snapshot,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Element Movement & Dragging', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  /** Seed a single rectangle and return its ID */
  async function seedRect(page: import('@playwright/test').Page, x = 300, y = 300) {
    return page.evaluate(({ x, y }) => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-mv-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x, y, width: 150, height: 100,
        rotation: 0, opacity: 1, name: 'Eval Move Rect',
        fills: [{ type: 'solid', color: '#4A90D9' }],
      });
      store.dispatch('UPDATE_SELECTION', [id]);
      return id;
    }, { x, y });
  }

  /** Get element position from store */
  async function getElementPos(page: import('@playwright/test').Page, id: string) {
    return page.evaluate(({ id }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const slide = s.slides[s.editor.activeSlideId];
      const el = slide.elements[id];
      return el ? { x: el.x, y: el.y } : null;
    }, { id });
  }

  /** Convert world coords to screen coords */
  async function worldToScreen(page: import('@playwright/test').Page, wx: number, wy: number) {
    return page.evaluate(({ wx, wy }) => {
      const s = (window as any).__TEST_STORE__.getState();
      const { zoom, pan } = s.editor;
      const c = document.getElementById('canvas-container');
      if (!c) return null;
      const r = c.getBoundingClientRect();
      return { x: r.left + wx * zoom + pan.x, y: r.top + wy * zoom + pan.y };
    }, { wx, wy });
  }

  // ─── MOV-01: Drag element ─────────────────────────────────────────────────
  test('MOV-01: Drag element to new position', async ({ page }) => {
    const id = await seedRect(page, 300, 300);
    await page.waitForTimeout(200);

    const posBefore = await getElementPos(page, id);
    expect(posBefore).not.toBeNull();

    // Click on element center then drag
    const startScreen = await worldToScreen(page, 375, 350);
    if (!startScreen) throw new Error('No screen coords');

    await page.mouse.move(startScreen.x, startScreen.y);
    await page.mouse.down();
    const endScreen = await worldToScreen(page, 475, 450);
    if (!endScreen) throw new Error('No end coords');
    await page.mouse.move(endScreen.x, endScreen.y, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const posAfter = await getElementPos(page, id);
    expect(posAfter).not.toBeNull();
    expect(posAfter!.x).toBeGreaterThan(posBefore!.x + 50);
    expect(posAfter!.y).toBeGreaterThan(posBefore!.y + 50);

    const snap = await capture(page, 'after-drag');
    assertNoCriticalAnomalies(snap);
  });

  // ─── MOV-02: Nudge 1px ────────────────────────────────────────────────────
  test('MOV-02: Nudge 1px with arrow keys', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    const posBefore = await getElementPos(page, id);
    expect(posBefore).not.toBeNull();

    // Ensure canvas has focus by clicking on the element
    const screen = await worldToScreen(page, 375, 350);
    if (screen) await page.mouse.click(screen.x, screen.y);
    await page.waitForTimeout(100);

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    const posAfter = await getElementPos(page, id);
    expect(posAfter!.x).toBe(posBefore!.x + 1);
    expect(posAfter!.y).toBe(posBefore!.y);
  });

  // ─── MOV-03: Nudge 10px ───────────────────────────────────────────────────
  test('MOV-03: Nudge 10px with Shift+Arrow', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    const posBefore = await getElementPos(page, id);

    const screen = await worldToScreen(page, 375, 350);
    if (screen) await page.mouse.click(screen.x, screen.y);
    await page.waitForTimeout(100);

    await page.keyboard.press('Shift+ArrowDown');
    await page.waitForTimeout(100);

    const posAfter = await getElementPos(page, id);
    expect(posAfter!.y).toBe(posBefore!.y + 10);
    expect(posAfter!.x).toBe(posBefore!.x);
  });

  // ─── MOV-04: Multi-element drag ───────────────────────────────────────────
  test('MOV-04: Multi-element drag maintains relative positions', async ({ page }) => {
    // Seed two elements
    const id1 = await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-mv1-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x: 200, y: 200, width: 100, height: 80,
        rotation: 0, opacity: 1, name: 'Multi A',
        fills: [{ type: 'solid', color: '#4A90D9' }],
      });
      return id;
    });
    const id2 = await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-mv2-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', {
        id, type: 'rect', x: 400, y: 300, width: 100, height: 80,
        rotation: 0, opacity: 1, name: 'Multi B',
        fills: [{ type: 'solid', color: '#D94A4A' }],
      });
      return id;
    });

    // Select both
    await page.evaluate(({ id1, id2 }) => {
      (window as any).__TEST_STORE__.dispatch('UPDATE_SELECTION', [id1, id2]);
    }, { id1, id2 });
    await page.waitForTimeout(200);

    const beforeA = await getElementPos(page, id1);
    const beforeB = await getElementPos(page, id2);
    const relativeX = beforeB!.x - beforeA!.x;
    const relativeY = beforeB!.y - beforeA!.y;

    // Nudge both elements (already selected via store)
    // Focus the interaction canvas so keyboard events are captured
    await page.locator('#interaction-canvas').focus();
    await page.waitForTimeout(100);

    await page.keyboard.press('Shift+ArrowRight');
    await page.waitForTimeout(100);

    const afterA = await getElementPos(page, id1);
    const afterB = await getElementPos(page, id2);
    // Relative positions should be preserved
    expect(afterB!.x - afterA!.x).toBe(relativeX);
    expect(afterB!.y - afterA!.y).toBe(relativeY);
    // Both should have moved
    expect(afterA!.x).toBe(beforeA!.x + 10);
    expect(afterB!.x).toBe(beforeB!.x + 10);

    const snap = await capture(page, 'after-multi-nudge');
    assertNoCriticalAnomalies(snap);
  });

  // ─── MOV-07: Drop finalizes position ──────────────────────────────────────
  test('MOV-07: Drop on target commits final position', async ({ page }) => {
    const id = await seedRect(page, 300, 300);
    await page.waitForTimeout(200);

    const startScreen = await worldToScreen(page, 375, 350);
    if (!startScreen) throw new Error('No start coords');
    const endScreen = await worldToScreen(page, 475, 450);
    if (!endScreen) throw new Error('No end coords');

    await page.mouse.move(startScreen.x, startScreen.y);
    await page.mouse.down();
    await page.mouse.move(endScreen.x, endScreen.y, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const posAfter = await getElementPos(page, id);
    expect(posAfter!.x).toBeGreaterThan(350);
    expect(posAfter!.y).toBeGreaterThan(350);

    const snap = await capture(page, 'after-drop');
    assertNoCriticalAnomalies(snap);
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Store↔DOM sync after move operations', async ({ page }) => {
    const id = await seedRect(page);
    await page.waitForTimeout(200);

    // Nudge in each direction
    const screen = await worldToScreen(page, 375, 350);
    if (screen) await page.mouse.click(screen.x, screen.y);
    await page.waitForTimeout(100);

    for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
      await page.keyboard.press(key);
      await page.waitForTimeout(50);
      const snap = await capture(page, `after-${key}`);
      assertNoCriticalAnomalies(snap);
    }
  });
});
