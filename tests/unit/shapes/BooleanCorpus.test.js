import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { computeBooleanPaths } from '../../../src/core/shapes/booleans/BooleanEngine.js';
import { canonicalSha256 } from '../../helpers/canonicalHash.js';

const CORPUS_DIR = path.resolve(process.cwd(), 'tests/corpus/shapes/booleans');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertFinitePaths(paths) {
    const all = Array.isArray(paths) ? paths : [];
    for (const p of all) {
        const pts = [];
        if (p?.start) pts.push(p.start);
        for (const seg of p?.segments || []) {
            if (seg?.to) pts.push(seg.to);
            if (seg?.c1) pts.push(seg.c1);
            if (seg?.c2) pts.push(seg.c2);
        }
        for (const pt of pts) {
            if (!pt) continue;
            expect(Number.isFinite(pt.x)).toBe(true);
            expect(Number.isFinite(pt.y)).toBe(true);
        }
    }
}

describe('Boolean corpus (determinism + safety)', () => {
    const cases = [
        { name: 'simple-union' },
        { name: 'simple-intersect' },
        { name: 'simple-subtract' },
        { name: 'fallback-degenerate' },
        { name: 'fallback-invalid-operation' }
    ];

    for (const c of cases) {
        it(`${c.name} stays stable (hash + status)`, () => {
            const inputPath = path.join(CORPUS_DIR, `${c.name}.json`);
            const expectedPath = path.join(CORPUS_DIR, `${c.name}.expected.json`);

            const input = readJson(inputPath);
            const expected = readJson(expectedPath);

            const res = computeBooleanPaths({ operation: input.operation, operands: input.operands });

            assertFinitePaths(res.paths);

            expect(res.status).toBe(expected.status);

            const digest = canonicalSha256({ status: res.status, paths: res.paths });
            expect(digest).toBe(expected.sha256);
        });
    }
});
