import { EPS_POINT, clampFinite, nearlyEqual } from '../Epsilon.js';

function isPoint(pt) {
    return !!pt && typeof pt === 'object' && Number.isFinite(pt.x) && Number.isFinite(pt.y);
}

function dist2(a, b) {
    const dx = Number(a.x) - Number(b.x);
    const dy = Number(a.y) - Number(b.y);
    return dx * dx + dy * dy;
}

function pointEq(a, b, eps = EPS_POINT) {
    if (!isPoint(a) || !isPoint(b)) return false;
    return nearlyEqual(a.x, b.x, eps) && nearlyEqual(a.y, b.y, eps);
}

function bucketPoint(pt) {
    return { x: Math.round(Number(pt.x) * 1e6) / 1e6, y: Math.round(Number(pt.y) * 1e6) / 1e6 };
}

function signedArea(points) {
    if (!Array.isArray(points) || points.length < 3) return 0;
    // Accept closed arrays (last==first) and open arrays.
    const n = points.length;
    const m = n > 1 && pointEq(points[0], points[n - 1]) ? n - 1 : n;
    if (m < 3) return 0;
    let sum = 0;
    for (let i = 0; i < m; i++) {
        const a = points[i];
        const b = points[(i + 1) % m];
        sum += (Number(a.x) * Number(b.y)) - (Number(b.x) * Number(a.y));
    }
    return sum / 2;
}

function reverseVectorPath(path) {
    if (!path || typeof path !== 'object' || !isPoint(path.start) || !Array.isArray(path.segments)) return path;

    // Resolve absolute from/to pairs.
    const segmentsWithFrom = [];
    let prev = path.start;
    for (const seg of path.segments) {
        if (!seg || typeof seg !== 'object' || !isPoint(seg.to)) continue;
        segmentsWithFrom.push({ from: prev, seg });
        prev = seg.to;
    }
    if (segmentsWithFrom.length === 0) return path;

    const end = segmentsWithFrom[segmentsWithFrom.length - 1].seg.to;
    const reversed = [];

    for (let i = segmentsWithFrom.length - 1; i >= 0; i--) {
        const { from, seg } = segmentsWithFrom[i];
        if (seg.kind === 'line') {
            reversed.push({ kind: 'line', to: bucketPoint(from) });
            continue;
        }
        if (seg.kind === 'cubic' && isPoint(seg.c1) && isPoint(seg.c2)) {
            reversed.push({
                kind: 'cubic',
                c1: bucketPoint(seg.c2),
                c2: bucketPoint(seg.c1),
                to: bucketPoint(from)
            });
            continue;
        }
        // Fallback: treat unknown cubic-like segments as line.
        reversed.push({ kind: 'line', to: bucketPoint(from) });
    }

    return {
        ...path,
        start: bucketPoint(end),
        segments: reversed
    };
}

/**
 * @typedef {{kind:'line',to:{x:number,y:number}}|{kind:'cubic',c1:{x:number,y:number},c2:{x:number,y:number},to:{x:number,y:number}}} VectorSegment
 * @typedef {{closed:boolean,fillRule:'evenodd'|'nonzero',start:{x:number,y:number},segments:VectorSegment[]}} VectorPath
 */

