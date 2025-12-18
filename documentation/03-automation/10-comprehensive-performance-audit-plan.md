# Comprehensive Performance Audit Plan (World‑Class)

Date: 2025-12-18

## 0) Purpose
Story is a canvas-heavy, real-time editor. Performance is a product feature and must be treated as **non-negotiable**.

This document is a **plan** for a deep, comprehensive performance audit that goes beyond surface metrics. It defines:
- A measurable **Performance Contract** (budgets + definitions)
- A **reproducible measurement methodology** (stable, statistically meaningful)
- A set of **profiling workstreams** to find root causes (CPU/GPU/render/state/memory/startup)
- A **regression prevention system** (CI gates + artifacts + dashboards)
- A process to produce a prioritized **fix backlog** with expected wins

This plan assumes we will iterate after we establish baselines.

---

## 1) Non‑Negotiables
1. **Budgets are enforced** (CI gates), not aspirational.
2. Metrics must be **trustworthy** (repeatable, p95-focused, measured in-page when needed).
3. The audit must cover **end-to-end user-perceived latency**, not just microbenchmarks.
4. Performance must include **headroom** (targets are stricter than what we ship today).
5. We must address **time + consistency**: average speed is not enough; tail latency (p95/p99) matters.
6. We must prevent **performance debt** by making regressions visible immediately.

---

## 2) What “World‑Class” Means (Performance Contract)
We maintain two thresholds per metric:
- **Target**: where we want to be to keep headroom.
- **Gate**: what CI enforces (must pass).

### 2.1 Interaction latency (user-perceived)
Definitions are explicit; each metric states start/end conditions.

| Metric | Definition (Start → End) | Target | Gate |
|---|---|---:|---:|
| Selection highlight latency | PointerUp on element → selection visuals visible (outline/handles) | < 50ms | < 80ms |
| Selection “PI ready” latency | PointerUp on element → PI shows correct sections & computed values | < 80ms | < 120ms |
| Tool switch latency | User action → tool active UI + cursor state ready | < 50ms | < 80ms |
| Drag start latency | PointerDown → first drag feedback frame (ghost/outline/preview) | < 16ms | < 32ms |
| Typing latency | KeyDown → glyph/caret update committed | < 16ms | < 30ms |
| Slide switch latency | Slide click/shortcut → canvas + UI reflect new slide fully | < 100ms | < 180ms |
| Theme switch latency | Theme action → all affected UI/canvas styles stable | < 120ms | < 200ms |

Notes:
- Targets above are intentionally stricter than existing `PERF05 < 200ms`.
- “PI ready” is expected to be slower than “selection highlight.” We must measure both.

### 2.1.1 Operational Definitions (“Done” Signals)
To make these metrics CI-grade (low noise), every **End** condition must be a single, deterministic application signal.

Rules:
- **No “wait for selector visible” as the end condition** for perf metrics. Selectors are for correctness checks; perf end conditions must be app-emitted.
- “Visible” means **the app commits the UI state that the user perceives**, recorded by an explicit mark emitted at the commit point.

Required end marks (examples; names are contractual):
- Selection highlight latency ends at `selection:highlight_committed`.
- Selection “PI ready” latency ends at `pi:ready_committed`.
- Tool switch latency ends at `tool:switch_committed`.

These marks must be emitted at the moment the app considers the stage complete (typically after the first post-update render commit / rAF where the new state is reflected).

### 2.1.2 Metric IDs, Scenario IDs, and Naming (Required)
To prevent “same metric, different meaning” drift, every gated metric must have:
- a stable **metric id** (used in JSON, dashboards, diffs)
- a stable **scenario id** (what flow produced it)
- a stable **stage id** (highlight vs PI-ready, etc.)

Naming conventions:
- Metric ids are lowercase dot-separated: `selection.highlight.latency_ms`, `selection.pi_ready.latency_ms`.
- Scenario ids are lowercase dot-separated: `selection.simple_rect`, `selection.complex_vector`, `tool_switch.text`.
- Marks are colon-separated, stage-scoped: `selection:highlight_committed`, `pi:ready_committed`.

