import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const reportPath = path.join(repoRoot, 'documentation', '03-automation', '11-performance-benchmark-report.md');
const catalogPath = path.join(repoRoot, 'documentation', '03-automation', '13-performance-benchmark-coverage-catalog.md');

function readJsonBlock({ markdown, start, end, errorName }) {
  const startIdx = markdown.indexOf(start);
  const endIdx = markdown.indexOf(end);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error(`Missing ${errorName} block`);
  }
  const jsonText = markdown.slice(startIdx + start.length, endIdx).trim();
  return JSON.parse(jsonText);
}

export function loadRegistry() {
  const md = fs.readFileSync(reportPath, 'utf8');
  return readJsonBlock({
    markdown: md,
    start: '<!-- BENCH_REGISTRY_JSON_START -->',
    end: '<!-- BENCH_REGISTRY_JSON_END -->',
    errorName: 'BENCH_REGISTRY_JSON',
  });
}

export function loadCoverageCatalog() {
  const md = fs.readFileSync(catalogPath, 'utf8');
  return readJsonBlock({
    markdown: md,
    start: '<!-- BENCH_COVERAGE_CATALOG_JSON_START -->',
    end: '<!-- BENCH_COVERAGE_CATALOG_JSON_END -->',
    errorName: 'BENCH_COVERAGE_CATALOG_JSON',
  });
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

export function lintCoverage({ mode = 'strict' } = {}) {
  const registry = loadRegistry();
  const catalog = loadCoverageCatalog();

  const errors = [];
  const warnings = [];

  const metrics = Array.isArray(registry.metrics) ? registry.metrics : [];
  const knownCategories = new Set(Object.keys(catalog.categories ?? {}));

  // Basic validation
  const seenKeys = new Set();
  for (const m of metrics) {
    const key = `${m.metricId}::${m.scenarioId}`;
    if (seenKeys.has(key)) errors.push(`Duplicate metric/scenario pair: ${key}`);
    seenKeys.add(key);

    if (!m.metricId || !m.scenarioId) errors.push(`Metric missing metricId/scenarioId: ${JSON.stringify(m)}`);
    if (!m.category) errors.push(`Metric is missing category: ${key}`);
    else if (!knownCategories.has(m.category)) errors.push(`Unknown category '${m.category}' for ${key}`);

    const direction = m.direction ?? 'lte';
    if (!['lte', 'gte'].includes(direction)) errors.push(`Invalid direction '${direction}' for ${key}`);
  }

  // Required V1 coverage
  const categoriesInRegistry = new Set(metrics.map((m) => m.category).filter(Boolean));
  const scenariosInRegistry = new Set(metrics.map((m) => m.scenarioId).filter(Boolean));

  for (const cat of catalog.v1RequiredCategories ?? []) {
    if (!categoriesInRegistry.has(cat)) errors.push(`Missing required category in registry: ${cat}`);
  }
  for (const scenario of catalog.v1RequiredScenarios ?? []) {
    if (!scenariosInRegistry.has(scenario)) errors.push(`Missing required scenario in registry: ${scenario}`);
  }

  // Helpful hints
  const unusedCatalogCategories = uniq((catalog.v1RequiredCategories ?? []).filter((c) => !knownCategories.has(c)));
  for (const c of unusedCatalogCategories) warnings.push(`v1RequiredCategories contains undefined category: ${c}`);

  const ok = errors.length === 0;
  return { ok, errors, warnings, registry, catalog };
}

function parseArgs(argv) {
  const args = { mode: 'strict' };
  for (const a of argv) {
    if (a === '--mode=warn' || a === '--warn') args.mode = 'warn';
    if (a === '--mode=strict' || a === '--strict') args.mode = 'strict';
  }
  return args;
}

function main() {
  const { mode } = parseArgs(process.argv.slice(2));
  const res = lintCoverage({ mode });

  if (res.warnings.length) {
    console.log('[perf:coverage] Warnings:');
    for (const w of res.warnings) console.log(`- ${w}`);
  }

  if (!res.ok) {
    console.log('[perf:coverage] Missing coverage / invalid registry:');
    for (const e of res.errors) console.log(`- ${e}`);
    if (mode === 'warn') {
      console.log('[perf:coverage] Continuing (warn mode).');
      process.exit(0);
    }
    process.exit(1);
  }

  console.log('[perf:coverage] OK');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
