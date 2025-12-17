import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { canonicalizeVectorPaths } from '../../../src/core/shapes/paths/VectorPathOps.js';
import { canonicalSha256 } from '../../helpers/canonicalHash.js';

const CORPUS_DIR = path.resolve(process.cwd(), 'tests/corpus/shapes/paths');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

describe('Paths corpus (determinism + canonicalization)', () => {
    const cases = [{ name: 'canonicalize-basic' }];

    for (const c of cases) {
        it(`${c.name} stays stable (hash)`, () => {
            const inputPath = path.join(CORPUS_DIR, `${c.name}.json`);
            const expectedPath = path.join(CORPUS_DIR, `${c.name}.expected.json`);

            const input = readJson(inputPath);
            const expected = readJson(expectedPath);

            const canon = canonicalizeVectorPaths(input.paths, 1e-6);

            // Idempotent.
            const canon2 = canonicalizeVectorPaths(canon, 1e-6);
            expect(canon2).toEqual(canon);

            const digest = canonicalSha256({ paths: canon });
            expect(digest).toBe(expected.sha256);
        });
    }
});
