import { describe, expect, it } from 'vitest';

import { buildSvgMarkup, prepareSvgExportElements } from '../../../src/core/export/Exporter.js';

function normalize(svg) {
    return String(svg).replace(/\s+/g, ' ').trim();
}

describe('Exporter SVG markup', () => {
    it('exports vector shapes as <path d=...>', () => {
        const vectorEl = {
            id: 'vec-1',
            type: 'shape',
            shapeKind: 'vector',
            x: 10,
            y: 20,
            width: 100,
            height: 50,
            rotation: 0,
            style: {
                fills: [{ visible: true, color: '#ff0000', opacity: 100 }],
                strokes: [{ visible: true, color: '#000000', width: 2, opacity: 100 }]
            },
            paths: [
                {
                    closed: true,
                    fillRule: 'nonzero',
                    start: { x: 0, y: 0 },
                    segments: [
                        { kind: 'line', to: { x: 100, y: 0 } },
                        { kind: 'line', to: { x: 100, y: 50 } },
                        { kind: 'line', to: { x: 0, y: 50 } }
                    ]
                }
            ]
        };

        const bounds = { x: 10, y: 20, width: 100, height: 50 };
        const svg = buildSvgMarkup([vectorEl], { width: 100, height: 50, bounds, slideData: { elements: { 'vec-1': vectorEl } } });
        const s = normalize(svg);

        expect(s).toContain('<svg');
        expect(s).toContain('<path');
        expect(s).toMatch(/d="M 0 0 L 100 0 L 100 50 L 0 50 Z"/);
        expect(s).toContain('fill="#ff0000"');
        expect(s).toContain('stroke="#000000"');
    });

    it('exports rotation using rotate(...) in the group transform', () => {
        const rect = {
            id: 'rect-rot',
            type: 'shape',
            shapeKind: 'rectangle',
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            rotation: 45,
            style: {
                fills: [{ visible: true, color: '#ff00ff', opacity: 100 }]
            }
        };

        const bounds = { x: 0, y: 0, width: 100, height: 50 };
        const svg = normalize(buildSvgMarkup([rect], { width: 100, height: 50, bounds, slideData: { elements: { 'rect-rot': rect } } }));

        expect(svg).toContain('transform="translate(0 0) rotate(45 50 25)"');
        expect(svg).toContain('<rect');
    });

    it('exports gradient fills via <linearGradient> in <defs>', () => {
        const rect = {
            id: 'grad-rect-1',
            type: 'shape',
            shapeKind: 'rectangle',
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            rotation: 0,
            style: {
                fills: [{ visible: true, type: 'gradient', value: 'linear-gradient(90deg, #000000 0%, #FFFFFF 100%)', opacity: 100 }]
            }
        };

        const bounds = { x: 0, y: 0, width: 100, height: 50 };
        const svg = normalize(buildSvgMarkup([rect], { width: 100, height: 50, bounds, slideData: { elements: { 'grad-rect-1': rect } } }));

        expect(svg).toContain('<defs>');
        expect(svg).toMatch(/<linearGradient id="fill-grad-grad-rect-1-0-[-\d]+"/);
        expect(svg).toMatch(/fill="url\(#fill-grad-grad-rect-1-0-[-\d]+\)"/);
        expect(svg).toContain('<stop');
    });

    it('exports radial gradient fills via <radialGradient> in <defs>', () => {
        const rect = {
            id: 'rad-grad-rect-1',
            type: 'shape',
            shapeKind: 'rectangle',
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            rotation: 0,
            style: {
                fills: [{ visible: true, type: 'gradient', value: 'radial-gradient(circle, #000000 0%, #FFFFFF 100%)', opacity: 100 }]
            }
        };

        const bounds = { x: 0, y: 0, width: 100, height: 50 };
        const svg = normalize(buildSvgMarkup([rect], { width: 100, height: 50, bounds, slideData: { elements: { 'rad-grad-rect-1': rect } } }));

        expect(svg).toContain('<defs>');
        expect(svg).toMatch(/<radialGradient id="fill-grad-rad-grad-rect-1-0-[-\d]+"/);
        expect(svg).toMatch(/fill="url\(#fill-grad-rad-grad-rect-1-0-[-\d]+\)"/);
        expect(svg).toContain('<stop');
    });

    it('exports image fills via <pattern> + <image> in <defs>', () => {
        const rect = {
            id: 'img-rect-1',
            type: 'shape',
            shapeKind: 'rectangle',
            x: 0,
            y: 0,
            width: 120,
            height: 80,
            rotation: 0,
            style: {
                fills: [{ visible: true, type: 'image', value: 'data:image/png;base64,AAAA', opacity: 100 }]
            }
        };

        const bounds = { x: 0, y: 0, width: 120, height: 80 };
        const svg = normalize(buildSvgMarkup([rect], { width: 120, height: 80, bounds, slideData: { elements: { 'img-rect-1': rect } } }));

        expect(svg).toContain('<defs>');
        expect(svg).toMatch(/<pattern id="fill-img-img-rect-1-0-[-\d]+"/);
        expect(svg).toMatch(/fill="url\(#fill-img-img-rect-1-0-[-\d]+\)"/);
        expect(svg).toContain('<image');
        expect(svg).toContain('href="data:image/png;base64,AAAA"');
    });

    it('exports theme-slot solid fills as resolved colors', () => {
        const rect = {
            id: 'theme-rect-1',
            type: 'shape',
            shapeKind: 'rectangle',
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            rotation: 0,
            style: {
                fills: [{ visible: true, type: 'solid', themeSlot: 11, value: '#ffffff', opacity: 100 }]
            }
        };

        const bounds = { x: 0, y: 0, width: 100, height: 50 };
        const svg = normalize(buildSvgMarkup([rect], {
            width: 100,
            height: 50,
            bounds,
            slideData: { elements: { 'theme-rect-1': rect } },
            resolveThemeSlot: (slot, fallback) => (slot === 11 ? '#ABCDEF' : fallback)
        }));

        expect(svg).toContain('fill="#ABCDEF"');
    });

    it('degrades unhandled shape kinds to bounding box and emits warnings metadata', () => {
        const el = {
            id: 'u1',
            type: 'shape',
            shapeKind: 'future-kind',
            x: 10,
            y: 20,
            width: 100,
            height: 50,
            rotation: 0,
            style: { fills: [{ visible: true, type: 'solid', value: '#ff0000', opacity: 100 }] }
        };

        const bounds = { x: 10, y: 20, width: 100, height: 50 };
        const svg = normalize(buildSvgMarkup([el], {
            width: 100,
            height: 50,
            bounds,
            slideData: { elements: { u1: el } }
        }));

        expect(svg).toContain('<rect x="0" y="0" width="100" height="50"');
        expect(svg).toContain('story-export-warnings');
        expect(svg).toContain('unhandled-shape-kind');
        expect(svg).toContain('future-kind');
    });

    it('exports image fills using assetId when resolver is provided', () => {
        const rect = {
            id: 'img-asset-1',
            type: 'shape',
            shapeKind: 'rectangle',
            x: 0,
            y: 0,
            width: 120,
            height: 80,
            rotation: 0,
            style: {
                fills: [{ visible: true, type: 'image', assetId: 'img_123', opacity: 100 }]
            }
        };

        const bounds = { x: 0, y: 0, width: 120, height: 80 };
        const svg = normalize(buildSvgMarkup([rect], {
            width: 120,
            height: 80,
            bounds,
            slideData: { elements: { 'img-asset-1': rect } },
            resolveAssetUrl: (assetId) => (assetId === 'img_123' ? 'data:image/png;base64,ASSET' : null)
        }));

        expect(svg).toContain('<defs>');
        expect(svg).toContain('href="data:image/png;base64,ASSET"');
        expect(svg).toMatch(/fill="url\(#fill-img-img-asset-1-0-[-\d]+\)"/);
    });

    it('rasterizes code fills into image patterns for SVG export (policy)', async () => {
        const rect = {
            id: 'code-rect-1',
            type: 'shape',
            shapeKind: 'rectangle',
            x: 0,
            y: 0,
            width: 64,
            height: 32,
            rotation: 0,
            style: {
                fills: [{ visible: true, type: 'code', code: '({ draw(t){ /* noop */ } })', opacity: 100 }]
            }
        };

        const prepared = await prepareSvgExportElements([rect], {
            rasterizeCodeFill: async () => 'data:image/png;base64,CODE'
        });

        const bounds = { x: 0, y: 0, width: 64, height: 32 };
        const svg = normalize(buildSvgMarkup(prepared, { width: 64, height: 32, bounds, slideData: { elements: { 'code-rect-1': prepared[0] } } }));

        expect(svg).toContain('<pattern');
        expect(svg).toContain('href="data:image/png;base64,CODE"');
    });

    it('rasterizes video fills into image patterns for SVG export (policy)', async () => {
        const rect = {
            id: 'video-rect-1',
            type: 'shape',
            shapeKind: 'rectangle',
            x: 0,
            y: 0,
            width: 64,
            height: 32,
            rotation: 0,
            style: {
                fills: [{ visible: true, type: 'video', assetId: 'vid_123', posterFrame: 0, opacity: 100 }]
            }
        };

        const prepared = await prepareSvgExportElements([rect], {
            rasterizeVideoFill: async () => 'data:image/jpeg;base64,VID'
        });

        const bounds = { x: 0, y: 0, width: 64, height: 32 };
        const svg = normalize(buildSvgMarkup(prepared, { width: 64, height: 32, bounds, slideData: { elements: { 'video-rect-1': prepared[0] } } }));

        expect(svg).toContain('<pattern');
        expect(svg).toContain('href="data:image/jpeg;base64,VID"');
    });

    it('exports boolean shapes as flattened <path d=...> (deterministic)', () => {
        const a = {
            id: 'a',
            type: 'shape',
            shapeKind: 'rectangle',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            rotation: 0,
            params: { cornerRadii: [0, 0, 0, 0] }
        };

        const b = {
            id: 'b',
            type: 'shape',
            shapeKind: 'rectangle',
            x: 50,
            y: 0,
            width: 100,
            height: 100,
            rotation: 0,
            params: { cornerRadii: [0, 0, 0, 0] }
        };

        const bool = {
            id: 'bool-1',
            type: 'shape',
            shapeKind: 'boolean',
            x: 0,
            y: 0,
            width: 150,
            height: 100,
            rotation: 0,
            operation: 'union',
            operands: ['a', 'b'],
            style: {
                fills: [{ visible: true, type: 'solid', value: '#123456', opacity: 100 }]
            }
        };

        const slideData = { elements: { a, b, 'bool-1': bool } };
        const bounds = { x: 0, y: 0, width: 150, height: 100 };
        const svg = normalize(buildSvgMarkup([bool], { width: 150, height: 100, bounds, slideData }));

        expect(svg).toContain('<path');
        expect(svg).toContain('fill="#123456"');
    });

    it('exports masks as SVG <clipPath> applied to content elements', () => {
        const content = {
            id: 'content-1',
            type: 'shape',
            shapeKind: 'rectangle',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            rotation: 0,
            style: {
                fills: [{ visible: true, type: 'solid', value: '#123456', opacity: 100 }]
            },
            params: { cornerRadii: [0, 0, 0, 0] }
        };

        const maskShape = {
            id: 'mask-shape-1',
            type: 'shape',
            shapeKind: 'rectangle',
            x: 0,
            y: 0,
            width: 50,
            height: 100,
            rotation: 0,
            params: { cornerRadii: [0, 0, 0, 0] }
        };

        const maskNode = {
            id: 'mask-1',
            type: 'shape',
            shapeKind: 'mask',
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            rotation: 0,
            maskShapeId: 'mask-shape-1',
            contentIds: ['content-1'],
            mode: 'clip',
            invert: false
        };

        const slideData = { elements: { 'content-1': content, 'mask-shape-1': maskShape, 'mask-1': maskNode } };
        const bounds = { x: 0, y: 0, width: 100, height: 100 };

        const svg = normalize(buildSvgMarkup([content], { width: 100, height: 100, bounds, slideData }));
        expect(svg).toContain('<defs>');
        expect(svg).toContain('<clipPath');
        expect(svg).toContain('clip-path="url(#clip-content-1)"');
    });
});
