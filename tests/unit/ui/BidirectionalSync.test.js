/**
 * @fileoverview Bidirectional Sync Tests for Property Inspector
 * 
 * Test ID Prefix: SYNC
 * Spec Reference: documentation/01-specs/ui-system/property-inspector-v2/01-architecture.md
 * 
 * These tests verify that:
 * 1. PI input changes update the store (and thus viewport)
 * 2. Viewport changes (via store) update PI inputs
 * 3. Transient updates (scrubbing) don't fight with inputs
 * 4. Undo/redo maintains sync between PI and viewport
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Setup mocks BEFORE imports (vi.mock is hoisted)
vi.mock('../../../src/core/Store.js', () => {
    const listeners = {};
    return {
        store: {
            getState: vi.fn(),
            dispatch: vi.fn(),
            on: vi.fn((event, cb) => {
                if (!listeners[event]) listeners[event] = [];
                listeners[event].push(cb);
            }),
            off: vi.fn(),
            _listeners: listeners,
            emit(event, data) {
                const cbs = listeners[event] || [];
                cbs.forEach(fn => fn(data));
            }
        }
    };
});

// Mock AI service
vi.mock('../../../src/core/ai/AIService.js', () => ({
    aiService: {
        generateImage: vi.fn()
    }
}));

// Import after mocks
import { PropertyInspector } from '../../../src/ui/PropertyInspector.js';
import { store } from '../../../src/core/Store.js';

describe('Bidirectional Sync', () => {
    let propertyInspector;
    let container;
    let renderSpy;

    function createMockState(overrides = {}) {
        return {
            editor: {
                mode: 'edit',
                activeSlideId: 'slide-1',
                selectedElementIds: ['element-1'],
                ...overrides.editor
            },
            slides: {
                'slide-1': {
                    id: 'slide-1',
                    elements: {
                        'element-1': {
                            id: 'element-1',
                            type: 'rect',
                            x: 100,
                            y: 100,
                            width: 200,
                            height: 150,
                            rotation: 0,
                            opacity: 1,
                            blendMode: 'normal',
                            borderRadius: 0,
                            fills: [{ type: 'solid', color: '#FF0000', visible: true }],
                            strokes: [],
                            effects: [],
                            ...overrides.element
                        }
                    }
                }
            },
            slideMasterPresets: {},
            ui: {
                isInteracting: false,
                ...overrides.ui
            }
        };
    }

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Reset listeners by clearing the arrays
        Object.keys(store._listeners).forEach(key => {
            store._listeners[key] = [];
        });

        // Create container
        container = document.createElement('div');
        container.id = 'property-inspector-container';
        document.body.appendChild(container);

        // Default state
        store.getState.mockReturnValue(createMockState());

        // Create PI
        propertyInspector = new PropertyInspector('property-inspector-container');
        renderSpy = vi.spyOn(propertyInspector, 'render');
    });

    afterEach(() => {
        // Clean up listeners before destroying DOM
        Object.keys(store._listeners).forEach(key => {
            store._listeners[key] = [];
        });
        
        // Clean up DOM
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        container = null;
        propertyInspector = null;
        
        vi.restoreAllMocks();
    });

    describe('PI → Store → Viewport Flow (SYNC-01 to SYNC-03)', () => {
        it('SYNC-01: PI input changes should dispatch UPDATE_ELEMENT', () => {
            // Simulate position section updating X
            const state = store.getState();
            propertyInspector.positionSection.updateProperty('x', 200);

            expect(store.dispatch).toHaveBeenCalledWith(
                'UPDATE_ELEMENT',
                expect.objectContaining({ id: 'element-1', x: 200 }),
                expect.anything()
            );
        });

        it('SYNC-02: PI scrubbing dispatches transient updates', () => {
            // Simulate scrubbing opacity
            propertyInspector.appearanceSection.updateProperty('opacity', 0.5, true);

            expect(store.dispatch).toHaveBeenCalledWith(
                'UPDATE_ELEMENT',
                expect.objectContaining({ id: 'element-1', opacity: 0.5 }),
                { skipHistory: true }
            );
        });

        it('SYNC-03: PI dropdown changes dispatch immediately', () => {
            propertyInspector.appearanceSection.updateProperty('blendMode', 'multiply');

            expect(store.dispatch).toHaveBeenCalledWith(
                'UPDATE_ELEMENT',
                expect.objectContaining({ id: 'element-1', blendMode: 'multiply' }),
                expect.anything()
            );
        });
    });

    describe('Viewport → Store → PI Flow (SYNC-10 to SYNC-13)', () => {
        it('SYNC-10: State changes trigger PI re-render', () => {
            renderSpy.mockClear();
            
            // Simulate state change from viewport
            const newState = createMockState({ element: { x: 200, y: 200 } });
            store.getState.mockReturnValue(newState);
            
            // Emit state-changed event
            store.emit('state-changed', newState);

            expect(renderSpy).toHaveBeenCalled();
        });

        it('SYNC-11: Selection changes trigger PI re-render', () => {
            renderSpy.mockClear();
            
            // Emit selection-changed event
            store.emit('selection-changed');

            expect(renderSpy).toHaveBeenCalled();
        });
    });

    describe('Transient Updates (SYNC-20 to SYNC-23)', () => {
        it('SYNC-20: Scrubbing uses skipHistory flag', () => {
            // First dispatch (transient)
            propertyInspector.positionSection.updateProperty('x', 150, true);
            
            expect(store.dispatch).toHaveBeenCalledWith(
                'UPDATE_ELEMENT',
                expect.anything(),
                { skipHistory: true }
            );
        });

        it('SYNC-21: PI skips re-render during interaction', () => {
            renderSpy.mockClear();
            
            // State with isInteracting = true
            const interactingState = createMockState({ ui: { isInteracting: true } });
            store.getState.mockReturnValue(interactingState);
            
            // Emit state-changed during interaction
            store.emit('state-changed', interactingState);

            // PI should NOT re-render
            expect(renderSpy).not.toHaveBeenCalled();
        });

        it('SYNC-22: PI re-renders after interaction ends', () => {
            renderSpy.mockClear();
            
            // Simulate interaction ending
            const normalState = createMockState({ ui: { isInteracting: false } });
            store.getState.mockReturnValue(normalState);
            
            // Emit state-changed after interaction
            store.emit('state-changed', normalState);

            expect(renderSpy).toHaveBeenCalled();
        });

        it('SYNC-23: Final value dispatches without skipHistory', () => {
            // Commit final value
            propertyInspector.positionSection.updateProperty('x', 200, false);

            expect(store.dispatch).toHaveBeenCalledWith(
                'UPDATE_ELEMENT',
                expect.anything(),
                { skipHistory: false }
            );
        });
    });

    describe('Multi-Select Sync (SYNC-40 to SYNC-43)', () => {
        it('SYNC-42: Changes apply to all selected elements', () => {
            // Setup multi-selection
            const multiState = createMockState({
                editor: { selectedElementIds: ['el-1', 'el-2', 'el-3'] }
            });
            multiState.slides['slide-1'].elements['el-1'] = { id: 'el-1', type: 'rect', x: 100 };
            multiState.slides['slide-1'].elements['el-2'] = { id: 'el-2', type: 'rect', x: 200 };
            multiState.slides['slide-1'].elements['el-3'] = { id: 'el-3', type: 'rect', x: 300 };
            
            store.getState.mockReturnValue(multiState);

            // Ensure sections pick up the new multi-selection from store
            propertyInspector.render();
            
            // Update property
            propertyInspector.positionSection.updateProperty('x', 500);

            // Should dispatch for each selected element
            expect(store.dispatch).toHaveBeenCalledTimes(3);
            expect(store.dispatch).toHaveBeenCalledWith(
                'UPDATE_ELEMENT',
                expect.objectContaining({ id: 'el-1', x: 500 }),
                { skipHistory: false }
            );
            expect(store.dispatch).toHaveBeenCalledWith(
                'UPDATE_ELEMENT',
                // Multi-select X/Y uses bounding-box top-left and applies a delta to move the
                // selection together (Figma behavior), rather than collapsing to one X.
                expect.objectContaining({ id: 'el-2', x: 600 }),
                { skipHistory: false }
            );
            expect(store.dispatch).toHaveBeenCalledWith(
                'UPDATE_ELEMENT',
                expect.objectContaining({ id: 'el-3', x: 700 }),
                { skipHistory: false }
            );
        });
    });

    describe('Store Subscription Lifecycle', () => {
        it('should subscribe to state-changed on init', () => {
            expect(store.on).toHaveBeenCalledWith('state-changed', expect.any(Function));
        });

        it('should subscribe to selection-changed on init', () => {
            expect(store.on).toHaveBeenCalledWith('selection-changed', expect.any(Function));
        });

        it('should handle missing ui state gracefully', () => {
            renderSpy.mockClear();
            
            // State without ui property
            const stateWithoutUi = createMockState();
            delete stateWithoutUi.ui;
            store.getState.mockReturnValue(stateWithoutUi);
            
            // Should not throw
            expect(() => {
                store.emit('state-changed', stateWithoutUi);
            }).not.toThrow();
            
            // Should still render
            expect(renderSpy).toHaveBeenCalled();
        });
    });

    describe('Element Resolution', () => {
        it('should resolve element from current slide in edit mode', () => {
            const state = store.getState();
            const element = propertyInspector.getElement(state, 'element-1');
            
            expect(element).toBeDefined();
            expect(element.id).toBe('element-1');
        });

        it('should resolve element from master in master mode', () => {
            const masterState = createMockState({
                editor: { mode: 'master', activeMasterId: 'master-1' }
            });
            masterState.slideMasterPresets = {
                'master-1': {
                    elements: {
                        'master-el': { id: 'master-el', type: 'rect' }
                    }
                }
            };
            store.getState.mockReturnValue(masterState);
            
            const element = propertyInspector.getElement(masterState, 'master-el');
            
            expect(element).toBeDefined();
            expect(element.id).toBe('master-el');
        });
    });
});
