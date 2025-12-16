import * as martinez from 'martinez-polygon-clipping';

import { getShapeKind } from '../ShapeElementAdapter.js';
import { elementToWorldPolygons, worldPolygonsToElementLocal } from '../booleans/ShapeToPolygons.js';
import { intersectClips, polygonsToVectorPaths, vectorPathsToCssPath } from '../booleans/BooleanEngine.js';

function getElementsMap(slideData) {
    return slideData?.effectiveElements || slideData?.elements || {};
}

function safeDiff(a, b) {
    try {
        return martinez.diff(a, b);
    } catch {
        return null;
    }
}

function fullRectLocalMultiPolygon(el) {
    const w = Math.max(0, Number(el?.width) || 0);
    const h = Math.max(0, Number(el?.height) || 0);
    const ring = [
        [0, 0],
        [w, 0],
        [w, h],
        [0, h],
        [0, 0]
    ];
    return [[ring]];
}

function computeMaskRegionsForElement(el, slideData) {
    const elements = getElementsMap(slideData);
    const masks = [];

    for (const candidate of Object.values(elements)) {
        if (!candidate) continue;
        const kind = getShapeKind(candidate);
        if (kind !== 'mask') continue;
        if (!Array.isArray(candidate.contentIds)) continue;
        if (!candidate.contentIds.includes(el.id)) continue;

        masks.push(candidate);
    }

    // Deterministic ordering (commutative intersection anyway): by id.
    masks.sort((a, b) => String(a.id).localeCompare(String(b.id)));

    const regions = [];

    for (const maskNode of masks) {
        const maskShapeId = maskNode.maskShapeId;
        const maskShapeEl = typeof maskShapeId === 'string' ? elements[maskShapeId] : null;
        if (!maskShapeEl) continue;

        // Resolve mask shape into world polygons.
        const maskWorld = elementToWorldPolygons(slideData, maskShapeEl);
        const localClip = worldPolygonsToElementLocal(slideData, el, maskWorld);

        if (!Array.isArray(localClip) || localClip.length === 0) {
            // Degenerate: deterministic no-op region for this mask.
            continue;
        }

        if (maskNode.invert === true) {
            const full = fullRectLocalMultiPolygon(el);
            const inv = safeDiff(full, localClip);
            if (inv && Array.isArray(inv)) {
                regions.push(inv);
            } else {
                // Deterministic fallback: treat invert as no-op.
                regions.push(full);
            }
        } else {
            regions.push(localClip);
        }
    }

    return { masks, regions };
}

export function computeUnifiedClipPathCss(el, slideData) {
    if (!el || !slideData) {
        return { clipPath: null, maskCount: 0 };
    }

    const { masks, regions } = computeMaskRegionsForElement(el, slideData);
    if (!regions || regions.length === 0) {
        return { clipPath: null, maskCount: 0 };
    }

    const combined = intersectClips(regions);
    if (!combined || combined.length === 0) {
        return { clipPath: 'inset(100%)', maskCount: masks.length };
    }

    const paths = polygonsToVectorPaths(combined);
    const cssPath = vectorPathsToCssPath(paths);
    if (!cssPath || cssPath.length === 0) {
        return { clipPath: 'inset(100%)', maskCount: masks.length };
    }

    return { clipPath: cssPath, maskCount: masks.length };
}

export function applyUnifiedMaskingToElementDom(domEl, el, slideData) {
    if (!domEl || !el) return;

    const { clipPath, maskCount } = computeUnifiedClipPathCss(el, slideData);

    if (!clipPath) {
        domEl.style.clipPath = 'none';
        domEl.style.webkitClipPath = 'none';
        domEl.style.clipRule = '';
        domEl.removeAttribute('data-mask-count');
        return;
    }

    domEl.style.clipPath = clipPath;
    domEl.style.webkitClipPath = clipPath;
    domEl.style.clipRule = 'evenodd';
    domEl.setAttribute('data-mask-count', String(maskCount));
}
