import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function readRegistryFromReport(markdown) {
    const start = '<!-- BENCH_REGISTRY_JSON_START -->';
    const end = '<!-- BENCH_REGISTRY_JSON_END -->';
    const startIdx = markdown.indexOf(start);
    const endIdx = markdown.indexOf(end);
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        throw new Error('Missing BENCH_REGISTRY_JSON block');
    }
    const jsonText = markdown.slice(startIdx + start.length, endIdx).trim();
    return JSON.parse(jsonText);
}

describe('PERF gate: perf-bench --gate', () => {
    it('exits non-zero when a gated metric violates its threshold', () => {
        const repoRoot = process.cwd();
        const reportPath = path.join(repoRoot, 'documentation', '03-automation', '11-performance-benchmark-report.md');
        const reportMd = fs.readFileSync(reportPath, 'utf8');
        const registry = readRegistryFromReport(reportMd);

        const gated = (registry?.metrics ?? []).find((m) => typeof m?.gate === 'number');
        if (!gated) throw new Error('No gated metrics found in registry');

        const direction = gated.direction ?? 'lte';
        const gate = gated.gate;

        const violatingValue = direction === 'gte'
            ? gate - 9999
            : gate + 9999;

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'story-perf-gate-'));
        const outFile = path.join(tmpDir, 'run.jsonl');

        // Write a deterministic run with a single metric/scenario pair.
        const records = [];
        for (let i = 0; i < 10; i++) {
            records.push({
                type: 'metric',
                metricId: gated.metricId,
                scenarioId: gated.scenarioId,
                value: violatingValue,
            });
        }
        fs.writeFileSync(outFile, records.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');

        const scriptPath = path.join(repoRoot, 'scripts', 'perf', 'perf-bench.mjs');
        const result = spawnSync(process.execPath, [
            scriptPath,
            '--no-run',
            '--no-update',
            '--gate',
            '--out',
            outFile,
        ], {
            cwd: repoRoot,
            encoding: 'utf8',
        });

        expect(result.status).toBe(1);
        expect(String(result.stderr ?? '')).toContain('Gate failures');
    });
});
