/**
 * SlideMasterPresets.js
 * 
 * Complete slide master presets that combine:
 * - Color theme (from ThemePresets)
 * - Typography preset (from FontPresets) - includes fonts AND text styles
 * - Layout configurations
 * 
 * Each preset is a complete, ready-to-use slide master template.
 * Typography properties (fontSize, fontWeight, lineHeight, letterSpacing) come from the
 * selected Font Preset. Only the text fill color is driven by the color theme slots.
 */

import { THEME_PRESETS, NEUTRAL_PRESET, ELECTRIC_DREAMS_PRESET, SUNSET_BOULEVARD_PRESET, TROPICAL_PARADISE_PRESET, BERRY_BLISS_PRESET, EMERALD_GOLD_PRESET } from '../../ui/panels/color-theme/ThemePresets.js';
import { FONT_PRESETS, getPresetById as getFontPresetById } from '../constants/FontPresets.js';
import { generateThemeColors, LUMA_SLOTS } from '../../ui/panels/color-theme/ColorThemeUtils.js';

/**
 * Compute hex colors for a color theme's slots
 * The theme stores only h,s values - this computes the final hex colors using luma slots
 * @param {Object} colorTheme - Color theme from ThemePresets
 * @returns {Array<string>} Array of 12 hex color strings
 */
function computeThemeHexColors(colorTheme) {
    if (!colorTheme || !colorTheme.slots) {
        console.warn('[SlideMasterPreset] No slots in color theme:', colorTheme?.name);
        return Array(12).fill('#808080');
    }
    const hexColors = generateThemeColors(colorTheme.slots, colorTheme.adjustments || {});
    console.log(`[SlideMasterPreset] Computed hex colors for ${colorTheme.name}:`, hexColors);
    return hexColors;
}

/**
 * Luma-Locked Slot System
 * =========================
 * The 12 slots have FIXED luma values. Only H and S can vary.
 * 
 * Slot Index (0-based) → Luma:
 *   SHADOWS:    0=5%, 1=10%, 2=18%, 3=25%
 *   MIDTONES:   4=35%, 5=45%, 6=55%, 7=65%
 *   HIGHLIGHTS: 8=70%, 9=80%, 10=90%, 11=97%
 * 
 * For proper contrast, pair:
 *   - Dark backgrounds (0-3) with light text (8-11)
 *   - Light backgrounds (8-11) with dark text (0-3)
 */

/**
 * Luma slot indices by position (0-based)
 */
export const LUMA = {
    // Shadows cluster (L: 5-25%)
    SHADOW_1: 0,   // L=5%  - Darkest
    SHADOW_2: 1,   // L=10%
    SHADOW_3: 2,   // L=18%
    SHADOW_4: 3,   // L=25%
    
    // Midtones cluster (L: 35-65%)
    MID_1: 4,      // L=35%
    MID_2: 5,      // L=45%
    MID_3: 6,      // L=55%
    MID_4: 7,      // L=65%
    
    // Highlights cluster (L: 70-97%)
    LIGHT_1: 8,    // L=70%
    LIGHT_2: 9,    // L=80%
    LIGHT_3: 10,   // L=90%
    LIGHT_4: 11    // L=97% - Lightest
};

/**
 * Dark Theme Slot Assignments
 * Background: dark slots, Text: light slots
 */
export const DARK_THEME = {
    // Backgrounds (dark)
    BG_PRIMARY: LUMA.SHADOW_1,      // L=5% - Main slide background
    BG_SECONDARY: LUMA.SHADOW_2,    // L=10% - Secondary/card backgrounds
    BG_TERTIARY: LUMA.SHADOW_3,     // L=18% - Elevated surfaces
    
    // Text (light for contrast on dark bg)
    TEXT_PRIMARY: LUMA.LIGHT_4,     // L=97% - Main text (near white)
    TEXT_SECONDARY: LUMA.LIGHT_2,   // L=80% - Secondary text
    TEXT_MUTED: LUMA.LIGHT_1,       // L=70% - Muted/caption text
    
    // Accents (midtones work well on dark)
    ACCENT_1: LUMA.MID_3,           // L=55% - Primary accent
    ACCENT_2: LUMA.MID_4,           // L=65% - Secondary accent
    ACCENT_3: LUMA.LIGHT_1,         // L=70% - Tertiary accent
};

/**
 * Light Theme Slot Assignments
 * Background: light slots, Text: dark slots
 */