Rule:
- A metric id may only change if its Start/End definition changes (treat as a breaking change).

### 2.2 Frame budgets (smoothness)
| Scenario | Target | Gate |
|---|---:|---:|
| Steady-state UI | 60fps (16.7ms/frame) | no sustained drops below 55fps |
| Worst-case during interaction | < 24ms/frame | < 33ms/frame |
| Long tasks | 0 tasks > 50ms during core interactions | alert on > 50ms |

### 2.3 Canvas/render budgets
| Scenario | Target | Gate |
|---|---:|---:|
| Simple slide render | < 16ms | < 33ms |
| Complex slide render | < 50ms | < 100ms |
| Hit-test per pointer event | < 2ms | < 5ms |

### 2.4 Startup budgets
| Metric | Target | Gate |
|---|---:|---:|
| Time-to-interactive (editor usable) | < 2s (warm) / < 3s (cold) | baseline by device class |
| First editor frame | < 1s (warm) / < 2s (cold) | baseline by device class |

### 2.5 Memory budgets (headroom over time)
- No unbounded growth over a 30–60 minute scripted session.
- For defined scenarios (see §6 Workstream E), cap heap delta and ensure stabilization after GC.

---

## 3) Measurement Methodology (Make Numbers Real)
Performance work fails when numbers are noisy. We standardize how we measure.

### 3.1 Three tiers of measurement
1. **In-app instrumentation (micro-metrics)**
   - `performance.mark/measure` inside the app
   - `PerformanceObserver` for `longtask`
   - counters (draw calls, invalidations, hit-test candidates)
2. **Journey benchmarks (Playwright)**
   - repeatable user flows
   - report distribution (p50/p90/p95/p99)
   - capture artifacts on regression
3. **Deep profiling**
   - Chrome DevTools Performance traces
   - CDP: heap snapshots, allocation sampling, CPU throttling
   - GPU/paint analysis where possible

### 3.2 Statistical requirements
- Each perf test runs **N measured iterations** (default: 30; for flakier metrics: 50–100).
- Report: **p50/p95** (and p99 for core journeys).
- Regression detection uses **p95 deltas** vs baseline.

#### 3.2.1 Warmup + Sampling Protocol (Required)
To reduce noise from JIT, caches, fonts, and first-run work:
- Warmup: run **W=5** iterations and discard results.
- Measure: run **N** iterations and record results.
- Reset: clear marks/measures and any in-page perf buffers between iterations.
- If fonts affect layout/PI, ensure `document.fonts.ready` is awaited once per run before warmup.

Outliers:
- Do not “drop worst samples” silently.
- Instead, record a count of long tasks / GC-like pauses and attach a trace for the slowest iteration when a run fails.

#### 3.2.2 Pass/Fail Rules (CI-Grade)
Perf gates must specify **exactly** how failure is determined.

Recommended default:
- For a metric $M$ in a run, compute p95 across the measured iterations.
- **PR lane:** fail only on regression vs baseline (see §8.2.1).
- **Nightly lane:** enforce absolute gates (see §8.2.2) once baselines are stable.

#### 3.2.3 Stability Criteria (When We Trust a Metric)
Before enforcing **absolute** gates for a metric, the measurement must demonstrate stability.

Minimum stability checks (per metric, per scenario, per environment class):
- Over at least **10 nightly runs**, p95 should not drift > **10%** without a known cause.
- If p95 variability is too large to make 10–15ms deltas meaningful, treat it as a harness issue.

Operational rule:
- If a metric is unstable, keep it **regression-only** (PR lane) and prioritize reducing noise.

### 3.3 Environment control
- Primary perf claims use **production build** (not dev server).
- Separate lanes:
  - PR lane: fast, stable smoke-perf
  - Nightly lane: full perf suite + soak + traces
- Standardize:
  - browser channel/version
  - viewport size + DPR
  - CPU throttling profile(s)
  - cold vs warm cache

