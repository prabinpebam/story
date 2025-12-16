import { describe, expect, it } from 'vitest';

import {
    computeElementWorldCenter,
    computeElementWorldRotation,
    computeElementWorldTopLeft,
    computeParentToWorldTransform
} from '../../../src/core/shapes/SceneGraphTransforms.js';

describe('SceneGraphTransforms', () => {
    it('returns identity for elements without parents', () => {
        const slide = { elements: {} };
        const el = { id: 'a', x: 10, y: 20, width: 100, height: 50, rotation: 15, parentId: null };

        const t = computeParentToWorldTransform(slide, el);
        expect(t.applyToPoint({ x: 1, y: 2 })).toEqual({ x: 1, y: 2 });

        const center = computeElementWorldCenter(slide, el);
        expect(center).toEqual({ x: 60, y: 45 });

        const topLeft = computeElementWorldTopLeft(slide, el);
        expect(topLeft).toEqual({ x: 10, y: 20 });

        const rot = computeElementWorldRotation(slide, el);
        expect(rot).toBe(15);
    });

    it('maps child center through rotated parent (center-pivot)', () => {
        const parent = {
            id: 'p',
            x: 100,
            y: 100,
            width: 200,
            height: 100,
            rotation: 90,
            parentId: null
        };
        const child = {
            id: 'c',
            x: 0,
            y: 0,
            width: 20,
            height: 10,
            rotation: 0,
            parentId: 'p'
        };
        const slide = { elements: { p: parent, c: child } };

        const center = computeElementWorldCenter(slide, child);
        // Expected world center for child:
        // parent center world = (200,150)
        // child center in parent local = (10,5)
        // rotate around parent center (100,50): (-90,-45)->(45,-90)
        // => (145,-40) then translate by (100,100) => (245,60)
        expect(center.x).toBeCloseTo(245, 10);
        expect(center.y).toBeCloseTo(60, 10);

        const topLeft = computeElementWorldTopLeft(slide, child);
        expect(topLeft.x).toBeCloseTo(235, 10);
        expect(topLeft.y).toBeCloseTo(55, 10);

        expect(computeElementWorldRotation(slide, child)).toBe(90);
    });
});
