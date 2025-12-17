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
      await expect(page.locator('#viewport').locator(`[data-element-id="${selectedId}"]`)).toHaveAttribute('data-shape-kind', 'ellipse');
    }

    // Line (L)
    await page.keyboard.press('l');
    await canvas.drag(0.2, 0.55, 0.65, 0.55);
    {
      const { selectedId, el } = await getSelectedElement(getState);
      expect(kindOf(el)).toBe('line');
      expect(el.params?.p1).toBeTruthy();
      expect(el.params?.p2).toBeTruthy();
      await expect(page.locator('#viewport').locator(`[data-element-id="${selectedId}"]`)).toHaveAttribute('data-shape-kind', 'line');
    }

    // Arrow (Shift+L)
    await page.keyboard.press('Shift+L');
    await canvas.drag(0.2, 0.65, 0.65, 0.7);
    {
      const { selectedId, el } = await getSelectedElement(getState);
      expect(kindOf(el)).toBe('line');
      expect(el.params?.endCap).toBe('arrow');
      await expect(page.locator('#viewport').locator(`[data-element-id="${selectedId}"]`)).toHaveAttribute('data-shape-kind', 'line');
    }

    // Polygon (Shift+P)
    await page.keyboard.press('Shift+P');
    await canvas.drag(0.55, 0.55, 0.8, 0.8);
    {
      const { selectedId, el } = await getSelectedElement(getState);
      expect(kindOf(el)).toBe('polygon');
      expect(el.params?.sides).toBe(6);
      await expect(page.locator('#viewport').locator(`[data-element-id="${selectedId}"]`)).toHaveAttribute('data-shape-kind', 'polygon');
    }

    // Star (Shift+S)
    await page.keyboard.press('Shift+S');
    await canvas.drag(0.55, 0.45, 0.8, 0.52);
    {
      const { selectedId, el } = await getSelectedElement(getState);
      expect(kindOf(el)).toBe('star');
      expect(el.params?.points).toBe(5);
      expect(el.params?.innerRadiusRatio).toBe(0.5);
      await expect(page.locator('#viewport').locator(`[data-element-id="${selectedId}"]`)).toHaveAttribute('data-shape-kind', 'star');
    }

    await expect.poll(async () => await editor.getActiveTool()).toBe('select');
  });
});
