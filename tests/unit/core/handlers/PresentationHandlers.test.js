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
    handlePresentationJumpTo,
    handlePresentationGoBack,
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
            const lastSlideIndex = initialState.slideOrder.length - 1;
            let state = produce(initialState, draft => {
                draft.presentation.currentSlideIndex = lastSlideIndex;
            });

            state = produce(state, draft => {
                handlePresentationNext(draft);
            });

            expect(state.presentation.currentSlideIndex).toBe(lastSlideIndex);
        });

        it('should navigate through all slides sequentially', () => {
            const lastSlideIndex = initialState.slideOrder.length - 1;
            let state = initialState;

            // First -> Second
            state = produce(state, draft => {
                handlePresentationNext(draft);
            });
            expect(state.presentation.currentSlideIndex).toBe(1);

            // Navigate to last slide
            for (let i = 1; i < lastSlideIndex; i++) {
                state = produce(state, draft => {
                    handlePresentationNext(draft);
                });
            }
            expect(state.presentation.currentSlideIndex).toBe(lastSlideIndex);

            // Try to go past last - should stay at last
            state = produce(state, draft => {
                handlePresentationNext(draft);
            });
            expect(state.presentation.currentSlideIndex).toBe(lastSlideIndex);
        });

        it('should set buildCount for the destination slide and enter pre-build (-1)', () => {
            const state = {
                slideOrder: ['slide-1', 'slide-2'],
                slides: {
                    'slide-1': { id: 'slide-1', title: 'Slide 1' },
                    'slide-2': { id: 'slide-2', title: 'Slide 2' }
                },
                editor: { activeSlideId: 'slide-1' },
                presentation: {
                    currentSlideIndex: 0,
                    buildIndex: 2,
                    buildCount: 3,
                    buildCountBySlideId: { 'slide-2': 4 }
                }
            };

            const nextState = produce(state, (draft) => {
                handlePresentationNext(draft);
            });

            expect(nextState.presentation.currentSlideIndex).toBe(1);
            expect(nextState.editor.activeSlideId).toBe('slide-2');
            expect(nextState.presentation.buildCount).toBe(4);
            expect(nextState.presentation.buildIndex).toBe(-1);
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

        it("should land on previous slide's last build when previous slide has builds", () => {
            const state = {
                slideOrder: ['slide-1', 'slide-2'],
                slides: {
                    'slide-1': { id: 'slide-1', title: 'Slide 1' },
                    'slide-2': { id: 'slide-2', title: 'Slide 2' }
                },
                editor: { activeSlideId: 'slide-2' },
                presentation: {
                    currentSlideIndex: 1,
                    buildIndex: -1,
                    buildCount: 0,
                    buildCountBySlideId: { 'slide-1': 5 }
                }
            };

            const prevState = produce(state, (draft) => {
                handlePresentationPrev(draft);
            });

            expect(prevState.presentation.currentSlideIndex).toBe(0);
            expect(prevState.editor.activeSlideId).toBe('slide-1');
            expect(prevState.presentation.buildCount).toBe(5);
            expect(prevState.presentation.buildIndex).toBe(4);
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

        it('should accept a payload with index and buildIndex (clamped)', () => {
            const state = produce(initialState, (draft) => {
                // Ensure destination slide has known build count via cache map.
                draft.presentation.buildCountBySlideId = { ...(draft.presentation.buildCountBySlideId || {}), 'slide-2': 4 };
            });

            const next = produce(state, (draft) => {
                handlePresentationGoto(draft, { index: 1, buildIndex: 10 });
            });

            expect(next.presentation.currentSlideIndex).toBe(1);
            expect(next.editor.activeSlideId).toBe('slide-2');
            expect(next.presentation.buildCount).toBe(4);
            expect(next.presentation.buildIndex).toBe(3);
        });

        it('should force buildIndex to -1 when destination slide has no builds', () => {
            const state = produce(initialState, (draft) => {
                draft.presentation.buildCountBySlideId = { ...(draft.presentation.buildCountBySlideId || {}), 'slide-3': 0 };
            });

            const slide3Index = state.slideOrder.indexOf('slide-3');
            expect(slide3Index).toBeGreaterThanOrEqual(0);

            const next = produce(state, (draft) => {
                handlePresentationGoto(draft, { index: slide3Index, buildIndex: 0 });
            });

            expect(next.presentation.currentSlideIndex).toBe(slide3Index);
            expect(next.editor.activeSlideId).toBe('slide-3');
            expect(next.presentation.buildCount).toBe(0);
            expect(next.presentation.buildIndex).toBe(-1);
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

        it('should set buildCount from buildCountBySlideId and enter pre-build state (-1)', () => {
            const state = {
                slideOrder: ['slide-1', 'slide-2'],
                slides: {
                    'slide-1': { id: 'slide-1', title: 'Slide 1' },
                    'slide-2': { id: 'slide-2', title: 'Slide 2' }
                },
                editor: { activeSlideId: 'slide-1' },
                presentation: {
                    currentSlideIndex: 0,
                    buildIndex: -1,
                    buildCount: 0,
                    buildCountBySlideId: { 'slide-2': 3 }
                }
            };

            const nextState = produce(state, (draft) => {
                handlePresentationGoto(draft, 1);
            });

            expect(nextState.presentation.currentSlideIndex).toBe(1);
            expect(nextState.editor.activeSlideId).toBe('slide-2');
            expect(nextState.presentation.buildCount).toBe(3);
            expect(nextState.presentation.buildIndex).toBe(-1);
        });
    });

    describe('handlePresentationJumpTo() + handlePresentationGoBack()', () => {
        it('should push current position to back stack and jump to target slide', () => {
            const baseState = {
                slideOrder: ['slide-1', 'slide-2', 'slide-3'],
                slides: {
                    'slide-1': { id: 'slide-1', title: 'Slide 1' },
                    'slide-2': { id: 'slide-2', title: 'Slide 2' },
                    'slide-3': { id: 'slide-3', title: 'Slide 3' }
                },
                editor: { activeSlideId: 'slide-1' },
                presentation: {
                    currentSlideIndex: 0,
                    buildIndex: 1,
                    buildCount: 3,
                    backStack: []
                }
            };

            let state = baseState;

            state = produce(state, draft => {
                handlePresentationJumpTo(draft, { index: 2 });
            });

            expect(state.presentation.currentSlideIndex).toBe(2);
            expect(state.editor.activeSlideId).toBe('slide-3');
            expect(Array.isArray(state.presentation.backStack)).toBe(true);
            expect(state.presentation.backStack.length).toBe(1);
            expect(state.presentation.backStack[0]).toEqual({ slideIndex: 0, buildIndex: 1 });
        });

        it('should go back to the previous position (including build index)', () => {
            const baseState = {
                slideOrder: ['slide-1', 'slide-2', 'slide-3'],
                slides: {
                    'slide-1': { id: 'slide-1', title: 'Slide 1' },
                    'slide-2': { id: 'slide-2', title: 'Slide 2' },
                    'slide-3': { id: 'slide-3', title: 'Slide 3' }
                },
                editor: { activeSlideId: 'slide-1' },
                presentation: {
                    buildCountBySlideId: {
                        'slide-1': 3,
                        'slide-2': 0,
                        'slide-3': 2
                    },
                    currentSlideIndex: 0,
                    buildIndex: 1,
                    buildCount: 3,
                    backStack: []
                }
            };

            let state = baseState;

            state = produce(state, draft => {
                handlePresentationJumpTo(draft, { index: 2 });
            });

            state = produce(state, draft => {
                handlePresentationGoBack(draft);
            });

            expect(state.presentation.currentSlideIndex).toBe(0);
            expect(state.editor.activeSlideId).toBe('slide-1');
            expect(state.presentation.buildCount).toBe(3);
            expect(state.presentation.buildIndex).toBe(1);
        });
    });

    describe('hidden slide behavior', () => {
        it('should skip hidden slides during linear navigation (next)', () => {
            const baseState = {
                slideOrder: ['slide-1', 'slide-2', 'slide-3'],
                slides: {
                    'slide-1': { id: 'slide-1', title: 'Slide 1' },
                    'slide-2': { id: 'slide-2', title: 'Slide 2', hidden: true },
                    'slide-3': { id: 'slide-3', title: 'Slide 3' }
                },
                editor: { activeSlideId: 'slide-1' },
                presentation: { currentSlideIndex: 0, buildIndex: -1, buildCount: 0 }
            };

            const state = baseState;

            const nextState = produce(state, draft => {
                handlePresentationNext(draft);
            });

            expect(nextState.presentation.currentSlideIndex).toBe(2);
            expect(nextState.editor.activeSlideId).toBe('slide-3');
        });

        it('should allow direct jump to a hidden slide', () => {
            const state = {
                slideOrder: ['slide-1', 'slide-2', 'slide-3'],
                slides: {
                    'slide-1': { id: 'slide-1', title: 'Slide 1' },
                    'slide-2': { id: 'slide-2', title: 'Slide 2', hidden: true },
                    'slide-3': { id: 'slide-3', title: 'Slide 3' }
                },
                editor: { activeSlideId: 'slide-1' },
                presentation: {
                    currentSlideIndex: 0,
                    buildIndex: -1,
                    buildCount: 0,
                    backStack: []
                }
            };

            const jumped = produce(state, draft => {
                handlePresentationJumpTo(draft, { index: 1 });
            });

            expect(jumped.presentation.currentSlideIndex).toBe(1);
            expect(jumped.editor.activeSlideId).toBe('slide-2');
            expect(jumped.presentation.backStack.length).toBe(1);
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
