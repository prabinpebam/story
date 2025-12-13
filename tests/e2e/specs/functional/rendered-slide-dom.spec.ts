import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

function hexToRgbCss(hex: string): string {
  const normalized = hex.trim().replace('#', '');
  if (normalized.length !== 6) throw new Error(`Expected 6-digit hex, got: ${hex}`);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

test.describe('Rendered Slide DOM (background + text + placeholder properties)', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('background + text colors match effective theme slots (and invert in Dark mode)', async ({ page, dispatchAction, getState }) => {
    const current = await getState();
    const masters = { ...current.slideMasterPresets };

    // Create an isolated master root + layout so we can deterministically test rendering.
    const masterId = 'master-dom-test';
    const layoutId = 'master-dom-test-layout-title';

    const baseMaster = masters['master-default'];
    const baseLayout = masters['layout-title'];
    expect(baseMaster?.type).toBe('slideMasterPreset');
    expect(baseLayout?.type).toBe('layoutMaster');

    masters[masterId] = {
      id: masterId,
      type: 'slideMasterPreset',
      name: 'DOM Test Master',
      colorThemeId: baseMaster?.colorThemeId || 'color-theme-default',
      typographyStyleId: baseMaster?.typographyStyleId || 'typo-style-default',
      // Ensure deterministic initial mode for CSS var mapping.
      colorModeId: 'light',
      // Explicitly theme-linked so DOM rendering uses CSS vars.
      background: { type: 'solid', themeSlot: 0, value: '#FFFFFF' },
      elements: {},
      elementOrder: [],
      layoutIds: [layoutId]
    };

    masters[layoutId] = {
      ...baseLayout,
      id: layoutId,
      parentMasterId: masterId,
      name: 'DOM Test Title Layout',
      // Important: ensure the layout does NOT override the master theme.
      // Many built-in layouts carry `colorThemeId`, which would block inheritance.
      styleAssignments: null,
      colorThemeId: null,
      // Force a theme-linked background on the active layout so the rendered surface is deterministic.
      // (Some built-in layouts define their own fixed/slot-11 background which would mask slot-0 checks.)
      background: { type: 'solid', themeSlot: 0, value: '#FFFFFF' }
    };

    await dispatchAction('LOAD_PRESENTATION', {
      slides: Object.values(current.slides),
      masters
    });

    await editor.editMaster();
    await dispatchAction('SET_ACTIVE_MASTER', layoutId);

    // Apply a deterministic high-contrast theme (12 unique colors in canonical order).
    const contrastColors = [
      '#000000', '#111111', '#222222', '#333333',
      '#444444', '#555555', '#666666', '#777777',
      '#888888', '#999999', '#AAAAAA', '#FFFFFF'
    ];

    await dispatchAction('APPLY_LUMA_THEME', {
      masterId,
      theme: {
        id: 'luma-theme-dom-contrast',
        name: 'DOM Contrast Test',
        slots: Array.from({ length: 12 }, () => ({ h: 0, s: 0 })),
        adjustments: {},
        colors: contrastColors,
        isDark: false
      }
    });

    await expect.poll(async () => {
      const state = await getState();
      return state.slideMasterPresets[masterId]?.colorThemeId;
    }, { timeout: 2000 }).toBe('luma-theme-dom-contrast');

    // Slide surface (ensure we assert against the main canvas render, not thumbnails)
    const slideView = editor.canvas.locator('[data-testid="slide-view"]').first();
    await expect(slideView).toBeVisible();

    // Background should be slot 0 => background1 => '#000000' in light.
    const bgLayer = slideView.locator('[data-testid="slide-background"] [data-testid="slide-bg-layer-0"]').first();
    await expect(bgLayer).toBeVisible();
    await expect(bgLayer).toHaveAttribute('data-theme-slot', '0');

    const getSlot1 = async () => slideView.evaluate((el) => getComputedStyle(el).getPropertyValue('--theme-slot1').trim());
    await expect.poll(getSlot1, { timeout: 2000 }).toBe('#000000');

    const getBgColor = async () => bgLayer.evaluate((el) => getComputedStyle(el).backgroundColor);
    await expect.poll(getBgColor, { timeout: 2000 }).toBe(hexToRgbCss('#000000'));

    // Placeholder title (from Title Slide layout): should expose placeholder metadata in DOM.
    const title = slideView.locator('[data-is-placeholder="true"][data-placeholder-type="title"]').first();
    await expect(title).toBeVisible();
    await expect(title).toHaveAttribute('data-text-style-id', 'display');
    // Text color is driven by Color Theme, not Typography style.
    // Default textFill uses themeSlot 1 (slot 2).
    await expect(title).toHaveAttribute('data-text-fill-theme-slot', '1');

    const getTitleColor = async () => title.evaluate((el) => getComputedStyle(el).color);
    const getTitleFontSize = async () => title.evaluate((el) => getComputedStyle(el).fontSize);

    // Default textFill themeSlot 1 => '#111111' in light mode.
    await expect.poll(getTitleColor, { timeout: 2000 }).toBe(hexToRgbCss('#111111'));
    await expect.poll(getTitleFontSize, { timeout: 2000 }).toBe('80px');

    // Toggle dark mode (should invert effective slots on the rendered slide DOM).
    await editor.propertyInspector.locator('[data-testid="theme-mode-dark"]').click();

    await expect.poll(async () => {
      const state = await getState();
      return state.slideMasterPresets[masterId]?.colorModeId;
    }, { timeout: 2000 }).toBe('dark');

    // In dark mode, slot 0 resolves to slot 11 => '#FFFFFF'.
    await expect.poll(getBgColor, { timeout: 2000 }).toBe(hexToRgbCss('#FFFFFF'));

    // In dark mode, slot 1 resolves to slot 10 => '#AAAAAA'.
    await expect.poll(getTitleColor, { timeout: 2000 }).toBe(hexToRgbCss('#AAAAAA'));

    // Back to light.
    await editor.propertyInspector.locator('[data-testid="theme-mode-light"]').click();

    await expect.poll(async () => {
      const state = await getState();
      return state.slideMasterPresets[masterId]?.colorModeId;
    }, { timeout: 2000 }).toBe('light');
    await expect.poll(getBgColor, { timeout: 2000 }).toBe(hexToRgbCss('#000000'));
    await expect.poll(getTitleColor, { timeout: 2000 }).toBe(hexToRgbCss('#111111'));
  });
});
