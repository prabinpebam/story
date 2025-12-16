import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('M3: Selection + hit testing', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('click selects topmost element; shift-click toggles multi-select', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;
    expect(baseSlide?.id).toBeTruthy();

    const slideId = 'slide-m3-select-1';
    const aId = 'shape-m3-a';
    const bId = 'shape-m3-b';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M3 Selection',
      width: 200,
      height: 120,
      elements: [
        {
          id: aId,
          type: 'rect',
          x: 20,
          y: 20,
          width: 60,
          height: 40,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#FF0000', opacity: 100, visible: true }] }
        },
        {
          id: bId,
          type: 'rect',
          x: 100,
          y: 20,
          width: 60,
          height: 40,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#00FF00', opacity: 100, visible: true }] }
        }
      ],
      elementOrder: [aId, bId]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);

    // Make viewport deterministic for coordinate expectations.
    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });
    await dispatchAction('UPDATE_SELECTION', []);
    await page.waitForTimeout(50);

    const canvas = page.locator('#canvas-container');
    await expect(canvas).toBeVisible();

    // Click inside rect A.
    await canvas.click({ position: { x: 30, y: 30 } });
    await expect.poll(async () => (await getState()).editor.selectedElementIds).toEqual([aId]);

    // Shift-click inside rect B to multi-select.
    await canvas.click({ position: { x: 110, y: 30 }, modifiers: ['Shift'] });
    await expect.poll(async () => (await getState()).editor.selectedElementIds.sort()).toEqual([aId, bId].sort());

    // Shift-click B again should toggle it off.
    await canvas.click({ position: { x: 110, y: 30 }, modifiers: ['Shift'] });
    await expect.poll(async () => (await getState()).editor.selectedElementIds).toEqual([aId]);
  });

  test('overlapping elements: selection follows z-order deterministically', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;
    expect(baseSlide?.id).toBeTruthy();

    const slideId = 'slide-m3-overlap-1';
    const aId = 'shape-m3-overlap-a';
    const bId = 'shape-m3-overlap-b';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M3 Overlap',
      width: 220,
      height: 160,
      elements: [
        {
          id: aId,
          type: 'rect',
          x: 20,
          y: 20,
          width: 100,
          height: 80,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#FF0000', opacity: 100, visible: true }] }
        },
        {
          id: bId,
          type: 'rect',
          x: 60,
          y: 40,
          width: 100,
          height: 80,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#00FF00', opacity: 100, visible: true }] }
        }
      ],
      elementOrder: [aId, bId]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);

    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });
    await dispatchAction('UPDATE_SELECTION', []);
    await page.waitForTimeout(50);

    const canvas = page.locator('#canvas-container');
    await expect(canvas).toBeVisible();

    // Click in the overlap region; top-most is the last in elementOrder (B).
    await canvas.click({ position: { x: 80, y: 60 } });
    await expect.poll(async () => (await getState()).editor.selectedElementIds).toEqual([bId]);

    // Swap z-order by moving A to the end.
    await dispatchAction('REORDER_ELEMENTS', { slideId, elementId: aId, targetParentId: null, targetIndex: 1 });
    await dispatchAction('UPDATE_SELECTION', []);
    await page.waitForTimeout(50);

    // Now A is top-most.
    await canvas.click({ position: { x: 80, y: 60 } });
    await expect.poll(async () => (await getState()).editor.selectedElementIds).toEqual([aId]);
  });

  test('selection is sticky during drag (does not switch when crossing other elements)', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;
    expect(baseSlide?.id).toBeTruthy();

    const slideId = 'slide-m3-sticky-drag-1';
    const aId = 'shape-m3-sticky-a';
    const bId = 'shape-m3-sticky-b';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M3 Sticky Drag',
      width: 240,
      height: 140,
      elements: [
        {
          id: aId,
          type: 'rect',
          x: 20,
          y: 20,
          width: 60,
          height: 60,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#FF0000', opacity: 100, visible: true }] }
        },
        {
          id: bId,
          type: 'rect',
          x: 120,
          y: 20,
          width: 60,
          height: 60,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#00FF00', opacity: 100, visible: true }] }
        }
      ],
      elementOrder: [aId, bId]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);

    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });
    await dispatchAction('UPDATE_SELECTION', []);
    await page.waitForTimeout(50);

    const canvas = page.locator('#canvas-container');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    const start = { x: (box as any).x + 30, y: (box as any).y + 30 };
    const overB = { x: (box as any).x + 130, y: (box as any).y + 30 };

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await expect.poll(async () => (await getState()).editor.selectedElementIds).toEqual([aId]);

    // Drag across B; selection should remain A.
    await page.mouse.move(overB.x, overB.y);
    await page.mouse.up();
    await expect.poll(async () => (await getState()).editor.selectedElementIds).toEqual([aId]);
  });

  test('clicking empty canvas clears selection', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;
    expect(baseSlide?.id).toBeTruthy();

    const slideId = 'slide-m3-clear-1';
    const aId = 'shape-m3-clear-a';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M3 Clear Selection',
      width: 200,
      height: 120,
      elements: [
        {
          id: aId,
          type: 'rect',
          x: 30,
          y: 30,
          width: 60,
          height: 40,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#FF0000', opacity: 100, visible: true }] }
        }
      ],
      elementOrder: [aId]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);

    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });
    await dispatchAction('UPDATE_SELECTION', []);
    await page.waitForTimeout(50);

    const canvas = page.locator('#canvas-container');
    await expect(canvas).toBeVisible();

    // Select the element.
    await canvas.click({ position: { x: 40, y: 40 } });
    await expect.poll(async () => (await getState()).editor.selectedElementIds).toEqual([aId]);

    // Click empty area (outside the shape).
    await canvas.click({ position: { x: 5, y: 5 } });
    await expect.poll(async () => (await getState()).editor.selectedElementIds).toEqual([]);
  });
});
