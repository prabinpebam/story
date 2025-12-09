import { describe, it, expect } from 'vitest';
import {
    EffectTypes,
    EffectTypeLabels,
    EffectDefaults,
    getEffectTypeOptions,
    isShadowEffect,
    isBlurEffect,
    createEffect,
    BlendModeOptions
} from '../../../../src/core/constants/EffectDefaults.js';

describe('EffectDefaults', () => {
    describe('EffectTypes', () => {
        it('should define all effect types', () => {
            expect(EffectTypes.DROP_SHADOW).toBe('dropShadow');
            expect(EffectTypes.INNER_SHADOW).toBe('innerShadow');
            expect(EffectTypes.LAYER_BLUR).toBe('layerBlur');
            expect(EffectTypes.BACKGROUND_BLUR).toBe('backgroundBlur');
        });
    });

    describe('EffectTypeLabels', () => {
        it('should have labels for all effect types', () => {
            expect(EffectTypeLabels[EffectTypes.DROP_SHADOW]).toBe('Drop Shadow');
            expect(EffectTypeLabels[EffectTypes.INNER_SHADOW]).toBe('Inner Shadow');
            expect(EffectTypeLabels[EffectTypes.LAYER_BLUR]).toBe('Layer Blur');
            expect(EffectTypeLabels[EffectTypes.BACKGROUND_BLUR]).toBe('Background Blur');
        });
    });

    describe('EffectDefaults', () => {
        it('should have defaults for drop shadow', () => {
            const defaults = EffectDefaults[EffectTypes.DROP_SHADOW];
            expect(defaults.type).toBe(EffectTypes.DROP_SHADOW);
            expect(defaults.x).toBe(0);
            expect(defaults.y).toBe(4);
            expect(defaults.blur).toBe(8);
            expect(defaults.spread).toBe(0);
            expect(defaults.color).toBe('#000000');
            expect(defaults.opacity).toBe(25);
            expect(defaults.blendMode).toBe('normal');
            expect(defaults.visible).toBe(true);
        });

        it('should have defaults for inner shadow', () => {
            const defaults = EffectDefaults[EffectTypes.INNER_SHADOW];
            expect(defaults.type).toBe(EffectTypes.INNER_SHADOW);
            expect(defaults.x).toBe(0);
            expect(defaults.y).toBe(2);
            expect(defaults.blur).toBe(4);
            expect(defaults.spread).toBe(0);
        });

        it('should have defaults for layer blur', () => {
            const defaults = EffectDefaults[EffectTypes.LAYER_BLUR];
            expect(defaults.type).toBe(EffectTypes.LAYER_BLUR);
            expect(defaults.radius).toBe(12);
            expect(defaults.mode).toBe('uniform');
            expect(defaults.visible).toBe(true);
        });

        it('should have defaults for background blur', () => {
            const defaults = EffectDefaults[EffectTypes.BACKGROUND_BLUR];
            expect(defaults.type).toBe(EffectTypes.BACKGROUND_BLUR);
            expect(defaults.radius).toBe(12);
            // Background blur doesn't have mode - it's always uniform
            expect(defaults.visible).toBe(true);
        });
    });

    describe('getEffectTypeOptions', () => {
        it('should return options for all effect types', () => {
            const options = getEffectTypeOptions();
            expect(options).toHaveLength(4);
            expect(options[0]).toEqual({ label: 'Drop Shadow', value: 'dropShadow' });
            expect(options[1]).toEqual({ label: 'Inner Shadow', value: 'innerShadow' });
            expect(options[2]).toEqual({ label: 'Layer Blur', value: 'layerBlur' });
            expect(options[3]).toEqual({ label: 'Background Blur', value: 'backgroundBlur' });
        });
    });

    describe('isShadowEffect', () => {
        it('should return true for drop shadow', () => {
            expect(isShadowEffect(EffectTypes.DROP_SHADOW)).toBe(true);
        });

        it('should return true for inner shadow', () => {
            expect(isShadowEffect(EffectTypes.INNER_SHADOW)).toBe(true);
        });

        it('should return false for blur effects', () => {
            expect(isShadowEffect(EffectTypes.LAYER_BLUR)).toBe(false);
            expect(isShadowEffect(EffectTypes.BACKGROUND_BLUR)).toBe(false);
        });
    });

    describe('isBlurEffect', () => {
        it('should return true for layer blur', () => {
            expect(isBlurEffect(EffectTypes.LAYER_BLUR)).toBe(true);
        });

        it('should return true for background blur', () => {
            expect(isBlurEffect(EffectTypes.BACKGROUND_BLUR)).toBe(true);
        });

        it('should return false for shadow effects', () => {
            expect(isBlurEffect(EffectTypes.DROP_SHADOW)).toBe(false);
            expect(isBlurEffect(EffectTypes.INNER_SHADOW)).toBe(false);
        });
    });

    describe('createEffect', () => {
        it('should create drop shadow with defaults and unique id', () => {
            const effect = createEffect(EffectTypes.DROP_SHADOW);
            expect(effect.type).toBe(EffectTypes.DROP_SHADOW);
            expect(effect.id).toBeDefined();
            expect(effect.id).toMatch(/^effect-/);
            expect(effect.x).toBe(0);
            expect(effect.y).toBe(4);
        });

        it('should create inner shadow with defaults and unique id', () => {
            const effect = createEffect(EffectTypes.INNER_SHADOW);
            expect(effect.type).toBe(EffectTypes.INNER_SHADOW);
            expect(effect.id).toBeDefined();
        });

        it('should create layer blur with defaults and unique id', () => {
            const effect = createEffect(EffectTypes.LAYER_BLUR);
            expect(effect.type).toBe(EffectTypes.LAYER_BLUR);
            expect(effect.id).toBeDefined();
            expect(effect.radius).toBe(12);
        });

        it('should create unique ids for multiple effects', () => {
            const effect1 = createEffect(EffectTypes.DROP_SHADOW);
            const effect2 = createEffect(EffectTypes.DROP_SHADOW);
            expect(effect1.id).not.toBe(effect2.id);
        });

        it('should fall back to drop shadow for unknown types', () => {
            const effect = createEffect('unknownType');
            expect(effect.type).toBe(EffectTypes.DROP_SHADOW);
        });
    });

    describe('BlendModeOptions', () => {
        it('should have common blend modes', () => {
            const values = BlendModeOptions.map(o => o.value);
            expect(values).toContain('normal');
            expect(values).toContain('multiply');
            expect(values).toContain('screen');
            expect(values).toContain('overlay');
        });

        it('should have labels for all options', () => {
            BlendModeOptions.forEach(option => {
                expect(option.label).toBeDefined();
                expect(option.label.length).toBeGreaterThan(0);
            });
        });
    });
});
