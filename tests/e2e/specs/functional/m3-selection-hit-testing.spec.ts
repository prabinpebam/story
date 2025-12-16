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
});
