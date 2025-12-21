function normalizeDnt(value) {
    if (value == null) return false;
    const v = String(value).trim().toLowerCase();
    return v === '1' || v === 'yes' || v === 'true';
}

function safeString(value, maxLen = 200) {
    if (typeof value !== 'string') return null;
    // Remove control chars and angle brackets to reduce accidental HTML-ish payloads.
    const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, '').replace(/[<>]/g, '');
    return cleaned.length > maxLen ? cleaned.slice(0, maxLen) : cleaned;
}

function safeNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return n;
}

function pick(obj, keys) {
    if (!obj || typeof obj !== 'object') return {};
    const out = {};
    for (const k of keys) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
    }
    return out;
}

function sanitizeBySchema(type, data) {
    const d = (data && typeof data === 'object') ? data : {};

    if (type === 'presentation.entered') {
        const picked = pick(d, ['mode', 'fullscreen', 'isPresenter', 'requestFullscreen', 'startFrom', 'slideIndex', 'slideCount']);
        return {
            mode: safeString(picked.mode, 32),
            fullscreen: picked.fullscreen === true,
            isPresenter: picked.isPresenter === true,
            requestFullscreen: picked.requestFullscreen === true,
            startFrom: safeString(picked.startFrom, 32),
            slideIndex: safeNumber(picked.slideIndex),
            slideCount: safeNumber(picked.slideCount),
        };
    }

    if (type === 'presentation.exited') {
        const picked = pick(d, ['durationMs', 'fullscreen', 'isPresenter', 'slideIndex']);
        return {
            durationMs: safeNumber(picked.durationMs),
            fullscreen: picked.fullscreen === true,
            isPresenter: picked.isPresenter === true,
            slideIndex: safeNumber(picked.slideIndex),
        };
    }

    if (type === 'presentation.navigate') {
        const picked = pick(d, ['fromSlideIndex', 'toSlideIndex', 'fromBuildIndex', 'toBuildIndex', 'method', 'direction', 'latencyMs']);
        return {
            fromSlideIndex: safeNumber(picked.fromSlideIndex),
            toSlideIndex: safeNumber(picked.toSlideIndex),
            fromBuildIndex: safeNumber(picked.fromBuildIndex),
            toBuildIndex: safeNumber(picked.toBuildIndex),
            method: safeString(picked.method, 16),
            direction: safeString(picked.direction, 16),
            latencyMs: safeNumber(picked.latencyMs),
        };
    }

    if (type === 'presentation.feature') {
        const picked = pick(d, ['feature', 'active']);
        return {
            feature: safeString(picked.feature, 32),
            active: picked.active === true,
        };
    }

    if (type === 'performance.kpi') {
        const picked = pick(d, ['metricId', 'scenarioId', 'unit', 'value']);
        return {
            metricId: safeString(picked.metricId, 64),
            scenarioId: safeString(picked.scenarioId, 64),
            unit: safeString(picked.unit, 16),
            value: safeNumber(picked.value),
        };
    }

    if (type === 'presentation.error') {
        const picked = pick(d, ['errorType', 'message', 'slideIndex', 'buildIndex']);
        return {
            errorType: safeString(picked.errorType, 64),
            message: safeString(picked.message, 200),
            slideIndex: safeNumber(picked.slideIndex),
            buildIndex: safeNumber(picked.buildIndex),
        };
    }

    if (type === 'crash') {
        const picked = pick(d, ['kind', 'message', 'stack', 'slideIndex', 'buildIndex']);
        return {
            kind: safeString(picked.kind, 32),
            message: safeString(picked.message, 200),
            stack: safeString(picked.stack, 2000),
            slideIndex: safeNumber(picked.slideIndex),
            buildIndex: safeNumber(picked.buildIndex),
        };
    }

    // --- Transitions telemetry (privacy-safe; no URLs/content) ---
    if (type === 'transition_requested') {
        const picked = pick(d, ['transitionType', 'direction', 'durationMs', 'easing', 'isReducedMotion']);
        return {
            transitionType: safeString(picked.transitionType, 32),
            direction: safeString(picked.direction, 16),
            durationMs: safeNumber(picked.durationMs),
            easing: safeString(picked.easing, 32),
            isReducedMotion: picked.isReducedMotion === true,
        };
    }

    if (type === 'transition_blocked_for_readiness') {
        const picked = pick(d, ['blockedBucket', 'blockedMs', 'transitionType', 'direction']);
        return {
            blockedBucket: safeString(picked.blockedBucket, 16),
            blockedMs: safeNumber(picked.blockedMs),
            transitionType: safeString(picked.transitionType, 32),
            direction: safeString(picked.direction, 16),
        };
    }

    if (type === 'transition_ready_latency') {
        const picked = pick(d, ['latencyMs', 'transitionType', 'direction']);
        return {
            latencyMs: safeNumber(picked.latencyMs),
            transitionType: safeString(picked.transitionType, 32),
            direction: safeString(picked.direction, 16),
        };
    }

    if (type === 'transition_started') {
        const picked = pick(d, ['transitionType', 'direction', 'durationMs']);
        return {
            transitionType: safeString(picked.transitionType, 32),
            direction: safeString(picked.direction, 16),
            durationMs: safeNumber(picked.durationMs),
        };
    }

    if (type === 'transition_completed') {
        const picked = pick(d, ['transitionType', 'direction']);
        return {
            transitionType: safeString(picked.transitionType, 32),
            direction: safeString(picked.direction, 16),
        };
    }

    if (type === 'transition_animation_duration') {
        const picked = pick(d, ['requestedMs', 'actualMs', 'transitionType', 'direction']);
        return {
            requestedMs: safeNumber(picked.requestedMs),
            actualMs: safeNumber(picked.actualMs),
            transitionType: safeString(picked.transitionType, 32),
            direction: safeString(picked.direction, 16),
        };
    }

    if (type === 'transition_fallback_to_none') {
        const picked = pick(d, ['reason', 'transitionType', 'direction']);
        return {
            reason: safeString(picked.reason, 32),
            transitionType: safeString(picked.transitionType, 32),
            direction: safeString(picked.direction, 16),
        };
    }

    // Unknown types: emit nothing (strict).
    return {};
}

