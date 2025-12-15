import { describe, it, expect } from 'vitest';
import {
    getShapeKind,
    isShapeElement,
    isRectangleElement,
    isEllipseElement
} from '../../../src/core/shapes/ShapeElementAdapter.js';

describe('ShapeElementAdapter', () => {
    it('returns canonical shapeKind when present', () => {
        const el = { type: 'shape', shapeKind: 'rectangle' };
        expect(getShapeKind(el)).toBe('rectangle');
        expect(isShapeElement(el)).toBe(true);
        expect(isRectangleElement(el)).toBe(true);
        expect(isEllipseElement(el)).toBe(false);
    });

    it('maps legacy type "rect" to shapeKind "rectangle"', () => {
        const el = { type: 'rect', x: 0, y: 0, width: 10, height: 10 };
        const copy = structuredClone(el);

        expect(getShapeKind(el)).toBe('rectangle');
        expect(isShapeElement(el)).toBe(true);
        expect(isRectangleElement(el)).toBe(true);
        expect(el).toEqual(copy); // must not mutate
    });

    it('maps legacy type "rectangle" to shapeKind "rectangle"', () => {
        expect(getShapeKind({ type: 'rectangle' })).toBe('rectangle');
    });

    it('maps legacy ellipse types', () => {
        expect(getShapeKind({ type: 'circle' })).toBe('ellipse');
        expect(getShapeKind({ type: 'ellipse' })).toBe('ellipse');
        expect(isEllipseElement({ type: 'circle' })).toBe(true);
        expect(isRectangleElement({ type: 'circle' })).toBe(false);
    });

    it('maps legacy {type:"shape", shape:"rectangle"} to shapeKind "rectangle"', () => {
        expect(getShapeKind({ type: 'shape', shape: 'rectangle' })).toBe('rectangle');
        expect(getShapeKind({ type: 'shape', shape: 'circle' })).toBe('ellipse');
    });

    it('returns null for non-shape elements', () => {
        expect(getShapeKind({ type: 'text' })).toBe(null);
        expect(isShapeElement({ type: 'text' })).toBe(false);
        expect(getShapeKind(null)).toBe(null);
        expect(getShapeKind(undefined)).toBe(null);
    });
});
