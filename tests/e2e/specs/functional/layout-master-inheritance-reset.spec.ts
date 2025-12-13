import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * TDD: Layout Masters should have the same inherit/reset mechanics as slides.
 * Hierarchy: Master slide → Layout master → Slide
 */

test.describe('Layout master inheritance + reset (UI)', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('Layout guides: layout master can inherit and reset to parent master', async ({ page, getState }) => {
    await editor.editMaster();

    const section = editor.propertyInspector.locator('[data-testid="layout-guide-section"]');
    await expect(section).toBeVisible();

    // Select master root and set a distinctive margin.
    await page.locator('[data-testid="slide-list-item"]').first().click();
    const marginAllInput = section.locator('[data-testid="layout-guide-margin-all"] input');
    await marginAllInput.fill('80');
    await marginAllInput.press('Enter');

    const stateAfterMaster = await getState();
    const masterId = stateAfterMaster.editor.activeMasterId as string;

    // Select first layout under that master.
    await page.locator('[data-testid="slide-list-item"]').nth(1).click();
    const stateLayout = await getState();
    const layoutId = stateLayout.editor.activeMasterId as string;

    // Inherited UI visible on layout, reset hidden.
    const inheritedBadge = section.locator('[data-testid="layout-guide-inherited-badge"]');
    const resetBtn = section.locator('[data-testid="layout-guide-reset-btn"]');

    await expect(inheritedBadge).toBeVisible();
    await expect(resetBtn).toBeHidden();

    // Layout should reflect parent margin initially.
    await expect(marginAllInput).toHaveValue('80');

    // Change margin on layout (creates override)
    await marginAllInput.fill('120');
    await marginAllInput.press('Enter');

    await expect(inheritedBadge).toBeHidden();
    await expect(resetBtn).toBeVisible();

    const stateAfterOverride = await getState();
    expect(stateAfterOverride.slideMasterPresets?.[layoutId]?.layoutGuide).toBeTruthy();

    // Reset to inherited should remove override and restore parent margin
    await resetBtn.click();

    await expect(inheritedBadge).toBeVisible();
    await expect(resetBtn).toBeHidden();
    await expect(marginAllInput).toHaveValue('80');

    const stateAfterReset = await getState();
    expect(stateAfterReset.slideMasterPresets?.[layoutId]?.layoutGuide).toBeNull();

    // Sanity: parent master remained intact
    expect(stateAfterReset.slideMasterPresets?.[masterId]?.layoutGuide).toBeTruthy();
  });

  test('Colors + Typography: layout master shows inherited and can reset overrides', async ({ page, getState, dispatchAction }) => {
    await editor.editMaster();

    // Select first layout under the first master.
    await page.locator('[data-testid="slide-list-item"]').nth(1).click();
    const state1 = await getState();
    const layoutId = state1.editor.activeMasterId as string;

    const colorBadge = page.locator('[data-testid="color-theme-inherited-badge"]');
    const colorReset = page.locator('[data-testid="color-theme-reset-btn"]');

    const typoBadge = page.locator('[data-testid="typography-inherited-badge"]');
    const typoReset = page.locator('[data-testid="typography-reset-btn"]');

    // Initially, layout inherits both.
    await expect(colorBadge).toBeVisible();
    await expect(colorReset).toBeHidden();

    await expect(typoBadge).toBeVisible();
    await expect(typoReset).toBeHidden();

    // Create overrides directly (we only validate UI + reset mechanics here).
    await dispatchAction('UPDATE_MASTER_STYLE_ASSIGNMENTS', {
      masterId: layoutId,
      styleAssignments: {
        colorTheme: 'preset_sunset_boulevard',
        typographyStyle: 'typo-style-professional'
      }
    });

    await expect
      .poll(async () => {
        const s = await getState();
        return {
          color: s.slideMasterPresets?.[layoutId]?.colorThemeId,
          typo: s.slideMasterPresets?.[layoutId]?.typographyStyleId
        };
      })
      .toEqual({ color: 'preset_sunset_boulevard', typo: 'typo-style-professional' });

    // Now should show override UI for layout master.
    await expect(colorBadge).toBeHidden();
    await expect(colorReset).toBeVisible();

    await expect(typoBadge).toBeHidden();
    await expect(typoReset).toBeVisible();

    // Reset both and ensure they return to inherited.
    await colorReset.click();
    await typoReset.click();

    await expect
      .poll(async () => {
        const s = await getState();
        return {
          color: s.slideMasterPresets?.[layoutId]?.colorThemeId,
          typo: s.slideMasterPresets?.[layoutId]?.typographyStyleId
        };
      })
      .toEqual({ color: null, typo: null });

    await expect(colorBadge).toBeVisible();
    await expect(colorReset).toBeHidden();

    await expect(typoBadge).toBeVisible();
    await expect(typoReset).toBeHidden();
  });
});