export const LIGHT_THEME = {
    // Backgrounds (light)
    BG_PRIMARY: LUMA.LIGHT_4,       // L=97% - Main slide background
    BG_SECONDARY: LUMA.LIGHT_3,     // L=90% - Secondary/card backgrounds
    BG_TERTIARY: LUMA.LIGHT_2,      // L=80% - Elevated surfaces
    
    // Text (dark for contrast on light bg)
    TEXT_PRIMARY: LUMA.SHADOW_1,    // L=5% - Main text (near black)
    TEXT_SECONDARY: LUMA.SHADOW_3,  // L=18% - Secondary text
    TEXT_MUTED: LUMA.SHADOW_4,      // L=25% - Muted/caption text
    
    // Accents (midtones work well on light)
    ACCENT_1: LUMA.MID_2,           // L=45% - Primary accent
    ACCENT_2: LUMA.MID_1,           // L=35% - Secondary accent
    ACCENT_3: LUMA.MID_3,           // L=55% - Tertiary accent
};

/**
 * Legacy mapping for backward compatibility
 * @deprecated Use DARK_THEME or LIGHT_THEME instead
 */
export const THEME_SLOTS = {
    BACKGROUND_1: LUMA.SHADOW_1,
    BACKGROUND_2: LUMA.SHADOW_2,
    TEXT_1: LUMA.LIGHT_4,           // Fixed: was 2 (dark), now 11 (light)
    TEXT_2: LUMA.LIGHT_2,           // Fixed: was 3 (dark), now 9 (light)
    ACCENT_1: LUMA.MID_2,
    ACCENT_2: LUMA.MID_3,
    ACCENT_3: LUMA.MID_4,
    ACCENT_4: LUMA.LIGHT_1,
    ACCENT_5: LUMA.LIGHT_2,
    ACCENT_6: LUMA.LIGHT_3,
    HYPERLINK: LUMA.MID_3,
    FOLLOWED_HYPERLINK: LUMA.MID_2
};

/**
 * Create a text style from a font preset style, adding theme slot for fill color
 * @param {string} id - Style ID (e.g., 'title', 'body')
 * @param {string} name - Display name
 * @param {Object} presetStyle - Style from FontPresets (fontSize, fontWeight, etc.)
 * @param {Object} fontPreset - The complete font preset (for font family info)
 * @param {number} textSlot - Theme slot for text fill color
 * @param {boolean} useHeadingFont - Whether to use heading or body font
 */
function createTextStyleFromPreset(id, name, presetStyle, fontPreset, textSlot, useHeadingFont = true) {
    const fontInfo = useHeadingFont ? fontPreset.fonts.heading : fontPreset.fonts.body;
    
    console.log(`[TextStyle] Creating style: ${id}, themeSlot: ${textSlot}, font: ${fontInfo.family}`);
    
    return {
        id,
        name,
        // Font family from the font preset
        fontFamily: fontInfo.family,
        fontFamilyFallback: fontInfo.fallback,
        // All typography properties from the font preset's style definition
        fontSize: presetStyle.fontSize,
        fontWeight: presetStyle.fontWeight,
        lineHeight: presetStyle.lineHeight,
        letterSpacing: presetStyle.letterSpacing,
        textTransform: presetStyle.textTransform || 'none',
        // Only the fill color comes from the theme
        textFill: { 
            type: 'solid', 
            themeSlot: textSlot
        }
    };
}

/**
 * Create text styles from a font preset, applying theme slots for colors only
 * Uses DARK_THEME slots (light text on dark background) by default
 * @param {Object} fontPreset - Font preset from FontPresets.js
 * @param {Object} themeSlots - Slot mapping to use (DARK_THEME or LIGHT_THEME)
 */
