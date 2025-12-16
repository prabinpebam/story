import { getShapeKind } from './ShapeElementAdapter.js';

export const SHAPES_SCHEMA_VERSION = 1;

const SHAPE_KINDS = new Set([
    'rectangle',
    'ellipse',
    'line',
    'polygon',
    'star',
    'vector',
    'boolean',
    'mask'
]);

function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function validatePoint(pt, label, errors) {
    if (!isPlainObject(pt) || !isFiniteNumber(pt.x) || !isFiniteNumber(pt.y)) {
        errors.push(`${label} must be an object {x:number,y:number}`);
    }
}

/**
 * Validate a canonical shape element. This is a pure validator; it does not mutate.
 */
export function validateShapeElementV1(element) {
    const errors = [];

    if (!isPlainObject(element)) {
        return { ok: false, errors: ['Element must be an object'] };
    }

    if (element.type !== 'shape') {
        errors.push(`type must be 'shape'`);
    }

    if (!SHAPE_KINDS.has(element.shapeKind)) {
        errors.push(`shapeKind must be one of: ${Array.from(SHAPE_KINDS).join(', ')}`);
    }

    for (const key of ['x', 'y', 'width', 'height']) {
        if (!isFiniteNumber(element[key])) {
            errors.push(`${key} must be a finite number`);
        }
    }

    if (element.rotation !== undefined && !isFiniteNumber(element.rotation)) {
        errors.push('rotation must be a finite number when present');
    }

    if (element.shapeSchemaVersion !== undefined && element.shapeSchemaVersion !== SHAPES_SCHEMA_VERSION) {
        errors.push(`shapeSchemaVersion must be ${SHAPES_SCHEMA_VERSION} when present`);
    }

    const params = element.params;

    switch (element.shapeKind) {
        case 'rectangle': {
            if (params !== undefined && !isPlainObject(params)) {
                errors.push('params must be an object for rectangle when present');
                break;
            }
            const radii = params?.cornerRadii;
            if (!Array.isArray(radii) || radii.length !== 4 || radii.some((n) => !isFiniteNumber(n) || n < 0)) {
                errors.push('rectangle.params.cornerRadii must be [tl,tr,br,bl] finite numbers >= 0');
            }
            const smoothing = params?.cornerSmoothing;
            if (smoothing !== undefined && (!isFiniteNumber(smoothing) || smoothing < 0 || smoothing > 1)) {
                errors.push('rectangle.params.cornerSmoothing must be a number in [0,1] when present');
            }
            break;
        }
        case 'line': {
            if (!isPlainObject(params)) {
                errors.push('line.params must be an object');
                break;
            }
            validatePoint(params.p1, 'line.params.p1', errors);
            validatePoint(params.p2, 'line.params.p2', errors);
            break;
        }
        case 'polygon': {
            if (!isPlainObject(params) || !Number.isInteger(params.sides) || params.sides < 3) {
                errors.push('polygon.params.sides must be an int >= 3');
            }
            break;
        }
        case 'star': {
            if (!isPlainObject(params) || !Number.isInteger(params.points) || params.points < 3) {
                errors.push('star.params.points must be an int >= 3');
            }
            if (!isPlainObject(params) || !isFiniteNumber(params.innerRadiusRatio) || params.innerRadiusRatio <= 0 || params.innerRadiusRatio >= 1) {
                errors.push('star.params.innerRadiusRatio must be a number in (0,1)');
            }
            break;
        }
        case 'vector': {
            if (!Array.isArray(element.paths)) {
                errors.push('vector.paths must be an array');
                break;
            }
            for (let i = 0; i < element.paths.length; i++) {
                const p = element.paths[i];
                if (!isPlainObject(p)) {
                    errors.push(`vector.paths[${i}] must be an object`);
                    continue;
                }
                if (typeof p.closed !== 'boolean') errors.push(`vector.paths[${i}].closed must be boolean`);
                if (p.fillRule !== 'nonzero' && p.fillRule !== 'evenodd') errors.push(`vector.paths[${i}].fillRule must be 'nonzero'|'evenodd'`);
                validatePoint(p.start, `vector.paths[${i}].start`, errors);
                if (!Array.isArray(p.segments)) {
                    errors.push(`vector.paths[${i}].segments must be an array`);
                    continue;
                }
                for (let j = 0; j < p.segments.length; j++) {
                    const s = p.segments[j];
                    if (!isPlainObject(s) || typeof s.kind !== 'string') {
                        errors.push(`vector.paths[${i}].segments[${j}] must be an object with kind`);
                        continue;
                    }
                    if (s.kind === 'line') {
                        validatePoint(s.to, `vector.paths[${i}].segments[${j}].to`, errors);
                    } else if (s.kind === 'cubic') {
                        validatePoint(s.c1, `vector.paths[${i}].segments[${j}].c1`, errors);
                        validatePoint(s.c2, `vector.paths[${i}].segments[${j}].c2`, errors);
                        validatePoint(s.to, `vector.paths[${i}].segments[${j}].to`, errors);
                    } else {
                        errors.push(`vector segment kind must be 'line' or 'cubic' (got '${s.kind}')`);
                    }
                }
            }
            break;
        }
        case 'boolean': {
            if (!isPlainObject(element) || (element.operation !== 'union' && element.operation !== 'subtract' && element.operation !== 'intersect' && element.operation !== 'exclude')) {
                errors.push("boolean.operation must be one of 'union'|'subtract'|'intersect'|'exclude'");
            }
            if (!Array.isArray(element.operands) || element.operands.some((id) => typeof id !== 'string')) {
                errors.push('boolean.operands must be string[]');
            }
            break;
        }
        case 'mask': {
            if (typeof element.maskShapeId !== 'string') errors.push('mask.maskShapeId must be a string');
            if (!Array.isArray(element.contentIds) || element.contentIds.some((id) => typeof id !== 'string')) {
                errors.push('mask.contentIds must be string[]');
            }
            if (element.mode !== undefined && element.mode !== 'clip' && element.mode !== 'alpha') {
                errors.push("mask.mode must be 'clip'|'alpha' when present");
            }
            if (element.invert !== undefined && typeof element.invert !== 'boolean') {
                errors.push('mask.invert must be boolean when present');
            }
            break;
        }
        case 'ellipse':
        default:
            // No additional persisted params required for ellipse in v1.
            break;
    }

    return { ok: errors.length === 0, errors };
}

