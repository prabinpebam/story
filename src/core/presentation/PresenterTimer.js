export function createPresenterTimer(now = Date.now()) {
    return {
        startedAt: now,
        pausedAt: null,
        pausedMs: 0
    };
}

export function isPresenterTimerPaused(timer) {
    return !!(timer && typeof timer.pausedAt === 'number');
}

export function getPresenterTimerElapsedMs(timer, now = Date.now()) {
    if (!timer || typeof timer.startedAt !== 'number') return 0;

    const endAt = (typeof timer.pausedAt === 'number') ? timer.pausedAt : now;
    const elapsed = endAt - timer.startedAt - (typeof timer.pausedMs === 'number' ? timer.pausedMs : 0);
    return Math.max(0, elapsed);
}

export function pausePresenterTimer(timer, now = Date.now()) {
    if (!timer) return timer;
    if (typeof timer.pausedAt === 'number') return timer;
    return { ...timer, pausedAt: now };
}

export function resumePresenterTimer(timer, now = Date.now()) {
    if (!timer) return timer;
    if (typeof timer.pausedAt !== 'number') return timer;

    const pausedDuration = Math.max(0, now - timer.pausedAt);
    const pausedMs = (typeof timer.pausedMs === 'number' ? timer.pausedMs : 0) + pausedDuration;
    return { ...timer, pausedAt: null, pausedMs };
}

export function resetPresenterTimer(timer, now = Date.now()) {
    return {
        startedAt: now,
        pausedAt: null,
        pausedMs: 0
    };
}

export function formatElapsedMs(ms) {
    const totalSeconds = Math.floor(Math.max(0, Number(ms) || 0) / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
}
