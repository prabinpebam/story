import { getShapeKind } from '../ShapeElementAdapter.js';
import { elementToWorldPolygons, worldPolygonsToElementLocal } from './ShapeToPolygons.js';
import { computeBooleanPaths } from './BooleanEngine.js';

const MAX_BOOLEAN_CACHE = 200;
const MAX_PAIR_CACHE = 800;

/**
 * LRU-ish Map: insertion order is used as recency.
 */
function lruGet(map, key) {
    if (!map.has(key)) return undefined;
    const value = map.get(key);
    map.delete(key);
    map.set(key, value);
    return value;
}

function lruSet(map, key, value, maxSize) {
    if (map.has(key)) map.delete(key);
    map.set(key, value);
    while (map.size > maxSize) {
        const firstKey = map.keys().next().value;
        map.delete(firstKey);
    }
}

function hashString32(str) {
    // djb2
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) + h) ^ str.charCodeAt(i);
    }
    // force unsigned
    return (h >>> 0).toString(16);
}

function safeNumber(n) {
    const v = Number(n);
    return Number.isFinite(v) ? v : 0;
}

function elementGeometryFingerprint(el) {
    if (!el || typeof el !== 'object') return '0';

    const kind = getShapeKind(el);

    const fingerprint = {
        id: String(el.id || ''),
        kind,
        x: safeNumber(el.x),
        y: safeNumber(el.y),
        width: safeNumber(el.width),
        height: safeNumber(el.height),
        rotation: safeNumber(el.rotation),
        // Common geometry knobs for parametric + vectors.
        radius: safeNumber(el.radius),
        cornerRadius: safeNumber(el.cornerRadius),
        sides: safeNumber(el.sides),
        innerRadius: safeNumber(el.innerRadius),
        // Vector/line geometry
        paths: Array.isArray(el.paths) ? el.paths : null,
        points: Array.isArray(el.points) ? el.points : null,
        // Relationships that influence world transforms.
        parentId: el.parentId ? String(el.parentId) : null,
    };

    // Hash to keep keys small even for large vector paths.
    return hashString32(JSON.stringify(fingerprint));
}

function transformChainFingerprint(el, elementsById, maxDepth = 8) {
    const parts = [];
    let current = el;
    let depth = 0;

    while (current && depth < maxDepth) {
        parts.push(elementGeometryFingerprint(current));
        const parentId = current.parentId;
        current = parentId && elementsById ? elementsById[parentId] : null;
        depth++;
    }

    return hashString32(parts.join('|'));
}

function countMultiPolygonPoints(multiPoly) {
    if (!Array.isArray(multiPoly)) return 0;
    let count = 0;
    for (const poly of multiPoly) {
        if (!Array.isArray(poly)) continue;
        for (const ring of poly) {
            if (!Array.isArray(ring)) continue;
            count += ring.length;
        }
    }
    return count;
}

function nowMs() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now();
    return Date.now();
}

// Per-element world polygon cache: key is element id.
const _worldPolyCache = new Map();
// Per (booleanId, operandId) local polygon cache.
const _operandLocalCache = new Map();
// Per-boolean derived path cache.
const _booleanResultCache = new Map();

function getWorldPolysCached(slideData, el, elementsById) {
    const id = String(el.id || '');
    if (!id) {
        return { polys: elementToWorldPolygons(slideData, el), pointCount: 0 };
    }

    const key = transformChainFingerprint(el, elementsById);
    const cached = _worldPolyCache.get(id);
    if (cached && cached.key === key) return cached;

    const polys = elementToWorldPolygons(slideData, el);
    const pointCount = countMultiPolygonPoints(polys);

    const record = { key, polys, pointCount };
    _worldPolyCache.set(id, record);
    return record;
}

function getOperandLocalCached(slideData, booleanEl, operandEl, elementsById) {
    const booleanId = String(booleanEl?.id || '');
    const operandId = String(operandEl?.id || '');
    const pairKey = `${booleanId}::${operandId}`;

    const booleanTransformKey = transformChainFingerprint(booleanEl, elementsById);
    const operandWorld = getWorldPolysCached(slideData, operandEl, elementsById);

    const key = `${booleanTransformKey}|${operandWorld.key}`;

    const cached = lruGet(_operandLocalCache, pairKey);
    if (cached && cached.key === key) return cached;

    const local = worldPolygonsToElementLocal(slideData, booleanEl, operandWorld.polys);
    const pointCount = countMultiPolygonPoints(local);

    const record = { key, polys: local, pointCount };
    lruSet(_operandLocalCache, pairKey, record, MAX_PAIR_CACHE);
    return record;
}

