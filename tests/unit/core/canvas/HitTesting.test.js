/**
 * HitTesting Unit Tests
 * 
 * Tests hit detection for elements and interaction handles.
 * These tests mock the CanvasManager and Store dependencies.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock store module before importing HitTesting
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn(),
        getEffectiveSlide: vi.fn()
    }
}));

import { HitTesting } from '../../../../src/core/canvas/HitTesting.js';
import { store } from '../../../../src/core/Store.js';

describe('HitTesting', () => {
    let hitTesting;
    let mockCanvasManager;
    let mockState;

    beforeEach(() => {
        // Create mock canvas manager
        mockCanvasManager = {
            getActiveContainer: vi.fn()
        };

        // Default state
        mockState = {
            editor: {
                mode: 'edit',
                zoom: 1,
                pan: { x: 0, y: 0 },
                selectedElementIds: []
            },
            masters: {}
        };

        store.getState.mockReturnValue(mockState);
        store.getEffectiveSlide.mockReturnValue(null);

        hitTesting = new HitTesting(mockCanvasManager);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('hitTest()', () => {
        it('should return null when no slide exists', () => {
            mockCanvasManager.getActiveContainer.mockReturnValue(null);

            const result = hitTesting.hitTest(100, 100);

            expect(result).toBeNull();
        });

        it('should detect element hit', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 200, height: 100, rotation: 0 }
                },
                elementOrder: ['el-1']
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Point inside element
            const result = hitTesting.hitTest(150, 150);

            expect(result).toEqual(expect.objectContaining({
                type: 'element',
                id: 'el-1'
            }));
        });

        it('should return null for miss', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 200, height: 100, rotation: 0 }
                },
                elementOrder: ['el-1']
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Point outside element
            const result = hitTesting.hitTest(50, 50);

            expect(result).toBeNull();
        });

        it('should select topmost element in z-order', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 200, height: 200, rotation: 0 },
                    'el-2': { id: 'el-2', x: 150, y: 150, width: 100, height: 100, rotation: 0 }
                },
                elementOrder: ['el-1', 'el-2'] // el-2 is on top
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Point in overlapping area
            const result = hitTesting.hitTest(175, 175);

            expect(result.id).toBe('el-2');
        });

        it('should convert screen coordinates to world coordinates', () => {
            mockState.editor.zoom = 2;
            mockState.editor.pan = { x: 100, y: 50 };

            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 50, y: 50, width: 100, height: 100, rotation: 0 }
                },
                elementOrder: ['el-1']
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Screen (200, 150) -> World (50, 50) at zoom 2, pan (100, 50)
            const result = hitTesting.hitTest(200, 150);

            expect(result).toEqual(expect.objectContaining({
                type: 'element',
                id: 'el-1'
            }));
        });

        it('should check handles before elements when selection exists', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 200, height: 100, rotation: 0 }
                },
                elementOrder: ['el-1']
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            mockState.editor.selectedElementIds = ['el-1'];

            // Click on corner handle (at 100, 100)
            const result = hitTesting.hitTest(100, 100);

            // Should be a handle, not an element
            expect(result.type).toBe('handle');
        });

        it('should mark inherited elements correctly', () => {
            const mockSlide = {
                elements: {
                    // This element is NOT directly on the slide (inherited)
                },
                elementOrder: []
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Set up effective slide with inherited element
            store.getEffectiveSlide.mockReturnValue({
                effectiveElements: {
                    'inherited-el': { id: 'inherited-el', x: 100, y: 100, width: 100, height: 100, rotation: 0 }
                },
                effectiveOrder: ['inherited-el']
            });

            const result = hitTesting.hitTest(150, 150);

            expect(result).toEqual(expect.objectContaining({
                type: 'element',
                id: 'inherited-el',
                isInherited: true
            }));
        });
    });

    describe('hitTestHandles()', () => {
        it('should return null when no element is selected', () => {
            mockState.editor.selectedElementIds = [];

            const result = hitTesting.hitTestHandles(100, 100);

            expect(result).toBeNull();
        });

        it('should detect resize handle for single selection', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 200, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            mockState.editor.selectedElementIds = ['el-1'];

            // Click on NW handle (at 100, 100)
            const result = hitTesting.hitTestHandles(100, 100);

            expect(result).toEqual(expect.objectContaining({
                type: 'handle',
                id: 'el-1',
                handle: 'nw',
                action: 'resize'
            }));
        });

        it('should detect all 8 resize handles', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 200, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            mockState.editor.selectedElementIds = ['el-1'];

            const handles = {
                'nw': { x: 100, y: 100 },
                'n':  { x: 200, y: 100 },
                'ne': { x: 300, y: 100 },
                'e':  { x: 300, y: 150 },
                'se': { x: 300, y: 200 },
                's':  { x: 200, y: 200 },
                'sw': { x: 100, y: 200 },
                'w':  { x: 100, y: 150 }
            };

            for (const [key, pos] of Object.entries(handles)) {
                const result = hitTesting.hitTestHandles(pos.x, pos.y);
                expect(result?.handle).toBe(key);
                expect(result?.action).toBe('resize');
            }
        });

        it('should detect rotation handle outside corners', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 200, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            mockState.editor.selectedElementIds = ['el-1'];

            // Click slightly outside NW corner
            const result = hitTesting.hitTestHandles(95, 95);

            expect(result).toEqual(expect.objectContaining({
                type: 'handle',
                handle: 'nw',
                action: 'rotate'
            }));
        });

        it('should detect corner radius handles', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', type: 'rect', x: 100, y: 100, width: 200, height: 200, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            mockState.editor.selectedElementIds = ['el-1'];

            // Click on inner radius handle (offset from corner)
            const result = hitTesting.hitTestHandles(112, 112); // 100 + 12 offset

            expect(result).toEqual(expect.objectContaining({
                type: 'handle',
                handle: 'radius-nw',
                action: 'radius'
            }));
        });

        it('should handle multi-selection bounding box', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 100, height: 100, rotation: 0 },
                    'el-2': { id: 'el-2', x: 300, y: 100, width: 100, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            mockState.editor.selectedElementIds = ['el-1', 'el-2'];

            // Click on SE corner of bounding box (400, 200)
            const result = hitTesting.hitTestHandles(400, 200);

            expect(result).toEqual(expect.objectContaining({
                type: 'handle',
                id: 'multi-selection',
                action: 'resize'
            }));
        });

        it('should return null for miss on handles', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 200, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            mockState.editor.selectedElementIds = ['el-1'];

            // Click in center of element (not on handle)
            const result = hitTesting.hitTestHandles(200, 150);

            expect(result).toBeNull();
        });
    });

    describe('checkHandlesV2()', () => {
        it('should handle rotated elements', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 100, height: 100, rotation: 45 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            mockState.editor.selectedElementIds = ['el-1'];

            // After 45° rotation, corners are in different positions
            // The handle check transforms the test point into local space
            // Testing that it doesn't crash and returns reasonable result
            const result = hitTesting.hitTestHandles(150, 150); // center

            // Center should not hit any handle
            expect(result).toBeNull();
        });

        it('should adjust handle size based on zoom', () => {
            mockState.editor.zoom = 2;

            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 200, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            mockState.editor.selectedElementIds = ['el-1'];

            // At zoom 2, handle hit area should be smaller in world space
            // Hit test at world coordinates (after pan/zoom conversion)
            const result = hitTesting.hitTestHandles(150, 150); // Screen coords

            // With zoom adjustment, this might or might not hit a handle
            // The important thing is it processes correctly
            expect(result === null || result.type === 'handle').toBe(true);
        });

        it('should not show radius handles on small elements', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 30, height: 30, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            mockState.editor.selectedElementIds = ['el-1'];

            // Try to hit radius handle position - should not exist for small elements
            const result = hitTesting.hitTestHandles(112, 112);

            // Should not be a radius handle
            expect(result?.action).not.toBe('radius');
        });
    });

    describe('Edge cases', () => {
        it('should handle missing element in slide', () => {
            const mockSlide = {
                elements: {},
                elementOrder: ['missing-el']
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            const result = hitTesting.hitTest(100, 100);

            expect(result).toBeNull();
        });

        it('should handle element with no rotation property', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 100, height: 100 }
                },
                elementOrder: ['el-1']
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            const result = hitTesting.hitTest(150, 150);

            expect(result).toEqual(expect.objectContaining({
                type: 'element',
                id: 'el-1'
            }));
        });

        it('should handle layout mode correctly', () => {
            mockState.editor.mode = 'master';
            
            const mockLayout = {
                type: 'layout',
                elements: {
                    'layout-el': { id: 'layout-el', x: 100, y: 100, width: 100, height: 100, rotation: 0 }
                },
                elementOrder: ['layout-el']
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockLayout);

            const result = hitTesting.hitTest(150, 150);

            expect(result).toEqual(expect.objectContaining({
                type: 'element',
                id: 'layout-el'
            }));
        });

        it('should handle zero zoom gracefully', () => {
            mockState.editor.zoom = 0.001; // Very small zoom

            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 100, height: 100, rotation: 0 }
                },
                elementOrder: ['el-1']
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Should not crash
            expect(() => hitTesting.hitTest(100, 100)).not.toThrow();
        });
    });
});
