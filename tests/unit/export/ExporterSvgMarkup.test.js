import { describe, expect, it } from 'vitest';

import { buildSvgMarkup } from '../../../src/core/export/Exporter.js';

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

    it('exports boolean shapes as flattened <path d=...> deterministically', () => {
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
                fills: [{ visible: true, color: '#00ff00', opacity: 100 }]
            }
        };

        const slideData = { elements: { a, b, 'bool-1': bool } };
        const bounds = { x: 0, y: 0, width: 150, height: 100 };

        const svg1 = normalize(buildSvgMarkup([bool], { width: 150, height: 100, bounds, slideData }));
        const svg2 = normalize(buildSvgMarkup([bool], { width: 150, height: 100, bounds, slideData }));

        expect(svg1).toEqual(svg2);
        expect(svg1).toContain('<path');
        expect(svg1).toContain('fill="#00ff00"');
        expect(svg1).toMatch(/d="M /);
    });

    it('exports masked elements using <clipPath> + clip-path', () => {
        const content = {
            id: 'content-1',
            type: 'shape',
            shapeKind: 'vector',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            rotation: 0,
            style: {
                fills: [{ visible: true, color: '#123456', opacity: 100 }]
            },
            paths: [
                {
                    closed: true,
                    fillRule: 'nonzero',
                    start: { x: 0, y: 0 },
                    segments: [
                        { kind: 'line', to: { x: 100, y: 0 } },
                        { kind: 'line', to: { x: 100, y: 100 } },
                        { kind: 'line', to: { x: 0, y: 100 } }
                    ]
                }
            ]
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
