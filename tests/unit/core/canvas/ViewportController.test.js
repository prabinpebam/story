/**
 * ViewportController Unit Tests
 * 
 * Tests viewport transformations, zoom, pan, and fitting operations.
 * These tests mock the CanvasManager and Store dependencies.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock store module before importing ViewportController
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn(),
        dispatch: vi.fn()
    }
}));

import { ViewportController } from '../../../../src/core/canvas/ViewportController.js';
import { store } from '../../../../src/core/Store.js';

describe('ViewportController', () => {
    let viewportController;
    let mockCanvasManager;
    let mockState;

    beforeEach(() => {
        // Create mock canvas manager
        mockCanvasManager = {
            container: {
                getBoundingClientRect: vi.fn(() => ({
                    width: 1200,
                    height: 800
                }))
            },
            canvas: {
                width: 1200,
                height: 800,
                style: {}
            },
            viewport: {},
            contentLayer: { style: {} },
            backgroundLayer: { style: {} },
            getActiveContainer: vi.fn()
        };

        // Default state
        mockState = {
            editor: {
                mode: 'edit',
                zoom: 1,
                pan: { x: 0, y: 0 }
            }
        };

        store.getState.mockReturnValue(mockState);
        store.dispatch.mockClear();

        viewportController = new ViewportController(mockCanvasManager);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('fitToView()', () => {
        it('should calculate zoom to fit slide in container', () => {
            const mockSlide = { width: 1920, height: 1080 };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            viewportController.fitToView();

            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_VIEWPORT', expect.objectContaining({
                zoom: expect.any(Number),
                pan: expect.objectContaining({
                    x: expect.any(Number),
                    y: expect.any(Number)
                })
            }));
        });

        it('should use scaleX when width is constraining', () => {
            // Container: 1200x800, Slide: 1920x100 (very wide)
            const mockSlide = { width: 1920, height: 100 };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            viewportController.fitToView();

            const dispatchCall = store.dispatch.mock.calls[0];
            const viewport = dispatchCall[1];
            
            // Width is constraining: (1200 - 120) / 1920 ≈ 0.5625
            expect(viewport.zoom).toBeCloseTo((1200 - 120) / 1920, 2);
        });

        it('should use scaleY when height is constraining', () => {
            // Container: 1200x800, Slide: 100x1080 (very tall)
            const mockSlide = { width: 100, height: 1080 };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            viewportController.fitToView();

            const dispatchCall = store.dispatch.mock.calls[0];
            const viewport = dispatchCall[1];
            
            // Height is constraining: (800 - 120) / 1080 ≈ 0.63
            expect(viewport.zoom).toBeCloseTo((800 - 120) / 1080, 2);
        });

        it('should center slide in container', () => {
            const mockSlide = { width: 1920, height: 1080 };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            viewportController.fitToView();

            const dispatchCall = store.dispatch.mock.calls[0];
            const viewport = dispatchCall[1];
            
            // Pan should center the zoomed slide
            expect(viewport.pan.x).toBeGreaterThan(0);
            expect(viewport.pan.y).toBeGreaterThan(0);
        });

        it('should not dispatch if no active slide', () => {
            mockCanvasManager.getActiveContainer.mockReturnValue(null);

            viewportController.fitToView();

            expect(store.dispatch).not.toHaveBeenCalled();
        });

        it('should use default slide dimensions if not specified', () => {
            const mockSlide = {}; // No width/height
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            viewportController.fitToView();

            expect(store.dispatch).toHaveBeenCalled();
            // Should use 1920x1080 defaults
        });
    });

    describe('zoomIn()', () => {
        it('should increase zoom by 1.2x factor', () => {
            mockState.editor.zoom = 1;
            mockState.editor.pan = { x: 0, y: 0 };

            viewportController.zoomIn();

            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_VIEWPORT', expect.objectContaining({
                zoom: 1.2
            }));
        });

        it('should not exceed maximum zoom of 5.0', () => {
            mockState.editor.zoom = 4.5;
            mockState.editor.pan = { x: 0, y: 0 };

            viewportController.zoomIn();

            const dispatchCall = store.dispatch.mock.calls[0];
            const viewport = dispatchCall[1];
            
            expect(viewport.zoom).toBeLessThanOrEqual(5.0);
        });

        it('should zoom towards center of viewport', () => {
            mockState.editor.zoom = 1;
            mockState.editor.pan = { x: 100, y: 50 };

            viewportController.zoomIn();

            const dispatchCall = store.dispatch.mock.calls[0];
            const viewport = dispatchCall[1];
            
            // Pan should adjust to keep center point stable
            expect(viewport.pan).toBeDefined();
            expect(viewport.pan.x).not.toBe(100);
        });

        it('should chain multiple zoom operations', () => {
            mockState.editor.zoom = 1;
            mockState.editor.pan = { x: 0, y: 0 };

            viewportController.zoomIn();
            
            // Simulate state update
            mockState.editor.zoom = 1.2;
            
            viewportController.zoomIn();

            // Second call should be at 1.2 * 1.2 = 1.44
            const secondCall = store.dispatch.mock.calls[1];
            expect(secondCall[1].zoom).toBeCloseTo(1.44, 2);
        });
    });

    describe('zoomOut()', () => {
        it('should decrease zoom by 1.2x factor', () => {
            mockState.editor.zoom = 1.2;
            mockState.editor.pan = { x: 0, y: 0 };

            viewportController.zoomOut();

            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_VIEWPORT', expect.objectContaining({
                zoom: 1
            }));
        });

        it('should not go below minimum zoom of 0.1', () => {
            mockState.editor.zoom = 0.15;
            mockState.editor.pan = { x: 0, y: 0 };

            viewportController.zoomOut();

            const dispatchCall = store.dispatch.mock.calls[0];
            const viewport = dispatchCall[1];
            
            expect(viewport.zoom).toBeGreaterThanOrEqual(0.1);
        });

        it('should zoom towards center of viewport', () => {
            mockState.editor.zoom = 2;
            mockState.editor.pan = { x: 200, y: 100 };

            viewportController.zoomOut();

            const dispatchCall = store.dispatch.mock.calls[0];
            const viewport = dispatchCall[1];
            
            expect(viewport.pan).toBeDefined();
        });

        it('should handle zoom from 1.0', () => {
            mockState.editor.zoom = 1;
            mockState.editor.pan = { x: 0, y: 0 };

            viewportController.zoomOut();

            const dispatchCall = store.dispatch.mock.calls[0];
            const viewport = dispatchCall[1];
            
            expect(viewport.zoom).toBeCloseTo(1 / 1.2, 4);
        });
    });

    describe('resize()', () => {
        it('should update canvas dimensions', () => {
            mockCanvasManager.container.getBoundingClientRect.mockReturnValue({
                width: 1000,
                height: 600
            });

            viewportController.resize();

            expect(mockCanvasManager.canvas.width).toBe(1000);
            expect(mockCanvasManager.canvas.height).toBe(600);
        });

        it('should update canvas CSS styles', () => {
            mockCanvasManager.container.getBoundingClientRect.mockReturnValue({
                width: 1000,
                height: 600
            });

            viewportController.resize();

            expect(mockCanvasManager.canvas.style.width).toBe('1000px');
            expect(mockCanvasManager.canvas.style.height).toBe('600px');
        });

        it('should not resize in presentation mode', () => {
            mockState.editor.mode = 'presentation';
            mockCanvasManager.canvas.width = 500;
            mockCanvasManager.canvas.height = 400;

            viewportController.resize();

            // Canvas dimensions should not change
            expect(mockCanvasManager.canvas.width).toBe(500);
        });

        it('should handle missing container gracefully', () => {
            mockCanvasManager.container = null;

            expect(() => viewportController.resize()).not.toThrow();
        });

        it('should handle missing canvas gracefully', () => {
            mockCanvasManager.canvas = null;

            expect(() => viewportController.resize()).not.toThrow();
        });

        it('should refit when a fitted container changes size', () => {
            const mockSlide = { width: 1920, height: 1080 };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            viewportController.fitToView();
            const initialFit = store.dispatch.mock.calls.at(-1)[1];
            mockState.editor.zoom = initialFit.zoom;
            mockState.editor.pan = initialFit.pan;
            mockCanvasManager.container.getBoundingClientRect.mockReturnValue({ width: 800, height: 700 });
            store.dispatch.mockClear();

            viewportController.resize();

            expect(store.dispatch).toHaveBeenCalledWith('UPDATE_VIEWPORT', expect.objectContaining({
                zoom: expect.any(Number),
                pan: expect.any(Object)
            }));
        });

        it('should preserve a manually changed viewport on resize', () => {
            const mockSlide = { width: 1920, height: 1080 };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);
            viewportController.fitToView();
            mockState.editor.zoom = 1.5;
            mockState.editor.pan = { x: 20, y: 30 };
            mockCanvasManager.container.getBoundingClientRect.mockReturnValue({ width: 800, height: 700 });
            store.dispatch.mockClear();

            viewportController.resize();

            expect(store.dispatch).not.toHaveBeenCalled();
        });
    });

    describe('updateViewportTransform()', () => {
        it('should apply transform to content layer', () => {
            const transform = { pan: { x: 100, y: 50 }, zoom: 1.5 };
            const mockSlide = { width: 1920, height: 1080 };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            viewportController.updateViewportTransform(transform);

            expect(mockCanvasManager.contentLayer.style.transform)
                .toBe('translate(100px, 50px) scale(1.5)');
            expect(mockCanvasManager.contentLayer.style.transformOrigin).toBe('0 0');
        });

        it('should apply transform to background layer', () => {
            const transform = { pan: { x: 100, y: 50 }, zoom: 1.5 };
            const mockSlide = { width: 1920, height: 1080 };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            viewportController.updateViewportTransform(transform);

            expect(mockCanvasManager.backgroundLayer.style.transform)
                .toBe('translate(100px, 50px) scale(1.5)');
        });

        it('should set layer dimensions from slide', () => {
            const transform = { pan: { x: 0, y: 0 }, zoom: 1 };
            const mockSlide = { width: 1920, height: 1080 };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            viewportController.updateViewportTransform(transform);

            expect(mockCanvasManager.contentLayer.style.width).toBe('1920px');
            expect(mockCanvasManager.contentLayer.style.height).toBe('1080px');
        });

        it('should not update in presentation mode', () => {
            mockState.editor.mode = 'presentation';
            const transform = { pan: { x: 100, y: 50 }, zoom: 1.5 };

            viewportController.updateViewportTransform(transform);

            expect(mockCanvasManager.contentLayer.style.transform).toBeUndefined();
        });

        it('should update zoom display element if exists', () => {
            const mockZoomDisplay = { textContent: '' };
            document.getElementById = vi.fn().mockReturnValue(mockZoomDisplay);
            
            const transform = { pan: { x: 0, y: 0 }, zoom: 0.75 };
            const mockSlide = { width: 1920, height: 1080 };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            viewportController.updateViewportTransform(transform);

            expect(mockZoomDisplay.textContent).toBe('75%');
        });

        it('should handle missing zoom display element', () => {
            document.getElementById = vi.fn().mockReturnValue(null);
            
            const transform = { pan: { x: 0, y: 0 }, zoom: 1 };
            const mockSlide = { width: 1920, height: 1080 };
            mockCanvasManager.getActiveContainer.mockReturnValue(mockSlide);

            expect(() => viewportController.updateViewportTransform(transform))
                .not.toThrow();
        });
    });

    describe('Zoom calculations', () => {
        it('should calculate correct world point during zoom', () => {
            // When zooming at 2x with pan at (100, 50), clicking at center (600, 400)
            // World point = (600 - 100) / 2 = 250, (400 - 50) / 2 = 175
            mockState.editor.zoom = 2;
            mockState.editor.pan = { x: 100, y: 50 };

            viewportController.zoomIn();

            const viewport = store.dispatch.mock.calls[0][1];
            // New zoom should be 2.4, and pan should adjust to keep center stable
            expect(viewport.zoom).toBeCloseTo(2.4, 1);
        });

        it('should maintain zoom bounds at edges', () => {
            // Test at max zoom
            mockState.editor.zoom = 5.0;
            mockState.editor.pan = { x: 0, y: 0 };

            viewportController.zoomIn();

            const viewport1 = store.dispatch.mock.calls[0][1];
            expect(viewport1.zoom).toBe(5.0);

            // Test at min zoom
            store.dispatch.mockClear();
            mockState.editor.zoom = 0.1;

            viewportController.zoomOut();

            const viewport2 = store.dispatch.mock.calls[0][1];
            expect(viewport2.zoom).toBe(0.1);
        });
    });
});
