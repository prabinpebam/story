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

  test('object: rotation drag is one undo step (shift snaps)', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-m4-rotate-1';
    const aId = 'shape-m4-rotate-a';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M4 Rotate',
      width: 260,
      height: 160,
      elements: [
        {
          id: aId,
          type: 'rect',
          x: 60,
          y: 60,
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

    // Rotation trigger zone: just outside the NW corner.
    const start = { x: (box as any).x + 55, y: (box as any).y + 55 };
    const end = { x: (box as any).x + 140, y: (box as any).y + 60 };

    await page.keyboard.down('Shift');
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y);
    await page.mouse.up();
    await page.keyboard.up('Shift');

    await expect.poll(async () => {
      const st = await getState();
      return (st.slides as any)[slideId].elements[aId].rotation;
    }).not.toBe(0);

    // Undo should restore original rotation.
    await dispatchAction('UNDO');
    await expect.poll(async () => {
      const st = await getState();
      return (st.slides as any)[slideId].elements[aId].rotation;
    }).toBe(0);
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

  test('vector: box selection supports shift-add and ctrl-toggle', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-m4-vector-3';
    const vId = 'shape-m4-vector-c';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M4 Vector Box Select Modifiers',
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

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    // 1) Base selection: box select start node only (world 50,50).
    const startA = { x: (box as any).x + 46, y: (box as any).y + 46 };
    const endA = { x: (box as any).x + 54, y: (box as any).y + 54 };
    await page.mouse.move(startA.x, startA.y);
    await page.mouse.down();
    await page.mouse.move(endA.x, endA.y);
    await page.mouse.up();

    await expect.poll(async () => {
      const st = await getState();
      return st.editor.deepEdit?.selection?.nodes || [];
    }).toEqual(['p0:start']);

    // 2) Shift-add: box select s2 node (world 150,110) while holding Shift.
    const startB = { x: (box as any).x + 146, y: (box as any).y + 106 };
    const endB = { x: (box as any).x + 154, y: (box as any).y + 114 };
    await page.keyboard.down('Shift');
    await page.mouse.move(startB.x, startB.y);
    await page.mouse.down();
    await page.mouse.move(endB.x, endB.y);
    await page.mouse.up();
    await page.keyboard.up('Shift');

    await expect.poll(async () => {
      const st = await getState();
      return st.editor.deepEdit?.selection?.nodes || [];
    }).toEqual(['p0:s2', 'p0:start']);

    // 3) Ctrl-toggle: toggle start node off.
    const startC = { x: (box as any).x + 35, y: (box as any).y + 35 };
    const endC = { x: (box as any).x + 65, y: (box as any).y + 65 };
    await page.keyboard.down('Control');
    await page.mouse.move(startC.x, startC.y);
    await page.mouse.down();
    await page.mouse.move(endC.x, endC.y);
    await page.mouse.up();
    await page.keyboard.up('Control');

    await expect.poll(async () => {
      const st = await getState();
      return st.editor.deepEdit?.selection?.nodes || [];
    }).toEqual(['p0:s2']);
  });

  test('vector: double-click edge inserts node (one undo step)', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-m4-vector-insert-1';
    const vId = 'shape-m4-vector-insert-a';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M4 Vector Insert',
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
              segments: [{ kind: 'line', to: { x: 110, y: 10 } }]
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

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    // Double-click on the middle of the edge (world ~100,50 => local ~60,10).
    const mid = { x: (box as any).x + 100, y: (box as any).y + 50 };
    await page.mouse.dblclick(mid.x, mid.y);

    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      return el.paths[0].segments.length;
    }).toBe(2);

    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      return el.paths[0].segments[0].to;
    }).toEqual({ x: 60, y: 10 });

    // Undo restores original single segment.
    await dispatchAction('UNDO');
    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      return el.paths[0].segments.length;
    }).toBe(1);
  });

  test('vector: delete removes selected node (one undo step)', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-m4-vector-delete-1';
    const vId = 'shape-m4-vector-delete-a';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M4 Vector Delete Node',
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

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    // Click the middle node (world 150,50) to select it.
    const node = { x: (box as any).x + 150, y: (box as any).y + 50 };
    await page.mouse.click(node.x, node.y);

    await expect.poll(async () => {
      const st = await getState();
      return st.editor.deepEdit?.selection?.nodes || [];
    }).toEqual(['p0:s1']);

    await page.keyboard.press('Delete');

    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      return el.paths[0].segments.length;
    }).toBe(1);

    await dispatchAction('UNDO');
    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      return el.paths[0].segments.length;
    }).toBe(2);
  });

  test('vector: arrow keys nudge selected node (one undo step)', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-m4-vector-nudge-1';
    const vId = 'shape-m4-vector-nudge-a';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M4 Vector Nudge Node',
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
              segments: [{ kind: 'line', to: { x: 110, y: 10 } }]
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

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    // Click the start node (world 50,50).
    const startNode = { x: (box as any).x + 50, y: (box as any).y + 50 };
    await page.mouse.click(startNode.x, startNode.y);

    await expect.poll(async () => {
      const st = await getState();
      return st.editor.deepEdit?.selection?.nodes || [];
    }).toEqual(['p0:start']);

    await page.keyboard.press('ArrowRight');

    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      return el.paths[0].start;
    }).toEqual({ x: 11, y: 10 });

    await dispatchAction('UNDO');
    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      return el.paths[0].start;
    }).toEqual({ x: 10, y: 10 });
  });

  test('vector: click edge selects edge; delete removes edge (one undo step)', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-m4-vector-edge-select-1';
    const vId = 'shape-m4-vector-edge-select-a';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M4 Vector Edge Select',
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

    await canvas.dblclick({ position: { x: 60, y: 60 } });
    await expect.poll(async () => (await getState()).editor.deepEdit?.kind).toBe('vector');

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    // Click near the middle of the first edge.
    const mid = { x: (box as any).x + 100, y: (box as any).y + 50 };
    await page.mouse.click(mid.x, mid.y);

    await expect.poll(async () => {
      const st = await getState();
      return st.editor.deepEdit?.selection?.edges || [];
    }).toEqual(['p0:e0']);

    await page.keyboard.press('Delete');
    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      return el.paths[0].segments.length;
    }).toBe(1);

    await dispatchAction('UNDO');
    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      return el.paths[0].segments.length;
    }).toBe(2);
  });

  test('vector: drag handle endpoint updates cubic control point (one undo step)', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-m4-vector-handle-drag-1';
    const vId = 'shape-m4-vector-handle-drag-a';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M4 Vector Handle Drag',
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
              start: { x: 10, y: 40 },
              segments: [
                {
                  kind: 'cubic',
                  c1: { x: 40, y: 10 },
                  c2: { x: 80, y: 70 },
                  to: { x: 110, y: 40 }
                }
              ]
            }
          ],
          style: {
            fills: [{ type: 'solid', value: '#00FF00', opacity: 30, visible: true }],
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

    await canvas.dblclick({ position: { x: 60, y: 60 } });
    await expect.poll(async () => (await getState()).editor.deepEdit?.kind).toBe('vector');

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    // Drag the outgoing handle of the start node: c1 (world 80,50).
    const start = { x: (box as any).x + 80, y: (box as any).y + 50 };
    const end = { x: (box as any).x + 90, y: (box as any).y + 60 };

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y);
    await page.mouse.up();

    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      return el.paths[0].segments[0].c1;
    }).toEqual({ x: 50, y: 20 });

    await dispatchAction('UNDO');
    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      return el.paths[0].segments[0].c1;
    }).toEqual({ x: 40, y: 10 });
  });

  test('vector: double-click node toggles corner ↔ smooth (adjacent handles)', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-m4-vector-node-toggle-1';
    const vId = 'shape-m4-vector-node-toggle-a';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M4 Vector Node Toggle',
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
            fills: [{ type: 'solid', value: '#00FF00', opacity: 30, visible: true }],
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

    await canvas.dblclick({ position: { x: 60, y: 60 } });
    await expect.poll(async () => (await getState()).editor.deepEdit?.kind).toBe('vector');

    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    // Double-click the corner node at world 150,50 (local 110,10).
    const corner = { x: (box as any).x + 150, y: (box as any).y + 50 };
    await page.mouse.dblclick(corner.x, corner.y);

    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      return [el.paths[0].segments[0].kind, el.paths[0].segments[1].kind];
    }).toEqual(['cubic', 'cubic']);

    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      const anchor = { x: 110, y: 10 };
      const inHandle = el.paths[0].segments[0].c2;
      const outHandle = el.paths[0].segments[1].c1;
      return [inHandle.x === anchor.x && inHandle.y === anchor.y, outHandle.x === anchor.x && outHandle.y === anchor.y];
    }).toEqual([false, false]);

    // Double-click again should collapse handles back to the anchor.
    await page.mouse.dblclick(corner.x, corner.y);
    await expect.poll(async () => {
      const st = await getState();
      const el = (st.slides as any)[slideId].elements[vId];
      return [el.paths[0].segments[0].c2, el.paths[0].segments[1].c1];
    }).toEqual([{ x: 110, y: 10 }, { x: 110, y: 10 }]);
  });
});
