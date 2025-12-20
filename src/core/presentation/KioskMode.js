function getFirstVisibleSlideIndex(state) {
    const order = state?.slideOrder;
    if (!Array.isArray(order)) return 0;
    for (let i = 0; i < order.length; i++) {
        const id = order[i];
        const slide = state?.slides?.[id];
        const hidden = slide?.hidden === true || slide?.isHidden === true;
        if (!hidden) return i;
    }
    return 0;
}

function hasNextVisibleSlide(state) {
    const order = state?.slideOrder;
    const fromIndex = state?.presentation?.currentSlideIndex;
    if (!Array.isArray(order) || !Number.isFinite(fromIndex)) return false;
    for (let i = fromIndex + 1; i < order.length; i++) {
        const id = order[i];
        const slide = state?.slides?.[id];
        const hidden = slide?.hidden === true || slide?.isHidden === true;
        if (!hidden) return true;
    }
    return false;
}

export function normalizeKioskConfig(input) {
    const base = {
        enabled: false,
        autoAdvanceSeconds: 5,
        loop: true,
        passwordHash: null,
        disableInput: false
    };

    if (!input || typeof input !== 'object') return base;

    const enabled = input.enabled === true;
    const autoAdvanceSeconds = Number.isFinite(input.autoAdvanceSeconds)
        ? Math.max(0.1, Number(input.autoAdvanceSeconds))
        : base.autoAdvanceSeconds;

    const loop = input.loop !== undefined ? input.loop === true : base.loop;
    const disableInput = input.disableInput !== undefined ? input.disableInput === true : base.disableInput;
    const passwordHash = typeof input.passwordHash === 'string' && input.passwordHash.trim()
        ? input.passwordHash.trim()
        : null;

    return {
        enabled,
        autoAdvanceSeconds,
        loop,
        passwordHash,
        disableInput
    };
}

export function computeKioskAdvanceAction(state, config) {
    if (!config?.enabled) return { type: 'none' };
    if (state?.editor?.mode !== 'presentation') return { type: 'none' };

    const p = state?.presentation || {};
    const buildIndex = Number.isFinite(p.buildIndex) ? p.buildIndex : -1;
    const buildCount = Number.isFinite(p.buildCount) ? p.buildCount : 0;

    // Prefer builds first.
    if (buildCount > 0 && buildIndex < buildCount - 1) {
        return { type: 'build.next' };
    }

    // If there is a next visible slide, advance.
    if (hasNextVisibleSlide(state)) {
        return { type: 'slide.next' };
    }

    // Otherwise we're at the end.
    if (config.loop) {
        return { type: 'slide.goto', index: getFirstVisibleSlideIndex(state) };
    }

    return { type: 'stop' };
}

export class KioskMode {
    constructor(options) {
        this._getState = options?.getState;
        this._dispatch = options?.dispatch;
        this._navigateSlideGuarded = options?.navigateSlideGuarded;
        this._config = normalizeKioskConfig(options?.config);

        this._timer = null;
        this._active = false;
        this._inFlight = false;
    }

    get config() {
        return this._config;
    }

    get active() {
        return this._active;
    }

    setConfig(next) {
        this._config = normalizeKioskConfig(next);
    }

    start() {
        if (this._active) return;
        if (!this._config.enabled) return;
        this._active = true;
        this._scheduleNext();
    }

    stop() {
        this._active = false;
        this._inFlight = false;
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    // Interruption policy: user input should pause/resume the autoplay timer.
    // Minimal deterministic behavior: reset the countdown so it won't auto-advance immediately after input.
    interrupt() {
        if (!this._active) return;
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        this._scheduleNext();
    }

    _scheduleNext() {
        if (!this._active) return;
        const delayMs = Math.max(0.1, Number(this._config.autoAdvanceSeconds)) * 1000;
        if (this._timer) clearTimeout(this._timer);
        this._timer = setTimeout(() => this._tick(), delayMs);
    }

    async _tick() {
        if (!this._active) return;
        if (this._inFlight) {
            this._scheduleNext();
            return;
        }

        this._inFlight = true;
        try {
            const state = typeof this._getState === 'function' ? this._getState() : null;
            const action = computeKioskAdvanceAction(state, this._config);

            if (action.type === 'build.next') {
                this._dispatch?.('NEXT_BUILD');
            } else if (action.type === 'slide.next') {
                if (typeof this._navigateSlideGuarded === 'function') {
                    await this._navigateSlideGuarded('next');
                } else {
                    this._dispatch?.('PRESENTATION_NEXT');
                }
            } else if (action.type === 'slide.goto') {
                this._dispatch?.('PRESENTATION_GOTO', action.index);
            } else if (action.type === 'stop') {
                this.stop();
                return;
            }
        } finally {
            this._inFlight = false;
            this._scheduleNext();
        }
    }
}

export const __test__ = {
    getFirstVisibleSlideIndex,
    hasNextVisibleSlide
};
