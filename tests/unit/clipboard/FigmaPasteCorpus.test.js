import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { importEditableShapesFromSanitizedSvg } from '../../../src/core/clipboard/EditableSvgImporter.js';
import { canonicalSha256 } from '../../helpers/canonicalHash.js';

const CORPUS_DIR = path.resolve(process.cwd(), 'tests/corpus/shapes/figma-paste');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readText(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

describe('Figma paste corpus (determinism)', () => {
    const cases = [
        { name: 'clip-path-basic' },
        { name: 'mask-basic' },
        { name: 'basic-rect-gradient' },
        { name: 'gradient-href-basic' },
        { name: 'gradient-href-cycle' },
        { name: 'gradient-transform-scale' },
        { name: 'gradient-transform-userspace-viewbox' },
        { name: 'gradient-transform-rotate-unsupported' },
        { name: 'radial-gradient-basic' },
        { name: 'radial-gradient-fallback' },
        { name: 'pattern-basic' },
        { name: 'pattern-offset' },
        { name: 'pattern-transform-axis-aligned' },
        { name: 'pattern-objectBoundingBox-basic' },
        { name: 'pattern-objectBoundingBox-contentUnits-userSpaceOnUse' },
        { name: 'pattern-href-basic' },
        { name: 'pattern-href-cycle' },
        { name: 'pattern-paint-fallback' },
        { name: 'group-scale-rect' },
        { name: 'transform-order-translate-scale' },
        { name: 'transform-list-matrix-scale' }
    ];

    for (const c of cases) {
        it(`${c.name} stays stable (hash + warnings)`, () => {
            const svgPath = path.join(CORPUS_DIR, `${c.name}.svg`);
            const expectedPath = path.join(CORPUS_DIR, `${c.name}.expected.json`);

            const svg = readText(svgPath);
            const expected = readJson(expectedPath);

            const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 'corpus' });
            expect(res.ok).toBe(true);
            if (!res.ok) return;

            expect(res.warnings).toEqual(expected.warnings);
            expect(res.elements.length).toBe(expected.elementsCount);

            const digest = canonicalSha256({ elements: res.elements, warnings: res.warnings });
            expect(digest).toBe(expected.sha256);
        });
    }
});
