import { describe, expect, it } from 'vitest';

import { Transform2D } from '../../../src/core/shapes/Transform2D.js';

describe('Transform2D', () => {
    it('identity leaves points unchanged', () => {
        const t = Transform2D.identity();
        expect(t.applyToPoint({ x: 3, y: 4 })).toEqual({ x: 3, y: 4 });
    });

    it('composition applies in the correct order (other then this)', () => {
        const t1 = Transform2D.translation(10, 0);
        const t2 = Transform2D.translation(0, 5);
        const t = t2.compose(t1); // apply t1 then t2
        expect(t.applyToPoint({ x: 1, y: 2 })).toEqual({ x: 11, y: 7 });
    });

    it('invert round-trips points', () => {
        const t = Transform2D.translation(10, -3).compose(Transform2D.rotationRadians(Math.PI / 4));
        const inv = t.invert();
        expect(inv).not.toBeNull();
        const p = { x: 2, y: 5 };
        const p2 = inv.applyToPoint(t.applyToPoint(p));
        expect(p2.x).toBeCloseTo(p.x, 10);
        expect(p2.y).toBeCloseTo(p.y, 10);
    });

    it('fromElementBox matches center-pivot rotation expectation', () => {
        const el = { x: 100, y: 50, width: 10, height: 20, rotation: 90 };
        const t = Transform2D.fromElementBox(el);

        // local top-left (0,0) rotates around center (5,10)
        const p = t.applyToPoint({ x: 0, y: 0 });

        // After 90deg rotation about center:
        // (0,0) relative to center is (-5,-10) -> (10,-5)
        // add center -> (15,5), then translate by (x,y) -> (115,55)
        expect(p.x).toBeCloseTo(115, 10);
        expect(p.y).toBeCloseTo(55, 10);
    });
});
