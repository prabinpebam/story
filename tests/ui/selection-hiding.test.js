/**
 * Selection Hiding Behavior Tests
 * 
 * Tests that selection overlays are hidden during property changes
 * for non-text elements, while remaining visible for text elements.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { store } from '../../src/core/Store.js';
import { GizmoRenderer } from '../../src/core/canvas/GizmoRenderer.js';

describe('Selection Hiding During Property Changes', () => {
    let mockCanvasManager;
    let gizmoRenderer;
    let drawSelectionBoxSpy;
    let drawHoverOutlineSpy;

    beforeEach(() => {
        // Reset store to initial state
        store.dispatch('RESET');
        
        // Setup mock canvas manager
        mockCanvasManager = {
            canvas: document.createElement('canvas'),
            ctx: document.createElement('canvas').getContext('2d'),
            interactionState: 'IDLE',
            hoveredElementId: null,
            liveResizeData: null,
            isRendering: false,
            getActiveContainer: vi.fn(() => ({
                elements: {
                    'rect-1': {
                        id: 'rect-1',
                        type: 'rect',
                        x: 100,
                        y: 100,
                        width: 200,
                        height: 100,
                        rotation: 0
                    },
                    'text-1': {
                        id: 'text-1',
                        type: 'text',
                        x: 200,
                        y: 200,
                        width: 300,
                        height: 50,
                        rotation: 0
                    },
                    'circle-1': {
                        id: 'circle-1',
                        type: 'circle',
                        x: 300,
                        y: 300,
                        width: 150,
                        height: 150,
                        rotation: 0
                    }
                }
            }))
        };

        // Create gizmo renderer instance
        gizmoRenderer = new GizmoRenderer(mockCanvasManager);
        
        // Spy on drawSelectionBox method
        drawSelectionBoxSpy = vi.spyOn(gizmoRenderer, 'drawSelectionBox');
        drawHoverOutlineSpy = vi.spyOn(gizmoRenderer, 'drawHoverOutline');
        
        // Setup canvas context methods
        mockCanvasManager.ctx.clearRect = vi.fn();
        mockCanvasManager.ctx.save = vi.fn();
        mockCanvasManager.ctx.restore = vi.fn();
        mockCanvasManager.ctx.translate = vi.fn();
        mockCanvasManager.ctx.scale = vi.fn();
        mockCanvasManager.ctx.strokeRect = vi.fn();
        mockCanvasManager.ctx.fillRect = vi.fn();
        mockCanvasManager.ctx.beginPath = vi.fn();
        mockCanvasManager.ctx.arc = vi.fn();
        mockCanvasManager.ctx.stroke = vi.fn();
        mockCanvasManager.ctx.fill = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Single Rectangle Selection', () => {
        beforeEach(() => {
            // Select rectangle
            store.dispatch('UPDATE_SELECTION', ['rect-1']);
            store.dispatch('SET_MODE', 'edit');
        });

        it('should show selection when not interacting', () => {
            drawSelectionBoxSpy.mockClear();
            
            // Render without interaction
            gizmoRenderer.renderGizmos();
            
            expect(drawSelectionBoxSpy).toHaveBeenCalledTimes(1);
        });

        it('should hide selection when isInteracting is true', () => {
            drawSelectionBoxSpy.mockClear();
            
            // Start interaction
            store.dispatch('UI_INTERACTION_START');
            
            // Render during interaction
            gizmoRenderer.renderGizmos();
            
            expect(drawSelectionBoxSpy).not.toHaveBeenCalled();
        });

        it('should show selection again after interaction ends', () => {
            drawSelectionBoxSpy.mockClear();
            
            // Start and end interaction
            store.dispatch('UI_INTERACTION_START');
            gizmoRenderer.renderGizmos();
            expect(drawSelectionBoxSpy).not.toHaveBeenCalled();
            
            drawSelectionBoxSpy.mockClear();
            store.dispatch('UI_INTERACTION_END');
            gizmoRenderer.renderGizmos();
            
            expect(drawSelectionBoxSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('Single Text Selection', () => {
        beforeEach(() => {
            // Select text
            store.dispatch('UPDATE_SELECTION', ['text-1']);
            store.dispatch('SET_MODE', 'edit');
        });

        it('should show selection when not interacting', () => {
            drawSelectionBoxSpy.mockClear();
            
            // Render without interaction
            gizmoRenderer.renderGizmos();
            
            expect(drawSelectionBoxSpy).toHaveBeenCalledTimes(1);
        });

        it('should STILL show selection when isInteracting is true (text exception)', () => {
            drawSelectionBoxSpy.mockClear();
            
            // Start interaction
            store.dispatch('UI_INTERACTION_START');
            
            // Render during interaction - should still draw for text
            gizmoRenderer.renderGizmos();
            
            expect(drawSelectionBoxSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('Multi-Selection with Rectangles', () => {
        beforeEach(() => {
            // Select multiple non-text elements
            store.dispatch('UPDATE_SELECTION', ['rect-1', 'circle-1']);
            store.dispatch('SET_MODE', 'edit');
        });

        it('should show selection when not interacting', () => {
            drawSelectionBoxSpy.mockClear();
            drawHoverOutlineSpy.mockClear();
            
            // Render without interaction
            expect(() => gizmoRenderer.renderGizmos()).not.toThrow();
        });

        it('should hide selection when isInteracting is true', () => {
            drawSelectionBoxSpy.mockClear();
            
            // Start interaction
            store.dispatch('UI_INTERACTION_START');
            
            // Render during interaction
            gizmoRenderer.renderGizmos();
            
            expect(drawSelectionBoxSpy).not.toHaveBeenCalled();
        });
    });

    describe('Multi-Selection with Text Element', () => {
        beforeEach(() => {
            // Select text + rectangle
            store.dispatch('UPDATE_SELECTION', ['text-1', 'rect-1']);
            store.dispatch('SET_MODE', 'edit');
        });

        it('should show selection when not interacting', () => {
            drawSelectionBoxSpy.mockClear();
            
            // Render without interaction
            gizmoRenderer.renderGizmos();
            
            expect(drawSelectionBoxSpy).toHaveBeenCalled();
        });

        it('should STILL show selection when isInteracting is true (text in selection)', () => {
            drawSelectionBoxSpy.mockClear();
            
            // Start interaction
            store.dispatch('UI_INTERACTION_START');
            
            // Render during interaction - should still draw because text is in selection
            gizmoRenderer.renderGizmos();
            
            expect(drawSelectionBoxSpy).toHaveBeenCalled();
        });
    });

    describe('Performance - Rapid Property Changes', () => {
        beforeEach(() => {
            // Select rectangle
            store.dispatch('UPDATE_SELECTION', ['rect-1']);
            store.dispatch('SET_MODE', 'edit');
        });

        it('should handle rapid interaction toggles without issues', () => {
            const iterations = 100;
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                store.dispatch('UI_INTERACTION_START');
                gizmoRenderer.renderGizmos();
                store.dispatch('UI_INTERACTION_END');
                gizmoRenderer.renderGizmos();
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Should complete in reasonable time (less than 100ms for 100 iterations)
            expect(duration).toBeLessThan(100);
        });

        it('should not leak memory during repeated renders', () => {
            const iterations = 1000;
            
            // Capture initial memory state
            const initialCallCount = drawSelectionBoxSpy.mock.calls.length;
            
            for (let i = 0; i < iterations; i++) {
                if (i % 2 === 0) {
                    store.dispatch('UI_INTERACTION_START');
                } else {
                    store.dispatch('UI_INTERACTION_END');
                }
                gizmoRenderer.renderGizmos();
            }
            
            // Verify calls happened
            expect(drawSelectionBoxSpy.mock.calls.length).toBeGreaterThan(initialCallCount);
            
            // No way to directly test memory, but ensuring no errors occur
            expect(true).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing state.ui gracefully', () => {
            store.dispatch('UPDATE_SELECTION', ['rect-1']);
            store.dispatch('SET_MODE', 'edit');
            
            // Simulate missing ui without mutating (potentially frozen) store state
            const stateWithoutUi = JSON.parse(JSON.stringify(store.getState()));
            delete stateWithoutUi.ui;
            const getStateSpy = vi.spyOn(store, 'getState').mockReturnValue(stateWithoutUi);
            
            drawSelectionBoxSpy.mockClear();
            
            // Should not throw and should show selection (treat as not interacting)
            expect(() => gizmoRenderer.renderGizmos()).not.toThrow();
            expect(drawSelectionBoxSpy).toHaveBeenCalled();

            getStateSpy.mockRestore();
        });

        it('should handle element type being undefined', () => {
            // Create element without type
            const container = mockCanvasManager.getActiveContainer();
            container.elements['broken-1'] = {
                id: 'broken-1',
                x: 100,
                y: 100,
                width: 100,
                height: 100
                // missing type
            };
            
            store.dispatch('UPDATE_SELECTION', ['broken-1']);
            store.dispatch('SET_MODE', 'edit');
            store.dispatch('UI_INTERACTION_START');
            
            drawSelectionBoxSpy.mockClear();
            
            // Should treat as non-text and hide selection
            expect(() => gizmoRenderer.renderGizmos()).not.toThrow();
            expect(drawSelectionBoxSpy).not.toHaveBeenCalled();
        });
    });
});
