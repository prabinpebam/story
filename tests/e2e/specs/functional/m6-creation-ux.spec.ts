import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('G6: Creation UX (toolbar + creation wiring)', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  const getSelectedElement = async (getState: () => Promise<any>) => {
    const st = await getState();
    const slideId = st.editor.activeSlideId;
    const slide = st.slides[slideId];
    const selectedId = st.editor.selectedElementIds?.[0];
    if (!selectedId) throw new Error('No selection after creation');
    const el = slide?.elements?.[selectedId];
    if (!el) throw new Error(`Selected element not found in slide: ${selectedId}`);
    return { st, slideId, selectedId, el };
  };

  const kindOf = (el: any) => {
    if (!el) return null;
    if (el.type === 'rect') return 'rectangle';
    if (el.type === 'circle') return 'ellipse';
    if (el.type === 'shape') return el.shapeKind;
    return el.type;
  };

  test('shape tool menu: selecting polygon updates activeToolOptions and creates polygon', async ({ page, getState }) => {
    await page.locator('[data-testid="tool-shape-caret"]').click();
    await expect(page.locator('[data-testid="shape-tool-menu"]')).toBeVisible();

    await page.locator('[data-testid="shape-menu-polygon"]').click();

    await expect.poll(async () => {
      const st = await getState();
      return { tool: st.editor.activeTool, kind: st.editor.activeToolOptions?.shapeKind };
    }).toEqual({ tool: 'shape', kind: 'polygon' });

    await canvas.drag(0.25, 0.25, 0.55, 0.55);

    const { selectedId, el } = await getSelectedElement(getState);
    expect(kindOf(el)).toBe('polygon');
    expect(el.params?.sides).toBe(6);

    const domEl = page.locator('#viewport').locator(`[data-element-id="${selectedId}"]`);
    await expect(domEl).toHaveAttribute('data-shape-kind', 'polygon');

    await expect.poll(async () => await editor.getActiveTool()).toBe('select');
  });

  test('keyboard shortcuts: create each supported shape kind (DOM + model)', async ({ page, getState }) => {
    // Rectangle (R)
    await page.keyboard.press('r');
    await canvas.drag(0.2, 0.2, 0.45, 0.4);
    {
      const { selectedId, el } = await getSelectedElement(getState);
      expect(kindOf(el)).toBe('rectangle');
      await expect(page.locator('#viewport').locator(`[data-element-id="${selectedId}"]`)).toHaveAttribute('data-shape-kind', 'rectangle');
    }

    // Ellipse (O)
    await page.keyboard.press('o');
    await canvas.drag(0.55, 0.2, 0.8, 0.4);
    {
      const { selectedId, el } = await getSelectedElement(getState);
      expect(kindOf(el)).toBe('ellipse');
      const host = page.locator('#viewport').locator(`[data-element-id="${selectedId}"]`);
      await expect(host).toHaveAttribute('data-shape-kind', 'ellipse');

      const fillPath = host.locator('svg.geometry-layer path').first();
      await expect(fillPath).toHaveCount(1);
      await expect(fillPath).toHaveAttribute('fill');
    }

    // Line (L)
    await page.keyboard.press('l');
    await canvas.drag(0.2, 0.55, 0.65, 0.55);
    {
      const { selectedId, el } = await getSelectedElement(getState);
      expect(kindOf(el)).toBe('line');
      expect(el.params?.p1).toBeTruthy();
      expect(el.params?.p2).toBeTruthy();
      const host = page.locator('#viewport').locator(`[data-element-id="${selectedId}"]`);
      await expect(host).toHaveAttribute('data-shape-kind', 'line');
      const line = host.locator('svg.geometry-layer line').first();
      await expect(line).toHaveCount(1);
      await expect(line).toHaveAttribute('stroke');
    }

    // Arrow (Shift+L)
    await page.keyboard.press('Shift+L');
    await canvas.drag(0.2, 0.65, 0.65, 0.7);
    {
      const { selectedId, el } = await getSelectedElement(getState);
      expect(kindOf(el)).toBe('line');
      expect(el.params?.endCap).toBe('arrow');
      const host = page.locator('#viewport').locator(`[data-element-id="${selectedId}"]`);
      await expect(host).toHaveAttribute('data-shape-kind', 'line');
      const line = host.locator('svg.geometry-layer line').first();
      await expect(line).toHaveCount(1);
      await expect(line).toHaveAttribute('marker-end');
    }

    // Polygon (Shift+P)
    await page.keyboard.press('Shift+P');
    await canvas.drag(0.55, 0.55, 0.8, 0.8);
    {
      const { selectedId, el } = await getSelectedElement(getState);
      expect(kindOf(el)).toBe('polygon');
      expect(el.params?.sides).toBe(6);
      const host = page.locator('#viewport').locator(`[data-element-id="${selectedId}"]`);
      await expect(host).toHaveAttribute('data-shape-kind', 'polygon');
      const fillPath = host.locator('svg.geometry-layer path').first();
      await expect(fillPath).toHaveCount(1);
      await expect(fillPath).toHaveAttribute('fill');

      // DOM geometry validation: rotation convention must match ParametricToPaths.
      // For rotation=0, the path starts at the rightmost point on the circle: (cx + r, cy).
      const d = await fillPath.getAttribute('d');
      expect(d).toBeTruthy();
      const move = await page.evaluate((pathD) => {
        const m = String(pathD || '').match(/^[\s]*M\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*,?\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)/i);
        if (!m) return null;
        return { x: Number(m[1]), y: Number(m[2]) };
      }, d);
      expect(move).toBeTruthy();

      const w = Number(el.width);
      const h = Number(el.height);
      const r = Math.min(w, h) / 2;
      const expectedX = w / 2 + r;
      const expectedY = h / 2;
      expect(Math.abs((move as any).x - expectedX)).toBeLessThanOrEqual(1);
      expect(Math.abs((move as any).y - expectedY)).toBeLessThanOrEqual(1);
    }

    // Star (Shift+S)
    await page.keyboard.press('Shift+S');
    await canvas.drag(0.55, 0.45, 0.8, 0.52);
    {
      const { selectedId, el } = await getSelectedElement(getState);
      expect(kindOf(el)).toBe('star');
      expect(el.params?.points).toBe(5);
      expect(el.params?.innerRadiusRatio).toBe(0.5);
      const host = page.locator('#viewport').locator(`[data-element-id="${selectedId}"]`);
      await expect(host).toHaveAttribute('data-shape-kind', 'star');
      const fillPath = host.locator('svg.geometry-layer path').first();
      await expect(fillPath).toHaveCount(1);
      await expect(fillPath).toHaveAttribute('fill');

      // DOM geometry validation (same rotation convention): start at rightmost outer point.
      const d = await fillPath.getAttribute('d');
      expect(d).toBeTruthy();
      const move = await page.evaluate((pathD) => {
        const m = String(pathD || '').match(/^[\s]*M\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*,?\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)/i);
        if (!m) return null;
        return { x: Number(m[1]), y: Number(m[2]) };
      }, d);
      expect(move).toBeTruthy();

      const w = Number(el.width);
      const h = Number(el.height);
      const r = Math.min(w, h) / 2;
      const expectedX = w / 2 + r;
      const expectedY = h / 2;
      expect(Math.abs((move as any).x - expectedX)).toBeLessThanOrEqual(1);
      expect(Math.abs((move as any).y - expectedY)).toBeLessThanOrEqual(1);
    }

    await expect.poll(async () => await editor.getActiveTool()).toBe('select');
  });

  test('creation preview: draws on interaction canvas during drag (before mouseup)', async ({ page }) => {
    await editor.setActiveTool('shape');

    const start = await canvas.normalizedToAbsolute(0.2, 0.2);
    const mid = await canvas.normalizedToAbsolute(0.28, 0.26);
    const end = await canvas.normalizedToAbsolute(0.35, 0.3);

    const sample = async () => {
      return await page.evaluate(({ x, y }) => {
        const c = document.querySelector('#interaction-canvas');
        if (!(c instanceof HTMLCanvasElement)) throw new Error('interaction canvas not found');
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('2d context not available');

        const rect = c.getBoundingClientRect();
        const localX = x - rect.left;
        const localY = y - rect.top;

        const w = 40;
        const h = 40;
        const sx = Math.max(0, Math.min(c.width - w, Math.floor(localX - w / 2)));
        const sy = Math.max(0, Math.min(c.height - h, Math.floor(localY - h / 2)));
        const img = ctx.getImageData(sx, sy, w, h);

        let nonZero = 0;
        for (let i = 3; i < img.data.length; i += 4) {
          if (img.data[i] !== 0) {
            nonZero++;
          }
        }
        return nonZero;
      }, { x: mid.x, y: mid.y });
    };

    // Ensure the overlay is initially empty at the sample location.
    const before = await sample();
    expect(before).toBe(0);

    // Drag and assert the creation ghost is rendered before mouse-up.
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y);
    await page.waitForTimeout(50);

    const during = await sample();
    expect(during).toBeGreaterThan(0);

    await page.mouse.up();
  });
});