#### 3.3.1 Concrete Defaults (So Runs Are Reproducible)
- Build mode: run perf tests against a production-like server (`vite build` + `vite preview`) rather than `vite dev`.
- Browser: use the Playwright-managed browser version (record the actual version in the perf JSON).
- Viewport/DPR: fixed viewport and DPR for all perf runs (recorded in env fingerprint).
- Throttling policy:
  - PR lane: no CPU throttling (minimize runner variance by using regression-only gates).
  - Nightly lane: optional fixed CPU throttling profile (Chromium-only) to simulate mid-tier devices, tracked separately from the PR lane.

#### 3.3.2 Environment Fingerprint (Always Captured)
Every run exports an `env` object:
- commit SHA, branch, CI/local
- OS + version
- CPU model (best-effort) and core count
- Playwright version + browser version
- headless/headed
- viewport + DPR
- perf flags enabled

### 3.4 Fix the current Playwright perf pattern
Current `tests/e2e/specs/performance/app-performance.spec.ts` uses `Date.now()` and waits on DOM selectors; this conflates app work with test harness overhead.

Plan:
- Measure key timings **inside the page** with `performance.now()`.
- Introduce explicit “done” signals for each pipeline stage (selection highlight vs PI ready).
- Keep Playwright’s role to:
  - trigger the action
  - retrieve measured results
  - enforce thresholds
  - attach traces/artifacts

### 3.5 Perf Harness Contract (Required)
To make metrics deterministic and reusable, introduce a small, stable in-page API.

Contract (example shape; implement as a single global, only when perf is enabled):
- `window.__perf.startRun({ runId, scenario, env })`
- `window.__perf.startIteration({ iteration })`
- `window.__perf.mark(name)`
- `window.__perf.measure(name, startMark, endMark)`
- `window.__perf.count(name, delta = 1)`
- `window.__perf.endIteration()`
- `window.__perf.getAndReset(): { env, iterations, aggregates }`

Rules:
- Must support *reset* so measures don’t accumulate and distort memory.
- Must be safe to leave enabled in CI (bounded buffers).
- Must not change behavior when disabled (off by default).

#### 3.5.1 Result Shape and Size Limits (Required)
The harness must be able to export a single JSON payload with:
- `env` (see §3.3.2)
- `run` metadata (scenario id, warmup/iterations)
- iteration samples
- aggregates (p50/p95/p99)
- diagnostics (long tasks, worst iteration id, artifact refs)

Size limits:
- CI JSON payload should stay small (order of 10s–100s of KB).
- Heavy artifacts (traces/videos) are referenced by filename, not embedded.

---

## 4) Instrumentation Plan (What We Add to Find Root Causes)
We add a performance instrumentation layer that can be enabled via a flag (e.g. query param `?perf=1` or env) and is off by default.

### 4.0 Deterministic “Done” Marks (Required)
For every gated metric, add an explicit “committed” mark emitted at the true end of the pipeline stage.

Minimum set to support current priorities:
- `selection:highlight_committed`
- `pi:ready_committed`

Implementation guideline:
- Emit the committed mark at the point the app would claim “the user can see/act on the result”, typically after the state update and the next render commit.

#### 4.0.1 Mark Emission Pattern (How to Avoid False “Done”)
Use a consistent pattern so “done” represents the first frame where the user-perceived result is committed.

Guideline:
- Prefer emitting committed marks on the **next animation frame** after the state change that drives rendering.

Anti-patterns:
- Emitting “committed” immediately after dispatching state (before render)
- Using Playwright selector visibility as the end condition (see §2.1.1)

### 4.1 Required timing marks
At minimum:
- `input:click_received`
- `selection:hit_test_start` / `selection:hit_test_end`
- `selection:state_update_start` / `selection:state_update_end`
- `render:invalidate_start` / `render:invalidate_end`
- `render:frame_commit` (after canvas + overlays settle)
- `pi:render_start` / `pi:render_end`
- `fonts:load_start` / `fonts:load_end`

### 4.2 Long task & event loop health
- `PerformanceObserver` for `longtask` entries
- `requestAnimationFrame` drift stats during interactions
- number and total duration of long tasks during each journey

### 4.3 Render counters
- invalidation count per interaction
- draw calls per frame (and per layer)
- hit-test candidates scanned
- DOM mutation counts in PI per selection
- forced reflow detection (where feasible)

