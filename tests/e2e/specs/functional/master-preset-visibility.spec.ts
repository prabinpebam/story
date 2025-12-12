import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * M0 - Master Preset visibility rules
 * - Visible only in Master View when a Master Slide (root) is selected
 * - Hidden for Layout masters
 * - Hidden in normal Edit mode
 */

test.describe('Master Preset - Visibility', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('shows master preset section only for master root in master mode', async ({ page, getState }) => {
    const masterPresetSection = editor.propertyInspector.locator('[data-testid="master-preset-section"]');

    // In normal edit mode, it must not be visible
    const initialState = await getState();
    expect(initialState.editor.mode).toBe('edit');
    await expect(masterPresetSection).not.toBeVisible();

    // Enter master mode via UI
    await editor.editMaster();
    const stateInMaster = await getState();
    expect(stateInMaster.editor.mode).toBe('master');

    // Select the first item (master root) and verify section is visible
    const firstItem = page.locator('[data-testid="slide-list-item"]').first();
    await expect(firstItem).toBeVisible();
    await firstItem.click();
    await page.waitForTimeout(150);

    const afterSelectingMaster = await getState();
    const activeMaster = afterSelectingMaster.slideMasterPresets[afterSelectingMaster.editor.activeMasterId];
    expect(activeMaster).toBeTruthy();
    expect(['slideMasterPreset', 'theme']).toContain(activeMaster.type);

    await expect(masterPresetSection).toBeVisible();

    // Select a layout item and verify section is hidden
    const secondItem = page.locator('[data-testid="slide-list-item"]').nth(1);
    await expect(secondItem).toBeVisible();
    await secondItem.click();
    await page.waitForTimeout(150);

    const afterSelectingLayout = await getState();
    const activeAfterLayout = afterSelectingLayout.slideMasterPresets[afterSelectingLayout.editor.activeMasterId];
    expect(activeAfterLayout).toBeTruthy();
    expect(['layoutMaster', 'layout']).toContain(activeAfterLayout.type);

    await expect(masterPresetSection).not.toBeVisible();
  });

  test('pure click-through toggles section for master vs layout', async ({ page }) => {
    const masterPresetSection = editor.propertyInspector.locator('[data-testid="master-preset-section"]');

    // Enter master mode via UI
    await editor.editMaster();

    // Click master root (first item) -> section visible
    const masterRootItem = page.locator('[data-testid="slide-list-item"]').first();
    await expect(masterRootItem).toBeVisible();
    await masterRootItem.click();
    await expect(masterPresetSection).toBeVisible();

    // Click first layout (second item) -> section hidden
    const firstLayoutItem = page.locator('[data-testid="slide-list-item"]').nth(1);
    await expect(firstLayoutItem).toBeVisible();
    await firstLayoutItem.click();
    await expect(masterPresetSection).not.toBeVisible();
  });
});
