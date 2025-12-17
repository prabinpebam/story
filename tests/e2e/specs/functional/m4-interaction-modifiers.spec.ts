import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('G4: Interaction modes + modifier semantics', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('mode/container switches clear deep edit + selection', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slide1Id = 'slide-g4-deepedit-1';
    const slide2Id = 'slide-g4-deepedit-2';
    const vId = 'shape-g4-deepedit-vector';

    const slide1 = {
      ...baseSlide,
      id: slide1Id,
      name: 'G4 Deep Edit (1)',
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
              segments: [{ kind: 'line', to: { x: 110, y: 70 } }]
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

    const slide2 = {
      ...baseSlide,
      id: slide2Id,
      name: 'G4 Deep Edit (2)',
      width: 300,
      height: 200,
      elements: [],
      elementOrder: []
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide1, slide2] });
    await page.waitForTimeout(150);

    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });
    await dispatchAction('UPDATE_SELECTION', []);
    await page.waitForTimeout(50);

    const canvas = page.locator('#canvas-container');
    await expect(canvas).toBeVisible();

    // Enter deep edit via double click.
    await canvas.dblclick({ position: { x: 60, y: 60 } });
    await expect.poll(async () => (await getState()).editor.deepEdit?.kind).toBe('vector');
    await expect.poll(async () => (await getState()).editor.deepEdit?.elementId).toBe(vId);

    // Switching active slide must clear deep edit and selection.
    await dispatchAction('SET_ACTIVE_SLIDE', slide2Id);
    await expect.poll(async () => (await getState()).editor.deepEdit).toBe(null);
    await expect.poll(async () => (await getState()).editor.selectedElementIds).toEqual([]);

    // Switch back, re-enter deep edit.
    await dispatchAction('SET_ACTIVE_SLIDE', slide1Id);
    await page.waitForTimeout(50);
    await canvas.dblclick({ position: { x: 60, y: 60 } });
    await expect.poll(async () => (await getState()).editor.deepEdit?.elementId).toBe(vId);

    // Switching to presentation mode must clear edit context.
    await dispatchAction('SET_MODE', 'presentation');
    await expect.poll(async () => (await getState()).editor.deepEdit).toBe(null);
    await expect.poll(async () => (await getState()).editor.selectedElementIds).toEqual([]);
  });

  test('object: Alt resize from center keeps center fixed', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-g4-center-resize-1';
    const aId = 'shape-g4-center-resize-a';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'G4 Center Resize',
      width: 260,
      height: 160,
      elements: [
        {
          id: aId,
          type: 'rect',
          x: 60,
          y: 60,
          width: 40,
          height: 20,
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

    // Grab E handle (near right-middle) and drag right with Alt.
    const start = { x: (box as any).x + 60 + 40, y: (box as any).y + 60 + 10 };
    const end = { x: start.x + 10, y: start.y };

    await page.keyboard.down('Alt');
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y);
    await page.mouse.up();
    await page.keyboard.up('Alt');

    // Center should remain at (80,70); width grows by 20, x shifts left by 10.
    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[aId];
      return { x: el.x, width: el.width };
    }).toEqual({ x: 50, width: 60 });
  });

  test('creation: Alt drag draws from center', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-g4-create-center-1';
    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'G4 Create Center',
      width: 300,
      height: 200,
      elements: [],
      elementOrder: []
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);

    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });
    await dispatchAction('SET_ACTIVE_TOOL', 'shape');
    await page.waitForTimeout(50);

    const before = await getState();
    const beforeIds = Object.keys((before.slides as any)[slideId].elements || {});

    const canvas = page.locator('#canvas-container');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    const start = { x: (box as any).x + 120, y: (box as any).y + 120 };
    const end = { x: (box as any).x + 140, y: (box as any).y + 130 };

    await page.keyboard.down('Alt');
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y);
    await page.mouse.up();
    await page.keyboard.up('Alt');

    await dispatchAction('SET_ACTIVE_TOOL', 'select');

    const after = await getState();
    const afterEls = (after.slides as any)[slideId].elements as Record<string, any>;
    const afterIds = Object.keys(afterEls);

    const newIds = afterIds.filter((id) => !beforeIds.includes(id));
    expect(newIds.length).toBe(1);

    const el = afterEls[newIds[0]];
    expect(el.type).toBe('rect');
    expect({ x: el.x, y: el.y, width: el.width, height: el.height }).toEqual({
      x: 100,
      y: 110,
      width: 40,
      height: 20
    });
  });

  test('snapping: drag snaps to nearby element edge', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-g4-snap-1';
    const aId = 'shape-g4-snap-a';
    const bId = 'shape-g4-snap-b';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'G4 Snapping',
      width: 260,
      height: 160,
      elements: [
        {
          id: aId,
          type: 'rect',
          x: 20,
          y: 40,
          width: 40,
          height: 40,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#FF0000', opacity: 100, visible: true }] }
        },
        {
          id: bId,
          type: 'rect',
          x: 120,
          y: 40,
          width: 40,
          height: 40,
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

    // Drag A near B's left edge, but slightly off (within snap threshold).
    const start = { x: (box as any).x + 20 + 10, y: (box as any).y + 40 + 10 };
    const end = { x: (box as any).x + 20 + 10 + 98, y: start.y }; // target newX = 118 (should snap to 120)

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y);
    await page.mouse.up();

    await expect.poll(async () => {
      const st = await getState();
      return (st.slides as any)[slideId].elements[aId].x;
    }).toBe(120);
  });
});
