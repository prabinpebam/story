/**
 * Store Unit Tests
 * 
 * Tests the central state management Store including dispatch, state changes,
 * history integration, and event emission.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { store } from '../../../src/core/Store.js';
import { createInitialState } from '../../../src/core/store/InitialState.js';

describe('Store', () => {
    // Store the original state to restore after tests
    let originalState;

    beforeEach(() => {
        vi.clearAllMocks();
        // Save original state
        originalState = store.getState();
        // Reset to initial state for each test using restoreState
        store.restoreState(createInitialState());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should keep legacy SET_MODE dispatches out of production callers', () => {
            const srcRoot = path.join(process.cwd(), 'src');
            const files = [];
            const visit = (directory) => {
                for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
                    const filePath = path.join(directory, entry.name);
                    if (entry.isDirectory()) {
                        if (entry.name !== 'vendor') visit(filePath);
                    } else if (entry.name.endsWith('.js')) {
                        files.push(filePath);
                    }
                }
            };
            visit(srcRoot);

            const offenders = files.filter((filePath) => /dispatch\(\s*['"]SET_MODE['"]/.test(fs.readFileSync(filePath, 'utf8')));
            expect(offenders).toEqual([]);
        });

        it('should have initial state defined', () => {
            const state = store.getState();
            expect(state).toBeDefined();
            expect(state.slides).toBeDefined();
            expect(state.editor).toBeDefined();
            expect(state.slideMasterPresets).toBeDefined();
        });

        it('should have default editor settings', () => {
            const state = store.getState();
            expect(state.editor.mode).toBe('edit');
            expect(state.editor.activeTool).toBe('select');
            expect(state.editor.zoom).toBe(1);
        });

        it('should initialize orthogonal authoring context axes', () => {
            expect(store.getState().context).toEqual({
                productSpace: 'Authoring',
                view: 'Canvas',
                editScope: 'Slide',
                runtimeMode: null,
                surfaceRole: 'Editor',
                placement: null,
                authoringSnapshot: null
            });
        });

        it('should have default presentation settings', () => {
            const state = store.getState();
            expect(state.presentation.isActive).toBe(false);
            expect(state.presentation.currentSlideIndex).toBe(0);
        });

        it('should have at least one slide', () => {
            const state = store.getState();
            expect(state.slideOrder.length).toBeGreaterThan(0);
            expect(Object.keys(state.slides).length).toBeGreaterThan(0);
        });

        it('should have default masters defined', () => {
            const state = store.getState();
            expect(state.slideMasterPresets['master-default']).toBeDefined();
            expect(state.slideMasterPresets['layout-blank']).toBeDefined();
        });
    });

    describe('getState()', () => {
        it('should return current state', () => {
            const state = store.getState();
            expect(state).toBeDefined();
            expect(typeof state).toBe('object');
        });

        it('should return a shallow copy of state', () => {
            const state1 = store.getState();
            const state2 = store.getState();
            // getState returns { ...this.state } so it's a new object each time
            expect(state1).not.toBe(state2);
            expect(state1.slides).toBe(state2.slides); // Same reference for nested objects
        });
    });

    describe('restoreState()', () => {
        it('should restore a new state', () => {
            const newState = createInitialState();
            newState.meta.title = 'Custom Title';
            
            store.restoreState(newState);
            
            expect(store.getState().meta.title).toBe('Custom Title');
        });

        it('should emit state-changed event after restoring', () => {
            const listener = vi.fn();
            store.on('state-changed', listener);
            
            store.restoreState(createInitialState());
            
            expect(listener).toHaveBeenCalled();
            
            store.off('state-changed', listener);
        });

        it('should emit STATE_RESTORED event after restoring', () => {
            const listener = vi.fn();
            store.on('STATE_RESTORED', listener);
            
            store.restoreState(createInitialState());
            
            expect(listener).toHaveBeenCalled();
            
            store.off('STATE_RESTORED', listener);
        });
    });

    describe('dispatch() - Editor Actions', () => {
        it('should dispatch SET_ACTIVE_TOOL', () => {
            store.dispatch('SET_ACTIVE_TOOL', 'text');
            expect(store.getState().editor.activeTool).toBe('text');
        });

        it('should dispatch SET_MODE', () => {
            store.dispatch('SET_MODE', 'master');
            expect(store.getState().editor.mode).toBe('master');
        });

        it('should migrate a contextless legacy master state back to slide scope', () => {
            const legacyState = createInitialState();
            delete legacyState.context;
            legacyState.editor.mode = 'master';
            store.restoreState(legacyState);

            store.dispatch('SET_MODE', 'edit');

            const state = store.getState();
            expect(state.editor.mode).toBe('edit');
            expect(state.context.editScope).toBe('Slide');
            expect(state.context.runtimeMode).toBeNull();
        });

        it('should change view without changing edit scope or runtime', () => {
            store.dispatch('SET_VIEW', 'Outline');

            const { context } = store.getState();
            expect(context.view).toBe('Outline');
            expect(context.editScope).toBe('Slide');
            expect(context.runtimeMode).toBeNull();
        });

        it('should change edit scope without entering runtime', () => {
            store.dispatch('SET_EDIT_SCOPE', 'Master');

            const state = store.getState();
            expect(state.context.editScope).toBe('Master');
            expect(state.context.runtimeMode).toBeNull();
            expect(state.editor.mode).toBe('master');
        });

        it('should ignore invalid context values', () => {
            store.dispatch('SET_VIEW', 'Presenter');
            store.dispatch('SET_EDIT_SCOPE', 'Presentation');
            store.dispatch('ENTER_RUNTIME', { mode: 'Authoring' });

            expect(store.getState().context).toEqual({
                productSpace: 'Authoring',
                view: 'Canvas',
                editScope: 'Slide',
                runtimeMode: null,
                surfaceRole: 'Editor',
                placement: null,
                authoringSnapshot: null
            });
        });

        it('should dispatch SET_ACTIVE_SLIDE', () => {
            // First add another slide
            store.dispatch('ADD_SLIDE');
            const slideOrder = store.getState().slideOrder;
            const firstSlideId = slideOrder[0];
            
            store.dispatch('SET_ACTIVE_SLIDE', firstSlideId);
            expect(store.getState().editor.activeSlideId).toBe(firstSlideId);
        });

        it('should dispatch UPDATE_VIEWPORT', () => {
            store.dispatch('UPDATE_VIEWPORT', { zoom: 1.5, pan: { x: 100, y: 50 } });
            
            const state = store.getState();
            expect(state.editor.zoom).toBe(1.5);
            expect(state.editor.pan.x).toBe(100);
            expect(state.editor.pan.y).toBe(50);
        });

        it('should dispatch UPDATE_SELECTION', () => {
            store.dispatch('UPDATE_SELECTION', ['element-1', 'element-2']);
            expect(store.getState().editor.selectedElementIds).toEqual(['element-1', 'element-2']);
        });

        it('should dispatch TOGGLE_CONSTRAIN_PROPORTIONS', () => {
            const initial = store.getState().editor.constrainProportions;
            store.dispatch('TOGGLE_CONSTRAIN_PROPORTIONS');
            expect(store.getState().editor.constrainProportions).toBe(!initial);
        });

        it('should dispatch SET_EDITING_ELEMENT', () => {
            store.dispatch('SET_EDITING_ELEMENT', { id: 'text-1' });
            expect(store.getState().editor.editingElementId).toBe('text-1');
        });
    });

    describe('dispatch() - Slide Actions', () => {
        it('should dispatch ADD_SLIDE', () => {
            const initialCount = store.getState().slideOrder.length;
            store.dispatch('ADD_SLIDE');
            expect(store.getState().slideOrder.length).toBe(initialCount + 1);
        });

        it('should dispatch DELETE_SLIDE', () => {
            // Add a slide first so we have multiple
            store.dispatch('ADD_SLIDE');
            const slideOrder = store.getState().slideOrder;
            const slideToDelete = slideOrder[0];
            
            store.dispatch('DELETE_SLIDE', slideToDelete);
            expect(store.getState().slideOrder).not.toContain(slideToDelete);
        });

        it('should not delete the last slide', () => {
            // Create a state with only one slide to test the "cannot delete last slide" behavior
            const singleSlideState = createInitialState();
            // Keep only the first slide
            const firstSlideId = singleSlideState.slideOrder[0];
            singleSlideState.slideOrder = [firstSlideId];
            const otherSlideIds = Object.keys(singleSlideState.slides).filter(id => id !== firstSlideId);
            otherSlideIds.forEach(id => delete singleSlideState.slides[id]);
            
            store.restoreState(singleSlideState);
            const initialCount = store.getState().slideOrder.length;
            expect(initialCount).toBe(1);
            
            const slideId = store.getState().slideOrder[0];
            store.dispatch('DELETE_SLIDE', slideId);
            expect(store.getState().slideOrder.length).toBe(1);
        });

        it('should dispatch DUPLICATE_SLIDE', () => {
            const slideId = store.getState().slideOrder[0];
            const initialCount = store.getState().slideOrder.length;
            
            store.dispatch('DUPLICATE_SLIDE', slideId);
            expect(store.getState().slideOrder.length).toBe(initialCount + 1);
        });

        it('should dispatch UPDATE_SLIDE', () => {
            const slideId = store.getState().slideOrder[0];
            store.dispatch('UPDATE_SLIDE', { id: slideId, title: 'Updated Title' });
            
            expect(store.getState().slides[slideId].title).toBe('Updated Title');
        });

        it('should dispatch REORDER_SLIDES', () => {
            store.dispatch('ADD_SLIDE');
            store.dispatch('ADD_SLIDE');
            
            const originalOrder = [...store.getState().slideOrder];
            store.dispatch('REORDER_SLIDES', { fromIndex: 0, toIndex: 2 });
            
            expect(store.getState().slideOrder[2]).toBe(originalOrder[0]);
        });
    });

    describe('dispatch() - Element Actions', () => {
        it('should dispatch ADD_ELEMENT', () => {
            const newElement = {
                id: 'rect-test',
                type: 'rect',
                x: 100,
                y: 100,
                width: 200,
                height: 150
            };
            
            store.dispatch('ADD_ELEMENT', newElement);
            
            const activeSlideId = store.getState().editor.activeSlideId;
            const slide = store.getState().slides[activeSlideId];
            expect(slide.elements['rect-test']).toBeDefined();
        });

        it('should dispatch UPDATE_ELEMENT', () => {
            const slideId = store.getState().editor.activeSlideId;
            const elementIds = Object.keys(store.getState().slides[slideId].elements);
            
            if (elementIds.length > 0) {
                store.dispatch('UPDATE_ELEMENT', { 
                    id: elementIds[0], 
                    x: 500, 
                    y: 300 
                });
                
                expect(store.getState().slides[slideId].elements[elementIds[0]].x).toBe(500);
            }
        });

        it('should dispatch REMOVE_ELEMENT', () => {
            // First add an element
            const newElement = {
                id: 'to-remove',
                type: 'rect',
                x: 0,
                y: 0,
                width: 100,
                height: 100
            };
            store.dispatch('ADD_ELEMENT', newElement);
            
            // Then remove it
            store.dispatch('REMOVE_ELEMENT', 'to-remove');
            
            const activeSlideId = store.getState().editor.activeSlideId;
            expect(store.getState().slides[activeSlideId].elements['to-remove']).toBeUndefined();
        });

        it('should dispatch ALIGN_ELEMENTS', () => {
            // Add elements and select them
            store.dispatch('ADD_ELEMENT', { id: 'el-1', type: 'rect', x: 100, y: 100, width: 50, height: 50 });
            store.dispatch('ADD_ELEMENT', { id: 'el-2', type: 'rect', x: 200, y: 200, width: 50, height: 50 });
            store.dispatch('UPDATE_SELECTION', ['el-1', 'el-2']);
            
            // Align left
            store.dispatch('ALIGN_ELEMENTS', 'left');
            
            const slideId = store.getState().editor.activeSlideId;
            const el1 = store.getState().slides[slideId].elements['el-1'];
            const el2 = store.getState().slides[slideId].elements['el-2'];
            
            // Both elements should have same x position
            expect(el1.x).toBe(el2.x);
        });
    });

    describe('dispatch() - Presentation Actions', () => {
        it('should start presentation via SET_MODE', () => {
            store.dispatch('SET_MODE', 'presentation');
            expect(store.getState().editor.mode).toBe('presentation');
            expect(store.getState().presentation.isActive).toBe(true);
        });

        it('should end presentation via SET_MODE', () => {
            store.dispatch('SET_MODE', 'presentation');
            store.dispatch('SET_MODE', 'edit');
            expect(store.getState().editor.mode).toBe('edit');
            expect(store.getState().presentation.isActive).toBe(false);
        });

        it('should restore captured authoring context on runtime exit', () => {
            store.dispatch('SET_VIEW', 'System');
            store.dispatch('SET_EDIT_SCOPE', 'Master');
            store.dispatch('SET_ACTIVE_TOOL', 'text');
            store.dispatch('UPDATE_VIEWPORT', { zoom: 1.5, pan: { x: 120, y: 80 } });
            store.dispatch('UPDATE_SELECTION', ['element-1', 'element-2']);

            store.dispatch('ENTER_RUNTIME', {
                mode: 'Preview',
                surfaceRole: 'Audience',
                placement: 'Embedded preview'
            });

            let state = store.getState();
            expect(state.context.productSpace).toBe('Runtime');
            expect(state.context.runtimeMode).toBe('Preview');
            expect(state.context.surfaceRole).toBe('Audience');
            expect(state.context.placement).toBe('Embedded preview');
            expect(state.editor.mode).toBe('presentation');
            expect(state.editor.selectedElementIds).toEqual([]);

            store.dispatch('EXIT_RUNTIME');

            state = store.getState();
            expect(state.context.productSpace).toBe('Authoring');
            expect(state.context.view).toBe('System');
            expect(state.context.editScope).toBe('Master');
            expect(state.context.runtimeMode).toBeNull();
            expect(state.context.surfaceRole).toBe('Editor');
            expect(state.context.placement).toBeNull();
            expect(state.context.authoringSnapshot).toBeNull();
            expect(state.editor.mode).toBe('master');
            expect(state.editor.activeTool).toBe('text');
            expect(state.editor.selectedElementIds).toEqual(['element-1', 'element-2']);
            expect(state.editor.zoom).toBe(1.5);
            expect(state.editor.pan).toEqual({ x: 120, y: 80 });
            expect(state.presentation.isActive).toBe(false);
        });

        it('should block edit-scope changes while runtime is active', () => {
            store.dispatch('ENTER_RUNTIME', {
                mode: 'Presentation',
                surfaceRole: 'Presenter',
                placement: 'External display'
            });
            store.dispatch('SET_EDIT_SCOPE', 'Master');

            const state = store.getState();
            expect(state.context.runtimeMode).toBe('Presentation');
            expect(state.context.editScope).toBe('Slide');
        });

        it('should dispatch PRESENTATION_NEXT', () => {
            // Add slides so we have more than one
            store.dispatch('ADD_SLIDE');
            store.dispatch('ADD_SLIDE');
            
            // Set active to first slide before entering presentation
            const firstSlideId = store.getState().slideOrder[0];
            store.dispatch('SET_ACTIVE_SLIDE', firstSlideId);
            
            store.dispatch('SET_MODE', 'presentation');
            
            expect(store.getState().presentation.currentSlideIndex).toBe(0);
            store.dispatch('PRESENTATION_NEXT');
            expect(store.getState().presentation.currentSlideIndex).toBe(1);
        });

        it('should dispatch PRESENTATION_PREV', () => {
            store.dispatch('ADD_SLIDE');
            store.dispatch('ADD_SLIDE');
            
            // Set active to first slide
            const firstSlideId = store.getState().slideOrder[0];
            store.dispatch('SET_ACTIVE_SLIDE', firstSlideId);
            
            store.dispatch('SET_MODE', 'presentation');
            store.dispatch('PRESENTATION_NEXT');
            
            store.dispatch('PRESENTATION_PREV');
            expect(store.getState().presentation.currentSlideIndex).toBe(0);
        });

        it('should dispatch PRESENTATION_GOTO', () => {
            store.dispatch('ADD_SLIDE');
            store.dispatch('ADD_SLIDE');
            
            // Set active to first slide
            const firstSlideId = store.getState().slideOrder[0];
            store.dispatch('SET_ACTIVE_SLIDE', firstSlideId);
            
            store.dispatch('SET_MODE', 'presentation');
            store.dispatch('PRESENTATION_GOTO', 2);
            expect(store.getState().presentation.currentSlideIndex).toBe(2);
        });
    });

    describe('dispatch() - Auth Actions', () => {
        it('should dispatch AUTH_LOGIN_START', () => {
            store.dispatch('AUTH_LOGIN_START');
            expect(store.getState().auth.loading).toBe(true);
        });

        it('should dispatch AUTH_LOGIN_SUCCESS', () => {
            const user = { id: 'user-1', name: 'Test User', email: 'test@example.com' };
            store.dispatch('AUTH_LOGIN_SUCCESS', user);
            
            expect(store.getState().auth.user).toEqual(user);
            expect(store.getState().auth.isAuthenticated).toBe(true);
            expect(store.getState().auth.loading).toBe(false);
        });

        it('should dispatch AUTH_LOGOUT', () => {
            // First set a user
            store.dispatch('AUTH_LOGIN_SUCCESS', { id: 'user-1' });
            
            // Then logout
            store.dispatch('AUTH_LOGOUT');
            
            expect(store.getState().auth.user).toBeNull();
            expect(store.getState().auth.isAuthenticated).toBe(false);
        });
    });

    describe('Event Emission', () => {
        it('should emit state-changed on dispatch', () => {
            const listener = vi.fn();
            store.on('state-changed', listener);
            
            store.dispatch('SET_ACTIVE_TOOL', 'rect');
            
            expect(listener).toHaveBeenCalled();
            
            store.off('state-changed', listener);
        });

        it('should emit mode-changed when mode changes', () => {
            const listener = vi.fn();
            store.on('mode-changed', listener);
            
            store.dispatch('SET_MODE', 'master');
            
            expect(listener).toHaveBeenCalledWith('master');
            
            store.off('mode-changed', listener);
        });

        it('should emit context-changed for canonical context transitions', () => {
            const listener = vi.fn();
            store.on('context-changed', listener);

            store.dispatch('SET_VIEW', 'Notes');

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                view: 'Notes',
                editScope: 'Slide',
                runtimeMode: null
            }));

            store.off('context-changed', listener);
        });

        it('should emit context-changed for legacy mode transitions during migration', () => {
            const listener = vi.fn();
            store.on('context-changed', listener);

            store.dispatch('SET_MODE', 'master');

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                productSpace: 'Authoring',
                editScope: 'Master',
                runtimeMode: null
            }));

            store.off('context-changed', listener);
        });

        it('should emit the compatibility mode event for canonical runtime transitions', () => {
            const listener = vi.fn();
            store.on('mode-changed', listener);

            store.dispatch('ENTER_RUNTIME', {
                mode: 'Presentation',
                surfaceRole: 'Audience',
                placement: 'Windowed'
            });
            store.dispatch('EXIT_RUNTIME');

            expect(listener).toHaveBeenNthCalledWith(1, 'presentation');
            expect(listener).toHaveBeenNthCalledWith(2, 'edit');

            store.off('mode-changed', listener);
        });

        it('should emit selection-changed when selection changes', () => {
            const listener = vi.fn();
            store.on('selection-changed', listener);
            
            store.dispatch('UPDATE_SELECTION', ['element-1']);
            
            expect(listener).toHaveBeenCalled();
            
            store.off('selection-changed', listener);
        });

        it('should emit auth-changed on login success', () => {
            const listener = vi.fn();
            store.on('auth-changed', listener);
            
            store.dispatch('AUTH_LOGIN_SUCCESS', { id: 'user-1' });
            
            expect(listener).toHaveBeenCalledWith({ 
                isAuthenticated: true, 
                user: { id: 'user-1' } 
            });
            
            store.off('auth-changed', listener);
        });

        it('should allow removing event listeners', () => {
            const listener = vi.fn();
            store.on('state-changed', listener);
            store.off('state-changed', listener);
            
            store.dispatch('SET_ACTIVE_TOOL', 'circle');
            
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('getEffectiveSlide()', () => {
        it('should return slide data for valid slide', () => {
            const slideId = store.getState().slideOrder[0];
            const effectiveSlide = store.getEffectiveSlide(slideId);
            
            expect(effectiveSlide).toBeDefined();
            expect(effectiveSlide.effectiveElements).toBeDefined();
            expect(effectiveSlide.effectiveBackground).toBeDefined();
        });

        it('should return null for non-existent slide', () => {
            const effectiveSlide = store.getEffectiveSlide('nonexistent-slide');
            expect(effectiveSlide).toBeNull();
        });

        it('should include effective background', () => {
            const slideId = store.getState().slideOrder[0];
            store.dispatch('UPDATE_SLIDE', { 
                id: slideId, 
                background: { type: 'solid', value: '#ff0000' } 
            });
            
            const effectiveSlide = store.getEffectiveSlide(slideId);
            expect(effectiveSlide.effectiveBackground).toBeDefined();
        });
    });

    describe('snapshot() and restoreState()', () => {
        it('should create a state snapshot', () => {
            // snapshot() saves to history, but we can test via undo mechanism
            store.snapshot('Test snapshot');
            // This doesn't return anything, it pushes to history
            expect(true).toBe(true); // Just verify it doesn't throw
        });

        it('should restore state via restoreState', () => {
            const newState = createInitialState();
            newState.meta.title = 'Restored State';
            
            store.restoreState(newState);
            
            expect(store.getState().meta.title).toBe('Restored State');
        });
    });

    describe('Unknown Action Types', () => {
        it('should handle unknown action types gracefully', () => {
            expect(() => {
                store.dispatch('UNKNOWN_ACTION_TYPE', {});
            }).not.toThrow();
        });
    });
});