### 4.4 Memory counters
- heap usage snapshots (periodic)
- listener/subscription counts (leak detection)
- cache sizes (thumbnails, derived paths, etc.)

### 4.5 Perf artifact export
- Export JSON for a run:
  - environment info
  - distribution stats
  - top long tasks
  - counters
  - stage timings

### 4.6 Artifact Hygiene (Required)
Perf artifacts can be large and can leak sensitive details.

Rules:
- Do not export raw document content, user identifiers, or local file paths.
- Keep perf JSON small (prefer aggregates + worst-iteration pointers).
- On CI, retain heavy artifacts (traces/videos) only on failure and only for a bounded retention period.

---

## 5) Audit Workflow (How We Run the Audit)
The audit is executed in phases to avoid thrashing.

### Phase 0 — Day 1: Make One Metric Trustworthy (first 24h)
Goal: ship a minimal, correct perf harness and convert the current failing selection test to in-page measurement.

Deliverables:
- A minimal `window.__perf` harness (see §3.5)
- Deterministic “done” marks for selection (see §4.0)
- A rewritten selection perf test that:
  - runs against a production-like server
  - uses warmup + measured iterations (see §3.2.1)
  - reports p50/p95 and exports JSON
- A PR-lane regression gate (see §8.2.1)

Day-1 implementation recipe (concrete):
1) Add a perf enablement flag (example: `?perf=1`) that causes the app to expose `window.__perf`.
2) In `tests/e2e/specs/performance/app-performance.spec.ts`, rewrite `PERF05` to:
  - avoid `Date.now()` and `.toBeVisible()` as the *end condition*
  - still trigger the gesture via `CanvasHelper.clickAt(...)`
  - read in-page measurements from `window.__perf.getAndReset()`
3) Ensure fonts are not a hidden variable:
  - call `await editor.waitForFonts()` once before warmup (already available in `tests/e2e/pages/EditorPage.ts`).
4) Run warmup + measured iterations:
  - warmup W=5
  - measure N=30 (increase if variance is high)
5) Export JSON and attach artifacts on failure:
  - env fingerprint
  - p50/p95/p99
  - worst iteration id + trace ref

### Phase 1 — Baseline & contract (1–3 days)
- Establish the Performance Contract thresholds.
- Run baseline captures across device/browser matrix.
- Identify top failing metrics (p95) and select first deep-dive targets.

### Phase 2 — Make measurement robust (2–5 days)
- Implement instrumentation scaffolding.
- Convert perf tests to in-page measurement.
- Ensure results are stable enough for CI gating.

### Phase 3 — Deep profiling workstreams (2–4 weeks)
- Execute workstreams A–G (below).
- For each workstream: baseline → trace → isolate → propose fixes → verify improvements.

### Phase 4 — CI gates + dashboards (1–2 weeks)
- PR smoke-perf gates.
- Nightly full suite with trend storage.
- Dashboards and regression alerts.

### Phase 5 — Continuous performance program (ongoing)
- Perf budgets evolve with features, but never loosen without explicit decision and justification.

---

## 6) Profiling Workstreams (Deep Root-Cause Work)
Each workstream produces: traces, root-cause findings, fix proposals, and measurable expected wins.

### 6.0 Workstream Deliverable Template (Required)
Each workstream A–G must produce:
- A short report: scope, environment fingerprint, baseline p95/p99, top 5 contributors, and recommended fixes
- A trace set: minimal reproduction trace(s) with labels ("simple", "typical", "worst")
- A verification plan: which metric(s) should improve, expected win, and how we will re-measure

Ownership:
- Assign a single owner per workstream (TBD in this plan; required before execution).

### Workstream A — Selection latency end-to-end (critical: current `PERF05`)
Decompose selection into:
1) input dispatch
2) hit-testing
3) state updates + derived computations
4) render invalidation scheduling
5) canvas draw + overlays
6) PI render + layout
7) side effects (thumbnails, preview generation, fonts)

Actions:
- Capture DevTools traces for:
  - simple shape selection
  - complex vector selection
  - multi-select
  - selection with heavy panels open
