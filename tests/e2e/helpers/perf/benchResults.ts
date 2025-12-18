import fs from 'node:fs';
import path from 'node:path';

export type BenchResult = {
  type?: 'metric';
  metricId: string;
  scenarioId: string;
  unit: 'ms' | 'count' | 'mb' | 'fps';
  value: number;
  details?: Record<string, unknown>;
};

export type BenchMeta = {
  type: 'env' | 'run';
  details: Record<string, unknown>;
};

function ensureDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function writeBenchResult(result: BenchResult) {
  const outPath = process.env.BENCH_OUT;
  if (!outPath) {
    // Benchmark runs should always set this. If it isn't set, silently ignore so
    // existing tests don't break when the helper is accidentally imported.
    return;
  }

  ensureDir(outPath);

  // JSONL keeps writes simple and avoids needing an in-memory coordinator.
  // Bench runner enforces PW_WORKERS=1 to prevent concurrent writes.
  fs.appendFileSync(outPath, JSON.stringify({ type: 'metric', ...result }) + '\n', 'utf8');
}

export function writeBenchMeta(meta: BenchMeta) {
  const outPath = process.env.BENCH_OUT;
  if (!outPath) return;
  ensureDir(outPath);
  fs.appendFileSync(outPath, JSON.stringify(meta) + '\n', 'utf8');
}
