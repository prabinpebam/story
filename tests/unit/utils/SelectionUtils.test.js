import { describe, it, expect } from 'vitest';

import { 
    getMixedValue, 
    getUniqueValues, 
    getBoundingBox 
} from '../../../src/utils/SelectionUtils.js';

describe('SelectionUtils', () => {
    describe('getMixedValue', () => {
        it('should return mixed=false for empty array', () => {
            const result = getMixedValue([], 'x');
            expect(result.value).toBeNull();
            expect(result.mixed).toBe(false);
        });

        it('should return mixed=false for null', () => {
            const result = getMixedValue(null, 'x');
            expect(result.value).toBeNull();
            expect(result.mixed).toBe(false);
        });

        it('should return value for single element', () => {
            const elements = [{ x: 100, y: 200 }];
            const result = getMixedValue(elements, 'x');
            expect(result.value).toBe(100);
            expect(result.mixed).toBe(false);
        });

        it('should return mixed=false when all values are same', () => {
            const elements = [
                { x: 100, y: 200 },
                { x: 100, y: 300 },
                { x: 100, y: 400 }
            ];
            const result = getMixedValue(elements, 'x');
            expect(result.value).toBe(100);
            expect(result.mixed).toBe(false);
        });

        it('should return mixed=true when values differ', () => {
            const elements = [
                { x: 100, y: 200 },
                { x: 150, y: 200 },
                { x: 200, y: 200 }
            ];
            const result = getMixedValue(elements, 'x');
            expect(result.value).toBeNull();
            expect(result.mixed).toBe(true);
        });

        it('should handle nested properties with dot notation', () => {
            const elements = [
                { fill: { color: '#FF0000' } },
                { fill: { color: '#FF0000' } }
            ];
            const result = getMixedValue(elements, 'fill.color');
            expect(result.value).toBe('#FF0000');
            expect(result.mixed).toBe(false);
        });

        it('should detect mixed nested properties', () => {
            const elements = [
                { fill: { color: '#FF0000' } },
                { fill: { color: '#00FF00' } }
            ];
            const result = getMixedValue(elements, 'fill.color');
            expect(result.value).toBeNull();
            expect(result.mixed).toBe(true);
        });

        it('should handle missing properties', () => {
            const elements = [
                { x: 100 },
                { y: 200 }  // No x property
            ];
            const result = getMixedValue(elements, 'x');
            // 100 vs undefined = mixed
            expect(result.mixed).toBe(true);
        });

        it('should handle undefined vs undefined as same', () => {
            const elements = [
                { y: 100 },
                { y: 200 }
            ];
            const result = getMixedValue(elements, 'x');  // Neither has x
            expect(result.value).toBeUndefined();
            expect(result.mixed).toBe(false);
        });

        it('should handle zero values correctly', () => {
            const elements = [
                { x: 0 },
                { x: 0 },
                { x: 0 }
            ];
            const result = getMixedValue(elements, 'x');
            expect(result.value).toBe(0);
            expect(result.mixed).toBe(false);
        });

        it('should compare objects by value', () => {
            const elements = [
                { cornerRadii: { tl: 5, tr: 5, bl: 5, br: 5 } },
                { cornerRadii: { tl: 5, tr: 5, bl: 5, br: 5 } }
            ];
            const result = getMixedValue(elements, 'cornerRadii');
            expect(result.mixed).toBe(false);
        });

        it('should detect different objects as mixed', () => {
            const elements = [
                { cornerRadii: { tl: 5, tr: 5, bl: 5, br: 5 } },
                { cornerRadii: { tl: 10, tr: 10, bl: 10, br: 10 } }
            ];
            const result = getMixedValue(elements, 'cornerRadii');
            expect(result.mixed).toBe(true);
        });
    });

    describe('getUniqueValues', () => {
        it('should return empty array for no elements', () => {
            expect(getUniqueValues([], 'x')).toEqual([]);
            expect(getUniqueValues(null, 'x')).toEqual([]);
        });

        it('should return single value for uniform selection', () => {
            const elements = [
                { blendMode: 'normal' },
                { blendMode: 'normal' },
                { blendMode: 'normal' }
            ];
            expect(getUniqueValues(elements, 'blendMode')).toEqual(['normal']);
        });

        it('should return all unique values', () => {
            const elements = [
                { blendMode: 'normal' },
                { blendMode: 'multiply' },
                { blendMode: 'screen' },
                { blendMode: 'multiply' }  // Duplicate
            ];
            const result = getUniqueValues(elements, 'blendMode');
            expect(result).toHaveLength(3);
            expect(result).toContain('normal');
            expect(result).toContain('multiply');
            expect(result).toContain('screen');
        });
    });

    describe('getBoundingBox', () => {
        it('should return zeros for empty array', () => {
            const result = getBoundingBox([]);
            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
            expect(result.width).toBe(0);
            expect(result.height).toBe(0);
            expect(result.mixed).toBe(false);
        });

        it('should return element bounds for single element', () => {
            const elements = [{ x: 100, y: 200, width: 50, height: 30 }];
            const result = getBoundingBox(elements);
            expect(result.x).toBe(100);
            expect(result.y).toBe(200);
            expect(result.width).toBe(50);
            expect(result.height).toBe(30);
            expect(result.mixed).toBe(false);
        });

        it('should calculate combined bounding box for multiple elements', () => {
            const elements = [
                { x: 100, y: 100, width: 50, height: 50 },   // 100-150, 100-150
                { x: 200, y: 150, width: 100, height: 50 }   // 200-300, 150-200
            ];
            const result = getBoundingBox(elements);
            expect(result.x).toBe(100);      // min X
            expect(result.y).toBe(100);      // min Y
            expect(result.width).toBe(200);  // 300 - 100
            expect(result.height).toBe(100); // 200 - 100
            expect(result.mixed).toBe(true);
        });

        it('should handle elements with missing dimensions', () => {
            const elements = [
                { x: 50 },  // Missing y, width, height
                { y: 100 }  // Missing x, width, height
            ];
            const result = getBoundingBox(elements);
            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
            expect(result.width).toBe(50);   // Max of 50+0, 0+0
            expect(result.height).toBe(100); // Max of 0+0, 100+0
        });

        it('should handle overlapping elements', () => {
            const elements = [
                { x: 0, y: 0, width: 100, height: 100 },
                { x: 50, y: 50, width: 100, height: 100 }  // Overlaps
            ];
            const result = getBoundingBox(elements);
            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
            expect(result.width).toBe(150);  // 0 to 150
            expect(result.height).toBe(150); // 0 to 150
        });
    });
});
