/**
 * ElementHandlers Unit Tests
 * 
 * Tests the pure handler functions for element management including
 * add, update, remove, duplicate, align, and distribute operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { produce } from '../../../../src/vendor/immer.js';
import {
    handleAddElement,
    handleUpdateElement,
    handleRemoveElement,
    handleDuplicateElements,
    handlePasteElements,
    handleReorderElements,
    handleAlignElements,
    handleDistributeElements,
    handleToggleElementLock,
    handleToggleElementVisibility,
    handleInstantiatePlaceholder,
    handleCreateBooleanFromSelection,
    handleCreateMaskFromSelection,
    handleFlattenBooleanFromSelection
} from '../../../../src/core/store/handlers/ElementHandlers.js';
import { createInitialState } from '../../../../src/core/store/InitialState.js';

describe('ElementHandlers', () => {
    let initialState;

    beforeEach(() => {
        initialState = createInitialState();
    });

    describe('handleAddElement()', () => {
        it('should add an element to the active slide', () => {
            const element = {
                id: 'rect-1',
                type: 'rect',
                x: 100,
                y: 100,
                width: 200,
                height: 150
            };

            const newState = produce(initialState, draft => {
                handleAddElement(draft, element);
            });

            const activeSlideId = newState.editor.activeSlideId;
            expect(newState.slides[activeSlideId].elements['rect-1']).toBeDefined();
            expect(newState.slides[activeSlideId].elements['rect-1'].x).toBe(100);
        });

        it('should add element to elementOrder', () => {
            const element = {
                id: 'circle-1',
                type: 'circle',
                x: 50,
                y: 50,
                width: 100,
                height: 100
            };

            const newState = produce(initialState, draft => {
                handleAddElement(draft, element);
            });

            const activeSlideId = newState.editor.activeSlideId;
            expect(newState.slides[activeSlideId].elementOrder).toContain('circle-1');
        });

        it('should add element to master when in master mode', () => {
            let state = produce(initialState, draft => {
                draft.editor.mode = 'master';
                draft.editor.activeMasterId = 'layout-blank';
            });

            const element = {
                id: 'placeholder-1',
                type: 'text',
                x: 100,
                y: 100,
                width: 500,
                height: 200
            };

            state = produce(state, draft => {
                handleAddElement(draft, element);
            });

            expect(state.slideMasterPresets['layout-blank'].elements['placeholder-1']).toBeDefined();
        });
    });

    describe('handleCreateBooleanFromSelection()', () => {
        it('creates a boolean and hides operand elements by default', () => {
            let state = produce(initialState, draft => {
                handleAddElement(draft, {
                    id: 'rect-a',
                    type: 'rect',
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                    style: { fills: [{ type: 'solid', value: '#ff0000', opacity: 100, visible: true }] }
                });
                handleAddElement(draft, {
                    id: 'rect-b',
                    type: 'rect',
                    x: 50,
                    y: 50,
                    width: 100,
                    height: 100,
                    style: { fills: [{ type: 'solid', value: '#00ff00', opacity: 100, visible: true }] }
                });
                draft.editor.selectedElementIds = ['rect-a', 'rect-b'];
            });

            state = produce(state, draft => {
                handleCreateBooleanFromSelection(draft, { ids: ['rect-a', 'rect-b'], operation: 'union' });
            });

            const slideId = state.editor.activeSlideId;
            const slide = state.slides[slideId];
            const selected = state.editor.selectedElementIds;
            expect(selected).toHaveLength(1);
            const booleanId = selected[0];

            expect(slide.elements[booleanId]).toBeDefined();
            expect(slide.elements[booleanId].shapeKind).toBe('boolean');

            expect(slide.elements['rect-a'].hidden).toBe(true);
            expect(slide.elements['rect-b'].hidden).toBe(true);
        });
    });

    describe('handleCreateMaskFromSelection()', () => {
        it('creates a mask and hides the mask shape by default', () => {
            let state = produce(initialState, draft => {
                handleAddElement(draft, {
                    id: 'content',
                    type: 'rect',
                    x: 10,
                    y: 10,
                    width: 200,
                    height: 140
                });
                // Mask-shape must be topmost by stacking order.
                handleAddElement(draft, {
                    id: 'mask-shape',
                    type: 'rect',
                    x: 0,
                    y: 0,
                    width: 120,
                    height: 80
                });
                draft.editor.selectedElementIds = ['mask-shape', 'content'];
            });

            state = produce(state, draft => {
                handleCreateMaskFromSelection(draft, { ids: ['mask-shape', 'content'] });
            });

            const slideId = state.editor.activeSlideId;
            const slide = state.slides[slideId];

            // Selected element should be the new mask node.
            expect(state.editor.selectedElementIds).toHaveLength(1);
            const maskId = state.editor.selectedElementIds[0];
            expect(slide.elements[maskId]).toBeDefined();
            expect(slide.elements[maskId].shapeKind).toBe('mask');

            // Mask shape is hidden in the viewport by default.
            expect(slide.elements['mask-shape'].hidden).toBe(true);
        });
    });

    describe('handleUpdateElement()', () => {
        it('should update element properties', () => {
            // First add an element
            let state = produce(initialState, draft => {
                handleAddElement(draft, {
                    id: 'test-el',
                    type: 'rect',
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100
                });
            });

            state = produce(state, draft => {
                handleUpdateElement(draft, {
                    id: 'test-el',
                    x: 200,
                    y: 300
                });
            });

            const activeSlideId = state.editor.activeSlideId;
            expect(state.slides[activeSlideId].elements['test-el'].x).toBe(200);
            expect(state.slides[activeSlideId].elements['test-el'].y).toBe(300);
        });

        it('should preserve existing properties when updating', () => {
            let state = produce(initialState, draft => {
                handleAddElement(draft, {
                    id: 'test-el',
                    type: 'rect',
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                    style: { fill: '#ff0000' }
                });
            });

            state = produce(state, draft => {
                handleUpdateElement(draft, {
                    id: 'test-el',
                    x: 50
                });
            });

            const activeSlideId = state.editor.activeSlideId;
            const element = state.slides[activeSlideId].elements['test-el'];
            expect(element.x).toBe(50);
            expect(element.width).toBe(100); // Preserved
            expect(element.style.fill).toBe('#ff0000'); // Preserved
        });

        it('should handle updating non-existent element', () => {
            const newState = produce(initialState, draft => {
                handleUpdateElement(draft, {
                    id: 'non-existent',
                    x: 100
                });
            });

            // Should not throw or add new element
            const activeSlideId = newState.editor.activeSlideId;
            expect(newState.slides[activeSlideId].elements['non-existent']).toBeUndefined();
        });
    });

    describe('handleRemoveElement()', () => {
        it('should remove a single element', () => {
            let state = produce(initialState, draft => {
                handleAddElement(draft, {
                    id: 'to-remove',
                    type: 'rect',
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100
                });
            });

            state = produce(state, draft => {
                handleRemoveElement(draft, 'to-remove');
            });

            const activeSlideId = state.editor.activeSlideId;
            expect(state.slides[activeSlideId].elements['to-remove']).toBeUndefined();
            expect(state.slides[activeSlideId].elementOrder).not.toContain('to-remove');
        });

        it('should remove multiple elements', () => {
            let state = produce(initialState, draft => {
                handleAddElement(draft, { id: 'el-1', type: 'rect', x: 0, y: 0, width: 50, height: 50 });
                handleAddElement(draft, { id: 'el-2', type: 'rect', x: 100, y: 0, width: 50, height: 50 });
                handleAddElement(draft, { id: 'el-3', type: 'rect', x: 200, y: 0, width: 50, height: 50 });
            });

            state = produce(state, draft => {
                handleRemoveElement(draft, ['el-1', 'el-3']);
            });

            const activeSlideId = state.editor.activeSlideId;
            expect(state.slides[activeSlideId].elements['el-1']).toBeUndefined();
            expect(state.slides[activeSlideId].elements['el-2']).toBeDefined();
            expect(state.slides[activeSlideId].elements['el-3']).toBeUndefined();
        });

        it('should remove from selection when element is deleted', () => {
            let state = produce(initialState, draft => {
                handleAddElement(draft, { id: 'selected-el', type: 'rect', x: 0, y: 0, width: 50, height: 50 });
                draft.editor.selectedElementIds = ['selected-el'];
            });

            state = produce(state, draft => {
                handleRemoveElement(draft, 'selected-el');
            });

            expect(state.editor.selectedElementIds).not.toContain('selected-el');
        });

        it('should remove group and all children', () => {
            let state = produce(initialState, draft => {
                handleAddElement(draft, { 
                    id: 'group-1', 
                    type: 'group', 
                    x: 0, 
                    y: 0, 
                    width: 200, 
                    height: 200,
                    children: ['child-1', 'child-2']
                });
                handleAddElement(draft, { id: 'child-1', type: 'rect', x: 0, y: 0, width: 50, height: 50, parentId: 'group-1' });
                handleAddElement(draft, { id: 'child-2', type: 'rect', x: 100, y: 0, width: 50, height: 50, parentId: 'group-1' });
            });

            state = produce(state, draft => {
                handleRemoveElement(draft, 'group-1');
            });

            const activeSlideId = state.editor.activeSlideId;
            expect(state.slides[activeSlideId].elements['group-1']).toBeUndefined();
            expect(state.slides[activeSlideId].elements['child-1']).toBeUndefined();
            expect(state.slides[activeSlideId].elements['child-2']).toBeUndefined();
        });
    });

    describe('handleDuplicateElements()', () => {
        it('should duplicate selected elements', () => {
            let state = produce(initialState, draft => {
                handleAddElement(draft, { id: 'original', type: 'rect', x: 100, y: 100, width: 50, height: 50 });
                draft.editor.selectedElementIds = ['original'];
            });

            state = produce(state, draft => {
                handleDuplicateElements(draft, { ids: ['original'], offset: true });
            });

            const activeSlideId = state.editor.activeSlideId;
            const elements = state.slides[activeSlideId].elements;
            const elementIds = Object.keys(elements);
            
            // Should have more than just the original
            expect(elementIds.length).toBeGreaterThan(Object.keys(initialState.slides[initialState.slideOrder[0]].elements).length + 1);
        });

        it('should offset duplicated elements when offset is true', () => {
            let state = produce(initialState, draft => {
                handleAddElement(draft, { id: 'original', type: 'rect', x: 100, y: 100, width: 50, height: 50 });
                draft.editor.selectedElementIds = ['original'];
            });

            const originalX = 100;
            const originalY = 100;

            state = produce(state, draft => {
                handleDuplicateElements(draft, { ids: ['original'], offset: true });
            });

            const activeSlideId = state.editor.activeSlideId;
            const duplicateId = state.editor.selectedElementIds[0];
            const duplicate = state.slides[activeSlideId].elements[duplicateId];

            expect(duplicate.x).toBe(originalX + 20);
            expect(duplicate.y).toBe(originalY + 20);
        });

        it('should select duplicated elements', () => {
            let state = produce(initialState, draft => {
                handleAddElement(draft, { id: 'original', type: 'rect', x: 100, y: 100, width: 50, height: 50 });
                draft.editor.selectedElementIds = ['original'];
            });

            state = produce(state, draft => {
                handleDuplicateElements(draft, { ids: ['original'] });
            });

            // Selection should now be the duplicate(s)
            expect(state.editor.selectedElementIds).not.toContain('original');
            expect(state.editor.selectedElementIds.length).toBe(1);
        });
    });

    describe('handleFlattenBooleanFromSelection()', () => {
        it('should bake a union vector, delete operands, and select result', () => {
            let state = produce(initialState, (draft) => {
                handleAddElement(draft, {
                    id: 'rect-a',
                    type: 'rect',
                    x: 10,
                    y: 10,
                    width: 50,
                    height: 40,
                    style: { fills: [{ type: 'solid', value: '#FF0000', opacity: 100, visible: true }] }
                });
                handleAddElement(draft, {
                    id: 'rect-b',
                    type: 'rect',
                    x: 30,
                    y: 20,
                    width: 60,
                    height: 40,
                    style: { fills: [{ type: 'solid', value: '#00FF00', opacity: 100, visible: true }] }
                });
                draft.editor.selectedElementIds = ['rect-a', 'rect-b'];
            });

            state = produce(state, (draft) => {
                const res = handleFlattenBooleanFromSelection(draft, { ids: ['rect-a', 'rect-b'] });
                expect(res).toBeUndefined();
            });

            const slideId = state.editor.activeSlideId;
            const slide = state.slides[slideId];

            expect(slide.elements['rect-a']).toBeUndefined();
            expect(slide.elements['rect-b']).toBeUndefined();

            const selectedId = state.editor.selectedElementIds[0];
            expect(typeof selectedId).toBe('string');
            const baked = slide.elements[selectedId];
            expect(baked).toBeDefined();
            expect(baked.type).toBe('shape');
            expect(baked.shapeKind).toBe('vector');
            expect(Array.isArray(baked.paths)).toBe(true);
            expect(baked.paths.length).toBeGreaterThan(0);
        });

        it('should safely abort and return a warning notification when geometry is invalid', () => {
            let state = produce(initialState, (draft) => {
                handleAddElement(draft, {
                    id: 'bad-a',
                    type: 'rect',
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                });
                handleAddElement(draft, {
                    id: 'bad-b',
                    type: 'rect',
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                });
                draft.editor.selectedElementIds = ['bad-a', 'bad-b'];
            });

            state = produce(state, (draft) => {
                const res = handleFlattenBooleanFromSelection(draft, { ids: ['bad-a', 'bad-b'] });
                expect(res?.notification?.type).toBe('warning');
            });

            const slideId = state.editor.activeSlideId;
            const slide = state.slides[slideId];

            // Operands kept, selection preserved.
            expect(slide.elements['bad-a']).toBeDefined();
            expect(slide.elements['bad-b']).toBeDefined();
            expect(state.editor.selectedElementIds).toEqual(['bad-a', 'bad-b']);
        });
    });

    describe('handlePasteElements()', () => {
        it('should paste elements from clipboard', () => {
            const elements = [
                { id: 'pasted-1', type: 'rect', x: 100, y: 100, width: 50, height: 50 }
            ];

            const newState = produce(initialState, draft => {
                handlePasteElements(draft, { elements });
            });

            const activeSlideId = newState.editor.activeSlideId;
            // New ID will be generated, so check that an element was added
            expect(Object.keys(newState.slides[activeSlideId].elements).length).toBeGreaterThan(
                Object.keys(initialState.slides[initialState.slideOrder[0]].elements).length
            );
        });

        it('should offset pasted elements', () => {
            const elements = [
                { id: 'to-paste', type: 'rect', x: 100, y: 100, width: 50, height: 50 }
            ];

            const newState = produce(initialState, draft => {
                handlePasteElements(draft, { elements });
            });

            const activeSlideId = newState.editor.activeSlideId;
            const pastedId = newState.editor.selectedElementIds[0];
            const pasted = newState.slides[activeSlideId].elements[pastedId];

            expect(pasted.x).toBe(120); // 100 + 20
            expect(pasted.y).toBe(120);
        });

        it('should select pasted elements', () => {
            const elements = [
                { id: 'paste-1', type: 'rect', x: 0, y: 0, width: 50, height: 50 },
                { id: 'paste-2', type: 'circle', x: 100, y: 0, width: 50, height: 50 }
            ];

            const newState = produce(initialState, draft => {
                handlePasteElements(draft, { elements });
            });

            expect(newState.editor.selectedElementIds.length).toBe(2);
        });

        it('should handle empty paste', () => {
            const newState = produce(initialState, draft => {
                handlePasteElements(draft, { elements: [] });
            });

            expect(newState.editor.selectedElementIds).toEqual([]);
        });
    });

    describe('handleAlignElements()', () => {
        let stateWithElements;

        beforeEach(() => {
            stateWithElements = produce(initialState, draft => {
                handleAddElement(draft, { id: 'el-1', type: 'rect', x: 100, y: 100, width: 50, height: 50 });
                handleAddElement(draft, { id: 'el-2', type: 'rect', x: 200, y: 200, width: 50, height: 50 });
                handleAddElement(draft, { id: 'el-3', type: 'rect', x: 300, y: 300, width: 50, height: 50 });
                draft.editor.selectedElementIds = ['el-1', 'el-2', 'el-3'];
            });
        });

        it('should align elements to left', () => {
            const state = produce(stateWithElements, draft => {
                handleAlignElements(draft, 'left');
            });

            const slideId = state.editor.activeSlideId;
            const elements = state.slides[slideId].elements;

            // All elements should have same x position (min x of the group)
            expect(elements['el-1'].x).toBe(elements['el-2'].x);
            expect(elements['el-2'].x).toBe(elements['el-3'].x);
            expect(elements['el-1'].x).toBe(100);
        });

        it('should align elements to right', () => {
            const state = produce(stateWithElements, draft => {
                handleAlignElements(draft, 'right');
            });

            const slideId = state.editor.activeSlideId;
            const elements = state.slides[slideId].elements;

            // Right edges should align
            const rightEdge1 = elements['el-1'].x + elements['el-1'].width;
            const rightEdge2 = elements['el-2'].x + elements['el-2'].width;
            const rightEdge3 = elements['el-3'].x + elements['el-3'].width;

            expect(rightEdge1).toBe(rightEdge2);
            expect(rightEdge2).toBe(rightEdge3);
        });

        it('should align elements to top', () => {
            const state = produce(stateWithElements, draft => {
                handleAlignElements(draft, 'top');
            });

            const slideId = state.editor.activeSlideId;
            const elements = state.slides[slideId].elements;

            expect(elements['el-1'].y).toBe(elements['el-2'].y);
            expect(elements['el-2'].y).toBe(elements['el-3'].y);
            expect(elements['el-1'].y).toBe(100);
        });

        it('should align elements to bottom', () => {
            const state = produce(stateWithElements, draft => {
                handleAlignElements(draft, 'bottom');
            });

            const slideId = state.editor.activeSlideId;
            const elements = state.slides[slideId].elements;

            const bottomEdge1 = elements['el-1'].y + elements['el-1'].height;
            const bottomEdge2 = elements['el-2'].y + elements['el-2'].height;
            const bottomEdge3 = elements['el-3'].y + elements['el-3'].height;

            expect(bottomEdge1).toBe(bottomEdge2);
            expect(bottomEdge2).toBe(bottomEdge3);
        });

        it('should center elements horizontally', () => {
            const state = produce(stateWithElements, draft => {
                handleAlignElements(draft, 'center');
            });

            const slideId = state.editor.activeSlideId;
            const elements = state.slides[slideId].elements;

            const center1 = elements['el-1'].x + elements['el-1'].width / 2;
            const center2 = elements['el-2'].x + elements['el-2'].width / 2;
            const center3 = elements['el-3'].x + elements['el-3'].width / 2;

            expect(center1).toBe(center2);
            expect(center2).toBe(center3);
        });

        it('should center elements vertically', () => {
            const state = produce(stateWithElements, draft => {
                handleAlignElements(draft, 'middle');
            });

            const slideId = state.editor.activeSlideId;
            const elements = state.slides[slideId].elements;

            const middle1 = elements['el-1'].y + elements['el-1'].height / 2;
            const middle2 = elements['el-2'].y + elements['el-2'].height / 2;
            const middle3 = elements['el-3'].y + elements['el-3'].height / 2;

            expect(middle1).toBe(middle2);
            expect(middle2).toBe(middle3);
        });
    });

    describe('handleDistributeElements()', () => {
        let stateWithElements;

        beforeEach(() => {
            stateWithElements = produce(initialState, draft => {
                handleAddElement(draft, { id: 'el-1', type: 'rect', x: 0, y: 0, width: 50, height: 50 });
                handleAddElement(draft, { id: 'el-2', type: 'rect', x: 100, y: 100, width: 50, height: 50 });
                handleAddElement(draft, { id: 'el-3', type: 'rect', x: 300, y: 300, width: 50, height: 50 });
                draft.editor.selectedElementIds = ['el-1', 'el-2', 'el-3'];
            });
        });

        it('should distribute elements horizontally', () => {
            const state = produce(stateWithElements, draft => {
                handleDistributeElements(draft, 'horizontal');
            });

            const slideId = state.editor.activeSlideId;
            const elements = state.slides[slideId].elements;

            // First and last elements stay in place
            // Middle elements are evenly distributed
            expect(elements['el-1'].x).toBe(0); // First stays
            expect(elements['el-3'].x).toBe(300); // Last stays
        });

        it('should distribute elements vertically', () => {
            const state = produce(stateWithElements, draft => {
                handleDistributeElements(draft, 'vertical');
            });

            const slideId = state.editor.activeSlideId;
            const elements = state.slides[slideId].elements;

            // First and last elements stay in place
            expect(elements['el-1'].y).toBe(0); // First stays
            expect(elements['el-3'].y).toBe(300); // Last stays
        });

        it('should require at least 3 elements', () => {
            const twoElementState = produce(initialState, draft => {
                handleAddElement(draft, { id: 'el-1', type: 'rect', x: 0, y: 0, width: 50, height: 50 });
                handleAddElement(draft, { id: 'el-2', type: 'rect', x: 100, y: 100, width: 50, height: 50 });
                draft.editor.selectedElementIds = ['el-1', 'el-2'];
            });

            const originalEl2X = 100;

            const state = produce(twoElementState, draft => {
                handleDistributeElements(draft, 'horizontal');
            });

            // Should not modify with < 3 elements
            const slideId = state.editor.activeSlideId;
            expect(state.slides[slideId].elements['el-2'].x).toBe(originalEl2X);
        });
    });

    describe('handleToggleElementLock()', () => {
        it('should lock an unlocked element', () => {
            let state = produce(initialState, draft => {
                handleAddElement(draft, { id: 'el-1', type: 'rect', x: 0, y: 0, width: 50, height: 50, locked: false });
            });

            state = produce(state, draft => {
                handleToggleElementLock(draft, { id: 'el-1' });
            });

            const slideId = state.editor.activeSlideId;
            expect(state.slides[slideId].elements['el-1'].locked).toBe(true);
        });

        it('should unlock a locked element', () => {
            let state = produce(initialState, draft => {
                handleAddElement(draft, { id: 'el-1', type: 'rect', x: 0, y: 0, width: 50, height: 50, locked: true });
            });

            state = produce(state, draft => {
                handleToggleElementLock(draft, { id: 'el-1' });
            });

            const slideId = state.editor.activeSlideId;
            expect(state.slides[slideId].elements['el-1'].locked).toBe(false);
        });
    });

    describe('handleToggleElementVisibility()', () => {
        it('should hide a visible element', () => {
            let state = produce(initialState, draft => {
                handleAddElement(draft, { id: 'el-1', type: 'rect', x: 0, y: 0, width: 50, height: 50, hidden: false });
            });

            state = produce(state, draft => {
                handleToggleElementVisibility(draft, { id: 'el-1' });
            });

            const slideId = state.editor.activeSlideId;
            expect(state.slides[slideId].elements['el-1'].hidden).toBe(true);
        });

        it('should show a hidden element', () => {
            let state = produce(initialState, draft => {
                handleAddElement(draft, { id: 'el-1', type: 'rect', x: 0, y: 0, width: 50, height: 50, hidden: true });
            });

            state = produce(state, draft => {
                handleToggleElementVisibility(draft, { id: 'el-1' });
            });

            const slideId = state.editor.activeSlideId;
            expect(state.slides[slideId].elements['el-1'].hidden).toBe(false);
        });
    });

    describe('handleInstantiatePlaceholder()', () => {
        it('should instantiate a placeholder element and keep isPlaceholder flag', () => {
            const element = {
                id: 'text-1',
                type: 'text',
                x: 100,
                y: 100,
                width: 500,
                height: 200,
                content: 'Hello World',
                isPlaceholder: true
            };

            const newState = produce(initialState, draft => {
                handleInstantiatePlaceholder(draft, { 
                    placeholderId: 'placeholder-title', 
                    element 
                });
            });

            const slideId = newState.editor.activeSlideId;
            const instantiated = newState.slides[slideId].elements['text-1'];
            
            expect(instantiated).toBeDefined();
            // isPlaceholder is now preserved for proper placeholder handling
            expect(instantiated.isPlaceholder).toBe(true);
        });

        it('should select instantiated element', () => {
            const element = {
                id: 'text-1',
                type: 'text',
                x: 100,
                y: 100,
                width: 500,
                height: 200
            };

            const newState = produce(initialState, draft => {
                handleInstantiatePlaceholder(draft, { 
                    placeholderId: 'placeholder-title', 
                    element 
                });
            });

            expect(newState.editor.selectedElementIds).toContain('text-1');
        });

        it('should NOT enter edit mode immediately (requires double-click)', () => {
            const element = {
                id: 'text-1',
                type: 'text',
                x: 100,
                y: 100,
                width: 500,
                height: 200
            };

            const newState = produce(initialState, draft => {
                handleInstantiatePlaceholder(draft, { 
                    placeholderId: 'placeholder-title', 
                    element 
                });
            });

            // First click should only select, not enter edit mode
            expect(newState.editor.editingElementId).toBeNull();
        });
        
        it('should add element to elementOrder', () => {
            const element = {
                id: 'placeholder-title',
                type: 'text',
                isPlaceholder: true,
                x: 100,
                y: 100,
                width: 500,
                height: 200
            };

            const newState = produce(initialState, draft => {
                handleInstantiatePlaceholder(draft, { 
                    placeholderId: 'placeholder-title', 
                    element 
                });
            });

            expect(newState.slides['slide-1'].elementOrder).toContain('placeholder-title');
        });
    });
});

