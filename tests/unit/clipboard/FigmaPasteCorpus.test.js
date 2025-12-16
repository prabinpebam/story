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
    it('basic fixtures stay stable (hash + warnings)', () => {
        const svgPath = path.join(CORPUS_DIR, 'basic-rect-gradient.svg');
        const expectedPath = path.join(CORPUS_DIR, 'basic-rect-gradient.expected.json');

        const svg = readText(svgPath);
        const expected = readJson(expectedPath);

        const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 'corpus' });
        expect(res.ok).toBe(true);
        if (!res.ok) return;

        expect(res.warnings).toEqual(expected.warnings);
        expect(res.elements.length).toBe(expected.elementsCount);

        // Hash only the imported payload we care about for determinism.
        const digest = canonicalSha256({ elements: res.elements, warnings: res.warnings });

        expect(digest).toBe(expected.sha256);
    });
});
