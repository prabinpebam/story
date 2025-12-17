import { describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import path from 'node:path';

import { importEditableShapesFromSanitizedSvg } from '../../../src/core/clipboard/EditableSvgImporter.js';
import { buildSvgMarkup } from '../../../src/core/export/Exporter.js';

const STRESS_SVG_PATH = path.resolve(process.cwd(), 'tests/fixtures/shapes/stress/editable-svg-grid.svg');

function loadStressSvg() {
    try {
        if (fs.existsSync(STRESS_SVG_PATH)) {
            return fs.readFileSync(STRESS_SVG_PATH, 'utf8');
        }
    } catch {
        // Fall back to generated SVG if the fixture is unavailable.
    }
    return buildLargeSvg();
}

function buildLargeSvg({ cols = 25, rows = 20, cell = 20 } = {}) {
    const width = cols * cell;
    const height = rows * cell;

    let parts = [];
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`);

    // Deterministic set of shapes: simple rect grid, with periodic rotations to force baked geometry.
    // Keep this representative but not enormous; this is a smoke check, not a micro-benchmark.
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const rx = x * cell;
            const ry = y * cell;
            const idx = y * cols + x;
            const color = (idx % 2 === 0) ? '#ff0000' : '#00aaff';

            if (idx % 11 === 0) {
                // Rotate around the cell center.
                const cx = rx + cell / 2;
                const cy = ry + cell / 2;
                parts.push(`  <g transform="rotate(15 ${cx} ${cy})"><rect x="${rx}" y="${ry}" width="${cell}" height="${cell}" fill="${color}" /></g>`);
            } else if (idx % 17 === 0) {
                // Shear via matrix to exercise full affine baking.
                parts.push(`  <g transform="matrix(1 0.2 0 1 ${rx} ${ry})"><rect x="0" y="0" width="${cell}" height="${cell}" fill="${color}" /></g>`);
            } else {
                parts.push(`  <rect x="${rx}" y="${ry}" width="${cell}" height="${cell}" fill="${color}" />`);
            }
        }
    }

    parts.push(`</svg>`);
    return parts.join('\n');
}

function maybeGc() {
    // Optional: Node may be started without --expose-gc; keep this best-effort.
    if (typeof globalThis.gc === 'function') {
        try { globalThis.gc(); } catch { /* noop */ }
    }
}

describe('PERF (smoke): clipboard import/export', () => {
    it('imports a large SVG without timeouts/crashes and stays within wide time/memory bounds', () => {
        const svg = loadStressSvg();

        maybeGc();
        const memBefore = process.memoryUsage().heapUsed;

        const t0 = performance.now();
        const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 'perf' });
        const t1 = performance.now();

        expect(res.ok).toBe(true);
        if (!res.ok) return;

        // Wide threshold: keeps this a smoke gate (CI variance friendly).
        const importMs = t1 - t0;
        expect(importMs).toBeLessThan(8000);

        maybeGc();
        const memAfter = process.memoryUsage().heapUsed;
        const deltaMb = (memAfter - memBefore) / (1024 * 1024);
        expect(deltaMb).toBeLessThan(250);
    }, 30000);

    it('exports imported elements back to SVG without timeouts/crashes (wide threshold)', () => {
        const svg = loadStressSvg();
        const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: 'perf' });
        expect(res.ok).toBe(true);
        if (!res.ok) return;

        const t0 = performance.now();
        const out = buildSvgMarkup(res.elements, { width: 600, height: 400 });
        const t1 = performance.now();

        expect(typeof out).toBe('string');
        expect(out.includes('<svg')).toBe(true);

        const exportMs = t1 - t0;
        expect(exportMs).toBeLessThan(8000);
    }, 30000);

    it('repeated imports do not grow memory unbounded (best-effort)', () => {
        const svg = loadStressSvg();

        maybeGc();
        const baseline = process.memoryUsage().heapUsed;

        for (let i = 0; i < 10; i++) {
            const res = importEditableShapesFromSanitizedSvg(svg, { centerX: 0, centerY: 0, idSeed: `perf-${i}` });
            expect(res.ok).toBe(true);
        }

        maybeGc();
        const after = process.memoryUsage().heapUsed;
        const deltaMb = (after - baseline) / (1024 * 1024);

        // Wide threshold; this catches runaway allocations but avoids flaking.
        expect(deltaMb).toBeLessThan(350);
    }, 30000);
});