function createTextStylesFromFontPreset(fontPreset, themeSlots = DARK_THEME) {
    const styles = fontPreset.styles;
    
    return {
        // Display/Title styles use heading font and primary text color
        display: createTextStyleFromPreset('display', 'Display', 
            { fontSize: 80, fontWeight: styles.title?.fontWeight || '700', lineHeight: 1.0, letterSpacing: '-2%' },
            fontPreset, themeSlots.TEXT_PRIMARY, true),
        title: createTextStyleFromPreset('title', 'Title', 
            styles.title, fontPreset, themeSlots.TEXT_PRIMARY, true),
        subtitle: createTextStyleFromPreset('subtitle', 'Subtitle', 
            styles.subtitle, fontPreset, themeSlots.TEXT_SECONDARY, false),
        heading1: createTextStyleFromPreset('heading1', 'Heading 1', 
            styles.heading1, fontPreset, themeSlots.TEXT_PRIMARY, true),
        heading2: createTextStyleFromPreset('heading2', 'Heading 2', 
            styles.heading2, fontPreset, themeSlots.TEXT_PRIMARY, true),
        heading3: createTextStyleFromPreset('heading3', 'Heading 3', 
            { fontSize: Math.round(styles.heading2.fontSize * 0.75), fontWeight: styles.heading2.fontWeight, lineHeight: styles.heading2.lineHeight, letterSpacing: '0%' },
            fontPreset, themeSlots.TEXT_PRIMARY, true),
        // Body styles use body font
        body: createTextStyleFromPreset('body', 'Body', 
            styles.body, fontPreset, themeSlots.TEXT_PRIMARY, false),
        bodyLarge: createTextStyleFromPreset('bodyLarge', 'Body Large', 
            { fontSize: Math.round(styles.body.fontSize * 1.3), fontWeight: styles.body.fontWeight, lineHeight: styles.body.lineHeight, letterSpacing: '0%' },
            fontPreset, themeSlots.TEXT_PRIMARY, false),
        bodySmall: createTextStyleFromPreset('bodySmall', 'Body Small', 
            styles.bodySmall, fontPreset, themeSlots.TEXT_SECONDARY, false),
        caption: createTextStyleFromPreset('caption', 'Caption', 
            styles.caption, fontPreset, themeSlots.TEXT_MUTED, false),
        label: createTextStyleFromPreset('label', 'Label', 
            styles.label, fontPreset, themeSlots.TEXT_MUTED, false)
    };
}

/**
 * Create a placeholder element with theme-linked colors
 */
function createPlaceholder(id, placeholderType, options) {
    return {
        id,
        type: 'text',
        isPlaceholder: true,
        placeholderType,
        content: options.content || '<p>Click to add text</p>',
        x: options.x,
        y: options.y,
        width: options.width,
        height: options.height,
        rotation: 0,
        opacity: 1,
        resizing: 'fixed',
        style: {
            fontSize: options.fontSize || 20,
            textAlign: options.textAlign || 'left',
            verticalAlign: options.verticalAlign || 'top',
            fontFamily: options.fontFamily || 'var(--theme-font-body)',
            fontWeight: options.fontWeight || '400',
            lineHeight: options.lineHeight || 1.5,
            letterSpacing: options.letterSpacing || '0',
            // Use theme slot for color
            textFill: { 
                type: 'solid', 
                themeSlot: options.textSlot !== undefined ? options.textSlot : THEME_SLOTS.TEXT_1 
            },
            ...(options.backgroundColor !== undefined ? {
                fills: [{
                    type: 'solid',
                    themeSlot: options.backgroundSlot,
                    visible: true,
                    opacity: 100
                }]
            } : {}),
            ...(options.borderRadius ? { borderRadius: options.borderRadius } : {})
        }
    };
}

/**
 * Create a complete slide master preset
 * @param {string} id - Preset ID
 * @param {string} name - Preset display name
 * @param {Object} colorTheme - Color theme from ThemePresets
 * @param {string} fontPresetId - ID of font preset from FontPresets.js
 * @param {string} description - Preset description
 * @param {boolean} isDarkTheme - Whether this is a dark or light theme (affects slot assignments)
 */
