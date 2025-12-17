import { describe, expect, it } from 'vitest';

import { canonicalizeVectorPaths } from '../../../src/core/shapes/paths/VectorPathOps.js';
import { parametricShapeToVectorPaths } from '../../../src/core/shapes/paths/ParametricToPaths.js';

describe('ParametricToPaths (G1)', () => {
    it('converts ellipse deterministically and produces closed cubic segments', () => {
        const element = {
            type: 'shape',
            shapeKind: 'ellipse',
            id: 'e1',
            x: 0,
            y: 0,
            width: 200,
            height: 100
        };

        const paths = parametricShapeToVectorPaths(element);
        expect(Array.isArray(paths)).toBe(true);
        expect(paths.length).toBe(1);
        expect(paths[0].closed).toBe(true);
        expect(paths[0].segments.every((s) => s.kind === 'cubic')).toBe(true);

        const canon1 = canonicalizeVectorPaths(paths, 1e-6);
        const canon2 = canonicalizeVectorPaths(parametricShapeToVectorPaths(element), 1e-6);
        expect(canon2).toEqual(canon1);
    });

    it('converts rectangle with radius deterministically (uses cubics when radius > 0)', () => {
        const element = {
            type: 'shape',
            shapeKind: 'rectangle',
            id: 'r1',
            x: 0,
            y: 0,
            width: 100,
            height: 80,
            borderRadius: 12
        };

        const paths = parametricShapeToVectorPaths(element);
        expect(paths.length).toBe(1);
        expect(paths[0].closed).toBe(true);
        expect(paths[0].segments.some((s) => s.kind === 'cubic')).toBe(true);

        const canon1 = canonicalizeVectorPaths(paths, 1e-6);
        const canon2 = canonicalizeVectorPaths(parametricShapeToVectorPaths(element), 1e-6);
        expect(canon2).toEqual(canon1);
    });
});
