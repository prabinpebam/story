import * as martinez from 'martinez-polygon-clipping';

function isFiniteNumber(n) {
    return typeof n === 'number' && Number.isFinite(n);
}

function bucketNumber(n) {
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 1e6) / 1e6;
}

function bucketPoint(pt) {
    return { x: bucketNumber(pt.x), y: bucketNumber(pt.y) };
}

function isDegenerateRing(ring) {
    return !Array.isArray(ring) || ring.length < 3;
}

function ensureClosedRing(ring) {
    if (!Array.isArray(ring) || ring.length === 0) return ring;
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first && last && first[0] === last[0] && first[1] === last[1]) return ring;
    return [...ring, [first[0], first[1]]];
}

function ringArea(ring) {
    // Shoelace area; ring is closed or open.
    if (!Array.isArray(ring) || ring.length < 3) return 0;
    let area = 0;
    const n = ring.length;
    for (let i = 0; i < n; i++) {
        const [x1, y1] = ring[i];
        const [x2, y2] = ring[(i + 1) % n];
        area += x1 * y2 - x2 * y1;
    }
    return area / 2;
}

function canonicalizeRing(ring) {
    // Bucket + remove duplicate trailing closure point for canonical processing.
    if (!Array.isArray(ring)) return ring;
    const pts = ring
        .filter((p) => Array.isArray(p) && isFiniteNumber(p[0]) && isFiniteNumber(p[1]))
        .map(([x, y]) => [bucketNumber(x), bucketNumber(y)]);

    if (pts.length < 3) return pts;

    // Drop duplicated last==first if present.
    const first = pts[0];
    const last = pts[pts.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) {
        pts.pop();
    }

    // Rotate so the lexicographically smallest point is first.
    let minIndex = 0;
    for (let i = 1; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[minIndex];
        if (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1])) {
            minIndex = i;
        }
    }
    const rotated = [...pts.slice(minIndex), ...pts.slice(0, minIndex)];

    // Ensure consistent winding: outer rings CCW, holes CW.
    // We don't know ring type here; caller will enforce.
    return rotated;
}

function canonicalizePolygonSet(polys) {
    if (!Array.isArray(polys)) return [];

    const out = [];
    for (const poly of polys) {
        if (!Array.isArray(poly) || poly.length === 0) continue;

        const rings = [];
        for (const ring of poly) {
            if (isDegenerateRing(ring)) continue;
            const canon = canonicalizeRing(ring);
            if (canon.length < 3) continue;
            rings.push(canon);
        }

        if (rings.length === 0) continue;

        // Sort rings deterministically by area magnitude (outer first), then by points.
        rings.sort((a, b) => {
            const aa = Math.abs(ringArea(a));
            const bb = Math.abs(ringArea(b));
            if (aa !== bb) return bb - aa;
            const alen = a.length;
            const blen = b.length;
            if (alen !== blen) return alen - blen;
            for (let i = 0; i < Math.min(alen, blen); i++) {
                if (a[i][0] !== b[i][0]) return a[i][0] - b[i][0];
                if (a[i][1] !== b[i][1]) return a[i][1] - b[i][1];
            }
            return 0;
        });

        // Enforce winding: largest area ring treated as outer.
        const outer = rings[0];
        if (ringArea(outer) < 0) outer.reverse();
        for (let i = 1; i < rings.length; i++) {
            const hole = rings[i];
            if (ringArea(hole) > 0) hole.reverse();
        }

        out.push(rings);
    }

    // Sort polygons deterministically by their outer ring first point.
    out.sort((a, b) => {
        const ap = a[0]?.[0] || [0, 0];
        const bp = b[0]?.[0] || [0, 0];
        if (ap[0] !== bp[0]) return ap[0] - bp[0];
        if (ap[1] !== bp[1]) return ap[1] - bp[1];
        return 0;
    });

    return out;
}

function toVectorPathsFromPolygons(polys) {
    // Represent as one SVG path with evenodd fill rule (holes supported).
    // We encode each ring as its own closed subpath.
    const canonical = canonicalizePolygonSet(polys);

    /** @type {Array<{closed:boolean,fillRule:'evenodd'|'nonzero',start:{x:number,y:number},segments:any[]}>} */
    const paths = [];

    for (const poly of canonical) {
        for (const ring of poly) {
            if (!Array.isArray(ring) || ring.length < 3) continue;
            const closedRing = ensureClosedRing(ring);
            const start = bucketPoint({ x: closedRing[0][0], y: closedRing[0][1] });
            const segments = [];
            for (let i = 1; i < closedRing.length; i++) {
                const pt = bucketPoint({ x: closedRing[i][0], y: closedRing[i][1] });
                segments.push({ kind: 'line', to: pt });
            }
            paths.push({
                closed: true,
                fillRule: 'evenodd',
                start,
                segments
            });
        }
    }

    return paths;
}

