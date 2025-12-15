import { describe, it, expect } from 'vitest';
import {
    enrichElementWithShapeKind,
    enrichSlideWithShapeKinds
} from '../../../src/core/shapes/ShapeMigration.js';

describe('ShapeMigration', () => {
    it('enriches legacy rect with shapeKind without changing type', () => {
        const el = { id: 'e1', type: 'rect', x: 1, y: 2, width: 10, height: 20, custom: { a: 1 } };
        const migrated = enrichElementWithShapeKind(el);

        expect(migrated).not.toBe(el);
        expect(migrated.type).toBe('rect');
        expect(migrated.shapeKind).toBe('rectangle');
        expect(migrated.custom).toEqual({ a: 1 });
        expect(el.shapeKind).toBeUndefined();
    });

    it('does not modify non-shape elements', () => {
        const el = { id: 't1', type: 'text', content: 'hello' };
        const migrated = enrichElementWithShapeKind(el);
        expect(migrated).toBe(el);
    });

    it('is a no-op when shapeKind already present', () => {
        const el = { id: 's1', type: 'shape', shapeKind: 'rectangle' };
        const migrated = enrichElementWithShapeKind(el);
        expect(migrated).toBe(el);
    });

    it('enriches slide elements array', () => {
        const slide = {
            id: 'slide-1',
            elements: [
                { id: 'a', type: 'rect', x: 0, y: 0, width: 10, height: 10 },
                { id: 'b', type: 'text', content: 'x' }
            ]
        };

        const migratedSlide = enrichSlideWithShapeKinds(slide);
        expect(migratedSlide).not.toBe(slide);
        expect(migratedSlide.elements).toHaveLength(2);
        expect(migratedSlide.elements[0].shapeKind).toBe('rectangle');
        expect(migratedSlide.elements[1].shapeKind).toBeUndefined();
    });

    it('enriches slide elements object map', () => {
        const slide = {
            id: 'slide-1',
            elements: {
                a: { id: 'a', type: 'circle', x: 0, y: 0, width: 10, height: 10 },
                b: { id: 'b', type: 'image' }
            }
        };

        const migratedSlide = enrichSlideWithShapeKinds(slide);
        expect(migratedSlide).not.toBe(slide);
        expect(migratedSlide.elements.a.shapeKind).toBe('ellipse');
        expect(migratedSlide.elements.b.shapeKind).toBeUndefined();
        expect(slide.elements.a.shapeKind).toBeUndefined();
    });
});