export function canonicalizeVectorPath(path, eps = EPS_POINT) {
    if (!path || typeof path !== 'object') return path;
    const closed = path.closed !== false;
    const fillRule = path.fillRule === 'evenodd' ? 'evenodd' : 'nonzero';
    const start = isPoint(path.start) ? bucketPoint(path.start) : { x: 0, y: 0 };

    const nextSegments = [];
    let prev = start;

    for (const seg of Array.isArray(path.segments) ? path.segments : []) {
        if (!seg || typeof seg !== 'object' || !isPoint(seg.to)) continue;
        const to = bucketPoint(seg.to);

        // Remove zero-length endpoints / near-duplicate consecutive points.
        if (pointEq(prev, to, eps)) {
            continue;
        }

        if (seg.kind === 'line') {
            nextSegments.push({ kind: 'line', to });
            prev = to;
            continue;
        }

        if (seg.kind === 'cubic') {
            const c1 = isPoint(seg.c1) ? bucketPoint(seg.c1) : bucketPoint(prev);
            const c2 = isPoint(seg.c2) ? bucketPoint(seg.c2) : bucketPoint(to);

            // If cubic is effectively a point/line (all control points collapse), drop to line.
            const allSame = pointEq(prev, c1, eps) && pointEq(prev, c2, eps) && pointEq(prev, to, eps);
            if (allSame) {
                continue;
            }

            nextSegments.push({ kind: 'cubic', c1, c2, to });
            prev = to;
        }
    }

    // If closed, ensure the last point isn't effectively equal to start (avoid redundant closure segments).
    if (closed && nextSegments.length > 0) {
        const end = nextSegments[nextSegments.length - 1].to;
        if (pointEq(end, start, eps)) {
            nextSegments.pop();
        }
    }

    let out = { closed, fillRule, start, segments: nextSegments };

    // Normalize winding for closed paths using deterministic flattening + signed area.
    // Convention (v1): prefer non-negative signed area.
    if (closed && nextSegments.length >= 2) {
        const pts = flattenVectorPath(out, { eps, maxDepth: 8 });
        const area = signedArea(pts);
        if (area < 0) {
            out = reverseVectorPath(out);
        }
    }

    return out;
}

export function canonicalizeVectorPaths(paths, eps = EPS_POINT) {
    if (!Array.isArray(paths)) return [];
    const canon = paths
        .filter(Boolean)
        .map((p) => canonicalizeVectorPath(p, eps))
        .filter((p) => p && isPoint(p.start) && Array.isArray(p.segments));

    // Stable ordering of subpaths.
    canon.sort((a, b) => {
        if (a.start.x !== b.start.x) return a.start.x - b.start.x;
        if (a.start.y !== b.start.y) return a.start.y - b.start.y;
        if (a.closed !== b.closed) return a.closed ? 1 : -1;
        if (a.fillRule !== b.fillRule) return a.fillRule < b.fillRule ? -1 : 1;
        return (a.segments?.length ?? 0) - (b.segments?.length ?? 0);
    });

    return canon;
}

export function splitVectorSegment(from, seg, t, eps = EPS_POINT) {
    if (!isPoint(from) || !seg || typeof seg !== 'object') return { ok: false };
    const tt = clampFinite(Number(t), 0, 1, 0.5);
    if (tt <= eps || tt >= 1 - eps) return { ok: false };

    if (seg.kind === 'line') {
        if (!isPoint(seg.to)) return { ok: false };
        const to = seg.to;
        const mid = { x: from.x + (to.x - from.x) * tt, y: from.y + (to.y - from.y) * tt };
        if (pointEq(from, mid, eps) || pointEq(mid, to, eps)) return { ok: false };
        return {
            ok: true,
            left: { kind: 'line', to: mid },
            right: { kind: 'line', to }
        };
    }

    if (seg.kind === 'cubic') {
        if (!isPoint(seg.c1) || !isPoint(seg.c2) || !isPoint(seg.to)) return { ok: false };

        // De Casteljau split.
        const p0 = from;
        const p1 = seg.c1;
        const p2 = seg.c2;
        const p3 = seg.to;

        const lerp = (a, b) => ({ x: a.x + (b.x - a.x) * tt, y: a.y + (b.y - a.y) * tt });
        const p01 = lerp(p0, p1);
        const p12 = lerp(p1, p2);
        const p23 = lerp(p2, p3);
        const p012 = lerp(p01, p12);
        const p123 = lerp(p12, p23);
        const p0123 = lerp(p012, p123);

        if (pointEq(p0, p0123, eps) || pointEq(p0123, p3, eps)) return { ok: false };

        return {
            ok: true,
            left: { kind: 'cubic', c1: p01, c2: p012, to: p0123 },
            right: { kind: 'cubic', c1: p123, c2: p23, to: p3 }
        };
    }

    return { ok: false };
}

