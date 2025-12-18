import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { resolveBooleanDerivedPaths, __clearBooleanDerivedCachesForTests } from '../../../src/core/shapes/booleans/BooleanDerivedPaths.js';
import * as BooleanEngine from '../../../src/core/shapes/booleans/BooleanEngine.js';

function makeHugeLinePath(pointCount) {
    // Produces ~pointCount vertices along x axis.
    const segments = [];
    for (let i = 1; i < pointCount; i++) {
        segments.push({ kind: 'line', to: { x: i, y: 0 } });
    }
    return {
        start: { x: 0, y: 0 },
        segments,
        closed: true,
    };
}

describe('BooleanDerivedPaths (cache + invalidation + interaction preview)', () => {
    beforeEach(() => {
        __clearBooleanDerivedCachesForTests();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        __clearBooleanDerivedCachesForTests();
    });

    it('hits cache for identical inputs (no recompute)', () => {
        const spy = vi.spyOn(BooleanEngine, 'computeBooleanPolygons');

        const slideData = {
            elements: {
                a: { id: 'a', type: 'shape', x: 0, y: 0, width: 10, height: 10 },
                b: { id: 'b', type: 'shape', x: 5, y: 0, width: 10, height: 10 },
            },
        };

        const booleanEl = { id: 'bool-1', type: 'shape', x: 0, y: 0, width: 20, height: 20, operation: 'union', operands: ['a', 'b'] };

        const r1 = resolveBooleanDerivedPaths(booleanEl, slideData, { interactive: false });
        const r2 = resolveBooleanDerivedPaths(booleanEl, slideData, { interactive: false });

        expect(r1).toEqual(r2);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('invalidates cache when an operand geometry changes (recompute)', () => {
        const spy = vi.spyOn(BooleanEngine, 'computeBooleanPolygons');

        const slideData1 = {
            elements: {
                a: { id: 'a', type: 'shape', x: 0, y: 0, width: 10, height: 10 },
                b: { id: 'b', type: 'shape', x: 5, y: 0, width: 10, height: 10 },
            },
        };

        const slideData2 = {
            elements: {
                a: { id: 'a', type: 'shape', x: 0, y: 0, width: 10, height: 10 },
                // moved operand
                b: { id: 'b', type: 'shape', x: 6, y: 0, width: 10, height: 10 },
            },
        };

        const booleanEl = { id: 'bool-2', type: 'shape', x: 0, y: 0, width: 20, height: 20, operation: 'union', operands: ['a', 'b'] };

        resolveBooleanDerivedPaths(booleanEl, slideData1, { interactive: false });
        resolveBooleanDerivedPaths(booleanEl, slideData2, { interactive: false });

        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('returns stale cached result during interaction for heavy booleans, then refines after', () => {
        const spy = vi.spyOn(BooleanEngine, 'computeBooleanPolygons');

        const hugeVector = {
            id: 'v1',
            type: 'shape',
            shapeKind: 'vector',
            x: 0,
            y: 0,
            width: 2000,
            height: 10,
            // Ensure ShapeToPolygons treats it as vector.
            paths: [makeHugeLinePath(2000)],
        };

        const slideData1 = {
            elements: {
                v1: hugeVector,
                r1: { id: 'r1', type: 'shape', x: 0, y: 0, width: 10, height: 10 },
            },
        };

        const slideDataMoved = {
            elements: {
                v1: { ...hugeVector, x: 1 },
                r1: { id: 'r1', type: 'shape', x: 0, y: 0, width: 10, height: 10 },
            },
        };

        const booleanEl = {
            id: 'bool-3',
            type: 'shape',
            shapeKind: 'boolean',
            x: 0,
            y: 0,
            width: 2000,
            height: 2000,
            operation: 'union',
            operands: ['v1', 'r1'],
        };

        const base = resolveBooleanDerivedPaths(booleanEl, slideData1, { interactive: false });

        // During interaction, geometry signature changes, but we should keep last-known-good preview.
        const during = resolveBooleanDerivedPaths(booleanEl, slideDataMoved, { interactive: true });
        expect(during).toEqual(base);

        // After interaction ends, refine to new geometry.
        const after = resolveBooleanDerivedPaths(booleanEl, slideDataMoved, { interactive: false });
        expect(after).not.toEqual(base);

        // Calls: base compute, after compute. "during" should not compute.
        expect(spy).toHaveBeenCalledTimes(2);
    });
    it('keeps last-known-good derived paths when operands go missing', () => {
        const slideData = {
            elements: {
                a: { id: 'a', type: 'shape', shapeKind: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
                b: { id: 'b', type: 'shape', shapeKind: 'rectangle', x: 50, y: 50, width: 100, height: 100 },
                bool: { id: 'bool', type: 'shape', shapeKind: 'boolean', x: 0, y: 0, width: 200, height: 200, operation: 'union', operands: ['a', 'b'] }
            },
            effectiveElements: null
        };

        const first = resolveBooleanDerivedPaths(slideData.elements.bool, slideData, { interactive: false });
        expect(first.status).toBe('ok');
        expect(Array.isArray(first.paths)).toBe(true);
        expect(first.paths.length).toBeGreaterThan(0);

        // Simulate a corrupt/partial document: operand missing on load.
        delete slideData.elements.b;

        const second = resolveBooleanDerivedPaths(slideData.elements.bool, slideData, { interactive: false });
        expect(second.status).toBe('fallback');
        // Should preserve prior usable preview instead of dropping to empty fallback.
        expect(second.paths).toEqual(first.paths);
    });

    it('invalidates an outer boolean when an inner boolean operation changes (nested booleans)', () => {
        const spy = vi.spyOn(BooleanEngine, 'computeBooleanPolygons');

        const base = {
            a: { id: 'a', type: 'shape', shapeKind: 'rectangle', x: 0, y: 0, width: 20, height: 20 },
            b: { id: 'b', type: 'shape', shapeKind: 'rectangle', x: 10, y: 0, width: 20, height: 20 },
            c: { id: 'c', type: 'shape', shapeKind: 'rectangle', x: 5, y: 10, width: 20, height: 20 },
        };

        const slideData1 = {
            elements: {
                ...base,
                inner: { id: 'inner', type: 'shape', shapeKind: 'boolean', x: 0, y: 0, width: 40, height: 30, rotation: 0, operation: 'union', operands: ['a', 'b'] },
                outer: { id: 'outer', type: 'shape', shapeKind: 'boolean', x: 0, y: 0, width: 60, height: 60, rotation: 0, operation: 'subtract', operands: ['inner', 'c'] }
            }
        };

        const slideData2 = {
            elements: {
                ...base,
                // inner op changes
                inner: { id: 'inner', type: 'shape', shapeKind: 'boolean', x: 0, y: 0, width: 40, height: 30, rotation: 0, operation: 'subtract', operands: ['a', 'b'] },
                outer: { id: 'outer', type: 'shape', shapeKind: 'boolean', x: 0, y: 0, width: 60, height: 60, rotation: 0, operation: 'subtract', operands: ['inner', 'c'] }
            }
        };

        const outer1 = resolveBooleanDerivedPaths(slideData1.elements.outer, slideData1, { interactive: false });
        const outer2 = resolveBooleanDerivedPaths(slideData2.elements.outer, slideData2, { interactive: false });

        expect(outer2).not.toEqual(outer1);
        // Two resolves, each computes inner + outer.
        expect(spy).toHaveBeenCalledTimes(4);
    });

    it('detects cycles across nested booleans and falls back safely (no crash)', () => {
        const slideData = {
            elements: {
                a: { id: 'a', type: 'shape', shapeKind: 'rectangle', x: 0, y: 0, width: 20, height: 20 },
                b: { id: 'b', type: 'shape', shapeKind: 'rectangle', x: 10, y: 0, width: 20, height: 20 },
                boolA: { id: 'boolA', type: 'shape', shapeKind: 'boolean', x: 0, y: 0, width: 40, height: 30, rotation: 0, operation: 'union', operands: ['a', 'boolB'] },
                boolB: { id: 'boolB', type: 'shape', shapeKind: 'boolean', x: 0, y: 0, width: 40, height: 30, rotation: 0, operation: 'union', operands: ['b', 'boolA'] },
            }
        };

        const res = resolveBooleanDerivedPaths(slideData.elements.boolA, slideData, { interactive: false });
        expect(res.status).toBe('fallback');
    });
});
