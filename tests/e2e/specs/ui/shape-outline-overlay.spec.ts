import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('UI: Shape outline overlays (canvas path vs bounding box)', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    // Install a lightweight trace recorder for calls made on #interaction-canvas' 2D context.
    await page.addInitScript(() => {
      const trace: Record<string, number> = {
        strokeRect: 0,
        arc: 0,
        bezierCurveTo: 0,
        quadraticCurveTo: 0,
        lineTo: 0,
        moveTo: 0,
        beginPath: 0,
        closePath: 0,
        stroke: 0
      };

      (window as any).__overlayTrace = trace;
      (window as any).__overlayTraceReset = () => {
        for (const k of Object.keys(trace)) trace[k] = 0;
      };

      const origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (...args: any[]) {
        const ctx: any = (origGetContext as any).apply(this, args);
        try {
          const type = args[0];
          if (type === '2d' && (this as any)?.id === 'interaction-canvas' && ctx && !ctx.__overlayTracePatched) {
            ctx.__overlayTracePatched = true;
            const methods = [
              'strokeRect',
              'arc',
              'bezierCurveTo',
              'quadraticCurveTo',
              'lineTo',
              'moveTo',
              'beginPath',
              'closePath',
              'stroke'
            ];
            for (const m of methods) {
              const orig = ctx[m];
              if (typeof orig !== 'function') continue;
              ctx[m] = function (...mArgs: any[]) {
                const t = (window as any).__overlayTrace;
                if (t && typeof t[m] === 'number') t[m]++;
                return orig.apply(this, mArgs);
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
    canvas = new CanvasHelper(page);
    await editor.goto();
    await editor.waitForLoad();

    await expect(page.locator('#interaction-canvas')).toBeVisible();
  });

  test('hover on a shape strokes path outline (no bounding-box strokeRect)', async ({ page, getState, dispatchAction }) => {
    // Create an ellipse (uses cubic segments in ParametricToPaths).
    await page.keyboard.press('o');
    await canvas.drag(0.25, 0.25, 0.45, 0.42);

    const stateAfterCreate = await getState();
    const selectedId = stateAfterCreate?.editor?.selectedElementIds?.[0];
    expect(selectedId).toBeTruthy();

    // Hover only draws when not selected.
    await dispatchAction('UPDATE_SELECTION', []);

    // Move away to ensure we're not hovering the shape.
    const away = await canvas.normalizedToAbsolute(0.05, 0.05);
    await page.mouse.move(away.x, away.y);
    await page.waitForTimeout(100);

    await page.evaluate(() => (window as any).__overlayTraceReset());

    // Hover the shape center.
    const center = await canvas.normalizedToAbsolute(0.35, 0.335);
    await page.mouse.move(center.x, center.y);
    await page.waitForTimeout(250);

    const t = await page.evaluate(() => (window as any).__overlayTrace);

    // Path outline should be drawn via bezier curves (ellipse) and then stroked.
    expect(t.bezierCurveTo).toBeGreaterThan(0);
    expect(t.stroke).toBeGreaterThan(0);

    // Hover outline for shapes must not use the bounding-box strokeRect.
    expect(t.strokeRect).toBe(0);
  });

  test('selection on a shape draws selection box + path outline', async ({ page, getState, dispatchAction }) => {
    // Create an ellipse.
    await page.keyboard.press('o');
    await canvas.drag(0.55, 0.25, 0.75, 0.42);

    const stateAfterCreate = await getState();
    const selectedId = stateAfterCreate?.editor?.selectedElementIds?.[0];
    expect(selectedId).toBeTruthy();

    // Ensure the element is selected (creation should have done this, but keep the intent explicit).
    await dispatchAction('UPDATE_SELECTION', [selectedId]);

    await page.evaluate(() => (window as any).__overlayTraceReset());
    await page.waitForTimeout(250);

    const t = await page.evaluate(() => (window as any).__overlayTrace);

    // Existing selection box remains (bounding box strokeRect).
    expect(t.strokeRect).toBeGreaterThan(0);

    // Shapes also get a path outline highlight.
    expect(t.bezierCurveTo).toBeGreaterThan(0);
    expect(t.stroke).toBeGreaterThan(0);
  });

  test('selection overlay shows corner-radius handles only for rectangles', async ({ page }) => {
    // Ellipse selection should NOT show corner-radius handles.
    await page.keyboard.press('o');
    await canvas.drag(0.25, 0.55, 0.45, 0.75);

    await page.evaluate(() => (window as any).__overlayTraceReset());
    await page.waitForTimeout(250);
    let t = await page.evaluate(() => (window as any).__overlayTrace);
    expect(t.arc).toBe(0);

    // Rectangle selection SHOULD show corner-radius handles.
    await page.keyboard.press('r');
    await canvas.drag(0.55, 0.55, 0.8, 0.8);

    await page.evaluate(() => (window as any).__overlayTraceReset());
    await page.waitForTimeout(250);
    t = await page.evaluate(() => (window as any).__overlayTrace);
    expect(t.arc).toBeGreaterThan(0);
  });

  test('hover on a boolean strokes derived path outline (no bounding-box strokeRect)', async ({ page, dispatchAction, getState }) => {
    // Two overlapping rectangles, then intersect boolean.
    await dispatchAction('ADD_ELEMENT', {
      id: 'rect-a',
      type: 'rect',
      x: 200,
      y: 200,
      width: 220,
      height: 160,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#ff0000', opacity: 100, visible: true }] }
    });

    await dispatchAction('ADD_ELEMENT', {
      id: 'rect-b',
      type: 'rect',
      x: 300,
      y: 260,
      width: 220,
      height: 160,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#00ff00', opacity: 100, visible: true }] }
    });

    await dispatchAction('UPDATE_SELECTION', ['rect-a', 'rect-b']);
    await dispatchAction('CREATE_BOOLEAN_FROM_SELECTION', { ids: ['rect-a', 'rect-b'], operation: 'intersect' });

    const state = await getState();
    const booleanId = state?.editor?.selectedElementIds?.[0];
    expect(booleanId).toBeTruthy();

    const slide = state?.slides?.[state?.editor?.activeSlideId];
    const booleanEl = slide?.elements?.[booleanId as string];
    expect(booleanEl).toBeTruthy();

    // Hover only draws when not selected.
    await dispatchAction('UPDATE_SELECTION', []);

    const canvasBounds = await page.locator('#interaction-canvas').boundingBox();
    expect(canvasBounds).toBeTruthy();

    // Move away to ensure we're not hovering the boolean.
    await page.mouse.move((canvasBounds as any).x + 10, (canvasBounds as any).y + 10);
    await page.waitForTimeout(100);

    await page.evaluate(() => (window as any).__overlayTraceReset());

    const zoom = state?.editor?.zoom ?? 1;
    const pan = state?.editor?.pan ?? { x: 0, y: 0 };

    // Hover the boolean center in canvas coordinates.
    const wx = booleanEl.x + booleanEl.width / 2;
    const wy = booleanEl.y + booleanEl.height / 2;
    const cx = (canvasBounds as any).x + (pan.x + wx * zoom);
    const cy = (canvasBounds as any).y + (pan.y + wy * zoom);
    await page.mouse.move(cx, cy);
    await page.waitForTimeout(250);

    const t = await page.evaluate(() => (window as any).__overlayTrace);

    // Boolean hover should outline the derived path, not just strokeRect.
    expect(t.stroke).toBeGreaterThan(0);
    expect(t.lineTo + t.bezierCurveTo + t.quadraticCurveTo).toBeGreaterThan(0);
    expect(t.strokeRect).toBe(0);
  });
});
