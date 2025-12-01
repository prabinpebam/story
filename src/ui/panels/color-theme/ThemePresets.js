/**
 * ThemePresets.js
 * 
 * Built-in theme presets for the color theme system.
 * Each preset defines 12 luma-locked slots with H and S values.
 * 
 * 6 Diverse Presets covering:
 * 1. Neutral - Grayscale base for clean presentations
 * 2. Ocean - Cool blue tones (professional/corporate)
 * 3. Sunset - Warm orange/red tones (creative/energetic)
 * 4. Forest - Natural green tones (organic/sustainable)
 * 5. Lavender - Soft purple tones (creative/elegant)
 * 6. Earth - Warm brown/tan tones (rustic/grounded)
 */

import { 
    createTheme, 
    createNeutralTheme, 
    createMonochromaticTheme
} from './ColorThemeUtils.js';

/**
 * Neutral grayscale theme
 * Perfect base for clean, minimalist presentations
 */
export const NEUTRAL_PRESET = createTheme(
    'preset_neutral',
    'Neutral',
    createNeutralTheme(),
    true
);

/**
 * Ocean blue theme
 * Cool, professional feel - great for corporate presentations
 */
export const OCEAN_PRESET = createTheme(
    'preset_ocean',
    'Ocean',
    createMonochromaticTheme(210, 65),
    true
);

/**
 * Sunset warm theme
 * Warm orange/coral tones - energetic and creative
 */
export const SUNSET_PRESET = createTheme(
    'preset_sunset',
    'Sunset',
    [
        { h: 10, s: 25 },   // Slot 1 - deep warm shadow
        { h: 15, s: 35 },   // Slot 2
        { h: 20, s: 45 },   // Slot 3
        { h: 25, s: 55 },   // Slot 4
        { h: 30, s: 60 },   // Slot 5 - warm midtones
        { h: 28, s: 55 },   // Slot 6
        { h: 25, s: 50 },   // Slot 7
        { h: 22, s: 45 },   // Slot 8
        { h: 25, s: 35 },   // Slot 9 - warm highlights
        { h: 28, s: 28 },   // Slot 10
        { h: 32, s: 18 },   // Slot 11
        { h: 35, s: 10 }    // Slot 12
    ],
    true
);

/**
 * Forest green theme
 * Natural, organic feel - great for sustainability/nature topics
 */
export const FOREST_PRESET = createTheme(
    'preset_forest',
    'Forest',
    [
        { h: 140, s: 30 },  // Slot 1 - deep forest shadow
        { h: 135, s: 35 },  // Slot 2
        { h: 130, s: 40 },  // Slot 3
        { h: 125, s: 45 },  // Slot 4
        { h: 120, s: 50 },  // Slot 5 - vibrant green midtones
        { h: 125, s: 45 },  // Slot 6
        { h: 130, s: 40 },  // Slot 7
        { h: 135, s: 35 },  // Slot 8
        { h: 130, s: 25 },  // Slot 9 - soft green highlights
        { h: 125, s: 18 },  // Slot 10
        { h: 120, s: 12 },  // Slot 11
        { h: 115, s: 6 }    // Slot 12
    ],
    true
);

/**
 * Lavender purple theme
 * Soft, elegant purple tones - creative and sophisticated
 */
export const LAVENDER_PRESET = createTheme(
    'preset_lavender',
    'Lavender',
    [
        { h: 270, s: 25 },  // Slot 1 - deep purple shadow
        { h: 275, s: 30 },  // Slot 2
        { h: 280, s: 35 },  // Slot 3
        { h: 282, s: 40 },  // Slot 4
        { h: 275, s: 45 },  // Slot 5 - purple midtones
        { h: 270, s: 40 },  // Slot 6
        { h: 268, s: 35 },  // Slot 7
        { h: 265, s: 30 },  // Slot 8
        { h: 270, s: 22 },  // Slot 9 - soft lavender highlights
        { h: 275, s: 15 },  // Slot 10
        { h: 280, s: 10 },  // Slot 11
        { h: 285, s: 5 }    // Slot 12
    ],
    true
);

/**
 * Earth tones theme
 * Warm, grounded feel - rustic and natural
 */
export const EARTH_PRESET = createTheme(
    'preset_earth',
    'Earth',
    [
        { h: 25, s: 30 },   // Slot 1 - brown shadow
        { h: 28, s: 35 },   // Slot 2
        { h: 32, s: 40 },   // Slot 3
        { h: 35, s: 45 },   // Slot 4
        { h: 38, s: 42 },   // Slot 5 - tan midtones
        { h: 42, s: 38 },   // Slot 6
        { h: 40, s: 32 },   // Slot 7
        { h: 38, s: 26 },   // Slot 8
        { h: 35, s: 20 },   // Slot 9 - cream highlights
        { h: 40, s: 15 },   // Slot 10
        { h: 45, s: 10 },   // Slot 11
        { h: 48, s: 5 }     // Slot 12
    ],
    true
);

/**
 * All preset themes (6 diverse options)
 */
export const THEME_PRESETS = [
    NEUTRAL_PRESET,
    OCEAN_PRESET,
    SUNSET_PRESET,
    FOREST_PRESET,
    LAVENDER_PRESET,
    EARTH_PRESET
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
