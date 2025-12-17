import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import fs from 'node:fs';
import path from 'node:path';

const STRESS_SVG_PATH = path.resolve(process.cwd(), 'tests/fixtures/shapes/stress/editable-svg-grid.svg');

function loadStressSvg() {
  return fs.readFileSync(STRESS_SVG_PATH, 'utf8');
}

test.describe('Frontend Performance: editable SVG paste (smoke)', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    // Enable editable SVG → shapes import.
    await page.evaluate(() => {
      // @ts-expect-error - test-only flag.
      window.__FEATURE_FLAGS__ = {
        // @ts-expect-error - test-only flag.
        ...(window.__FEATURE_FLAGS__ || {}),
        ENABLE_EDITABLE_SVG_PASTE: true
      };
    });
  });

  test('PERF06: Repeated paste/undo cycles do not hang or grow unbounded', async ({ page, getState, dispatchAction }) => {
    const svg = loadStressSvg();
    const html = `<div data-from="perf">${svg}</div>`;

    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const baseCount = Object.keys(before.slides[slideId]?.elements || {}).length;

    await page.evaluate(async ({ html }) => {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' })
      });
      await navigator.clipboard.write([item]);
    }, { html });

    // Best-effort verify clipboard write succeeded (helps avoid silent failures from OS limits).
    // Note: readText() can be empty when only text/html is present, so we inspect clipboard item types.
    const hasHtml = await page.evaluate(async () => {
      try {
        if (!navigator.clipboard.read) return null;
        const items = await navigator.clipboard.read();
        return items.some((it) => Array.isArray(it.types) && it.types.includes('text/html'));
      } catch {
        return null;
      }
    });
    if (hasHtml !== null) {
      expect(hasHtml).toBe(true);
    }

    // Ensure the editor (not an input) has focus so the global paste handler runs.
    await editor.setActiveTool('select');
    await page.locator('#canvas-container').click({ position: { x: 10, y: 10 } });

    const readHeap = async () => {
      return await page.evaluate(() => {
        // Chromium-only; null on other engines.
        const m = (performance as any).memory;
        return (m && typeof m.usedJSHeapSize === 'number') ? m.usedJSHeapSize : null;
      });
    };

    const heap0 = await readHeap();

    const cycles = 5;

    const t0 = Date.now();

    for (let i = 0; i < cycles; i++) {
      // Paste
      await page.keyboard.down('Control');
      await page.keyboard.press('v');
      await page.keyboard.up('Control');

      await expect.poll(async () => {
        const s = await getState();
        return Object.keys(s.slides[slideId]?.elements || {}).length;
      }, { timeout: 8000 }).toBeGreaterThan(baseCount);

      // Undo
      await dispatchAction('UNDO');

      await expect.poll(async () => {
        const s = await getState();
        return Object.keys(s.slides[slideId]?.elements || {}).length;
      }, { timeout: 8000 }).toBe(baseCount);
    }

    const t1 = Date.now();
    const totalMs = t1 - t0;
    console.log(`Paste+Undo (${cycles} cycles): ${totalMs}ms`);

    // Wide threshold; this is a stability gate, not a perf target.
    expect(totalMs).toBeLessThan(45000);

    const heap1 = await readHeap();
    if (heap0 !== null && heap1 !== null) {
      const deltaMb = (heap1 - heap0) / (1024 * 1024);
      console.log(`JS heap delta: ${deltaMb.toFixed(1)}MB`);
      expect(deltaMb).toBeLessThan(200);
    }
  });
});
