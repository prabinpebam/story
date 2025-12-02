/**
 * ColorResolver.js
 * 
 * Universal color value creation and resolution service.
 * Provides a clean API for working with colors that can be either:
 * - Custom (user-picked, not linked to theme)
 * - Theme-linked (references a theme slot, updates when theme changes)
 * 
 * This module follows the Color Value Architecture spec:
 * documentation/specs/core/color-value-architecture.md
 * 
 * Key principle: Elements and renderers are agnostic about color sources.
 * They receive a ColorValue with a resolved `hex` and optional `source` metadata.
 * Renderers only read `hex` and `opacity` - they NEVER inspect `source`.
 */

import { store } from '../core/Store.js';
import { getEffectiveSlotIndex, COLOR_MODES } from '../ui/panels/color-theme/ColorThemeUtils.js';

/**
 * @typedef {Object} ColorSource
 * @property {'custom' | 'theme'} type - The source type
 * @property {number} [themeSlot] - Theme slot index (0-11), only present if type === 'theme'
 */

/**
 * @typedef {Object} ColorValue
 * @property {string} hex - The resolved hex color (always present, e.g., '#FF5733')
 * @property {number} [opacity] - Opacity 0-100 (default 100)
 * @property {ColorSource} [source] - Source information for UI purposes
 */

/**
 * Default fallback color when resolution fails
 */
const DEFAULT_COLOR = '#000000';

/**
 * Default opacity value
 */
const DEFAULT_OPACITY = 100;

/**
 * ColorResolver - Universal color creation and resolution service
 */
