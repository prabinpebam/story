import { describe, it, expect, vi } from 'vitest';
import { PresentationManager } from '../../../../src/core/PresentationManager.js';

async function callMaybeAutoOpen(ctx) {
    return await PresentationManager.prototype._maybeAutoOpenPresenterView.call(ctx);
}

describe('PresentationManager presenter auto-open (host display adapter)', () => {
    it('opens Presenter View when adapter reports 2+ displays and has not attempted before', async () => {
        const ctx = {
            _isPresenter: () => false,
            _sync: {},
            _displayAdapter: {
                getCapabilities: vi.fn(async () => ({ canEnumerateDisplays: true })),
                getDisplays: vi.fn(async () => [{ id: '1' }, { id: '2' }]),
            },
            _openPresenterWindow: vi.fn(),
        };

        await callMaybeAutoOpen(ctx);
        expect(ctx._openPresenterWindow).toHaveBeenCalledTimes(1);

        // Second call should not re-open.
        await callMaybeAutoOpen(ctx);
        expect(ctx._openPresenterWindow).toHaveBeenCalledTimes(1);
    });

    it('does not open when adapter cannot enumerate displays', async () => {
        const ctx = {
            _isPresenter: () => false,
            _sync: {},
            _displayAdapter: {
                getCapabilities: vi.fn(async () => ({ canEnumerateDisplays: false })),
                getDisplays: vi.fn(async () => [{ id: '1' }, { id: '2' }]),
            },
            _openPresenterWindow: vi.fn(),
        };

        await callMaybeAutoOpen(ctx);
        expect(ctx._openPresenterWindow).toHaveBeenCalledTimes(0);
    });

    it('does not open when there is only one display', async () => {
        const ctx = {
            _isPresenter: () => false,
            _sync: {},
            _displayAdapter: {
                getCapabilities: vi.fn(async () => ({ canEnumerateDisplays: true })),
                getDisplays: vi.fn(async () => [{ id: '1' }]),
            },
            _openPresenterWindow: vi.fn(),
        };

        await callMaybeAutoOpen(ctx);
        expect(ctx._openPresenterWindow).toHaveBeenCalledTimes(0);
    });

    it('does not open when already in presenter role or presenter window exists', async () => {
        const open = vi.fn();

        const presenterCtx = {
            _isPresenter: () => true,
            _sync: {},
            _displayAdapter: {
                getCapabilities: vi.fn(async () => ({ canEnumerateDisplays: true })),
                getDisplays: vi.fn(async () => [{ id: '1' }, { id: '2' }]),
            },
            _openPresenterWindow: open,
        };

        await callMaybeAutoOpen(presenterCtx);
        expect(open).toHaveBeenCalledTimes(0);

        const hasWindowCtx = {
            _isPresenter: () => false,
            _sync: { presenterWindow: { closed: false } },
            _displayAdapter: {
                getCapabilities: vi.fn(async () => ({ canEnumerateDisplays: true })),
                getDisplays: vi.fn(async () => [{ id: '1' }, { id: '2' }]),
            },
            _openPresenterWindow: open,
        };

        await callMaybeAutoOpen(hasWindowCtx);
        expect(open).toHaveBeenCalledTimes(0);
    });
});
