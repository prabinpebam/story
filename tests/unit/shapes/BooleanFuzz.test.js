import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { computeBooleanPaths } from '../../../src/core/shapes/booleans/BooleanEngine.js';
import { canonicalSha256 } from '../../helpers/canonicalHash.js';

const CORPUS_DIR = path.resolve(process.cwd(), 'tests/corpus/shapes/booleans');

function xorshift32(seed) {
  let x = seed | 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    // Convert to [0,1)
    return ((x >>> 0) / 0x100000000);
  };
}

function randRange(rng, min, max) {
  return min + (max - min) * rng();
}

function rectRing(x, y, w, h) {
  // Martinez expects open rings; engine will close.
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h]
  ];
}

function makeOperand(rng, { rects = 3 } = {}) {
  /** @type {any[]} */
  const poly = [];
  // Single polygon with multiple rings is supported, but we keep one ring per polygon for simplicity.
  for (let i = 0; i < rects; i++) {
    const x = randRange(rng, -200, 200);
    const y = randRange(rng, -200, 200);
    const w = randRange(rng, 5, 120);
    const h = randRange(rng, 5, 120);
    poly.push([rectRing(x, y, w, h)]);
  }
  return poly;
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

function maybeWriteCorpus({ seed, caseIndex, input, output }) {
  if (process.env.WRITE_SHAPES_FUZZ_CORPUS !== '1') return;
  fs.mkdirSync(CORPUS_DIR, { recursive: true });

  const base = `fuzz-seed-${seed}-case-${caseIndex}`;
  const inputPath = path.join(CORPUS_DIR, `${base}.json`);
  const expectedPath = path.join(CORPUS_DIR, `${base}.expected.json`);

  const sha256 = canonicalSha256({ status: output.status, paths: output.paths });

  fs.writeFileSync(inputPath, JSON.stringify(input, null, 2), 'utf8');
  fs.writeFileSync(expectedPath, JSON.stringify({ status: output.status, sha256 }, null, 2), 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Wrote fuzz repro: ${inputPath}`);
}

describe('Boolean fuzz (seeded, reproducible)', () => {
  it('does not crash, stays finite, and is deterministic for a fixed seed', () => {
    const seed = Number(process.env.SHAPES_FUZZ_SEED ?? 1337);
    const cases = Number(process.env.SHAPES_FUZZ_CASES ?? 40);

    const operations = /** @type {Array<'union'|'subtract'|'intersect'|'exclude'>} */ (['union', 'subtract', 'intersect', 'exclude']);

    for (let i = 0; i < cases; i++) {
      const rng = xorshift32((seed + i * 1013904223) | 0);

      const operation = operations[Math.floor(rng() * operations.length)];
      const a = makeOperand(rng, { rects: 1 + Math.floor(rng() * 4) });
      const b = makeOperand(rng, { rects: 1 + Math.floor(rng() * 4) });

      const input = { operation, operands: [a, b] };

      let out1;
      let out2;
      try {
        out1 = computeBooleanPaths(input);
        out2 = computeBooleanPaths(input);
      } catch (e) {
        throw new Error(`Boolean fuzz crashed (seed=${seed}, case=${i}, op=${operation}): ${String(e)}`);
      }

      assertFinitePaths(out1.paths);
      assertFinitePaths(out2.paths);

      const h1 = canonicalSha256({ status: out1.status, paths: out1.paths });
      const h2 = canonicalSha256({ status: out2.status, paths: out2.paths });

      if (h1 !== h2) {
        maybeWriteCorpus({ seed, caseIndex: i, input, output: out1 });
        throw new Error(`Boolean fuzz nondeterminism (seed=${seed}, case=${i}, op=${operation}): ${h1} != ${h2}`);
      }
    }
  });
});
