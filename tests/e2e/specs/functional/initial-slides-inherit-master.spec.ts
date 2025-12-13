import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('Initial slides inherit Master preset (no slide overrides)', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('IS01: slide-1 and slide-2 have no theme/typography overrides; text color remains editable when typography is linked', async ({ getState, page }) => {
    const state = await getState();

    // 1) The initial two slides should not override theme/typography at the slide level.
    const slide1 = state.slides?.['slide-1'];
    const slide2 = state.slides?.['slide-2'];

    expect(slide1?.colorThemeId ?? null).toBe(null);
    expect(slide1?.typographyStyleId ?? null).toBe(null);
    expect(slide1?.styleAssignments?.colorTheme ?? null).toBe(null);
    expect(slide1?.styleAssignments?.typographyStyle ?? null).toBe(null);

    expect(slide2?.colorThemeId ?? null).toBe(null);
    expect(slide2?.typographyStyleId ?? null).toBe(null);
    expect(slide2?.styleAssignments?.colorTheme ?? null).toBe(null);
    expect(slide2?.styleAssignments?.typographyStyle ?? null).toBe(null);

    // 2) The default master should reference an existing preset theme (no made-up "Default" theme).
    const masterDefault = state.slideMasterPresets?.['master-default'];
    expect(masterDefault?.type).toBe('slideMasterPreset');
    expect(masterDefault?.colorThemeId).toMatch(/^preset_/);

    // 3) Select the title placeholder on slide 1 and assert text color UI is enabled.
    const slideView = editor.canvas.locator('[data-testid="slide-view"]').first();
    await expect(slideView).toBeVisible();

    const title = slideView.locator('[data-is-placeholder="true"][data-placeholder-type="title"]').first();
    await expect(title).toBeVisible();

    // Click selection can be intercepted by the interaction canvas; use store-driven selection.
    await editor.dispatchAction('UPDATE_SELECTION', ['placeholder-title']);
    await page.waitForTimeout(150);

    // Text color should NOT be disabled when a typography style (textStyleId) is applied.
    await expect(editor.textColorHex).toBeEnabled();

    // Placeholder should be theme-linked by default (so DOM exposes the themeSlot linkage).
    await expect(title).toHaveAttribute('data-text-fill-type', 'solid');
    await expect(title).toHaveAttribute('data-text-fill-theme-slot', /\d+/);

    // 4) User can override to a custom color even while typography style is linked.
    await editor.textColorHex.fill('');
    await editor.textColorHex.fill('#ff0000');
    await editor.textColorHex.dispatchEvent('change');

    await expect.poll(async () => {
      const s = await getState();
      const el = s.slides?.['slide-1']?.elements?.['placeholder-title'];
      return el?.textFill?.value || null;
    }, { timeout: 2000 }).toBe('#ff0000');

    // After a custom override, the rendered DOM should no longer claim themeSlot linkage.
    await expect(title).not.toHaveAttribute('data-text-fill-theme-slot', /\d+/);

    // Sanity: computed color reflects the override.
    const computed = await title.evaluate((el) => getComputedStyle(el).color);
    expect(computed).toBe('rgb(255, 0, 0)');
  });
});
