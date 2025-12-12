import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * M6: Layout Picker grouped by master (Normal Edit Mode)
 * - Layout flyout shows master group headers
 * - Selecting a layout is still a single-step action
 */

test.describe('Layout Picker - Grouped By Master', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('shows master group headers and updates slide layout on selection', async ({ page, getState }) => {
    const stateBefore = await getState();
    expect(stateBefore.editor.mode).toBe('edit');

    const beforeLayoutId = stateBefore.slides[stateBefore.editor.activeSlideId]?.layoutId;
    expect(beforeLayoutId).toBeTruthy();

    // Open layout flyout from Slide PI
    const trigger = editor.propertyInspector.locator('.layout-trigger-btn');
    await expect(trigger).toBeVisible();
    await trigger.click();

    const flyout = page.locator('[data-testid="layout-picker-flyout"]');
    await expect(flyout).toBeVisible();

    const groups = flyout.locator('[data-testid="layout-picker-group"]');
    await expect(groups.first()).toBeVisible();

    const groupTitles = flyout.locator('[data-testid="layout-picker-group-title"]');
    await expect(groupTitles.first()).toBeVisible();

    // Ensure we have at least one layout option visible
    const options = flyout.locator('[data-testid="layout-picker-option"]');
    await expect(options.first()).toBeVisible();

    // Try to pick a different layout if possible
    const optionCount = await options.count();
    if (optionCount > 1) {
      const second = options.nth(1);
      const targetLayoutId = await second.getAttribute('data-layout-id');
      expect(targetLayoutId).toBeTruthy();

      await second.click();

      // Verify slide layoutId updated
      await expect.poll(async () => {
        const state = await getState();
        return state.slides[state.editor.activeSlideId]?.layoutId;
      }, { timeout: 2000 }).toBe(targetLayoutId);
    } else {
      // If there is only one layout overall, we can only validate grouping UI.
      const after = await getState();
      expect(after.slides[after.editor.activeSlideId]?.layoutId).toBe(beforeLayoutId);
    }
  });
});
