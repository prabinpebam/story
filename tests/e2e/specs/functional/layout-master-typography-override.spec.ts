import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * Regression: Typography style override in Layout Masters (Master view) must work.
 *
 * We apply a different typography preset to an active Layout Master and assert:
 * - the layout master's typographyStyleId updates
 * - a placeholder text element (title) reflects the new preset's fontSize
 */

test.describe('Layout master typography override', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('applies typography preset to layout master and updates rendered placeholder', async ({ page, getState }) => {
    await editor.editMaster();

    // Select first layout under the first master
    const layoutItem = page.locator('[data-testid="slide-list-item"]').nth(1);
    await layoutItem.click();

    const state1 = await getState();
    const layoutId = state1.editor.activeMasterId as string;
    const layout = state1.slideMasterPresets?.[layoutId];
    expect(layout).toBeTruthy();
    expect(layout.type).toBe('layoutMaster');

    // Find a title placeholder to validate via computed fontSize.
    const titlePlaceholderId = Object.keys(layout.elements || {}).find((id) => {
      const el = layout.elements[id];
      return el?.type === 'text' && (el.placeholderType === 'title' || el.textStyleId === 'title');
    });

    expect(titlePlaceholderId, 'Expected a title placeholder in the layout master').toBeTruthy();

    const titleEl = page.locator('#canvas-container').locator(`#${titlePlaceholderId}`);
    await expect(titleEl).toBeVisible();

    const fontSizeBefore = await titleEl.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    // Open typography manager and apply a different preset.
    await page.locator('[data-testid="typography-manager-btn"]').click();
    const professionalCard = page.locator('.tsm-preset-card', { hasText: 'Professional' });
    await expect(professionalCard).toBeVisible();
    await professionalCard.click();

    await expect
      .poll(async () => {
        const s = await getState();
        return s.slideMasterPresets?.[layoutId]?.typographyStyleId;
      })
      .toBe('typo-style-professional');

    const state2 = await getState();
    const preset = state2.typographyStylePresets?.['typo-style-professional'];
    expect(preset).toBeTruthy();

    // Determine expected font size from the preset + element's textStyleId.
    const textStyleId = state2.slideMasterPresets?.[layoutId]?.elements?.[titlePlaceholderId!]?.textStyleId || 'title';
    const expectedFontSize = preset.textStyles?.[textStyleId]?.fontSize;
    expect(typeof expectedFontSize).toBe('number');

    const fontSizeAfter = await titleEl.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

    expect(fontSizeAfter).not.toBe(fontSizeBefore);
    expect(fontSizeAfter).toBe(expectedFontSize);
  });
});
