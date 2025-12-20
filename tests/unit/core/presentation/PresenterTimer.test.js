import { describe, it, expect } from 'vitest';
import {
    createPresenterTimer,
    getPresenterTimerElapsedMs,
    isPresenterTimerPaused,
    pausePresenterTimer,
    resumePresenterTimer,
    resetPresenterTimer,
    formatElapsedMs
} from '../../../../src/core/presentation/PresenterTimer.js';

describe('PresenterTimer', () => {
    it('tracks elapsed time from start', () => {
        const t0 = 1000;
        const timer = createPresenterTimer(t0);
        expect(getPresenterTimerElapsedMs(timer, t0)).toBe(0);
        expect(getPresenterTimerElapsedMs(timer, t0 + 1500)).toBe(1500);
    });

    it('pauses and resumes without counting paused duration', () => {
        const t0 = 1000;
        let timer = createPresenterTimer(t0);
        timer = pausePresenterTimer(timer, t0 + 5000);
        expect(isPresenterTimerPaused(timer)).toBe(true);

        // While paused, elapsed should not increase.
        expect(getPresenterTimerElapsedMs(timer, t0 + 9000)).toBe(5000);

        timer = resumePresenterTimer(timer, t0 + 9000);
        expect(isPresenterTimerPaused(timer)).toBe(false);

        // After resume, time should continue from 5000ms.
        expect(getPresenterTimerElapsedMs(timer, t0 + 10000)).toBe(6000);
    });

    it('reset sets elapsed back to zero and clears paused state', () => {
        const t0 = 1000;
        let timer = createPresenterTimer(t0);
        timer = pausePresenterTimer(timer, t0 + 2000);
        timer = resetPresenterTimer(timer, t0 + 3000);

        expect(isPresenterTimerPaused(timer)).toBe(false);
        expect(getPresenterTimerElapsedMs(timer, t0 + 3000)).toBe(0);
        expect(getPresenterTimerElapsedMs(timer, t0 + 4000)).toBe(1000);
    });

    it('formats elapsed as HH:MM:SS', () => {
        expect(formatElapsedMs(0)).toBe('00:00:00');
        expect(formatElapsedMs(1000)).toBe('00:00:01');
        expect(formatElapsedMs(61_000)).toBe('00:01:01');
        expect(formatElapsedMs(3_661_000)).toBe('01:01:01');
    });
});