function createSlideMasterPreset(id, name, colorTheme, fontPresetId, description, isDarkTheme = true) {
    const themeId = `theme-${id}`;
    
    // Choose slot assignments based on theme type
    const themeSlots = isDarkTheme ? DARK_THEME : LIGHT_THEME;
    
    // Get the font preset
    const fontPreset = getFontPresetById(fontPresetId) || getFontPresetById('modern-clean');
    
    // Compute hex colors from h,s slots + luma values
    const hexColors = computeThemeHexColors(colorTheme);
    
    console.log(`[SlideMasterPreset] Creating preset: ${id} (${isDarkTheme ? 'dark' : 'light'})`);
    console.log(`[SlideMasterPreset] Color theme:`, colorTheme?.name, colorTheme?.id);
    console.log(`[SlideMasterPreset] Computed hex colors:`, hexColors);
    console.log(`[SlideMasterPreset] Font preset:`, fontPreset?.name, fontPresetId);
    
    // Create enhanced lumaTheme with computed hex values
    const lumaThemeWithHex = {
        ...colorTheme,
        // Add computed hex colors to each slot for easy access
        slots: colorTheme.slots.map((slot, i) => ({
            ...slot,
            hex: hexColors[i],
            luma: LUMA_SLOTS[i]?.luma
        })),
        // Also store as resolvedColors array for ThemeSwatches compatibility
        resolvedColors: hexColors
    };
    
    const themeMaster = {
        id: themeId,
        type: 'theme',
        name,
        description,
        presetId: id,
        isDarkTheme,
        // Background uses appropriate slot for theme type
        background: { 
            type: 'solid', 
            themeSlot: themeSlots.BG_PRIMARY
        },
        elements: {},
        elementOrder: [],
        themeSettings: {
            // Store the luma theme with computed hex values
            lumaTheme: lumaThemeWithHex,
            // Store font preset reference
            fontPresetId: fontPresetId,
            // Store theme type for reference
            isDarkTheme,
            themeSlots,
            fonts: {
                heading: fontPreset.fonts.heading.family,
                body: fontPreset.fonts.body.family,
                headingWeight: fontPreset.fonts.heading.weight,
                bodyWeight: fontPreset.fonts.body.weight,
                headingFallback: fontPreset.fonts.heading.fallback,
                bodyFallback: fontPreset.fonts.body.fallback
            },
            // Text styles come from the font preset, with proper contrast slots
            textStyles: createTextStylesFromFontPreset(fontPreset, themeSlots)
        }
    };
    
    // Create layout masters using the font preset and proper theme slots
    const layouts = createLayoutMastersWithFontPreset(themeId, fontPreset, themeSlots);
    
    return {
        theme: themeMaster,
        layouts,
        // Metadata for preset selector
        meta: {
            id,
            name,
            description,
            colorThemeName: colorTheme.name,
            typographyName: fontPreset.name,
            fontPresetId: fontPresetId,
            isDarkTheme,
            preview: {
                // Use proper slots for preview based on theme type
                backgroundColor: hexColors[themeSlots.BG_PRIMARY] || '#1a1a1a',
                textColor: hexColors[themeSlots.TEXT_PRIMARY] || '#ffffff',
                accentColor: hexColors[themeSlots.ACCENT_1] || '#3B82F6'
            }
        }
    };
}

/**
 * Create layout masters with placeholders using font preset styles
 * @param {string} parentId - Parent theme master ID
 * @param {Object} fontPreset - Font preset from FontPresets.js
 * @param {Object} themeSlots - Slot mapping (DARK_THEME or LIGHT_THEME)
 */
