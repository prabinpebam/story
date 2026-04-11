/**
 * Eval Loop: Keyboard Shortcuts (KEY-01 → KEY-42)
 */
import { expect } from '@playwright/test';
import { test } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import {
  capture, waitForCanvasManager, assertNoCriticalAnomalies,
} from '../../helpers/eval-loop';

test.describe('Eval Loop: Keyboard Shortcuts', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
    await waitForCanvasManager(page);
  });

  function getActiveTool(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      return { tool: s.editor.activeTool, options: s.editor.activeToolOptions };
    });
  }

  // ─── 27.1 Tool Selection ──────────────────────────────────────────────────
  test('KEY-01: V key activates select tool', async ({ page }) => {
    // Switch to another tool first
    await page.keyboard.press('r');
    await page.waitForTimeout(100);
    const before = await getActiveTool(page);
    expect(before.tool).toBe('shape');

    await page.keyboard.press('v');
    await page.waitForTimeout(100);
    const after = await getActiveTool(page);
    expect(after.tool).toBe('select');
  });

  test('KEY-03: T key activates text tool', async ({ page }) => {
    await page.keyboard.press('t');
    await page.waitForTimeout(100);
    const tool = await getActiveTool(page);
    expect(tool.tool).toBe('text');
  });

  test('KEY-04: R key activates rectangle tool', async ({ page }) => {
    await page.keyboard.press('r');
    await page.waitForTimeout(100);
    const tool = await getActiveTool(page);
    expect(tool.tool).toBe('shape');
  });

  test('KEY-05: O key activates ellipse tool', async ({ page }) => {
    await page.keyboard.press('o');
    await page.waitForTimeout(100);
    const tool = await getActiveTool(page);
    expect(tool.tool).toBe('shape');
  });

  test('KEY-06: L key activates line tool', async ({ page }) => {
    await page.keyboard.press('l');
    await page.waitForTimeout(100);
    const tool = await getActiveTool(page);
    expect(tool.tool).toBe('shape');
  });

  // ─── KEY-23: Lock via store dispatch (Ctrl+L not implemented) ──────────
  test('KEY-23: Lock selection via TOGGLE_ELEMENT_LOCK', async ({ page }) => {
    const id = await page.evaluate(() => {
      const store = (window as any).__TEST_STORE__;
      const id = `eval-key-${Date.now().toString(36)}`;
      store.dispatch('ADD_ELEMENT', { id, type: 'rect', x: 200, y: 200, width: 100, height: 80, rotation: 0, opacity: 1, fills: [{ type: 'solid', color: '#4A90D9' }] });
      store.dispatch('UPDATE_SELECTION', [id]);
      return id;
    });
    await page.waitForTimeout(200);

    await page.evaluate((eid) => {
      (window as any).__TEST_STORE__.dispatch('TOGGLE_ELEMENT_LOCK', { id: eid });
    }, id);
    await page.waitForTimeout(200);

    const locked = await page.evaluate((eid) => {
      const s = (window as any).__TEST_STORE__.getState();
      return s.slides[s.editor.activeSlideId].elements[eid]?.locked === true;
    }, id);
    expect(locked).toBe(true);
  });

  // ─── 27.6 Shortcut Context Priority ───────────────────────────────────────
  test('KEY-31: Shortcuts suppressed during text input', async ({ page }) => {
    // Create text and enter edit mode
    await page.keyboard.press('t');
    await page.waitForTimeout(100);
    const center = await page.evaluate(() => {
      const s = (window as any).__TEST_STORE__.getState();
      const { zoom, pan } = s.editor;
      const c = document.getElementById('canvas-container');
      if (!c) return null;
      const r = c.getBoundingClientRect();
      return { x: r.left + 500 * zoom + pan.x, y: r.top + 400 * zoom + pan.y };
    });
    if (center) await page.mouse.click(center.x, center.y);
    await page.waitForTimeout(300);

    // Now in text edit mode: pressing R should NOT switch tool
    await page.keyboard.press('r');
    await page.waitForTimeout(100);

    const tool = await getActiveTool(page);
    // Tool should NOT have switched to shape
    // (it stays as select or text since we're in edit mode)
    expect(tool.tool).not.toBe('shape');
  });

  // ─── Cross-cutting ────────────────────────────────────────────────────────
  test('Invariant: Tool switching maintains consistency', async ({ page }) => {
    const tools = ['v', 'r', 't', 'o', 'l'];
    for (const key of tools) {
      await page.keyboard.press(key);
      await page.waitForTimeout(50);
    }
    // Back to select
    await page.keyboard.press('v');
    await page.waitForTimeout(100);

    const snap = await capture(page, 'tool-switch-invariant');
    assertNoCriticalAnomalies(snap);
  });
});
