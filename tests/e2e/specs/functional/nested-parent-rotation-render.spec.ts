import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('Rendering: nested parent rotation positions children', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('child left/top is computed via parent center-pivot rotation', async ({ dispatchAction, getState }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;
    expect(baseSlide?.id).toBeTruthy();

    const slideId = 'slide-nested-rotation-render-test';

    const parentId = 'parent-rot-1';
    const childId = 'child-rot-1';

    const parent = {
      id: parentId,
      type: 'shape',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      rotation: 90,
      fill: { type: 'solid', color: '#3B82F6' },
      stroke: null,
      cornerRadius: 0,
      opacity: 1
    };

    const child = {
      id: childId,
      type: 'shape',
      x: 0,
      y: 0,
      width: 20,
      height: 10,
      rotation: 0,
      parentId,
      fill: { type: 'solid', color: '#F59E0B' },
      stroke: null,
      cornerRadius: 0,
      opacity: 1
    };

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'Nested Rotation Render Test',
      elements: [parent, child],
      elementOrder: [parentId, childId]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });

    const slideView = editor.canvas.locator('[data-testid="slide-view"]').first();
    await expect(slideView).toBeVisible();

    const childEl = slideView.locator(`[data-element-id="${childId}"]`).first();
    await expect(childEl).toBeVisible();

    // Expected (see unit test for derivation): left=235px, top=55px, rotation=90deg
    const left = await childEl.evaluate((el) => (el as HTMLElement).style.left);
    const top = await childEl.evaluate((el) => (el as HTMLElement).style.top);
    const transform = await childEl.evaluate((el) => (el as HTMLElement).style.transform);

    expect(left).toBe('235px');
    expect(top).toBe('55px');
    expect(transform).toBe('rotate(90deg)');
  });
});
