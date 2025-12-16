import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('Clipboard: paste SVG from text/html (editable shapes flag)', () => {
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

  test('pasting HTML containing an <svg><rect/></svg> creates editable shape elements (not svg element)', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect x="0" y="0" width="20" height="10" fill="#ff0000" /></svg>';
    const html = `<div data-from="test">${svg}</div>`;

    await page.evaluate(async ({ html }) => {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' })
      });
      await navigator.clipboard.write([item]);
    }, { html });

    await page.keyboard.down('Control');
    await page.keyboard.press('v');
    await page.keyboard.up('Control');

    await expect.poll(async () => {
      const after = await getState();
      const count = Object.keys(after.slides[slideId]?.elements || {}).length;
      return count;
    }, { timeout: 4000 }).toBeGreaterThan(beforeIds.size);

    const after = await getState();
    const afterElements = after.slides[slideId]?.elements || {};

    const newElements = Object.entries(afterElements)
      .filter(([id]) => !beforeIds.has(id))
      .map(([, el]: any) => el);

    expect(newElements.length).toBeGreaterThan(0);

    const newSvgs = newElements.filter((el: any) => el && el.type === 'svg');
    expect(newSvgs.length).toBe(0);

    const newShapes = newElements.filter((el: any) => el && el.type === 'shape');
    expect(newShapes.length).toBeGreaterThan(0);

    const rects = newShapes.filter((el: any) => el.shapeKind === 'rectangle' || el.shape === 'rectangle');
    expect(rects.length).toBeGreaterThan(0);
  });

  test('pasting HTML containing an <svg> with <linearGradient> imports a gradient fill on the shape', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="10">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ff0000" />
            <stop offset="100%" stop-color="#0000ff" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="20" height="10" fill="url(#g)" />
      </svg>
    `;
    const html = `<div data-from="test">${svg}</div>`;

    await page.evaluate(async ({ html }) => {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' })
      });
      await navigator.clipboard.write([item]);
    }, { html });

    await page.keyboard.down('Control');
    await page.keyboard.press('v');
    await page.keyboard.up('Control');

    await expect.poll(async () => {
      const after = await getState();
      const count = Object.keys(after.slides[slideId]?.elements || {}).length;
      return count;
    }, { timeout: 4000 }).toBeGreaterThan(beforeIds.size);

    const after = await getState();
    const afterElements = after.slides[slideId]?.elements || {};

    const newElements = Object.entries(afterElements)
      .filter(([id]) => !beforeIds.has(id))
      .map(([, el]: any) => el);

    const newShapes = newElements.filter((el: any) => el && el.type === 'shape');
    expect(newShapes.length).toBeGreaterThan(0);

    const anyGradientFill = newShapes.some((el: any) => el?.style?.fills?.[0]?.type === 'gradient');
    expect(anyGradientFill).toBe(true);
  });

  test('pasting HTML containing an <svg><path/></svg> imports a vector shape', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><path d="M0 0 L20 0 L20 10 Z" fill="#00ff00" /></svg>';
    const html = `<div data-from="test">${svg}</div>`;

    await page.evaluate(async ({ html }) => {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' })
      });
      await navigator.clipboard.write([item]);
    }, { html });

    await page.keyboard.down('Control');
    await page.keyboard.press('v');
    await page.keyboard.up('Control');

    await expect.poll(async () => {
      const after = await getState();
      const count = Object.keys(after.slides[slideId]?.elements || {}).length;
      return count;
    }, { timeout: 4000 }).toBeGreaterThan(beforeIds.size);

    const after = await getState();
    const afterElements = after.slides[slideId]?.elements || {};

    const newElements = Object.entries(afterElements)
      .filter(([id]) => !beforeIds.has(id))
      .map(([, el]: any) => el);

    const newShapes = newElements.filter((el: any) => el && el.type === 'shape');
    expect(newShapes.length).toBeGreaterThan(0);

    const anyVectorShape = newShapes.some((el: any) => el?.shapeKind === 'vector' && Array.isArray(el?.paths) && el.paths.length > 0);
    expect(anyVectorShape).toBe(true);
  });
});
