import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('Clipboard: paste SVG from text/html', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('pasting HTML containing an <svg> creates an svg element', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeCount = Object.keys(before.slides[slideId]?.elements || {}).length;

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="20" height="10" fill="#ff0000" /></svg>';
    const html = `<div data-from="test">${svg}</div>`;

    // Seed clipboard with HTML payload (Chromium supports ClipboardItem).
    await page.evaluate(async ({ html }) => {
      // @ts-expect-error - ClipboardItem is available in browser context.
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' })
      });
      await navigator.clipboard.write([item]);
    }, { html });

    // Trigger paste (CanvasManager listens for Ctrl+V).
    await page.keyboard.down('Control');
    await page.keyboard.press('v');
    await page.keyboard.up('Control');

    await expect.poll(async () => {
      const after = await getState();
      const count = Object.keys(after.slides[slideId]?.elements || {}).length;
      return count;
    }, { timeout: 4000 }).toBeGreaterThan(beforeCount);

    const after = await getState();
    const elements = after.slides[slideId]?.elements || {};
    const svgs = Object.values(elements).filter((el: any) => el && el.type === 'svg');

    expect(svgs.length).toBeGreaterThan(0);

    const pasted = svgs[svgs.length - 1] as any;
    expect(typeof pasted.svg).toBe('string');
    expect(pasted.svg).toMatch(/<svg\b/i);
    expect(typeof pasted.svgHash).toBe('string');
    expect(pasted.svgHash.length).toBeGreaterThan(10);
  });
});