/**
 * Migrate/normalize a possibly-legacy element into a canonical v1 shape element.
 *
 * By default it preserves legacy fields (lossless). Callers can optionally
 * force `type:'shape'` if they are ready to fully adopt the canonical taxonomy.
 */
export function migrateToCanonicalShapeV1(element, options = {}) {
    if (!isPlainObject(element)) return element;

    const forceTypeShape = options.forceTypeShape === true;

    const shapeKind = (typeof element.shapeKind === 'string' && element.shapeKind) ? element.shapeKind : getShapeKind(element);
    if (!shapeKind) return element;

    const next = {
        ...element,
        shapeKind,
        shapeSchemaVersion: SHAPES_SCHEMA_VERSION
    };

    if (forceTypeShape) {
        next.type = 'shape';
    }

    // Ensure params defaults for known kinds.
    if (shapeKind === 'rectangle') {
        const params = isPlainObject(next.params) ? { ...next.params } : {};
        if (Array.isArray(params.cornerRadii) && params.cornerRadii.length === 4) {
            // ok
        } else if (isFiniteNumber(params.cornerRadius)) {
            params.cornerRadii = [params.cornerRadius, params.cornerRadius, params.cornerRadius, params.cornerRadius];
        } else {
            params.cornerRadii = [0, 0, 0, 0];
        }
        next.params = params;
    }

    if (shapeKind === 'line') {
        const params = isPlainObject(next.params) ? { ...next.params } : {};
        if (!isPlainObject(params.p1) || !isPlainObject(params.p2)) {
            // Default: diagonal line in local space.
            params.p1 = { x: 0, y: 0 };
            params.p2 = { x: Number(next.width ?? 0), y: Number(next.height ?? 0) };
        }
        next.params = params;
    }

    if (shapeKind === 'polygon') {
        const params = isPlainObject(next.params) ? { ...next.params } : {};
        if (!Number.isInteger(params.sides) || params.sides < 3) params.sides = 3;
        next.params = params;
    }

    if (shapeKind === 'star') {
        const params = isPlainObject(next.params) ? { ...next.params } : {};
        if (!Number.isInteger(params.points) || params.points < 3) params.points = 5;
        if (!isFiniteNumber(params.innerRadiusRatio) || params.innerRadiusRatio <= 0 || params.innerRadiusRatio >= 1) {
            params.innerRadiusRatio = 0.5;
        }
        next.params = params;
    }

    if (shapeKind === 'vector') {
        if (!Array.isArray(next.paths)) {
            next.paths = [];
        }
    }

    if (shapeKind === 'boolean') {
        if (!Array.isArray(next.operands)) next.operands = [];
        if (!next.operation) next.operation = 'union';
    }

    if (shapeKind === 'mask') {
        if (!Array.isArray(next.contentIds)) next.contentIds = [];
        if (!next.mode) next.mode = 'clip';
        if (typeof next.invert !== 'boolean') next.invert = false;
    }

    return next;
}
