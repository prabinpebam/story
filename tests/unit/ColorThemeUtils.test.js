/**
 * ColorThemeUtils Tests
 * 
 * Tests for the luma-locked color theme utility functions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    LUMA_SLOTS,
    COLUMN_DEFINITIONS,
    COLUMN_HEADER_LUMA,
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
    validateTheme,
    createTheme,
    cloneTheme,
    generateThemeId,
    generateThemeCSSVariables,
    getColumnSlots,
    getSlotColumn,
    getSlotRow,
    updateColumnHue,
    getColumnHueSaturation,
    getColumnHeaderColor
} from '../../src/ui/panels/color-theme/ColorThemeUtils.js';

describe('ColorThemeUtils', () => {
    describe('LUMA_SLOTS', () => {
        it('should have exactly 12 slots', () => {
            expect(LUMA_SLOTS).toHaveLength(12);
        });

        it('should have slots numbered 1-12', () => {
            LUMA_SLOTS.forEach((slot, index) => {
                expect(slot.slot).toBe(index + 1);
            });
        });

        it('should have luma values increasing from shadows to highlights', () => {
            const lumaValues = LUMA_SLOTS.map(s => s.luma);
            expect(lumaValues[0]).toBe(5);   // darkest
            expect(lumaValues[11]).toBe(97); // lightest
            
            // Verify ordering
            for (let i = 1; i < lumaValues.length; i++) {
                expect(lumaValues[i]).toBeGreaterThan(lumaValues[i - 1]);
            }
        });

        it('should organize slots into clusters', () => {
            const shadowSlots = LUMA_SLOTS.filter(s => s.cluster === 'shadows');
            const midtoneSlots = LUMA_SLOTS.filter(s => s.cluster === 'midtones');
            const highlightSlots = LUMA_SLOTS.filter(s => s.cluster === 'highlights');
            
            expect(shadowSlots).toHaveLength(4);
            expect(midtoneSlots).toHaveLength(4);
            expect(highlightSlots).toHaveLength(4);
        });
    });

    describe('hslToHex', () => {
        it('should convert pure red correctly', () => {
            expect(hslToHex(0, 100, 50).toLowerCase()).toBe('#ff0000');
        });

        it('should convert pure green correctly', () => {
            expect(hslToHex(120, 100, 50).toLowerCase()).toBe('#00ff00');
        });

        it('should convert pure blue correctly', () => {
            expect(hslToHex(240, 100, 50).toLowerCase()).toBe('#0000ff');
        });

        it('should convert black correctly', () => {
            expect(hslToHex(0, 0, 0).toLowerCase()).toBe('#000000');
        });

        it('should convert white correctly', () => {
            expect(hslToHex(0, 0, 100).toLowerCase()).toBe('#ffffff');
        });

        it('should convert gray correctly', () => {
            const gray = hslToHex(0, 0, 50).toLowerCase();
            expect(gray).toMatch(/^#[789][0-9a-f][789][0-9a-f][789][0-9a-f]$/);
        });
    });

    describe('hexToHsl', () => {
        it('should convert pure red correctly', () => {
            const { h, s, l } = hexToHsl('#ff0000');
            expect(h).toBe(0);
            expect(s).toBe(100);
            expect(l).toBe(50);
        });

        it('should convert pure green correctly', () => {
            const { h, s, l } = hexToHsl('#00ff00');
            expect(h).toBe(120);
            expect(s).toBe(100);
            expect(l).toBe(50);
        });

        it('should convert pure blue correctly', () => {
            const { h, s, l } = hexToHsl('#0000ff');
            expect(h).toBe(240);
            expect(s).toBe(100);
            expect(l).toBe(50);
        });

        it('should convert black correctly', () => {
            const { h, s, l } = hexToHsl('#000000');
            expect(l).toBe(0);
        });

        it('should convert white correctly', () => {
            const { h, s, l } = hexToHsl('#ffffff');
            expect(l).toBe(100);
        });

        it('should handle hex without # prefix', () => {
            const { h, s, l } = hexToHsl('ff0000');
            expect(h).toBe(0);
            expect(s).toBe(100);
            expect(l).toBe(50);
        });
    });

    describe('isColorDark', () => {
        it('should return true for black', () => {
            expect(isColorDark('#000000')).toBe(true);
        });

        it('should return false for white', () => {
            expect(isColorDark('#ffffff')).toBe(false);
        });

        it('should return true for dark gray', () => {
            expect(isColorDark('#333333')).toBe(true);
        });

        it('should return false for light gray', () => {
            expect(isColorDark('#cccccc')).toBe(false);
        });
    });

    describe('Adjustment functions', () => {
        describe('applyBrightness', () => {
            it('should increase luma with positive brightness', () => {
                const result = applyBrightness(50, 50);
                expect(result).toBeGreaterThan(50);
            });

            it('should decrease luma with negative brightness', () => {
                const result = applyBrightness(50, -50);
                expect(result).toBeLessThan(50);
            });

            it('should clamp to 0-100 range', () => {
                expect(applyBrightness(5, -100)).toBeGreaterThanOrEqual(0);
                expect(applyBrightness(95, 100)).toBeLessThanOrEqual(100);
            });
        });

        describe('applyContrast', () => {
            it('should push values away from midpoint with positive contrast', () => {
                const low = applyContrast(30, 50);
                const high = applyContrast(70, 50);
                expect(low).toBeLessThan(30);
                expect(high).toBeGreaterThan(70);
            });

            it('should pull values toward midpoint with negative contrast', () => {
                const low = applyContrast(30, -50);
                const high = applyContrast(70, -50);
                expect(low).toBeGreaterThan(30);
                expect(high).toBeLessThan(70);
            });
        });

        describe('applyHighlights', () => {
            it('should only affect luma values above 50', () => {
                expect(applyHighlights(30, 50)).toBe(30);
                expect(applyHighlights(70, 50)).not.toBe(70);
            });
        });

        describe('applyShadows', () => {
            it('should only affect luma values below 50', () => {
                expect(applyShadows(70, 50)).toBe(70);
                expect(applyShadows(30, 50)).not.toBe(30);
            });
        });

        describe('applyWhites', () => {
            it('should only affect luma values above 80', () => {
                expect(applyWhites(50, 50)).toBe(50);
                expect(applyWhites(90, 50)).not.toBe(90);
            });
        });

        describe('applyBlacks', () => {
            it('should only affect luma values below 20', () => {
                expect(applyBlacks(50, 50)).toBe(50);
                expect(applyBlacks(10, 50)).not.toBe(10);
            });
        });

        describe('applySaturation', () => {
            it('should increase saturation with positive adjustment', () => {
                expect(applySaturation(50, 50)).toBeGreaterThan(50);
            });

            it('should decrease saturation with negative adjustment', () => {
                expect(applySaturation(50, -50)).toBeLessThan(50);
            });

            it('should clamp to 0-100 range', () => {
                expect(applySaturation(100, 100)).toBeLessThanOrEqual(100);
                expect(applySaturation(50, -200)).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('applyAdjustments', () => {
        it('should apply all adjustments to a slot', () => {
            const slotColor = { h: 200, s: 50 };
            const baseLuma = 50;
            const adjustments = { ...DEFAULT_ADJUSTMENTS, brightness: 10 };
            
            const result = applyAdjustments(slotColor, baseLuma, adjustments);
            
            expect(result.h).toBe(200);
            expect(result.l).toBeGreaterThan(50);
        });

        it('should preserve hue', () => {
            const slotColor = { h: 180, s: 60 };
            const result = applyAdjustments(slotColor, 50, { ...DEFAULT_ADJUSTMENTS, contrast: 50 });
            
            expect(result.h).toBe(180);
        });
    });

    describe('generateThemeColors', () => {
        it('should generate 12 hex colors', () => {
            const slots = createNeutralTheme();
            const colors = generateThemeColors(slots);
            
            expect(colors).toHaveLength(12);
            colors.forEach(color => {
                expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
            });
        });

        it('should generate colors matching luma slot values for neutral theme', () => {
            const slots = createNeutralTheme();
            const colors = generateThemeColors(slots);
            
            colors.forEach((color, index) => {
                const { l } = hexToHsl(color);
                const expectedLuma = LUMA_SLOTS[index].luma;
                // Allow ±2 tolerance due to rounding
                expect(Math.abs(l - expectedLuma)).toBeLessThanOrEqual(2);
            });
        });

        it('should apply adjustments to all colors', () => {
            const slots = createNeutralTheme();
            const adjustments = { ...DEFAULT_ADJUSTMENTS, brightness: 20 };
            const colors = generateThemeColors(slots, adjustments);
            const defaultColors = generateThemeColors(slots);
            
            // Each color should be lighter than default
            for (let i = 0; i < 12; i++) {
                const adjusted = hexToHsl(colors[i]).l;
                const original = hexToHsl(defaultColors[i]).l;
                // Middle slots should be noticeably brighter
                if (i >= 3 && i <= 8) {
                    expect(adjusted).toBeGreaterThan(original);
                }
            }
        });
    });

    describe('generateInvertedThemeColors', () => {
        it('should generate 12 hex colors', () => {
            const slots = createNeutralTheme();
            const colors = generateInvertedThemeColors(slots);
            
            expect(colors).toHaveLength(12);
        });

        it('should invert luma values (light becomes dark)', () => {
            const slots = createNeutralTheme();
            const normal = generateThemeColors(slots);
            const inverted = generateInvertedThemeColors(slots);
            
            // First slot (normally dark) should now be light
            const firstNormal = hexToHsl(normal[0]).l;
            const firstInverted = hexToHsl(inverted[0]).l;
            expect(firstInverted).toBeGreaterThan(firstNormal);
            
            // Last slot (normally light) should now be dark
            const lastNormal = hexToHsl(normal[11]).l;
            const lastInverted = hexToHsl(inverted[11]).l;
            expect(lastInverted).toBeLessThan(lastNormal);
        });
    });

    describe('Theme Creation', () => {
        describe('createNeutralTheme', () => {
            it('should create 12 slots', () => {
                const slots = createNeutralTheme();
                expect(slots).toHaveLength(12);
            });

            it('should have zero saturation for all slots', () => {
                const slots = createNeutralTheme();
                slots.forEach(slot => {
                    expect(slot.s).toBe(0);
                });
            });
        });

        describe('createMonochromaticTheme', () => {
            it('should create 12 slots with same hue', () => {
                const slots = createMonochromaticTheme(180, 50);
                expect(slots).toHaveLength(12);
                slots.forEach(slot => {
                    expect(slot.h).toBe(180);
                });
            });

            it('should reduce saturation for extreme luma values', () => {
                const slots = createMonochromaticTheme(180, 50);
                // First slot (luma 5%) should have reduced saturation
                expect(slots[0].s).toBeLessThan(50);
                // Last slot (luma 97%) should have reduced saturation
                expect(slots[11].s).toBeLessThan(50);
            });
        });

        describe('createComplementaryTheme', () => {
            it('should create 12 slots', () => {
                const slots = createComplementaryTheme(0, 180, 50);
                expect(slots).toHaveLength(12);
            });

            it('should use different hues for shadows and highlights', () => {
                const slots = createComplementaryTheme(0, 180, 50);
                // First 4 slots should have hue 0
                for (let i = 0; i < 4; i++) {
                    expect(slots[i].h).toBe(0);
                }
                // Last 4 slots should have hue 180
                for (let i = 8; i < 12; i++) {
                    expect(slots[i].h).toBe(180);
                }
            });
        });
    });

    describe('Theme Validation', () => {
        describe('validateTheme', () => {
            it('should validate a correct theme', () => {
                const theme = createTheme('test', 'Test Theme', createNeutralTheme());
                const result = validateTheme(theme);
                expect(result.valid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });

            it('should reject null theme', () => {
                const result = validateTheme(null);
                expect(result.valid).toBe(false);
            });

            it('should reject theme without id', () => {
                const theme = { name: 'Test', slots: createNeutralTheme() };
                const result = validateTheme(theme);
                expect(result.valid).toBe(false);
                expect(result.errors.some(e => e.includes('id'))).toBe(true);
            });

            it('should reject theme without name', () => {
                const theme = { id: 'test', slots: createNeutralTheme() };
                const result = validateTheme(theme);
                expect(result.valid).toBe(false);
                expect(result.errors.some(e => e.includes('name'))).toBe(true);
            });

            it('should reject theme with wrong number of slots', () => {
                const theme = { id: 'test', name: 'Test', slots: [{ h: 0, s: 0 }] };
                const result = validateTheme(theme);
                expect(result.valid).toBe(false);
                expect(result.errors.some(e => e.includes('12 slots'))).toBe(true);
            });

            it('should reject slots with invalid hue', () => {
                const slots = createNeutralTheme();
                slots[0].h = 400; // Invalid
                const theme = { id: 'test', name: 'Test', slots };
                const result = validateTheme(theme);
                expect(result.valid).toBe(false);
            });

            it('should reject slots with invalid saturation', () => {
                const slots = createNeutralTheme();
                slots[0].s = 150; // Invalid
                const theme = { id: 'test', name: 'Test', slots };
                const result = validateTheme(theme);
                expect(result.valid).toBe(false);
            });
        });

        describe('createTheme', () => {
            it('should create a theme with all required properties', () => {
                const theme = createTheme('test-id', 'Test Name', createNeutralTheme());
                
                expect(theme.id).toBe('test-id');
                expect(theme.name).toBe('Test Name');
                expect(theme.slots).toHaveLength(12);
                expect(theme.adjustments).toEqual(DEFAULT_ADJUSTMENTS);
                expect(theme.isPreset).toBe(false);
                expect(theme.createdAt).toBeDefined();
                expect(theme.modifiedAt).toBeDefined();
            });

            it('should mark as preset when specified', () => {
                const theme = createTheme('preset-1', 'Preset', createNeutralTheme(), true);
                expect(theme.isPreset).toBe(true);
            });
        });

        describe('cloneTheme', () => {
            it('should create an independent copy', () => {
                const original = createTheme('original', 'Original', createNeutralTheme());
                const clone = cloneTheme(original, 'clone', 'Clone');
                
                expect(clone.id).toBe('clone');
                expect(clone.name).toBe('Clone');
                expect(clone.isPreset).toBe(false);
                
                // Modify clone should not affect original
                clone.slots[0].h = 180;
                expect(original.slots[0].h).toBe(0);
            });
        });

        describe('generateThemeId', () => {
            it('should generate unique IDs', () => {
                const ids = new Set();
                for (let i = 0; i < 100; i++) {
                    ids.add(generateThemeId());
                }
                expect(ids.size).toBe(100);
            });

            it('should start with "theme_"', () => {
                const id = generateThemeId();
                expect(id.startsWith('theme_')).toBe(true);
            });
        });
    });

    describe('CSS Variable Generation', () => {
        describe('generateThemeCSSVariables', () => {
            it('should generate 12 CSS variable declarations', () => {
                const slots = createNeutralTheme();
                const colors = generateThemeColors(slots);
                const css = generateThemeCSSVariables(colors);
                
                const lines = css.split('\n');
                expect(lines).toHaveLength(12);
            });

            it('should use correct variable names', () => {
                const slots = createNeutralTheme();
                const colors = generateThemeColors(slots);
                const css = generateThemeCSSVariables(colors);
                
                for (let i = 1; i <= 12; i++) {
                    expect(css).toContain(`--theme-slot${i}:`);
                }
            });

            it('should include hex color values', () => {
                const slots = createNeutralTheme();
                const colors = generateThemeColors(slots);
                const css = generateThemeCSSVariables(colors);
                
                colors.forEach(color => {
                    expect(css).toContain(color);
                });
            });
        });
    });

    // =========================================
    // 4-Column System Tests
    // =========================================
    
    describe('COLUMN_DEFINITIONS', () => {
        it('should have exactly 4 columns', () => {
            expect(COLUMN_DEFINITIONS).toHaveLength(4);
        });

        it('should define correct roles for each column', () => {
            expect(COLUMN_DEFINITIONS[0].role).toBe('secondary1');
            expect(COLUMN_DEFINITIONS[1].role).toBe('primary');
            expect(COLUMN_DEFINITIONS[2].role).toBe('accent');
            expect(COLUMN_DEFINITIONS[3].role).toBe('secondary2');
        });

        it('should have 3 slots per column (one from each row)', () => {
            COLUMN_DEFINITIONS.forEach(col => {
                expect(col.slots).toHaveLength(3);
            });
        });

        it('should map slots to correct column positions', () => {
            // Column 1: slots 0, 4, 8 (Secondary 1)
            expect(COLUMN_DEFINITIONS[0].slots).toEqual([0, 4, 8]);
            // Column 2: slots 1, 5, 9 (Primary)
            expect(COLUMN_DEFINITIONS[1].slots).toEqual([1, 5, 9]);
            // Column 3: slots 2, 6, 10 (Accent)
            expect(COLUMN_DEFINITIONS[2].slots).toEqual([2, 6, 10]);
            // Column 4: slots 3, 7, 11 (Secondary 2)
            expect(COLUMN_DEFINITIONS[3].slots).toEqual([3, 7, 11]);
        });
    });

    describe('COLUMN_HEADER_LUMA', () => {
        it('should be 50 for neutral midtone preview', () => {
            expect(COLUMN_HEADER_LUMA).toBe(50);
        });
    });

    describe('LUMA_SLOTS column/role metadata', () => {
        it('should have column and role defined for each slot', () => {
            LUMA_SLOTS.forEach(slot => {
                expect(slot.column).toBeDefined();
                expect(slot.role).toBeDefined();
            });
        });

        it('should have correct column assignments', () => {
            // Row 1 (Shadows): slots 0-3 -> columns 1-4
            expect(LUMA_SLOTS[0].column).toBe(1);
            expect(LUMA_SLOTS[1].column).toBe(2);
            expect(LUMA_SLOTS[2].column).toBe(3);
            expect(LUMA_SLOTS[3].column).toBe(4);
            
            // Row 2 (Midtones): slots 4-7 -> columns 1-4
            expect(LUMA_SLOTS[4].column).toBe(1);
            expect(LUMA_SLOTS[5].column).toBe(2);
            expect(LUMA_SLOTS[6].column).toBe(3);
            expect(LUMA_SLOTS[7].column).toBe(4);
            
            // Row 3 (Highlights): slots 8-11 -> columns 1-4
            expect(LUMA_SLOTS[8].column).toBe(1);
            expect(LUMA_SLOTS[9].column).toBe(2);
            expect(LUMA_SLOTS[10].column).toBe(3);
            expect(LUMA_SLOTS[11].column).toBe(4);
        });
    });

    describe('getColumnSlots', () => {
        it('should return correct slot indices for each column', () => {
            expect(getColumnSlots(0)).toEqual([0, 4, 8]);
            expect(getColumnSlots(1)).toEqual([1, 5, 9]);
            expect(getColumnSlots(2)).toEqual([2, 6, 10]);
            expect(getColumnSlots(3)).toEqual([3, 7, 11]);
        });

        it('should return empty array for invalid column', () => {
            expect(getColumnSlots(4)).toEqual([]);
            expect(getColumnSlots(-1)).toEqual([]);
        });
    });

    describe('getSlotColumn', () => {
        it('should return correct column index for each slot', () => {
            // Row 1
            expect(getSlotColumn(0)).toBe(0);
            expect(getSlotColumn(1)).toBe(1);
            expect(getSlotColumn(2)).toBe(2);
            expect(getSlotColumn(3)).toBe(3);
            // Row 2
            expect(getSlotColumn(4)).toBe(0);
            expect(getSlotColumn(5)).toBe(1);
            expect(getSlotColumn(6)).toBe(2);
            expect(getSlotColumn(7)).toBe(3);
            // Row 3
            expect(getSlotColumn(8)).toBe(0);
            expect(getSlotColumn(9)).toBe(1);
            expect(getSlotColumn(10)).toBe(2);
            expect(getSlotColumn(11)).toBe(3);
        });
    });

    describe('getSlotRow', () => {
        it('should return correct row index for each slot', () => {
            // Row 0 (Shadows)
            expect(getSlotRow(0)).toBe(0);
            expect(getSlotRow(1)).toBe(0);
            expect(getSlotRow(2)).toBe(0);
            expect(getSlotRow(3)).toBe(0);
            // Row 1 (Midtones)
            expect(getSlotRow(4)).toBe(1);
            expect(getSlotRow(5)).toBe(1);
            expect(getSlotRow(6)).toBe(1);
            expect(getSlotRow(7)).toBe(1);
            // Row 2 (Highlights)
            expect(getSlotRow(8)).toBe(2);
            expect(getSlotRow(9)).toBe(2);
            expect(getSlotRow(10)).toBe(2);
            expect(getSlotRow(11)).toBe(2);
        });
    });

    describe('updateColumnHue', () => {
        it('should update all slots in a column with new hue and saturation', () => {
            const slots = Array(12).fill(null).map(() => ({ h: 0, s: 0 }));
            const updated = updateColumnHue(slots, 0, 180, 75);
            
            // Column 0 slots (0, 4, 8) should have new values
            expect(updated[0]).toEqual({ h: 180, s: 75 });
            expect(updated[4]).toEqual({ h: 180, s: 75 });
            expect(updated[8]).toEqual({ h: 180, s: 75 });
            
            // Other slots should remain unchanged
            expect(updated[1]).toEqual({ h: 0, s: 0 });
            expect(updated[5]).toEqual({ h: 0, s: 0 });
        });

        it('should not mutate original slots array', () => {
            const slots = Array(12).fill(null).map(() => ({ h: 0, s: 0 }));
            const updated = updateColumnHue(slots, 1, 210, 60);
            
            expect(slots[1]).toEqual({ h: 0, s: 0 });
            expect(updated[1]).toEqual({ h: 210, s: 60 });
        });
    });

    describe('getColumnHueSaturation', () => {
        it('should return hue and saturation from first slot in column', () => {
            const slots = Array(12).fill(null).map((_, i) => ({ h: i * 30, s: i * 5 }));
            
            // Column 0: first slot is index 0
            expect(getColumnHueSaturation(slots, 0)).toEqual({ h: 0, s: 0 });
            // Column 1: first slot is index 1
            expect(getColumnHueSaturation(slots, 1)).toEqual({ h: 30, s: 5 });
            // Column 2: first slot is index 2
            expect(getColumnHueSaturation(slots, 2)).toEqual({ h: 60, s: 10 });
        });
    });

    describe('getColumnHeaderColor', () => {
        it('should return hex color at 60% luma', () => {
            const slots = Array(12).fill(null).map(() => ({ h: 210, s: 50 }));
            const headerColor = getColumnHeaderColor(slots, 0);
            
            // Should be a valid hex color
            expect(headerColor).toMatch(/^#[0-9a-f]{6}$/i);
            
            // Convert back to HSL and check luma is 50
            const hsl = hexToHsl(headerColor);
            expect(hsl.l).toBe(50);
        });
    });
});