export function flattenVectorSegment(from, seg, options = {}) {
    const eps = Number.isFinite(options.eps) ? options.eps : EPS_POINT;
    const maxDepth = Number.isInteger(options.maxDepth) ? options.maxDepth : 8;

    if (!isPoint(from) || !seg || typeof seg !== 'object' || !isPoint(seg.to)) return [];

    if (seg.kind === 'line') {
        return [seg.to];
    }

    if (seg.kind !== 'cubic' || !isPoint(seg.c1) || !isPoint(seg.c2)) {
        return [seg.to];
    }

    // Recursive subdivision by flatness (distance from control points to baseline).
    const p0 = from;
    const p1 = seg.c1;
    const p2 = seg.c2;
    const p3 = seg.to;

    const flatEnough = () => {
        const ax = p3.x - p0.x;
        const ay = p3.y - p0.y;
        const denom = ax * ax + ay * ay;
        if (denom <= eps * eps) return true;
        // Distance from point to line (squared), using cross product magnitude.
        const d1 = (ay * (p1.x - p0.x) - ax * (p1.y - p0.y));
        const d2 = (ay * (p2.x - p0.x) - ax * (p2.y - p0.y));
        const dist1_2 = (d1 * d1) / denom;
        const dist2_2 = (d2 * d2) / denom;
        return Math.max(dist1_2, dist2_2) <= eps * eps;
    };

    const splitHalf = (a0, a1, a2, a3) => {
        const lerp = (u, v) => ({ x: (u.x + v.x) / 2, y: (u.y + v.y) / 2 });
        const a01 = lerp(a0, a1);
        const a12 = lerp(a1, a2);
        const a23 = lerp(a2, a3);
        const a012 = lerp(a01, a12);
        const a123 = lerp(a12, a23);
        const a0123 = lerp(a012, a123);
        return {
            left: [a0, a01, a012, a0123],
            right: [a0123, a123, a23, a3]
        };
    };

    const out = [];
    const walk = (a0, a1, a2, a3, depth) => {
        const s = { kind: 'cubic', c1: a1, c2: a2, to: a3 };
        if (depth <= 0) {
            out.push(a3);
            return;
        }
        // Recompute flatness for this segment.
        const base = { kind: 'cubic', c1: a1, c2: a2, to: a3 };
        const pFrom = a0;
        const pSeg = base;
        const ax = pSeg.to.x - pFrom.x;
        const ay = pSeg.to.y - pFrom.y;
        const denom = ax * ax + ay * ay;
        let ok = true;
        if (denom > eps * eps) {
            const d1 = (ay * (pSeg.c1.x - pFrom.x) - ax * (pSeg.c1.y - pFrom.y));
            const d2 = (ay * (pSeg.c2.x - pFrom.x) - ax * (pSeg.c2.y - pFrom.y));
            const dist1_2 = (d1 * d1) / denom;
            const dist2_2 = (d2 * d2) / denom;
            ok = Math.max(dist1_2, dist2_2) <= eps * eps;
        }
        if (ok) {
            out.push(a3);
            return;
        }

        const { left, right } = splitHalf(a0, a1, a2, a3);
        walk(left[0], left[1], left[2], left[3], depth - 1);
        walk(right[0], right[1], right[2], right[3], depth - 1);
    };

    if (flatEnough()) {
        out.push(p3);
        return out;
    }

    walk(p0, p1, p2, p3, maxDepth);
    return out;
}

