/**
 * ThumbnailRenderer Unit Tests
 * 
 * Tests for the live SlideView-based thumbnail system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock store
vi.mock('../../../../src/core/Store.js', () => ({
    store: {
        getState: vi.fn(() => ({
            editor: {
                editingElementId: null
            }
        })),
        dispatch: vi.fn(),
        on: vi.fn(),
        getEffectiveSlide: vi.fn()
    }
}));

// Mock SlideView to avoid complex DOM operations in tests
vi.mock('../../../../src/core/renderer/SlideView.js', () => ({
    SlideView: vi.fn().mockImplementation((slideId) => ({
        slideId,
        domElement: document.createElement('div'),
        mount: vi.fn(function(container) {
            this.domElement.className = 'slide-view';
            container.appendChild(this.domElement);
            return this.domElement;
        }),
        update: vi.fn(),
        unmount: vi.fn(function() {
            if (this.domElement.parentNode) {
                this.domElement.parentNode.removeChild(this.domElement);
            }
        })
    }))
}));

// Import after mocking
const { ThumbnailRenderer } = await import('../../../../src/core/renderer/ThumbnailRenderer.js');

describe('ThumbnailRenderer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        ThumbnailRenderer.destroyAll();
    });

    afterEach(() => {
        ThumbnailRenderer.destroyAll();
    });

    describe('createThumbnail', () => {
        it('should create a thumbnail container element', () => {
            const slideData = {
                id: 'slide-1',
                width: 1920,
                height: 1080,
                background: { type: 'solid', value: '#ffffff' },
                elements: {},
                elementOrder: []
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);

            expect(thumbnail).toBeInstanceOf(HTMLElement);
            expect(thumbnail.className).toBe('slide-thumbnail-preview');
        });

        it('should create a scale wrapper for the SlideView', () => {
            const slideData = {
                id: 'slide-1',
                width: 1920,
                height: 1080,
                elements: {},
                elementOrder: []
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const scaleWrapper = thumbnail.querySelector('.thumbnail-scale-wrapper');

            expect(scaleWrapper).not.toBeNull();
            // Scale is applied async (requestAnimationFrame) and depends on layout (offsetWidth).
            // In jsdom tests, offsetWidth is 0 unless attached to the DOM.
            expect(scaleWrapper.style.transformOrigin).toContain('top');
        });

        it('should contain a SlideView element', () => {
            const slideData = {
                id: 'slide-1',
                width: 1920,
                height: 1080,
                elements: {},
                elementOrder: []
            };

            const thumbnail = ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const slideView = thumbnail.querySelector('.slide-view');

            expect(slideView).not.toBeNull();
        });

        it('should store instance for reuse', () => {
            const slideData = {
                id: 'slide-1',
                width: 1920,
                height: 1080,
                elements: {},
                elementOrder: []
            };

            ThumbnailRenderer.createThumbnail('slide-1', slideData);
            
            expect(ThumbnailRenderer.instances.has('slide-1')).toBe(true);
        });

        it('should reuse existing SlideView instance', () => {
            const slideData1 = {
                id: 'slide-1',
                width: 1920,
                height: 1080,
                elements: {},
                elementOrder: []
            };

            const slideData2 = {
                id: 'slide-1',
                width: 1920,
                height: 1080,
                elements: { 'el-1': { id: 'el-1', type: 'rect' } },
                elementOrder: ['el-1']
            };

            ThumbnailRenderer.createThumbnail('slide-1', slideData1);
            const instance1 = ThumbnailRenderer.instances.get('slide-1');
            
            ThumbnailRenderer.createThumbnail('slide-1', slideData2);
            const instance2 = ThumbnailRenderer.instances.get('slide-1');

            // Same instance should be reused
            expect(instance1.view).toBe(instance2.view);
            // Update should have been called
            expect(instance1.view.update).toHaveBeenCalledTimes(2);
        });
    });

    describe('updateThumbnail', () => {
        it('should update existing thumbnail', () => {
            const slideData = {
                id: 'slide-1',
                width: 1920,
                height: 1080,
                elements: {},
                elementOrder: []
            };

            ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const instance = ThumbnailRenderer.instances.get('slide-1');
            
            const newSlideData = { ...slideData, background: { type: 'solid', value: '#ff0000' } };
            ThumbnailRenderer.updateThumbnail('slide-1', newSlideData);

            expect(instance.view.update).toHaveBeenCalledWith(newSlideData);
        });

        it('should do nothing for non-existent thumbnail', () => {
            // Should not throw
            expect(() => {
                ThumbnailRenderer.updateThumbnail('non-existent', {});
            }).not.toThrow();
        });
    });

    describe('destroyThumbnail', () => {
        it('should unmount and remove instance', () => {
            const slideData = {
                id: 'slide-1',
                width: 1920,
                height: 1080,
                elements: {},
                elementOrder: []
            };

            ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const instance = ThumbnailRenderer.instances.get('slide-1');
            
            ThumbnailRenderer.destroyThumbnail('slide-1');

            expect(instance.view.unmount).toHaveBeenCalled();
            expect(ThumbnailRenderer.instances.has('slide-1')).toBe(false);
        });
    });

    describe('invalidate', () => {
        it('should debounce updates', async () => {
            vi.useFakeTimers();
            
            const { store } = await import('../../../../src/core/Store.js');
            store.getEffectiveSlide.mockReturnValue({
                id: 'slide-1',
                width: 1920,
                height: 1080,
                elements: {},
                elementOrder: []
            });

            const slideData = {
                id: 'slide-1',
                width: 1920,
                height: 1080,
                elements: {},
                elementOrder: []
            };

            ThumbnailRenderer.createThumbnail('slide-1', slideData);
            const instance = ThumbnailRenderer.instances.get('slide-1');
            const updateCount = instance.view.update.mock.calls.length;
            
            // Call invalidate multiple times rapidly
            ThumbnailRenderer.invalidate('slide-1');
            ThumbnailRenderer.invalidate('slide-1');
            ThumbnailRenderer.invalidate('slide-1');
            
            // Fast-forward past debounce
            vi.advanceTimersByTime(200);
            
            // Should only have one additional update call (debounced)
            expect(instance.view.update.mock.calls.length).toBe(updateCount + 1);
            
            vi.useRealTimers();
        });
    });

    describe('invalidateAll', () => {
        it('should invalidate all thumbnails', () => {
            vi.useFakeTimers();
            
            const slideData1 = { id: 'slide-1', width: 1920, height: 1080, elements: {}, elementOrder: [] };
            const slideData2 = { id: 'slide-2', width: 1920, height: 1080, elements: {}, elementOrder: [] };

            ThumbnailRenderer.createThumbnail('slide-1', slideData1);
            ThumbnailRenderer.createThumbnail('slide-2', slideData2);
            
            ThumbnailRenderer.invalidateAll();
            
            // Check that debounce timers were set
            expect(ThumbnailRenderer.updateTimers.size).toBe(2);
            
            vi.useRealTimers();
        });
    });

    describe('destroyAll', () => {
        it('should destroy all instances', () => {
            const slideData1 = { id: 'slide-1', width: 1920, height: 1080, elements: {}, elementOrder: [] };
            const slideData2 = { id: 'slide-2', width: 1920, height: 1080, elements: {}, elementOrder: [] };

            ThumbnailRenderer.createThumbnail('slide-1', slideData1);
            ThumbnailRenderer.createThumbnail('slide-2', slideData2);
            
            const instance1 = ThumbnailRenderer.instances.get('slide-1');
            const instance2 = ThumbnailRenderer.instances.get('slide-2');
            
            ThumbnailRenderer.destroyAll();

            expect(instance1.view.unmount).toHaveBeenCalled();
            expect(instance2.view.unmount).toHaveBeenCalled();
            expect(ThumbnailRenderer.instances.size).toBe(0);
        });
    });
});
