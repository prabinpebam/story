import { describe, it, expect } from 'vitest';
import { PresentationManager } from '../../../../src/core/PresentationManager.js';

function sanitize(msg) {
    // Call the sanitizer without constructing the full manager.
    return PresentationManager.prototype._sanitizeSyncMessage.call({}, msg);
}

describe('Presenter sync message validation', () => {
    it('accepts valid navigate messages', () => {
        const out = sanitize({ type: 'navigate', senderId: 'a', slideIndex: 2, buildIndex: -1 });
        expect(out).toEqual({ type: 'navigate', senderId: 'a', slideIndex: 2, buildIndex: -1 });
    });

    it('rejects navigate messages with non-numeric indices', () => {
        expect(sanitize({ type: 'navigate', slideIndex: '2', buildIndex: -1 })).toBeNull();
        expect(sanitize({ type: 'navigate', slideIndex: 2, buildIndex: '0' })).toBeNull();
        expect(sanitize({ type: 'navigate', slideIndex: NaN, buildIndex: 0 })).toBeNull();
    });

    it('rejects navigate messages with out-of-range indices', () => {
        expect(sanitize({ type: 'navigate', slideIndex: -1, buildIndex: -1 })).toBeNull();
        expect(sanitize({ type: 'navigate', slideIndex: 100001, buildIndex: -1 })).toBeNull();
        expect(sanitize({ type: 'navigate', slideIndex: 0, buildIndex: 100001 })).toBeNull();
    });

    it('rejects state-sync messages with malformed indices', () => {
        expect(
            sanitize({ type: 'state-sync', state: { slideIndex: '0', buildIndex: -1, mode: 'presentation' } })
        ).toBeNull();
        expect(
            sanitize({ type: 'state-sync', state: { slideIndex: 0, buildIndex: '0', mode: 'presentation' } })
        ).toBeNull();
    });

    it('accepts valid state-sync messages and does not allow note fields', () => {
        const out = sanitize({
            type: 'state-sync',
            senderId: 'b',
            state: {
                slideIndex: 1,
                buildIndex: 0,
                mode: 'presentation',
                laser: true,
                grid: false,
                black: false,
                white: false,
                // Attempted leak: should be ignored (not preserved) even if provided.
                notes: '<b>secret</b>'
            }
        });

        expect(out).toEqual({
            type: 'state-sync',
            senderId: 'b',
            state: {
                slideIndex: 1,
                buildIndex: 0,
                laser: true,
                grid: false,
                black: false,
                white: false,
                mode: 'presentation'
            }
        });
        expect((out.state).notes).toBeUndefined();
    });

    it('rejects unknown message types and unknown toggle features', () => {
        expect(sanitize({ type: 'nope' })).toBeNull();
        expect(sanitize({ type: 'toggle-feature', feature: 'notes', active: true })).toBeNull();
    });

    it('drops extra fields from accepted messages (no note leakage surface)', () => {
        const out = sanitize({
            type: 'navigate',
            senderId: 'x',
            slideIndex: 1,
            buildIndex: 0,
            notes: '<b>secret</b>',
            diagnostics: { fps: 999 },
        });
        expect(out).toEqual({ type: 'navigate', senderId: 'x', slideIndex: 1, buildIndex: 0 });
        expect(out.notes).toBeUndefined();
        expect(out.diagnostics).toBeUndefined();
    });
});
