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

    it('supports multi-part translate/scale transforms and respects SVG right-to-left ordering', () => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(10 0) scale(2)">
                    <rect x="0" y="0" width="10" height="10" fill="#f00" />
                </g>
                <g transform="scale(2) translate(10 0)">
                    <rect x="0" y="0" width="10" height="10" fill="#0f0" />
                </g>
            </svg>
        `;

        const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
        expect(res.ok).toBe(true);
        if (!res.ok) return;

        expect(res.elements).toHaveLength(2);

        const a = res.elements[0];
        const b = res.elements[1];

        expect(a.shapeKind).toBe('rectangle');
        expect(b.shapeKind).toBe('rectangle');

        expect(a.width).toBeCloseTo(20, 6);
        expect(a.height).toBeCloseTo(20, 6);
        expect(b.width).toBeCloseTo(20, 6);
        expect(b.height).toBeCloseTo(20, 6);

        // SVG applies transform lists right-to-left, so translate(10) scale(2) != scale(2) translate(10).
        // The two imported rects should end up separated on x.
        expect(Math.abs(b.x - a.x)).toBeCloseTo(10, 6);
    });

    it('supports transform lists containing an axis-aligned matrix(...)', () => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(2 0 0 2 10 0) scale(2)">
                    <rect x="0" y="0" width="10" height="10" fill="#f00" />
                </g>
            </svg>
        `;

        const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
        expect(res.ok).toBe(true);
        if (!res.ok) return;

        expect(res.elements).toHaveLength(1);
        const el = res.elements[0];
        expect(el.shapeKind).toBe('rectangle');

        // Right-to-left application: scale(2) then matrix(2x + 10) => net scale 4.
        expect(el.width).toBeCloseTo(40, 6);
        expect(el.height).toBeCloseTo(40, 6);
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

        it('imports userSpaceOnUse linearGradient for <path> when coords are explicit', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="10" y2="0">
                                <stop offset="0%" stop-color="#ff0000" />
                                <stop offset="100%" stop-color="#0000ff" />
                            </linearGradient>
                        </defs>
                        <path d="M0 0 L10 0 L10 10 Z" fill="url(#g)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.shapeKind).toBe('vector');
                expect(el.style?.fills?.[0]?.type).toBe('gradient');
                expect(el.style.fills[0].value).toMatch(/linear-gradient\(/i);
        });

        it('imports userSpaceOnUse linearGradient on translated <rect> (translate(...) group)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="20" y2="0">
                                <stop offset="0%" stop-color="#ff0000" />
                                <stop offset="100%" stop-color="#0000ff" />
                            </linearGradient>
                        </defs>
                        <g transform="translate(10 0)">
                            <rect x="0" y="0" width="10" height="10" fill="url(#g)" />
                        </g>
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.shapeKind).toBe('rectangle');
                expect(el.style?.fills?.[0]?.type).toBe('gradient');
        });

        it('applies SVG root viewBox scaling to geometry', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 100 50">
                        <rect x="0" y="0" width="100" height="50" fill="#000" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                const el = res.elements[0];
                expect(el.shapeKind).toBe('rectangle');
                expect(el.width).toBeCloseTo(200, 6);
                expect(el.height).toBeCloseTo(100, 6);
                // Centered around (0,0)
                expect(el.x).toBeCloseTo(-100, 6);
                expect(el.y).toBeCloseTo(-50, 6);
        });

        it('applies SVG root viewBox min-x/min-y translation to geometry', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="10 20 100 50">
                        <rect x="10" y="20" width="100" height="50" fill="#000" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                const el = res.elements[0];
                expect(el.shapeKind).toBe('rectangle');
                expect(el.width).toBeCloseTo(100, 6);
                expect(el.height).toBeCloseTo(50, 6);
                // Centered around (0,0)
                expect(el.x).toBeCloseTo(-50, 6);
                expect(el.y).toBeCloseTo(-25, 6);
        });

        it('applies viewBox scaling to userSpaceOnUse gradient coords (non-uniform scaling affects angle)', () => {
                // Non-uniform root scaling: scaleX=2, scaleY=1.
                // A userSpaceOnUse diagonal gradient (0,0)->(100,100) becomes (0,0)->(200,100),
                // which maps to a 45deg diagonal in normalized bbox space => CSS 135deg.
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 100 100">
                        <defs>
                            <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">
                                <stop offset="0%" stop-color="#ff0000" />
                                <stop offset="100%" stop-color="#0000ff" />
                            </linearGradient>
                        </defs>
                        <rect x="0" y="0" width="100" height="100" fill="url(#g)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                const el = res.elements[0];
                expect(el.style?.fills?.[0]?.type).toBe('gradient');
                const css = el.style.fills[0].value;
                const m = String(css).match(/linear-gradient\(\s*([0-9.]+)deg/i);
                expect(m).toBeTruthy();
                const deg = m ? Number(m[1]) : NaN;
                expect(deg).toBeCloseTo(135, 3);
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

        it('applies axis-aligned scale gradientTransform to gradient direction (with WARN_GRADIENT_TRANSFORM_IGNORED)', () => {
                // Without transform: (0,0)->(1,1) => 45deg vector => CSS 135deg.
                // With scaleX=2, scaleY=1: (0,0)->(2,1) => atan2(1,2) => CSS ~116.565deg.
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="scale(2 1)">
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

                const el = res.elements[0];
                expect(el.style?.fills?.[0]?.type).toBe('gradient');
                const css = el.style.fills[0].value;
                const m = String(css).match(/linear-gradient\(\s*([0-9.]+)deg/i);
                expect(m).toBeTruthy();
                const deg = m ? Number(m[1]) : NaN;
                expect(deg).toBeCloseTo(116.565, 3);
        });

        it('accepts axis-aligned matrix(...) gradientTransform and applies it to direction', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="matrix(2 0 0 1 0 0)">
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

                const el = res.elements[0];
                expect(el.style?.fills?.[0]?.type).toBe('gradient');
                const css = el.style.fills[0].value;
                const m = String(css).match(/linear-gradient\(\s*([0-9.]+)deg/i);
                expect(m).toBeTruthy();
                const deg = m ? Number(m[1]) : NaN;
                expect(deg).toBeCloseTo(116.565, 3);
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

        it('imports <line> as shapeKind:line with normalized local endpoints', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <line x1="0" y1="0" x2="10" y2="0" stroke="#ff0000" stroke-width="2" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.elements).toHaveLength(1);
                const el = res.elements[0];
                expect(el.type).toBe('shape');
                expect(el.shapeKind).toBe('line');
                expect(el.params?.p1).toBeTruthy();
                expect(el.params?.p2).toBeTruthy();

                // Stroke should map through.
                expect(el.style?.strokes?.[0]).toMatchObject({ type: 'solid', color: '#ff0000', width: 2 });
        });

        it('imports <polyline> as shapeKind:vector (open path)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <polyline points="0,0 10,0 10,10" fill="none" stroke="#000" stroke-width="1" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                const el = res.elements[0];
                expect(el.shapeKind).toBe('vector');
                expect(Array.isArray(el.paths)).toBe(true);
                expect(el.paths[0]).toMatchObject({ closed: false });
                expect(el.paths[0].segments?.length).toBe(2);
        });

        it('imports <path> (M/L/Z) as shapeKind:vector', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0 L10 0 L10 10 Z" fill="#00ff00" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                const el = res.elements[0];
                expect(el.shapeKind).toBe('vector');
                expect(el.paths?.[0]?.closed).toBe(true);
                expect(el.style?.fills?.[0]).toMatchObject({ type: 'solid', value: '#00ff00', color: '#00ff00' });
        });

        it('imports <path> with Q/T as cubic segments (quadratic converted)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0 Q 10 0 10 10 T 20 20" fill="#00ff00" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings || []).not.toContain('WARN_PATH_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.shapeKind).toBe('vector');
                expect(el.paths?.[0]?.segments?.length).toBe(2);
                expect(el.paths?.[0]?.segments?.[0]?.kind).toBe('cubic');
                expect(el.paths?.[0]?.segments?.[1]?.kind).toBe('cubic');
        });

        it('imports <path> with S as cubic segments (smooth cubic)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0 C 10 0 10 10 20 10 S 30 10 40 0" fill="none" stroke="#000" stroke-width="1" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings || []).not.toContain('WARN_PATH_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.shapeKind).toBe('vector');
                expect(el.paths?.[0]?.segments?.length).toBe(2);
                expect(el.paths?.[0]?.segments?.[0]?.kind).toBe('cubic');
                expect(el.paths?.[0]?.segments?.[1]?.kind).toBe('cubic');
        });

            it('imports <path> with A as cubic segments (elliptical arc converted)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0 A 10 10 0 0 1 10 10" fill="none" stroke="#000" stroke-width="1" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings || []).not.toContain('WARN_PATH_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.shapeKind).toBe('vector');
                expect(el.paths?.[0]?.segments?.length).toBeGreaterThan(0);
                const kinds = (el.paths?.[0]?.segments || []).map(s => s.kind);
                expect(kinds.every(k => k === 'cubic' || k === 'line')).toBe(true);
            });

            it('imports fill-rule="evenodd" onto vector paths', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0 L10 0 L10 10 Z" fill="#000" fill-rule="evenodd" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                const el = res.elements[0];
                expect(el.shapeKind).toBe('vector');
                expect(el.paths?.[0]?.fillRule).toBe('evenodd');
            });

        it('warns on unsupported <path> commands but still imports supported primitives', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="10" height="10" fill="#000" />
                        <path d="M0 0 R 10 10 20 0" fill="#f00" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.elements.length).toBeGreaterThan(0);
                expect(res.warnings).toContain('WARN_PATH_UNSUPPORTED');
        });

        it('computes a tighter bbox for cubic paths using extrema (not control points)', () => {
                // For y(t) with p0=0, c1=100, c2=100, p1=0:
                // y(t) = 300 t (1-t) has max 75 at t=0.5.
                // With pad=0.5, expected height is 75 + 1 = 76.
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0 C 0 100 10 100 10 0" fill="#000" stroke="none" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                const el = res.elements[0];
                expect(el.shapeKind).toBe('vector');
                expect(el.height).toBeCloseTo(76, 3);
                expect(el.width).toBeCloseTo(11, 3);
        });

            it('expands <line> bounds by half stroke width (stroke-aware bbox)', () => {
                // Horizontal line from (0,0) to (10,0) with stroke-width 10.
                // basePad=0.5, strokePad=5 => visualPad=5.5
                // width = 10 + 2*5.5 = 21; height = 0 + 2*5.5 = 11
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="0" x2="10" y2="0" stroke="#000" stroke-width="10" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                const el = res.elements[0];
                expect(el.shapeKind).toBe('line');
                expect(el.width).toBeCloseTo(21, 6);
                expect(el.height).toBeCloseTo(11, 6);
            });
});
