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

        it('warns and degrades when url(#...) paints are unsupported (e.g. radialGradient with rotate transform)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="g" gradientTransform="rotate(45)">
                                <stop offset="0" stop-color="#ff0000"/>
                                <stop offset="100%" stop-color="#0000ff"/>
                            </radialGradient>
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

        it('warns deterministically when clip-path is present (clip ignored; shape still imports)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="10">
                        <defs>
                            <clipPath id="c">
                                <circle cx="5" cy="5" r="4" />
                            </clipPath>
                        </defs>
                        <rect x="0" y="0" width="20" height="10" clip-path="url(#c)" fill="#ff0000" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).toContain('WARN_CLIP_PATH_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.type).toBe('shape');
                expect(el.style?.fills?.[0]).toMatchObject({ type: 'solid', value: '#ff0000', opacity: 100 });
        });

        it('warns deterministically when mask is present (mask ignored; shape still imports)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="10">
                        <defs>
                            <mask id="m">
                                <rect x="0" y="0" width="20" height="10" fill="#ffffff" />
                            </mask>
                        </defs>
                        <rect x="0" y="0" width="20" height="10" mask="url(#m)" fill="#ff0000" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).toContain('WARN_MASK_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.type).toBe('shape');
                expect(el.style?.fills?.[0]).toMatchObject({ type: 'solid', value: '#ff0000', opacity: 100 });
        });

        it('imports objectBoundingBox radialGradient fill as a gradient fill (no warning)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="g" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#ff0000" stop-opacity="1" />
                                <stop offset="100%" stop-color="#0000ff" stop-opacity="1" />
                            </radialGradient>
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
                expect(el.style.fills[0].value).toMatch(/radial-gradient\(/i);
                expect(el.style.fills[0].value).toMatch(/#ff0000/i);
                expect(el.style.fills[0].value).toMatch(/#0000ff/i);
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

        it('imports linearGradient that inherits from another gradient via href="#..." (stops + coords inherited)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="base" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#ff0000" stop-opacity="1" />
                                <stop offset="100%" stop-color="#0000ff" stop-opacity="1" />
                            </linearGradient>
                            <linearGradient id="ref" href="#base" />
                        </defs>
                        <rect x="0" y="0" width="10" height="10" fill="url(#ref)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.style?.fills?.[0]?.type).toBe('gradient');
                expect(String(el.style.fills[0].value)).toMatch(/linear-gradient\(/i);
                expect(String(el.style.fills[0].value)).toMatch(/#ff0000/i);
                expect(String(el.style.fills[0].value)).toMatch(/#0000ff/i);
        });

        it('imports radialGradient that inherits from another gradient via xlink:href (stops inherited)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <defs>
                            <radialGradient id="base" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#00ff00" stop-opacity="1" />
                                <stop offset="100%" stop-color="#0000ff" stop-opacity="1" />
                            </radialGradient>
                            <radialGradient id="ref" xlink:href="#base" />
                        </defs>
                        <rect x="0" y="0" width="10" height="10" fill="url(#ref)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.style?.fills?.[0]?.type).toBe('gradient');
                expect(String(el.style.fills[0].value)).toMatch(/radial-gradient\(/i);
                expect(String(el.style.fills[0].value)).toMatch(/#00ff00/i);
                expect(String(el.style.fills[0].value)).toMatch(/#0000ff/i);
        });

        it('warns deterministically when linearGradient href has a cycle (falls back to solid fill)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="a" href="#b" />
                            <linearGradient id="b" href="#a">
                                <stop offset="0%" stop-color="#ff0000" />
                                <stop offset="100%" stop-color="#0000ff" />
                            </linearGradient>
                        </defs>
                        <rect x="0" y="0" width="10" height="10" fill="url(#a)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).toContain('WARN_GRADIENT_HREF_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.style?.fills?.[0]).toMatchObject({ type: 'solid', value: '#808080', opacity: 100 });
        });

        it('warns deterministically when linearGradient href target is missing (falls back to solid fill)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="ref" href="#missing" />
                        </defs>
                        <rect x="0" y="0" width="10" height="10" fill="url(#ref)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).toContain('WARN_GRADIENT_HREF_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.style?.fills?.[0]).toMatchObject({ type: 'solid', value: '#808080', opacity: 100 });
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

        it('applies axis-aligned gradientTransform to userSpaceOnUse gradient direction (with warning)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100" gradientTransform="scale(2 1)">
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

                expect(res.warnings).toContain('WARN_GRADIENT_TRANSFORM_IGNORED');

                const el = res.elements[0];
                expect(el.style?.fills?.[0]?.type).toBe('gradient');
                const css = el.style.fills[0].value;
                const m = String(css).match(/linear-gradient\(\s*([0-9.]+)deg/i);
                expect(m).toBeTruthy();
                const deg = m ? Number(m[1]) : NaN;
                expect(deg).toBeCloseTo(116.565, 3);
        });

        it('falls back deterministically when gradientTransform is unsupported (e.g. rotate)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform="rotate(45)">
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
                expect(res.warnings).not.toContain('WARN_GRADIENT_TRANSFORM_IGNORED');

                const el = res.elements[0];
                expect(el.style?.fills?.[0]).toMatchObject({ type: 'solid', value: '#808080', opacity: 100 });
        });

        it('falls back deterministically for unsupported url(#...) paints like <pattern> (rotate)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                <rect x="0" y="0" width="10" height="10" fill="#ff0000" />
                            </pattern>
                        </defs>
                        <rect x="0" y="0" width="10" height="10" fill="url(#p)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');

                const el = res.elements.find((e) => e?.style?.fills?.[0]?.type === 'solid' && e?.style?.fills?.[0]?.value === '#808080');
                expect(el).toBeTruthy();
        });

        it('imports a simple userSpaceOnUse <pattern> paint as an image fill (supported subset)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse">
                                <rect x="0" y="0" width="10" height="10" fill="#ff0000" />
                            </pattern>
                        </defs>
                        <rect x="0" y="0" width="10" height="10" fill="url(#p)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.style?.fills?.[0]?.type).toBe('image');
                expect(typeof el.style?.fills?.[0]?.value).toBe('string');
                expect(el.style.fills[0].value).toMatch(/^data:image\/svg\+xml,/);
                expect(el.style.fills[0].repeat).toBe('repeat');
                expect(el.style.fills[0].tileWidth).toBe(10);
                expect(el.style.fills[0].tileHeight).toBe(10);
        });

        it('imports userSpaceOnUse <pattern> with x/y offset as an image fill (supported subset) and preserves phase via tileOffset', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="p" x="5" y="7" width="10" height="10" patternUnits="userSpaceOnUse">
                                <rect x="0" y="0" width="10" height="10" fill="#ff0000" />
                            </pattern>
                        </defs>
                        <rect x="20" y="30" width="10" height="10" fill="url(#p)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');

                const el = res.elements[0];
                const f0 = el.style?.fills?.[0];
                expect(f0?.type).toBe('image');
                expect(f0?.repeat).toBe('repeat');
                expect(f0?.tileWidth).toBe(10);
                expect(f0?.tileHeight).toBe(10);
                // tileOffset aligns the pattern origin (x,y) relative to the element bbox top-left.
                // rect bbox is (20,30), pattern origin is (5,7) => offsets = (-15, -23)
                expect(f0?.tileOffsetX).toBe(-15);
                expect(f0?.tileOffsetY).toBe(-23);
        });

        it('imports userSpaceOnUse <pattern> with axis-aligned patternTransform (translate) by shifting tileOffset', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="translate(3 4)">
                                <rect x="0" y="0" width="10" height="10" fill="#ff0000" />
                            </pattern>
                        </defs>
                        <rect x="20" y="30" width="10" height="10" fill="url(#p)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');
                const f0 = res.elements[0]?.style?.fills?.[0];
                expect(f0?.type).toBe('image');
                expect(f0?.repeat).toBe('repeat');
                expect(f0?.tileWidth).toBe(10);
                expect(f0?.tileHeight).toBe(10);
                // pattern origin (0,0) with translate(3,4) => origin (3,4)
                // rect bbox top-left is (20,30) => offsets = (-17,-26)
                expect(f0?.tileOffsetX).toBe(-17);
                expect(f0?.tileOffsetY).toBe(-26);
        });

        it('imports userSpaceOnUse <pattern> with axis-aligned patternTransform (scale+translate ordering) by scaling tile size and shifting phase', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="scale(2) translate(3 4)">
                                <rect x="0" y="0" width="10" height="10" fill="#ff0000" />
                            </pattern>
                        </defs>
                        <rect x="20" y="30" width="10" height="10" fill="url(#p)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');
                const f0 = res.elements[0]?.style?.fills?.[0];
                expect(f0?.type).toBe('image');
                expect(f0?.repeat).toBe('repeat');
                // SVG transform lists apply right-to-left: translate then scale => origin (0+3,0+4) scaled => (6,8)
                expect(f0?.tileWidth).toBe(20);
                expect(f0?.tileHeight).toBe(20);
                expect(f0?.tileOffsetX).toBe(-14);
                expect(f0?.tileOffsetY).toBe(-22);
        });

        it('imports userSpaceOnUse <pattern> that inherits from another pattern via href="#..." (conservative subset)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="base" width="10" height="10" patternUnits="userSpaceOnUse">
                                <rect x="0" y="0" width="10" height="10" fill="#ff0000" />
                            </pattern>
                            <pattern id="ref" href="#base" />
                        </defs>
                        <rect x="0" y="0" width="20" height="10" fill="url(#ref)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');

                const f0 = res.elements[0]?.style?.fills?.[0];
                expect(f0?.type).toBe('image');
                expect(f0?.repeat).toBe('repeat');
                expect(f0?.tileWidth).toBe(10);
                expect(f0?.tileHeight).toBe(10);

                const decoded = decodeURIComponent(String(f0?.value || '').replace(/^data:image\/svg\+xml,/, ''));
                expect(decoded).toMatch(/<rect[^>]+fill="#ff0000"/);
        });

        it('imports userSpaceOnUse <pattern> that inherits via xlink:href (conservative subset)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <defs>
                            <pattern id="base" width="10" height="10" patternUnits="userSpaceOnUse">
                                <rect x="0" y="0" width="10" height="10" fill="#00ff00" />
                            </pattern>
                            <pattern id="ref" xlink:href="#base" />
                        </defs>
                        <rect x="0" y="0" width="20" height="10" fill="url(#ref)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');

                const f0 = res.elements[0]?.style?.fills?.[0];
                expect(f0?.type).toBe('image');
                expect(f0?.repeat).toBe('repeat');
                expect(f0?.tileWidth).toBe(10);
                expect(f0?.tileHeight).toBe(10);

                const decoded = decodeURIComponent(String(f0?.value || '').replace(/^data:image\/svg\+xml,/, ''));
                expect(decoded).toMatch(/<rect[^>]+fill="#00ff00"/);
        });

        it('imports objectBoundingBox <pattern> (conservative subset) as repeating image fill with tile size derived from element bbox', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="p" patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" x="0.25" y="0.2" width="0.25" height="0.5">
                                <rect x="0" y="0" width="1" height="1" fill="#ff0000" />
                            </pattern>
                        </defs>
                        <rect x="0" y="0" width="200" height="100" fill="url(#p)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');

                const f0 = res.elements[0]?.style?.fills?.[0];
                expect(f0?.type).toBe('image');
                expect(f0?.repeat).toBe('repeat');
                expect(typeof f0?.value).toBe('string');
                expect(f0?.value).toMatch(/^data:image\/svg\+xml,/);
                // Tile size = fractions of bbox (200x100)
                expect(f0?.tileWidth).toBe(50);
                expect(f0?.tileHeight).toBe(50);
                // Phase = x/y fractions of bbox
                expect(f0?.tileOffsetX).toBe(50);
                expect(f0?.tileOffsetY).toBe(20);
        });

        it('imports objectBoundingBox <pattern> with axis-aligned patternTransform (translate) by adjusting phase', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="p" patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" x="0.25" y="0.2" width="0.25" height="0.5" patternTransform="translate(0.1 0.05)">
                                <rect x="0" y="0" width="1" height="1" fill="#ff0000" />
                            </pattern>
                        </defs>
                        <rect x="0" y="0" width="200" height="100" fill="url(#p)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');

                const f0 = res.elements[0]?.style?.fills?.[0];
                expect(f0?.type).toBe('image');
                expect(f0?.repeat).toBe('repeat');

                // Tile size = fractions of bbox (200x100)
                expect(f0?.tileWidth).toBe(50);
                expect(f0?.tileHeight).toBe(50);

                // Phase = x/y fractions with translate(0.1,0.05) applied.
                // x=0.25->0.35 => 70px, y=0.2->0.25 => 25px.
                expect(f0?.tileOffsetX).toBe(70);
                expect(f0?.tileOffsetY).toBe(25);
        });

        it('imports objectBoundingBox <pattern> with patternContentUnits="userSpaceOnUse" (conservative subset) by normalizing user-space content into a 0..1 tile', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="120">
                        <defs>
                            <pattern id="p" patternUnits="objectBoundingBox" patternContentUnits="userSpaceOnUse" x="0.25" y="0.2" width="0.25" height="0.5">
                                <rect x="50" y="20" width="50" height="50" fill="#ff0000" />
                            </pattern>
                        </defs>
                        <rect x="0" y="0" width="200" height="100" fill="url(#p)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).not.toContain('WARN_GRADIENT_PAINT_UNSUPPORTED');

                const f0 = res.elements[0]?.style?.fills?.[0];
                expect(f0?.type).toBe('image');
                expect(f0?.repeat).toBe('repeat');
                expect(typeof f0?.value).toBe('string');
                expect(f0?.value).toMatch(/^data:image\/svg\+xml,/);
                expect(f0?.tileWidth).toBe(50);
                expect(f0?.tileHeight).toBe(50);
                expect(f0?.tileOffsetX).toBe(50);
                expect(f0?.tileOffsetY).toBe(20);

                const decoded = decodeURIComponent(String(f0?.value || '').replace(/^data:image\/svg\+xml,/, ''));
                expect(decoded).toMatch(/viewBox="0 0 1 1"/);
                // For bbox 200x100 and tile rect (x,y,w,h) = (50,20,50,50):
                // Normalize user-space into tile: x' = x/50 - 1; y' = y/50 - 0.4
                expect(decoded).toMatch(/transform="matrix\(0\.02 0 0 0\.02 -1 -0\.4\)"/);
                expect(decoded).toMatch(/<rect[^>]+x="50"[^>]+y="20"[^>]+width="50"[^>]+height="50"/);
        });

        it('warns deterministically when <pattern href> has a cycle (falls back to solid fill)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="a" href="#b" width="10" height="10" patternUnits="userSpaceOnUse" />
                            <pattern id="b" href="#a" width="10" height="10" patternUnits="userSpaceOnUse">
                                <rect x="0" y="0" width="10" height="10" fill="#ff0000" />
                            </pattern>
                        </defs>
                        <rect x="0" y="0" width="10" height="10" fill="url(#a)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).toContain('WARN_PATTERN_HREF_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.style?.fills?.[0]).toMatchObject({ type: 'solid', value: '#808080', opacity: 100 });
        });

        it('warns deterministically when <pattern href> target is missing (falls back to solid fill)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="ref" href="#missing" width="10" height="10" patternUnits="userSpaceOnUse" />
                        </defs>
                        <rect x="0" y="0" width="10" height="10" fill="url(#ref)" />
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).toContain('WARN_PATTERN_HREF_UNSUPPORTED');

                const el = res.elements[0];
                expect(el.style?.fills?.[0]).toMatchObject({ type: 'solid', value: '#808080', opacity: 100 });
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

        it('warns and ignores unsupported transforms (e.g. rotate) but still imports shapes', () => {
            const svg = '<svg xmlns="http://www.w3.org/2000/svg"><g transform="rotate(10)"><rect width="10" height="10" fill="#ff0000" /></g></svg>';
            const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
            expect(res.ok).toBe(true);
            if (!res.ok) return;

            expect(res.warnings).toContain('WARN_TRANSFORM_UNSUPPORTED');
            expect(res.elements).toHaveLength(1);
            expect(res.elements[0]?.style?.fills?.[0]).toMatchObject({ type: 'solid', value: '#ff0000', opacity: 100 });
        });

        it('salvages axis-aligned translate in a mixed transform list (translate + rotate) and preserves relative positions', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="10" height="10" fill="#00ff00" />
                        <g transform="translate(10 0) rotate(10)">
                            <rect x="0" y="0" width="10" height="10" fill="#ff0000" />
                        </g>
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).toContain('WARN_TRANSFORM_UNSUPPORTED');
                expect(res.elements).toHaveLength(2);

                const [a, b] = res.elements;
                // With translate(10,0) salvaged, the second rect remains 10 units to the right.
                expect(b.x - a.x).toBeCloseTo(10, 6);
        });

        it('salvages translation from a general matrix with shear/rotation terms (deterministic warning)', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="10" height="10" fill="#00ff00" />
                        <g transform="matrix(1 1 0 1 10 0)">
                            <rect x="0" y="0" width="10" height="10" fill="#ff0000" />
                        </g>
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings).toContain('WARN_TRANSFORM_UNSUPPORTED');
                expect(res.elements).toHaveLength(2);

                const [a, b] = res.elements;
                // Even though the matrix contains shear, we salvage the e/f translation (10,0).
                expect(b.x - a.x).toBeCloseTo(10, 6);
        });

        it('respects vector-effect="non-scaling-stroke" by not scaling stroke width/dashes when baking scale transforms', () => {
                const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                        <g transform="scale(2)">
                            <rect x="0" y="0" width="10" height="10" fill="none" stroke="#000" stroke-width="2" vector-effect="non-scaling-stroke" />
                        </g>
                    </svg>
                `;

                const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 't' });
                expect(res.ok).toBe(true);
                if (!res.ok) return;

                expect(res.warnings || []).not.toContain('WARN_VECTOR_EFFECT_UNSUPPORTED');
                expect(res.elements).toHaveLength(1);

                const el = res.elements[0];
                // Geometry is scaled.
                expect(el.width).toBeCloseTo(20, 6);
                expect(el.height).toBeCloseTo(20, 6);
                // Stroke width should remain unscaled.
                expect(el.style?.strokes?.[0]?.width).toBe(2);
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
