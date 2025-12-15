/**
 * ShapeElementAdapter
 *
 * Provides a small, stable compatibility layer to interpret heterogeneous
 * legacy shape element representations as the canonical Shapes spec model.
 *
 * Canonical model reference:
 * - documentation/01-specs/shapes/02-data-model-and-serialization.md
 */

const LEGACY_SHAPE_KIND_BY_TYPE = {
    rect: 'rectangle',
    rectangle: 'rectangle',

    circle: 'ellipse',
    ellipse: 'ellipse',

    line: 'line',
    polygon: 'polygon',
    star: 'star'
};

const LEGACY_KIND_BY_SHAPE_FIELD = {
    rectangle: 'rectangle',
    rect: 'rectangle',

    ellipse: 'ellipse',
    circle: 'ellipse',

    line: 'line',
    polygon: 'polygon',
    star: 'star',

    vector: 'vector',
    boolean: 'boolean',
    mask: 'mask'
};

/**
 * Returns a canonical `shapeKind` string for an element, or `null` if the
 * element is not representable as a canonical shape.
 *
 * Supports:
 * - Canonical: { type:'shape', shapeKind: 'rectangle' | ... }
 * - Legacy: { type:'rect' | 'circle' | ... }
 * - Legacy: { type:'shape', shape:'rectangle' | ... }
 */
export function getShapeKind(element) {
    if (!element || typeof element !== 'object') return null;

    // Canonical
    if (element.type === 'shape' && typeof element.shapeKind === 'string') {
        return element.shapeKind;
    }

    // Legacy: type maps directly to a kind
    if (typeof element.type === 'string' && element.type in LEGACY_SHAPE_KIND_BY_TYPE) {
        return LEGACY_SHAPE_KIND_BY_TYPE[element.type];
    }

    // Legacy: type:'shape' with a `shape` string
    if (element.type === 'shape' && typeof element.shape === 'string') {
        return LEGACY_KIND_BY_SHAPE_FIELD[element.shape] || null;
    }

    // Legacy: type strings that match a kind name directly (e.g. 'vector')
    if (typeof element.type === 'string' && element.type in LEGACY_KIND_BY_SHAPE_FIELD) {
        return LEGACY_KIND_BY_SHAPE_FIELD[element.type];
    }

    return null;
}

export function isShapeElement(element) {
    return getShapeKind(element) !== null;
}

export function isRectangleElement(element) {
    return getShapeKind(element) === 'rectangle';
}

export function isEllipseElement(element) {
    return getShapeKind(element) === 'ellipse';
}
