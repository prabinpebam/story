import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('UI: Boolean result-derived bounds', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    await expect(editor.propertyInspector).toBeVisible();
  });

  test('boolean x/y/width/height match intersect result bounds', async ({ dispatchAction, getState }) => {
    // Two overlapping rectangles.
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

    const state = await getState();
    const booleanId = state?.editor?.selectedElementIds?.[0];
    expect(booleanId).toBeTruthy();

    const slide = state?.slides?.[state?.editor?.activeSlideId];
    const booleanEl = slide?.elements?.[booleanId];

    expect(booleanEl).toBeTruthy();

    // Expected overlap bounds:
    // x: max(200,280)=280, y: max(200,240)=240
    // w: min(400,480)-280=120, h: min(340,380)-240=100
    expect(booleanEl.x).toBe(280);
    expect(booleanEl.y).toBe(240);
    expect(booleanEl.width).toBe(120);
    expect(booleanEl.height).toBe(100);
  });
});
