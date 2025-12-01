/**
 * ThemePresets.js
 * 
 * Built-in theme presets for the color theme system.
 * Each preset defines 12 luma-locked slots with H and S values.
 * 
 * 10 Diverse Presets with various color harmonies:
 * 1. Neutral - Grayscale base for clean presentations
 * 2. Electric Dreams - Vivid cyan/magenta complementary (neon)
 * 3. Sunset Boulevard - Orange/purple split complementary
 * 4. Tropical Paradise - Teal/coral/yellow triadic (vivid)
 * 5. Berry Bliss - Pink/purple/blue analogous (pastel)
 * 6. Emerald & Gold - Green/gold complementary (luxurious)
 * 7. Cosmic Nebula - Purple/blue/pink tetradic (vibrant)
 * 8. Citrus Burst - Yellow/orange/lime analogous (energetic)
 * 9. Ocean Sunset - Blue/orange complementary (balanced)
 * 10. Rose Garden - Red/pink/green split complementary (elegant)
 */

import { 
    createTheme, 
    createNeutralTheme
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
 * Electric Dreams - Neon Complementary
 * Vivid cyan and magenta - bold, futuristic, high-energy
 */
export const ELECTRIC_DREAMS_PRESET = createTheme(
    'preset_electric_dreams',
    'Electric Dreams',
    [
        { h: 300, s: 45 },  // Slot 1 - deep magenta shadow
        { h: 290, s: 55 },  // Slot 2 - purple
        { h: 180, s: 70 },  // Slot 3 - cyan
        { h: 310, s: 80 },  // Slot 4 - hot pink accent
        { h: 185, s: 85 },  // Slot 5 - vivid cyan
        { h: 295, s: 75 },  // Slot 6 - magenta
        { h: 180, s: 70 },  // Slot 7 - cyan
        { h: 305, s: 65 },  // Slot 8 - pink-magenta
        { h: 185, s: 55 },  // Slot 9 - light cyan
        { h: 300, s: 45 },  // Slot 10 - soft magenta
        { h: 180, s: 35 },  // Slot 11 - pale cyan
        { h: 295, s: 20 }   // Slot 12 - whisper pink
    ],
    true
);

/**
 * Sunset Boulevard - Split Complementary
 * Warm orange with purple accents - dramatic and creative
 */
export const SUNSET_BOULEVARD_PRESET = createTheme(
    'preset_sunset_boulevard',
    'Sunset Boulevard',
    [
        { h: 270, s: 40 },  // Slot 1 - deep purple shadow
        { h: 20, s: 55 },   // Slot 2 - burnt orange
        { h: 280, s: 50 },  // Slot 3 - violet
        { h: 30, s: 75 },   // Slot 4 - vivid orange accent
        { h: 25, s: 85 },   // Slot 5 - bright orange
        { h: 260, s: 60 },  // Slot 6 - purple
        { h: 35, s: 70 },   // Slot 7 - golden orange
        { h: 275, s: 55 },  // Slot 8 - soft violet
        { h: 30, s: 50 },   // Slot 9 - peach
        { h: 270, s: 40 },  // Slot 10 - lavender
        { h: 35, s: 30 },   // Slot 11 - cream orange
        { h: 280, s: 15 }   // Slot 12 - pale violet
    ],
    true
);

/**
 * Tropical Paradise - Triadic Vivid
 * Teal, coral, and golden yellow - vibrant and joyful
 */
export const TROPICAL_PARADISE_PRESET = createTheme(
    'preset_tropical_paradise',
    'Tropical Paradise',
    [
        { h: 175, s: 50 },  // Slot 1 - deep teal shadow
        { h: 5, s: 65 },    // Slot 2 - coral
        { h: 45, s: 70 },   // Slot 3 - golden yellow
        { h: 180, s: 80 },  // Slot 4 - vivid teal accent
        { h: 10, s: 85 },   // Slot 5 - bright coral
        { h: 50, s: 90 },   // Slot 6 - sunny yellow
        { h: 175, s: 70 },  // Slot 7 - teal
        { h: 0, s: 60 },    // Slot 8 - soft coral
        { h: 55, s: 65 },   // Slot 9 - light gold
        { h: 180, s: 45 },  // Slot 10 - soft teal
        { h: 45, s: 40 },   // Slot 11 - pale yellow
        { h: 5, s: 25 }     // Slot 12 - blush
    ],
    true
);

/**
 * Berry Bliss - Analogous Pastel
 * Soft pink, purple, and blue - gentle and dreamy
 */
export const BERRY_BLISS_PRESET = createTheme(
    'preset_berry_bliss',
    'Berry Bliss',
    [
        { h: 280, s: 30 },  // Slot 1 - deep berry shadow
        { h: 320, s: 35 },  // Slot 2 - plum
        { h: 240, s: 35 },  // Slot 3 - periwinkle
        { h: 300, s: 45 },  // Slot 4 - orchid accent
        { h: 330, s: 50 },  // Slot 5 - rose pink
        { h: 260, s: 45 },  // Slot 6 - soft purple
        { h: 290, s: 40 },  // Slot 7 - lavender pink
        { h: 230, s: 40 },  // Slot 8 - soft blue
        { h: 315, s: 35 },  // Slot 9 - light pink
        { h: 270, s: 30 },  // Slot 10 - pale lavender
        { h: 250, s: 25 },  // Slot 11 - whisper blue
        { h: 300, s: 15 }   // Slot 12 - pale orchid
    ],
    true
);

/**
 * Emerald & Gold - Complementary Luxurious
 * Rich green and warm gold - elegant and sophisticated
 */
export const EMERALD_GOLD_PRESET = createTheme(
    'preset_emerald_gold',
    'Emerald & Gold',
    [
        { h: 150, s: 45 },  // Slot 1 - deep emerald shadow
        { h: 45, s: 60 },   // Slot 2 - bronze
        { h: 155, s: 55 },  // Slot 3 - forest green
        { h: 50, s: 80 },   // Slot 4 - bright gold accent
        { h: 145, s: 70 },  // Slot 5 - vivid emerald
        { h: 42, s: 75 },   // Slot 6 - golden amber
        { h: 160, s: 60 },  // Slot 7 - sea green
        { h: 48, s: 55 },   // Slot 8 - soft gold
        { h: 150, s: 40 },  // Slot 9 - light emerald
        { h: 50, s: 45 },   // Slot 10 - champagne
        { h: 155, s: 25 },  // Slot 11 - pale green
        { h: 45, s: 20 }    // Slot 12 - cream gold
    ],
    true
);

/**
 * Cosmic Nebula - Tetradic Vibrant
 * Purple, blue, orange, and teal - dynamic and otherworldly
 */
export const COSMIC_NEBULA_PRESET = createTheme(
    'preset_cosmic_nebula',
    'Cosmic Nebula',
    [
        { h: 260, s: 50 },  // Slot 1 - deep space purple
        { h: 200, s: 60 },  // Slot 2 - cosmic blue
        { h: 25, s: 65 },   // Slot 3 - nebula orange
        { h: 180, s: 70 },  // Slot 4 - teal accent
        { h: 270, s: 80 },  // Slot 5 - vivid purple
        { h: 210, s: 75 },  // Slot 6 - electric blue
        { h: 30, s: 70 },   // Slot 7 - warm orange
        { h: 185, s: 65 },  // Slot 8 - cyan
        { h: 255, s: 50 },  // Slot 9 - soft violet
        { h: 195, s: 45 },  // Slot 10 - sky blue
        { h: 20, s: 35 },   // Slot 11 - peach
        { h: 175, s: 25 }   // Slot 12 - pale aqua
    ],
    true
);

/**
 * Citrus Burst - Analogous Energetic
 * Yellow, orange, and lime - fresh and invigorating
 */
export const CITRUS_BURST_PRESET = createTheme(
    'preset_citrus_burst',
    'Citrus Burst',
    [
        { h: 30, s: 50 },   // Slot 1 - deep orange shadow
        { h: 80, s: 55 },   // Slot 2 - olive lime
        { h: 45, s: 65 },   // Slot 3 - golden
        { h: 65, s: 85 },   // Slot 4 - lime accent
        { h: 50, s: 95 },   // Slot 5 - bright yellow
        { h: 25, s: 90 },   // Slot 6 - vivid orange
        { h: 75, s: 80 },   // Slot 7 - chartreuse
        { h: 40, s: 70 },   // Slot 8 - amber
        { h: 55, s: 60 },   // Slot 9 - light yellow
        { h: 70, s: 50 },   // Slot 10 - soft lime
        { h: 45, s: 35 },   // Slot 11 - pale gold
        { h: 60, s: 20 }    // Slot 12 - cream yellow
    ],
    true
);

/**
 * Ocean Sunset - Complementary Balanced
 * Deep blue and warm orange - classic and harmonious
 */
export const OCEAN_SUNSET_PRESET = createTheme(
    'preset_ocean_sunset',
    'Ocean Sunset',
    [
        { h: 220, s: 50 },  // Slot 1 - deep ocean
        { h: 25, s: 55 },   // Slot 2 - burnt sienna
        { h: 210, s: 60 },  // Slot 3 - sea blue
        { h: 15, s: 80 },   // Slot 4 - sunset orange accent
        { h: 200, s: 75 },  // Slot 5 - cerulean
        { h: 30, s: 85 },   // Slot 6 - bright coral
        { h: 215, s: 65 },  // Slot 7 - azure
        { h: 20, s: 60 },   // Slot 8 - peach orange
        { h: 205, s: 50 },  // Slot 9 - light blue
        { h: 25, s: 45 },   // Slot 10 - soft coral
        { h: 210, s: 30 },  // Slot 11 - pale sky
        { h: 30, s: 20 }    // Slot 12 - cream
    ],
    true
);

/**
 * Rose Garden - Split Complementary Elegant
 * Rose red, soft pink, and sage green - romantic and refined
 */
export const ROSE_GARDEN_PRESET = createTheme(
    'preset_rose_garden',
    'Rose Garden',
    [
        { h: 350, s: 45 },  // Slot 1 - deep rose shadow
        { h: 140, s: 35 },  // Slot 2 - sage
        { h: 340, s: 55 },  // Slot 3 - burgundy rose
        { h: 160, s: 50 },  // Slot 4 - mint accent
        { h: 355, s: 70 },  // Slot 5 - vivid rose
        { h: 330, s: 60 },  // Slot 6 - magenta pink
        { h: 145, s: 45 },  // Slot 7 - soft green
        { h: 350, s: 55 },  // Slot 8 - rose
        { h: 335, s: 45 },  // Slot 9 - pink
        { h: 150, s: 35 },  // Slot 10 - pale sage
        { h: 345, s: 30 },  // Slot 11 - blush
        { h: 155, s: 15 }   // Slot 12 - whisper mint
    ],
    true
);

/**
 * All preset themes (10 diverse options)
 */
export const THEME_PRESETS = [
    NEUTRAL_PRESET,
    ELECTRIC_DREAMS_PRESET,
    SUNSET_BOULEVARD_PRESET,
    TROPICAL_PARADISE_PRESET,
    BERRY_BLISS_PRESET,
    EMERALD_GOLD_PRESET,
    COSMIC_NEBULA_PRESET,
    CITRUS_BURST_PRESET,
    OCEAN_SUNSET_PRESET,
    ROSE_GARDEN_PRESET
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
