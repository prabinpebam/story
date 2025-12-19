import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';
import { dispatchAction, getState, waitForState } from '../../utils';

test.describe('Position: Flip', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);

    await editor.goto();
    await editor.waitForLoad();
  });

  test('PI05: Flip H toggles flipX on selection', async ({ page }) => {
    const before = await getState(page);
    const slideId = before.editor.activeSlideId;
    const idsBefore = new Set(Object.keys(before.slides?.[slideId!]?.elements || {}));
    const countBefore = idsBefore.size;

    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.15, 0.18, 0.18, 0.18);

    await waitForState(
      page,
      (state) => {
        const sid = state.editor.activeSlideId;
        const count = Object.keys(state.slides?.[sid!]?.elements || {}).length;
        return count >= countBefore + 1;
      },
      5_000
    );

    const mid = await getState(page);
    const sid = mid.editor.activeSlideId;
    const idsAfter = Object.keys(mid.slides?.[sid!]?.elements || {});
    const createdIds = idsAfter.filter((id) => !idsBefore.has(id));
    expect(createdIds.length).toBe(1);

    await dispatchAction(page, 'UPDATE_SELECTION', createdIds);

    // Flip H
    await page.locator('[data-testid="position-flip-h"]').click();

    await waitForState(
      page,
      (state) => {
        const sid2 = state.editor.activeSlideId;
        const el = state.slides?.[sid2!]?.elements?.[createdIds[0]];
        return el?.flipX === true;
      },
      5_000
    );

    // Flip H again (toggle off)
    await page.locator('[data-testid="position-flip-h"]').click();

    await waitForState(
      page,
      (state) => {
        const sid2 = state.editor.activeSlideId;
        const el = state.slides?.[sid2!]?.elements?.[createdIds[0]];
        return !el?.flipX;
      },
      5_000
    );
  });
});
