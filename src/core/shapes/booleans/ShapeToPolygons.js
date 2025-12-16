import { getShapeKind } from '../ShapeElementAdapter.js';
import { Transform2D } from '../Transform2D.js';
import { computeParentToWorldTransform } from '../SceneGraphTransforms.js';

function isFiniteNumber(n) {
    return typeof n === 'number' && Number.isFinite(n);
}

function bucketNumber(n) {
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 1e6) / 1e6;
}

function getElementLocalToWorldTransform(slide, el) {
    const parentToWorld = slide ? computeParentToWorldTransform(slide, el) : Transform2D.identity();
    return parentToWorld.compose(Transform2D.fromElementBox(el));
}

function getElementWorldToLocalTransform(slide, el) {
    const t = getElementLocalToWorldTransform(slide, el);
    return t.invert();
}

function rectangleLocalRings(w, h) {
    const ring = [
        [0, 0],
        [w, 0],
        [w, h],
        [0, h],
        [0, 0]
    ];
    return [[ring]]; // MultiPolygon
}

function ellipseLocalRings(w, h, steps = 32) {
    const cx = w / 2;
    const cy = h / 2;
    const rx = w / 2;
    const ry = h / 2;
    const ring = [];
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        ring.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]);
    }
    return [[ring]];
}

function vectorLocalRings(el) {
    const paths = Array.isArray(el.paths) ? el.paths : [];
    const polys = [];

    for (const path of paths) {
        if (!path?.start) continue;
        const startX = Number(path.start.x);
        const startY = Number(path.start.y);
        if (!Number.isFinite(startX) || !Number.isFinite(startY)) continue;

        const ring = [[startX, startY]];
        let prev = { x: startX, y: startY };

        for (const seg of path.segments || []) {
            if (!seg || !seg.to) continue;
            if (seg.kind === 'line') {
                const x = Number(seg.to.x);
                const y = Number(seg.to.y);
                if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
                ring.push([x, y]);
                prev = { x, y };
                continue;
            }

            if (seg.kind === 'cubic') {
                // Deterministic fixed subdivision.
                const c1 = seg.c1;
                const c2 = seg.c2;
                const to = seg.to;
                const x1 = Number(c1?.x);
                const y1 = Number(c1?.y);
                const x2 = Number(c2?.x);
                const y2 = Number(c2?.y);
                const x3 = Number(to?.x);
                const y3 = Number(to?.y);
                if (![x1, y1, x2, y2, x3, y3].every(Number.isFinite)) continue;

                const steps = 16;
                for (let i = 1; i <= steps; i++) {
                    const t = i / steps;
                    const mt = 1 - t;
                    const bx =
                        mt * mt * mt * prev.x +
                        3 * mt * mt * t * x1 +
                        3 * mt * t * t * x2 +
                        t * t * t * x3;
                    const by =
                        mt * mt * mt * prev.y +
                        3 * mt * mt * t * y1 +
                        3 * mt * t * t * y2 +
                        t * t * t * y3;
                    ring.push([bx, by]);
                }

                prev = { x: x3, y: y3 };
            }
        }

        // Close if needed.
        if (path.closed !== false) {
            const first = ring[0];
            const last = ring[ring.length - 1];
            if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
                ring.push([first[0], first[1]]);
            }
        }

        if (ring.length >= 4) {
            polys.push([ring]);
        }
    }

    return polys;
}

function toWorldMultiPolygon(slide, el, localMultiPoly) {
    const t = getElementLocalToWorldTransform(slide, el);
    const out = [];
    for (const poly of localMultiPoly) {
        if (!Array.isArray(poly)) continue;
        const rings = [];
        for (const ring of poly) {
            if (!Array.isArray(ring) || ring.length < 3) continue;
            const pts = [];
            for (const [lx, ly] of ring) {
                const wpt = t.applyToPoint({ x: Number(lx), y: Number(ly) });
                if (!isFiniteNumber(wpt.x) || !isFiniteNumber(wpt.y)) continue;
                pts.push([bucketNumber(wpt.x), bucketNumber(wpt.y)]);
            }
            if (pts.length >= 3) rings.push(pts);
        }
        if (rings.length > 0) out.push(rings);
    }
    return out;
}

function toLocalMultiPolygon(slide, targetEl, worldMultiPoly) {
    const inv = getElementWorldToLocalTransform(slide, targetEl);
    if (!inv) return [];
    const out = [];
    for (const poly of worldMultiPoly) {
        if (!Array.isArray(poly)) continue;
        const rings = [];
        for (const ring of poly) {
            if (!Array.isArray(ring) || ring.length < 3) continue;
            const pts = [];
            for (const [wx, wy] of ring) {
                const lpt = inv.applyToPoint({ x: Number(wx), y: Number(wy) });
                if (!isFiniteNumber(lpt.x) || !isFiniteNumber(lpt.y)) continue;
                pts.push([bucketNumber(lpt.x), bucketNumber(lpt.y)]);
            }
            if (pts.length >= 3) rings.push(pts);
        }
        if (rings.length > 0) out.push(rings);
    }
    return out;
}

/**
 * Resolve an element into world-space polygons suitable for boolean ops / masks.
 *
 * @param {any} element
 * @returns {any[]} MultiPolygon
 */
export function elementToWorldPolygons(element) {
    // Back-compat: elementToWorldPolygons(element) or elementToWorldPolygons(slide, element)
    const slide = arguments.length >= 2 ? arguments[0] : null;
    const el = arguments.length >= 2 ? arguments[1] : element;

    if (!el || typeof el !== 'object') return [];
    const kind = getShapeKind(el);

    const w = Math.max(0, Number(el.width) || 0);
    const h = Math.max(0, Number(el.height) || 0);

    let local;
    if (kind === 'rectangle') local = rectangleLocalRings(w, h);
    else if (kind === 'ellipse') local = ellipseLocalRings(w, h);
    else if (kind === 'vector') local = vectorLocalRings(el);
    else {
        // Conservative v1 fallback: bounding box.
        local = rectangleLocalRings(w, h);
    }

    return toWorldMultiPolygon(slide, el, local);
}

/**
 * Transform a world-space MultiPolygon into a target element's local space.
 */
export function worldPolygonsToElementLocal(targetEl, worldMultiPolygon) {
    // Back-compat: worldPolygonsToElementLocal(targetEl, polys) or worldPolygonsToElementLocal(slide, targetEl, polys)
    const slide = arguments.length >= 3 ? arguments[0] : null;
    const el = arguments.length >= 3 ? arguments[1] : targetEl;
    const polys = arguments.length >= 3 ? arguments[2] : worldMultiPolygon;
    return toLocalMultiPolygon(slide, el, polys);
}

/**
 * Build an inverted (full-rect minus clip) MultiPolygon in local space.
 */
export function invertLocalClip(targetEl, localClip) {
    const w = Math.max(0, Number(targetEl.width) || 0);
    const h = Math.max(0, Number(targetEl.height) || 0);

    const full = rectangleLocalRings(w, h);
    return { full, clip: localClip };
}
