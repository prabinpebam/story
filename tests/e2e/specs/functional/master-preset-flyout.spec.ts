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
    await expect(options).toHaveCount(6);

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

  test('Mode toggle updates active master colorModeId', async ({ page, dispatchAction, getState }) => {
    // Seed a second master root so we can verify we’re not writing to master-default.
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
    await dispatchAction('SET_ACTIVE_MASTER', 'master-unused');

    await expect.poll(async () => {
      const state = await getState();
      return state.editor?.mode;
    }, { timeout: 2000 }).toBe('master');

    await expect.poll(async () => {
      const state = await getState();
      return state.editor?.activeMasterId;
    }, { timeout: 2000 }).toBe('master-unused');

    const darkBtn = editor.propertyInspector.locator('[data-testid="theme-mode-dark"]');
    const lightBtn = editor.propertyInspector.locator('[data-testid="theme-mode-light"]');
    await expect(darkBtn).toBeVisible();
    await expect(lightBtn).toBeVisible();

    // Toggle to Dark
    await darkBtn.click();
    await expect.poll(async () => {
      const state = await getState();
      return state.slideMasterPresets['master-unused']?.colorModeId;
    }, { timeout: 2000 }).toBe('dark');

    // Toggle back to Light
    await lightBtn.click();
    await expect.poll(async () => {
      const state = await getState();
      return state.slideMasterPresets['master-unused']?.colorModeId;
    }, { timeout: 2000 }).toBe('light');
  });

  test('Master preset row visibility rules (master root only, hidden for layouts and element selection)', async ({ dispatchAction, getState }) => {
    await editor.editMaster();

    const presetSection = editor.propertyInspector.locator('[data-testid="master-preset-section"]');
    await expect(presetSection).toBeVisible();

    const state = await getState();
    const masterId = state.editor.activeMasterId;
    const master = state.slideMasterPresets[masterId];
    expect(master?.type).toBe('slideMasterPreset');
    expect(Array.isArray(master.layoutIds)).toBe(true);
    expect(master.layoutIds.length).toBeGreaterThan(0);

    const layoutId = master.layoutIds[0];
    await dispatchAction('SET_ACTIVE_MASTER', layoutId);
    await expect(presetSection).not.toBeVisible();

    const layout = (await getState()).slideMasterPresets[layoutId];
    expect(layout?.type).toBe('layoutMaster');
    const elements = Object.values(layout.elements || {});
    const placeholder = elements.find((el: any) => el?.isPlaceholder && el?.type === 'text');
    expect(placeholder).toBeTruthy();

    await dispatchAction('UPDATE_SELECTION', [(placeholder as any).id]);
    await expect(presetSection).not.toBeVisible();
  });

  test('Mode toggle visually updates ThemeSwatches (slot colors change)', async ({ dispatchAction, getState }) => {
    // Seed a second master root so we can safely toggle modes without affecting other tests.
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
    await dispatchAction('SET_ACTIVE_MASTER', 'master-unused');

    // Apply a deterministic high-contrast luma theme so slot inversion is visually measurable.
    const contrastColors = [
      '#000000', '#111111', '#222222', '#333333',
      '#444444', '#555555', '#666666', '#777777',
      '#888888', '#999999', '#AAAAAA', '#FFFFFF'
    ];
    await dispatchAction('APPLY_LUMA_THEME', {
      masterId: 'master-unused',
      theme: {
        id: 'luma-theme-contrast-test',
        name: 'Contrast Test',
        slots: Array.from({ length: 12 }, () => ({ h: 0, s: 0 })),
        adjustments: {},
        colors: contrastColors,
        isDark: false
      }
    });

    await expect.poll(async () => {
      const state = await getState();
      return state.slideMasterPresets['master-unused']?.colorThemeId;
    }, { timeout: 2000 }).toBe('luma-theme-contrast-test');

    await expect.poll(async () => {
      const state = await getState();
      return !!state.colorThemePresets?.['luma-theme-contrast-test'];
    }, { timeout: 2000 }).toBe(true);

    const swatchGrid = editor.propertyInspector.locator('[data-testid="theme-swatches-grid"]');
    await expect(swatchGrid).toBeVisible();

    const swatch1 = swatchGrid.locator('[data-testid="theme-swatch-slot-1"]').first();
    await expect(swatch1).toBeVisible();

    const getBg = async () => {
      return swatch1.evaluate((el) => getComputedStyle(el).backgroundColor);
    };

    // Wait for the newly applied theme to render in the swatch.
    await expect.poll(getBg, { timeout: 2000 }).toBe('rgb(0, 0, 0)');
    const before = await getBg();

    const darkBtn = editor.propertyInspector.locator('[data-testid="theme-mode-dark"]');
    const lightBtn = editor.propertyInspector.locator('[data-testid="theme-mode-light"]');

    await darkBtn.click();
    await expect.poll(getBg, { timeout: 2000 }).toBe('rgb(255, 255, 255)');

    await lightBtn.click();
    await expect.poll(getBg, { timeout: 2000 }).toBe(before);
  });
});