function createLayoutMastersWithFontPreset(parentId, fontPreset, themeSlots = DARK_THEME) {
    const styles = fontPreset.styles;
    const fonts = fontPreset.fonts;
    
    return {
        [`${parentId}-layout-title`]: {
            id: `${parentId}-layout-title`,
            type: 'layout',
            parentId,
            name: 'Title Slide',
            background: null,
            elements: {
                'placeholder-title': createPlaceholderWithPreset('placeholder-title', 'title', {
                    content: '<h1>Click to add title</h1>',
                    x: 160, y: 320, width: 1600, height: 240,
                    textAlign: 'center', verticalAlign: 'middle',
                    textSlot: themeSlots.TEXT_PRIMARY
                }, styles.title, fonts.heading),
                'placeholder-subtitle': createPlaceholderWithPreset('placeholder-subtitle', 'subtitle', {
                    content: '<p>Click to add subtitle</p>',
                    x: 320, y: 580, width: 1280, height: 120,
                    textAlign: 'center', verticalAlign: 'middle',
                    textSlot: themeSlots.TEXT_SECONDARY
                }, styles.subtitle, fonts.body)
            },
            elementOrder: ['placeholder-title', 'placeholder-subtitle']
        },
        [`${parentId}-layout-title-content`]: {
            id: `${parentId}-layout-title-content`,
            type: 'layout',
            parentId,
            name: 'Title and Content',
            background: null,
            elements: {
                'placeholder-title': createPlaceholderWithPreset('placeholder-title', 'title', {
                    content: '<h1>Click to add title</h1>',
                    x: 100, y: 60, width: 1720, height: 100,
                    textAlign: 'left', verticalAlign: 'middle',
                    textSlot: themeSlots.TEXT_PRIMARY
                }, styles.heading1, fonts.heading),
                'placeholder-body': createPlaceholderWithPreset('placeholder-body', 'body', {
                    content: '<p>Click to add text</p>',
                    x: 100, y: 180, width: 1720, height: 840,
                    textAlign: 'left', verticalAlign: 'top',
                    textSlot: themeSlots.TEXT_PRIMARY
                }, styles.body, fonts.body)
            },
            elementOrder: ['placeholder-title', 'placeholder-body']
        },
        [`${parentId}-layout-section-header`]: {
            id: `${parentId}-layout-section-header`,
            type: 'layout',
            parentId,
            name: 'Section Header',
            background: null,
            elements: {
                'placeholder-title': createPlaceholderWithPreset('placeholder-title', 'title', {
                    content: '<h1>Section Title</h1>',
                    x: 100, y: 380, width: 1720, height: 160,
                    textAlign: 'left', verticalAlign: 'middle',
                    textSlot: themeSlots.TEXT_PRIMARY
                }, styles.title, fonts.heading),
                'placeholder-subtitle': createPlaceholderWithPreset('placeholder-subtitle', 'subtitle', {
                    content: '<p>Optional description for this section</p>',
                    x: 100, y: 560, width: 1400, height: 100,
                    textAlign: 'left', verticalAlign: 'top',
                    textSlot: themeSlots.TEXT_SECONDARY
                }, styles.body, fonts.body)
            },
            elementOrder: ['placeholder-title', 'placeholder-subtitle']
        },
        [`${parentId}-layout-two-content`]: {
            id: `${parentId}-layout-two-content`,
            type: 'layout',
            parentId,
            name: 'Two Column',
            background: null,
            elements: {
                'placeholder-title': createPlaceholderWithPreset('placeholder-title', 'title', {
                    content: '<h1>Click to add title</h1>',
                    x: 100, y: 60, width: 1720, height: 100,
                    textAlign: 'left', verticalAlign: 'middle',
                    textSlot: themeSlots.TEXT_PRIMARY
                }, styles.heading1, fonts.heading),
                'placeholder-left': createPlaceholderWithPreset('placeholder-left', 'body', {
                    content: '<p>Click to add text</p>',
                    x: 100, y: 180, width: 830, height: 840,
                    textAlign: 'left', verticalAlign: 'top',
                    textSlot: themeSlots.TEXT_PRIMARY
                }, styles.body, fonts.body),
                'placeholder-right': createPlaceholderWithPreset('placeholder-right', 'body', {
                    content: '<p>Click to add text</p>',
                    x: 990, y: 180, width: 830, height: 840,
                    textAlign: 'left', verticalAlign: 'top',
                    textSlot: themeSlots.TEXT_PRIMARY
                }, styles.body, fonts.body)
            },
            elementOrder: ['placeholder-title', 'placeholder-left', 'placeholder-right']
        },
        [`${parentId}-layout-comparison`]: {
            id: `${parentId}-layout-comparison`,
            type: 'layout',
            parentId,
            name: 'Comparison',
            background: null,
            elements: {
                'placeholder-title': createPlaceholderWithPreset('placeholder-title', 'title', {
                    content: '<h1>Click to add title</h1>',
                    x: 100, y: 60, width: 1720, height: 100,
                    textAlign: 'left', verticalAlign: 'middle',
                    textSlot: themeSlots.TEXT_PRIMARY
                }, styles.heading1, fonts.heading),
                'placeholder-left-title': createPlaceholderWithPreset('placeholder-left-title', 'subtitle', {
                    content: '<h2>Option A</h2>',
                    x: 100, y: 180, width: 830, height: 60,
                    textAlign: 'left', verticalAlign: 'middle',
                    textSlot: themeSlots.ACCENT_1
                }, styles.heading2, fonts.heading),
                'placeholder-left': createPlaceholderWithPreset('placeholder-left', 'body', {
                    content: '<p>Click to add text</p>',
                    x: 100, y: 260, width: 830, height: 760,
                    textAlign: 'left', verticalAlign: 'top',
                    textSlot: themeSlots.TEXT_PRIMARY
                }, styles.body, fonts.body),
                'placeholder-right-title': createPlaceholderWithPreset('placeholder-right-title', 'subtitle', {
                    content: '<h2>Option B</h2>',
                    x: 990, y: 180, width: 830, height: 60,
                    textAlign: 'left', verticalAlign: 'middle',
                    textSlot: themeSlots.ACCENT_2
                }, styles.heading2, fonts.heading),
                'placeholder-right': createPlaceholderWithPreset('placeholder-right', 'body', {
                    content: '<p>Click to add text</p>',
                    x: 990, y: 260, width: 830, height: 760,
                    textAlign: 'left', verticalAlign: 'top',
                    textSlot: themeSlots.TEXT_PRIMARY
                }, styles.body, fonts.body)
            },
            elementOrder: ['placeholder-title', 'placeholder-left-title', 'placeholder-left', 'placeholder-right-title', 'placeholder-right']
        },
        [`${parentId}-layout-blank`]: {
            id: `${parentId}-layout-blank`,
            type: 'layout',
            parentId,
            name: 'Blank',
            background: null,
            elements: {},
            elementOrder: []
        },
        [`${parentId}-layout-picture-caption`]: {
            id: `${parentId}-layout-picture-caption`,
            type: 'layout',
            parentId,
            name: 'Picture with Caption',
            background: null,
            elements: {
                'placeholder-title': createPlaceholderWithPreset('placeholder-title', 'title', {
                    content: '<h1>Click to add title</h1>',
                    x: 100, y: 60, width: 1720, height: 100,
                    textAlign: 'left', verticalAlign: 'middle',
                    textSlot: themeSlots.TEXT_PRIMARY
                }, styles.heading1, fonts.heading),
                'placeholder-picture': createPlaceholder('placeholder-picture', 'picture', {
                    content: '<p style="opacity:0.6;text-align:center;">🖼️ Click to add picture</p>',
                    x: 100, y: 180, width: 1200, height: 840,
                    fontSize: 24, textAlign: 'center', verticalAlign: 'middle',
                    fontFamily: fonts.body.family, fontWeight: '400',
                    textSlot: themeSlots.TEXT_MUTED,
                    backgroundColor: true,
                    backgroundSlot: themeSlots.BG_SECONDARY,
                    borderRadius: '8px'
                }),
                'placeholder-caption': createPlaceholderWithPreset('placeholder-caption', 'text', {
                    content: '<p>Add image caption or description here</p>',
                    x: 1360, y: 180, width: 460, height: 840,
                    textAlign: 'left', verticalAlign: 'top',
                    textSlot: themeSlots.TEXT_SECONDARY
                }, styles.bodySmall, fonts.body)
            },
            elementOrder: ['placeholder-title', 'placeholder-picture', 'placeholder-caption']
        },
        [`${parentId}-layout-content-caption`]: {
            id: `${parentId}-layout-content-caption`,
            type: 'layout',
            parentId,
            name: 'Content with Caption',
            background: null,
            elements: {
                'placeholder-title': createPlaceholderWithPreset('placeholder-title', 'title', {
                    content: '<h1>Click to add title</h1>',
                    x: 100, y: 60, width: 1720, height: 100,
                    textAlign: 'left', verticalAlign: 'middle',
                    textSlot: themeSlots.TEXT_PRIMARY
                }, styles.heading1, fonts.heading),
                'placeholder-body': createPlaceholderWithPreset('placeholder-body', 'body', {
                    content: '<p>Click to add text</p>',
                    x: 100, y: 180, width: 1200, height: 840,
                    textAlign: 'left', verticalAlign: 'top',
                    textSlot: themeSlots.TEXT_PRIMARY
                }, styles.body, fonts.body),
                'placeholder-caption': createPlaceholderWithPreset('placeholder-caption', 'text', {
                    content: '<p>Add notes or supporting information here</p>',
                    x: 1360, y: 180, width: 460, height: 840,
                    textAlign: 'left', verticalAlign: 'top',
                    textSlot: themeSlots.TEXT_SECONDARY
                }, styles.bodySmall, fonts.body)
            },
            elementOrder: ['placeholder-title', 'placeholder-body', 'placeholder-caption']
        }
    };
}