function safeBooleanOp(operation, aPolys, bPolys) {
    try {
        if (operation === 'union') return martinez.union(aPolys, bPolys);
        if (operation === 'subtract') return martinez.diff(aPolys, bPolys);
        if (operation === 'intersect') return martinez.intersection(aPolys, bPolys);
        if (operation === 'exclude') return martinez.xor(aPolys, bPolys);
        return null;
    } catch {
        return null;
    }
}

function normalizePolys(polys) {
    // Ensure arrays and bucket.
    if (!Array.isArray(polys)) return [];
    return polys.map((poly) => {
        if (!Array.isArray(poly)) return [];
        return poly.map((ring) => {
            if (!Array.isArray(ring)) return [];
            return ring
                .filter((pt) => Array.isArray(pt) && isFiniteNumber(pt[0]) && isFiniteNumber(pt[1]))
                .map(([x, y]) => [bucketNumber(x), bucketNumber(y)]);
        });
    });
}

/**
 * Compute boolean composition over a list of operand polygon sets.
 *
 * Polygons use Martinez format:
 * - MultiPolygon: Polygon[]
 * - Polygon: Ring[]
 * - Ring: [x,y][]
 *
 * @param {{operation:'union'|'subtract'|'intersect'|'exclude', operands:any[]}} input
 * @returns {{ok:true,paths:any[],status:'ok'|'repaired'} | {ok:false,paths:any[],status:'fallback'}}
 */
export function computeBooleanPaths(input) {
    const operation = input?.operation;
    const operands = Array.isArray(input?.operands) ? input.operands : [];

    const safeFallback = () => {
        if (operation === 'union' || operation === 'exclude') {
            const first = normalizePolys(operands[0] || []);
            return { ok: false, status: 'fallback', paths: toVectorPathsFromPolygons(first) };
        }
        return { ok: false, status: 'fallback', paths: [] };
    };

    if (!operation || operands.length === 0) {
        return safeFallback();
    }

    // Fold left with deterministic ordering (operand order preserved).
    let acc = normalizePolys(operands[0] || []);

    for (let i = 1; i < operands.length; i++) {
        const next = normalizePolys(operands[i] || []);
        const res = safeBooleanOp(operation, acc, next);
        if (!res) return safeFallback();
        acc = normalizePolys(res);
    }

    // Final canonicalization.
    try {
        const paths = toVectorPathsFromPolygons(acc);
        return { ok: true, status: 'ok', paths };
    } catch {
        return safeFallback();
    }
}

/**
 * Intersect a list of clip polygon sets (for composing multiple masks).
 *
 * @param {any[]} clips
 * @returns {any[]}
 */
export function intersectClips(clips) {
    const list = Array.isArray(clips) ? clips : [];
    if (list.length === 0) return [];
    let acc = normalizePolys(list[0]);
    for (let i = 1; i < list.length; i++) {
        const next = normalizePolys(list[i]);
        const res = safeBooleanOp('intersect', acc, next);
        if (!res) return [];
        acc = normalizePolys(res);
    }
    return acc;
}

/**
 * Convert vector-path schema (paths with line segments) into a CSS `path('...')` string.
 *
 * @param {any[]} paths
 * @returns {string}
 */
export function vectorPathsToCssPath(paths) {
    if (!Array.isArray(paths) || paths.length === 0) return '';
    const parts = [];
    for (const p of paths) {
        if (!p?.start) continue;
        const sx = bucketNumber(Number(p.start.x));
        const sy = bucketNumber(Number(p.start.y));
        if (!Number.isFinite(sx) || !Number.isFinite(sy)) continue;
        parts.push(`M ${sx} ${sy}`);
        for (const seg of p.segments || []) {
            if (!seg || seg.kind !== 'line' || !seg.to) continue;
            const x = bucketNumber(Number(seg.to.x));
            const y = bucketNumber(Number(seg.to.y));
            if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
            parts.push(`L ${x} ${y}`);
        }
        parts.push('Z');
    }
    return `path('${parts.join(' ')}')`;
}

/**
 * Convert a MultiPolygon into Story vector `paths` (line segments) using
 * the same canonicalization rules as boolean outputs.
 */
export function polygonsToVectorPaths(polys) {
    return toVectorPathsFromPolygons(polys);
}
