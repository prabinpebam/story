/**
 * ColorResolver Tests
 * 
 * Tests for the universal color value resolution service.
 * Follows the Color Value Architecture spec:
 * documentation/specs/core/color-value-architecture.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ColorResolver } from '../../src/utils/ColorResolver.js';

// Mock the store module
vi.mock('../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn()
    }
}));

// Mock the StyleResolver module
vi.mock('../../src/utils/StyleResolver.js', () => ({
    StyleResolver: {
        resolveThemeSlot: vi.fn()
    }
}));

// Import the mocked modules
import { store } from '../../src/core/Store.js';
import { StyleResolver } from '../../src/utils/StyleResolver.js';

/**
 * Helper to create a mock state with theme data
 */
function createMockState(themeSlots = [], colorMode = 'light') {
    return {
        masters: {
            'master-default': {
                type: 'theme',
                themeSettings: {
                    lumaTheme: {
                        slots: themeSlots.map((hex, index) => ({
                            h: 0,
                            s: 0,
                            hex: hex
                        })),
                        colorMode: colorMode,
                        resolvedColors: themeSlots
                    }
                }
            }
        }
    };
}

/**
 * Default 12-slot theme for testing
 */
const DEFAULT_THEME_SLOTS = [
    '#1A1A2E', '#2D2D42', '#404056', '#53536A',  // Shadows (0-3)
    '#66667E', '#797992', '#8C8CA6', '#9F9FBA',  // Midtones (4-7)
    '#B2B2CE', '#C5C5E2', '#D8D8F6', '#F5F5FF'   // Highlights (8-11)
];

