import { describe, it, expect } from 'vitest';

import { FilterEngine } from '../../../../src/core/media/FilterEngine.js';

describe('FilterEngine', () => {
    describe('buildCssFilter()', () => {
        it('should return none for null filters', () => {
            expect(FilterEngine.buildCssFilter(null)).toBe('none');
        });

        it('should return none for undefined filters', () => {
            expect(FilterEngine.buildCssFilter(undefined)).toBe('none');
        });

        it('should return none for empty filters', () => {
            expect(FilterEngine.buildCssFilter({})).toBe('none');
        });

        it('should return none for all zero values', () => {
            const filters = { exposure: 0, contrast: 0, saturation: 0, blur: 0 };
            expect(FilterEngine.buildCssFilter(filters)).toBe('none');
        });

        it('should build brightness from exposure', () => {
            const result = FilterEngine.buildCssFilter({ exposure: 50 });
            expect(result).toContain('brightness(1.5');
        });

        it('should handle negative exposure', () => {
            const result = FilterEngine.buildCssFilter({ exposure: -50 });
            expect(result).toContain('brightness(0.5');
        });

        it('should build contrast filter', () => {
            const result = FilterEngine.buildCssFilter({ contrast: 50 });
            expect(result).toContain('contrast(1.5');
        });

        it('should handle negative contrast', () => {
            const result = FilterEngine.buildCssFilter({ contrast: -50 });
            expect(result).toContain('contrast(0.5');
        });

        it('should build saturation filter', () => {
            const result = FilterEngine.buildCssFilter({ saturation: 50 });
            expect(result).toContain('saturate(1.5');
        });

        it('should handle negative saturation', () => {
            const result = FilterEngine.buildCssFilter({ saturation: -50 });
            expect(result).toContain('saturate(0.5');
        });

        it('should build hue-rotate filter', () => {
            const result = FilterEngine.buildCssFilter({ hueRotate: 90 });
            expect(result).toContain('hue-rotate(90deg)');
        });

        it('should build grayscale filter', () => {
            const result = FilterEngine.buildCssFilter({ grayscale: 50 });
            expect(result).toContain('grayscale(50%)');
        });

        it('should build sepia filter', () => {
            const result = FilterEngine.buildCssFilter({ sepia: 75 });
            expect(result).toContain('sepia(75%)');
        });

        it('should build invert filter', () => {
            const result = FilterEngine.buildCssFilter({ invert: 100 });
            expect(result).toContain('invert(100%)');
        });

        it('should build blur filter', () => {
            const result = FilterEngine.buildCssFilter({ blur: 5 });
            expect(result).toContain('blur(5px)');
        });

        it('should combine multiple filters', () => {
            const result = FilterEngine.buildCssFilter({ 
                exposure: 10, 
                contrast: 20, 
                saturation: 30 
            });
            expect(result).toContain('brightness');
            expect(result).toContain('contrast');
            expect(result).toContain('saturate');
        });

        it('should put blur last in filter chain', () => {
            const result = FilterEngine.buildCssFilter({ 
                blur: 5,
                exposure: 10 
            });
            const blurIndex = result.indexOf('blur');
            const brightnessIndex = result.indexOf('brightness');
            expect(blurIndex).toBeGreaterThan(brightnessIndex);
        });
    });

    describe('needsSvgFilter()', () => {
        it('should return false for null', () => {
            expect(FilterEngine.needsSvgFilter(null)).toBe(false);
        });

        it('should return false for empty filters', () => {
            expect(FilterEngine.needsSvgFilter({})).toBe(false);
        });

        it('should return false for CSS-only filters', () => {
            expect(FilterEngine.needsSvgFilter({ exposure: 50, contrast: 20 })).toBe(false);
        });

        it('should return true for temperature', () => {
            expect(FilterEngine.needsSvgFilter({ temperature: 50 })).toBe(true);
        });

        it('should return true for tint', () => {
            expect(FilterEngine.needsSvgFilter({ tint: 30 })).toBe(true);
        });

        it('should return true for highlights', () => {
            expect(FilterEngine.needsSvgFilter({ highlights: 20 })).toBe(true);
        });

        it('should return true for shadows', () => {
            expect(FilterEngine.needsSvgFilter({ shadows: -10 })).toBe(true);
        });

        it('should return false for zero values', () => {
            expect(FilterEngine.needsSvgFilter({ temperature: 0, tint: 0 })).toBe(false);
        });
    });

    describe('buildTemperatureTintFilter()', () => {
        it('should create SVG filter with correct id', () => {
            const result = FilterEngine.buildTemperatureTintFilter({ temperature: 50 }, 'test-id');
            expect(result).toContain('id="test-id"');
        });

        it('should include feColorMatrix', () => {
            const result = FilterEngine.buildTemperatureTintFilter({ temperature: 50 }, 'test-id');
            expect(result).toContain('feColorMatrix');
        });

        it('should include matrix values', () => {
            const result = FilterEngine.buildTemperatureTintFilter({ temperature: 50 }, 'test-id');
            expect(result).toContain('type="matrix"');
            expect(result).toContain('values=');
        });

        it('should use sRGB color interpolation', () => {
            const result = FilterEngine.buildTemperatureTintFilter({ temperature: 50 }, 'test-id');
            expect(result).toContain('color-interpolation-filters="sRGB"');
        });
    });

    describe('buildHighlightsShadowsFilter()', () => {
        it('should create SVG filter with correct id', () => {
            const result = FilterEngine.buildHighlightsShadowsFilter({ highlights: 50 }, 'hs-id');
            expect(result).toContain('id="hs-id"');
        });

        it('should include feComponentTransfer', () => {
            const result = FilterEngine.buildHighlightsShadowsFilter({ highlights: 50 }, 'hs-id');
            expect(result).toContain('feComponentTransfer');
        });

        it('should include RGB transfer functions', () => {
            const result = FilterEngine.buildHighlightsShadowsFilter({ shadows: 30 }, 'hs-id');
            expect(result).toContain('feFuncR');
            expect(result).toContain('feFuncG');
            expect(result).toContain('feFuncB');
        });

        it('should use gamma type', () => {
            const result = FilterEngine.buildHighlightsShadowsFilter({ highlights: 50 }, 'hs-id');
            expect(result).toContain('type="gamma"');
        });
    });

    describe('buildAdvancedFilter()', () => {
        it('should return empty string for zero values', () => {
            const result = FilterEngine.buildAdvancedFilter({
                temperature: 0,
                tint: 0,
                highlights: 0,
                shadows: 0
            }, 'test');
            expect(result).toBe('');
        });

        it('should build filter for temperature only', () => {
            const result = FilterEngine.buildAdvancedFilter({ temperature: 50 }, 'test');
            expect(result).toContain('feColorMatrix');
        });

        it('should build filter for tint only', () => {
            const result = FilterEngine.buildAdvancedFilter({ tint: 30 }, 'test');
            expect(result).toContain('feColorMatrix');
        });

        it('should build filter for highlights only', () => {
            const result = FilterEngine.buildAdvancedFilter({ highlights: 50 }, 'test');
            expect(result).toContain('feComponentTransfer');
        });

        it('should build filter for shadows only', () => {
            const result = FilterEngine.buildAdvancedFilter({ shadows: -30 }, 'test');
            expect(result).toContain('feComponentTransfer');
        });

        it('should chain filters when multiple are set', () => {
            const result = FilterEngine.buildAdvancedFilter({
                temperature: 50,
                highlights: 30
            }, 'test');
            expect(result).toContain('feColorMatrix');
            expect(result).toContain('feComponentTransfer');
        });

        it('should use result chaining', () => {
            const result = FilterEngine.buildAdvancedFilter({
                temperature: 50,
                highlights: 30
            }, 'test');
            expect(result).toContain('result="tempTint"');
            expect(result).toContain('in="tempTint"');
        });
    });

    describe('getFilterStyle()', () => {
        it('should return cssFilter, svgFilter, and filterValue', () => {
            const result = FilterEngine.getFilterStyle({ exposure: 50 }, 'elem1');
            expect(result).toHaveProperty('cssFilter');
            expect(result).toHaveProperty('svgFilter');
            expect(result).toHaveProperty('filterValue');
        });

        it('should return CSS filter for basic filters', () => {
            const result = FilterEngine.getFilterStyle({ exposure: 50 }, 'elem1');
            expect(result.cssFilter).toContain('brightness');
            expect(result.svgFilter).toBe('');
            expect(result.filterValue).toBe(result.cssFilter);
        });

        it('should return SVG filter for temperature', () => {
            const result = FilterEngine.getFilterStyle({ temperature: 50 }, 'elem1');
            expect(result.svgFilter).toContain('filter');
            expect(result.filterValue).toContain('url(#media-filter-elem1)');
        });

        it('should combine SVG and CSS filters', () => {
            const result = FilterEngine.getFilterStyle({
                temperature: 50,
                exposure: 30
            }, 'elem1');
            expect(result.filterValue).toContain('url(#');
            expect(result.filterValue).toContain('brightness');
        });
    });

    describe('getDefaultFilters()', () => {
        it('should return all filter properties', () => {
            const defaults = FilterEngine.getDefaultFilters();
            expect(defaults).toHaveProperty('exposure');
            expect(defaults).toHaveProperty('contrast');
            expect(defaults).toHaveProperty('saturation');
            expect(defaults).toHaveProperty('temperature');
            expect(defaults).toHaveProperty('tint');
            expect(defaults).toHaveProperty('highlights');
            expect(defaults).toHaveProperty('shadows');
            expect(defaults).toHaveProperty('blur');
            expect(defaults).toHaveProperty('hueRotate');
            expect(defaults).toHaveProperty('invert');
            expect(defaults).toHaveProperty('sepia');
            expect(defaults).toHaveProperty('grayscale');
        });

        it('should return all values as zero', () => {
            const defaults = FilterEngine.getDefaultFilters();
            Object.values(defaults).forEach(val => {
                expect(val).toBe(0);
            });
        });
    });

    describe('isDefault()', () => {
        it('should return true for null', () => {
            expect(FilterEngine.isDefault(null)).toBe(true);
        });

        it('should return true for undefined', () => {
            expect(FilterEngine.isDefault(undefined)).toBe(true);
        });

        it('should return true for all zero values', () => {
            expect(FilterEngine.isDefault({ exposure: 0, contrast: 0 })).toBe(true);
        });

        it('should return true for empty object', () => {
            expect(FilterEngine.isDefault({})).toBe(true);
        });

        it('should return false if any filter is non-zero', () => {
            expect(FilterEngine.isDefault({ exposure: 10 })).toBe(false);
        });

        it('should return false for negative values', () => {
            expect(FilterEngine.isDefault({ contrast: -20 })).toBe(false);
        });
    });

    describe('clampValue()', () => {
        it('should clamp exposure to -100 to 100', () => {
            expect(FilterEngine.clampValue('exposure', 150)).toBe(100);
            expect(FilterEngine.clampValue('exposure', -150)).toBe(-100);
            expect(FilterEngine.clampValue('exposure', 50)).toBe(50);
        });

        it('should clamp contrast to -100 to 100', () => {
            expect(FilterEngine.clampValue('contrast', 150)).toBe(100);
            expect(FilterEngine.clampValue('contrast', -150)).toBe(-100);
        });

        it('should clamp blur to 0 to 100', () => {
            expect(FilterEngine.clampValue('blur', -10)).toBe(0);
            expect(FilterEngine.clampValue('blur', 150)).toBe(100);
            expect(FilterEngine.clampValue('blur', 50)).toBe(50);
        });

        it('should clamp hueRotate to 0 to 360', () => {
            expect(FilterEngine.clampValue('hueRotate', -10)).toBe(0);
            expect(FilterEngine.clampValue('hueRotate', 400)).toBe(360);
            expect(FilterEngine.clampValue('hueRotate', 180)).toBe(180);
        });

        it('should clamp grayscale to 0 to 100', () => {
            expect(FilterEngine.clampValue('grayscale', -10)).toBe(0);
            expect(FilterEngine.clampValue('grayscale', 150)).toBe(100);
        });

        it('should clamp sepia to 0 to 100', () => {
            expect(FilterEngine.clampValue('sepia', -10)).toBe(0);
            expect(FilterEngine.clampValue('sepia', 150)).toBe(100);
        });

        it('should clamp invert to 0 to 100', () => {
            expect(FilterEngine.clampValue('invert', -10)).toBe(0);
            expect(FilterEngine.clampValue('invert', 150)).toBe(100);
        });

        it('should handle unknown property with default range', () => {
            expect(FilterEngine.clampValue('unknown', 150)).toBe(100);
            expect(FilterEngine.clampValue('unknown', -150)).toBe(-100);
        });
    });
});
