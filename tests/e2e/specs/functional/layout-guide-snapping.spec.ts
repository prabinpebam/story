import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';
import { getEffectiveLayoutGuideForState, getContentBounds, getColumnRects } from '../../../../src/core/utils/LayoutGuideUtils.js';

async function ensureEditorFlag(getState: () => Promise<any>, dispatchAction: (type: string, payload?: any) => Promise<void>, key: 'snapToObject' | 'snapToSlide' | 'snapToColumns', desired: boolean) {
  const before = await getState();
  const current = !!before.editor[key];
  if (current !== desired) {
    const actionMap: Record<typeof key, string> = {
      snapToObject: 'TOGGLE_SNAP_TO_OBJECT',
      snapToSlide: 'TOGGLE_SNAP_TO_SLIDE',
      snapToColumns: 'TOGGLE_SNAP_TO_COLUMNS',
    };
    await dispatchAction(actionMap[key]);
  }
}

function slideToScreen(slideBox: { x: number; y: number; width: number; height: number }, slideW: number, slideH: number, worldX: number, worldY: number) {
  return {
    x: slideBox.x + (worldX / slideW) * slideBox.width,
    y: slideBox.y + (worldY / slideH) * slideBox.height,
  };
}

function clamp01(v: number) {
  return Math.max(0.01, Math.min(0.99, v));
}

function getAbsoluteElementX(state: any, slideId: string, elementId: string) {
  const slide = state.slides?.[slideId];
  if (!slide?.elements?.[elementId]) return null;

  let x = slide.elements[elementId].x;
  let parentId = slide.elements[elementId].parentId;
  while (parentId) {
    const parent = slide.elements[parentId];
    if (!parent) break;
    x += parent.x;
    parentId = parent.parentId;
  }

  return x;
}

