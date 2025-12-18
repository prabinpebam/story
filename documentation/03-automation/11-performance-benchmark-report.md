# Performance Benchmark Report (Single Source of Truth)

This document is the canonical, structured registry of **what we measure**, **how we measure it**, **how often we run it**, and **how we decide pass/fail**.

It is intentionally “timeless”: it describes the benchmarking system and the *current* performance contract, not week-by-week status.

Related docs:
- Measurement methodology + audit program: `10-comprehensive-performance-audit-plan.md`
- How to run perf checks (existing test harness patterns): `07-performance-testing-guide.md`

This report is updated by the benchmark runner:
- Command: `npm run perf:bench`
- Runner: `scripts/perf/perf-bench.mjs`

---

## 0) Scope
This report covers:
- **User-perceived latency** (interaction responsiveness)
- **Smoothness** (frame budgets, long tasks)
- **Canvas/render budgets** (render + hit-testing)
- **Startup** (time-to-interactive and first frame)
- **Memory/GC stability** (soak and leak detection)

Out of scope for this document:
- Root-cause analysis and fix design (covered by the audit plan workstreams)

---

## 1) Definitions (Must Not Drift)

### 1.1 Metric ID
A stable identifier used in JSON, dashboards, and CI gates. Example: `selection.pi_ready.latency_ms`.

### 1.2 Scenario ID
A stable identifier describing the flow that produced a metric. Example: `selection.simple_rect`.

### 1.3 Start/End Conditions
Every metric has an explicit **Start → End** definition.

Rule:
- Perf end conditions should be **app-emitted deterministic marks** (audit plan). Until those exist, a benchmark may use a provisional DOM-derived end condition, but it must:
  - label the metric as **provisional** in results
  - prioritize adding the deterministic mark as the first improvement action

See: `10-comprehensive-performance-audit-plan.md` (§2.1.1, §2.1.2, §4.0).

---

## 2) Benchmark Lanes and Cadence

### 2.1 Manual lane (On-demand)
Purpose: you run it whenever you want, and the report is updated immediately.
- Gate type: reporting by default (no automatic CI gating)
- Typical runtime goal: adjustable (smoke subset vs broader run)

### 2.2 Optional lanes (Future)
If we later choose to run benchmarks on a schedule or gate PRs, we can add:
- PR lane (regression-only)
- Scheduled lane (absolute + trends)

---

## 3) Environment Classes (Benchmark Matrix)
We track results by environment class; we do not mix baselines across classes.

Required classes:
- `dev.high_end`
- `laptop.mid_tier`
- `runner.ci`
- `windows.arm64`

Each run must capture an **environment fingerprint** (OS, CPU best-effort, Playwright+browser versions, viewport/DPR, flags). See `10-comprehensive-performance-audit-plan.md` (§3.3.2).

---

## 4) Performance Contract Registry
This is the authoritative list of gated metrics, their definitions, and their thresholds.

### 4.1 Interaction latency
| Metric ID | Scenario ID | Start → End | Target | Gate | Lane | Status |
|---|---|---|---:|---:|---|---|
| `selection.highlight.latency_ms` | `selection.simple_rect` | PointerUp on element → `selection:highlight_committed` | < 50ms | < 80ms | PR+Nightly | Planned |
| `selection.pi_ready.latency_ms` | `selection.simple_rect` | PointerUp on element → `pi:ready_committed` | < 80ms | < 120ms | PR+Nightly | Planned |
| `tool_switch.latency_ms` | `tool_switch.text` | Tool action → `tool:switch_committed` | < 50ms | < 80ms | Nightly | Planned |
| `drag.start.latency_ms` | `drag.simple_shape` | PointerDown → first drag feedback commit mark | < 16ms | < 32ms | Nightly | Planned |
| `typing.latency_ms` | `typing.simple_text` | KeyDown → glyph/caret commit mark | < 16ms | < 30ms | Nightly | Planned |
| `slide_switch.latency_ms` | `slide_switch.typical_deck` | Slide change action → slide fully reflected commit mark | < 100ms | < 180ms | Nightly | Planned |
| `theme_switch.latency_ms` | `theme_switch.typical_deck` | Theme action → theme fully stable commit mark | < 120ms | < 200ms | Nightly | Planned |

