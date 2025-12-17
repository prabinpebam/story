import { describe, expect, it } from 'vitest';

import {
    canonicalizeVectorPath,
    flattenVectorPath,
    splitVectorSegment,
    segmentBounds
} from '../../../src/core/shapes/paths/VectorPathOps.js';

describe('VectorPathOps (G1)', () => {
    const signedArea = (pts) => {
        if (!Array.isArray(pts) || pts.length < 3) return 0;
        const n = pts.length;
        const m = (n > 1 && pts[0].x === pts[n - 1].x && pts[0].y === pts[n - 1].y) ? n - 1 : n;
        if (m < 3) return 0;
        let sum = 0;
        for (let i = 0; i < m; i++) {
            const a = pts[i];
            const b = pts[(i + 1) % m];
            sum += a.x * b.y - b.x * a.y;
        }
        return sum / 2;
    };

    it('canonicalizeVectorPath drops zero-length segments and is idempotent', () => {
        const path = {
            closed: true,
            fillRule: 'nonzero',
            start: { x: 0, y: 0 },
            segments: [
                { kind: 'line', to: { x: 0, y: 0 } }, // zero-length
                { kind: 'line', to: { x: 10, y: 0 } },
                { kind: 'line', to: { x: 10, y: 0 } }, // duplicate
                { kind: 'line', to: { x: 10, y: 10 } },
                { kind: 'line', to: { x: 0, y: 10 } },
                { kind: 'line', to: { x: 0, y: 0 } }
            ]
        };

        const a = canonicalizeVectorPath(path, 1e-6);
        const b = canonicalizeVectorPath(a, 1e-6);
        expect(b).toEqual(a);

        expect(a.segments.length).toBeLessThan(path.segments.length);
    });

    it('canonicalizeVectorPath normalizes winding for closed paths', () => {
        // Clockwise rectangle (negative signed area with the standard shoelace formula).
        const cw = {
            closed: true,
            fillRule: 'nonzero',
            start: { x: 0, y: 0 },
            segments: [
                { kind: 'line', to: { x: 0, y: 10 } },
                { kind: 'line', to: { x: 10, y: 10 } },
                { kind: 'line', to: { x: 10, y: 0 } }
            ]
        };

        const canon = canonicalizeVectorPath(cw, 1e-6);
        const pts = flattenVectorPath(canon, { eps: 1e-6, maxDepth: 6 });
        expect(signedArea(pts)).toBeGreaterThanOrEqual(0);
    });

    it('splitVectorSegment splits cubic deterministically', () => {
        const from = { x: 0, y: 0 };
        const seg = {
            kind: 'cubic',
            c1: { x: 0, y: 10 },
            c2: { x: 10, y: 10 },
            to: { x: 10, y: 0 }
        };

        const res = splitVectorSegment(from, seg, 0.5);
        expect(res.ok).toBe(true);

        // Validate De Casteljau split points deterministically.
        const tt = 0.5;
        const lerp = (a, b) => ({ x: a.x + (b.x - a.x) * tt, y: a.y + (b.y - a.y) * tt });
        const p0 = from;
        const p1 = seg.c1;
        const p2 = seg.c2;
        const p3 = seg.to;
        const p01 = lerp(p0, p1);
        const p12 = lerp(p1, p2);
        const p23 = lerp(p2, p3);
        const p012 = lerp(p01, p12);
        const p123 = lerp(p12, p23);
        const p0123 = lerp(p012, p123);

        expect(res.left).toEqual({ kind: 'cubic', c1: p01, c2: p012, to: p0123 });
        expect(res.right).toEqual({ kind: 'cubic', c1: p123, c2: p23, to: p3 });
    });

    it('flattenVectorPath returns stable closure point when closed', () => {
        const p = {
            closed: true,
            fillRule: 'nonzero',
            start: { x: 0, y: 0 },
            segments: [{ kind: 'line', to: { x: 10, y: 0 } }]
        };
        const pts = flattenVectorPath(p, { eps: 1e-6, maxDepth: 4 });
        expect(pts[0]).toEqual(pts[pts.length - 1]);
    });

    it('segmentBounds for cubic contains endpoints', () => {
        const from = { x: 1, y: 2 };
        const seg = { kind: 'cubic', c1: { x: 5, y: 8 }, c2: { x: 9, y: -2 }, to: { x: 3, y: 4 } };
        const b = segmentBounds(from, seg);
        expect(b.minX).toBeLessThanOrEqual(Math.min(from.x, seg.to.x));
        expect(b.maxX).toBeGreaterThanOrEqual(Math.max(from.x, seg.to.x));
        expect(b.minY).toBeLessThanOrEqual(Math.min(from.y, seg.to.y));
        expect(b.maxY).toBeGreaterThanOrEqual(Math.max(from.y, seg.to.y));
    });
});
