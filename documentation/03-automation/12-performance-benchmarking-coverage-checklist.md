# Performance Benchmarking Coverage Checklist (Audit Plan Compliance)

Purpose: map `10-comprehensive-performance-audit-plan.md` requirements to what the repo’s **on-demand benchmarking automation** currently implements.

Legend:
- **Implemented**: present in code and used by `npm run perf:bench`
- **Partial**: present but not fully aligned with the audit plan definition
- **Missing**: not implemented yet

---

## A) Audit Plan → Automation Mapping

### 0) Purpose / Single Source of Truth
- Single canonical benchmark registry doc exists: **Implemented** (`11-performance-benchmark-report.md`)
- Automated updates after each run: **Implemented** (`scripts/perf/perf-bench.mjs` updates `<!-- BEGIN AUTO:LAST_RUN -->`)

### 1) Non‑Negotiables
- Budgets “enforced” (CI gates): **Missing** (intentional; manual-only per current requirement)
- Trustworthy metrics (repeatable, p95): **Partial**
  - Implemented warmup + N iterations for one scenario
  - End condition is still provisional (DOM-derived) until app marks exist
- End-to-end user-perceived latency focus: **Partial** (only selection PI-ready is measured today)
- Tail latency focus (p95/p99): **Implemented** in reporting/aggregation (runner computes p50/p95/p99)
- Regression visibility: **Partial** (results recorded per run; no baseline diffing yet)

### 2) Performance Contract
- Target/Gate thresholds defined: **Implemented** in machine-readable registry (`Appendix B` JSON)
- Metric IDs / Scenario IDs conventions: **Implemented** (registry uses stable ids)
- Deterministic done signals: **Missing (app-side)**
  - Plan requires app marks like `pi:ready_committed`
  - Current benchmark uses PI "Fill" visibility via MutationObserver (explicitly marked provisional)

### 3) Measurement Methodology
- In-page measurement (`performance.now()`): **Implemented** (pointerup start captured in-page)
- Warmup protocol (W=5) and measured iterations (N=30): **Implemented** (configurable via `BENCH_WARMUP`, `BENCH_N`)
- Percentiles reported (p50/p95/p99): **Implemented**
- Outlier handling (trace for slowest iteration on failure): **Missing**
  - Requires either automatic rerun with trace or always-on trace capture
- Environment control (production build): **Implemented by default**
  - Runner defaults to `npm run build` + `npm run preview` and sets `PW_REUSE_EXISTING_SERVER=true`
  - `--dev` flag forces Playwright-managed dev server (not recommended for perf claims)
- Environment fingerprint: **Partial**
  - Captures UA, viewport, DPR, browser version
  - Does not yet capture commit SHA/branch automatically

### 3.5 Perf Harness Contract (`window.__perf`)
- Explicit perf harness API (`window.__perf`): **Missing**
  - Current implementation is a minimal `window.__bench` helper injected by the benchmark spec
  - Plan-compliant `window.__perf` should be implemented in-app behind `?perf=1`

### 4) Instrumentation Plan
- Deterministic committed marks: **Missing** (requires app changes)
- Longtask observation: **Partial**
  - Captures longtask entries and aggregates count/total for the measured window
- Render counters / memory counters / stage timing marks: **Missing**

### 5) Workflow
- Phase 0 day-1 deliverable (convert PERF05 to in-page measurement with warmup/N): **Partial**
  - Benchmark path exists and measures in-page with iterations
  - Still provisional end condition; no `window.__perf` contract yet

### 6) Workstreams A–G
- Workstream program itself: **Not applicable to automation**, but the runner auto-generates “why/plan” sections that reference workstreams as next actions: **Implemented** (as hypotheses)

### 7) Benchmark Matrix
- Environment classes documented: **Implemented** in `11-performance-benchmark-report.md`
- Multi-device/browser matrix execution: **Missing** (manual process, not automated)

### 8) Storage & Regression Prevention
- Store results per run: **Implemented** (`documentation/03-automation/perf-runs/<timestamp>.jsonl`)
- Baseline diffing rules: **Missing**
- Artifacts on failure (trace/devtools trace): **Missing**

---

## B) Current Automation Entry Points

- Run benchmarks (recommended, production-like): `npm run perf:bench`
- Run benchmarks using dev server: `npm run perf:bench -- --dev`

Files:
- Runner: `scripts/perf/perf-bench.mjs`
- Benchmark spec: `tests/e2e/specs/performance/performance-benchmark-run.spec.ts`
- Result writer: `tests/e2e/helpers/perf/benchResults.ts`
- Report: `documentation/03-automation/11-performance-benchmark-report.md`

---

## C) Required Next Steps to Reach Full Audit-Plan Compliance

1) Implement plan-compliant perf harness + deterministic marks
- Add `window.__perf` behind `?perf=1`
- Emit `selection:highlight_committed` and `pi:ready_committed` at true commit points

2) Convert benchmarks to use marks (no DOM-based end)
- Use marks/measures for Start/End
- Keep Playwright responsible only for triggering and retrieving results

3) Add artifact capture on failure
- Trace capture for slowest iteration
- Optional automatic rerun with `--trace on` when failing

4) Add baseline storage + diffing (optional for manual use, required for “regression program”)
- Baseline files per scenario
- Regression thresholds (absolute + relative)

This checklist is intentionally strict: anything that depends on app-side marks is marked **Missing** until it is implemented in the application.
