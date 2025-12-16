import { describe, it, expect } from 'vitest';
import { importEditableShapesFromSanitizedSvg } from '../../../src/core/clipboard/EditableSvgImporter.js';

describe('EditableSvgImporter.importEditableShapesFromSanitizedSvg', () => {
    it('rejects empty input', () => {
        expect(importEditableShapesFromSanitizedSvg('', { centerX: 0, centerY: 0 })).toMatchObject({ ok: false });
    });

    it('rejects when center is missing', () => {
        expect(importEditableShapesFromSanitizedSvg('<svg></svg>', { centerX: 0 })).toMatchObject({ ok: false, reason: 'MISSING_CENTER' });
    });

    it('imports a simple rect and recenters to the provided insertion point', () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="10" height="10" /></svg>';
        const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });

        expect(res.ok).toBe(true);
        if (!res.ok) return;

        expect(res.elements).toHaveLength(1);
        const el = res.elements[0];

        expect(el.type).toBe('shape');
        expect(el.shapeKind).toBe('rectangle');
        expect(el.shape).toBe('rectangle');

        // The rect's bbox center is (5,5); after recentering to (0,0), x/y should be -5.
        expect(el.x).toBe(-5);
        expect(el.y).toBe(-5);
        expect(el.width).toBe(10);
        expect(el.height).toBe(10);

        expect(el.id).toBe('imp-t-1');
    });

        it('maps fill, stroke, stroke-width, and opacity into style', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="10" height="10"
                            fill="#ff0000" fill-opacity="0.5"
                            stroke="rgb(0,255,0)" stroke-width="2" stroke-opacity="0.5"
                            opacity="0.5"
                        />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                const el = res.elements[0];
                expect(el.style?.fills?.[0]).toMatchObject({ type: 'solid', value: '#ff0000', color: '#ff0000' });
                // 0.5 (fill-opacity) * 0.5 (opacity) = 0.25 -> 25
                expect(el.style.fills[0].opacity).toBe(25);

                expect(el.style?.strokes?.[0]).toMatchObject({ type: 'solid', color: '#00ff00', width: 2, position: 'center' });
                // 0.5 (stroke-opacity) * 0.5 (opacity) = 0.25 -> 25
                expect(el.style.strokes[0].opacity).toBe(25);
        });

        it('inherits fill from parent <g> style', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <g style="fill:#123456; fill-opacity:0.5">
                            <rect x="0" y="0" width="10" height="10" />
                        </g>
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                const el = res.elements[0];
                expect(el.style?.fills?.[0]).toMatchObject({ value: '#123456', opacity: 50 });
        });

        it('maps stroke dash/linecap/linejoin/miterlimit', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="10" height="10"
                            fill="none"
                            stroke="#000000" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="bevel" stroke-miterlimit="10"
                            stroke-dasharray="4 2"
                        />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                const el = res.elements[0];
                expect(el.style?.fills?.length || 0).toBe(0);
                expect(el.style?.strokes?.[0]).toMatchObject({
                        type: 'solid',
                        color: '#000000',
                        width: 2,
                        style: 'custom',
                        dashArray: '4 2',
                        dashCap: 'round',
                        join: 'bevel',
                        miterLimit: 10
                });
        });

        it('maps stroke-dashoffset', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="10" height="10"
                            fill="none"
                            stroke="#000" stroke-width="2"
                            stroke-dasharray="4 2"
                            stroke-dashoffset="3"
                        />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                const el = res.elements[0];
                expect(el.style?.strokes?.[0]?.dashOffset).toBe(3);
        });

    it('rejects transforms (conservative v0)', () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><g transform="translate(10 10)"><rect width="10" height="10" /></g></svg>';
        const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                // Translation-only transforms are supported.
                expect(res.ok).toBe(true);
    });

        it('warns and degrades when fill/stroke are url(#...) paints', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="g"><stop offset="0" stop-color="#ff0000"/></radialGradient>
                        </defs>
                        <rect x="0" y="0" width="10" height="10" fill="url(#g)" stroke="url(#g)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');
                const el = res.elements[0];

                // We can't import gradients yet; ensure result is still visible (fallback fill).
                expect(el.style?.fills?.length).toBeGreaterThan(0);
                expect(el.style.fills[0]).toMatchObject({ type: 'solid', value: '#808080', opacity: 100 });
        });

        it('imports objectBoundingBox linearGradient fill as a gradient fill (no warning)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#ff0000" stop-opacity="1" />
                                <stop offset="100%" stop-color="#0000ff" stop-opacity="1" />
                            </linearGradient>
                        </defs>
                        <rect x="0" y="0" width="10" height="10" fill="url(#g)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.style?.fills?.[0]?.type).toBe('gradient');
                expect(typeof el.style?.fills?.[0]?.value).toBe('string');
                expect(el.style.fills[0].value).toMatch(/linear-gradient\(/i);
                expect(el.style.fills[0].value).toMatch(/#ff0000/i);
                expect(el.style.fills[0].value).toMatch(/#0000ff/i);
        });

        it('imports userSpaceOnUse linearGradient when coords are explicit', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="10" y2="0">
                                <stop offset="0%" stop-color="#ff0000" />
                                <stop offset="100%" stop-color="#0000ff" />
                            </linearGradient>
                        </defs>
                        <rect x="0" y="0" width="10" height="10" fill="url(#g)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');
                const el = res.elements[0];
                expect(el.style?.fills?.[0]?.type).toBe('gradient');
                expect(el.style.fills[0].value).toMatch(/linear-gradient\(/i);
        });

        it('imports linearGradient stroke as a gradient stroke (no WARN_GRADIENT_PAINT_UNSUPPORTED)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#ff0000" />
                                <stop offset="100%" stop-color="#0000ff" />
                            </linearGradient>
                        </defs>
                        <rect x="0" y="0" width="10" height="10" fill="none" stroke="url(#g)" stroke-width="2" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.style?.fills?.length || 0).toBe(0);
                expect(el.style?.strokes?.[0]?.type).toBe('gradient');
                expect(typeof el.style?.strokes?.[0]?.value).toBe('string');
                expect(el.style.strokes[0].value).toMatch(/linear-gradient\(/i);
                expect(el.style.strokes[0].width).toBe(2);
        });

        it('ignores translation-only gradientTransform and imports with WARN_GRADIENT_TRANSFORM_IGNORED', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform="translate(0.1 0)">
                                <stop offset="0%" stop-color="#ff0000" />
                                <stop offset="100%" stop-color="#0000ff" />
                            </linearGradient>
                        </defs>
                        <rect x="0" y="0" width="10" height="10" fill="url(#g)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).toContain('WARN_GRADIENT_TRANSFORM_IGNORED');
                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.style?.fills?.[0]?.type).toBe('gradient');
        });

        it('warns and falls back when userSpaceOnUse gradient coords are missing', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stop-color="#ff0000" />
                                <stop offset="100%" stop-color="#0000ff" />
                            </linearGradient>
                        </defs>
                        <rect x="0" y="0" width="10" height="10" fill="url(#g)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');
                const el = res.elements[0];
                expect(el.style?.fills?.[0]).toMatchObject({ type: 'solid', value: '#808080' });
        });

        it('supports translate(...) and preserves relative positions', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="10" height="10" />
                        <g transform="translate(10 0)">
                            <rect x="20" y="0" width="10" height="10" />
                        </g>
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.elements).toHaveLength(2);
                const [a, b] = res.elements;
                // With the translate(10,0), the second rect is effectively 30 units to the right in source space.
                // After recentering, the relative offset should remain 30.
                expect(b.x - a.x).toBe(30);
        });

        it('supports translation-only matrix(...)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1 0 0 1 10 0)">
                            <rect x="0" y="0" width="10" height="10" />
                        </g>
                    </svg>
                `;
                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
        });

        it('rejects non-translation transforms (e.g. rotate)', () => {
                const svg = '<svg xmlns="http://www.w3.org/2000/svg"><g transform="rotate(10)"><rect width="10" height="10" /></g></svg>';
                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(false);
                expect(res).toMatchObject({ reason: 'TRANSFORM_UNSUPPORTED' });
        });
});
