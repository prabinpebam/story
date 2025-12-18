import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

function ensureBoolean(v: any): v is boolean {
  return typeof v === 'boolean';
}

function getAbsoluteXY(slide: any, elementId: string): { x: number; y: number } {
  const elements = slide?.elements || {};
  let el = elements[elementId];
  if (!el) return { x: 0, y: 0 };

  let x = Number(el.x || 0);
  let y = Number(el.y || 0);

  const seen = new Set<string>();
  while (el?.parentId && typeof el.parentId === 'string' && !seen.has(el.parentId)) {
    seen.add(el.parentId);
    const parent = elements[el.parentId];
    if (!parent) break;
    x += Number(parent.x || 0);
    y += Number(parent.y || 0);
    el = parent;
  }

  return { x, y };
}

test.describe('UI: Snapping false triggers (hidden elements)', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    // Trace magenta snapping guides (#FF00FF) on the interaction canvas.
    await page.addInitScript(() => {
      const trace: Record<string, number> = {
        magentaStrokes: 0,
        strokeCalls: 0
      };

      const vGuideXs: number[] = [];
      const hGuideYs: number[] = [];
      let lastMoveTo: { x: number; y: number } | null = null;

      (window as any).__snapTrace = trace;
      (window as any).__snapGuideVX = vGuideXs;
      (window as any).__snapGuideHY = hGuideYs;
      (window as any).__snapTraceReset = () => {
        for (const k of Object.keys(trace)) (trace as any)[k] = 0;
        vGuideXs.length = 0;
        hGuideYs.length = 0;
        lastMoveTo = null;
      };

      const origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (...args: any[]) {
        const ctx: any = (origGetContext as any).apply(this, args);
        try {
          const type = args[0];
          if (type === '2d' && (this as any)?.id === 'interaction-canvas' && ctx && !ctx.__snapTracePatched) {
            ctx.__snapTracePatched = true;

            const origMoveTo = ctx.moveTo;
            if (typeof origMoveTo === 'function') {
              ctx.moveTo = function (x: number, y: number, ...rest: any[]) {
                lastMoveTo = { x, y };
                return origMoveTo.call(this, x, y, ...rest);
              };
            }

            const origLineTo = ctx.lineTo;
            if (typeof origLineTo === 'function') {
              ctx.lineTo = function (x: number, y: number, ...rest: any[]) {
                try {
                  const style = String(this.strokeStyle || '').toLowerCase();
                  const isMagenta = style === '#ff00ff' || style.includes('255') && style.includes('0') && style.includes('255');

                  // Detect infinite snap guide primitives from GizmoRenderer.renderGuides.
                  if (isMagenta && lastMoveTo) {
                    if (lastMoveTo.y === -10000 && y === 10000 && lastMoveTo.x === x) {
                      vGuideXs.push(x);
                    }
                    if (lastMoveTo.x === -10000 && x === 10000 && lastMoveTo.y === y) {
                      hGuideYs.push(y);
                    }
                  }
                } catch {
                  // ignore
                }

                return origLineTo.call(this, x, y, ...rest);
              };
            }

            const origStroke = ctx.stroke;
            if (typeof origStroke === 'function') {
              ctx.stroke = function (...strokeArgs: any[]) {
                try {
                  const t = (window as any).__snapTrace;
                  if (t) {
                    t.strokeCalls++;
                    const style = String(this.strokeStyle || '').toLowerCase();
                    const isMagenta = style === '#ff00ff' || style.includes('255') && style.includes('0') && style.includes('255');
                    if (isMagenta) t.magentaStrokes++;
                  }
                } catch {
                  // ignore
                }
                return origStroke.apply(this, strokeArgs);
              };
            }
          }
        } catch {
          // ignore trace install failures; assertions will catch missing signals
        }
        return ctx;
      };
    });

    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    await expect(page.locator('#interaction-canvas')).toBeVisible();
  });

  test('does not snap to hidden boolean operands (no false magenta guides)', async ({ page, dispatchAction, getState }) => {
    // Disable slide/column snapping so only object snapping is in play.
    // These are toggles, so normalize them based on current state.
    const s0 = await getState();
    const snapToSlide = s0?.editor?.snapToSlide;
    const snapToColumns = s0?.editor?.snapToColumns;
    const snapToObject = s0?.editor?.snapToObject;

    if (!ensureBoolean(snapToObject) || !ensureBoolean(snapToSlide) || !ensureBoolean(snapToColumns)) {
      throw new Error('Expected editor snap flags to be booleans');
    }

    if (!snapToObject) await dispatchAction('TOGGLE_SNAP_TO_OBJECT');
    if (snapToSlide) await dispatchAction('TOGGLE_SNAP_TO_SLIDE');
    if (snapToColumns) await dispatchAction('TOGGLE_SNAP_TO_COLUMNS');

    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });

    // Two overlapping rectangles -> intersect boolean. Operands should become hidden.
    await dispatchAction('ADD_ELEMENT', {
      id: 'rect-a',
      type: 'rect',
      x: 200,
      y: 200,
      width: 200,
      height: 140,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#ff0000', opacity: 100, visible: true }] }
    });

    await dispatchAction('ADD_ELEMENT', {
      id: 'rect-b',
      type: 'rect',
      x: 280,
      y: 240,
      width: 200,
      height: 140,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#00ff00', opacity: 100, visible: true }] }
    });

    await dispatchAction('UPDATE_SELECTION', ['rect-a', 'rect-b']);
    await dispatchAction('CREATE_BOOLEAN_FROM_SELECTION', { ids: ['rect-a', 'rect-b'], operation: 'intersect' });

    // Add a movable rectangle far away.
    await dispatchAction('ADD_ELEMENT', {
      id: 'rect-c',
      type: 'rect',
      x: 600,
      y: 200,
      width: 100,
      height: 100,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#0000ff', opacity: 100, visible: true }] }
    });

    await dispatchAction('UPDATE_SELECTION', ['rect-c']);

    const s1 = await getState();
    const slide = s1?.slides?.[s1?.editor?.activeSlideId];
    expect(slide).toBeTruthy();

    const a = slide?.elements?.['rect-a'];
    const b = slide?.elements?.['rect-b'];
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();

    // Preconditions: operands should be hidden after boolean creation.
    expect(a.hidden).toBe(true);
    expect(b.hidden).toBe(true);

    const viewportBounds = await page.locator('#viewport').boundingBox();
    expect(viewportBounds).toBeTruthy();

    const zoom = s1?.editor?.zoom ?? 1;
    const pan = s1?.editor?.pan ?? { x: 0, y: 0 };

    const toScreen = (wx: number, wy: number) => ({
      x: (viewportBounds as any).x + (pan.x + wx * zoom),
      y: (viewportBounds as any).y + (pan.y + wy * zoom)
    });

    // Drag rect-c so its left edge ends at 202 (i.e., 2px away from hidden rect-a at x=200).
    // If snapping incorrectly considers hidden operands, rect-c will snap to x=200.
    const startWorld = { x: 600 + 50, y: 200 + 50 };
    const endWorld = { x: 202 + 50, y: 200 + 50 };

    const start = toScreen(startWorld.x, startWorld.y);
    const end = toScreen(endWorld.x, endWorld.y);

    await page.evaluate(() => (window as any).__snapTraceReset());

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 12 });
    await page.mouse.up();

    await page.waitForTimeout(150);

    const s2 = await getState();
    const slide2 = s2?.slides?.[s2?.editor?.activeSlideId];
    const c = slide2?.elements?.['rect-c'];
    expect(c).toBeTruthy();

    // Must NOT snap to hidden rect-a's edge.
    expect(c.x).toBe(202);

    // DOM validation: ensure we did not draw a snap-to guide line at x=200 (hidden operand edge).
    const vxs = await page.evaluate(() => (window as any).__snapGuideVX as number[]);
    expect(Array.isArray(vxs)).toBe(true);
    expect(vxs.some(v => Math.abs(v - 200) < 0.001)).toBe(false);
  });

  test('does not snap to hidden mask content (no false guides)', async ({ page, dispatchAction, getState }) => {
    // Disable slide/column snapping so only object snapping is in play.
    const s0 = await getState();
    const snapToSlide = s0?.editor?.snapToSlide;
    const snapToColumns = s0?.editor?.snapToColumns;
    const snapToObject = s0?.editor?.snapToObject;

    if (!ensureBoolean(snapToObject) || !ensureBoolean(snapToSlide) || !ensureBoolean(snapToColumns)) {
      throw new Error('Expected editor snap flags to be booleans');
    }

    if (!snapToObject) await dispatchAction('TOGGLE_SNAP_TO_OBJECT');
    if (snapToSlide) await dispatchAction('TOGGLE_SNAP_TO_SLIDE');
    if (snapToColumns) await dispatchAction('TOGGLE_SNAP_TO_COLUMNS');

    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });
    await dispatchAction('SET_ACTIVE_TOOL', 'select');

    // Seed a mask shape + content, then create a mask.
    await dispatchAction('ADD_ELEMENT', {
      id: 'content',
      type: 'rect',
      x: 160,
      y: 160,
      width: 360,
      height: 260,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#00aaff', opacity: 100, visible: true }] }
    });

    await dispatchAction('ADD_ELEMENT', {
      id: 'mask-shape',
      type: 'rect',
      x: 220,
      y: 200,
      width: 220,
      height: 160,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#000000', opacity: 100, visible: true }] }
    });

    await dispatchAction('UPDATE_SELECTION', ['mask-shape', 'content']);
    await dispatchAction('CREATE_MASK_FROM_SELECTION', { ids: ['mask-shape', 'content'] });

    // Add a movable rectangle.
    await dispatchAction('ADD_ELEMENT', {
      id: 'rect-c',
      type: 'rect',
      x: 320,
      y: 200,
      width: 100,
      height: 100,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#0000ff', opacity: 100, visible: true }] }
    });

    await dispatchAction('UPDATE_SELECTION', ['rect-c']);

    const s1 = await getState();
    expect(s1?.editor?.activeTool).toBe('select');
    expect(s1?.editor?.selectedElementIds).toEqual(['rect-c']);
    const slide = s1?.slides?.[s1?.editor?.activeSlideId];
    expect(slide).toBeTruthy();

    const content = slide?.elements?.['content'];
    expect(content).toBeTruthy();
    expect(typeof content.parentId).toBe('string');
    const parent = content?.parentId ? slide?.elements?.[content.parentId] : null;
    expect(parent).toBeTruthy();
    expect(parent.type).toBe('shape');
    expect(parent.shapeKind).toBe('mask');

    const contentAbs = getAbsoluteXY(slide, 'content');

    const viewportBounds = await page.locator('#viewport').boundingBox();
    expect(viewportBounds).toBeTruthy();

    const zoom = s1?.editor?.zoom ?? 1;
    const pan = s1?.editor?.pan ?? { x: 0, y: 0 };

    const toScreen = (wx: number, wy: number) => ({
      x: (viewportBounds as any).x + (pan.x + wx * zoom),
      y: (viewportBounds as any).y + (pan.y + wy * zoom)
    });

    // Drag rect-c so its left edge ends at (content.absX + 2) -> would snap to content.absX if hidden content is wrongly included.
    const startWorld = { x: 320 + 50, y: 200 + 50 };
    const endWorld = { x: (contentAbs.x + 2) + 50, y: 200 + 50 };

    await page.evaluate(() => (window as any).__snapTraceReset());

    const start = toScreen(startWorld.x, startWorld.y);
    const end = toScreen(endWorld.x, endWorld.y);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.waitForTimeout(50);
    await page.mouse.move(end.x, end.y, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(150);

    const s2 = await getState();
    const c = s2?.slides?.[s2?.editor?.activeSlideId]?.elements?.['rect-c'];
    expect(c).toBeTruthy();

    // Must NOT snap to hidden content edge.
    expect(c.x).toBe(contentAbs.x + 2);

    const vxs = await page.evaluate(() => (window as any).__snapGuideVX as number[]);
    expect(vxs.some(v => Math.abs(v - contentAbs.x) < 0.001)).toBe(false);
  });

  test('spacing snapping ignores hidden elements (no false equal-gap snap)', async ({ page, dispatchAction, getState }) => {
    const s0 = await getState();
    const snapToSlide = s0?.editor?.snapToSlide;
    const snapToColumns = s0?.editor?.snapToColumns;
    const snapToObject = s0?.editor?.snapToObject;

    if (!ensureBoolean(snapToObject) || !ensureBoolean(snapToSlide) || !ensureBoolean(snapToColumns)) {
      throw new Error('Expected editor snap flags to be booleans');
    }

    if (!snapToObject) await dispatchAction('TOGGLE_SNAP_TO_OBJECT');
    if (snapToSlide) await dispatchAction('TOGGLE_SNAP_TO_SLIDE');
    if (snapToColumns) await dispatchAction('TOGGLE_SNAP_TO_COLUMNS');

    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });
    await dispatchAction('SET_ACTIVE_TOOL', 'select');

    // Left visible neighbor.
    await dispatchAction('ADD_ELEMENT', {
      id: 'left-visible',
      type: 'rect',
      x: 100,
      y: 200,
      width: 100,
      height: 100,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#aaaaaa', opacity: 100, visible: true }] }
    });

    // Hidden element that would create a false equal-spacing snap if considered.
    await dispatchAction('ADD_ELEMENT', {
      id: 'right-hidden',
      type: 'rect',
      x: 400,
      y: 200,
      width: 100,
      height: 100,
      rotation: 0,
      hidden: true,
      style: { fills: [{ type: 'solid', value: '#bbbbbb', opacity: 100, visible: true }] }
    });

    // Movable element.
    await dispatchAction('ADD_ELEMENT', {
      id: 'rect-c',
      type: 'rect',
      x: 320,
      y: 200,
      width: 100,
      height: 100,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#0000ff', opacity: 100, visible: true }] }
    });

    await dispatchAction('UPDATE_SELECTION', ['rect-c']);

    const s1 = await getState();
    expect(s1?.editor?.activeTool).toBe('select');
    expect(s1?.editor?.selectedElementIds).toEqual(['rect-c']);

    const viewportBounds = await page.locator('#viewport').boundingBox();
    expect(viewportBounds).toBeTruthy();

    const zoom = s1?.editor?.zoom ?? 1;
    const pan = s1?.editor?.pan ?? { x: 0, y: 0 };
    const toScreen = (wx: number, wy: number) => ({
      x: (viewportBounds as any).x + (pan.x + wx * zoom),
      y: (viewportBounds as any).y + (pan.y + wy * zoom)
    });

    // Drag rect-c so its left edge ends at 248. If the hidden right element is incorrectly included,
    // equal-gap spacing would snap it to 250.
    const startWorld = { x: 320 + 50, y: 200 + 50 };
    const endWorld = { x: 248 + 50, y: 200 + 50 };

    const start = toScreen(startWorld.x, startWorld.y);
    const end = toScreen(endWorld.x, endWorld.y);

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.waitForTimeout(50);
    await page.mouse.move(end.x, end.y, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(150);

    const s2 = await getState();
    const c = s2?.slides?.[s2?.editor?.activeSlideId]?.elements?.['rect-c'];
    expect(c).toBeTruthy();
    expect(c.x).toBe(248);
  });
});
