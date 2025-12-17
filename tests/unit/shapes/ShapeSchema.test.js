import { describe, expect, it } from 'vitest';

import {
    migrateToCanonicalShapeV1,
    SHAPES_SCHEMA_VERSION,
    validateShapeElementV1
} from '../../../src/core/shapes/ShapeSchema.js';

describe('ShapeSchema v1', () => {
    it('migrates a legacy rectangle into canonical metadata (lossless)', () => {
        const legacy = {
            id: 'a',
            type: 'rect',
            x: 1,
            y: 2,
            width: 100,
            height: 50,
            rotation: 0,
            cornerRadius: 12,
            customField: { keep: true }
        };

        const migrated = migrateToCanonicalShapeV1(legacy);
        expect(migrated).not.toBe(legacy);
        expect(migrated.shapeSchemaVersion).toBe(SHAPES_SCHEMA_VERSION);
        expect(migrated.shapeKind).toBe('rectangle');
        // legacy fields remain
        expect(migrated.type).toBe('rect');
        expect(migrated.customField).toEqual({ keep: true });
    });

    it('can force canonical type:shape when requested', () => {
        const legacy = { id: 'a', type: 'rect', x: 0, y: 0, width: 10, height: 10, rotation: 0 };
        const migrated = migrateToCanonicalShapeV1(legacy, { forceTypeShape: true });
        expect(migrated.type).toBe('shape');
        expect(migrated.shapeKind).toBe('rectangle');
    });

    it('validates canonical rectangle requirements', () => {
        const ok = {
            id: 'r1',
            type: 'shape',
            shapeKind: 'rectangle',
            shapeSchemaVersion: SHAPES_SCHEMA_VERSION,
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            rotation: 0,
            params: { cornerRadii: [0, 1, 2, 3] }
        };
        expect(validateShapeElementV1(ok).ok).toBe(true);

        const bad = { ...ok, params: { cornerRadii: [1, 2, 3] } };
        expect(validateShapeElementV1(bad).ok).toBe(false);
    });

    it('validates canonical line requirements', () => {
        const el = {
            id: 'l1',
            type: 'shape',
            shapeKind: 'line',
            shapeSchemaVersion: SHAPES_SCHEMA_VERSION,
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            rotation: 0,
            params: { p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } }
        };
        expect(validateShapeElementV1(el).ok).toBe(true);
    });

    it('accepts unknown shapeKind for forward-compat (extensibility)', () => {
        const el = {
            id: 'u1',
            type: 'shape',
            shapeKind: 'future-kind',
            shapeSchemaVersion: SHAPES_SCHEMA_VERSION,
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            rotation: 0,
            futureField: { keep: true }
        };
        const res = validateShapeElementV1(el);
        expect(res.ok).toBe(true);
    });
});
