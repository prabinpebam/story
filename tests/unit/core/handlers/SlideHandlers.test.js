/**
 * SlideHandlers Unit Tests
 * 
 * Tests the pure handler functions for slide management including
 * add, delete, duplicate, reorder, and layout change operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { produce } from '../../../../src/vendor/immer.js';
import {
    handleAddSlide,
    handleDeleteSlide,
    handleDuplicateSlide,
    handlePasteSlide,
    handleReorderSlides,
    handleUpdateSlide
} from '../../../../src/core/store/handlers/SlideHandlers.js';
import { createInitialState } from '../../../../src/core/store/InitialState.js';

describe('SlideHandlers', () => {
    let initialState;

    beforeEach(() => {
        initialState = createInitialState();
    });

    describe('handleAddSlide()', () => {
        it('should add a new slide', () => {
            const initialSlideCount = initialState.slideOrder.length;
            
            const newState = produce(initialState, draft => {
                handleAddSlide(draft);
            });

            expect(newState.slideOrder.length).toBe(initialSlideCount + 1);
        });

        it('should add slide to slideOrder array', () => {
            const newState = produce(initialState, draft => {
                handleAddSlide(draft);
            });

            const newSlideId = newState.slideOrder[newState.slideOrder.length - 1];
            expect(newState.slides[newSlideId]).toBeDefined();
        });

        it('should set new slide as active', () => {
            const newState = produce(initialState, draft => {
                handleAddSlide(draft);
            });

            const newSlideId = newState.slideOrder[newState.slideOrder.length - 1];
            expect(newState.editor.activeSlideId).toBe(newSlideId);
        });

        it('should create slide with default properties', () => {
            const newState = produce(initialState, draft => {
                handleAddSlide(draft);
            });

            const newSlideId = newState.slideOrder[newState.slideOrder.length - 1];
            const newSlide = newState.slides[newSlideId];

            expect(newSlide.layoutId).toBe('layout-blank');
            expect(newSlide.width).toBe(1920);
            expect(newSlide.height).toBe(1080);
            expect(newSlide.elements).toEqual({});
            expect(newSlide.elementOrder).toEqual([]);
            expect(newSlide.transition).toBe('magic');
        });

        it('should generate slide IDs based on timestamp', () => {
            let state = initialState;

            state = produce(state, draft => {
                handleAddSlide(draft);
            });

            const newSlideId = state.slideOrder[state.slideOrder.length - 1];
            // Slide IDs should start with 'slide-' and have a timestamp
            expect(newSlideId).toMatch(/^slide-\d+$/);
        });

        it('should generate different IDs for slides added with delay', async () => {
            let state = initialState;
            const ids = new Set();

            // Add first slide
            state = produce(state, draft => {
                handleAddSlide(draft);
            });
            ids.add(state.slideOrder[state.slideOrder.length - 1]);

            // Wait a bit to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 5));

            // Add second slide
            state = produce(state, draft => {
                handleAddSlide(draft);
            });
            ids.add(state.slideOrder[state.slideOrder.length - 1]);

            expect(ids.size).toBe(2);
        });
    });

    describe('handleDeleteSlide()', () => {
        it('should delete specified slide', () => {
            // Add a second slide first
            let state = produce(initialState, draft => {
                handleAddSlide(draft);
            });

            const slideToDelete = state.slideOrder[0];
            
            state = produce(state, draft => {
                handleDeleteSlide(draft, slideToDelete);
            });

            expect(state.slides[slideToDelete]).toBeUndefined();
            expect(state.slideOrder).not.toContain(slideToDelete);
        });

        it('should not delete the last remaining slide', () => {
            // Create a state with only one slide to test "cannot delete last slide" behavior
            let singleSlideState = produce(initialState, draft => {
                const firstSlideId = draft.slideOrder[0];
                // Delete all slides except the first one
                const slidesToDelete = draft.slideOrder.slice(1);
                slidesToDelete.forEach(slideId => {
                    delete draft.slides[slideId];
                });
                draft.slideOrder = [firstSlideId];
            });
            
            const slideId = singleSlideState.slideOrder[0];
            
            const newState = produce(singleSlideState, draft => {
                handleDeleteSlide(draft, slideId);
            });

            expect(newState.slideOrder.length).toBe(1);
            expect(newState.slides[slideId]).toBeDefined();
        });

        it('should update activeSlideId when deleting active slide', () => {
            // Add slides
            let state = produce(initialState, draft => {
                handleAddSlide(draft);
                handleAddSlide(draft);
            });

            const slideToDelete = state.editor.activeSlideId;
            
            state = produce(state, draft => {
                handleDeleteSlide(draft, slideToDelete);
            });

            expect(state.editor.activeSlideId).not.toBe(slideToDelete);
            expect(state.slideOrder).toContain(state.editor.activeSlideId);
        });

        it('should set previous slide as active when deleting', () => {
            let state = produce(initialState, draft => {
                handleAddSlide(draft);
            });

            const firstSlide = state.slideOrder[0];
            const secondSlide = state.slideOrder[1];
            
            // Make second slide active
            state = produce(state, draft => {
                draft.editor.activeSlideId = secondSlide;
            });

            // Delete second slide
            state = produce(state, draft => {
                handleDeleteSlide(draft, secondSlide);
            });

            expect(state.editor.activeSlideId).toBe(firstSlide);
        });

        it('should handle deleting non-existent slide', () => {
            const newState = produce(initialState, draft => {
                handleDeleteSlide(draft, 'non-existent-slide');
            });

            // Should not throw and state should remain unchanged
            expect(newState.slideOrder).toEqual(initialState.slideOrder);
        });
    });

    describe('handleDuplicateSlide()', () => {
        it('should create a copy of the slide', () => {
            const sourceId = initialState.slideOrder[0];
            const initialCount = initialState.slideOrder.length;
            
            const newState = produce(initialState, draft => {
                handleDuplicateSlide(draft, sourceId);
            });

            expect(newState.slideOrder.length).toBe(initialCount + 1);
        });

        it('should copy slide content', () => {
            const sourceId = initialState.slideOrder[0];
            const sourceSlide = initialState.slides[sourceId];
            
            const newState = produce(initialState, draft => {
                handleDuplicateSlide(draft, sourceId);
            });

            const duplicateId = newState.slideOrder[1];
            const duplicateSlide = newState.slides[duplicateId];

            expect(duplicateSlide.layoutId).toBe(sourceSlide.layoutId);
            expect(Object.keys(duplicateSlide.elements).length).toBe(Object.keys(sourceSlide.elements).length);
        });

        it('should add "(Copy)" to duplicate title', () => {
            const sourceId = initialState.slideOrder[0];
            const sourceSlide = initialState.slides[sourceId];
            
            const newState = produce(initialState, draft => {
                handleDuplicateSlide(draft, sourceId);
            });

            const duplicateId = newState.slideOrder[1];
            expect(newState.slides[duplicateId].title).toBe(`${sourceSlide.title} (Copy)`);
        });

        it('should insert duplicate after source slide', () => {
            // Add more slides
            let state = produce(initialState, draft => {
                handleAddSlide(draft);
                handleAddSlide(draft);
            });

            const sourceIndex = 0;
            const sourceId = state.slideOrder[sourceIndex];
            
            state = produce(state, draft => {
                handleDuplicateSlide(draft, sourceId);
            });

            // Duplicate should be at index 1 (right after source)
            const sourceNewIndex = state.slideOrder.indexOf(sourceId);
            const duplicateIndex = sourceNewIndex + 1;
            expect(state.slides[state.slideOrder[duplicateIndex]].title).toContain('(Copy)');
        });

        it('should set duplicate as active slide', () => {
            const sourceId = initialState.slideOrder[0];
            
            const newState = produce(initialState, draft => {
                handleDuplicateSlide(draft, sourceId);
            });

            const duplicateId = newState.slideOrder[1];
            expect(newState.editor.activeSlideId).toBe(duplicateId);
        });

        it('should handle duplicating non-existent slide', () => {
            const newState = produce(initialState, draft => {
                handleDuplicateSlide(draft, 'non-existent');
            });

            expect(newState.slideOrder.length).toBe(initialState.slideOrder.length);
        });
    });

    describe('handlePasteSlide()', () => {
        it('should paste slide after target', () => {
            const sourceId = initialState.slideOrder[0];
            const initialLength = initialState.slideOrder.length;
            
            const newState = produce(initialState, draft => {
                handlePasteSlide(draft, { sourceId, targetId: sourceId });
            });

            expect(newState.slideOrder.length).toBe(initialLength + 1);
        });

        it('should copy content from source slide', () => {
            const sourceId = initialState.slideOrder[0];
            const sourceSlide = initialState.slides[sourceId];
            
            const newState = produce(initialState, draft => {
                handlePasteSlide(draft, { sourceId, targetId: sourceId });
            });

            const pastedId = newState.slideOrder[1];
            const pastedSlide = newState.slides[pastedId];

            expect(pastedSlide.layoutId).toBe(sourceSlide.layoutId);
        });

        it('should set pasted slide as active', () => {
            const sourceId = initialState.slideOrder[0];
            
            const newState = produce(initialState, draft => {
                handlePasteSlide(draft, { sourceId, targetId: sourceId });
            });

            const pastedId = newState.slideOrder[1];
            expect(newState.editor.activeSlideId).toBe(pastedId);
        });

        it('should append to end if target not found', () => {
            const sourceId = initialState.slideOrder[0];
            const initialLength = initialState.slideOrder.length;
            
            const newState = produce(initialState, draft => {
                handlePasteSlide(draft, { sourceId, targetId: 'non-existent' });
            });

            expect(newState.slideOrder.length).toBe(initialLength + 1);
            // Should be appended at the end
            const pastedId = newState.slideOrder[newState.slideOrder.length - 1];
            expect(newState.slides[pastedId].title).toContain('(Copy)');
        });
    });

    describe('handleReorderSlides()', () => {
        it('should move slide from one position to another', () => {
            // Add more slides
            let state = produce(initialState, draft => {
                handleAddSlide(draft);
                handleAddSlide(draft);
            });

            const originalFirst = state.slideOrder[0];
            
            state = produce(state, draft => {
                handleReorderSlides(draft, { fromIndex: 0, toIndex: 2 });
            });

            expect(state.slideOrder[2]).toBe(originalFirst);
        });

        it('should handle moving to same position', () => {
            let state = produce(initialState, draft => {
                handleAddSlide(draft);
            });

            const originalOrder = [...state.slideOrder];
            
            state = produce(state, draft => {
                handleReorderSlides(draft, { fromIndex: 0, toIndex: 0 });
            });

            expect(state.slideOrder).toEqual(originalOrder);
        });

        it('should handle invalid fromIndex', () => {
            const originalOrder = [...initialState.slideOrder];
            
            const newState = produce(initialState, draft => {
                handleReorderSlides(draft, { fromIndex: -1, toIndex: 0 });
            });

            expect(newState.slideOrder).toEqual(originalOrder);
        });

        it('should handle invalid toIndex', () => {
            const originalOrder = [...initialState.slideOrder];
            
            const newState = produce(initialState, draft => {
                handleReorderSlides(draft, { fromIndex: 0, toIndex: 100 });
            });

            expect(newState.slideOrder).toEqual(originalOrder);
        });

        it('should handle out of bounds indices', () => {
            let state = produce(initialState, draft => {
                handleAddSlide(draft);
            });

            const originalOrder = [...state.slideOrder];
            
            state = produce(state, draft => {
                handleReorderSlides(draft, { fromIndex: 10, toIndex: 0 });
            });

            expect(state.slideOrder).toEqual(originalOrder);
        });
    });

    describe('handleUpdateSlide()', () => {
        it('should update slide title', () => {
            const slideId = initialState.slideOrder[0];
            
            const newState = produce(initialState, draft => {
                handleUpdateSlide(draft, { id: slideId, title: 'New Title' });
            });

            expect(newState.slides[slideId].title).toBe('New Title');
        });

        it('should update slide background', () => {
            const slideId = initialState.slideOrder[0];
            const newBackground = { type: 'solid', value: '#ff0000' };
            
            const newState = produce(initialState, draft => {
                handleUpdateSlide(draft, { id: slideId, background: newBackground });
            });

            expect(newState.slides[slideId].background).toEqual(newBackground);
        });

        it('should update slide notes', () => {
            const slideId = initialState.slideOrder[0];
            
            const newState = produce(initialState, draft => {
                handleUpdateSlide(draft, { id: slideId, notes: 'Speaker notes here' });
            });

            expect(newState.slides[slideId].notes).toBe('Speaker notes here');
        });

        it('should update slide transition', () => {
            const slideId = initialState.slideOrder[0];
            
            const newState = produce(initialState, draft => {
                handleUpdateSlide(draft, { id: slideId, transition: 'fade' });
            });

            expect(newState.slides[slideId].transition).toBe('fade');
        });

        it('should update multiple properties at once', () => {
            const slideId = initialState.slideOrder[0];
            
            const newState = produce(initialState, draft => {
                handleUpdateSlide(draft, { 
                    id: slideId, 
                    title: 'Updated',
                    notes: 'Notes',
                    transition: 'slide'
                });
            });

            expect(newState.slides[slideId].title).toBe('Updated');
            expect(newState.slides[slideId].notes).toBe('Notes');
            expect(newState.slides[slideId].transition).toBe('slide');
        });

        it('should handle updating non-existent slide', () => {
            const newState = produce(initialState, draft => {
                handleUpdateSlide(draft, { id: 'non-existent', title: 'Test' });
            });

            // Should not throw or modify state
            expect(newState.slides['non-existent']).toBeUndefined();
        });

        it('should change layout and trigger content remapping', () => {
            const slideId = initialState.slideOrder[0];
            
            const newState = produce(initialState, draft => {
                handleUpdateSlide(draft, { id: slideId, layoutId: 'layout-blank' });
            });

            expect(newState.slides[slideId].layoutId).toBe('layout-blank');
        });
    });
});
