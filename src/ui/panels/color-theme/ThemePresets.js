/**
 * ThemePresets.js
 * 
 * Built-in theme presets for the color theme system.
 * Each preset defines 12 luma-locked slots with H and S values.
 */

import { 
    createTheme, 
    createNeutralTheme, 
    createMonochromaticTheme,
    createComplementaryTheme 
} from './ColorThemeUtils.js';

/**
 * Neutral grayscale theme
 */
export const NEUTRAL_PRESET = createTheme(
    'preset_neutral',
    'Neutral',
    createNeutralTheme(),
    true
);

/**
 * Ocean blue theme
 */
export const OCEAN_PRESET = createTheme(
    'preset_ocean',
    'Ocean',
    createMonochromaticTheme(210, 60),
    true
);

/**
 * Forest green theme
 */
export const FOREST_PRESET = createTheme(
    'preset_forest',
    'Forest',
    createMonochromaticTheme(140, 45),
    true
);

/**
 * Sunset warm theme
 */
export const SUNSET_PRESET = createTheme(
    'preset_sunset',
    'Sunset',
    [
        { h: 15, s: 20 },   // Slot 1 - deep warm shadow
        { h: 20, s: 30 },   // Slot 2
        { h: 25, s: 40 },   // Slot 3
        { h: 30, s: 50 },   // Slot 4
        { h: 35, s: 55 },   // Slot 5 - warm midtones
        { h: 30, s: 50 },   // Slot 6
        { h: 25, s: 45 },   // Slot 7
        { h: 20, s: 40 },   // Slot 8
        { h: 25, s: 30 },   // Slot 9 - warm highlights
        { h: 30, s: 25 },   // Slot 10
        { h: 35, s: 15 },   // Slot 11
        { h: 40, s: 10 }    // Slot 12
    ],
    true
);

/**
 * Midnight dark theme
 */
export const MIDNIGHT_PRESET = createTheme(
    'preset_midnight',
    'Midnight',
    [
        { h: 240, s: 30 },  // Slot 1 - deep blue shadow
        { h: 235, s: 35 },  // Slot 2
        { h: 230, s: 40 },  // Slot 3
        { h: 225, s: 45 },  // Slot 4
        { h: 220, s: 40 },  // Slot 5 - blue midtones
        { h: 215, s: 35 },  // Slot 6
        { h: 210, s: 30 },  // Slot 7
        { h: 205, s: 25 },  // Slot 8
        { h: 200, s: 20 },  // Slot 9 - blue highlights
        { h: 195, s: 15 },  // Slot 10
        { h: 190, s: 10 },  // Slot 11
        { h: 185, s: 5 }    // Slot 12
    ],
    true
);

/**
 * Rose/pink theme
 */
export const ROSE_PRESET = createTheme(
    'preset_rose',
    'Rose',
    createMonochromaticTheme(340, 50),
    true
);

/**
 * Lavender purple theme
 */
export const LAVENDER_PRESET = createTheme(
    'preset_lavender',
    'Lavender',
    createMonochromaticTheme(270, 40),
    true
);

/**
 * Earth tones theme
 */
export const EARTH_PRESET = createTheme(
    'preset_earth',
    'Earth',
    [
        { h: 25, s: 25 },   // Slot 1 - brown shadow
        { h: 30, s: 30 },   // Slot 2
        { h: 35, s: 35 },   // Slot 3
        { h: 40, s: 40 },   // Slot 4
        { h: 45, s: 35 },   // Slot 5 - tan midtones
        { h: 50, s: 30 },   // Slot 6
        { h: 45, s: 25 },   // Slot 7
        { h: 40, s: 20 },   // Slot 8
        { h: 35, s: 15 },   // Slot 9 - cream highlights
        { h: 40, s: 12 },   // Slot 10
        { h: 45, s: 8 },    // Slot 11
        { h: 50, s: 5 }     // Slot 12
    ],
    true
);

/**
 * Teal accent theme
 */
export const TEAL_PRESET = createTheme(
    'preset_teal',
    'Teal',
    createMonochromaticTheme(180, 55),
    true
);

/**
 * Coral complementary theme
 */
export const CORAL_PRESET = createTheme(
    'preset_coral',
    'Coral',
    createComplementaryTheme(15, 185, 50),
    true
);

/**
 * Slate professional theme
 */
export const SLATE_PRESET = createTheme(
    'preset_slate',
    'Slate',
    [
        { h: 210, s: 10 },  // Slot 1 - slate shadow
        { h: 210, s: 12 },  // Slot 2
        { h: 210, s: 14 },  // Slot 3
        { h: 210, s: 16 },  // Slot 4
        { h: 210, s: 15 },  // Slot 5 - slate midtones
        { h: 210, s: 12 },  // Slot 6
        { h: 210, s: 10 },  // Slot 7
        { h: 210, s: 8 },   // Slot 8
        { h: 210, s: 6 },   // Slot 9 - slate highlights
        { h: 210, s: 5 },   // Slot 10
        { h: 210, s: 4 },   // Slot 11
        { h: 210, s: 2 }    // Slot 12
    ],
    true
);

/**
 * Warm gray theme
 */
export const WARM_GRAY_PRESET = createTheme(
    'preset_warm_gray',
    'Warm Gray',
    [
        { h: 30, s: 8 },    // Slot 1
        { h: 30, s: 10 },   // Slot 2
        { h: 30, s: 12 },   // Slot 3
        { h: 30, s: 14 },   // Slot 4
        { h: 30, s: 12 },   // Slot 5
        { h: 30, s: 10 },   // Slot 6
        { h: 30, s: 8 },    // Slot 7
        { h: 30, s: 6 },    // Slot 8
        { h: 30, s: 5 },    // Slot 9
        { h: 30, s: 4 },    // Slot 10
        { h: 30, s: 3 },    // Slot 11
        { h: 30, s: 2 }     // Slot 12
    ],
    true
);

/**
 * All preset themes
 */
export const THEME_PRESETS = [
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
    WARM_GRAY_PRESET
];

/**
 * Get preset by ID
 * @param {string} id - Preset ID
 * @returns {Object|null} Preset theme or null
 */
export function getPresetById(id) {
    return THEME_PRESETS.find(preset => preset.id === id) || null;
}

/**
 * Get preset by name
 * @param {string} name - Preset name
 * @returns {Object|null} Preset theme or null
 */
export function getPresetByName(name) {
    return THEME_PRESETS.find(preset => 
        preset.name.toLowerCase() === name.toLowerCase()
    ) || null;
}

/**
 * Check if a theme ID is a preset
 * @param {string} id - Theme ID
 * @returns {boolean} True if preset
 */
export function isPresetTheme(id) {
    return id.startsWith('preset_');
}