Notes:
- The `Status` field is operational: `Planned`, `Instrumented`, `Measured`, `Gated`.
- A metric should only become `Gated` after meeting stability criteria (see §7).

### 4.2 Smoothness and long tasks
| Metric ID | Scenario ID | Definition | Target | Gate | Lane | Status |
|---|---|---|---:|---:|---|---|
| `frame.steady.p95_ms` | `idle.typical` | p95 frame time during steady state window | < 16.7ms | < 18.2ms | Nightly | Planned |
| `frame.interaction.p95_ms` | `selection.simple_rect` | p95 frame time during interaction window | < 24ms | < 33ms | Nightly | Planned |
| `longtask.count` | `selection.simple_rect` | number of long tasks >50ms during interaction | 0 | alert >0 | Nightly | Planned |

### 4.3 Canvas/render budgets
| Metric ID | Scenario ID | Definition | Target | Gate | Lane | Status |
|---|---|---|---:|---:|---|---|
| `render.simple_slide.p95_ms` | `render.simple_slide` | p95 render time for simple slide render | < 16ms | < 33ms | Nightly | Planned |
| `render.complex_slide.p95_ms` | `render.complex_slide` | p95 render time for complex slide render | < 50ms | < 100ms | Nightly | Planned |
| `hittest.pointer.p95_ms` | `selection.simple_rect` | p95 hit-test time per pointer event | < 2ms | < 5ms | Nightly | Planned |

### 4.4 Startup budgets
| Metric ID | Scenario ID | Definition | Target | Gate | Lane | Status |
|---|---|---|---:|---:|---|---|
| `startup.tti_ms` | `startup.warm` | navigation start → editor usable mark | < 2000ms | class baseline | Nightly | Planned |
| `startup.first_frame_ms` | `startup.warm` | navigation start → first editor frame committed | < 1000ms | class baseline | Nightly | Planned |

### 4.5 Memory and soak
| Metric ID | Scenario ID | Definition | Target | Gate | Lane | Status |
|---|---|---|---:|---:|---|---|
| `memory.heap_delta_mb` | `soak.60min` | heap delta after GC across soak window | stabilize | class baseline | Weekly | Planned |
| `memory.detached_nodes` | `soak.60min` | detached DOM nodes count trend | 0 growth | alert | Weekly | Planned |

---

## 5) Scenario Catalog (What We Run)
Each scenario is a reproducible scriptable flow with known initial state, fixed viewport/DPR, and deterministic completion marks.

### 5.1 Selection
- `selection.simple_rect`: single rectangle on empty slide, click-to-select
- `selection.complex_vector`: complex path, click-to-select
- `selection.multi_select`: shift-click multi-select

### 5.2 Canvas interactions
- `drag.simple_shape`: drag a rectangle across the canvas
- `resize.simple_shape`: resize via handle drag
- `pan.zoom`: pan and zoom loop

### 5.3 UI/Inspector
- `tool_switch.text`: switch to text tool and commit
- `pi.expand_collapse`: expand/collapse PI sections

### 5.4 Document scale
- `slide_switch.typical_deck`: switch slides within a 20-slide deck
- `slide_switch.heavy_deck`: switch slides within a heavy deck

### 5.5 Startup
- `startup.warm`: warm cache startup
- `startup.cold`: cold cache startup

### 5.6 Memory/soak
- `soak.60min`: scripted 30–60 minute session with repeated operations

---

## 6) Data, Storage, and Artifacts

### 6.1 Required JSON payload
All benchmark runs export a JSON payload with:
- `env` fingerprint
- `run` metadata (scenario id, warmup/iterations)
- raw samples (bounded)
- aggregates (p50/p95/p99)
- diagnostics (long tasks, worst iteration, artifact refs)

See example shape: `10-comprehensive-performance-audit-plan.md` (Appendix B).

