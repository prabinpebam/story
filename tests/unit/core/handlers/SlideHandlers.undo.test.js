/**
 * SlideHandlers Undo/Redo Tests
 * 
 * Tests that all slide operations are properly integrated with the undo/redo system.
 * This ensures compliance with Phase 0 requirements: all operations must be undoable.
 * 
 * Test Pattern:
 * 1. Perform action
 * 2. Verify action succeeded
 * 3. Dispatch UNDO
 * 4. Verify state restored to before action
 * 5. Dispatch REDO
 * 6. Verify state matches after action
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { store } from '../../../../src/core/Store.js';
import { historyManager } from '../../../../src/core/HistoryManager.js';
import { createInitialState } from '../../../../src/core/store/InitialState.js';

describe('SlideHandlers - Undo/Redo Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset to clean initial state
        store.restoreState(createInitialState());
        // Clear history stacks
        historyManager.clear();
    });

    describe('ADD_SLIDE undo/redo', () => {
        it('should undo ADD_SLIDE operation', () => {
            const initialState = store.getState();
            const initialSlideCount = initialState.slideOrder.length;

            // Action: Add a slide
            store.dispatch('ADD_SLIDE');
            
            const afterAdd = store.getState();
            expect(afterAdd.slideOrder.length).toBe(initialSlideCount + 1);

            // Undo: Should remove the added slide
            store.dispatch('UNDO');
            
            const afterUndo = store.getState();
            expect(afterUndo.slideOrder.length).toBe(initialSlideCount);
            expect(afterUndo.slideOrder).toEqual(initialState.slideOrder);
        });

        it('should redo ADD_SLIDE operation', () => {
            const initialSlideCount = store.getState().slideOrder.length;

            // Action: Add a slide
            store.dispatch('ADD_SLIDE');
            const afterAdd = store.getState();
            const addedSlideId = afterAdd.slideOrder[afterAdd.slideOrder.length - 1];

            // Undo
            store.dispatch('UNDO');
            expect(store.getState().slideOrder.length).toBe(initialSlideCount);

            // Redo: Should restore the added slide
            store.dispatch('REDO');
            
            const afterRedo = store.getState();
            expect(afterRedo.slideOrder.length).toBe(initialSlideCount + 1);
            expect(afterRedo.slides[addedSlideId]).toBeDefined();
        });

        it('should handle multiple ADD_SLIDE operations with undo', () => {
            const initialCount = store.getState().slideOrder.length;

            // Add 3 slides
            store.dispatch('ADD_SLIDE');
            store.dispatch('ADD_SLIDE');
            store.dispatch('ADD_SLIDE');
            
            expect(store.getState().slideOrder.length).toBe(initialCount + 3);

            // Undo all 3
            store.dispatch('UNDO');
            expect(store.getState().slideOrder.length).toBe(initialCount + 2);
            
            store.dispatch('UNDO');
            expect(store.getState().slideOrder.length).toBe(initialCount + 1);
            
            store.dispatch('UNDO');
            expect(store.getState().slideOrder.length).toBe(initialCount);
        });
    });

    describe('DELETE_SLIDE undo/redo', () => {
        it('should undo DELETE_SLIDE operation', () => {
            // Setup: Add a slide to delete
            store.dispatch('ADD_SLIDE');
            const beforeDelete = store.getState();
            const slideToDelete = beforeDelete.slideOrder[beforeDelete.slideOrder.length - 1];
            const slideCount = beforeDelete.slideOrder.length;

            // Action: Delete the slide
            store.dispatch('DELETE_SLIDE', slideToDelete);
            
            const afterDelete = store.getState();
            expect(afterDelete.slideOrder.length).toBe(slideCount - 1);
            expect(afterDelete.slides[slideToDelete]).toBeUndefined();

            // Undo: Should restore the deleted slide
            store.dispatch('UNDO');
            
            const afterUndo = store.getState();
            expect(afterUndo.slideOrder.length).toBe(slideCount);
            expect(afterUndo.slides[slideToDelete]).toBeDefined();
            expect(afterUndo.slides[slideToDelete]).toEqual(beforeDelete.slides[slideToDelete]);
        });

        it('should redo DELETE_SLIDE operation', () => {
            // Setup: Add a slide to delete
            store.dispatch('ADD_SLIDE');
            const slideToDelete = store.getState().slideOrder[store.getState().slideOrder.length - 1];
            const slideCountBeforeDelete = store.getState().slideOrder.length;

            // Action: Delete
            store.dispatch('DELETE_SLIDE', slideToDelete);
            expect(store.getState().slideOrder.length).toBe(slideCountBeforeDelete - 1);

            // Undo
            store.dispatch('UNDO');
            expect(store.getState().slides[slideToDelete]).toBeDefined();

            // Redo: Should delete again
            store.dispatch('REDO');
            
            const afterRedo = store.getState();
            expect(afterRedo.slideOrder.length).toBe(slideCountBeforeDelete - 1);
            expect(afterRedo.slides[slideToDelete]).toBeUndefined();
        });

        it('should preserve slide content when undoing delete', () => {
            // Setup: Add a slide and modify it
            store.dispatch('ADD_SLIDE');
            const slideId = store.getState().slideOrder[store.getState().slideOrder.length - 1];
            
            store.dispatch('UPDATE_SLIDE', {
                id: slideId,
                title: 'Test Slide',
                notes: 'Test notes',
                background: { type: 'solid', value: '#FF0000' }
            });

            const beforeDelete = store.getState();
            const originalSlide = beforeDelete.slides[slideId];

            // Delete the slide
            store.dispatch('DELETE_SLIDE', slideId);
            expect(store.getState().slides[slideId]).toBeUndefined();

            // Undo: Should restore with all content
            store.dispatch('UNDO');
            
            const afterUndo = store.getState();
            expect(afterUndo.slides[slideId]).toBeDefined();
            expect(afterUndo.slides[slideId].title).toBe('Test Slide');
            expect(afterUndo.slides[slideId].notes).toBe('Test notes');
            expect(afterUndo.slides[slideId].background).toEqual({ type: 'solid', value: '#FF0000' });
        });
    });

    describe('DUPLICATE_SLIDE undo/redo', () => {
        it('should undo DUPLICATE_SLIDE operation', () => {
            const initialState = store.getState();
            const slideToDuplicate = initialState.slideOrder[0];
            const initialCount = initialState.slideOrder.length;

            // Action: Duplicate
            store.dispatch('DUPLICATE_SLIDE', slideToDuplicate);
            
            const afterDuplicate = store.getState();
            expect(afterDuplicate.slideOrder.length).toBe(initialCount + 1);

            // Undo: Should remove the duplicate
            store.dispatch('UNDO');
            
            const afterUndo = store.getState();
            expect(afterUndo.slideOrder.length).toBe(initialCount);
            expect(afterUndo.slideOrder).toEqual(initialState.slideOrder);
        });

        it('should redo DUPLICATE_SLIDE operation', () => {
            const slideToDuplicate = store.getState().slideOrder[0];
            const initialCount = store.getState().slideOrder.length;

            // Action: Duplicate
            store.dispatch('DUPLICATE_SLIDE', slideToDuplicate);
            const afterDuplicate = store.getState();
            const duplicateId = afterDuplicate.slideOrder[afterDuplicate.slideOrder.length - 1];

            // Undo
            store.dispatch('UNDO');
            expect(store.getState().slideOrder.length).toBe(initialCount);

            // Redo: Should restore the duplicate
            store.dispatch('REDO');
            
            const afterRedo = store.getState();
            expect(afterRedo.slideOrder.length).toBe(initialCount + 1);
            expect(afterRedo.slides[duplicateId]).toBeDefined();
        });

        it('should preserve duplicated content when undoing/redoing', () => {
            // Setup: Create a slide with content
            store.dispatch('ADD_SLIDE');
            const slideId = store.getState().slideOrder[store.getState().slideOrder.length - 1];
            
            store.dispatch('UPDATE_SLIDE', {
                id: slideId,
                title: 'Original Slide',
                notes: 'Original notes'
            });

            // Duplicate
            const beforeDup = store.getState();
            const slideCountBeforeDup = beforeDup.slideOrder.length;
            
            store.dispatch('DUPLICATE_SLIDE', slideId);
            const afterDup = store.getState();
            const duplicateId = afterDup.slideOrder[afterDup.slideOrder.length - 1];
            const slideIdsAfterDup = [...afterDup.slideOrder];
            
            expect(afterDup.slideOrder.length).toBe(slideCountBeforeDup + 1);
            expect(afterDup.slides[duplicateId].title).toContain('Original Slide');

            // Undo: Should remove the duplicate
            store.dispatch('UNDO');
            const afterUndo = store.getState();
            expect(afterUndo.slideOrder.length).toBe(slideCountBeforeDup);
            // Verify slide IDs match state before duplicate
            expect(afterUndo.slideOrder).toEqual(beforeDup.slideOrder);

            // Redo: Should restore the duplicate
            store.dispatch('REDO');
            const afterRedo = store.getState();
            expect(afterRedo.slideOrder.length).toBe(slideCountBeforeDup + 1);
            expect(afterRedo.slideOrder).toEqual(slideIdsAfterDup);
            // Find the duplicate slide (last in order)
            const redoDuplicateId = afterRedo.slideOrder[afterRedo.slideOrder.length - 1];
            expect(afterRedo.slides[redoDuplicateId].title).toContain('Original Slide');
        });
    });

    describe('REORDER_SLIDES undo/redo', () => {
        it('should undo REORDER_SLIDES operation', () => {
            // Setup: Add multiple slides
            store.dispatch('ADD_SLIDE');
            store.dispatch('ADD_SLIDE');
            store.dispatch('ADD_SLIDE');

            const beforeReorder = store.getState();
            const originalOrder = [...beforeReorder.slideOrder];

            // Action: Reorder (move first slide to last)
            store.dispatch('REORDER_SLIDES', { fromIndex: 0, toIndex: 3 });
            
            const afterReorder = store.getState();
            expect(afterReorder.slideOrder).not.toEqual(originalOrder);

            // Undo: Should restore original order
            store.dispatch('UNDO');
            
            const afterUndo = store.getState();
            expect(afterUndo.slideOrder).toEqual(originalOrder);
        });

        it('should redo REORDER_SLIDES operation', () => {
            // Setup: Add multiple slides
            store.dispatch('ADD_SLIDE');
            store.dispatch('ADD_SLIDE');
            
            const originalOrder = [...store.getState().slideOrder];

            // Action: Reorder
            store.dispatch('REORDER_SLIDES', { fromIndex: 0, toIndex: 2 });
            const reorderedState = [...store.getState().slideOrder];

            // Undo
            store.dispatch('UNDO');
            expect(store.getState().slideOrder).toEqual(originalOrder);

            // Redo: Should restore reordered state
            store.dispatch('REDO');
            expect(store.getState().slideOrder).toEqual(reorderedState);
        });

        it('should handle multiple reorder operations with undo', () => {
            // Setup: Add slides
            store.dispatch('ADD_SLIDE');
            store.dispatch('ADD_SLIDE');
            store.dispatch('ADD_SLIDE');

            const order1 = [...store.getState().slideOrder];

            // Reorder 1
            store.dispatch('REORDER_SLIDES', { fromIndex: 0, toIndex: 1 });
            const order2 = [...store.getState().slideOrder];

            // Reorder 2
            store.dispatch('REORDER_SLIDES', { fromIndex: 1, toIndex: 3 });
            const order3 = [...store.getState().slideOrder];

            expect(order3).not.toEqual(order2);

            // Undo second reorder
            store.dispatch('UNDO');
            expect(store.getState().slideOrder).toEqual(order2);

            // Undo first reorder
            store.dispatch('UNDO');
            expect(store.getState().slideOrder).toEqual(order1);

            // Redo first reorder
            store.dispatch('REDO');
            expect(store.getState().slideOrder).toEqual(order2);

            // Redo second reorder
            store.dispatch('REDO');
            expect(store.getState().slideOrder).toEqual(order3);
        });
    });

    describe('UPDATE_SLIDE undo/redo', () => {
        it('should undo UPDATE_SLIDE operation', () => {
            const slideId = store.getState().slideOrder[0];
            const beforeUpdate = store.getState();
            const originalSlide = { ...beforeUpdate.slides[slideId] };

            // Action: Update slide
            store.dispatch('UPDATE_SLIDE', {
                id: slideId,
                title: 'Updated Title',
                notes: 'Updated notes',
                background: { type: 'solid', value: '#00FF00' }
            });

            const afterUpdate = store.getState();
            expect(afterUpdate.slides[slideId].title).toBe('Updated Title');

            // Undo: Should restore original values
            store.dispatch('UNDO');
            
            const afterUndo = store.getState();
            expect(afterUndo.slides[slideId].title).toBe(originalSlide.title);
            expect(afterUndo.slides[slideId].notes).toBe(originalSlide.notes);
            expect(afterUndo.slides[slideId].background).toEqual(originalSlide.background);
        });

        it('should redo UPDATE_SLIDE operation', () => {
            const slideId = store.getState().slideOrder[0];

            // Action: Update
            store.dispatch('UPDATE_SLIDE', {
                id: slideId,
                title: 'New Title',
                transition: 'fade'
            });

            const afterUpdate = store.getState();
            expect(afterUpdate.slides[slideId].title).toBe('New Title');
            expect(afterUpdate.slides[slideId].transition).toBe('fade');

            // Undo
            store.dispatch('UNDO');
            const afterUndo = store.getState();
            expect(afterUndo.slides[slideId].title).not.toBe('New Title');

            // Redo: Should restore updated values
            store.dispatch('REDO');
            const afterRedo = store.getState();
            expect(afterRedo.slides[slideId].title).toBe('New Title');
            expect(afterRedo.slides[slideId].transition).toBe('fade');
        });

        it('should handle multiple UPDATE_SLIDE operations with undo', () => {
            const slideId = store.getState().slideOrder[0];

            // Update 1: Change title
            store.dispatch('UPDATE_SLIDE', {
                id: slideId,
                title: 'Title 1'
            });
            expect(store.getState().slides[slideId].title).toBe('Title 1');

            // Update 2: Change notes
            store.dispatch('UPDATE_SLIDE', {
                id: slideId,
                notes: 'Notes 2'
            });
            expect(store.getState().slides[slideId].notes).toBe('Notes 2');

            // Update 3: Change background
            store.dispatch('UPDATE_SLIDE', {
                id: slideId,
                background: { type: 'solid', value: '#FF0000' }
            });
            expect(store.getState().slides[slideId].background.value).toBe('#FF0000');

            // Undo update 3
            store.dispatch('UNDO');
            const bgAfterUndo3 = store.getState().slides[slideId].background;
            expect(bgAfterUndo3?.value).not.toBe('#FF0000');

            // Undo update 2
            store.dispatch('UNDO');
            expect(store.getState().slides[slideId].notes).not.toBe('Notes 2');

            // Undo update 1
            store.dispatch('UNDO');
            expect(store.getState().slides[slideId].title).not.toBe('Title 1');
        });
    });

    describe('UPDATE_SLIDE_STYLE_ASSIGNMENTS (slideTransition) undo/redo', () => {
        it('should undo/redo slideTransition override changes', () => {
            const slideId = store.getState().slideOrder[0];
            const before = store.getState();
            const initial = before.slides[slideId].styleAssignments?.slideTransition ?? null;

            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: {
                    slideTransition: { type: 'wipe', direction: 'right', durationMs: 300, easing: 'ease-in-out' }
                }
            });

            expect(store.getState().slides[slideId].styleAssignments?.slideTransition?.type).toBe('wipe');

            store.dispatch('UNDO');
            expect(store.getState().slides[slideId].styleAssignments?.slideTransition ?? null).toEqual(initial);

            store.dispatch('REDO');
            expect(store.getState().slides[slideId].styleAssignments?.slideTransition?.type).toBe('wipe');
        });

        it('should undo/redo reset-to-inherited (slideTransition = null)', () => {
            const slideId = store.getState().slideOrder[0];

            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: {
                    slideTransition: { type: 'push', direction: 'left', durationMs: 350, easing: 'ease-in-out' }
                }
            });
            expect(store.getState().slides[slideId].styleAssignments?.slideTransition?.type).toBe('push');

            store.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId,
                styleAssignments: { slideTransition: null }
            });
            expect(store.getState().slides[slideId].styleAssignments?.slideTransition).toBeNull();

            store.dispatch('UNDO');
            expect(store.getState().slides[slideId].styleAssignments?.slideTransition?.type).toBe('push');

            store.dispatch('REDO');
            expect(store.getState().slides[slideId].styleAssignments?.slideTransition).toBeNull();
        });
    });

    describe('UPDATE_SLIDES_STYLE_ASSIGNMENTS (bulk slideTransition) undo/redo', () => {
        it('should undo/redo bulk transition updates across multiple slides as a single step', () => {
            const initial = store.getState();
            const slideA = initial.slideOrder[0];

            // Create a second slide.
            store.dispatch('ADD_SLIDE');
            const afterAdd = store.getState();
            const slideB = afterAdd.slideOrder[afterAdd.slideOrder.length - 1];

            const beforeBulk = store.getState();
            const initialA = beforeBulk.slides[slideA].styleAssignments?.slideTransition ?? null;
            const initialB = beforeBulk.slides[slideB].styleAssignments?.slideTransition ?? null;

            store.dispatch('UPDATE_SLIDES_STYLE_ASSIGNMENTS', {
                slideIds: [slideA, slideB],
                styleAssignments: {
                    slideTransition: { type: 'cover', direction: 'right', durationMs: 300, easing: 'ease-in-out' }
                }
            });

            expect(store.getState().slides[slideA].styleAssignments?.slideTransition?.type).toBe('cover');
            expect(store.getState().slides[slideB].styleAssignments?.slideTransition?.type).toBe('cover');

            store.dispatch('UNDO');
            expect(store.getState().slides[slideA].styleAssignments?.slideTransition ?? null).toEqual(initialA);
            expect(store.getState().slides[slideB].styleAssignments?.slideTransition ?? null).toEqual(initialB);

            store.dispatch('REDO');
            expect(store.getState().slides[slideA].styleAssignments?.slideTransition?.type).toBe('cover');
            expect(store.getState().slides[slideB].styleAssignments?.slideTransition?.type).toBe('cover');
        });
    });

    describe('Complex undo/redo scenarios', () => {
        it('should handle mixed operations with undo/redo', () => {
            const initialCount = store.getState().slideOrder.length;

            // Operation 1: Add slide
            store.dispatch('ADD_SLIDE');
            expect(store.getState().slideOrder.length).toBe(initialCount + 1);

            // Operation 2: Add another slide
            store.dispatch('ADD_SLIDE');
            const slideId = store.getState().slideOrder[store.getState().slideOrder.length - 1];
            expect(store.getState().slideOrder.length).toBe(initialCount + 2);

            // Operation 3: Update the second slide
            store.dispatch('UPDATE_SLIDE', {
                id: slideId,
                title: 'Test'
            });
            expect(store.getState().slides[slideId].title).toBe('Test');

            // Operation 4: Duplicate the slide
            store.dispatch('DUPLICATE_SLIDE', slideId);
            expect(store.getState().slideOrder.length).toBe(initialCount + 3);

            // Undo 4: Remove duplicate
            store.dispatch('UNDO');
            expect(store.getState().slideOrder.length).toBe(initialCount + 2);

            // Undo 3: Revert title change
            store.dispatch('UNDO');
            expect(store.getState().slides[slideId].title).not.toBe('Test');

            // Undo 2: Remove second added slide
            store.dispatch('UNDO');
            expect(store.getState().slideOrder.length).toBe(initialCount + 1);

            // Undo 1: Remove first added slide
            store.dispatch('UNDO');
            expect(store.getState().slideOrder.length).toBe(initialCount);

            // Redo all
            store.dispatch('REDO'); // Add first slide
            store.dispatch('REDO'); // Add second slide
            store.dispatch('REDO'); // Update title
            store.dispatch('REDO'); // Duplicate
            
            expect(store.getState().slideOrder.length).toBe(initialCount + 3);
        });

        it('should clear redo stack when new action is performed after undo', () => {
            // Add two slides
            store.dispatch('ADD_SLIDE');
            store.dispatch('ADD_SLIDE');
            
            const countAfterAdd = store.getState().slideOrder.length;

            // Undo both
            store.dispatch('UNDO');
            store.dispatch('UNDO');

            // Verify we can redo
            expect(historyManager.canRedo()).toBe(true);

            // Perform new action (should clear redo stack)
            store.dispatch('ADD_SLIDE');

            // Redo should no longer be available
            expect(historyManager.canRedo()).toBe(false);
        });

        it('should maintain consistency across 10 operations', () => {
            const operations = [];

            // Track initial state
            operations.push({ 
                type: 'INITIAL', 
                slideCount: store.getState().slideOrder.length 
            });

            // Perform 10 random operations
            for (let i = 0; i < 10; i++) {
                const slideCount = store.getState().slideOrder.length;
                
                if (i % 3 === 0) {
                    store.dispatch('ADD_SLIDE');
                    operations.push({ type: 'ADD_SLIDE', expectedCount: slideCount + 1 });
                } else if (i % 3 === 1 && slideCount > 1) {
                    const slideId = store.getState().slideOrder[0];
                    store.dispatch('DUPLICATE_SLIDE', slideId);
                    operations.push({ type: 'DUPLICATE_SLIDE', expectedCount: slideCount + 1 });
                } else {
                    const slideId = store.getState().slideOrder[0];
                    store.dispatch('UPDATE_SLIDE', {
                        id: slideId,
                        title: `Title ${i}`
                    });
                    operations.push({ type: 'UPDATE_SLIDE', expectedCount: slideCount });
                }
            }

            // Verify final state
            const finalCount = store.getState().slideOrder.length;
            expect(finalCount).toBe(operations[operations.length - 1].expectedCount);

            // Undo all operations
            for (let i = operations.length - 1; i > 0; i--) {
                store.dispatch('UNDO');
                const currentCount = store.getState().slideOrder.length;
                expect(currentCount).toBe(operations[i - 1].expectedCount || operations[i - 1].slideCount);
            }

            // Redo all operations
            for (let i = 1; i < operations.length; i++) {
                store.dispatch('REDO');
                const currentCount = store.getState().slideOrder.length;
                expect(currentCount).toBe(operations[i].expectedCount);
            }
        });
    });

    describe('Edge cases', () => {
        it('should handle undo when history is empty', () => {
            // Clear history
            historyManager.clear();
            
            const stateBefore = store.getState();
            store.dispatch('UNDO');
            const stateAfter = store.getState();

            // State should not change
            expect(stateAfter).toEqual(stateBefore);
        });

        it('should handle redo when redo stack is empty', () => {
            const stateBefore = store.getState();
            store.dispatch('REDO');
            const stateAfter = store.getState();

            // State should not change
            expect(stateAfter).toEqual(stateBefore);
        });

        it('should respect history max size (50 operations)', () => {
            // Perform 60 operations
            for (let i = 0; i < 60; i++) {
                store.dispatch('ADD_SLIDE');
            }

            // Should only be able to undo 50 times (maxSize)
            let undoCount = 0;
            while (historyManager.canUndo() && undoCount < 100) {
                store.dispatch('UNDO');
                undoCount++;
            }

            // Should have undone exactly 50 operations
            expect(undoCount).toBe(50);
        });
    });
});