/**
 * Create a placeholder element using font preset style (typography from preset, color from theme)
 */
function createPlaceholderWithPreset(id, placeholderType, options, presetStyle, fontInfo) {
    return {
        id,
        type: 'text',
        isPlaceholder: true,
        placeholderType,
        content: options.content || '<p>Click to add text</p>',
        x: options.x,
        y: options.y,
        width: options.width,
        height: options.height,
        rotation: 0,
        opacity: 1,
        resizing: 'fixed',
        style: {
            // Typography from font preset
            fontSize: presetStyle.fontSize,
            fontWeight: presetStyle.fontWeight,
            lineHeight: presetStyle.lineHeight,
            letterSpacing: presetStyle.letterSpacing,
            textTransform: presetStyle.textTransform || 'none',
            fontFamily: fontInfo.family,
            fontFamilyFallback: fontInfo.fallback,
            // Layout from options
            textAlign: options.textAlign || 'left',
            verticalAlign: options.verticalAlign || 'top',
            // Color from theme slot
            textFill: { 
                type: 'solid', 
                themeSlot: options.textSlot !== undefined ? options.textSlot : THEME_SLOTS.TEXT_1 
            },
            ...(options.backgroundColor !== undefined ? {
                fills: [{
                    type: 'solid',
                    themeSlot: options.backgroundSlot,
                    visible: true,
                    opacity: 100
                }]
            } : {}),
            ...(options.borderRadius ? { borderRadius: options.borderRadius } : {})
        }
    };
}

