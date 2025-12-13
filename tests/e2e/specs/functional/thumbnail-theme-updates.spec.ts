import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * Regression: Slide thumbnails must update every time the Color Theme changes.
 *
 * We force the slide background to be theme-slot linked with a loud fallback color.
 * If per-slide theme CSS variables are applied correctly inside thumbnails,
 * the rendered background should NOT match the fallback and should change
 * whenever the slide's colorTheme assignment changes.
 */

test.describe('Thumbnail theme updates', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('updates thumbnail background on every theme change', async ({ page, getState, dispatchAction }) => {
    const state0 = await getState();
    const slideId = state0.editor.activeSlideId as string;

    // Force a theme-slot background with a strong fallback to detect missing CSS vars.
    await dispatchAction('UPDATE_SLIDE', {
      id: slideId,
      background: {
        type: 'solid',
        themeSlot: 4,
        value: '#00FF00'
      }
    });

    const thumbBg = page.locator('[data-testid="slide-thumbnail-0"] .slide-thumbnail-preview [data-testid="slide-bg-layer-0"]');
    await expect(thumbBg).toBeVisible();

    const readBg = async () => {
      return await thumbBg.evaluate((el) => getComputedStyle(el).backgroundColor);
    };

    const bg0 = await readBg();

    // If theme vars weren't applied, we'd see the fallback green.
    expect(bg0).not.toBe('rgb(0, 255, 0)');

    // Change 1
    await dispatchAction('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
      slideId,
      styleAssignments: { colorTheme: 'preset_electric_dreams' }
    });

    await expect
      .poll(async () => {
        const s = await getState();
        return s.slides?.[slideId]?.styleAssignments?.colorTheme;
      })
      .toBe('preset_electric_dreams');

    const bg1 = await readBg();
    expect(bg1).not.toBe(bg0);

    // Change 2 (must update again)
    await dispatchAction('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
      slideId,
      styleAssignments: { colorTheme: 'preset_sunset_boulevard' }
    });

    await expect
      .poll(async () => {
        const s = await getState();
        return s.slides?.[slideId]?.styleAssignments?.colorTheme;
      })
      .toBe('preset_sunset_boulevard');

    const bg2 = await readBg();
    expect(bg2).not.toBe(bg1);
  });
});
