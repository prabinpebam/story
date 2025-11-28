/**
 * SnappingSystem Unit Tests
 * 
 * Tests element snapping to guides, other elements, and spacing.
 * These tests mock the CanvasManager and Store dependencies.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock store module before importing SnappingSystem
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn()
    }
}));

import { SnappingSystem } from '../../../../src/core/canvas/SnappingSystem.js';
import { store } from '../../../../src/core/Store.js';

describe('SnappingSystem', () => {
    let snappingSystem;
    let mockCanvasManager;
    let mockState;

    beforeEach(() => {
        // Create mock canvas manager
        mockCanvasManager = {
            getActiveContainer: vi.fn(),
            hitTesting: {
                hitTest: vi.fn()
            },
            measurementGuides: null
        };

        // Default state with a slide
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

        snappingSystem = new SnappingSystem(mockCanvasManager);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('snapToGuides()', () => {
        it('should return original position when no snap targets', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {}
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            const result = snappingSystem.snapToGuides('el-1', 100, 100, 50, 50, 1);

            expect(result.x).toBe(100);
            expect(result.y).toBe(100);
            expect(result.guides).toEqual([]);
        });

        it('should snap to canvas center horizontally', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {}
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Element center at 957 (close to 960 = 1920/2)
            const result = snappingSystem.snapToGuides('el-1', 935, 100, 50, 50, 1);

            expect(result.x).toBeCloseTo(935); // 960 - 25 (half width)
            expect(result.guides.some(g => g.type === 'v' && g.x === 960)).toBe(true);
        });

        it('should snap to canvas center vertically', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {}
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Element center at 537 (close to 540 = 1080/2)
            const result = snappingSystem.snapToGuides('el-1', 100, 515, 50, 50, 1);

            expect(result.y).toBeCloseTo(515); // 540 - 25 (half height)
            expect(result.guides.some(g => g.type === 'h' && g.y === 540)).toBe(true);
        });

        it('should snap to canvas left edge', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {}
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Element left edge at 3 (close to 0)
            const result = snappingSystem.snapToGuides('el-1', 3, 100, 50, 50, 1);

            expect(result.x).toBe(0);
            expect(result.guides.some(g => g.type === 'v' && g.x === 0)).toBe(true);
        });

        it('should snap to canvas right edge', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {}
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Element right edge at 1917 (close to 1920)
            const result = snappingSystem.snapToGuides('el-1', 1867, 100, 50, 50, 1);

            expect(result.x).toBe(1870); // 1920 - 50
            expect(result.guides.some(g => g.type === 'v' && g.x === 1920)).toBe(true);
        });

        it('should snap to other element edges', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {
                    'other': { id: 'other', x: 200, y: 200, width: 100, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Element left edge at 297 (close to other's right edge at 300)
            const result = snappingSystem.snapToGuides('el-1', 297, 100, 50, 50, 1);

            expect(result.x).toBe(300);
            expect(result.guides.some(g => g.type === 'v' && g.x === 300)).toBe(true);
        });

        it('should snap to other element centers', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {
                    'other': { id: 'other', x: 200, y: 200, width: 100, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Our center at 247 (close to other's center at 250)
            const result = snappingSystem.snapToGuides('el-1', 222, 100, 50, 50, 1);

            expect(result.x).toBe(225); // 250 - 25
            expect(result.guides.some(g => g.type === 'v' && g.x === 250)).toBe(true);
        });

        it('should respect snap threshold', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {}
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Element left edge at 10 (too far from 0 to snap)
            const result = snappingSystem.snapToGuides('el-1', 10, 100, 50, 50, 1);

            expect(result.x).toBe(10); // No snap
            expect(result.guides).toEqual([]);
        });

        it('should adjust threshold based on zoom', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {}
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // At zoom 1, threshold is 5 pixels
            // Element left edge at 3 should snap at zoom 1 (3 < 5)
            const result1 = snappingSystem.snapToGuides('el-1', 3, 100, 50, 50, 1);
            expect(result1.x).toBe(0);

            // At zoom 2, threshold is halved in world space (5/2 = 2.5 pixels)
            // Element left edge at 3 should NOT snap at zoom 2 (3 > 2.5)
            const result2 = snappingSystem.snapToGuides('el-1', 3, 100, 50, 50, 2);
            expect(result2.x).toBe(3); // No snap

            // At zoom 2, 2 should snap (2 < 2.5)
            const result3 = snappingSystem.snapToGuides('el-1', 2, 100, 50, 50, 2);
            expect(result3.x).toBe(0);
        });

        it('should not snap to self', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 50, height: 50, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            const result = snappingSystem.snapToGuides('el-1', 100, 100, 50, 50, 1);

            // Should not create guides from its own position
            // Only canvas guides should be possible
            expect(result.guides.every(g => g.x !== 100 || g.type !== 'v')).toBe(true);
        });
    });

    describe('snapResize()', () => {
        it('should snap west edge during resize', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 200, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Resizing west edge to 3 (close to 0)
            const result = snappingSystem.snapResize('el-1', 'w', 3, 100, 197, 100, 1);

            expect(result.x).toBe(0);
            expect(result.width).toBe(200); // Original 197 + 3
        });

        it('should snap east edge during resize', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 200, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Resizing east edge to 1917 (close to 1920)
            const result = snappingSystem.snapResize('el-1', 'e', 100, 100, 1817, 100, 1);

            expect(result.width).toBe(1820); // Snapped to right edge
        });

        it('should snap north edge during resize', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 200, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Resizing north edge to 3 (close to 0)
            const result = snappingSystem.snapResize('el-1', 'n', 100, 3, 200, 97, 1);

            expect(result.y).toBe(0);
            expect(result.height).toBe(100); // Original 97 + 3
        });

        it('should snap south edge during resize', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 200, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Resizing south edge to 1077 (close to 1080)
            const result = snappingSystem.snapResize('el-1', 's', 100, 100, 200, 977, 1);

            expect(result.height).toBe(980); // Snapped to bottom edge
        });

        it('should snap corner handles for both axes', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {}
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Resizing NW corner to (3, 3)
            const result = snappingSystem.snapResize('el-1', 'nw', 3, 3, 197, 97, 1);

            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
        });

        it('should not snap rotated elements', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 200, height: 100, rotation: 45 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            const result = snappingSystem.snapResize('el-1', 'w', 3, 100, 197, 100, 1);

            // Rotated elements should not snap
            expect(result.x).toBe(3);
            expect(result.guides).toEqual([]);
        });

        it('should snap to other element edges', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 200, height: 100, rotation: 0 },
                    'other': { id: 'other', x: 400, y: 100, width: 100, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Resizing east edge to 397 (close to other's left at 400)
            const result = snappingSystem.snapResize('el-1', 'e', 100, 100, 297, 100, 1);

            expect(result.width).toBe(300);
            expect(result.guides.some(g => g.type === 'v' && g.x === 400)).toBe(true);
        });
    });

    describe('checkSpacingGuides()', () => {
        it('should return original position when few elements', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {}
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            const result = snappingSystem.checkSpacingGuides('el-1', 100, 100, 50, 50, 1);

            expect(result.x).toBe(100);
            expect(result.y).toBe(100);
            expect(result.guides).toEqual([]);
        });

        it('should detect equal horizontal spacing between three elements', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {
                    'left': { id: 'left', x: 100, y: 100, width: 100, height: 100, rotation: 0 },
                    'right': { id: 'right', x: 400, y: 100, width: 100, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Place element in middle with equal gaps
            // Left ends at 200, right starts at 400
            // Equal gaps would be: (400 - 200 - 50) / 2 = 75
            // So element should be at 200 + 75 = 275
            const result = snappingSystem.checkSpacingGuides('el-1', 273, 100, 50, 100, 1);

            expect(result.x).toBe(275);
            expect(result.guides.length).toBeGreaterThan(0);
        });

        it('should detect equal vertical spacing between three elements', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {
                    'top': { id: 'top', x: 100, y: 100, width: 100, height: 100, rotation: 0 },
                    'bottom': { id: 'bottom', x: 100, y: 400, width: 100, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Place element in middle with equal gaps
            const result = snappingSystem.checkSpacingGuides('el-1', 100, 273, 100, 50, 1);

            expect(result.y).toBe(275);
        });

        it('should only consider overlapping elements for spacing', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {
                    'left': { id: 'left', x: 100, y: 100, width: 100, height: 100, rotation: 0 },
                    'right': { id: 'right', x: 400, y: 500, width: 100, height: 100, rotation: 0 } // Different Y
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // These don't overlap vertically, so no horizontal spacing snap
            const result = snappingSystem.checkSpacingGuides('el-1', 250, 100, 50, 100, 1);

            // Should not snap because elements don't overlap in Y
            expect(result.guides).toEqual([]);
        });

        it('should match spacing with adjacent pairs', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {
                    'el-a': { id: 'el-a', x: 100, y: 100, width: 100, height: 100, rotation: 0 },
                    'el-b': { id: 'el-b', x: 250, y: 100, width: 100, height: 100, rotation: 0 }
                    // Gap between a and b is 50px
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            // Place new element 50px from el-b (matching the gap)
            const result = snappingSystem.checkSpacingGuides('el-1', 398, 100, 100, 100, 1);

            // Should snap to 400 (50px gap from el-b's right edge at 350)
            expect(result.x).toBe(400);
        });
    });

    describe('updateMeasurementGuides()', () => {
        it('should clear guides when no element selected', () => {
            mockState.editor.selectedElementIds = [];

            snappingSystem.updateMeasurementGuides(100, 100);

            expect(mockCanvasManager.measurementGuides).toBeNull();
        });

        it('should clear guides when multiple elements selected', () => {
            mockState.editor.selectedElementIds = ['el-1', 'el-2'];

            snappingSystem.updateMeasurementGuides(100, 100);

            expect(mockCanvasManager.measurementGuides).toBeNull();
        });

        it('should clear guides when not hovering over another element', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 100, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            mockCanvasManager.hitTesting.hitTest.mockReturnValue(null);
            mockState.editor.selectedElementIds = ['el-1'];

            snappingSystem.updateMeasurementGuides(500, 500);

            expect(mockCanvasManager.measurementGuides).toBeNull();
        });

        it('should clear guides when hovering over same element', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 100, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            mockCanvasManager.hitTesting.hitTest.mockReturnValue({ type: 'element', id: 'el-1' });
            mockState.editor.selectedElementIds = ['el-1'];

            snappingSystem.updateMeasurementGuides(150, 150);

            expect(mockCanvasManager.measurementGuides).toBeNull();
        });

        it('should show vertical distance when elements are stacked', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 100, height: 100, rotation: 0 },
                    'el-2': { id: 'el-2', x: 100, y: 250, width: 100, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            mockCanvasManager.hitTesting.hitTest.mockReturnValue({ type: 'element', id: 'el-2' });
            mockState.editor.selectedElementIds = ['el-1'];

            snappingSystem.updateMeasurementGuides(150, 300);

            expect(mockCanvasManager.measurementGuides).not.toBeNull();
            expect(mockCanvasManager.measurementGuides.length).toBeGreaterThan(0);
            
            const guide = mockCanvasManager.measurementGuides[0];
            expect(guide.label).toBe('50'); // Distance from 200 to 250
        });

        it('should show horizontal distance when elements are side by side', () => {
            const mockSlide = {
                elements: {
                    'el-1': { id: 'el-1', x: 100, y: 100, width: 100, height: 100, rotation: 0 },
                    'el-2': { id: 'el-2', x: 250, y: 100, width: 100, height: 100, rotation: 0 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            mockCanvasManager.hitTesting.hitTest.mockReturnValue({ type: 'element', id: 'el-2' });
            mockState.editor.selectedElementIds = ['el-1'];

            snappingSystem.updateMeasurementGuides(300, 150);

            expect(mockCanvasManager.measurementGuides).not.toBeNull();
            
            const guide = mockCanvasManager.measurementGuides[0];
            expect(guide.label).toBe('50'); // Distance from 200 to 250
        });
    });

    describe('Edge cases', () => {
        it('should handle inherited elements in layout mode', () => {
            mockState.editor.mode = 'master';
            mockState.masters = {
                'master-1': {
                    elements: {
                        'master-el': { id: 'master-el', x: 100, y: 100, width: 100, height: 100, rotation: 0 }
                    }
                }
            };

            const mockLayout = {
                type: 'layout',
                parentId: 'master-1',
                width: 1920,
                height: 1080,
                elements: {}
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockLayout);

            // Should consider master elements for snapping
            const result = snappingSystem.snapToGuides('el-1', 197, 100, 50, 50, 1);

            // Should snap to master element's right edge (200)
            expect(result.x).toBe(200);
        });

        it('should throw when slide is missing', () => {
            mockCanvasManager.getActiveContainer.mockReturnValue(null);

            // The implementation does not guard against null slide
            expect(() => {
                snappingSystem.snapToGuides('el-1', 100, 100, 50, 50, 1);
            }).toThrow();
        });

        it('should handle element without rotation property', () => {
            const mockSlide = {
                width: 1920,
                height: 1080,
                elements: {
                    'other': { id: 'other', x: 200, y: 200, width: 100, height: 100 }
                }
            };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            const result = snappingSystem.snapToGuides('el-1', 197, 200, 50, 50, 1);

            expect(result.x).toBe(200);
        });
    });
});
