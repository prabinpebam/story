import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * M0 -> M1 bridge: Master preset flyout basics
 * - Opens the preset flyout
 * - Selecting a preset updates state on the active master root
 */

test.describe('Master Preset - Picker Panel', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('opens picker panel and applies a preset to an unused canonical master root', async ({ page, dispatchAction, getState }) => {
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

    const trigger = editor.propertyInspector.locator('[data-testid="master-preset-row-button"]');
    await expect(trigger).toBeVisible();
    await trigger.click();

    const panel = page.locator('[data-testid="master-preset-picker-panel"]');
    await expect(panel).toBeVisible();

    const options = panel.locator('[data-testid="master-preset-item"]');
    await expect(options.first()).toBeVisible();

    // Click a different preset (avoid clicking the selected one)
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(1);
    const targetOption = options.nth(1);
    const targetPresetId = await targetOption.getAttribute('data-preset-id');
    expect(targetPresetId).toBeTruthy();
    await targetOption.click();

    const applyBtn = panel.locator('[data-testid="master-preset-apply"]');
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

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

  test('M6A: placeholder selection shows linked typography + theme-slot text color', async ({ page, dispatchAction, getState }) => {
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

    // Select the new unused master root deterministically
    await dispatchAction('SET_ACTIVE_MASTER', 'master-unused');

    // Open picker and apply a non-selected preset
    const trigger = editor.propertyInspector.locator('[data-testid="master-preset-row-button"]');
    await expect(trigger).toBeVisible();
    await trigger.click();

    const panel = page.locator('[data-testid="master-preset-picker-panel"]');
    await expect(panel).toBeVisible();

    const options = panel.locator('[data-testid="master-preset-item"]');
    await expect(options.first()).toBeVisible();
    const targetOption = options.nth(1);
    await targetOption.click();

    const applyBtn = panel.locator('[data-testid="master-preset-apply"]');
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    // Navigate into a layout under this master so we can select an actual placeholder
    const after = await getState();
    const masterId = after.editor.activeMasterId;
    const master = after.slideMasterPresets[masterId];
    expect(master.type).toBe('slideMasterPreset');
    expect(Array.isArray(master.layoutIds)).toBe(true);
    expect(master.layoutIds.length).toBeGreaterThan(0);

    const layoutId = master.layoutIds[0];

    await dispatchAction('SET_ACTIVE_MASTER', layoutId);

    // Pick a text placeholder from the active layout master
    const layout = (await getState()).slideMasterPresets[layoutId];
    expect(layout).toBeTruthy();
    expect(layout.type).toBe('layoutMaster');
    const elements = Object.values(layout.elements || {});
    const placeholder = elements.find((el: any) => el?.isPlaceholder && el?.type === 'text');
    expect(placeholder).toBeTruthy();
    const placeholderId = (placeholder as any).id as string;

    // Select deterministically
    await dispatchAction('UPDATE_SELECTION', [placeholderId]);

    // Typography should be linked (unlink button visible)
    await expect(editor.propertyInspector.locator('[data-testid="text-style-unlink"]')).toBeVisible();

    // Text color should be theme-slot linked (title indicates Theme Slot)
    const textColorHex = editor.propertyInspector.locator('[data-testid="text-color-hex"]');
    await expect(textColorHex).toBeVisible();
    await expect(textColorHex).toHaveAttribute('title', /Theme Slot\s+\d+/);
  });
});
