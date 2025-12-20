import { formatElapsedMs } from './PresenterTimer.js';

export function createRehearsalTimings(now = Date.now()) {
    return {
        enabled: false,
        startedAt: now,
        pausedAt: null,
        pausedMs: 0,
        perSlideMs: {},
        currentSlideId: null,
        slideStartedAt: now,
    };
}

export function isRehearsalEnabled(state) {
    return !!state?.enabled;
}

export function isRehearsalPaused(state) {
    return !!(state && typeof state.pausedAt === 'number');
}

function effectiveNow(state, now) {
    return (typeof state?.pausedAt === 'number') ? state.pausedAt : now;
}

export function setRehearsalEnabled(state, enabled, { now = Date.now(), currentSlideId = null } = {}) {
    const nextEnabled = enabled === true;
    const base = state && typeof state === 'object' ? state : createRehearsalTimings(now);

    if (!nextEnabled) {
        return { ...base, enabled: false };
    }

    // Turning on starts a fresh recording session.
    return {
        enabled: true,
        startedAt: now,
        pausedAt: null,
        pausedMs: 0,
        perSlideMs: {},
        currentSlideId,
        slideStartedAt: now,
    };
}

export function onRehearsalSlideChange(state, nextSlideId, now = Date.now()) {
    if (!isRehearsalEnabled(state)) return state;
    if (!nextSlideId) return state;

    const endAt = effectiveNow(state, now);
    const currentSlideId = state.currentSlideId;
    const startedAt = typeof state.slideStartedAt === 'number' ? state.slideStartedAt : endAt;
    const delta = Math.max(0, endAt - startedAt);

    const perSlideMs = { ...(state.perSlideMs || {}) };
    if (currentSlideId) {
        perSlideMs[currentSlideId] = (Number(perSlideMs[currentSlideId]) || 0) + delta;
    }

    return {
        ...state,
        perSlideMs,
        currentSlideId: nextSlideId,
        slideStartedAt: endAt,
    };
}

export function pauseRehearsal(state, now = Date.now()) {
    if (!isRehearsalEnabled(state)) return state;
    if (isRehearsalPaused(state)) return state;
    return { ...state, pausedAt: now };
}

export function resumeRehearsal(state, now = Date.now()) {
    if (!isRehearsalEnabled(state)) return state;
    if (!isRehearsalPaused(state)) return state;

    const pausedDuration = Math.max(0, now - state.pausedAt);
    return {
        ...state,
        pausedAt: null,
        pausedMs: (Number(state.pausedMs) || 0) + pausedDuration,
    };
}

export function resetRehearsal(state, { now = Date.now(), currentSlideId = null } = {}) {
    return {
        enabled: true,
        startedAt: now,
        pausedAt: null,
        pausedMs: 0,
        perSlideMs: {},
        currentSlideId,
        slideStartedAt: now,
    };
}

export function getRehearsalTotalMs(state, now = Date.now()) {
    if (!isRehearsalEnabled(state)) return 0;

    const endAt = effectiveNow(state, now);
    const base = Math.max(0, endAt - (Number(state.startedAt) || endAt) - (Number(state.pausedMs) || 0));

    // Include the current slide running segment into total as well.
    const currentSlide = getRehearsalCurrentSlideMs(state, now);
    const currentSlideStart = Number(state.slideStartedAt) || endAt;
    const alreadyIncluded = Math.max(0, endAt - currentSlideStart);

    // base already includes elapsed; do not double-count. Return base.
    return base;
}

export function getRehearsalCurrentSlideMs(state, now = Date.now()) {
    if (!isRehearsalEnabled(state)) return 0;

    const endAt = effectiveNow(state, now);
    const startedAt = Number(state.slideStartedAt) || endAt;
    return Math.max(0, endAt - startedAt);
}

export function getRehearsalRecordedMsForSlide(state, slideId) {
    if (!isRehearsalEnabled(state)) return 0;
    const per = state.perSlideMs || {};
    return Math.max(0, Number(per?.[slideId]) || 0);
}

export function formatRehearsalSummary(state, now = Date.now()) {
    if (!isRehearsalEnabled(state)) return '';

    const total = formatElapsedMs(getRehearsalTotalMs(state, now));
    const slide = formatElapsedMs(getRehearsalCurrentSlideMs(state, now));
    return `Rehearsal · Slide ${slide} · Total ${total}`;
}
