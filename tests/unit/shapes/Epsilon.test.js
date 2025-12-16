import { describe, expect, it } from 'vitest';

import {
    EPS_ANGLE,
    EPS_AREA,
    EPS_LENGTH,
    EPS_POINT,
    clampFinite,
    isZero,
    nearlyEqual,
    normalizeNegativeZero
} from '../../../src/core/shapes/Epsilon.js';

describe('shapes numerics: epsilons', () => {
    it('defines sane positive epsilons', () => {
        expect(EPS_POINT).toBeGreaterThan(0);
        expect(EPS_LENGTH).toBeGreaterThan(0);
        expect(EPS_ANGLE).toBeGreaterThan(0);
        expect(EPS_AREA).toBeGreaterThan(0);
    });

    it('matches the current spec-defined epsilon values', () => {
        expect(EPS_POINT).toBe(1e-6);
        expect(EPS_LENGTH).toBe(1e-6);
        expect(EPS_ANGLE).toBe(1e-6);
        expect(EPS_AREA).toBe(1e-10);
    });
});

describe('shapes numerics: helpers', () => {
    it('nearlyEqual handles basics deterministically', () => {
        expect(nearlyEqual(0, 0)).toBe(true);
        expect(nearlyEqual(-0, 0)).toBe(true);
        expect(nearlyEqual(1, 1 + EPS_LENGTH / 2)).toBe(true);
        expect(nearlyEqual(1, 1 + EPS_LENGTH * 2)).toBe(false);

        expect(nearlyEqual(NaN, 0)).toBe(false);
        expect(nearlyEqual(Infinity, Infinity)).toBe(true);
        expect(nearlyEqual(Infinity, -Infinity)).toBe(false);
    });

    it('isZero uses EPS_LENGTH by default', () => {
        expect(isZero(EPS_LENGTH / 2)).toBe(true);
        expect(isZero(EPS_LENGTH * 2)).toBe(false);
    });

    it('normalizeNegativeZero converts -0 to 0', () => {
        expect(Object.is(normalizeNegativeZero(-0), -0)).toBe(false);
        expect(normalizeNegativeZero(-0)).toBe(0);
        expect(normalizeNegativeZero(0)).toBe(0);
    });

    it('clampFinite clamps finite values and rejects non-finite inputs', () => {
        expect(clampFinite(5, 0, 10)).toBe(5);
        expect(clampFinite(-5, 0, 10)).toBe(0);
        expect(clampFinite(50, 0, 10)).toBe(10);

        expect(clampFinite(NaN, 0, 10, 123)).toBe(123);
        expect(clampFinite(Infinity, 0, 10, 123)).toBe(123);
        expect(clampFinite(5, 10, 0, 123)).toBe(123);
    });
});
