/**
 * ThemePresets Tests
 * 
 * Tests for the built-in theme presets.
 */

import { describe, it, expect } from 'vitest';
import {
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
} from '../../src/ui/panels/color-theme/ThemePresets.js';
import { validateTheme } from '../../src/ui/panels/color-theme/ColorThemeUtils.js';

describe('ThemePresets', () => {
    describe('THEME_PRESETS', () => {
        it('should have 12 preset themes', () => {
            expect(THEME_PRESETS).toHaveLength(12);
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

        it('OCEAN_PRESET should have blue hues', () => {
            OCEAN_PRESET.slots.forEach(slot => {
                expect(slot.h).toBeGreaterThanOrEqual(180);
                expect(slot.h).toBeLessThanOrEqual(240);
            });
        });

        it('FOREST_PRESET should have green hues', () => {
            FOREST_PRESET.slots.forEach(slot => {
                expect(slot.h).toBeGreaterThanOrEqual(100);
                expect(slot.h).toBeLessThanOrEqual(180);
            });
        });

        it('ROSE_PRESET should have pink/magenta hues', () => {
            ROSE_PRESET.slots.forEach(slot => {
                expect(slot.h).toBeGreaterThanOrEqual(300);
                expect(slot.h).toBeLessThanOrEqual(360);
            });
        });

        it('LAVENDER_PRESET should have purple hues', () => {
            LAVENDER_PRESET.slots.forEach(slot => {
                expect(slot.h).toBeGreaterThanOrEqual(240);
                expect(slot.h).toBeLessThanOrEqual(300);
            });
        });

        it('TEAL_PRESET should have teal/cyan hues', () => {
            TEAL_PRESET.slots.forEach(slot => {
                expect(slot.h).toBeGreaterThanOrEqual(150);
                expect(slot.h).toBeLessThanOrEqual(200);
            });
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
            expect(getPresetById('preset_ocean')).toBe(OCEAN_PRESET);
            expect(getPresetById('preset_forest')).toBe(FOREST_PRESET);
            expect(getPresetById('preset_sunset')).toBe(SUNSET_PRESET);
            expect(getPresetById('preset_midnight')).toBe(MIDNIGHT_PRESET);
        });
    });

    describe('getPresetByName', () => {
        it('should return preset when name exists', () => {
            const preset = getPresetByName('Neutral');
            expect(preset).toBe(NEUTRAL_PRESET);
        });

        it('should be case-insensitive', () => {
            expect(getPresetByName('ocean')).toBe(OCEAN_PRESET);
            expect(getPresetByName('OCEAN')).toBe(OCEAN_PRESET);
            expect(getPresetByName('Ocean')).toBe(OCEAN_PRESET);
        });

        it('should return null for non-existent name', () => {
            const preset = getPresetByName('Non Existent');
            expect(preset).toBeNull();
        });
    });

    describe('isPresetTheme', () => {
        it('should return true for preset IDs', () => {
            expect(isPresetTheme('preset_neutral')).toBe(true);
            expect(isPresetTheme('preset_ocean')).toBe(true);
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