- Identify:
  - long tasks
  - forced layout
  - redundant renders
  - expensive selectors / DOM churn
  - GC pauses

Deliverable: “Selection Pipeline Report” with a critical path diagram and top 5 contributors.

### Workstream B — Canvas rendering pipeline (CPU/GPU)
Scenarios:
- idle
- hover feedback
- drag move
- resize
- pan/zoom
- complex slide

Focus:
- overdraw vs dirty rect
- repeated vector operations
- text rasterization and caching
- scheduling: batching invalidations, coalescing frames

Deliverable: “Rendering Pipeline Audit” with recommended architectural changes and quick wins.

### Workstream C — Property Inspector performance
Selection often gates on PI.

Audit:
- PI render time per selection
- DOM churn (rebuild vs diff)
- layout/style recalculation
- forced reflows

Deliverable: “PI Performance Audit” with refactor targets.

### Workstream D — State management & event architecture
Audit:
- event graph on selection/drag/typing
- high-frequency subscribers
- expensive derived computations
- history/undo overhead and coalescing

Deliverable: “State/Event Audit” listing hot subscriptions and proposed batching/memoization boundaries.

### Workstream E — Memory, GC, and leaks (headroom)
Soak scripts (30–60 min):
- create 100 slides, rapid switching
- import images/videos; delete and undo
- boolean ops and vector edits
- open/close panels in loops
- undo/redo loops

Collect:
- heap snapshots (CDP)
- allocation sampling
- detached DOM nodes
- listener growth

Deliverable: “Memory/Leak Audit” with repro steps.

### Workstream F — Startup, bundling, and runtime loading
Audit:
- bundle composition (size, duplicates, parse/compile)
- code-splitting strategy
- font loading strategy
- lazy-loading heavy panels

Deliverable: “Startup Audit” with actionable bundling and loading changes.

### Workstream G — Media pipeline (images/video)
Audit:
- decode/resize/filter costs
- caching strategy
- off-main-thread feasibility (Workers)

Deliverable: “Media Pipeline Audit”.

---

## 7) Benchmark Matrix (Proof Across Real Targets)
We define permanent benchmark axes.

### 7.1 Device classes
- Dev high-end baseline
- Mid-tier laptop baseline
- Low-end/throttled profile
- Windows ARM64 (must be first-class)

### 7.2 Browsers
- Chromium primary
- WebKit/Firefox as needed for parity

### 7.3 Document complexity tiers
- Simple
- Typical
- Heavy

Each perf run records: environment fingerprint + tier + results.

---

## 8) CI Gates & Regression Prevention
### 8.1 Lanes
- **PR lane (smoke perf):** fast subset, low noise; blocks regressions.
- **Nightly lane:** full suite (p95), memory soak, trace artifacts.

### 8.2 Storage & diffing
- Store results per commit (JSON).
- Compare p95 to baseline (main branch or rolling window).
- Fail when regression exceeds threshold.

#### 8.2.1 PR Lane: Regression-Only Gates (Recommended Default)
To avoid noisy failures early, PR lane gates should be regression-only.

Default policy (per metric):
- Compute p95 for the PR run.
- Compare to baseline p95.
- Fail if regression exceeds **both**:
  - absolute delta > 15ms, and
  - relative delta > 10%

This prevents small fluctuations from failing PRs while still blocking meaningful regressions.

Baseline policy:
- Baselines update only on `main` after merge.
- Keep a short rolling window to detect drift.

#### 8.2.2 Nightly Lane: Absolute Gates (After Stabilization)
Once measurement is stable (e.g., 1–2 weeks with low variance):
- Enforce absolute gates from the Performance Contract.
- Still record regressions vs baseline for trend visibility.

#### 8.2.3 Baseline Storage Policy (Concrete)
Baselines must be reproducible and reviewable.

Policy:
- PR lane compares against a baseline derived from `main`.
- Nightly lane writes a single “run record” per commit.

Recommended storage layout (example; adjust to repo conventions):
- `tests/e2e/artifacts/perf/runs/<commit>/<scenario>.json` (nightly)
- `tests/e2e/artifacts/perf/baselines/<scenario>.json` (main baseline)

