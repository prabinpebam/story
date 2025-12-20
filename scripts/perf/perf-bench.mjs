import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { lintCoverage } from './perf-coverage-lint.mjs';

const isWin = process.platform === 'win32';

function spawnSyncCross(command, args, options = {}) {
  const result = spawnSync(command, args, { ...options, shell: isWin });
  if (result?.error) {
    console.error(`[perf:bench] Failed to start: ${command} ${args.join(' ')}`);
    console.error(result.error);
  }
  return result;
}

function spawnCross(command, args, options = {}) {
  const child = spawn(command, args, { ...options, shell: isWin });
  child.on('error', (err) => {
    console.error(`[perf:bench] Failed to start: ${command} ${args.join(' ')}`);
    console.error(err);
  });
  return child;
}

const repoRoot = process.cwd();
const reportPath = path.join(repoRoot, 'documentation', '03-automation', '11-performance-benchmark-report.md');
const runsDir = path.join(repoRoot, 'documentation', '03-automation', 'perf-runs');

function usage() {
  console.log(`Usage:
  node scripts/perf/perf-bench.mjs [--no-run] [--no-update] [--out <path>] [--open] [--dev] [--strict-coverage] [--gate]

Defaults:
  - runs Playwright benchmark spec with PW_WORKERS=1
  - writes JSONL results into documentation/03-automation/perf-runs/<timestamp>.jsonl
  - updates 11-performance-benchmark-report.md (auto-generated sections)

Gate mode:
  - pass --gate to enforce registry gate thresholds (CI-style)
  - exits non-zero if any metric violates its gate threshold
  - also fails if a metric with a numeric gate has no data in the run

Server mode:
  - default uses a production-like server (build + preview) on http://127.0.0.1:5173
  - pass --dev to use the Playwright-managed dev server instead
`);
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function readRegistryFromReport(markdown) {
  const start = '<!-- BENCH_REGISTRY_JSON_START -->';
  const end = '<!-- BENCH_REGISTRY_JSON_END -->';
  const startIdx = markdown.indexOf(start);
  const endIdx = markdown.indexOf(end);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error('Missing BENCH_REGISTRY_JSON block in 11-performance-benchmark-report.md');
  }
  const jsonText = markdown
    .slice(startIdx + start.length, endIdx)
    .trim();

  return JSON.parse(jsonText);
}

function parseJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
  return lines.map((l) => JSON.parse(l));
}

function splitRecords(records) {
  const meta = {
    env: null,
    run: null,
  };
  const metrics = [];
  for (const r of records) {
    if (r?.type === 'env') meta.env = r.details ?? null;
    else if (r?.type === 'run') meta.run = r.details ?? null;
    else if (r?.type === 'metric' || (r?.metricId && r?.scenarioId)) metrics.push(r);
  }
  return { meta, metrics };
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  const clamped = Math.min(Math.max(idx, 0), sorted.length - 1);
  return sorted[clamped];
}

function computeAgg(values) {
  const nums = values.filter((v) => typeof v === 'number' && Number.isFinite(v)).slice().sort((a, b) => a - b);
  return {
    n: nums.length,
    p05: percentile(nums, 5),
    p50: percentile(nums, 50),
    p95: percentile(nums, 95),
    p99: percentile(nums, 99),
    min: nums.length ? nums[0] : null,
    max: nums.length ? nums[nums.length - 1] : null,
  };
}

function fmtMs(v) {
  if (v === null || v === undefined) return '—';
  if (!Number.isFinite(v)) return '—';
  return `${v.toFixed(1)}ms`;
}

function formatValue(unit, v) {
  if (v === null || v === undefined) return '—';
  if (!Number.isFinite(v)) return '—';
  if (unit === 'ms') return `${Number(v).toFixed(1)}ms`;
  if (unit === 'fps') return `${Number(v).toFixed(1)}fps`;
  if (unit === 'mb') return `${Number(v).toFixed(1)}MB`;
  return `${Number(v).toFixed(1)}`;
}

function formatThreshold(unit, v) {
  if (v == null) return '—';
  if (unit === 'ms') return `${v}ms`;
  if (unit === 'fps') return `${v}fps`;
  if (unit === 'mb') return `${v}MB`;
  return String(v);
}

