import { describe, it, expect } from 'vitest';
import {
    createRehearsalTimings,
    isRehearsalEnabled,
    isRehearsalPaused,
    setRehearsalEnabled,
    onRehearsalSlideChange,
    pauseRehearsal,
    resumeRehearsal,
    getRehearsalTotalMs,
    getRehearsalCurrentSlideMs,
    getRehearsalRecordedMsForSlide,
    formatRehearsalSummary
} from '../../../../src/core/presentation/RehearsalTimings.js';

describe('RehearsalTimings', () => {
    it('is disabled by default', () => {
        const r = createRehearsalTimings(1000);
        expect(isRehearsalEnabled(r)).toBe(false);
        expect(formatRehearsalSummary(r, 2000)).toBe('');
    });

    it('tracks per-slide and total timings, excluding paused duration', () => {
        const t0 = 1000;
        let r = createRehearsalTimings(t0);

        r = setRehearsalEnabled(r, true, { now: t0, currentSlideId: 's1' });
        expect(isRehearsalEnabled(r)).toBe(true);

        // 5s on slide 1
        expect(getRehearsalCurrentSlideMs(r, t0 + 5000)).toBe(5000);
        expect(getRehearsalTotalMs(r, t0 + 5000)).toBe(5000);

        // Pause for 10s
        r = pauseRehearsal(r, t0 + 5000);
        expect(isRehearsalPaused(r)).toBe(true);

        // While paused, current slide time stays fixed.
        expect(getRehearsalCurrentSlideMs(r, t0 + 12_000)).toBe(5000);
        expect(getRehearsalTotalMs(r, t0 + 12_000)).toBe(5000);

        // Resume at +15s
        r = resumeRehearsal(r, t0 + 15_000);
        expect(isRehearsalPaused(r)).toBe(false);

        // After resume, only active time counts.
        // Active time: 5s before pause + 5s after resume = 10s
        expect(getRehearsalCurrentSlideMs(r, t0 + 20_000)).toBe(10_000);
        expect(getRehearsalTotalMs(r, t0 + 20_000)).toBe(10_000);

        // Slide change at +20s should record slide 1.
        r = onRehearsalSlideChange(r, 's2', t0 + 20_000);
        expect(getRehearsalRecordedMsForSlide(r, 's1')).toBe(10_000);
        expect(getRehearsalRecordedMsForSlide(r, 's2')).toBe(0);

        // 3s on slide 2
        expect(getRehearsalCurrentSlideMs(r, t0 + 23_000)).toBe(3000);
        expect(getRehearsalTotalMs(r, t0 + 23_000)).toBe(13_000);
    });

    it('formats a stable summary string when enabled', () => {
        const t0 = 1000;
        let r = setRehearsalEnabled(createRehearsalTimings(t0), true, { now: t0, currentSlideId: 's1' });
        const summary = formatRehearsalSummary(r, t0 + 1000);
        expect(summary).toContain('Rehearsal');
        expect(summary).toContain('Slide 00:00:01');
        expect(summary).toContain('Total 00:00:01');
    });
});
