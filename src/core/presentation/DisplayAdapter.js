// Host Display Adapter abstraction.
// Web fallback intentionally reports limited capabilities.

export function getDisplayAdapter() {
    // Allow host/desktop wrapper to inject a stronger adapter.
    try {
        const injected = typeof window !== 'undefined' ? window.__PM_DISPLAY_ADAPTER : null;
        if (injected && typeof injected.getCapabilities === 'function' && typeof injected.getDisplays === 'function') {
            return injected;
        }
    } catch {
        // ignore
    }

    return createWebDisplayAdapter();
}

export function createWebDisplayAdapter() {
    return {
        async getCapabilities() {
            // Default web implementation is conservative: avoid prompting for permissions.
            return {
                canEnumerateDisplays: false,
                canPlaceWindows: false,
                canFullscreenOnTargetDisplay: false,
            };
        },

        async getDisplays() {
            // Unsupported by default on the open web without permissions.
            return [];
        },

        onDisplaysChanged() {
            // No-op; return unsubscribe.
            return () => {};
        },
    };
}