### 6.2 Artifact hygiene
Rules:
- No raw document content, user identifiers, or local file paths
- Keep JSON payloads small; store heavy artifacts separately
- Retain heavy artifacts only on failure with bounded retention

See: `10-comprehensive-performance-audit-plan.md` (§4.6).

### 6.3 Storage policy
Baselines and run records follow the baseline storage policy from the audit plan.

See: `10-comprehensive-performance-audit-plan.md` (§8.2.3).

---

## 7) Gates and Stability Rules

### 7.1 PR lane gates (regression-only)
Default policy:
- Compute p95 for the PR run
- Compare to baseline p95
- Fail if regression exceeds both:
  - absolute delta > 15ms and
  - relative delta > 10%

See: `10-comprehensive-performance-audit-plan.md` (§8.2.1).

### 7.2 Nightly lane gates (absolute, after stabilization)
Only enforce absolute gates after the metric is stable.

Stability criteria:
- At least 10 nightly runs without unexplained p95 drift > 10%

See: `10-comprehensive-performance-audit-plan.md` (§3.2.3).

---

## 8) Runbook (How to Use This Report)

### 8.1 When adding a new benchmark
1) Add a new row to §4 registry (metric id + definition + thresholds)
2) Add/extend the scenario in §5
3) Add deterministic app marks (per audit plan)
4) Implement or update the test to export JSON
5) Start as `Planned` → move to `Measured` → then `Gated`

### 8.2 When a regression happens
1) Confirm the failure is not harness noise (check env fingerprint)
2) Identify the worst iteration (from JSON)
3) Open the trace artifacts for the worst iteration
4) File a fix item tagged with:
   - metric id
   - scenario id
   - baseline p95 and regressed p95
   - suspected contributor (CPU/render/PI/state)

---

## 9) Ownership and Change Control
- This document is the **single source of truth** for the performance contract registry.
- Changes to thresholds or definitions must be reviewed like code changes.

Recommended rule:
- If a gate is loosened, the PR must include:
  - justification
  - a link to investigation/traces
  - the plan to recover headroom

---

<!-- BEGIN AUTO:LAST_RUN -->
## 10) Latest Benchmark Run (Auto-Generated)

- Run timestamp: 2025-12-18_14-39-32
- Environment class: runner.local
- Output file: `documentation/03-automation/perf-runs/2025-12-18_14-39-32.jsonl`

### 10.0 Run Metadata

- Scenario: `suite.all`
- Warmup: 1
- Iterations: 1
- Browser: 143.0.7499.4
- Viewport: 1280x720 @ dpr 1
- User agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.7499.4 Safari/537.36
- Host OS (node): win32 10.0.26436
- CPU (node): snapdragon (tm) 8cx gen 3 @ 3.40 GHz

### 10.1 Results (distribution vs Target/Gate)

