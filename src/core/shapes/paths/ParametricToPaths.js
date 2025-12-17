import { getShapeKind } from '../ShapeElementAdapter.js';

const KAPPA = 0.5522847498307936; // cubic approximation constant for quarter circle

function isFiniteNumber(n) {
    return typeof n === 'number' && Number.isFinite(n);
}

function n(v, fallback = 0) {
    return isFiniteNumber(v) ? v : fallback;
}

function getUniformCornerRadius(element) {
    if (!element || typeof element !== 'object') return 0;
    const r = element.borderRadius ?? element.style?.radius ?? element.cornerRadius;
    if (isFiniteNumber(r)) return Math.max(0, r);

    // Canonical v1 shape schema stores corner radii in params.cornerRadii [tl,tr,br,bl].
    const arr = element.params?.cornerRadii;
    if (Array.isArray(arr) && arr.length === 4 && arr.every(isFiniteNumber)) {
        // v1 conversion supports uniform radius only; use max as a stable approximation.
        return Math.max(0, ...arr.map((x) => Number(x)));
    }

    return 0;
}

function rectToPaths(w, h) {
    return [
        {
            closed: true,
            fillRule: 'nonzero',
            start: { x: 0, y: 0 },
            segments: [
                { kind: 'line', to: { x: w, y: 0 } },
                { kind: 'line', to: { x: w, y: h } },
                { kind: 'line', to: { x: 0, y: h } },
                { kind: 'line', to: { x: 0, y: 0 } }
            ]
        }
    ];
}

function roundedRectToPaths(w, h, radius) {
    const r = Math.min(Math.max(0, Number(radius) || 0), w / 2, h / 2);
    if (r <= 0) return rectToPaths(w, h);

    const k = KAPPA;
    const ox = r * k;
    const oy = r * k;

    const start = { x: r, y: 0 };

    return [
        {
            closed: true,
            fillRule: 'nonzero',
            start,
            segments: [
                // Top edge
                { kind: 'line', to: { x: w - r, y: 0 } },
                // Top-right corner
                {
                    kind: 'cubic',
                    c1: { x: w - r + ox, y: 0 },
                    c2: { x: w, y: r - oy },
                    to: { x: w, y: r }
                },
                // Right edge
                { kind: 'line', to: { x: w, y: h - r } },
                // Bottom-right corner
                {
                    kind: 'cubic',
                    c1: { x: w, y: h - r + oy },
                    c2: { x: w - r + ox, y: h },
                    to: { x: w - r, y: h }
                },
                // Bottom edge
                { kind: 'line', to: { x: r, y: h } },
                // Bottom-left corner
                {
                    kind: 'cubic',
                    c1: { x: r - ox, y: h },
                    c2: { x: 0, y: h - r + oy },
                    to: { x: 0, y: h - r }
                },
                // Left edge
                { kind: 'line', to: { x: 0, y: r } },
                // Top-left corner
                {
                    kind: 'cubic',
                    c1: { x: 0, y: r - oy },
                    c2: { x: r - ox, y: 0 },
                    to: { x: r, y: 0 }
                }
            ]
        }
    ];
}

function ellipseToPaths(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const rx = w / 2;
    const ry = h / 2;

    const ox = rx * KAPPA;
    const oy = ry * KAPPA;

    const p0 = { x: cx + rx, y: cy };
    const p1 = { x: cx + rx, y: cy + oy };
    const p2 = { x: cx + ox, y: cy + ry };
    const p3 = { x: cx, y: cy + ry };

    const p4 = { x: cx - ox, y: cy + ry };
    const p5 = { x: cx - rx, y: cy + oy };
    const p6 = { x: cx - rx, y: cy };

    const p7 = { x: cx - rx, y: cy - oy };
    const p8 = { x: cx - ox, y: cy - ry };
    const p9 = { x: cx, y: cy - ry };

    const p10 = { x: cx + ox, y: cy - ry };
    const p11 = { x: cx + rx, y: cy - oy };

    return [
        {
            closed: true,
            fillRule: 'nonzero',
            start: p0,
            segments: [
                { kind: 'cubic', c1: p1, c2: p2, to: p3 },
                { kind: 'cubic', c1: p4, c2: p5, to: p6 },
                { kind: 'cubic', c1: p7, c2: p8, to: p9 },
                { kind: 'cubic', c1: p10, c2: p11, to: p0 }
            ]
        }
    ];
}

function polygonToPaths(w, h, sides = 3, rotationDeg = 0) {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2;
    const rot = (rotationDeg * Math.PI) / 180;

    const pts = [];
    for (let i = 0; i < sides; i++) {
        const t = rot + (i / sides) * Math.PI * 2;
        pts.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r });
    }

    const start = pts[0] || { x: cx, y: cy };
    const segments = [];
    for (let i = 1; i < pts.length; i++) {
        segments.push({ kind: 'line', to: pts[i] });
    }
    segments.push({ kind: 'line', to: start });

    return [{ closed: true, fillRule: 'nonzero', start, segments }];
}

function starToPaths(w, h, points = 5, innerRatio = 0.5, rotationDeg = 0) {
    const cx = w / 2;
    const cy = h / 2;
    const rOuter = Math.min(w, h) / 2;
    const rInner = rOuter * innerRatio;
    const rot = (rotationDeg * Math.PI) / 180;

    const pts = [];
    const total = points * 2;
    for (let i = 0; i < total; i++) {
        const rr = i % 2 === 0 ? rOuter : rInner;
        const t = rot + (i / total) * Math.PI * 2;
        pts.push({ x: cx + Math.cos(t) * rr, y: cy + Math.sin(t) * rr });
    }

    const start = pts[0] || { x: cx, y: cy };
    const segments = [];
    for (let i = 1; i < pts.length; i++) {
        segments.push({ kind: 'line', to: pts[i] });
    }
    segments.push({ kind: 'line', to: start });

    return [{ closed: true, fillRule: 'nonzero', start, segments }];
}

function lineToPaths(params, w, h) {
    const p1 = params?.p1;
    const p2 = params?.p2;

    const start = { x: n(p1?.x, 0), y: n(p1?.y, 0) };
    const end = { x: n(p2?.x, w), y: n(p2?.y, h) };

    return [{ closed: false, fillRule: 'nonzero', start, segments: [{ kind: 'line', to: end }] }];
}

/**
 * Convert a canonical/legacy parametric shape element into vector paths.
 *
 * This is used for geometry operations that require a path (booleans, export, future vector convert).
 */
export function parametricShapeToVectorPaths(element) {
    if (!element || typeof element !== 'object') return [];
    const kind = getShapeKind(element);

    const w = Math.max(0, n(element.width, 0));
    const h = Math.max(0, n(element.height, 0));
    const params = element.params || {};

    if (kind === 'rectangle') return roundedRectToPaths(w, h, getUniformCornerRadius(element));
    if (kind === 'ellipse') return ellipseToPaths(w, h);
    if (kind === 'polygon') return polygonToPaths(w, h, Math.max(3, Math.floor(n(params.sides, 3))), n(params.rotation, 0));
    if (kind === 'star') return starToPaths(w, h, Math.max(3, Math.floor(n(params.points, 5))), Math.min(0.99, Math.max(0.01, n(params.innerRadiusRatio, 0.5))), n(params.rotation, 0));
    if (kind === 'line') return lineToPaths(params, w, h);

    return [];
}
