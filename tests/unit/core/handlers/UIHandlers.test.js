/**
 * UIHandlers Unit Tests
 * 
 * Tests the pure handler functions for UI interaction state.
 * These handlers modify Immer draft state directly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { produce } from '../../../../src/vendor/immer.js';
import {
    handleUIInteractionStart,
    handleUIInteractionEnd
} from '../../../../src/core/store/handlers/UIHandlers.js';
import { createInitialState } from '../../../../src/core/store/InitialState.js';

describe('UIHandlers', () => {
    let initialState;

    beforeEach(() => {
        initialState = createInitialState();
        // Ensure ui object exists with isInteracting
        initialState = produce(initialState, draft => {
            if (!draft.ui) {
                draft.ui = { isInteracting: false };
            }
        });
    });

    describe('handleUIInteractionStart()', () => {
        it('should set isInteracting to true', () => {
            const newState = produce(initialState, draft => {
                handleUIInteractionStart(draft);
            });

            expect(newState.ui.isInteracting).toBe(true);
        });

        it('should remain true if already true', () => {
            let state = produce(initialState, draft => {
                draft.ui.isInteracting = true;
            });

            state = produce(state, draft => {
                handleUIInteractionStart(draft);
            });

            expect(state.ui.isInteracting).toBe(true);
        });

        it('should not affect other ui properties', () => {
            let state = produce(initialState, draft => {
                draft.ui.someOtherProperty = 'test';
            });

            state = produce(state, draft => {
                handleUIInteractionStart(draft);
            });

            expect(state.ui.someOtherProperty).toBe('test');
            expect(state.ui.isInteracting).toBe(true);
        });
    });

    describe('handleUIInteractionEnd()', () => {
        it('should set isInteracting to false', () => {
            let state = produce(initialState, draft => {
                draft.ui.isInteracting = true;
            });

            state = produce(state, draft => {
                handleUIInteractionEnd(draft);
            });

            expect(state.ui.isInteracting).toBe(false);
        });

        it('should remain false if already false', () => {
            const newState = produce(initialState, draft => {
                handleUIInteractionEnd(draft);
            });

            expect(newState.ui.isInteracting).toBe(false);
        });

        it('should not affect other ui properties', () => {
            let state = produce(initialState, draft => {
                draft.ui.isInteracting = true;
                draft.ui.someOtherProperty = 'test';
            });

            state = produce(state, draft => {
                handleUIInteractionEnd(draft);
            });

            expect(state.ui.someOtherProperty).toBe('test');
            expect(state.ui.isInteracting).toBe(false);
        });
    });

    describe('Interaction lifecycle', () => {
        it('should handle start -> end cycle', () => {
            let state = initialState;

            // Start interaction
            state = produce(state, draft => {
                handleUIInteractionStart(draft);
            });
            expect(state.ui.isInteracting).toBe(true);

            // End interaction
            state = produce(state, draft => {
                handleUIInteractionEnd(draft);
            });
            expect(state.ui.isInteracting).toBe(false);
        });

        it('should handle multiple start/end cycles', () => {
            let state = initialState;

            for (let i = 0; i < 3; i++) {
                state = produce(state, draft => {
                    handleUIInteractionStart(draft);
                });
                expect(state.ui.isInteracting).toBe(true);

                state = produce(state, draft => {
                    handleUIInteractionEnd(draft);
                });
                expect(state.ui.isInteracting).toBe(false);
            }
        });

        it('should handle nested start calls (idempotent)', () => {
            let state = initialState;

            state = produce(state, draft => {
                handleUIInteractionStart(draft);
            });
            state = produce(state, draft => {
                handleUIInteractionStart(draft);
            });
            state = produce(state, draft => {
                handleUIInteractionStart(draft);
            });

            expect(state.ui.isInteracting).toBe(true);

            // Single end should set to false
            state = produce(state, draft => {
                handleUIInteractionEnd(draft);
            });
            expect(state.ui.isInteracting).toBe(false);
        });
    });
});