| Metric ID | Scenario ID | n | p50 | p95 | p99 | Target | Gate | Status |
|---|---|---:|---:|---:|---:|---:|---:|---|
| `selection.highlight.latency_ms` | `selection.simple_rect` | 1 | 0.3 | 0.3 | 0.3 | 50ms | 80ms | PASS |
| `selection.pi_ready.latency_ms` | `selection.simple_rect` | 1 | 0.8 | 0.8 | 0.8 | 80ms | 120ms | PASS |
| `tool_switch.latency_ms` | `tool_switch.text` | 1 | 50.3 | 50.3 | 50.3 | 50ms | 80ms | BELOW TARGET |
| `drag.start.latency_ms` | `drag.simple_shape` | 1 | 15.7 | 15.7 | 15.7 | 16ms | 32ms | PASS |
| `typing.latency_ms` | `typing.simple_text` | 1 | 9.1 | 9.1 | 9.1 | 16ms | 30ms | PASS |
| `slide_switch.latency_ms` | `slide_switch.typical_deck` | 1 | 35.2 | 35.2 | 35.2 | 100ms | 180ms | PASS |
| `theme_switch.latency_ms` | `theme_switch.typical_deck` | 1 | 6.2 | 6.2 | 6.2 | 120ms | 200ms | PASS |
| `frame.steady.p95_ms` | `idle.typical` | 1 | 16.8 | 16.8 | 16.8 | 16.7ms | 18.2ms | BELOW TARGET |
| `frame.interaction.p95_ms` | `selection.simple_rect` | 0 | — | — | — | 24ms | 33ms | NO DATA |
| `longtask.count` | `selection.simple_rect` | 1 | 0.0 | 0.0 | 0.0 | 0 | 0 | PASS |
| `render.simple_slide.p95_ms` | `render.simple_slide` | 1 | 1.7 | 1.7 | 1.7 | 16ms | 33ms | PASS |
| `render.complex_slide.p95_ms` | `render.complex_slide` | 1 | 10.8 | 10.8 | 10.8 | 50ms | 100ms | PASS |
| `hittest.pointer.p95_ms` | `selection.simple_rect` | 1 | 0.5 | 0.5 | 0.5 | 2ms | 5ms | PASS |
| `startup.tti_ms` | `startup.warm` | 1 | 566.7 | 566.7 | 566.7 | 2000ms | — | PASS |
| `startup.first_frame_ms` | `startup.warm` | 1 | 582.5 | 582.5 | 582.5 | 1000ms | — | PASS |
| `memory.heap_delta_mb` | `soak.60min` | 1 | 0.0 | 0.0 | 0.0 | — | — | PASS |
| `memory.detached_nodes` | `soak.60min` | 1 | -61892.0 | -61892.0 | -61892.0 | — | — | PASS |


## 11) Findings and Improvement Plans (Auto-Generated)

Each item below includes a generated triage hypothesis and an improvement plan template. Replace/augment with trace-backed findings when available.

### 11.4 tool_switch.latency_ms (tool_switch.text)

- Status: BELOW TARGET
- Distribution: n=1, p50=50.3ms, p95=50.3ms, p99=50.3ms
- Comparison rule: lower is better (uses p95 as score)
- Score: 50.3ms (target 50ms, gate 80ms)
- Delta vs target: 0.3ms

- Likely contributors (hypotheses):

- Evidence to collect (next run):
  - Capture Playwright trace and identify the slowest iteration
  - Capture DevTools Performance trace focusing on the interaction window
  - Record long task counts during the interaction (if available)

- Improvement plan (start here):
  - Run workstream A from the audit plan for this scenario
  - Isolate the critical path stage (hit-test vs render vs PI) with additional in-page marks
  - Implement the smallest change that reduces p95, then re-measure (warmup + N iterations)

### 11.24 frame.steady.p95_ms (idle.typical)

- Status: BELOW TARGET
- Distribution: n=1, p50=16.8ms, p95=16.8ms, p99=16.8ms
- Comparison rule: lower is better (uses p95 as score)
- Score: 16.8ms (target 16.7ms, gate 18.2ms)
- Delta vs target: 0.1ms

- Likely contributors (hypotheses):
  - Main-thread long task(s) during interaction window
  - Too much layout/style recalculation
  - Excess paints/compositing work

- Evidence to collect (next run):
  - Capture Playwright trace and identify the slowest iteration
  - Capture DevTools Performance trace focusing on the interaction window
  - Record long task counts during the interaction (if available)

- Improvement plan (start here):
  - Run workstream B from the audit plan for this scenario
  - Isolate the critical path stage (hit-test vs render vs PI) with additional in-page marks
  - Implement the smallest change that reduces p95, then re-measure (warmup + N iterations)
<!-- END AUTO:LAST_RUN -->

---

## Appendix B — Benchmark Registry (Machine-Readable)
The JSON block below is the machine-readable source that the benchmark runner uses.

Rule:
- Edit this registry via PR when adding metrics/changing targets.