function generateSessionId() {
    try {
        // Prefer crypto.randomUUID when available.
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    } catch {
        // ignore
    }
    return `s_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export class Telemetry {
    constructor({ maxEvents = 200 } = {}) {
        this._maxEvents = maxEvents;
        this._events = [];
        this._sessionId = generateSessionId();
        this._sink = null;
        this._marks = new Map();
    }

    isEnabled() {
        if (typeof window === 'undefined') return false;
        if (window.__TELEMETRY_DISABLED__ === true) return false;
        const dnt = normalizeDnt(navigator?.doNotTrack);
        return !dnt;
    }

    getSessionId() {
        return this._sessionId;
    }

    setSink(fn) {
        this._sink = typeof fn === 'function' ? fn : null;
    }

    markStart(key, details = null) {
        if (!this.isEnabled()) return;
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        this._marks.set(key, { startedAt: now, details });
    }

    consumeMark(key) {
        const v = this._marks.get(key);
        if (!v) return null;
        this._marks.delete(key);
        return v;
    }

    emit(type, data = {}) {
        if (!this.isEnabled()) return;

        const ts = Date.now();
        const sanitized = sanitizeBySchema(type, data);

        // If schema drops everything, avoid emitting.
        const hasAny = sanitized && typeof sanitized === 'object' && Object.values(sanitized).some((v) => v !== null && v !== undefined && v !== '');
        if (!hasAny) return;

        const ev = {
            type,
            timestamp: ts,
            sessionId: this._sessionId,
            data: sanitized,
        };

        this._events.push(ev);
        if (this._events.length > this._maxEvents) this._events.splice(0, this._events.length - this._maxEvents);

        if (this._sink) {
            try { this._sink(ev); } catch { /* ignore sink failures */ }
        }
    }

    getDebugEvents() {
        return this._events.slice();
    }
}

export const telemetry = new Telemetry();

// Test/dev-only debug exposure.
try {
    if (typeof window !== 'undefined' && (import.meta.env?.MODE === 'development' || import.meta.env?.MODE === 'test')) {
        window.__TELEMETRY_DEBUG__ = window.__TELEMETRY_DEBUG__ || {
            getEvents: () => telemetry.getDebugEvents(),
        };
    }
} catch {
    // ignore
}
