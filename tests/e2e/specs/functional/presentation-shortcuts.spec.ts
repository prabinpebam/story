import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

// Keyboard shortcut routing lives in src/main.js.
// These tests validate that displayed shortcuts are actually functional.

test.describe('Presentation keyboard shortcuts', () => {
  test('Ctrl+Enter starts presentation (from beginning)', async ({ page, getState, dispatchAction }) => {
    const editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    // Ensure we have at least one slide.
    const state = await getState();
    if ((state.slideOrder?.length || 0) === 0) {
      await dispatchAction('ADD_SLIDE');
    }

    await page.keyboard.press('Control+Enter');

    await expect
      .poll(async () => (await getState()).editor.mode, { timeout: 5000 })
      .toBe('presentation');

    // Exit cleanly.
    await page.keyboard.press('Escape');
    await expect
      .poll(async () => (await getState()).editor.mode, { timeout: 5000 })
      .toBe('edit');
  });

  test('Ctrl+Shift+Enter starts presentation (from current slide)', async ({ page, getState, dispatchAction }) => {
    const editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    // Ensure we have at least 2 slides.
    let state = await getState();
    while ((state.slideOrder?.length || 0) < 2) {
      await dispatchAction('ADD_SLIDE');
      state = await getState();
    }

    const slide2Id = (state.slideOrder as string[])[1];
    await dispatchAction('SET_ACTIVE_SLIDE', slide2Id);

    await expect
      .poll(async () => (await getState()).editor.activeSlideId, { timeout: 3000 })
      .toBe(slide2Id);

    await page.keyboard.press('Control+Shift+Enter');

    await expect
      .poll(async () => (await getState()).editor.mode, { timeout: 5000 })
      .toBe('presentation');

    await expect
      .poll(async () => (await getState()).presentation.currentSlideIndex, { timeout: 5000 })
      .toBe(1);

    await page.keyboard.press('Escape');
    await expect
      .poll(async () => (await getState()).editor.mode, { timeout: 5000 })
      .toBe('edit');
  });
});
