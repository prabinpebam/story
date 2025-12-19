import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';
import { dispatchAction, getState, waitForState } from '../../utils';

test.describe('Property Inspector: mixed state', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);

    await editor.goto();
    await editor.waitForLoad();
  });

  test('PI01: Layout width shows Mixed and applies edits to all selected', async ({ page }) => {
    const before = await getState(page);
    const slideId = before.editor.activeSlideId;
    const idsBefore = new Set(Object.keys(before.slides?.[slideId!]?.elements || {}));
    const countBefore = idsBefore.size;

    // Create two rectangles with different widths
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.10, 0.12, 0.10, 0.16); // smaller

    const mid = await getState(page);
    if (mid.editor?.activeTool !== 'shape') {
      await editor.setActiveTool('shape');
    }

    await canvas.drawRectangle(0.30, 0.12, 0.16, 0.16); // bigger

    await waitForState(
      page,
      (state) => {
        const sid = state.editor.activeSlideId;
        const count = Object.keys(state.slides?.[sid!]?.elements || {}).length;
        return count >= countBefore + 2;
      },
      5_000
    );

    const afterCreate = await getState(page);
    const idsAfter = Object.keys(afterCreate.slides?.[afterCreate.editor.activeSlideId!]?.elements || {});
    const createdIds = idsAfter.filter((id) => !idsBefore.has(id));
    expect(createdIds.length).toBe(2);

    // Deterministically multi-select the two rectangles
    await dispatchAction(page, 'UPDATE_SELECTION', createdIds);

    // Width should show mixed
    const widthInput = page.locator('[data-testid="layout-width"] input.pi-input');
    await expect(widthInput).toHaveClass(/mixed/);
    await expect(widthInput).toHaveAttribute('placeholder', 'Mixed');

    // Editing width applies to both elements
    await widthInput.click();
    await widthInput.fill('300');
    await widthInput.blur();

    await waitForState(
      page,
      (state) => {
        const sid = state.editor.activeSlideId;
        const elements = state.slides?.[sid!]?.elements || {};
        return createdIds.every((id) => Math.round(elements[id]?.width || 0) === 300);
      },
      5_000
    );

    const finalState = await getState(page);
    const elements = finalState.slides?.[finalState.editor.activeSlideId!]?.elements || {};
    expect(Math.round(elements[createdIds[0]]?.width || 0)).toBe(300);
    expect(Math.round(elements[createdIds[1]]?.width || 0)).toBe(300);
  });
});
