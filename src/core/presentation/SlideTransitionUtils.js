export const SLIDE_TRANSITION_TYPES = {
    NONE: 'none',
    CROSS_FADE: 'crossFade',
    MORPH: 'morph',
    WIPE: 'wipe',
    PUSH: 'push',
    COVER: 'cover',
    UNCOVER: 'uncover'
};

export const DIRECTION4 = /** @type {const} */ (['left', 'right', 'up', 'down']);
export const DIRECTION8 = /** @type {const} */ ([...DIRECTION4, 'upLeft', 'upRight', 'downLeft', 'downRight']);

export const SYSTEM_DEFAULT_TRANSITION = {
    type: SLIDE_TRANSITION_TYPES.CROSS_FADE,
    durationMs: 300,
    easing: 'ease-in-out'
};

function clampNumber(value, min, max, fallback) {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, value));
}

export function clampDurationMs(durationMs) {
    return clampNumber(Number(durationMs), 0, 5000, SYSTEM_DEFAULT_TRANSITION.durationMs);
}

export function normalizeEasing(easing) {
    if (typeof easing === 'string' && easing.trim()) return easing.trim();
    return SYSTEM_DEFAULT_TRANSITION.easing;
}

export function isDirection4(value) {
    return DIRECTION4.includes(value);
}

export function isDirection8(value) {
    return DIRECTION8.includes(value);
}

/**
 * Normalize a SlideTransitionConfig.
 * - Clamps duration
 * - Ensures direction present/absent per transition type
 * - Drops invalid directions and applies a safe default where needed
 *
 * @param {any} config
 * @returns {{type: string, durationMs: number, easing: string, direction?: string}}
 */
export function normalizeSlideTransitionConfig(config) {
    const input = config && typeof config === 'object' ? config : {};
    const type = typeof input.type === 'string' ? input.type : SLIDE_TRANSITION_TYPES.NONE;

    let durationMs = clampDurationMs(input.durationMs);
    // Product requirement: Morph defaults to 1000ms unless explicitly set.
    if (type === SLIDE_TRANSITION_TYPES.MORPH && (input.durationMs === undefined || input.durationMs === null)) {
        durationMs = clampDurationMs(1000);
    }
    const easing = normalizeEasing(input.easing);

    if (type === SLIDE_TRANSITION_TYPES.NONE) {
        return { type, durationMs, easing };
    }

    if (type === SLIDE_TRANSITION_TYPES.CROSS_FADE) {
        return { type, durationMs, easing };
    }

    if (type === SLIDE_TRANSITION_TYPES.MORPH) {
        // Phase 2+: Morph has no direction.
        return { type, durationMs, easing };
    }

    if (type === SLIDE_TRANSITION_TYPES.WIPE) {
        const direction = isDirection8(input.direction) ? input.direction : 'right';
        return { type, durationMs, easing, direction };
    }

    if (type === SLIDE_TRANSITION_TYPES.PUSH || type === SLIDE_TRANSITION_TYPES.COVER || type === SLIDE_TRANSITION_TYPES.UNCOVER) {
        const direction = isDirection4(input.direction) ? input.direction : 'right';
        return { type, durationMs, easing, direction };
    }

    // Unknown type: normalize to none.
    return { type: SLIDE_TRANSITION_TYPES.NONE, durationMs, easing };
}

/**
 * Map legacy transition strings to Phase 1 SlideTransitionConfig.
 * @param {any} legacy
 */
export function mapLegacyTransitionToConfig(legacy) {
    const v = typeof legacy === 'string' ? legacy : '';
    switch (v) {
        case 'fade':
            return { ...SYSTEM_DEFAULT_TRANSITION };
        case 'push':
            return normalizeSlideTransitionConfig({ type: SLIDE_TRANSITION_TYPES.PUSH, direction: 'right', durationMs: 300, easing: 'ease-in-out' });
        case 'slide':
            return normalizeSlideTransitionConfig({ type: SLIDE_TRANSITION_TYPES.COVER, direction: 'right', durationMs: 300, easing: 'ease-in-out' });
        case 'none':
            return normalizeSlideTransitionConfig({ type: SLIDE_TRANSITION_TYPES.NONE, durationMs: 0, easing: 'linear' });
        case 'magic':
            // Phase 1: Morph is explicitly out of scope.
            return normalizeSlideTransitionConfig({ type: SLIDE_TRANSITION_TYPES.NONE, durationMs: 0, easing: 'linear' });
        default:
            // Unsupported legacy strings must fall back to none.
            return normalizeSlideTransitionConfig({ type: SLIDE_TRANSITION_TYPES.NONE, durationMs: 0, easing: 'linear' });
    }
}

/**
 * Coerce runtime input (legacy string or config object) into a normalized SlideTransitionConfig.
 * @param {any} transition
 */
export function coerceSlideTransition(transition) {
    if (typeof transition === 'string') return mapLegacyTransitionToConfig(transition);
    return normalizeSlideTransitionConfig(transition);
}
