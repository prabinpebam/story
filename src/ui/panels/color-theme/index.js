/**
 * Color Theme Module Index
 * 
 * Exports the luma-locked color theme system components.
 */

export { ColorThemeManager } from './ColorThemeManager.js';
export { 
    LUMA_SLOTS,
    DEFAULT_ADJUSTMENTS,
    hslToHex,
    hexToHsl,
    isColorDark,
    applyBrightness,
    applyContrast,
    applyHighlights,
    applyShadows,
    applyWhites,
    applyBlacks,
    applySaturation,
    applyAdjustments,
    generateThemeColors,
    generateInvertedThemeColors,
    createNeutralTheme,
    createMonochromaticTheme,
    createComplementaryTheme,
    extractThemeFromImage,
    applyThemeToCSSVariables,
    generateThemeCSSVariables,
    validateTheme,
    createTheme,
    cloneTheme,
    generateThemeId
} from './ColorThemeUtils.js';
export { 
    THEME_PRESETS,
    NEUTRAL_PRESET,
    OCEAN_PRESET,
    FOREST_PRESET,
    SUNSET_PRESET,
    MIDNIGHT_PRESET,
    ROSE_PRESET,
    LAVENDER_PRESET,
    EARTH_PRESET,
    TEAL_PRESET,
    CORAL_PRESET,
    SLATE_PRESET,
    WARM_GRAY_PRESET,
    getPresetById,
    getPresetByName,
    isPresetTheme
} from './ThemePresets.js';
