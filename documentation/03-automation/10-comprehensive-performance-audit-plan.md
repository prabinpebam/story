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
- Each perf test runs **N iterations** (default: 30; for flakier metrics: 50–100).
- Report: **p50/p95** (and p99 for core journeys).
- Regression detection uses **p95 deltas** vs baseline.

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

---

## 4) Instrumentation Plan (What We Add to Find Root Causes)
We add a performance instrumentation layer that can be enabled via a flag (e.g. query param `?perf=1` or env) and is off by default.

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

---

## 5) Audit Workflow (How We Run the Audit)
The audit is executed in phases to avoid thrashing.

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

### 8.3 Artifacts on failure
- Playwright trace
- DevTools trace
- screenshots/videos
- perf JSON report

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
2) Measure in-page with stage marks.
3) Run N iterations and record p95.
4) Capture traces for worst cases.
5) Fix top contributors; only then tighten gates aggressively.

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

