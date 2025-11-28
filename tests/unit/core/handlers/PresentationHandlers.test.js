/**
 * PresentationHandlers Unit Tests
 * 
 * Tests the pure handler functions for presentation mode.
 * These handlers modify Immer draft state directly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { produce } from '../../../../src/vendor/immer.js';
import {
    handlePresentationNext,
    handlePresentationPrev,
    handlePresentationGoto,
    handleNextBuild,
    handlePrevBuild,
    handleSetBuildCount,
    handleToggleLaser,
    handleToggleBlackScreen,
    handleToggleWhiteScreen,
    handleToggleGridView
} from '../../../../src/core/store/handlers/PresentationHandlers.js';
import { createInitialState } from '../../../../src/core/store/InitialState.js';

describe('PresentationHandlers', () => {
    let initialState;

    beforeEach(() => {
        initialState = createInitialState();
        // Add extra slides for navigation tests
        initialState = produce(initialState, draft => {
            draft.slides['slide-2'] = { id: 'slide-2', title: 'Slide 2' };
            draft.slides['slide-3'] = { id: 'slide-3', title: 'Slide 3' };
            draft.slideOrder.push('slide-2', 'slide-3');
            draft.presentation.isActive = true;
            draft.presentation.currentSlideIndex = 0;
        });
    });

    describe('handlePresentationNext()', () => {
        it('should move to next slide', () => {
            const newState = produce(initialState, draft => {
                handlePresentationNext(draft);
            });

            expect(newState.presentation.currentSlideIndex).toBe(1);
        });

        it('should update activeSlideId to next slide', () => {
            const newState = produce(initialState, draft => {
                handlePresentationNext(draft);
            });

            expect(newState.editor.activeSlideId).toBe('slide-2');
        });

        it('should reset build index when moving to next slide', () => {
            let state = produce(initialState, draft => {
                draft.presentation.buildIndex = 2;
                draft.presentation.buildCount = 5;
            });

            state = produce(state, draft => {
                handlePresentationNext(draft);
            });

            expect(state.presentation.buildIndex).toBe(-1);
            expect(state.presentation.buildCount).toBe(0);
        });

        it('should not move past last slide', () => {
            let state = produce(initialState, draft => {
                draft.presentation.currentSlideIndex = 2; // Last slide
            });

            state = produce(state, draft => {
                handlePresentationNext(draft);
            });

            expect(state.presentation.currentSlideIndex).toBe(2);
        });

        it('should navigate through all slides sequentially', () => {
            let state = initialState;

            // First -> Second
            state = produce(state, draft => {
                handlePresentationNext(draft);
            });
            expect(state.presentation.currentSlideIndex).toBe(1);

            // Second -> Third
            state = produce(state, draft => {
                handlePresentationNext(draft);
            });
            expect(state.presentation.currentSlideIndex).toBe(2);

            // Third -> Still Third (last)
            state = produce(state, draft => {
                handlePresentationNext(draft);
            });
            expect(state.presentation.currentSlideIndex).toBe(2);
        });
    });

    describe('handlePresentationPrev()', () => {
        it('should move to previous slide', () => {
            let state = produce(initialState, draft => {
                draft.presentation.currentSlideIndex = 1;
                draft.editor.activeSlideId = 'slide-2';
            });

            state = produce(state, draft => {
                handlePresentationPrev(draft);
            });

            expect(state.presentation.currentSlideIndex).toBe(0);
        });

        it('should update activeSlideId to previous slide', () => {
            let state = produce(initialState, draft => {
                draft.presentation.currentSlideIndex = 1;
                draft.editor.activeSlideId = 'slide-2';
            });

            state = produce(state, draft => {
                handlePresentationPrev(draft);
            });

            expect(state.editor.activeSlideId).toBe(initialState.slideOrder[0]);
        });

        it('should reset build index when moving to previous slide', () => {
            let state = produce(initialState, draft => {
                draft.presentation.currentSlideIndex = 1;
                draft.presentation.buildIndex = 2;
                draft.presentation.buildCount = 5;
            });

            state = produce(state, draft => {
                handlePresentationPrev(draft);
            });

            expect(state.presentation.buildIndex).toBe(-1);
            expect(state.presentation.buildCount).toBe(0);
        });

        it('should not move before first slide', () => {
            const newState = produce(initialState, draft => {
                handlePresentationPrev(draft);
            });

            expect(newState.presentation.currentSlideIndex).toBe(0);
        });
    });

    describe('handlePresentationGoto()', () => {
        it('should go to specific slide by index', () => {
            const newState = produce(initialState, draft => {
                handlePresentationGoto(draft, 2);
            });

            expect(newState.presentation.currentSlideIndex).toBe(2);
        });

        it('should update activeSlideId', () => {
            const newState = produce(initialState, draft => {
                handlePresentationGoto(draft, 1);
            });

            expect(newState.editor.activeSlideId).toBe('slide-2');
        });

        it('should reset build state', () => {
            let state = produce(initialState, draft => {
                draft.presentation.buildIndex = 3;
                draft.presentation.buildCount = 5;
            });

            state = produce(state, draft => {
                handlePresentationGoto(draft, 2);
            });

            expect(state.presentation.buildIndex).toBe(-1);
            expect(state.presentation.buildCount).toBe(0);
        });

        it('should not navigate to negative index', () => {
            const newState = produce(initialState, draft => {
                handlePresentationGoto(draft, -1);
            });

            expect(newState.presentation.currentSlideIndex).toBe(0);
        });

        it('should not navigate beyond slide count', () => {
            const newState = produce(initialState, draft => {
                handlePresentationGoto(draft, 100);
            });

            expect(newState.presentation.currentSlideIndex).toBe(0);
        });

        it('should navigate to first slide (index 0)', () => {
            let state = produce(initialState, draft => {
                draft.presentation.currentSlideIndex = 2;
            });

            state = produce(state, draft => {
                handlePresentationGoto(draft, 0);
            });

            expect(state.presentation.currentSlideIndex).toBe(0);
        });
    });

    describe('handleNextBuild()', () => {
        it('should increment build index', () => {
            let state = produce(initialState, draft => {
                draft.presentation.buildIndex = 0;
                draft.presentation.buildCount = 3;
            });

            state = produce(state, draft => {
                handleNextBuild(draft);
            });

            expect(state.presentation.buildIndex).toBe(1);
        });

        it('should not exceed buildCount - 1', () => {
            let state = produce(initialState, draft => {
                draft.presentation.buildIndex = 2;
                draft.presentation.buildCount = 3;
            });

            state = produce(state, draft => {
                handleNextBuild(draft);
            });

            expect(state.presentation.buildIndex).toBe(2);
        });

        it('should increment from -1 to 0', () => {
            let state = produce(initialState, draft => {
                draft.presentation.buildIndex = -1;
                draft.presentation.buildCount = 3;
            });

            state = produce(state, draft => {
                handleNextBuild(draft);
            });

            expect(state.presentation.buildIndex).toBe(0);
        });

        it('should not change when buildCount is 0', () => {
            let state = produce(initialState, draft => {
                draft.presentation.buildIndex = -1;
                draft.presentation.buildCount = 0;
            });

            state = produce(state, draft => {
                handleNextBuild(draft);
            });

            expect(state.presentation.buildIndex).toBe(-1);
        });
    });

    describe('handlePrevBuild()', () => {
        it('should decrement build index', () => {
            let state = produce(initialState, draft => {
                draft.presentation.buildIndex = 2;
                draft.presentation.buildCount = 3;
            });

            state = produce(state, draft => {
                handlePrevBuild(draft);
            });

            expect(state.presentation.buildIndex).toBe(1);
        });

        it('should decrement to -1', () => {
            let state = produce(initialState, draft => {
                draft.presentation.buildIndex = 0;
                draft.presentation.buildCount = 3;
            });

            state = produce(state, draft => {
                handlePrevBuild(draft);
            });

            expect(state.presentation.buildIndex).toBe(-1);
        });

        it('should not go below -1', () => {
            let state = produce(initialState, draft => {
                draft.presentation.buildIndex = -1;
                draft.presentation.buildCount = 3;
            });

            state = produce(state, draft => {
                handlePrevBuild(draft);
            });

            expect(state.presentation.buildIndex).toBe(-1);
        });
    });

    describe('handleSetBuildCount()', () => {
        it('should set build count', () => {
            const newState = produce(initialState, draft => {
                handleSetBuildCount(draft, 5);
            });

            expect(newState.presentation.buildCount).toBe(5);
        });

        it('should set build count to 0', () => {
            let state = produce(initialState, draft => {
                draft.presentation.buildCount = 5;
            });

            state = produce(state, draft => {
                handleSetBuildCount(draft, 0);
            });

            expect(state.presentation.buildCount).toBe(0);
        });
    });

    describe('handleToggleLaser()', () => {
        it('should enable laser pointer', () => {
            const newState = produce(initialState, draft => {
                handleToggleLaser(draft);
            });

            expect(newState.presentation.laserPointer).toBe(true);
        });

        it('should disable laser pointer', () => {
            let state = produce(initialState, draft => {
                draft.presentation.laserPointer = true;
            });

            state = produce(state, draft => {
                handleToggleLaser(draft);
            });

            expect(state.presentation.laserPointer).toBe(false);
        });

        it('should toggle multiple times', () => {
            let state = initialState;

            state = produce(state, draft => {
                handleToggleLaser(draft);
            });
            expect(state.presentation.laserPointer).toBe(true);

            state = produce(state, draft => {
                handleToggleLaser(draft);
            });
            expect(state.presentation.laserPointer).toBe(false);

            state = produce(state, draft => {
                handleToggleLaser(draft);
            });
            expect(state.presentation.laserPointer).toBe(true);
        });
    });

    describe('handleToggleBlackScreen()', () => {
        it('should enable black screen', () => {
            const newState = produce(initialState, draft => {
                handleToggleBlackScreen(draft);
            });

            expect(newState.presentation.blackScreen).toBe(true);
        });

        it('should disable black screen', () => {
            let state = produce(initialState, draft => {
                draft.presentation.blackScreen = true;
            });

            state = produce(state, draft => {
                handleToggleBlackScreen(draft);
            });

            expect(state.presentation.blackScreen).toBe(false);
        });

        it('should disable white screen when enabling black screen', () => {
            let state = produce(initialState, draft => {
                draft.presentation.whiteScreen = true;
            });

            state = produce(state, draft => {
                handleToggleBlackScreen(draft);
            });

            expect(state.presentation.blackScreen).toBe(true);
            expect(state.presentation.whiteScreen).toBe(false);
        });
    });

    describe('handleToggleWhiteScreen()', () => {
        it('should enable white screen', () => {
            const newState = produce(initialState, draft => {
                handleToggleWhiteScreen(draft);
            });

            expect(newState.presentation.whiteScreen).toBe(true);
        });

        it('should disable white screen', () => {
            let state = produce(initialState, draft => {
                draft.presentation.whiteScreen = true;
            });

            state = produce(state, draft => {
                handleToggleWhiteScreen(draft);
            });

            expect(state.presentation.whiteScreen).toBe(false);
        });

        it('should disable black screen when enabling white screen', () => {
            let state = produce(initialState, draft => {
                draft.presentation.blackScreen = true;
            });

            state = produce(state, draft => {
                handleToggleWhiteScreen(draft);
            });

            expect(state.presentation.whiteScreen).toBe(true);
            expect(state.presentation.blackScreen).toBe(false);
        });
    });

    describe('handleToggleGridView()', () => {
        it('should enable grid view', () => {
            const newState = produce(initialState, draft => {
                handleToggleGridView(draft);
            });

            expect(newState.presentation.gridView).toBe(true);
        });

        it('should disable grid view', () => {
            let state = produce(initialState, draft => {
                draft.presentation.gridView = true;
            });

            state = produce(state, draft => {
                handleToggleGridView(draft);
            });

            expect(state.presentation.gridView).toBe(false);
        });
    });

    describe('Screen overlays mutual exclusion', () => {
        it('black and white screens should be mutually exclusive', () => {
            // Start with black screen
            let state = produce(initialState, draft => {
                handleToggleBlackScreen(draft);
            });
            expect(state.presentation.blackScreen).toBe(true);
            expect(state.presentation.whiteScreen).toBe(false);

            // Enable white screen should disable black
            state = produce(state, draft => {
                handleToggleWhiteScreen(draft);
            });
            expect(state.presentation.blackScreen).toBe(false);
            expect(state.presentation.whiteScreen).toBe(true);

            // Enable black screen should disable white
            state = produce(state, draft => {
                handleToggleBlackScreen(draft);
            });
            expect(state.presentation.blackScreen).toBe(true);
            expect(state.presentation.whiteScreen).toBe(false);
        });
    });
});