Baseline update rule:
- Update baselines only via:
  - merge to `main` (nightly selects a representative run), or
  - an explicit “baseline refresh” workflow, reviewed like code.

### 8.3 Artifacts on failure
- Playwright trace
- DevTools trace
- screenshots/videos
- perf JSON report

Additions:
- Attach the slowest-iteration trace for a failing run (so we can root-cause outliers).
- Cap retention and sanitize paths/identifiers (see §4.6).

---

## 9) Prioritization Rubric (How We Choose Fixes)
Rank each candidate fix by:
- Expected p95 improvement (ms)
- Blast radius risk
- Complexity
- Time-to-validate
- Architectural leverage (adds headroom)

Output: a backlog with “expected win” and measurement plan for each item.

---

## 10) Immediate Focus (Based on Current Data)
Observed:
- `PERF05` (selection → PI visible) fails at ~230ms on this machine vs `<200ms`.

Plan:
1) Split the metric into:
   - selection highlight latency
   - selection PI-ready latency
2) Implement deterministic “done” marks for both (see §2.1.1 and §4.0).
3) Measure in-page with `performance.now()` and the perf harness contract (see §3.4 and §3.5).
4) Run warmup + measured iterations and record p50/p95 (see §3.2.1).
5) Use PR-lane regression gates first; tighten absolute gates only after stability (see §8.2).
6) Capture traces for worst iterations on failure.

---

## 11) Outputs (What “Done” Looks Like)
- A committed Performance Contract
- A stable perf harness (p95-driven) with artifacts
- Root-cause reports for A–G workstreams
- CI gates for smoke + nightly
- A prioritized backlog with measurable wins

---

## Appendix A — Notes on Existing Repo Assets
- Existing perf targets and examples live in `documentation/03-automation/07-performance-testing-guide.md`.
- Current Playwright perf spec: `tests/e2e/specs/performance/app-performance.spec.ts`.

## Appendix B — Perf JSON Example (Contract-Level)
Example (shape, not final fields):

```json
{
  "env": {
    "commit": "<sha>",
    "os": "windows",
    "cpu": "<best-effort>",
    "playwright": "<version>",
    "browser": "chromium <version>",
    "headless": true,
    "viewport": { "width": 1280, "height": 720 },
    "dpr": 1,
    "flags": { "perf": true }
  },
  "run": {
    "scenarioId": "selection.simple_rect",
    "warmup": 5,
    "iterations": 30
  },
  "samples": {
    "selection.highlight.latency_ms": [41.2, 39.8, 45.1],
    "selection.pi_ready.latency_ms": [92.4, 88.0, 110.5]
  },
  "aggregates": {
    "selection.highlight.latency_ms": { "p50": 41.0, "p95": 62.0, "p99": 75.0 },
    "selection.pi_ready.latency_ms": { "p50": 93.0, "p95": 128.0, "p99": 160.0 }
  },
  "diagnostics": {
    "longTasks": { "count": 0, "totalMs": 0 },
    "worstIteration": 17,
    "traceRef": "trace-worst-iteration.zip"
  }
}
```

## Appendix C — Concrete PERF05 Conversion (Recipe)
Current state: `PERF05` in `tests/e2e/specs/performance/app-performance.spec.ts` uses `Date.now()` and waits for `.pi-section` visibility.

Target state:
- Split into two metrics:
  - `selection.highlight.latency_ms`
  - `selection.pi_ready.latency_ms`
- End conditions are app-emitted marks:
  - `selection:highlight_committed`
  - `pi:ready_committed`

Playwright responsibilities:
- perform the gesture (e.g., `CanvasHelper.clickAt(0.2, 0.2)`)
- request the measurement payload from `window.__perf`
- compute p50/p95 and enforce gates

Harness responsibilities:
- clear marks between iterations
- record iteration samples
- expose `getAndReset()` for test retrieval

Acceptance criteria for “conversion complete”:
- `PERF05` no longer uses `Date.now()`.
- `PERF05` does not use DOM visibility waits as end conditions.
- Results include p50/p95 and an env fingerprint.
- On failure, the slowest iteration is identifiable and a trace is attached.