function renderLatestRunSection({ stamp, envClass, resultsByMetricScenario, registry, meta }) {
  const lines = [];
  lines.push(`## 10) Latest Benchmark Run (Auto-Generated)`);
  lines.push('');
  lines.push(`- Run timestamp: ${stamp}`);
  lines.push(`- Environment class: ${envClass}`);
  lines.push(`- Output file: \`documentation/03-automation/perf-runs/${stamp}.jsonl\``);

  const env = meta?.env ?? null;
  const run = meta?.run ?? null;
  if (env || run) {
    lines.push('');
    lines.push('### 10.0 Run Metadata');
    lines.push('');
    if (run) {
      lines.push(`- Scenario: \`${run.scenarioId ?? 'unknown'}\``);
      lines.push(`- Warmup: ${run.warmup ?? '—'}`);
      lines.push(`- Iterations: ${run.iterations ?? '—'}`);
    }
    if (env) {
      lines.push(`- Browser: ${env.browserVersion ?? '—'}`);
      lines.push(`- Viewport: ${env.viewport ? `${env.viewport.width}x${env.viewport.height}` : '—'} @ dpr ${env.dpr ?? '—'}`);
      lines.push(`- User agent: ${env.userAgent ?? '—'}`);
      lines.push(`- Host OS (node): ${os.platform()} ${os.release()}`);
      const cpu = os.cpus()?.[0]?.model;
      if (cpu) lines.push(`- CPU (node): ${cpu}`);
    }
  }

  lines.push('');
  lines.push('### 10.1 Results (distribution vs Target/Gate)');
  lines.push('');
  lines.push('| Metric ID | Scenario ID | n | p50 | p95 | p99 | Target | Gate | Status |');
  lines.push('|---|---|---:|---:|---:|---:|---:|---:|---|');

  for (const item of registry.metrics) {
    const key = `${item.metricId}::${item.scenarioId}`;
    const agg = resultsByMetricScenario.get(key);
    const unit = item.unit ?? 'ms';
    const direction = item.direction ?? 'lte';

    const score = direction === 'gte'
      ? (agg?.p05 ?? null)
      : (agg?.p95 ?? null);

    const target = item.target ?? null;
    const gate = item.gate ?? null;

    const status = (score == null)
      ? 'NO DATA'
      : (direction === 'gte')
        ? (gate != null && score < gate)
          ? 'FAIL'
          : (target != null && score < target)
            ? 'BELOW TARGET'
            : 'PASS'
        : (gate != null && score > gate)
          ? 'FAIL'
          : (target != null && score > target)
            ? 'BELOW TARGET'
            : 'PASS';

    const fmt = (v) => (v == null ? '—' : Number(v).toFixed(1));
    lines.push(`| \`${item.metricId}\` | \`${item.scenarioId}\` | ${agg?.n ?? 0} | ${fmt(agg?.p50)} | ${fmt(agg?.p95)} | ${fmt(agg?.p99)} | ${formatThreshold(unit, target)} | ${formatThreshold(unit, gate)} | ${status} |`);
  }

  lines.push('');
  return lines.join('\n');
}

