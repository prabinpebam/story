let liveRegionEl = null;

function ensureLiveRegion() {
    if (liveRegionEl && liveRegionEl.isConnected) return liveRegionEl;

    const el = document.createElement('div');
    el.id = 'ui-live-region';
    el.setAttribute('data-testid', 'ui-live-region');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.className = 'sr-only';
    document.body.appendChild(el);
    liveRegionEl = el;
    return el;
}

export function announce(message) {
    if (!message) return;
    const region = ensureLiveRegion();

    // Clearing first helps re-announce identical messages in some AT.
    region.textContent = '';
    // Use microtask to keep ordering predictable in tests.
    Promise.resolve().then(() => {
        region.textContent = String(message);
    });
}

export function _resetLiveAnnouncerForTests() {
    if (liveRegionEl?.parentNode) liveRegionEl.parentNode.removeChild(liveRegionEl);
    liveRegionEl = null;
}
