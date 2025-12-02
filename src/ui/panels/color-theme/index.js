/**
 * Color Theme Module Index
 * 
 * Exports the luma-locked color theme system components.
 */

export { ColorThemeManager } from './ColorThemeManager.js';
export { 
    LUMA_SLOTS,
    DEFAULT_ADJUSTMENTS,
    COLOR_MODES,
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
    generateThemeId,
    getEffectiveSlotIndex,
    generateThemeColorsWithMode,
    getDarkModeSlotMapping
} from './ColorThemeUtils.js';
export { 
    THEME_PRESETS,
    NEUTRAL_PRESET,
    ELECTRIC_DREAMS_PRESET,
    SUNSET_BOULEVARD_PRESET,
    TROPICAL_PARADISE_PRESET,
    BERRY_BLISS_PRESET,
    EMERALD_GOLD_PRESET,
    COSMIC_NEBULA_PRESET,
    CITRUS_BURST_PRESET,
    OCEAN_SUNSET_PRESET,
    ROSE_GARDEN_PRESET,
    getPresetById,
    getPresetByName,
    isPresetTheme
} from './ThemePresets.js';
