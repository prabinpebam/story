import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PresentationInputBuffer } from '../../../../src/core/presentation/PresentationInputBuffer.js';

describe('PresentationInputBuffer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('accumulates digits and commits on Enter (manual commit)', () => {
        const commits = [];
        const buffer = new PresentationInputBuffer({
            timeoutMs: 3000,
            onCommit: (n) => commits.push(n)
        });

        buffer.pushDigit('1');
        buffer.pushDigit('2');
        expect(buffer.value).toBe('12');

        buffer.commit();
        expect(commits).toEqual([12]);
        expect(buffer.value).toBe('');
    });

    it('cancels numeric entry', () => {
        const commits = [];
        const buffer = new PresentationInputBuffer({
            timeoutMs: 3000,
            onCommit: (n) => commits.push(n)
        });

        buffer.pushDigit('9');
        expect(buffer.isActive).toBe(true);

        buffer.cancel();
        expect(buffer.isActive).toBe(false);
        expect(commits).toEqual([]);
    });

    it('auto-commits after timeout', () => {
        const commits = [];
        const buffer = new PresentationInputBuffer({
            timeoutMs: 3000,
            onCommit: (n) => commits.push(n)
        });

        buffer.pushDigit('3');
        expect(buffer.value).toBe('3');

        vi.advanceTimersByTime(2999);
        expect(commits).toEqual([]);

        vi.advanceTimersByTime(2);
        expect(commits).toEqual([3]);
        expect(buffer.value).toBe('');
    });

    it('resets the timeout when additional digits are entered', () => {
        const commits = [];
        const buffer = new PresentationInputBuffer({
            timeoutMs: 3000,
            onCommit: (n) => commits.push(n)
        });

        buffer.pushDigit('1');
        vi.advanceTimersByTime(2000);
        buffer.pushDigit('0');

        vi.advanceTimersByTime(1500);
        expect(commits).toEqual([]);

        vi.advanceTimersByTime(1600);
        expect(commits).toEqual([10]);
    });

    it('ignores non-digit pushDigit input', () => {
        const commits = [];
        const buffer = new PresentationInputBuffer({
            timeoutMs: 3000,
            onCommit: (n) => commits.push(n)
        });

        buffer.pushDigit('x');
        buffer.pushDigit('-');
        expect(buffer.value).toBe('');

        buffer.pushDigit('4');
        expect(buffer.value).toBe('4');
    });
});