export function flattenVectorPath(path, options = {}) {
    if (!path || typeof path !== 'object' || !isPoint(path.start)) return [];

    const pts = [bucketPoint(path.start)];
    let prev = path.start;
    for (const seg of Array.isArray(path.segments) ? path.segments : []) {
        const nextPts = flattenVectorSegment(prev, seg, options);
        if (nextPts.length > 0) {
            pts.push(...nextPts.map(bucketPoint));
            prev = nextPts[nextPts.length - 1];
        }
    }

    if (path.closed !== false && pts.length > 1) {
        const first = pts[0];
        const last = pts[pts.length - 1];
        if (!pointEq(first, last, options.eps ?? EPS_POINT)) {
            pts.push({ ...first });
        }
    }

    return pts;
}

export function segmentBounds(from, seg) {
    if (!isPoint(from) || !seg || typeof seg !== 'object' || !isPoint(seg.to)) {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    if (seg.kind === 'line') {
        const minX = Math.min(from.x, seg.to.x);
        const maxX = Math.max(from.x, seg.to.x);
        const minY = Math.min(from.y, seg.to.y);
        const maxY = Math.max(from.y, seg.to.y);
        return { minX, minY, maxX, maxY };
    }

    if (seg.kind !== 'cubic' || !isPoint(seg.c1) || !isPoint(seg.c2)) {
        const minX = Math.min(from.x, seg.to.x);
        const maxX = Math.max(from.x, seg.to.x);
        const minY = Math.min(from.y, seg.to.y);
        const maxY = Math.max(from.y, seg.to.y);
        return { minX, minY, maxX, maxY };
    }

    // Exact cubic bounds via derivative roots.
    const p0 = from;
    const p1 = seg.c1;
    const p2 = seg.c2;
    const p3 = seg.to;

    const roots = (a, b, c) => {
        // Solve a t^2 + b t + c = 0
        if (Math.abs(a) < 1e-12) {
            if (Math.abs(b) < 1e-12) return [];
            return [-c / b];
        }
        const disc = b * b - 4 * a * c;
        if (disc < 0) return [];
        const s = Math.sqrt(disc);
        return [(-b + s) / (2 * a), (-b - s) / (2 * a)];
    };

    const evalCubic = (t) => {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const t2 = t * t;
        return {
            x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
            y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y
        };
    };

    const tx = roots(
        -p0.x + 3 * p1.x - 3 * p2.x + p3.x,
        2 * (p0.x - 2 * p1.x + p2.x),
        -p0.x + p1.x
    ).filter((t) => t > 0 && t < 1);

    const ty = roots(
        -p0.y + 3 * p1.y - 3 * p2.y + p3.y,
        2 * (p0.y - 2 * p1.y + p2.y),
        -p0.y + p1.y
    ).filter((t) => t > 0 && t < 1);

    const candidates = [p0, p3, ...tx.map(evalCubic), ...ty.map(evalCubic)];

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of candidates) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }

    if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return { minX, minY, maxX, maxY };
}

export function pathBounds(path) {
    if (!path || typeof path !== 'object' || !isPoint(path.start)) {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let prev = path.start;
    let minX = prev.x, minY = prev.y, maxX = prev.x, maxY = prev.y;

    for (const seg of Array.isArray(path.segments) ? path.segments : []) {
        const b = segmentBounds(prev, seg);
        minX = Math.min(minX, b.minX);
        minY = Math.min(minY, b.minY);
        maxX = Math.max(maxX, b.maxX);
        maxY = Math.max(maxY, b.maxY);
        if (seg?.to) prev = seg.to;
    }

    return { minX, minY, maxX, maxY };
}

export function pathsBounds(paths) {
    const all = Array.isArray(paths) ? paths : [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of all) {
        const b = pathBounds(p);
        minX = Math.min(minX, b.minX);
        minY = Math.min(minY, b.minY);
        maxX = Math.max(maxX, b.maxX);
        maxY = Math.max(maxY, b.maxY);
    }
    if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return { minX, minY, maxX, maxY };
}