function computeBooleanCacheKey(booleanEl, slideData) {
    const operation = booleanEl?.operation || 'union';
    const operandIds = Array.isArray(booleanEl?.operands) ? booleanEl.operands : [];
    const elementsById = slideData?.effectiveElements || slideData?.elements || {};

    const operandKeys = operandIds.map((id) => {
        const el = elementsById[id];
        if (!el) return `missing:${String(id)}`;
        return transformChainFingerprint(el, elementsById);
    });

    const booleanKey = transformChainFingerprint(booleanEl, elementsById);

    return `${operation}|${booleanKey}|${operandIds.join(',')}|${operandKeys.join(',')}`;
}

/**
 * Resolve boolean derived vector paths with caching.
 *
 * Perceived performance: for boolean shapes detected as heavy, allow returning
 * a stale cached result during interaction (pointer-move) and refine on release.
 */
export function resolveBooleanDerivedPaths(booleanEl, slideData, { interactive = false } = {}) {
    const booleanId = String(booleanEl?.id || '');
    const cacheKey = computeBooleanCacheKey(booleanEl, slideData);

    const cached = booleanId ? lruGet(_booleanResultCache, booleanId) : undefined;
    if (cached && cached.key === cacheKey) {
        return cached.result;
    }

    // If we are interacting and this boolean was previously identified as heavy,
    // return last-known-good result as a preview.
    if (interactive && cached && cached.isHeavy && (cached.lastGoodResult || cached.lastResult)) {
        // Keep LRU ordering fresh.
        lruSet(_booleanResultCache, booleanId, cached, MAX_BOOLEAN_CACHE);
        return cached.lastGoodResult || cached.lastResult;
    }

    const operation = booleanEl?.operation || 'union';
    const operandIds = Array.isArray(booleanEl?.operands) ? booleanEl.operands : [];
    const elementsById = slideData?.effectiveElements || slideData?.elements || {};

    const operandPolysLocal = [];
    let totalPoints = 0;

    const missingOperandIds = [];
    const selfRef = booleanId && operandIds.includes(booleanId);

    for (const id of operandIds) {
        const opEl = elementsById[id];
        if (!opEl) {
            missingOperandIds.push(String(id));
            continue;
        }

        const local = getOperandLocalCached(slideData, booleanEl, opEl, elementsById);
        operandPolysLocal.push(local.polys);
        totalPoints += local.pointCount;
    }

    const t0 = nowMs();
    const res = computeBooleanPaths({ operation, operands: operandPolysLocal });
    const computeMs = nowMs() - t0;

    const hadMissingOperands = missingOperandIds.length > 0 || selfRef;
    const shouldUseLastGood = (!res.ok || res.status !== 'ok' || hadMissingOperands) && cached && cached.lastGoodResult;

    const result = {
        status: (!res.ok || hadMissingOperands) ? 'fallback' : res.status,
        paths: Array.isArray(res.paths) ? res.paths : [],
        meta: {
            missingOperandIds,
            selfRef,
        }
    };

    if (shouldUseLastGood) {
        result.paths = cached.lastGoodResult.paths;
    }

    if (booleanId) {
        const isHeavy = totalPoints >= 1500 || computeMs >= 8;
        const isOk = result.status === 'ok';
        const lastGoodResult = isOk ? result : (cached?.lastGoodResult || null);
        const record = {
            key: cacheKey,
            result,
            lastResult: result,
            lastGoodResult,
            isHeavy,
            lastComputeMs: computeMs,
        };
        lruSet(_booleanResultCache, booleanId, record, MAX_BOOLEAN_CACHE);
    }

    return result;
}

export function __clearBooleanDerivedCachesForTests() {
    _worldPolyCache.clear();
    _operandLocalCache.clear();
    _booleanResultCache.clear();
}
