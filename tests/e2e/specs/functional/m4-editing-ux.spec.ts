import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('M4: Editing UX (object + vector) + undo coalescing', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('object: drag move is one undo step', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-m4-move-1';
    const aId = 'shape-m4-move-a';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M4 Move',
      width: 260,
      height: 160,
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

    // Click to select then drag to move.
    await canvas.click({ position: { x: 30, y: 30 } });
    await expect.poll(async () => (await getState()).editor.selectedElementIds).toEqual([aId]);

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    // Start the drag well inside the element to avoid selection handle hit-zones
    // (e.g., corner radius handles) now that the element is selected.
    const start = { x: (box as any).x + 50, y: (box as any).y + 40 };
    const end = { x: (box as any).x + 100, y: (box as any).y + 70 };

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y);
    await page.mouse.up();

    await expect.poll(async () => {
      const st = await getState();
      return (st.slides as any)[slideId].elements[aId].x;
    }).toBe(70);

    // Undo should restore original position.
    await dispatchAction('UNDO');
    await expect.poll(async () => {
      const st = await getState();
      return (st.slides as any)[slideId].elements[aId].x;
    }).toBe(20);
  });

  test('object: resize from NW handle is one undo step', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-m4-resize-1';
    const aId = 'shape-m4-resize-a';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M4 Resize',
      width: 260,
      height: 160,
      elements: [
        {
          id: aId,
          type: 'rect',
          x: 40,
          y: 40,
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
    await dispatchAction('UPDATE_SELECTION', [aId]);
    await page.waitForTimeout(50);

    const canvas = page.locator('#canvas-container');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    // Grab NW handle (near element top-left).
    const start = { x: (box as any).x + 40, y: (box as any).y + 40 };
    const end = { x: (box as any).x + 30, y: (box as any).y + 30 };

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y);
    await page.mouse.up();

    await expect.poll(async () => {
      const st = await getState();
      return (st.slides as any)[slideId].elements[aId].width;
    }).toBe(70);

    await dispatchAction('UNDO');
    await expect.poll(async () => {
      const st = await getState();
      return (st.slides as any)[slideId].elements[aId].width;
    }).toBe(60);
  });

  test('vector: double-click enters vector edit; drag node is one undo step; Escape exits', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-m4-vector-1';
    const vId = 'shape-m4-vector-a';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M4 Vector',
      width: 300,
      height: 200,
      elements: [
        {
          id: vId,
          type: 'vector',
          x: 40,
          y: 40,
          width: 120,
          height: 80,
          rotation: 0,
          // Local-space path inside the element box.
          paths: [
            {
              closed: false,
              fillRule: 'nonzero',
              start: { x: 10, y: 10 },
              segments: [
                { kind: 'line', to: { x: 110, y: 10 } },
                { kind: 'line', to: { x: 110, y: 70 } }
              ]
            }
          ],
          style: {
            fills: [{ type: 'solid', value: '#00FF00', opacity: 100, visible: true }],
            strokes: [{ type: 'solid', value: '#000000', width: 2, opacity: 100, visible: true }]
          }
        }
      ],
      elementOrder: [vId]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);

    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });
    await dispatchAction('UPDATE_SELECTION', []);
    await page.waitForTimeout(50);

    const canvas = page.locator('#canvas-container');
    await expect(canvas).toBeVisible();

    // Double click inside the vector element to enter vector edit mode.
    await canvas.dblclick({ position: { x: 60, y: 60 } });
    await expect.poll(async () => (await getState()).editor.deepEdit?.kind).toBe('vector');
    await expect.poll(async () => (await getState()).editor.deepEdit?.elementId).toBe(vId);

    // Drag the start node (local 10,10) => world 50,50.
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    const start = { x: (box as any).x + 50, y: (box as any).y + 50 };
    const end = { x: (box as any).x + 70, y: (box as any).y + 60 };

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y);
    await page.mouse.up();

    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      return el.paths[0].start;
    }).toEqual({ x: 30, y: 20 });

    await dispatchAction('UNDO');
    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      return el.paths[0].start;
    }).toEqual({ x: 10, y: 10 });

    // Escape exits vector edit mode without changing document state.
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await getState()).editor.deepEdit).toBe(null);
  });

  test('vector: box selection selects nodes in vector edit mode', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-m4-vector-2';
    const vId = 'shape-m4-vector-b';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M4 Vector Box Select',
      width: 300,
      height: 200,
      elements: [
        {
          id: vId,
          type: 'vector',
          x: 40,
          y: 40,
          width: 120,
          height: 80,
          rotation: 0,
          paths: [
            {
              closed: false,
              fillRule: 'nonzero',
              start: { x: 10, y: 10 },
              segments: [
                { kind: 'line', to: { x: 110, y: 10 } },
                { kind: 'line', to: { x: 110, y: 70 } }
              ]
            }
          ],
          style: {
            fills: [{ type: 'solid', value: '#00FF00', opacity: 100, visible: true }],
            strokes: [{ type: 'solid', value: '#000000', width: 2, opacity: 100, visible: true }]
          }
        }
      ],
      elementOrder: [vId]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);
    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });
    await dispatchAction('UPDATE_SELECTION', []);
    await page.waitForTimeout(50);

    const canvas = page.locator('#canvas-container');
    await expect(canvas).toBeVisible();

    // Enter vector edit mode.
    await canvas.dblclick({ position: { x: 60, y: 60 } });
    await expect.poll(async () => (await getState()).editor.deepEdit?.kind).toBe('vector');
    await expect.poll(async () => (await getState()).editor.deepEdit?.elementId).toBe(vId);

    // Box select the start node (world 50,50) and first segment endpoint (world 150,50).
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    const start = { x: (box as any).x + 45, y: (box as any).y + 45 };
    const end = { x: (box as any).x + 155, y: (box as any).y + 55 };

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y);
    await page.mouse.up();

    await expect.poll(async () => {
      const st = await getState();
      return st.editor.deepEdit?.selection?.nodes || [];
    }).toEqual(['p0:s1', 'p0:start']);
  });
});
