/**
 * ShapeMigration
 *
 * Incremental, non-breaking migrations/enrichments for heterogeneous shape
 * representations.
 *
 * This module intentionally does NOT do a big-bang rewrite to `type:'shape'` yet.
 * Instead it enriches legacy shape elements with canonical metadata (`shapeKind`)
 * while preserving existing fields for backwards compatibility.
 *
 * Spec reference:
 * - documentation/01-specs/shapes/02-data-model-and-serialization.md
 */

import { getShapeKind } from './ShapeElementAdapter.js';

export function enrichElementWithShapeKind(element) {
    if (!element || typeof element !== 'object') return element;

    // Already canonical enough for our purposes.
    if (typeof element.shapeKind === 'string' && element.shapeKind.length > 0) {
        return element;
    }

    const shapeKind = getShapeKind(element);
    if (!shapeKind) return element;

    return {
        ...element,
        shapeKind
    };
}

function enrichElementsCollection(elements) {
    if (!elements) return elements;

    if (Array.isArray(elements)) {
        let changed = false;
        const next = elements.map(el => {
            const migrated = enrichElementWithShapeKind(el);
            changed = changed || migrated !== el;
            return migrated;
        });
        return changed ? next : elements;
    }

    if (typeof elements === 'object') {
        let changed = false;
        const next = {};
        for (const [id, el] of Object.entries(elements)) {
            const migrated = enrichElementWithShapeKind(el);
            next[id] = migrated;
            changed = changed || migrated !== el;
        }
        return changed ? next : elements;
    }

    return elements;
}

/**
 * Enrich a slide's elements with `shapeKind` where possible.
 *
 * Accepts a slide whose `elements` may be an array or object.
 * Returns the same slide reference if no changes are required.
 */
export function enrichSlideWithShapeKinds(slide) {
    if (!slide || typeof slide !== 'object') return slide;

    const nextElements = enrichElementsCollection(slide.elements);
    if (nextElements === slide.elements) return slide;

    return {
        ...slide,
        elements: nextElements
    };
}