function renderFindingsSection({ registry, resultsByMetricScenario }) {
  const failing = [];
  for (const item of registry.metrics) {
    const key = `${item.metricId}::${item.scenarioId}`;
    const agg = resultsByMetricScenario.get(key);

    const direction = item.direction ?? 'lte';
    const score = direction === 'gte' ? (agg?.p05 ?? null) : (agg?.p95 ?? null);
    if (score == null) continue;

    if (typeof item.gate === 'number') {
      const fail = direction === 'gte' ? (score < item.gate) : (score > item.gate);
      if (fail) {
        failing.push({ item, agg, status: 'FAIL', score });
        continue;
      }
    }
    if (typeof item.target === 'number') {
      const below = direction === 'gte' ? (score < item.target) : (score > item.target);
      if (below) failing.push({ item, agg, status: 'BELOW TARGET', score });
    }
  }

  const lines = [];
  lines.push('## 11) Findings and Improvement Plans (Auto-Generated)');
  lines.push('');

  if (!failing.length) {
    lines.push('- All measured metrics are at or above targets (p95).');
    lines.push('');
    return lines.join('\n');
  }

  lines.push('Each item below includes a generated triage hypothesis and an improvement plan template. Replace/augment with trace-backed findings when available.');
  lines.push('');

  for (const f of failing) {
    const { metricId, scenarioId, target, gate, unit = 'ms', direction = 'lte' } = f.item;
    const score = f.score;
    const delta = (typeof target === 'number' && score != null) ? (score - target) : null;

    lines.push(`### 11.${lines.length} ${metricId} (${scenarioId})`);
    lines.push('');
    lines.push(`- Status: ${f.status}`);
    lines.push(`- Distribution: n=${f.agg.n}, p50=${formatValue(unit, f.agg.p50)}, p95=${formatValue(unit, f.agg.p95)}, p99=${formatValue(unit, f.agg.p99)}`);
    lines.push(`- Comparison rule: ${direction === 'gte' ? 'higher is better (uses p05 as score)' : 'lower is better (uses p95 as score)'}`);
    lines.push(`- Score: ${formatValue(unit, score)} (target ${formatThreshold(unit, target)}, gate ${formatThreshold(unit, gate)})`);
    if (delta != null) lines.push(`- Delta vs target: ${formatValue(unit, delta)}`);

    // Generic “why” mapping by prefix.
    let workstream = 'A';
    let likely = [];
    if (metricId.startsWith('selection.')) {
      workstream = 'A';
      likely = [
        'Hit-testing cost (candidate scan, geometry)',
        'Property Inspector render/layout churn',
        'Redundant invalidations / extra frames before stable UI',
        'Expensive derived computations in selection pipeline',
        'GC/long tasks during interaction',
      ];
    } else if (metricId.startsWith('render.') || metricId.startsWith('hittest.')) {
      workstream = 'B';
      likely = [
        'Overdraw / full-canvas redraw instead of dirty rect',
        'Vector/path operations not cached',
        'Text rasterization / cache misses',
        'Scheduling/batching causing missed frame budget',
      ];
    } else if (metricId.startsWith('startup.')) {
      workstream = 'F';
      likely = [
        'Bundle parse/compile time',
        'Synchronous startup work on main thread',
        'Font loading / layout blocking',
        'Late hydration of UI panels',
      ];
    } else if (metricId.startsWith('memory.')) {
      workstream = 'E';
      likely = [
        'Leaked event listeners/subscriptions',
        'Detached DOM nodes retained',
        'Unbounded caches (thumbnails, paths, images)',
        'Excess allocations during loops',
      ];
    } else if (metricId.startsWith('frame.') || metricId.startsWith('longtask.')) {
      workstream = 'B';
      likely = [
        'Main-thread long task(s) during interaction window',
        'Too much layout/style recalculation',
        'Excess paints/compositing work',
      ];
    }

    lines.push('');
    lines.push('- Likely contributors (hypotheses):');
    for (const l of likely) lines.push(`  - ${l}`);
    lines.push('');
    lines.push('- Evidence to collect (next run):');
    lines.push('  - Capture Playwright trace and identify the slowest iteration');
    lines.push('  - Capture DevTools Performance trace focusing on the interaction window');
    lines.push('  - Record long task counts during the interaction (if available)');
    lines.push('');
    lines.push(`- Improvement plan (start here):`);
    lines.push(`  - Run workstream ${workstream} from the audit plan for this scenario`);
    lines.push(`  - Isolate the critical path stage (hit-test vs render vs PI) with additional in-page marks`);
    lines.push(`  - Implement the smallest change that reduces p95, then re-measure (warmup + N iterations)`);
    lines.push('');
  }

  return lines.join('\n');
}

function replaceBetween(markdown, startMarker, endMarker, replacement) {
  const s = markdown.indexOf(startMarker);
  const e = markdown.indexOf(endMarker);
  if (s === -1 || e === -1 || e <= s) {
    throw new Error(`Missing markers: ${startMarker} / ${endMarker}`);
  }
  return markdown.slice(0, s + startMarker.length) + '\n' + replacement.trimEnd() + '\n' + markdown.slice(e);
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(0);
}

const noRun = args.includes('--no-run');
const noUpdate = args.includes('--no-update');
const open = args.includes('--open');
const useDevServer = args.includes('--dev');
const strictCoverage = args.includes('--strict-coverage');
const gateMode = args.includes('--gate');
const outIdx = args.indexOf('--out');
const outPath = outIdx !== -1 ? args[outIdx + 1] : null;

const stamp = nowStamp();
const outFile = outPath
  ? path.resolve(repoRoot, outPath)
  : path.join(runsDir, `${stamp}.jsonl`);

fs.mkdirSync(path.dirname(outFile), { recursive: true });

// Coverage lint: warn by default, fail only if --strict-coverage.
try {
  const { ok, errors, warnings } = lintCoverage({ mode: strictCoverage ? 'strict' : 'warn' });
  if (warnings?.length) {
    console.log('[perf:coverage] Warnings:');
    for (const w of warnings) console.log(`- ${w}`);
  }
  if (!ok && errors?.length && !strictCoverage) {
    console.log('[perf:coverage] Missing coverage (warn mode):');
    for (const e of errors) console.log(`- ${e}`);
  }
} catch (e) {
  if (strictCoverage) throw e;
  console.log(`[perf:coverage] Skipped due to error (warn mode): ${e?.message ?? e}`);
}