describe('ColorResolver', () => {
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
        store.getState.mockReturnValue(createMockState(DEFAULT_THEME_SLOTS));
        
        // Setup StyleResolver mock to return correct slot colors
        StyleResolver.resolveThemeSlot.mockImplementation((slotIndex, fallback = '#000000', slideId = null) => {
            if (slotIndex === undefined || slotIndex === null || slotIndex < 0 || slotIndex > 11) {
                return fallback;
            }
            return DEFAULT_THEME_SLOTS[slotIndex];
        });
    });

    // =========================================================================
    // CREATION FUNCTIONS
    // =========================================================================

    describe('createCustomColor', () => {
        it('creates a custom color with default opacity', () => {
            const color = ColorResolver.createCustomColor('#FF5733');
            
            expect(color).toEqual({
                hex: '#FF5733',
                opacity: 100,
                source: { type: 'custom' }
            });
        });

        it('creates a custom color with specified opacity', () => {
            const color = ColorResolver.createCustomColor('#FF5733', 75);
            
            expect(color).toEqual({
                hex: '#FF5733',
                opacity: 75,
                source: { type: 'custom' }
            });
        });

        it('normalizes hex to uppercase', () => {
            const color = ColorResolver.createCustomColor('#ff5733');
            expect(color.hex).toBe('#FF5733');
        });

        it('adds # prefix if missing', () => {
            const color = ColorResolver.createCustomColor('FF5733');
            expect(color.hex).toBe('#FF5733');
        });

        it('expands shorthand hex', () => {
            const color = ColorResolver.createCustomColor('#F00');
            expect(color.hex).toBe('#FF0000');
        });

        it('clamps opacity to 0-100 range', () => {
            expect(ColorResolver.createCustomColor('#FFF', -10).opacity).toBe(0);
            expect(ColorResolver.createCustomColor('#FFF', 150).opacity).toBe(100);
        });

        it('handles invalid hex gracefully', () => {
            const color = ColorResolver.createCustomColor('invalid');
            expect(color.hex).toBe('#000000');
        });
    });

    describe('createThemeColor', () => {
        it('creates a theme-linked color with resolved hex', () => {
            const color = ColorResolver.createThemeColor(5);
            
            expect(color).toEqual({
                hex: '#797992', // Slot 5 from DEFAULT_THEME_SLOTS
                opacity: 100,
                source: { type: 'theme', themeSlot: 5 }
            });
        });

        it('creates theme color with specified opacity', () => {
            const color = ColorResolver.createThemeColor(5, 50);
            
            expect(color.opacity).toBe(50);
            expect(color.source.themeSlot).toBe(5);
        });

        it('clamps slot index to 0-11', () => {
            expect(ColorResolver.createThemeColor(-1).source.themeSlot).toBe(0);
            expect(ColorResolver.createThemeColor(15).source.themeSlot).toBe(11);
        });

        it('floors fractional slot indices', () => {
            expect(ColorResolver.createThemeColor(5.7).source.themeSlot).toBe(5);
        });
    });

    // =========================================================================
    // RESOLUTION FUNCTIONS
    // =========================================================================

    describe('resolveThemeSlot', () => {
        it('resolves slot to hex from theme', () => {
            expect(ColorResolver.resolveThemeSlot(0)).toBe('#1A1A2E');
            expect(ColorResolver.resolveThemeSlot(5)).toBe('#797992');
            expect(ColorResolver.resolveThemeSlot(11)).toBe('#F5F5FF');
        });

        it('handles dark mode slot mapping via StyleResolver', () => {
            // In dark mode, StyleResolver handles the mapping: slot 0 -> slot 11, slot 11 -> slot 0
            StyleResolver.resolveThemeSlot.mockImplementation((slotIndex, fallback = '#000000', slideId = null) => {
                if (slotIndex === undefined || slotIndex === null || slotIndex < 0 || slotIndex > 11) {
                    return fallback;
                }
                // Simulate dark mode mapping: slot N -> slot (11 - N)
                const effectiveIndex = 11 - slotIndex;
                return DEFAULT_THEME_SLOTS[effectiveIndex];
            });
            
            expect(ColorResolver.resolveThemeSlot(0)).toBe('#F5F5FF');  // Maps to slot 11
            expect(ColorResolver.resolveThemeSlot(11)).toBe('#1A1A2E'); // Maps to slot 0
        });

        it('returns default color for invalid slot', () => {
            expect(ColorResolver.resolveThemeSlot(-1)).toBe('#000000');
            expect(ColorResolver.resolveThemeSlot(12)).toBe('#000000');
            expect(ColorResolver.resolveThemeSlot(null)).toBe('#000000');
            expect(ColorResolver.resolveThemeSlot(undefined)).toBe('#000000');
        });

        it('returns default color when StyleResolver returns fallback', () => {
            StyleResolver.resolveThemeSlot.mockReturnValue('#000000');
            expect(ColorResolver.resolveThemeSlot(5)).toBe('#000000');
        });
        
        it('accepts optional slideId for cascade-aware resolution', () => {
            ColorResolver.resolveThemeSlot(5, 'slide-1');
            expect(StyleResolver.resolveThemeSlot).toHaveBeenCalledWith(5, '#000000', 'slide-1');
        });
    });

    describe('getDisplayColor', () => {
        it('returns hex directly for custom colors', () => {
            const color = { hex: '#FF5733', source: { type: 'custom' } };
            expect(ColorResolver.getDisplayColor(color)).toBe('#FF5733');
        });

        it('re-resolves theme-linked colors', () => {
            const color = { hex: '#OLDVALUE', source: { type: 'theme', themeSlot: 5 } };
            expect(ColorResolver.getDisplayColor(color)).toBe('#797992'); // Fresh from theme
        });

        it('handles string input (legacy format)', () => {
            expect(ColorResolver.getDisplayColor('#FF5733')).toBe('#FF5733');
        });

        it('handles null/undefined input', () => {
            expect(ColorResolver.getDisplayColor(null)).toBe('#000000');
            expect(ColorResolver.getDisplayColor(undefined)).toBe('#000000');
        });
    });

    describe('getOpacity', () => {
        it('returns opacity from ColorValue', () => {
            expect(ColorResolver.getOpacity({ hex: '#FFF', opacity: 75 })).toBe(75);
        });

        it('returns default 100 when opacity not set', () => {
            expect(ColorResolver.getOpacity({ hex: '#FFF' })).toBe(100);
        });

        it('returns default 100 for null/undefined', () => {
            expect(ColorResolver.getOpacity(null)).toBe(100);
            expect(ColorResolver.getOpacity(undefined)).toBe(100);
        });
    });

    // =========================================================================
    // QUERY FUNCTIONS
    // =========================================================================

    describe('isThemeLinked', () => {
        it('returns true for theme-linked colors', () => {
            const color = { hex: '#FFF', source: { type: 'theme', themeSlot: 5 } };
            expect(ColorResolver.isThemeLinked(color)).toBe(true);
        });

        it('returns false for custom colors', () => {
            const color = { hex: '#FFF', source: { type: 'custom' } };
            expect(ColorResolver.isThemeLinked(color)).toBe(false);
        });

        it('returns false for colors without source', () => {
            expect(ColorResolver.isThemeLinked({ hex: '#FFF' })).toBe(false);
        });

        it('returns false for null/undefined', () => {
            expect(ColorResolver.isThemeLinked(null)).toBe(false);
            expect(ColorResolver.isThemeLinked(undefined)).toBe(false);
        });

        it('returns false for theme color with null themeSlot', () => {
            const color = { hex: '#FFF', source: { type: 'theme', themeSlot: null } };
            expect(ColorResolver.isThemeLinked(color)).toBe(false);
        });
    });

    describe('getThemeSlot', () => {
        it('returns slot index for theme-linked colors', () => {
            const color = { hex: '#FFF', source: { type: 'theme', themeSlot: 5 } };
            expect(ColorResolver.getThemeSlot(color)).toBe(5);
        });

        it('returns null for custom colors', () => {
            const color = { hex: '#FFF', source: { type: 'custom' } };
            expect(ColorResolver.getThemeSlot(color)).toBeNull();
        });

        it('returns null for colors without source', () => {
            expect(ColorResolver.getThemeSlot({ hex: '#FFF' })).toBeNull();
        });
    });

    // =========================================================================
    // MODIFICATION FUNCTIONS
    // =========================================================================

    describe('unlinkFromTheme', () => {
        it('converts theme-linked to custom, preserving hex', () => {
            const linked = { hex: '#OLDVALUE', opacity: 75, source: { type: 'theme', themeSlot: 5 } };
            const unlinked = ColorResolver.unlinkFromTheme(linked);
            
            expect(unlinked).toEqual({
                hex: '#797992', // Resolved from theme, not the old value
                opacity: 75,
                source: { type: 'custom' }
            });
        });

        it('preserves custom colors as-is', () => {
            const custom = { hex: '#FF5733', opacity: 100, source: { type: 'custom' } };
            const result = ColorResolver.unlinkFromTheme(custom);
            
            expect(result.hex).toBe('#FF5733');
            expect(result.source.type).toBe('custom');
        });
    });

    describe('linkToTheme', () => {
        it('links existing color to theme slot', () => {
            const custom = { hex: '#FF5733', opacity: 75, source: { type: 'custom' } };
            const linked = ColorResolver.linkToTheme(custom, 5);
            
            expect(linked).toEqual({
                hex: '#797992',
                opacity: 75,
                source: { type: 'theme', themeSlot: 5 }
            });
        });

        it('handles null input', () => {
            const linked = ColorResolver.linkToTheme(null, 5);
            expect(linked.source.themeSlot).toBe(5);
            expect(linked.opacity).toBe(100);
        });
    });

    describe('withOpacity', () => {
        it('updates opacity without changing source', () => {
            const original = { hex: '#FF5733', opacity: 100, source: { type: 'theme', themeSlot: 5 } };
            const updated = ColorResolver.withOpacity(original, 50);
            
            expect(updated.opacity).toBe(50);
            expect(updated.source).toEqual({ type: 'theme', themeSlot: 5 });
        });

        it('creates custom color from null input', () => {
            const color = ColorResolver.withOpacity(null, 50);
            expect(color.opacity).toBe(50);
            expect(color.source.type).toBe('custom');
        });
    });

    describe('withHex', () => {
        it('updates hex and converts to custom', () => {
            const original = { hex: '#OLD', opacity: 75, source: { type: 'theme', themeSlot: 5 } };
            const updated = ColorResolver.withHex(original, '#FF5733');
            
            expect(updated).toEqual({
                hex: '#FF5733',
                opacity: 75,
                source: { type: 'custom' }
            });
        });
    });

    // =========================================================================
    // NORMALIZATION FUNCTIONS
    // =========================================================================

    describe('normalizeColorValue', () => {
        it('normalizes null to default custom color', () => {
            const result = ColorResolver.normalizeColorValue(null);
            expect(result).toEqual({
                hex: '#000000',
                opacity: 100,
                source: { type: 'custom' }
            });
        });

        it('normalizes string to custom color', () => {
            const result = ColorResolver.normalizeColorValue('#FF5733');
            expect(result).toEqual({
                hex: '#FF5733',
                opacity: 100,
                source: { type: 'custom' }
            });
        });

        it('normalizes legacy format with themeSlot', () => {
            const result = ColorResolver.normalizeColorValue({ hex: '#OLD', themeSlot: 5 });
            expect(result.source).toEqual({ type: 'theme', themeSlot: 5 });
            expect(result.hex).toBe('#797992'); // Re-resolved
        });

        it('normalizes legacy format with opacity', () => {
            const result = ColorResolver.normalizeColorValue({ hex: '#FF5733', opacity: 75 });
            expect(result.opacity).toBe(75);
        });

        it('passes through properly structured ColorValue', () => {
            const input = { hex: '#FF5733', opacity: 100, source: { type: 'custom' } };
            const result = ColorResolver.normalizeColorValue(input);
            expect(result.hex).toBe('#FF5733');
            expect(result.source.type).toBe('custom');
        });

        it('re-resolves theme-linked colors', () => {
            const input = { hex: '#STALE', source: { type: 'theme', themeSlot: 5 } };
            const result = ColorResolver.normalizeColorValue(input);
            expect(result.hex).toBe('#797992'); // Fresh from theme
        });

        it('handles legacy format with value instead of hex', () => {
            const result = ColorResolver.normalizeColorValue({ value: '#FF5733' });
            expect(result.hex).toBe('#FF5733');
        });
    });

    describe('normalizeFillColor', () => {
        it('normalizes solid fill color', () => {
            const fill = { type: 'solid', value: '#FF5733' };
            const result = ColorResolver.normalizeFillColor(fill);
            
            expect(result.color).toEqual({
                hex: '#FF5733',
                opacity: 100,
                source: { type: 'custom' }
            });
        });

        it('normalizes gradient stop colors', () => {
            const fill = {
                type: 'gradient',
                value: {
                    type: 'linear',
                    angle: 90,
                    stops: [
                        { position: 0, hex: '#FF0000' },
                        { position: 100, hex: '#0000FF' }
                    ]
                }
            };
            
            const result = ColorResolver.normalizeFillColor(fill);
            
            expect(result.value.stops[0].color.hex).toBe('#FF0000');
            expect(result.value.stops[1].color.hex).toBe('#0000FF');
        });

        it('handles null fill', () => {
            expect(ColorResolver.normalizeFillColor(null)).toBeNull();
        });
    });

    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================

    describe('normalizeHex', () => {
        it('adds # prefix', () => {
            expect(ColorResolver.normalizeHex('FF5733')).toBe('#FF5733');
        });

        it('expands shorthand', () => {
            expect(ColorResolver.normalizeHex('#F00')).toBe('#FF0000');
            expect(ColorResolver.normalizeHex('ABC')).toBe('#AABBCC');
        });

        it('uppercases letters', () => {
            expect(ColorResolver.normalizeHex('#ff5733')).toBe('#FF5733');
        });

        it('returns default for invalid input', () => {
            expect(ColorResolver.normalizeHex('')).toBe('#000000');
            expect(ColorResolver.normalizeHex(null)).toBe('#000000');
            expect(ColorResolver.normalizeHex('invalid')).toBe('#000000');
        });
    });

    describe('clampOpacity', () => {
        it('clamps values to 0-100 range', () => {
            expect(ColorResolver.clampOpacity(-10)).toBe(0);
            expect(ColorResolver.clampOpacity(0)).toBe(0);
            expect(ColorResolver.clampOpacity(50)).toBe(50);
            expect(ColorResolver.clampOpacity(100)).toBe(100);
            expect(ColorResolver.clampOpacity(150)).toBe(100);
        });

        it('returns default for invalid input', () => {
            expect(ColorResolver.clampOpacity(NaN)).toBe(100);
            expect(ColorResolver.clampOpacity(undefined)).toBe(100);
            expect(ColorResolver.clampOpacity('50')).toBe(100);
        });
    });

    describe('areEquivalent', () => {
        it('returns true for same display color and opacity', () => {
            const a = { hex: '#FF5733', opacity: 75, source: { type: 'custom' } };
            const b = { hex: '#FF5733', opacity: 75, source: { type: 'custom' } };
            expect(ColorResolver.areEquivalent(a, b)).toBe(true);
        });

        it('returns false for different colors', () => {
            const a = { hex: '#FF5733', source: { type: 'custom' } };
            const b = { hex: '#00FF00', source: { type: 'custom' } };
            expect(ColorResolver.areEquivalent(a, b)).toBe(false);
        });

        it('returns false for different opacities', () => {
            const a = { hex: '#FF5733', opacity: 100, source: { type: 'custom' } };
            const b = { hex: '#FF5733', opacity: 50, source: { type: 'custom' } };
            expect(ColorResolver.areEquivalent(a, b)).toBe(false);
        });
    });

    describe('haveSameSource', () => {
        it('returns true for both custom', () => {
            const a = { hex: '#111', source: { type: 'custom' } };
            const b = { hex: '#222', source: { type: 'custom' } };
            expect(ColorResolver.haveSameSource(a, b)).toBe(true);
        });

        it('returns true for same theme slot', () => {
            const a = { hex: '#111', source: { type: 'theme', themeSlot: 5 } };
            const b = { hex: '#222', source: { type: 'theme', themeSlot: 5 } };
            expect(ColorResolver.haveSameSource(a, b)).toBe(true);
        });

        it('returns false for different theme slots', () => {
            const a = { hex: '#111', source: { type: 'theme', themeSlot: 5 } };
            const b = { hex: '#222', source: { type: 'theme', themeSlot: 6 } };
            expect(ColorResolver.haveSameSource(a, b)).toBe(false);
        });

        it('returns false for custom vs theme-linked', () => {
            const a = { hex: '#111', source: { type: 'custom' } };
            const b = { hex: '#222', source: { type: 'theme', themeSlot: 5 } };
            expect(ColorResolver.haveSameSource(a, b)).toBe(false);
        });
    });

    // =========================================================================
    // SERIALIZATION
    // =========================================================================

    describe('toJSON', () => {
        it('creates clean JSON for custom color', () => {
            const color = { hex: '#FF5733', opacity: 100, source: { type: 'custom' } };
            const json = ColorResolver.toJSON(color);
            
            expect(json).toEqual({
                hex: '#FF5733',
                source: { type: 'custom' }
            });
            // opacity: 100 should be omitted (it's the default)
            expect(json.opacity).toBeUndefined();
        });

        it('includes non-default opacity', () => {
            const color = { hex: '#FF5733', opacity: 75, source: { type: 'custom' } };
            const json = ColorResolver.toJSON(color);
            
            expect(json.opacity).toBe(75);
        });

        it('creates clean JSON for theme-linked color', () => {
            const color = { hex: '#797992', opacity: 100, source: { type: 'theme', themeSlot: 5 } };
            const json = ColorResolver.toJSON(color);
            
            expect(json).toEqual({
                hex: '#797992',
                source: { type: 'theme', themeSlot: 5 }
            });
        });
    });
});