/**
 * Slide Master Presets - Complete theme + typography combinations
 * Each preset uses a color theme from ThemePresets and a font preset from FontPresets
 * 
 * Dark themes: Light text on dark backgrounds (high contrast)
 * Light themes: Dark text on light backgrounds (high contrast)
 */
export const SLIDE_MASTER_PRESETS = [
    // ========== DARK THEMES ==========
    createSlideMasterPreset(
        'modern-minimal',
        'Modern Minimal',
        NEUTRAL_PRESET,
        'modern-clean',  // Font preset ID from FontPresets.js
        'Clean, professional look with neutral colors and modern typography',
        true  // isDarkTheme
    ),
    createSlideMasterPreset(
        'electric-bold',
        'Electric Bold',
        ELECTRIC_DREAMS_PRESET,
        'contrast',  // High contrast font preset
        'High-energy neon colors with bold, impactful typography',
        true  // isDarkTheme
    ),
    createSlideMasterPreset(
        'sunset-creative',
        'Sunset Creative',
        SUNSET_BOULEVARD_PRESET,
        'humanist',  // Humanist font preset
        'Warm sunset tones with playful, creative typography',
        true  // isDarkTheme
    ),
    createSlideMasterPreset(
        'tropical-fresh',
        'Tropical Fresh',
        TROPICAL_PARADISE_PRESET,
        'geometric',  // Geometric font preset
        'Vibrant tropical colors with clean modern fonts',
        true  // isDarkTheme
    ),
    
    // ========== LIGHT THEMES ==========
    createSlideMasterPreset(
        'berry-elegant',
        'Berry Elegant',
        BERRY_BLISS_PRESET,
        'elegant',  // Elegant serif font preset
        'Soft berry pastels with elegant serif typography',
        false  // isLightTheme
    ),
    createSlideMasterPreset(
        'emerald-classic',
        'Emerald Classic',
        EMERALD_GOLD_PRESET,
        'professional-mix',  // Professional mix font preset
        'Luxurious emerald and gold with classic serif fonts',
        false  // isLightTheme
    )
];

/**
 * Get a preset by ID
 */
export function getPresetById(id) {
    return SLIDE_MASTER_PRESETS.find(p => p.meta.id === id)?.meta;
}

/**
 * Get full preset data by ID (includes theme and layouts)
 */
export function getFullPresetById(id) {
    return SLIDE_MASTER_PRESETS.find(p => p.meta.id === id);
}

/**
 * Get all preset metadata for display
 */
export function getPresetList() {
    return SLIDE_MASTER_PRESETS.map(p => ({
        ...p.meta,
        colorThemeId: p.theme.themeSettings?.lumaTheme?.id,
        background: p.theme.background,
        typography: p.theme.themeSettings?.fonts
    }));
}

/**
 * Apply a preset to create new masters (returns masters object to merge into state)
 */
export function applyPreset(presetId) {
    const preset = getPresetById(presetId);
    if (!preset) return null;
    
    return {
        [preset.theme.id]: preset.theme,
        ...preset.layouts
    };
}

/**
 * Get the default preset
 */
export function getDefaultPreset() {
    return SLIDE_MASTER_PRESETS[0];
}

/**
 * Export for initial state creation
 */
export function createDefaultMasters() {
    const defaultPreset = getDefaultPreset();
    return {
        [defaultPreset.theme.id]: defaultPreset.theme,
        ...defaultPreset.layouts
    };
}
