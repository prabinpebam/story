import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * Blocked master preset change
 * When the selected master is in use by any slides, attempting to change preset must be blocked
 * and a bottom-center notification popover shown.
 */

test.describe('Master Preset - Blocked When In Use', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('blocks applying a different preset and shows notification', async ({ page, getState }) => {
    await editor.editMaster();

    // Ensure master root selected
    await page.locator('[data-testid="slide-list-item"]').first().click();

    // Capture current presetId
    const before = await getState();
    const beforeMaster = before.slideMasterPresets[before.editor.activeMasterId];
    const beforePresetId = beforeMaster?.presetId;

    const trigger = editor.propertyInspector.locator('[data-testid="master-preset-row-button"]');
    await trigger.click();

    const panel = page.locator('[data-testid="master-preset-picker-panel"]');
    await expect(panel).toBeVisible();

    // Attempt to click a different preset option
    const options = panel.locator('[data-testid="master-preset-item"]');
    await expect(options.first()).toBeVisible();
    if (await options.count() > 1) {
      await options.nth(1).click();
    } else {
      // If only one option exists, the test cannot validate blocking.
      throw new Error('Expected >1 preset option to test blocking');
    }

    const applyBtn = panel.locator('[data-testid="master-preset-apply"]');
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    // Notification should appear
    const notification = page.locator('[data-testid="notification-popover"]');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText("Can’t change Master preset");

    // Optional action should route to the existing layout picker
    const actionBtn = notification.locator('[data-testid="notification-action"]');
    await expect(actionBtn).toBeVisible();
    await actionBtn.click();

    // Mode should switch back to edit and layout picker flyout should open
    await expect.poll(async () => {
      const state = await getState();
      return state.editor.mode;
    }, { timeout: 2000 }).toBe('edit');

    await expect(page.locator('.layout-flyout-content')).toBeVisible();

    // State should not change presetId
    const after = await getState();
    const afterMaster = after.slideMasterPresets[after.editor.activeMasterId];
    expect(afterMaster?.presetId).toBe(beforePresetId);
  });

  test('blocks store-dispatched preset change (bypasses UI gating) and shows notification', async ({ page, getState, dispatchAction }) => {
    await editor.editMaster();

    // Ensure master root selected
    await page.locator('[data-testid="slide-list-item"]').first().click();

    const before = await getState();
    const masterId = before.editor.activeMasterId;
    const beforeMaster = before.slideMasterPresets[masterId];
    const beforePresetId = beforeMaster?.presetId;

    // Choose a different presetId than the inferred current (library default)
    const targetPresetId = 'electric-bold';

    await dispatchAction('APPLY_MASTER_PRESET_TO_MASTER', { masterId, presetId: targetPresetId });

    // Notification should appear (store-driven)
    const notification = page.locator('[data-testid="notification-popover"]');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText("Can’t change Master preset");

    // Action should exist and route to layout picker
    const actionBtn = notification.locator('[data-testid="notification-action"]');
    await expect(actionBtn).toBeVisible();
    await actionBtn.click();

    await expect.poll(async () => {
      const state = await getState();
      return state.editor.mode;
    }, { timeout: 2000 }).toBe('edit');

    await expect(page.locator('.layout-flyout-content')).toBeVisible();

    const after = await getState();
    const afterMaster = after.slideMasterPresets[after.editor.activeMasterId];
    expect(afterMaster?.presetId).toBe(beforePresetId);
  });
});
