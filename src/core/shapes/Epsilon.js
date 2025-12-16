export const EPS_POINT = 1e-6;
export const EPS_LENGTH = 1e-6;
export const EPS_ANGLE = 1e-6; // radians
export const EPS_AREA = 1e-10;

export function nearlyEqual(a, b, eps = EPS_LENGTH) {
    if (typeof a !== 'number' || typeof b !== 'number' || typeof eps !== 'number') return false;
    if (!Number.isFinite(eps) || eps < 0) return false;

    // Treat -0 and 0 as equal
    if (a === b) return true;

    // NaN is never equal
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;

    return Math.abs(a - b) <= eps;
}

export function isZero(n, eps = EPS_LENGTH) {
    return nearlyEqual(n, 0, eps);
}

export function normalizeNegativeZero(n) {
    return Object.is(n, -0) ? 0 : n;
}

export function clampFinite(n, min, max, fallback = 0) {
    if (!Number.isFinite(n)) return fallback;
    if (!Number.isFinite(min) || !Number.isFinite(max)) return fallback;
    if (min > max) return fallback;

    return Math.min(max, Math.max(min, n));
}
