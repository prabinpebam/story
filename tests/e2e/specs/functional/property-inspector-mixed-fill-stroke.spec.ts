import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';
import { dispatchAction, getState, waitForState } from '../../utils';

test.describe('Property Inspector: mixed state (Fill/Stroke)', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);

    await editor.goto();
    await editor.waitForLoad();
  });

  test('PI02: Fill hex shows Mixed and applies edits to all selected', async ({ page }) => {
    const before = await getState(page);
    const slideId = before.editor.activeSlideId;
    const idsBefore = new Set(Object.keys(before.slides?.[slideId!]?.elements || {}));
    const countBefore = idsBefore.size;

    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.10, 0.12, 0.12, 0.16);

    const mid = await getState(page);
    if (mid.editor?.activeTool !== 'shape') {
      await editor.setActiveTool('shape');
    }

    await canvas.drawRectangle(0.30, 0.12, 0.12, 0.16);

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

    // Seed different fills (same structure)
    const el0 = afterCreate.slides?.[sid!]?.elements?.[createdIds[0]];
    const el1 = afterCreate.slides?.[sid!]?.elements?.[createdIds[1]];

    await dispatchAction(page, 'UPDATE_ELEMENT', {
      id: createdIds[0],
      style: {
        ...(el0?.style || {}),
        fills: [{ type: 'solid', color: '#FF0000', value: '#FF0000', opacity: 100, visible: true }],
        backgroundColor: '#FF0000'
      }
    });

    await dispatchAction(page, 'UPDATE_ELEMENT', {
      id: createdIds[1],
      style: {
        ...(el1?.style || {}),
        fills: [{ type: 'solid', color: '#00FF00', value: '#00FF00', opacity: 100, visible: true }],
        backgroundColor: '#00FF00'
      }
    });

    // Deterministically multi-select
    await dispatchAction(page, 'UPDATE_SELECTION', createdIds);

    const fillHex = page.locator('[data-testid="fill-hex-0"]');
    await expect(fillHex).toHaveClass(/mixed/);
    await expect(fillHex).toHaveAttribute('placeholder', 'Mixed');

    await fillHex.click();
    await fillHex.fill('0000FF');
    await fillHex.blur();

    await waitForState(
      page,
      (state) => {
        const sid2 = state.editor.activeSlideId;
        const elements = state.slides?.[sid2!]?.elements || {};
        return createdIds.every((id) => (elements[id]?.style?.fills?.[0]?.color || '').toUpperCase() === '#0000FF');
      },
      5_000
    );
  });

  test('PI03: Stroke opacity shows Mixed and applies edits to all selected', async ({ page }) => {
    const before = await getState(page);
    const slideId = before.editor.activeSlideId;
    const idsBefore = new Set(Object.keys(before.slides?.[slideId!]?.elements || {}));
    const countBefore = idsBefore.size;

    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.10, 0.35, 0.12, 0.16);

    const mid = await getState(page);
    if (mid.editor?.activeTool !== 'shape') {
      await editor.setActiveTool('shape');
    }

    await canvas.drawRectangle(0.30, 0.35, 0.12, 0.16);

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

    const strokeBase = {
      color: '#000000',
      width: 1,
      opacity: 25,
      position: 'center',
      visible: true
    };

    await dispatchAction(page, 'UPDATE_ELEMENT', {
      id: createdIds[0],
      style: {
        ...(el0?.style || {}),
        strokes: [{ ...strokeBase, opacity: 25 }],
        borderColor: '#000000',
        borderWidth: 1,
        strokeAlign: 'center'
      }
    });

    await dispatchAction(page, 'UPDATE_ELEMENT', {
      id: createdIds[1],
      style: {
        ...(el1?.style || {}),
        strokes: [{ ...strokeBase, opacity: 60 }],
        borderColor: '#000000',
        borderWidth: 1,
        strokeAlign: 'center'
      }
    });

    await dispatchAction(page, 'UPDATE_SELECTION', createdIds);

    const strokeOpacity = page.locator('[data-testid="stroke-opacity-0"] input.pi-input');
    await expect(strokeOpacity).toHaveClass(/mixed/);
    await expect(strokeOpacity).toHaveAttribute('placeholder', 'Mixed');

    await strokeOpacity.click();
    await strokeOpacity.fill('80');
    await strokeOpacity.blur();

    await waitForState(
      page,
      (state) => {
        const sid2 = state.editor.activeSlideId;
        const elements = state.slides?.[sid2!]?.elements || {};
        return createdIds.every((id) => (elements[id]?.style?.strokes?.[0]?.opacity || 0) === 80);
      },
      5_000
    );
  });
});