export const ColorResolver = {
    // =========================================================================
    // CREATION FUNCTIONS
    // =========================================================================

    /**
     * Create a custom (non-linked) color value.
     * Use this when user picks a color in the HSB picker or types a hex value.
     * 
     * @param {string} hex - The hex color value (e.g., '#FF5733')
     * @param {number} [opacity=100] - Opacity 0-100
     * @returns {ColorValue} A custom ColorValue
     * 
     * @example
     * const color = ColorResolver.createCustomColor('#FF5733');
     * // { hex: '#FF5733', opacity: 100, source: { type: 'custom' } }
     */
    createCustomColor(hex, opacity = DEFAULT_OPACITY) {
        return {
            hex: this.normalizeHex(hex),
            opacity: this.clampOpacity(opacity),
            source: { type: 'custom' }
        };
    },

    /**
     * Create a theme-linked color value.
     * Use this when user clicks a theme swatch to link the color.
     * The hex value is resolved from the current theme.
     * 
     * @param {number} slotIndex - Theme slot index (0-11)
     * @param {number} [opacity=100] - Opacity 0-100
     * @returns {ColorValue} A theme-linked ColorValue
     * 
     * @example
     * const color = ColorResolver.createThemeColor(5);
     * // { hex: '#3B82F6', opacity: 100, source: { type: 'theme', themeSlot: 5 } }
     */
    createThemeColor(slotIndex, opacity = DEFAULT_OPACITY) {
        const clampedSlot = Math.max(0, Math.min(11, Math.floor(slotIndex)));
        const hex = this.resolveThemeSlot(clampedSlot);
        
        return {
            hex: hex,
            opacity: this.clampOpacity(opacity),
            source: { type: 'theme', themeSlot: clampedSlot }
        };
    },

    // =========================================================================
    // RESOLUTION FUNCTIONS
    // =========================================================================

    /**
     * Resolve a theme slot to its current hex value.
     * Handles dark mode mapping automatically.
     * 
     * @param {number} slotIndex - Theme slot index (0-11)
     * @returns {string} The resolved hex color
     */
    resolveThemeSlot(slotIndex) {
        if (slotIndex === undefined || slotIndex === null) return DEFAULT_COLOR;
        if (slotIndex < 0 || slotIndex > 11) return DEFAULT_COLOR;

        const state = store.getState();
        const themeMaster = Object.values(state.masters || {}).find(m => m.type === 'theme');
        const lumaTheme = themeMaster?.themeSettings?.lumaTheme;

        if (!lumaTheme?.slots) {
            return DEFAULT_COLOR;
        }

        // Get the color mode (defaults to 'light')
        const colorMode = lumaTheme.colorMode || COLOR_MODES.LIGHT;

        // Apply dark mode mapping if needed
        // In dark mode, slot N maps to slot (11 - N), swapping shadows ↔ highlights
        const effectiveIndex = getEffectiveSlotIndex(slotIndex, colorMode);

        // Get the hex from the effective slot
        const slot = lumaTheme.slots[effectiveIndex];
        if (slot?.hex) {
            return slot.hex;
        }

        // Fallback to resolvedColors array
        if (lumaTheme.resolvedColors?.[effectiveIndex]) {
            return lumaTheme.resolvedColors[effectiveIndex];
        }

        return DEFAULT_COLOR;
    },

    /**
     * Get the display hex for any ColorValue.
     * This is what renderers should use - it handles all resolution logic.
     * 
     * For custom colors: returns the stored hex directly
     * For theme-linked colors: re-resolves from current theme (ensures fresh value)
     * 
     * @param {ColorValue | string | null | undefined} colorValue - The color value to resolve
     * @returns {string} The hex color to display
     * 
     * @example
     * // Custom color - returns stored hex
     * ColorResolver.getDisplayColor({ hex: '#FF5733', source: { type: 'custom' } });
     * // '#FF5733'
     * 
     * // Theme-linked - resolves from current theme
     * ColorResolver.getDisplayColor({ hex: '#old', source: { type: 'theme', themeSlot: 5 } });
     * // '#3B82F6' (current value from theme slot 5)
     */
    getDisplayColor(colorValue) {
        if (!colorValue) return DEFAULT_COLOR;

        // Handle string input (legacy format)
        if (typeof colorValue === 'string') {
            return this.normalizeHex(colorValue);
        }

        // If theme-linked, always re-resolve to get current theme value
        if (this.isThemeLinked(colorValue)) {
            return this.resolveThemeSlot(colorValue.source.themeSlot);
        }

        // For custom colors, return the stored hex
        return colorValue.hex || DEFAULT_COLOR;
    },

    /**
     * Get the opacity for a ColorValue.
     * 
     * @param {ColorValue | null | undefined} colorValue - The color value
     * @returns {number} Opacity 0-100
     */
    getOpacity(colorValue) {
        if (!colorValue) return DEFAULT_OPACITY;
        return colorValue.opacity ?? DEFAULT_OPACITY;
    },

    // =========================================================================
    // QUERY FUNCTIONS
    // =========================================================================

    /**
     * Check if a color is theme-linked.
     * 
     * @param {ColorValue | null | undefined} colorValue - The color value to check
     * @returns {boolean} True if the color is linked to a theme slot
     */
    isThemeLinked(colorValue) {
        return colorValue?.source?.type === 'theme' && 
               colorValue.source.themeSlot !== undefined &&
               colorValue.source.themeSlot !== null;
    },

    /**
     * Get the theme slot index if the color is theme-linked.
     * 
     * @param {ColorValue | null | undefined} colorValue - The color value
     * @returns {number | null} The slot index (0-11) or null if not theme-linked
     */
    getThemeSlot(colorValue) {
        if (!this.isThemeLinked(colorValue)) return null;
        return colorValue.source.themeSlot;
    },

    // =========================================================================
    // MODIFICATION FUNCTIONS
    // =========================================================================

    /**
     * Unlink a color from theme (converts to custom).
     * Preserves the current resolved hex value.
     * 
     * @param {ColorValue} colorValue - The color value to unlink
     * @returns {ColorValue} A new custom ColorValue with the same visual appearance
     * 
     * @example
     * const linked = { hex: '#3B82F6', source: { type: 'theme', themeSlot: 5 } };
     * const unlinked = ColorResolver.unlinkFromTheme(linked);
     * // { hex: '#3B82F6', opacity: 100, source: { type: 'custom' } }
     */
    unlinkFromTheme(colorValue) {
        const hex = this.getDisplayColor(colorValue);
        const opacity = this.getOpacity(colorValue);
        
        return {
            hex: hex,
            opacity: opacity,
            source: { type: 'custom' }
        };
    },

    /**
     * Link an existing color to a theme slot.
     * The color will now update when the theme changes.
     * 
     * @param {ColorValue | null | undefined} colorValue - The original color value (for opacity)
     * @param {number} slotIndex - The theme slot to link to (0-11)
     * @returns {ColorValue} A new theme-linked ColorValue
     */
    linkToTheme(colorValue, slotIndex) {
        const opacity = this.getOpacity(colorValue);
        return this.createThemeColor(slotIndex, opacity);
    },

    /**
     * Update the opacity of a ColorValue without changing its source.
     * 
     * @param {ColorValue} colorValue - The original color value
     * @param {number} opacity - New opacity 0-100
     * @returns {ColorValue} A new ColorValue with updated opacity
     */
    withOpacity(colorValue, opacity) {
        if (!colorValue) {
            return this.createCustomColor(DEFAULT_COLOR, opacity);
        }

        return {
            ...colorValue,
            opacity: this.clampOpacity(opacity)
        };
    },

    /**
     * Update the hex value of a ColorValue.
     * This automatically converts theme-linked colors to custom.
     * 
     * @param {ColorValue} colorValue - The original color value
     * @param {string} hex - New hex color
     * @returns {ColorValue} A new custom ColorValue with the new hex
     */
    withHex(colorValue, hex) {
        const opacity = this.getOpacity(colorValue);
        return this.createCustomColor(hex, opacity);
    },

    // =========================================================================
    // NORMALIZATION FUNCTIONS
    // =========================================================================

    /**
     * Normalize any color input to the standard ColorValue format.
     * Handles legacy formats, plain strings, objects with various structures.
     * Use this when loading data from files or handling mixed formats.
     * 
     * @param {any} input - Any color input
     * @returns {ColorValue} A normalized ColorValue
     * 
     * @example
     * // Plain hex string
     * ColorResolver.normalizeColorValue('#FF5733');
     * // { hex: '#FF5733', opacity: 100, source: { type: 'custom' } }
     * 
     * // Legacy format with themeSlot
     * ColorResolver.normalizeColorValue({ hex: '#123', themeSlot: 5 });
     * // { hex: '#3B82F6', opacity: 100, source: { type: 'theme', themeSlot: 5 } }
     * 
     * // Already normalized
     * ColorResolver.normalizeColorValue({ hex: '#FF5733', source: { type: 'custom' } });
     * // Returns as-is (with defaults filled in)
     */
    normalizeColorValue(input) {
        // Null/undefined -> default black custom color
        if (input === null || input === undefined) {
            return this.createCustomColor(DEFAULT_COLOR);
        }

        // String -> custom color
        if (typeof input === 'string') {
            return this.createCustomColor(input);
        }

        // Already has proper source structure
        if (input.source?.type) {
            if (input.source.type === 'theme' && input.source.themeSlot !== undefined) {
                // Theme-linked: re-resolve to ensure fresh hex
                return this.createThemeColor(input.source.themeSlot, input.opacity);
            }
            // Custom: normalize and return
            return {
                hex: this.normalizeHex(input.hex),
                opacity: input.opacity ?? DEFAULT_OPACITY,
                source: { type: 'custom' }
            };
        }

        // Legacy format: { hex, themeSlot?, opacity? }
        if (input.themeSlot !== undefined && input.themeSlot !== null) {
            return this.createThemeColor(input.themeSlot, input.opacity);
        }

        // Legacy format: { hex, opacity? } or { value, opacity? }
        const hex = input.hex || input.value || DEFAULT_COLOR;
        return this.createCustomColor(hex, input.opacity);
    },

    /**
     * Normalize a fill object's color to ColorValue format.
     * Handles solid fills and gradient stops.
     * 
     * @param {Object} fill - A fill object (solid or gradient)
     * @returns {Object} The fill with normalized color(s)
     */
    normalizeFillColor(fill) {
        if (!fill) return fill;

        if (fill.type === 'solid') {
            // Solid fill: normalize the color field
            return {
                ...fill,
                color: this.normalizeColorValue(fill.color || { hex: fill.value })
            };
        }

        if (fill.type === 'gradient' && fill.value?.stops) {
            // Gradient fill: normalize each stop's color
            return {
                ...fill,
                value: {
                    ...fill.value,
                    stops: fill.value.stops.map(stop => ({
                        ...stop,
                        color: this.normalizeColorValue(stop.color || { hex: stop.hex })
                    }))
                }
            };
        }

        return fill;
    },

    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================

    /**
     * Normalize a hex color string.
     * - Adds # prefix if missing
     * - Expands shorthand (e.g., #F00 -> #FF0000)
     * - Uppercases letters
     * 
     * @param {string} hex - The hex color string
     * @returns {string} Normalized hex color
     */
    normalizeHex(hex) {
        if (!hex || typeof hex !== 'string') return DEFAULT_COLOR;

        // Remove whitespace
        hex = hex.trim();

        // Add # if missing
        if (!hex.startsWith('#')) {
            hex = '#' + hex;
        }

        // Expand shorthand
        const shorthandRegex = /^#([a-fA-F\d])([a-fA-F\d])([a-fA-F\d])$/;
        const match = hex.match(shorthandRegex);
        if (match) {
            hex = `#${match[1]}${match[1]}${match[2]}${match[2]}${match[3]}${match[3]}`;
        }

        // Validate format
        if (!/^#[a-fA-F\d]{6}$/i.test(hex)) {
            return DEFAULT_COLOR;
        }

        // Return uppercase
        return hex.toUpperCase();
    },

    /**
     * Clamp opacity to valid range.
     * 
     * @param {number} opacity - The opacity value
     * @returns {number} Clamped opacity 0-100
     */
    clampOpacity(opacity) {
        if (typeof opacity !== 'number' || isNaN(opacity)) return DEFAULT_OPACITY;
        return Math.max(0, Math.min(100, opacity));
    },

    /**
     * Check if two ColorValues are equivalent.
     * Two colors are equivalent if they resolve to the same display color and opacity.
     * 
     * @param {ColorValue} a - First color value
     * @param {ColorValue} b - Second color value
     * @returns {boolean} True if visually equivalent
     */
    areEquivalent(a, b) {
        return this.getDisplayColor(a) === this.getDisplayColor(b) &&
               this.getOpacity(a) === this.getOpacity(b);
    },

    /**
     * Check if two ColorValues have the same source.
     * 
     * @param {ColorValue} a - First color value
     * @param {ColorValue} b - Second color value
     * @returns {boolean} True if same source type and slot
     */
    haveSameSource(a, b) {
        const aLinked = this.isThemeLinked(a);
        const bLinked = this.isThemeLinked(b);

        if (aLinked !== bLinked) return false;
        if (!aLinked) return true; // Both custom

        return a.source.themeSlot === b.source.themeSlot;
    },

    // =========================================================================
    // SERIALIZATION HELPERS
    // =========================================================================

    /**
     * Prepare a ColorValue for JSON serialization.
     * Removes undefined values and ensures clean structure.
     * 
     * @param {ColorValue} colorValue - The color value to serialize
     * @returns {Object} Clean object ready for JSON.stringify
     */
    toJSON(colorValue) {
        const normalized = this.normalizeColorValue(colorValue);
        const result = {
            hex: normalized.hex,
            source: normalized.source
        };

        // Only include opacity if not default
        if (normalized.opacity !== DEFAULT_OPACITY) {
            result.opacity = normalized.opacity;
        }

        return result;
    }
};

// Default export for convenience
export default ColorResolver;
