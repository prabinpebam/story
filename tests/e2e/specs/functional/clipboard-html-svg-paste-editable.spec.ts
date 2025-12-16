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

  test('pasting HTML containing an <svg> with <linearGradient href="#..."> imports a gradient fill on the shape', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="10">
        <defs>
          <linearGradient id="base" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ff0000" />
            <stop offset="100%" stop-color="#0000ff" />
          </linearGradient>
          <linearGradient id="ref" href="#base" />
        </defs>
        <rect x="0" y="0" width="20" height="10" fill="url(#ref)" />
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

  test('pasting HTML containing an <svg> with a cyclic <linearGradient href> falls back to a solid fill (deterministic)', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="10">
        <defs>
          <linearGradient id="a" href="#b" />
          <linearGradient id="b" href="#a">
            <stop offset="0%" stop-color="#ff0000" />
            <stop offset="100%" stop-color="#0000ff" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="20" height="10" fill="url(#a)" />
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

    const anySolidFallback = newShapes.some((el: any) => el?.style?.fills?.[0]?.type === 'solid');
    expect(anySolidFallback).toBe(true);
  });

  test('pasting HTML containing an <svg> with <radialGradient> imports a gradient fill (supported subset)', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="10">
        <defs>
          <radialGradient id="g" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ff0000" />
            <stop offset="100%" stop-color="#0000ff" />
          </radialGradient>
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

    const anyRadialGradientFill = newShapes.some((el: any) => {
      const f0 = el?.style?.fills?.[0];
      return f0?.type === 'gradient' && typeof f0?.value === 'string' && /radial-gradient\(/i.test(f0.value);
    });
    expect(anyRadialGradientFill).toBe(true);
  });

  test('pasting HTML containing an <svg> with unsupported <radialGradient> (rotate) falls back to solid fill (deterministic)', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="10">
        <defs>
          <radialGradient id="g" gradientTransform="rotate(45)">
            <stop offset="0%" stop-color="#ff0000" />
            <stop offset="100%" stop-color="#0000ff" />
          </radialGradient>
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

    const shape = newShapes[0];
    expect(shape?.style?.fills?.[0]?.type).toBe('solid');
    expect(shape?.style?.fills?.[0]?.value).toBe('#808080');
  });

  test('pasting HTML containing an <svg> with <pattern> paint falls back to solid fill (deterministic)', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="10">
        <defs>
          <pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect x="0" y="0" width="10" height="10" fill="#ff0000" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="20" height="10" fill="url(#p)" />
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

    const shape = newShapes[0];
    expect(shape?.style?.fills?.[0]?.type).toBe('solid');
    expect(shape?.style?.fills?.[0]?.value).toBe('#808080');
  });

  test('pasting HTML containing an <svg> with supported <pattern> imports an image fill (data URI)', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="10">
        <defs>
          <pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="10" height="10" fill="#ff0000" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="20" height="10" fill="url(#p)" />
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

    const anyPatternImageFill = newShapes.some((el: any) => {
      const f0 = el?.style?.fills?.[0];
      return f0?.type === 'image' && typeof f0?.value === 'string' && /^data:image\/svg\+xml,/.test(f0.value);
    });
    expect(anyPatternImageFill).toBe(true);
  });

  test('pasting HTML containing an <svg> with supported <pattern href> inheritance imports an image fill', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="10">
        <defs>
          <pattern id="base" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="10" height="10" fill="#ff0000" />
          </pattern>
          <pattern id="ref" href="#base" />
        </defs>
        <rect x="0" y="0" width="20" height="10" fill="url(#ref)" />
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

    const found = newShapes.find((el: any) => {
      const f0 = el?.style?.fills?.[0];
      return f0?.type === 'image' && f0?.repeat === 'repeat' && f0?.tileWidth === 10 && f0?.tileHeight === 10;
    });
    expect(found).toBeTruthy();
  });

  test('pasting HTML containing an <svg> with supported <pattern x/y> preserves phase via tileOffsetX/tileOffsetY', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
        <defs>
          <pattern id="p" x="5" y="7" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="10" height="10" fill="#ff0000" />
          </pattern>
        </defs>
        <rect x="20" y="30" width="10" height="10" fill="url(#p)" />
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

    const found = newShapes.find((el: any) => {
      const f0 = el?.style?.fills?.[0];
      return f0?.type === 'image' && f0?.repeat === 'repeat' && f0?.tileWidth === 10 && f0?.tileHeight === 10;
    });
    expect(found).toBeTruthy();

    const f0 = found?.style?.fills?.[0];
    expect(f0?.tileOffsetX).toBe(-15);
    expect(f0?.tileOffsetY).toBe(-23);
  });

  test('pasting HTML containing an <svg> with supported <pattern patternTransform> adjusts tile size and phase', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
        <defs>
          <pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="scale(2) translate(3 4)">
            <rect x="0" y="0" width="10" height="10" fill="#ff0000" />
          </pattern>
        </defs>
        <rect x="20" y="30" width="10" height="10" fill="url(#p)" />
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

    const found = newShapes.find((el: any) => {
      const f0 = el?.style?.fills?.[0];
      return f0?.type === 'image' && f0?.repeat === 'repeat' && f0?.tileWidth === 20 && f0?.tileHeight === 20;
    });
    expect(found).toBeTruthy();

    const f0 = found?.style?.fills?.[0];
    // translate then scale => origin (6,8); bbox is (20,30)
    expect(f0?.tileOffsetX).toBe(-14);
    expect(f0?.tileOffsetY).toBe(-22);
  });

  test('pasting HTML containing an <svg> with supported <patternUnits="objectBoundingBox"> imports a repeating image fill with derived tile metrics', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="220" height="120">
        <defs>
          <pattern id="p" patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" x="0.25" y="0.2" width="0.25" height="0.5">
            <rect x="0" y="0" width="1" height="1" fill="#ff0000" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="200" height="100" fill="url(#p)" />
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

    const found = newShapes.find((el: any) => {
      const f0 = el?.style?.fills?.[0];
      return f0?.type === 'image' && f0?.repeat === 'repeat' && f0?.tileWidth === 50 && f0?.tileHeight === 50;
    });
    expect(found).toBeTruthy();

    const f0 = found?.style?.fills?.[0];
    expect(f0?.tileOffsetX).toBe(50);
    expect(f0?.tileOffsetY).toBe(20);
  });

  test('pasting HTML containing an <svg> with supported objectBoundingBox <patternContentUnits="userSpaceOnUse"> imports a repeating image fill with derived tile metrics', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="220" height="120">
        <defs>
          <pattern id="p" patternUnits="objectBoundingBox" patternContentUnits="userSpaceOnUse" x="0.25" y="0.2" width="0.25" height="0.5">
            <rect x="50" y="20" width="50" height="50" fill="#ff0000" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="200" height="100" fill="url(#p)" />
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

    const found = newShapes.find((el: any) => {
      const f0 = el?.style?.fills?.[0];
      return f0?.type === 'image' && f0?.repeat === 'repeat' && f0?.tileWidth === 50 && f0?.tileHeight === 50;
    });
    expect(found).toBeTruthy();

    const f0 = found?.style?.fills?.[0];
    expect(f0?.tileOffsetX).toBe(50);
    expect(f0?.tileOffsetY).toBe(20);
  });

  test('pasting HTML containing an <svg> with <linearGradient gradientTransform="scale(...)"> applies transform to gradient direction', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="10">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="scale(2 1)">
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

    const shapeWithGradient = newShapes.find((el: any) => el?.style?.fills?.[0]?.type === 'gradient');
    expect(shapeWithGradient).toBeTruthy();

    const css = String(shapeWithGradient.style.fills[0].value || '');
    const m = css.match(/linear-gradient\(\s*([0-9.]+)deg/i);
    expect(m).toBeTruthy();
    const deg = m ? Number(m[1]) : NaN;
    // scaleX=2, scaleY=1 transforms a diagonal (1,1) into (2,1) => CSS angle ~116.565deg.
    expect(deg).toBeCloseTo(116.565, 3);
  });

  test('pasting HTML containing an <svg><path/></svg> imports a vector shape (Q/T supported)', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><path d="M0 0 Q 20 0 20 10 T 40 20" fill="#00ff00" /></svg>';
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

  test('pasting HTML containing an <svg><path/></svg> imports a vector shape (A arc supported)', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><path d="M0 0 A 10 10 0 0 1 10 10" fill="none" stroke="#000" stroke-width="2" /></svg>';
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

  test('pasting SVG with a scaled <g transform="scale(...)"> bakes scale into geometry', async ({ page, getState }) => {
    const before = await getState();
    const slideId = before.editor.activeSlideId;
    expect(slideId).toBeTruthy();

    const beforeElements = before.slides[slideId]?.elements || {};
    const beforeIds = new Set(Object.keys(beforeElements));

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><g transform="scale(2)"><rect x="5" y="10" width="10" height="20" fill="#ff0000" /></g></svg>';
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

    const rect = newShapes.find((el: any) => el.shapeKind === 'rectangle' || el.shape === 'rectangle');
    expect(rect).toBeTruthy();

    // Original width/height: 10x20, scaled by 2 => 20x40.
    expect(rect.width).toBeCloseTo(20, 3);
    expect(rect.height).toBeCloseTo(40, 3);
  });
});
