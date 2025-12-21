import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('DisplayAdapter', () => {
    const originalWindow = globalThis.window;

    beforeEach(() => {
        globalThis.window = {};
    });

    afterEach(() => {
        globalThis.window = originalWindow;
        vi.restoreAllMocks();
    });

    it('returns injected adapter when provided by host', async () => {
        const injected = {
            getCapabilities: vi.fn(async () => ({ canEnumerateDisplays: true })),
            getDisplays: vi.fn(async () => [{ id: 'a' }, { id: 'b' }]),
        };
        globalThis.window.__PM_DISPLAY_ADAPTER = injected;

        const mod = await import('../../../../src/core/presentation/DisplayAdapter.js');
        const adapter = mod.getDisplayAdapter();

        expect(adapter).toBe(injected);
    });

    it('falls back to conservative web adapter by default', async () => {
        const mod = await import('../../../../src/core/presentation/DisplayAdapter.js');
        const adapter = mod.getDisplayAdapter();

        const caps = await adapter.getCapabilities();
        expect(caps).toEqual({
            canEnumerateDisplays: false,
            canPlaceWindows: false,
            canFullscreenOnTargetDisplay: false,
        });

        const displays = await adapter.getDisplays();
        expect(displays).toEqual([]);

        const unsub = adapter.onDisplaysChanged?.(() => {});
        expect(typeof unsub).toBe('function');
        unsub?.();
    });
});