test.describe('Layout Guide Snapping', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('Snap to slide snaps to margin edge (left)', async ({ page, getState, dispatchAction }) => {
    // Isolate slide snapping
    await ensureEditorFlag(getState, dispatchAction, 'snapToObject', false);
    await ensureEditorFlag(getState, dispatchAction, 'snapToColumns', false);
    await ensureEditorFlag(getState, dispatchAction, 'snapToSlide', true);

    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.35, 0.35, 0.12, 0.12);

    // Switch back to select tool so dragging moves the element (not creating a new shape)
    await editor.setActiveTool('select');

    const before = await getState();
    const slideId = before.editor.activeSlideId;
    const elId = before.editor.selectedElementIds[0];
    expect(elId).toBeTruthy();

    const slide = before.slides?.[slideId];
    expect(slide).toBeTruthy();
    const el = slide.elements?.[elId];
    expect(el).toBeTruthy();

    const slideView = editor.canvas.locator('[data-testid="slide-view"]').first();
    const slideBg = slideView.locator('[data-testid="slide-background"]').first();
    const slideBgBox = await slideBg.boundingBox();
    if (!slideBgBox) throw new Error('slide background bounding box not found');

    const elLoc = slideView.locator(`[data-element-id="${elId}"]`).first();
    const elBox = await elLoc.boundingBox();
    if (!elBox) throw new Error('element bounding box not found');

    // Ensure element is selected for drag behavior
    await dispatchAction('UPDATE_SELECTION', [elId]);
    await page.mouse.click(elBox.x + elBox.width / 2, elBox.y + elBox.height / 2);
    const sel1 = await getState();
    expect(sel1.editor.selectedElementIds).toContain(elId);

    // Snap threshold is 5px in screen-space => 5/zoom in world-space.
    // Move element left edge within 3px (screen) of the margin line, then assert it snaps exactly.
    const guide = getEffectiveLayoutGuideForState(before);
    const zoom = Number(before.editor?.zoom ?? 1);
    const slideW = Number(slide.width);
    const slideH = Number(slide.height);
    const startAbsX = getAbsoluteElementX(before, slideId, elId);
    if (startAbsX == null) throw new Error('element absolute x not found');
    const startAbsY = (() => {
      let y = el.y;
      let parentId = el.parentId;
      while (parentId) {
        const parent = slide.elements[parentId];
        if (!parent) break;
        y += parent.y;
        parentId = parent.parentId;
      }
      return y;
    })();

    const expectedAbsX = Number(guide?.margins?.left ?? 0);
    const endCenterWorldX = expectedAbsX + el.width / 2 + (3 / zoom);
    const centerWorldY = startAbsY + el.height / 2;

    const startScreen = { x: elBox.x + elBox.width / 2, y: elBox.y + elBox.height / 2 };
    const endScreen = slideToScreen(slideBgBox, slideW, slideH, endCenterWorldX, centerWorldY);

    const canvasBounds = await canvas.getCanvasBounds();
    if (!canvasBounds) throw new Error('canvas bounds not available');
    const startNorm = {
      x: clamp01((startScreen.x - canvasBounds.x) / canvasBounds.width),
      y: clamp01((startScreen.y - canvasBounds.y) / canvasBounds.height),
    };
    const endNorm = {
      x: clamp01((endScreen.x - canvasBounds.x) / canvasBounds.width),
      y: clamp01((endScreen.y - canvasBounds.y) / canvasBounds.height),
    };

    await canvas.drag(startNorm.x, startNorm.y, endNorm.x, endNorm.y);

    const after = await getState();
    const absX = getAbsoluteElementX(after, slideId, elId);
    expect(absX).not.toBeNull();
    expect(Math.abs((absX as number) - expectedAbsX)).toBeLessThanOrEqual(1);
  });

  test('Snap to columns snaps to a column edge (left edge of 2nd column)', async ({ page, getState, dispatchAction }) => {
    // Isolate column snapping
    await ensureEditorFlag(getState, dispatchAction, 'snapToObject', false);
    await ensureEditorFlag(getState, dispatchAction, 'snapToSlide', false);
    await ensureEditorFlag(getState, dispatchAction, 'snapToColumns', true);

    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.45, 0.35, 0.10, 0.10);

    // Switch back to select tool so dragging moves the element
    await editor.setActiveTool('select');

    const before = await getState();
    const slideId = before.editor.activeSlideId;
    const elId = before.editor.selectedElementIds[0];
    expect(elId).toBeTruthy();

    const slide = before.slides?.[slideId];
    expect(slide).toBeTruthy();
    const el = slide.elements?.[elId];
    expect(el).toBeTruthy();

    const slideView = editor.canvas.locator('[data-testid="slide-view"]').first();
    const slideBg = slideView.locator('[data-testid="slide-background"]').first();
    const slideBgBox = await slideBg.boundingBox();
    if (!slideBgBox) throw new Error('slide background bounding box not found');

    const elLoc = slideView.locator(`[data-element-id="${elId}"]`).first();
    const elBox = await elLoc.boundingBox();
    if (!elBox) throw new Error('element bounding box not found');

    await dispatchAction('UPDATE_SELECTION', [elId]);
    await page.mouse.click(elBox.x + elBox.width / 2, elBox.y + elBox.height / 2);
    const sel2 = await getState();
    expect(sel2.editor.selectedElementIds).toContain(elId);

    const guide = getEffectiveLayoutGuideForState(before);
    const zoom = Number(before.editor?.zoom ?? 1);
    const slideW = Number(slide.width);
    const slideH = Number(slide.height);
    const bounds = getContentBounds(slideW, slideH, guide.margins);
    const rects = getColumnRects(bounds, guide.columns?.count, guide.columns?.gutter);
    expect(rects.length).toBeGreaterThanOrEqual(2);

    const expectedAbsX = rects[1].x;
    const startAbsX = getAbsoluteElementX(before, slideId, elId);
    if (startAbsX == null) throw new Error('element absolute x not found');
    const startAbsY = (() => {
      let y = el.y;
      let parentId = el.parentId;
      while (parentId) {
        const parent = slide.elements[parentId];
        if (!parent) break;
        y += parent.y;
        parentId = parent.parentId;
      }
      return y;
    })();

    const endCenterWorldX = expectedAbsX + el.width / 2 + (3 / zoom);
    const centerWorldY = startAbsY + el.height / 2;

    const startScreen = { x: elBox.x + elBox.width / 2, y: elBox.y + elBox.height / 2 };
    const endScreen = slideToScreen(slideBgBox, slideW, slideH, endCenterWorldX, centerWorldY);

    const canvasBounds = await canvas.getCanvasBounds();
    if (!canvasBounds) throw new Error('canvas bounds not available');
    const startNorm = {
      x: clamp01((startScreen.x - canvasBounds.x) / canvasBounds.width),
      y: clamp01((startScreen.y - canvasBounds.y) / canvasBounds.height),
    };
    const endNorm = {
      x: clamp01((endScreen.x - canvasBounds.x) / canvasBounds.width),
      y: clamp01((endScreen.y - canvasBounds.y) / canvasBounds.height),
    };

    await canvas.drag(startNorm.x, startNorm.y, endNorm.x, endNorm.y);

    const after = await getState();
    const absX = getAbsoluteElementX(after, slideId, elId);
    expect(absX).not.toBeNull();
    expect(Math.abs((absX as number) - expectedAbsX)).toBeLessThanOrEqual(1);
  });
});
