import { describe, it, expect } from 'vitest';
import { coerceSlideTransition, SLIDE_TRANSITION_TYPES } from '../../../../src/core/presentation/SlideTransitionUtils.js';

describe('SlideTransitionUtils - morph', () => {
    it('coerces morph to a normalized config (no direction)', () => {
        const result = coerceSlideTransition({
            type: SLIDE_TRANSITION_TYPES.MORPH,
            durationMs: 300,
            easing: 'ease-in-out',
            direction: 'left'
        });

        expect(result).toEqual({
            type: SLIDE_TRANSITION_TYPES.MORPH,
            durationMs: 300,
            easing: 'ease-in-out'
        });
    });

    it('normalizes invalid morph easing/duration', () => {
        const result = coerceSlideTransition({
            type: SLIDE_TRANSITION_TYPES.MORPH,
            durationMs: 999999,
            easing: '   '
        });

        expect(result.type).toBe(SLIDE_TRANSITION_TYPES.MORPH);
        expect(result.durationMs).toBeLessThanOrEqual(5000);
        expect(result.easing).toBeTruthy();
    });
});