if (!noRun) {
  // Clean previous output if any.
  if (fs.existsSync(outFile)) fs.unlinkSync(outFile);

  const env = {
    ...process.env,
    PW_WORKERS: '1',
    BENCH_OUT: outFile,
    BENCH_WARMUP: process.env.BENCH_WARMUP ?? '5',
    BENCH_N: process.env.BENCH_N ?? '10',
  };

  let serverProc = null;
  if (!useDevServer) {
    // Production-like server per audit plan: build + preview.
    const build = spawnSyncCross('npm', ['run', 'build'], { stdio: 'inherit' });
    if (build.status !== 0) process.exit(build.status ?? 1);

    serverProc = spawnCross('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
      stdio: 'inherit',
      env: { ...process.env },
    });

    // Wait for server.
    const waitFor = async (timeoutMs = 60000) => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const ok = await new Promise((resolve) => {
          const req = http.get('http://127.0.0.1:5173', (res) => {
            res.resume();
            resolve(res.statusCode && res.statusCode >= 200 && res.statusCode < 500);
          });
          req.on('error', () => resolve(false));
        });
        if (ok) return;
        await new Promise((r) => setTimeout(r, 250));
      }
      throw new Error('Timed out waiting for preview server at http://127.0.0.1:5173');
    };

    await waitFor();

    // Ensure Playwright reuses the already-running server.
    env.PW_REUSE_EXISTING_SERVER = 'true';
    env.BASE_URL = 'http://127.0.0.1:5173';
  }

  const result = spawnSyncCross(
    'npx',
    ['playwright', 'test', 'tests/e2e/specs/performance/performance-benchmark-suite.spec.ts'],
    { stdio: 'inherit', env }
  );

  if (serverProc) {
    try {
      if (process.platform === 'win32' && serverProc.pid) {
        spawnSync('taskkill', ['/PID', String(serverProc.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        serverProc.kill('SIGTERM');
      }
    } catch {
      // Best-effort shutdown.
    }
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// Registry + aggregation (needed for both report update and gate mode).
let registry = null;
let meta = null;
let resultsByMetricScenario = null;
try {
  const reportMd = fs.readFileSync(reportPath, 'utf8');
  registry = readRegistryFromReport(reportMd);

  const rawAll = parseJsonl(outFile);
  const split = splitRecords(rawAll);
  meta = split.meta;
  const raw = split.metrics;
  resultsByMetricScenario = new Map();

  // Aggregate by (metricId, scenarioId)
  for (const m of registry.metrics) {
    const key = `${m.metricId}::${m.scenarioId}`;
    const values = raw
      .filter((r) => r.metricId === m.metricId && r.scenarioId === m.scenarioId)
      .map((r) => r.value);
    resultsByMetricScenario.set(key, computeAgg(values));
  }
} catch (e) {
  if (gateMode) {
    console.error(`[perf:bench] Gate mode requires registry + results: ${e?.message ?? e}`);
    process.exit(1);
  }
}

if (!noUpdate && registry && resultsByMetricScenario) {
  const reportMd = fs.readFileSync(reportPath, 'utf8');

  const latest = renderLatestRunSection({
    stamp,
    envClass: registry.envClass || 'unspecified',
    resultsByMetricScenario,
    registry,
    meta,
  });

  const findings = renderFindingsSection({ registry, resultsByMetricScenario });

  const updated = replaceBetween(
    reportMd,
    '<!-- BEGIN AUTO:LAST_RUN -->',
    '<!-- END AUTO:LAST_RUN -->',
    latest + '\n\n' + findings
  );

  fs.writeFileSync(reportPath, updated, 'utf8');
  console.log(`\nUpdated report: ${path.relative(repoRoot, reportPath)}`);
}

if (gateMode && registry && resultsByMetricScenario) {
  const failures = [];
  for (const item of registry.metrics) {
    if (typeof item.gate !== 'number') continue;

    const key = `${item.metricId}::${item.scenarioId}`;
    const agg = resultsByMetricScenario.get(key);
    const direction = item.direction ?? 'lte';
    const score = direction === 'gte' ? (agg?.p05 ?? null) : (agg?.p95 ?? null);

    if (score == null) {
      failures.push({ item, reason: 'NO DATA' });
      continue;
    }

    const fail = direction === 'gte' ? (score < item.gate) : (score > item.gate);
    if (fail) failures.push({ item, reason: `GATE VIOLATION (${score})` });
  }

  if (failures.length) {
    console.error('\n[perf:bench] Gate failures:');
    for (const f of failures) {
      console.error(`- ${f.item.metricId} (${f.item.scenarioId}) -> ${f.reason} (gate=${f.item.gate}, direction=${f.item.direction ?? 'lte'})`);
    }
    process.exit(1);
  }
}

if (open) {
  // Best-effort: print path for the user to open in editor.
  console.log(`\nOpen: ${path.relative(repoRoot, reportPath)}`);
}
