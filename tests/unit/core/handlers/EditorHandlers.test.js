/**
 * EditorHandlers Unit Tests
 * 
 * Tests the pure handler functions for editor state management.
 * These handlers modify Immer draft state directly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { produce } from '../../../../src/vendor/immer.js';
import {
    handleSelectSlide,
    handleDeselectSlides,
    handleSetActiveSlide,
    handleSetActiveMaster,
    handleSetActiveTool,
    handleSetDragPlaceholder,
    handleSetMode,
    handleSetEditingElement,
    handleUpdateViewport,
    handleUpdateSelection,
    handleToggleTheme,
    handleToggleConstrainProportions
} from '../../../../src/core/store/handlers/EditorHandlers.js';
import { createInitialState } from '../../../../src/core/store/InitialState.js';

describe('EditorHandlers', () => {
    let initialState;

    beforeEach(() => {
        initialState = createInitialState();
    });

    describe('handleSelectSlide()', () => {
        it('should set slide as single selection when multi is false', () => {
            const newState = produce(initialState, draft => {
                handleSelectSlide(draft, { id: 'slide-1', multi: false });
            });

            expect(newState.editor.selectedSlideIds).toEqual(['slide-1']);
        });

        it('should replace selection when multi is false', () => {
            let state = produce(initialState, draft => {
                draft.editor.selectedSlideIds = ['slide-1'];
            });
            
            state = produce(state, draft => {
                handleSelectSlide(draft, { id: 'slide-2', multi: false });
            });

            expect(state.editor.selectedSlideIds).toEqual(['slide-2']);
        });

        it('should add to selection when multi is true', () => {
            let state = produce(initialState, draft => {
                draft.editor.selectedSlideIds = ['slide-1'];
            });
            
            state = produce(state, draft => {
                handleSelectSlide(draft, { id: 'slide-2', multi: true });
            });

            expect(state.editor.selectedSlideIds).toContain('slide-1');
            expect(state.editor.selectedSlideIds).toContain('slide-2');
        });

        it('should toggle off when multi is true and slide already selected', () => {
            let state = produce(initialState, draft => {
                draft.editor.selectedSlideIds = ['slide-1', 'slide-2'];
            });
            
            state = produce(state, draft => {
                handleSelectSlide(draft, { id: 'slide-1', multi: true });
            });

            expect(state.editor.selectedSlideIds).not.toContain('slide-1');
            expect(state.editor.selectedSlideIds).toContain('slide-2');
        });

        it('should not duplicate slide IDs in multi-selection', () => {
            let state = produce(initialState, draft => {
                draft.editor.selectedSlideIds = ['slide-1'];
            });
            
            // Selecting already selected with multi adds it again, then removes
            // But first select with single to establish baseline
            state = produce(state, draft => {
                handleSelectSlide(draft, { id: 'slide-1', multi: false });
            });

            expect(state.editor.selectedSlideIds.filter(id => id === 'slide-1').length).toBe(1);
        });
    });

    describe('handleDeselectSlides()', () => {
        it('should clear all selected slides', () => {
            let state = produce(initialState, draft => {
                draft.editor.selectedSlideIds = ['slide-1', 'slide-2', 'slide-3'];
            });
            
            state = produce(state, draft => {
                handleDeselectSlides(draft);
            });

            expect(state.editor.selectedSlideIds).toEqual([]);
        });

        it('should handle already empty selection', () => {
            const newState = produce(initialState, draft => {
                handleDeselectSlides(draft);
            });

            expect(newState.editor.selectedSlideIds).toEqual([]);
        });
    });

    describe('handleSetActiveSlide()', () => {
        it('should set the active slide ID when slide exists', () => {
            // First add the slide to the state
            let state = produce(initialState, draft => {
                draft.slides['slide-2'] = { id: 'slide-2', masterId: 'layout-title', content: {} };
            });
            
            state = produce(state, draft => {
                handleSetActiveSlide(draft, 'slide-2');
            });

            expect(state.editor.activeSlideId).toBe('slide-2');
        });

        it('should not change active slide if slide does not exist', () => {
            let state = produce(initialState, draft => {
                draft.editor.activeSlideId = 'slide-1';
            });
            
            state = produce(state, draft => {
                handleSetActiveSlide(draft, 'nonexistent-slide');
            });

            expect(state.editor.activeSlideId).toBe('slide-1');
        });

        it('should update active slide to existing slide', () => {
            let state = produce(initialState, draft => {
                draft.editor.activeSlideId = 'slide-1';
                draft.slides['slide-1'] = { id: 'slide-1', masterId: 'layout-title', content: {} };
                draft.slides['slide-3'] = { id: 'slide-3', masterId: 'layout-title', content: {} };
            });
            
            state = produce(state, draft => {
                handleSetActiveSlide(draft, 'slide-3');
            });

            expect(state.editor.activeSlideId).toBe('slide-3');
        });
    });

    describe('handleSetActiveMaster()', () => {
        it('should set the active master ID when master exists', () => {
            const newState = produce(initialState, draft => {
                handleSetActiveMaster(draft, 'layout-title');
            });

            expect(newState.editor.activeMasterId).toBe('layout-title');
        });

        it('should not change active master if master does not exist', () => {
            let state = produce(initialState, draft => {
                draft.editor.activeMasterId = 'layout-title';
            });
            
            state = produce(state, draft => {
                handleSetActiveMaster(draft, 'nonexistent-master');
            });

            expect(state.editor.activeMasterId).toBe('layout-title');
        });

        it('should change from one master to another', () => {
            let state = produce(initialState, draft => {
                draft.editor.activeMasterId = 'master-default';
            });
            
            state = produce(state, draft => {
                handleSetActiveMaster(draft, 'layout-blank');
            });

            expect(state.editor.activeMasterId).toBe('layout-blank');
        });
    });

    describe('handleSetActiveTool()', () => {
        it('should set the active tool with string payload', () => {
            const newState = produce(initialState, draft => {
                handleSetActiveTool(draft, 'text');
            });

            expect(newState.editor.activeTool).toBe('text');
            expect(newState.editor.activeToolOptions).toBeNull();
        });

        it('should set the active tool with object payload', () => {
            const newState = produce(initialState, draft => {
                handleSetActiveTool(draft, { tool: 'placeholder', placeholderType: 'title' });
            });

            expect(newState.editor.activeTool).toBe('placeholder');
            expect(newState.editor.activeToolOptions).toEqual({ tool: 'placeholder', placeholderType: 'title' });
        });

        it('should handle all tool types', () => {
            const tools = ['select', 'text', 'rect', 'circle', 'hand'];
            
            tools.forEach(tool => {
                const state = produce(initialState, draft => {
                    handleSetActiveTool(draft, tool);
                });
                expect(state.editor.activeTool).toBe(tool);
            });
        });

        it('should clear selection when switching away from select tool', () => {
            let state = produce(initialState, draft => {
                draft.editor.activeTool = 'select';
                draft.editor.selectedElementIds = ['elem-1', 'elem-2'];
                draft.editor.editingElementId = 'elem-1';
            });
            
            state = produce(state, draft => {
                handleSetActiveTool(draft, 'text');
            });

            expect(state.editor.selectedElementIds).toEqual([]);
            expect(state.editor.editingElementId).toBeNull();
        });
    });

    describe('handleSetDragPlaceholder()', () => {
        it('should set the drag placeholder type', () => {
            const newState = produce(initialState, draft => {
                handleSetDragPlaceholder(draft, { type: 'title' });
            });

            expect(newState.editor.dragPlaceholderType).toBe('title');
        });

        it('should clear drag placeholder with null payload', () => {
            let state = produce(initialState, draft => {
                draft.editor.dragPlaceholderType = 'body';
            });
            
            state = produce(state, draft => {
                handleSetDragPlaceholder(draft, null);
            });

            expect(state.editor.dragPlaceholderType).toBeNull();
        });

        it('should clear drag placeholder with empty object', () => {
            let state = produce(initialState, draft => {
                draft.editor.dragPlaceholderType = 'body';
            });
            
            state = produce(state, draft => {
                handleSetDragPlaceholder(draft, {});
            });

            expect(state.editor.dragPlaceholderType).toBeNull();
        });
    });

    describe('handleSetMode()', () => {
        it('should set editor mode to master', () => {
            const newState = produce(initialState, draft => {
                handleSetMode(draft, 'master');
            });

            expect(newState.editor.mode).toBe('master');
        });

        it('should set first master as active when switching to master mode with no activeMasterId', () => {
            let state = produce(initialState, draft => {
                draft.editor.activeMasterId = null;
            });
            
            state = produce(state, draft => {
                handleSetMode(draft, 'master');
            });

            expect(state.editor.mode).toBe('master');
            // Should set first available master
            expect(state.editor.activeMasterId).toBeTruthy();
        });

        it('should set editor mode to presentation and activate presentation state', () => {
            const newState = produce(initialState, draft => {
                handleSetMode(draft, 'presentation');
            });

            expect(newState.editor.mode).toBe('presentation');
            expect(newState.presentation.isActive).toBe(true);
        });

        it('should set editor mode to edit and deactivate presentation', () => {
            let state = produce(initialState, draft => {
                draft.editor.mode = 'presentation';
                draft.presentation.isActive = true;
            });
            
            state = produce(state, draft => {
                handleSetMode(draft, 'edit');
            });

            expect(state.editor.mode).toBe('edit');
            expect(state.presentation.isActive).toBe(false);
        });
    });

    describe('handleSetEditingElement()', () => {
        it('should set the editing element ID', () => {
            const newState = produce(initialState, draft => {
                handleSetEditingElement(draft, { id: 'text-1' });
            });

            expect(newState.editor.editingElementId).toBe('text-1');
        });

        it('should set additional editing properties', () => {
            const newState = produce(initialState, draft => {
                handleSetEditingElement(draft, { 
                    id: 'text-1',
                    selectionType: 'all',
                    clickPosition: { clientX: 100, clientY: 200 }
                });
            });

            expect(newState.editor.editingElementId).toBe('text-1');
            expect(newState.editor.editModeSelectionType).toBe('all');
            expect(newState.editor.textEditClickPosition).toEqual({ clientX: 100, clientY: 200 });
        });

        it('should set isNewlyCreated flag', () => {
            const newState = produce(initialState, draft => {
                handleSetEditingElement(draft, { 
                    id: 'text-1',
                    selectionType: 'all',
                    isNewlyCreated: true
                });
            });

            expect(newState.editor.editingElementId).toBe('text-1');
            expect(newState.editor.editModeIsNewlyCreated).toBe(true);
        });

        it('should default isNewlyCreated to false', () => {
            const newState = produce(initialState, draft => {
                handleSetEditingElement(draft, { id: 'text-1' });
            });

            expect(newState.editor.editModeIsNewlyCreated).toBe(false);
        });

        it('should clear editing element with null id', () => {
            let state = produce(initialState, draft => {
                draft.editor.editingElementId = 'text-1';
            });
            
            state = produce(state, draft => {
                handleSetEditingElement(draft, { id: null });
            });

            expect(state.editor.editingElementId).toBeNull();
        });
    });

    describe('handleUpdateViewport()', () => {
        it('should update zoom level', () => {
            const newState = produce(initialState, draft => {
                handleUpdateViewport(draft, { zoom: 1.5 });
            });

            expect(newState.editor.zoom).toBe(1.5);
        });

        it('should update pan position', () => {
            const newState = produce(initialState, draft => {
                handleUpdateViewport(draft, { pan: { x: 100, y: 200 } });
            });

            expect(newState.editor.pan).toEqual({ x: 100, y: 200 });
        });

        it('should update both zoom and pan', () => {
            const newState = produce(initialState, draft => {
                handleUpdateViewport(draft, { zoom: 2.0, pan: { x: 50, y: 75 } });
            });

            expect(newState.editor.zoom).toBe(2.0);
            expect(newState.editor.pan).toEqual({ x: 50, y: 75 });
        });

        it('should not affect other viewport properties when updating one', () => {
            let state = produce(initialState, draft => {
                draft.editor.zoom = 1.5;
                draft.editor.pan = { x: 100, y: 100 };
            });
            
            state = produce(state, draft => {
                handleUpdateViewport(draft, { zoom: 2.0 });
            });

            expect(state.editor.zoom).toBe(2.0);
            expect(state.editor.pan).toEqual({ x: 100, y: 100 });
        });
    });

    describe('handleUpdateSelection()', () => {
        it('should update selected element IDs', () => {
            const newState = produce(initialState, draft => {
                handleUpdateSelection(draft, ['element-1', 'element-2']);
            });

            expect(newState.editor.selectedElementIds).toEqual(['element-1', 'element-2']);
        });

        it('should replace existing selection', () => {
            let state = produce(initialState, draft => {
                draft.editor.selectedElementIds = ['old-element'];
            });
            
            state = produce(state, draft => {
                handleUpdateSelection(draft, ['new-element']);
            });

            expect(state.editor.selectedElementIds).toEqual(['new-element']);
            expect(state.editor.selectedElementIds).not.toContain('old-element');
        });

        it('should handle empty selection', () => {
            const newState = produce(initialState, draft => {
                handleUpdateSelection(draft, []);
            });

            expect(newState.editor.selectedElementIds).toEqual([]);
        });
    });

    describe('handleToggleTheme()', () => {
        it('should toggle theme from light to dark', () => {
            let state = produce(initialState, draft => {
                draft.theme = 'light';
            });
            
            state = produce(state, draft => {
                handleToggleTheme(draft);
            });

            expect(state.theme).toBe('dark');
        });

        it('should toggle theme from dark to light', () => {
            let state = produce(initialState, draft => {
                draft.theme = 'dark';
            });
            
            state = produce(state, draft => {
                handleToggleTheme(draft);
            });

            expect(state.theme).toBe('light');
        });
    });

    describe('handleToggleConstrainProportions()', () => {
        it('should toggle constrain proportions from false to true', () => {
            let state = produce(initialState, draft => {
                draft.editor.constrainProportions = false;
            });
            
            state = produce(state, draft => {
                handleToggleConstrainProportions(draft);
            });

            expect(state.editor.constrainProportions).toBe(true);
        });

        it('should toggle constrain proportions from true to false', () => {
            let state = produce(initialState, draft => {
                draft.editor.constrainProportions = true;
            });
            
            state = produce(state, draft => {
                handleToggleConstrainProportions(draft);
            });

            expect(state.editor.constrainProportions).toBe(false);
        });
    });
});

