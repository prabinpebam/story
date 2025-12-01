/**
 * ThemePresets Tests
 * 
 * Tests for the built-in theme presets.
 * Updated for 10-preset luma-locked tonal system with diverse color harmonies.
 */

import { describe, it, expect } from 'vitest';
import {
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
} from '../../src/ui/panels/color-theme/ThemePresets.js';
import { validateTheme } from '../../src/ui/panels/color-theme/ColorThemeUtils.js';

describe('ThemePresets', () => {
    describe('THEME_PRESETS', () => {
        it('should have 10 preset themes', () => {
            expect(THEME_PRESETS).toHaveLength(10);
        });

        it('should have all presets be valid themes', () => {
            THEME_PRESETS.forEach(preset => {
                const result = validateTheme(preset);
                expect(result.valid).toBe(true);
            });
        });

        it('should mark all presets as isPreset=true', () => {
            THEME_PRESETS.forEach(preset => {
                expect(preset.isPreset).toBe(true);
            });
        });

        it('should have unique IDs for all presets', () => {
            const ids = new Set(THEME_PRESETS.map(p => p.id));
            expect(ids.size).toBe(THEME_PRESETS.length);
        });

        it('should have unique names for all presets', () => {
            const names = new Set(THEME_PRESETS.map(p => p.name));
            expect(names.size).toBe(THEME_PRESETS.length);
        });

        it('should have IDs starting with "preset_"', () => {
            THEME_PRESETS.forEach(preset => {
                expect(preset.id.startsWith('preset_')).toBe(true);
            });
        });
    });

    describe('Individual Presets', () => {
        it('NEUTRAL_PRESET should have zero saturation', () => {
            NEUTRAL_PRESET.slots.forEach(slot => {
                expect(slot.s).toBe(0);
            });
        });

        it('ELECTRIC_DREAMS_PRESET should have cyan and magenta hues (complementary)', () => {
            const hues = ELECTRIC_DREAMS_PRESET.slots.map(s => s.h);
            // Should contain cyan range (175-190) and magenta range (285-315)
            const hasCyan = hues.some(h => h >= 175 && h <= 190);
            const hasMagenta = hues.some(h => h >= 285 && h <= 315);
            expect(hasCyan).toBe(true);
            expect(hasMagenta).toBe(true);
        });

        it('SUNSET_BOULEVARD_PRESET should have orange and purple hues (split complementary)', () => {
            const hues = SUNSET_BOULEVARD_PRESET.slots.map(s => s.h);
            const hasOrange = hues.some(h => h >= 15 && h <= 40);
            const hasPurple = hues.some(h => h >= 260 && h <= 285);
            expect(hasOrange).toBe(true);
            expect(hasPurple).toBe(true);
        });

        it('TROPICAL_PARADISE_PRESET should have teal, coral, and yellow hues (triadic)', () => {
            const hues = TROPICAL_PARADISE_PRESET.slots.map(s => s.h);
            const hasTeal = hues.some(h => h >= 170 && h <= 185);
            const hasCoral = hues.some(h => h >= 0 && h <= 15);
            const hasYellow = hues.some(h => h >= 40 && h <= 60);
            expect(hasTeal).toBe(true);
            expect(hasCoral).toBe(true);
            expect(hasYellow).toBe(true);
        });

        it('BERRY_BLISS_PRESET should have pink, purple, and blue hues (analogous)', () => {
            const hues = BERRY_BLISS_PRESET.slots.map(s => s.h);
            const hasPink = hues.some(h => h >= 300 && h <= 335);
            const hasPurple = hues.some(h => h >= 260 && h <= 300);
            const hasBlue = hues.some(h => h >= 225 && h <= 260);
            expect(hasPink).toBe(true);
            expect(hasPurple).toBe(true);
            expect(hasBlue).toBe(true);
        });

        it('EMERALD_GOLD_PRESET should have green and gold hues (complementary)', () => {
            const hues = EMERALD_GOLD_PRESET.slots.map(s => s.h);
            const hasGreen = hues.some(h => h >= 140 && h <= 165);
            const hasGold = hues.some(h => h >= 40 && h <= 55);
            expect(hasGreen).toBe(true);
            expect(hasGold).toBe(true);
        });

        it('COSMIC_NEBULA_PRESET should have purple, blue, orange, and teal (tetradic)', () => {
            const hues = COSMIC_NEBULA_PRESET.slots.map(s => s.h);
            const hasPurple = hues.some(h => h >= 250 && h <= 275);
            const hasBlue = hues.some(h => h >= 195 && h <= 215);
            const hasOrange = hues.some(h => h >= 20 && h <= 35);
            const hasTeal = hues.some(h => h >= 175 && h <= 190);
            expect(hasPurple).toBe(true);
            expect(hasBlue).toBe(true);
            expect(hasOrange).toBe(true);
            expect(hasTeal).toBe(true);
        });

        it('CITRUS_BURST_PRESET should have yellow, orange, and lime hues (analogous)', () => {
            const hues = CITRUS_BURST_PRESET.slots.map(s => s.h);
            const hasYellow = hues.some(h => h >= 45 && h <= 60);
            const hasOrange = hues.some(h => h >= 20 && h <= 40);
            const hasLime = hues.some(h => h >= 60 && h <= 85);
            expect(hasYellow).toBe(true);
            expect(hasOrange).toBe(true);
            expect(hasLime).toBe(true);
        });

        it('OCEAN_SUNSET_PRESET should have blue and orange hues (complementary)', () => {
            const hues = OCEAN_SUNSET_PRESET.slots.map(s => s.h);
            const hasBlue = hues.some(h => h >= 195 && h <= 225);
            const hasOrange = hues.some(h => h >= 15 && h <= 35);
            expect(hasBlue).toBe(true);
            expect(hasOrange).toBe(true);
        });

        it('ROSE_GARDEN_PRESET should have rose, pink, and green hues (split complementary)', () => {
            const hues = ROSE_GARDEN_PRESET.slots.map(s => s.h);
            const hasRose = hues.some(h => h >= 340 && h <= 360);
            const hasPink = hues.some(h => h >= 325 && h <= 350);
            const hasGreen = hues.some(h => h >= 135 && h <= 160);
            expect(hasRose).toBe(true);
            expect(hasPink).toBe(true);
            expect(hasGreen).toBe(true);
        });
    });

    describe('getPresetById', () => {
        it('should return preset when ID exists', () => {
            const preset = getPresetById('preset_neutral');
            expect(preset).toBe(NEUTRAL_PRESET);
        });

        it('should return null for non-existent ID', () => {
            const preset = getPresetById('non_existent');
            expect(preset).toBeNull();
        });

        it('should return correct preset for each ID', () => {
            expect(getPresetById('preset_electric_dreams')).toBe(ELECTRIC_DREAMS_PRESET);
            expect(getPresetById('preset_sunset_boulevard')).toBe(SUNSET_BOULEVARD_PRESET);
            expect(getPresetById('preset_tropical_paradise')).toBe(TROPICAL_PARADISE_PRESET);
            expect(getPresetById('preset_berry_bliss')).toBe(BERRY_BLISS_PRESET);
            expect(getPresetById('preset_emerald_gold')).toBe(EMERALD_GOLD_PRESET);
            expect(getPresetById('preset_cosmic_nebula')).toBe(COSMIC_NEBULA_PRESET);
            expect(getPresetById('preset_citrus_burst')).toBe(CITRUS_BURST_PRESET);
            expect(getPresetById('preset_ocean_sunset')).toBe(OCEAN_SUNSET_PRESET);
            expect(getPresetById('preset_rose_garden')).toBe(ROSE_GARDEN_PRESET);
        });
    });

    describe('getPresetByName', () => {
        it('should return preset when name exists', () => {
            const preset = getPresetByName('Neutral');
            expect(preset).toBe(NEUTRAL_PRESET);
        });

        it('should be case-insensitive', () => {
            expect(getPresetByName('electric dreams')).toBe(ELECTRIC_DREAMS_PRESET);
            expect(getPresetByName('ELECTRIC DREAMS')).toBe(ELECTRIC_DREAMS_PRESET);
            expect(getPresetByName('Electric Dreams')).toBe(ELECTRIC_DREAMS_PRESET);
        });

        it('should return null for non-existent name', () => {
            const preset = getPresetByName('Non Existent');
            expect(preset).toBeNull();
        });
    });

    describe('isPresetTheme', () => {
        it('should return true for preset IDs', () => {
            expect(isPresetTheme('preset_neutral')).toBe(true);
            expect(isPresetTheme('preset_electric_dreams')).toBe(true);
            expect(isPresetTheme('preset_anything')).toBe(true);
        });

        it('should return false for custom theme IDs', () => {
            expect(isPresetTheme('theme_12345')).toBe(false);
            expect(isPresetTheme('custom_theme')).toBe(false);
            expect(isPresetTheme('my-theme')).toBe(false);
        });
    });

    describe('Preset Theme Structure', () => {
        THEME_PRESETS.forEach(preset => {
            describe(`${preset.name} preset`, () => {
                it('should have exactly 12 slots', () => {
                    expect(preset.slots).toHaveLength(12);
                });

                it('should have valid slot values', () => {
                    preset.slots.forEach((slot, index) => {
                        expect(slot.h).toBeGreaterThanOrEqual(0);
                        expect(slot.h).toBeLessThanOrEqual(360);
                        expect(slot.s).toBeGreaterThanOrEqual(0);
                        expect(slot.s).toBeLessThanOrEqual(100);
                    });
                });

                it('should have required properties', () => {
                    expect(preset.id).toBeDefined();
                    expect(preset.name).toBeDefined();
                    expect(preset.slots).toBeDefined();
                    expect(preset.isPreset).toBe(true);
                });
            });
        });
    });
});
