import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * M0 -> M1 bridge: Master preset flyout basics
 * - Opens the preset flyout
 * - Selecting a preset updates state on the active master root
 */

test.describe('Master Preset - Flyout', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('opens flyout and applies a preset to an unused canonical master root', async ({ page, dispatchAction, getState }) => {
    // Seed a second (unused) master root so preset changes are allowed per blocking rules.
    const current = await getState();
    const masters = { ...current.slideMasterPresets };
    masters['master-unused'] = {
      id: 'master-unused',
      type: 'slideMasterPreset',
      name: 'Unused Master',
      colorThemeId: masters['master-default']?.colorThemeId || 'color-theme-default',
      typographyStyleId: masters['master-default']?.typographyStyleId || 'typo-style-default',
      background: masters['master-default']?.background || { type: 'solid', value: '#FFFFFF' },
      elements: {},
      elementOrder: [],
      layoutIds: []
    };

    await dispatchAction('LOAD_PRESENTATION', {
      slides: Object.values(current.slides),
      masters
    });

    await editor.editMaster();

    // Select the new unused master root (it should appear in the master list)
    const unusedMasterItem = page.locator('[data-testid="slide-list-item"]').filter({ hasText: 'Unused Master' });
    await expect(unusedMasterItem).toBeVisible();
    await unusedMasterItem.click();

    const masterPresetSection = editor.propertyInspector.locator('[data-testid="master-preset-section"]');
    await expect(masterPresetSection).toBeVisible();

    const trigger = editor.propertyInspector.locator('[data-testid="master-preset-trigger"]');
    await expect(trigger).toBeVisible();
    await trigger.click();

    const flyout = page.locator('[data-testid="master-preset-flyout"]');
    await expect(flyout).toBeVisible();

    const options = flyout.locator('[data-testid="master-preset-option"]');
    await expect(options.first()).toBeVisible();

    // Click a different preset (avoid clicking the selected one)
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(1);
    const targetOption = options.nth(1);
    const targetPresetId = await targetOption.getAttribute('data-preset-id');
    expect(targetPresetId).toBeTruthy();
    await targetOption.click();

    // Verify state updated on active master root
    await expect.poll(async () => {
      const state = await getState();
      const activeId = state.editor.activeMasterId;
      const master = state.slideMasterPresets[activeId];
      return {
        type: master?.type,
        presetId: master?.presetId,
        colorThemeId: master?.colorThemeId,
        typographyStyleId: master?.typographyStyleId
      };
    }, { timeout: 2000 }).toMatchObject({
      type: 'slideMasterPreset'
    });

    const after = await getState();
    const activeMaster = after.slideMasterPresets[after.editor.activeMasterId];

    // presetId should be set to the clicked option
    expect(activeMaster.presetId).toBe(targetPresetId);

    // Canonical references should be present
    expect(activeMaster.colorThemeId).toBeTruthy();
    expect(activeMaster.typographyStyleId).toBeTruthy();
  });
});