<!-- BENCH_REGISTRY_JSON_START -->
{
  "envClass": "runner.local",
  "metrics": [
    {
      "metricId": "selection.highlight.latency_ms",
      "scenarioId": "selection.simple_rect",
      "category": "interaction.selection",
      "unit": "ms",
      "direction": "lte",
      "target": 50,
      "gate": 80
    },
    {
      "metricId": "selection.pi_ready.latency_ms",
      "scenarioId": "selection.simple_rect",
      "category": "interaction.selection",
      "unit": "ms",
      "direction": "lte",
      "target": 80,
      "gate": 120
    },
    {
      "metricId": "tool_switch.latency_ms",
      "scenarioId": "tool_switch.text",
      "category": "interaction.tool_switch",
      "unit": "ms",
      "direction": "lte",
      "target": 50,
      "gate": 80
    },
    {
      "metricId": "drag.start.latency_ms",
      "scenarioId": "drag.simple_shape",
      "category": "interaction.drag",
      "unit": "ms",
      "direction": "lte",
      "target": 16,
      "gate": 32
    },
    {
      "metricId": "typing.latency_ms",
      "scenarioId": "typing.simple_text",
      "category": "interaction.typing",
      "unit": "ms",
      "direction": "lte",
      "target": 16,
      "gate": 30
    },
    {
      "metricId": "slide_switch.latency_ms",
      "scenarioId": "slide_switch.typical_deck",
      "category": "interaction.slide_switch",
      "unit": "ms",
      "direction": "lte",
      "target": 100,
      "gate": 180
    },
    {
      "metricId": "theme_switch.latency_ms",
      "scenarioId": "theme_switch.typical_deck",
      "category": "interaction.theme_switch",
      "unit": "ms",
      "direction": "lte",
      "target": 120,
      "gate": 200
    },
    {
      "metricId": "frame.steady.p95_ms",
      "scenarioId": "idle.typical",
      "category": "smoothness.frames",
      "unit": "ms",
      "direction": "lte",
      "target": 16.7,
      "gate": 18.2
    },
    {
      "metricId": "frame.interaction.p95_ms",
      "scenarioId": "selection.simple_rect",
      "category": "smoothness.frames",
      "unit": "ms",
      "direction": "lte",
      "target": 24,
      "gate": 33
    },
    {
      "metricId": "longtask.count",
      "scenarioId": "selection.simple_rect",
      "category": "smoothness.longtasks",
      "unit": "count",
      "direction": "lte",
      "target": 0,
      "gate": 0
    },
    {
      "metricId": "render.simple_slide.p95_ms",
      "scenarioId": "render.simple_slide",
      "category": "render.pipeline",
      "unit": "ms",
      "direction": "lte",
      "target": 16,
      "gate": 33
    },
    {
      "metricId": "render.complex_slide.p95_ms",
      "scenarioId": "render.complex_slide",
      "category": "render.pipeline",
      "unit": "ms",
      "direction": "lte",
      "target": 50,
      "gate": 100
    },
    {
      "metricId": "hittest.pointer.p95_ms",
      "scenarioId": "selection.simple_rect",
      "category": "render.hittest",
      "unit": "ms",
      "direction": "lte",
      "target": 2,
      "gate": 5
    },
    {
      "metricId": "startup.tti_ms",
      "scenarioId": "startup.warm",
      "category": "startup",
      "unit": "ms",
      "direction": "lte",
      "target": 2000,
      "gate": null
    },
    {
      "metricId": "startup.first_frame_ms",
      "scenarioId": "startup.warm",
      "category": "startup",
      "unit": "ms",
      "direction": "lte",
      "target": 1000,
      "gate": null
    },
    {
      "metricId": "memory.heap_delta_mb",
      "scenarioId": "soak.60min",
      "category": "memory",
      "unit": "mb",
      "direction": "lte",
      "target": null,
      "gate": null
    },
    {
      "metricId": "memory.detached_nodes",
      "scenarioId": "soak.60min",
      "category": "memory",
      "unit": "count",
      "direction": "lte",
      "target": null,
      "gate": null
    }
  ]
}
<!-- BENCH_REGISTRY_JSON_END -->

---

## Appendix A — Current Known Gap
As of now, at least one E2E perf check (`PERF05`) measures selection latency using `Date.now()` and selector visibility. The audit plan includes a concrete conversion recipe to in-page measurement and deterministic marks.

See: `10-comprehensive-performance-audit-plan.md` (Appendix C).
