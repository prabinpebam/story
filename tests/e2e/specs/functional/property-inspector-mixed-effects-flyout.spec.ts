import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';
import { dispatchAction, getState, waitForState } from '../../utils';

test.describe('Property Inspector: mixed state (Effects flyout)', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);

    await editor.goto();
    await editor.waitForLoad();
  });

  test('PI04: shadow X shows Mixed and applies edits to all selected', async ({ page }) => {
    const before = await getState(page);
    const slideId = before.editor.activeSlideId;
    const idsBefore = new Set(Object.keys(before.slides?.[slideId!]?.elements || {}));
    const countBefore = idsBefore.size;

    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.10, 0.55, 0.12, 0.16);

    const mid = await getState(page);
    if (mid.editor?.activeTool !== 'shape') {
      await editor.setActiveTool('shape');
    }

    await canvas.drawRectangle(0.30, 0.55, 0.12, 0.16);

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
    const sid = afterCreate.editor.activeSlideId;
    const idsAfter = Object.keys(afterCreate.slides?.[sid!]?.elements || {});
    const createdIds = idsAfter.filter((id) => !idsBefore.has(id));
    expect(createdIds.length).toBe(2);

    const el0 = afterCreate.slides?.[sid!]?.elements?.[createdIds[0]];
    const el1 = afterCreate.slides?.[sid!]?.elements?.[createdIds[1]];

    const shadowBase = {
      type: 'dropShadow',
      y: 4,
      blur: 8,
      spread: 0,
      color: '#000000',
      opacity: 25,
      blendMode: 'normal',
      visible: true,
    };

    // Seed aligned effects stacks with different X to force Mixed
    await dispatchAction(page, 'UPDATE_ELEMENT', {
      id: createdIds[0],
      style: {
        ...(el0?.style || {}),
        effects: [{ id: 'fx-0', ...shadowBase, x: 0 }],
      },
    });

    await dispatchAction(page, 'UPDATE_ELEMENT', {
      id: createdIds[1],
      style: {
        ...(el1?.style || {}),
        effects: [{ id: 'fx-1', ...shadowBase, x: 10 }],
      },
    });

    await dispatchAction(page, 'UPDATE_SELECTION', createdIds);

    // Open effects flyout for index 0
    await page.locator('[data-testid="effect-row-0"]').click();

    const xInput = page.locator('[data-testid="effect-idx-0-shadow-x"] input.pi-input');
    await expect(xInput).toHaveClass(/mixed/);
    await expect(xInput).toHaveAttribute('placeholder', 'Mixed');

    await xInput.click();
    await xInput.fill('20');
    await xInput.blur();

    await waitForState(
      page,
      (state) => {
        const sid2 = state.editor.activeSlideId;
        const elements = state.slides?.[sid2!]?.elements || {};
        return createdIds.every((id) => (elements[id]?.style?.effects?.[0]?.x ?? null) === 20);
      },
      5_000
    );
  });
});
