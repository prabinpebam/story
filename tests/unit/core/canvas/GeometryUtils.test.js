/**
 * GeometryUtils Unit Tests
 * 
 * Tests the pure utility functions for geometry calculations.
 * These are used for element positioning, hit testing, and selection bounds.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GeometryUtils } from '../../../../src/core/canvas/GeometryUtils.js';

describe('GeometryUtils', () => {
    describe('getAbsoluteElement()', () => {
        it('should return same coordinates for element without parent', () => {
            const element = { id: 'el-1', x: 100, y: 200, width: 50, height: 30, rotation: 0 };
            const slide = { elements: { 'el-1': element } };
            
            const result = GeometryUtils.getAbsoluteElement(element, slide);
            
            expect(result.x).toBe(100);
            expect(result.y).toBe(200);
            expect(result.rotation).toBe(0);
        });

        it('should add parent coordinates for nested element', () => {
            const parent = { id: 'parent', x: 100, y: 100, width: 200, height: 200, rotation: 0 };
            const child = { id: 'child', x: 20, y: 30, width: 50, height: 50, parentId: 'parent', rotation: 0 };
            const slide = { elements: { 'parent': parent, 'child': child } };
            
            const result = GeometryUtils.getAbsoluteElement(child, slide);
            
            expect(result.x).toBe(120); // 100 + 20
            expect(result.y).toBe(130); // 100 + 30
        });

        it('should accumulate rotation through hierarchy', () => {
            const parent = { id: 'parent', x: 100, y: 100, width: 200, height: 200, rotation: 45 };
            const child = { id: 'child', x: 20, y: 30, width: 50, height: 50, parentId: 'parent', rotation: 30 };
            const slide = { elements: { 'parent': parent, 'child': child } };
            
            const result = GeometryUtils.getAbsoluteElement(child, slide);
            
            expect(result.rotation).toBe(75); // 45 + 30
        });

        it('should handle deeply nested elements', () => {
            const grandparent = { id: 'gp', x: 10, y: 10, width: 300, height: 300, rotation: 10 };
            const parent = { id: 'p', x: 20, y: 20, width: 200, height: 200, parentId: 'gp', rotation: 20 };
            const child = { id: 'c', x: 30, y: 30, width: 100, height: 100, parentId: 'p', rotation: 30 };
            const slide = { 
                elements: { 
                    'gp': grandparent, 
                    'p': parent, 
                    'c': child 
                } 
            };
            
            const result = GeometryUtils.getAbsoluteElement(child, slide);
            
            expect(result.x).toBe(60); // 10 + 20 + 30
            expect(result.y).toBe(60); // 10 + 20 + 30
            expect(result.rotation).toBe(60); // 10 + 20 + 30
        });

        it('should handle missing parent gracefully', () => {
            const child = { id: 'child', x: 50, y: 50, width: 100, height: 100, parentId: 'missing', rotation: 15 };
            const slide = { elements: { 'child': child } };
            
            const result = GeometryUtils.getAbsoluteElement(child, slide);
            
            // Should stop at missing parent
            expect(result.x).toBe(50);
            expect(result.y).toBe(50);
            expect(result.rotation).toBe(15);
        });

        it('should handle undefined rotation', () => {
            const element = { id: 'el-1', x: 100, y: 200, width: 50, height: 30 };
            const slide = { elements: { 'el-1': element } };
            
            const result = GeometryUtils.getAbsoluteElement(element, slide);
            
            expect(result.rotation).toBe(0);
        });

        it('should preserve all original element properties', () => {
            const element = { 
                id: 'el-1', 
                x: 100, 
                y: 200, 
                width: 50, 
                height: 30, 
                rotation: 45,
                fill: '#FF0000',
                type: 'rectangle'
            };
            const slide = { elements: { 'el-1': element } };
            
            const result = GeometryUtils.getAbsoluteElement(element, slide);
            
            expect(result.fill).toBe('#FF0000');
            expect(result.type).toBe('rectangle');
            expect(result.width).toBe(50);
            expect(result.height).toBe(30);
        });
    });

    describe('getElementCorners()', () => {
        it('should return 4 corners for unrotated element', () => {
            const element = { x: 100, y: 100, width: 200, height: 100, rotation: 0 };
            
            const corners = GeometryUtils.getElementCorners(element);
            
            expect(corners).toHaveLength(4);
            // Top-left
            expect(corners[0].x).toBeCloseTo(100);
            expect(corners[0].y).toBeCloseTo(100);
            // Top-right
            expect(corners[1].x).toBeCloseTo(300);
            expect(corners[1].y).toBeCloseTo(100);
            // Bottom-right
            expect(corners[2].x).toBeCloseTo(300);
            expect(corners[2].y).toBeCloseTo(200);
            // Bottom-left
            expect(corners[3].x).toBeCloseTo(100);
            expect(corners[3].y).toBeCloseTo(200);
        });

        it('should rotate corners around center for 90 degree rotation', () => {
            const element = { x: 0, y: 0, width: 100, height: 50, rotation: 90 };
            const cx = 50; // center x
            const cy = 25; // center y
            
            const corners = GeometryUtils.getElementCorners(element);
            
            // After 90° rotation around center (50, 25):
            // Top-left (-50, -25) rotated 90° → (25, -50) + center → (75, -25)
            expect(corners[0].x).toBeCloseTo(75);
            expect(corners[0].y).toBeCloseTo(-25);
        });

        it('should handle 180 degree rotation', () => {
            const element = { x: 0, y: 0, width: 100, height: 100, rotation: 180 };
            
            const corners = GeometryUtils.getElementCorners(element);
            
            // 180° rotation flips corners
            // Top-left becomes bottom-right
            expect(corners[0].x).toBeCloseTo(100);
            expect(corners[0].y).toBeCloseTo(100);
            // Bottom-right becomes top-left
            expect(corners[2].x).toBeCloseTo(0);
            expect(corners[2].y).toBeCloseTo(0);
        });

        it('should handle 45 degree rotation', () => {
            const element = { x: 0, y: 0, width: 100, height: 100, rotation: 45 };
            const sqrt2_2 = Math.SQRT2 / 2; // ~0.707
            
            const corners = GeometryUtils.getElementCorners(element);
            
            // Center is at (50, 50)
            // Top-left is at (-50, -50) from center
            // After 45° rotation: x' = x*cos - y*sin, y' = x*sin + y*cos
            // x' = -50*0.707 - (-50)*0.707 = 0
            // y' = -50*0.707 + (-50)*0.707 = -70.7
            expect(corners[0].x).toBeCloseTo(50);
            expect(corners[0].y).toBeCloseTo(50 - 50 * Math.SQRT2);
        });

        it('should handle undefined rotation as 0', () => {
            const element = { x: 100, y: 100, width: 100, height: 100 };
            
            const corners = GeometryUtils.getElementCorners(element);
            
            expect(corners[0].x).toBeCloseTo(100);
            expect(corners[0].y).toBeCloseTo(100);
        });
    });

    describe('getSelectionBounds()', () => {
        const mockGetAbsolute = (el, slide) => el;

        it('should return null for empty selection', () => {
            const slide = { elements: {} };
            
            const result = GeometryUtils.getSelectionBounds(slide, [], mockGetAbsolute);
            
            expect(result).toBeNull();
        });

        it('should return element bounds for single selection', () => {
            const element = { id: 'el-1', x: 100, y: 100, width: 200, height: 100, rotation: 0 };
            const slide = { elements: { 'el-1': element } };
            
            const result = GeometryUtils.getSelectionBounds(slide, ['el-1'], mockGetAbsolute);
            
            expect(result.x).toBeCloseTo(100);
            expect(result.y).toBeCloseTo(100);
            expect(result.width).toBeCloseTo(200);
            expect(result.height).toBeCloseTo(100);
            expect(result.rotation).toBe(0);
        });

        it('should compute bounding box for multiple elements', () => {
            const el1 = { id: 'el-1', x: 0, y: 0, width: 100, height: 100, rotation: 0 };
            const el2 = { id: 'el-2', x: 200, y: 200, width: 100, height: 100, rotation: 0 };
            const slide = { elements: { 'el-1': el1, 'el-2': el2 } };
            
            const result = GeometryUtils.getSelectionBounds(slide, ['el-1', 'el-2'], mockGetAbsolute);
            
            expect(result.x).toBeCloseTo(0);
            expect(result.y).toBeCloseTo(0);
            expect(result.width).toBeCloseTo(300);
            expect(result.height).toBeCloseTo(300);
        });

        it('should handle overlapping elements', () => {
            const el1 = { id: 'el-1', x: 50, y: 50, width: 100, height: 100, rotation: 0 };
            const el2 = { id: 'el-2', x: 100, y: 100, width: 100, height: 100, rotation: 0 };
            const slide = { elements: { 'el-1': el1, 'el-2': el2 } };
            
            const result = GeometryUtils.getSelectionBounds(slide, ['el-1', 'el-2'], mockGetAbsolute);
            
            expect(result.x).toBeCloseTo(50);
            expect(result.y).toBeCloseTo(50);
            expect(result.width).toBeCloseTo(150); // 100 + 100 - 50 overlap offset
            expect(result.height).toBeCloseTo(150);
        });

        it('should skip missing elements', () => {
            const el1 = { id: 'el-1', x: 100, y: 100, width: 50, height: 50, rotation: 0 };
            const slide = { elements: { 'el-1': el1 } };
            
            const result = GeometryUtils.getSelectionBounds(slide, ['el-1', 'missing'], mockGetAbsolute);
            
            expect(result.x).toBeCloseTo(100);
            expect(result.y).toBeCloseTo(100);
            expect(result.width).toBeCloseTo(50);
            expect(result.height).toBeCloseTo(50);
        });

        it('should return null if all elements are missing', () => {
            const slide = { elements: {} };
            
            const result = GeometryUtils.getSelectionBounds(slide, ['missing1', 'missing2'], mockGetAbsolute);
            
            expect(result).toBeNull();
        });

        it('should account for rotated elements bounding box', () => {
            // A rotated element has a larger bounding box
            const element = { id: 'el-1', x: 0, y: 0, width: 100, height: 100, rotation: 45 };
            const slide = { elements: { 'el-1': element } };
            
            const result = GeometryUtils.getSelectionBounds(slide, ['el-1'], mockGetAbsolute);
            
            // For a 100x100 square rotated 45°, the bounding box is larger
            // Diagonal = 100 * sqrt(2) ≈ 141.4
            expect(result.width).toBeGreaterThan(100);
            expect(result.height).toBeGreaterThan(100);
        });

        it('should always have rotation 0 for multi-selection', () => {
            const el1 = { id: 'el-1', x: 0, y: 0, width: 100, height: 100, rotation: 45 };
            const el2 = { id: 'el-2', x: 200, y: 0, width: 100, height: 100, rotation: 30 };
            const slide = { elements: { 'el-1': el1, 'el-2': el2 } };
            
            const result = GeometryUtils.getSelectionBounds(slide, ['el-1', 'el-2'], mockGetAbsolute);
            
            expect(result.rotation).toBe(0);
        });
    });

    describe('pointInElement()', () => {
        it('should return true for point inside unrotated element', () => {
            const element = { x: 100, y: 100, width: 200, height: 100, rotation: 0 };
            
            expect(GeometryUtils.pointInElement(150, 150, element)).toBe(true);
            expect(GeometryUtils.pointInElement(200, 150, element)).toBe(true);
        });

        it('should return false for point outside unrotated element', () => {
            const element = { x: 100, y: 100, width: 200, height: 100, rotation: 0 };
            
            expect(GeometryUtils.pointInElement(50, 150, element)).toBe(false);
            expect(GeometryUtils.pointInElement(350, 150, element)).toBe(false);
            expect(GeometryUtils.pointInElement(150, 50, element)).toBe(false);
            expect(GeometryUtils.pointInElement(150, 250, element)).toBe(false);
        });

        it('should return true for point on element edge', () => {
            const element = { x: 100, y: 100, width: 200, height: 100, rotation: 0 };
            
            expect(GeometryUtils.pointInElement(100, 150, element)).toBe(true); // left edge
            expect(GeometryUtils.pointInElement(300, 150, element)).toBe(true); // right edge
            expect(GeometryUtils.pointInElement(200, 100, element)).toBe(true); // top edge
            expect(GeometryUtils.pointInElement(200, 200, element)).toBe(true); // bottom edge
        });

        it('should return true for point on element corner', () => {
            const element = { x: 100, y: 100, width: 200, height: 100, rotation: 0 };
            
            expect(GeometryUtils.pointInElement(100, 100, element)).toBe(true); // top-left
            expect(GeometryUtils.pointInElement(300, 100, element)).toBe(true); // top-right
            expect(GeometryUtils.pointInElement(300, 200, element)).toBe(true); // bottom-right
            expect(GeometryUtils.pointInElement(100, 200, element)).toBe(true); // bottom-left
        });

        it('should correctly test rotated element', () => {
            // Square rotated 45° at origin
            const element = { x: 0, y: 0, width: 100, height: 100, rotation: 45 };
            const cx = 50;
            const cy = 50;
            
            // Point at center should be inside
            expect(GeometryUtils.pointInElement(50, 50, element)).toBe(true);
            
            // Point at original corner (0,0) should now be outside due to rotation
            // After 45° rotation, the corners move
        });

        it('should handle undefined rotation', () => {
            const element = { x: 100, y: 100, width: 200, height: 100 };
            
            expect(GeometryUtils.pointInElement(150, 150, element)).toBe(true);
            expect(GeometryUtils.pointInElement(50, 150, element)).toBe(false);
        });

        it('should handle zero-sized element', () => {
            const element = { x: 100, y: 100, width: 0, height: 0, rotation: 0 };
            
            // Only exact point should match
            expect(GeometryUtils.pointInElement(100, 100, element)).toBe(true);
            expect(GeometryUtils.pointInElement(100.1, 100, element)).toBe(false);
        });

        it('should handle negative position', () => {
            const element = { x: -100, y: -100, width: 50, height: 50, rotation: 0 };
            
            expect(GeometryUtils.pointInElement(-75, -75, element)).toBe(true);
            expect(GeometryUtils.pointInElement(0, 0, element)).toBe(false);
        });
    });
});
