import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { normalizeKioskConfig, computeKioskAdvanceAction, KioskMode } from '../../../../src/core/presentation/KioskMode.js';

describe('KioskMode', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('normalizeKioskConfig', () => {
        it('defaults to disabled with sane defaults', () => {
            expect(normalizeKioskConfig(null)).toEqual({
                enabled: false,
                autoAdvanceSeconds: 5,
                loop: true,
                passwordHash: null,
                disableInput: false
            });
        });

        it('clamps autoAdvanceSeconds to minimum 0.1', () => {
            const cfg = normalizeKioskConfig({ enabled: true, autoAdvanceSeconds: 0 });
            expect(cfg.enabled).toBe(true);
            expect(cfg.autoAdvanceSeconds).toBe(0.1);
        });
    });

    describe('computeKioskAdvanceAction', () => {
        it('advances builds before slides', () => {
            const state = {
                editor: { mode: 'presentation' },
                slideOrder: ['s1', 's2'],
                slides: { s1: {}, s2: {} },
                presentation: { currentSlideIndex: 0, buildIndex: 0, buildCount: 3 }
            };

            const action = computeKioskAdvanceAction(state, { enabled: true, loop: true });
            expect(action).toEqual({ type: 'build.next' });
        });

        it('advances to next slide when builds exhausted', () => {
            const state = {
                editor: { mode: 'presentation' },
                slideOrder: ['s1', 's2'],
                slides: { s1: {}, s2: {} },
                presentation: { currentSlideIndex: 0, buildIndex: 2, buildCount: 3 }
            };

            const action = computeKioskAdvanceAction(state, { enabled: true, loop: true });
            expect(action).toEqual({ type: 'slide.next' });
        });

        it('loops to first visible slide when at end and loop enabled', () => {
            const state = {
                editor: { mode: 'presentation' },
                slideOrder: ['s1', 's2'],
                slides: { s1: {}, s2: {} },
                presentation: { currentSlideIndex: 1, buildIndex: -1, buildCount: 0 }
            };

            const action = computeKioskAdvanceAction(state, { enabled: true, loop: true });
            expect(action).toEqual({ type: 'slide.goto', index: 0 });
        });

        it('stops when at end and loop disabled', () => {
            const state = {
                editor: { mode: 'presentation' },
                slideOrder: ['s1', 's2'],
                slides: { s1: {}, s2: {} },
                presentation: { currentSlideIndex: 1, buildIndex: -1, buildCount: 0 }
            };

            const action = computeKioskAdvanceAction(state, { enabled: true, loop: false });
            expect(action).toEqual({ type: 'stop' });
        });

        it('skips hidden slides when looping', () => {
            const state = {
                editor: { mode: 'presentation' },
                slideOrder: ['s1', 's2', 's3'],
                slides: { s1: { hidden: true }, s2: {}, s3: {} },
                presentation: { currentSlideIndex: 2, buildIndex: -1, buildCount: 0 }
            };

            const action = computeKioskAdvanceAction(state, { enabled: true, loop: true });
            expect(action).toEqual({ type: 'slide.goto', index: 1 });
        });
    });

    describe('interrupt', () => {
        it('resets the countdown so it does not auto-advance immediately after input', () => {
            const dispatch = vi.fn();

            const kiosk = new KioskMode({
                getState: () => ({
                    editor: { mode: 'presentation' },
                    slideOrder: ['s1'],
                    slides: { s1: {} },
                    presentation: { currentSlideIndex: 0, buildIndex: 0, buildCount: 2 }
                }),
                dispatch,
                config: { enabled: true, autoAdvanceSeconds: 1, loop: true }
            });

            kiosk.start();

            // Let most of the countdown elapse.
            vi.advanceTimersByTime(900);

            // User input interrupts: countdown should reset.
            kiosk.interrupt();

            // If the timer was not reset, it would fire at 1000ms.
            vi.advanceTimersByTime(150);
            expect(dispatch).toHaveBeenCalledTimes(0);

            // After a full delay from the interruption, it should advance once.
            vi.advanceTimersByTime(850);
            expect(dispatch).toHaveBeenCalledTimes(1);

            kiosk.stop();
        });
    });
});
