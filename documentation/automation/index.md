# Frontend Automation (Playwright)

This folder documents how we build, run, and maintain reliable frontend automation for this repo.

Design goal: keep this documentation timeless. Prefer stable workflows and principles over date-stamped status reports.

---

## Folder Structure

```
automation/
├── eval-loop/                            Agnostic Evaluation Loop
│   ├── agnostic-eval-loop-framework.md     The core framework spec (technology-agnostic)
│   ├── eval-loop-framework.md              Story-specific adaptation of the framework
│   ├── dom-state-capture-guide.md          Three-layer snapshot capture (Store + DOM + Canvas)
│   ├── selection-eval-loop-plan.md         Reference implementation plan (SEL-01..SEL-13)
│   ├── eval-loop-taskflows.md              Master taskflow catalog (all 32 categories)
│   └── taskflows/                          Per-category taskflow definitions
│       ├── 00-index.md
│       ├── 01-selection-hit-testing.md
│       ├── ...
│       └── 32-export-system.md
├── testing/                              Traditional Playwright Testing
│   ├── architecture.md                     Repo structure, config, folder patterns
│   ├── best-practices.md                   Conventions for stable, fast tests
│   ├── test-scenarios.md                   What to automate (organized scenarios)
│   ├── canvas-testing.md                   Canvas-specific guidance (pixel/DOM asserts)
│   ├── state-seeding.md                    Deterministic state seeding patterns
│   ├── debugging-with-automation.md        Strict loop for debugging failing E2E tests
│   ├── debugging-and-maintenance.md        Flake triage, trace usage
│   ├── performance-testing.md              Performance methodology
│   ├── performance-benchmarks.md           Metric registry, thresholds, cadence
│   └── benchmark-coverage-catalog.md       Required coverage surface
├── archive/                              Historical / superseded docs
└── index.md                              This file
```

---

## Start Here

**Eval Loop** (primary approach for feature correctness):
- Framework: `eval-loop/agnostic-eval-loop-framework.md`
- Capture guide: `eval-loop/dom-state-capture-guide.md`
- Taskflows: `eval-loop/taskflows/`

**Traditional Testing** (flake debugging, performance, CI):
- If you're deciding what to test next: `testing/test-scenarios.md`
- If you're fighting flakes: `testing/best-practices.md` and `testing/debugging-with-automation.md`

---

## Running Tests

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
npm run test:e2e:debug
```

## Archive

Historical and superseded docs live in `archive/` and are not maintained. They exist only for reference.
# Frontend Automation (Playwright)

This folder documents how we build, run, and maintain reliable frontend automation for this repo.

Design goal: keep this documentation “timeless”. Prefer stable workflows and principles over date-stamped status reports.

## Start Here

- If you're deciding what to test next: `test-scenarios.md`
- If you're fighting flakes: `best-practices.md` and `debugging-with-automation.md`

## Canonical Docs

| Document | Purpose |
|----------|---------|
| `architecture.md` | How Playwright is structured in this repo (config, folders, patterns). |
| `best-practices.md` | Conventions that keep tests stable and fast. |
| `test-scenarios.md` | What to automate (organized scenarios). |
| `canvas-testing.md` | Canvas-specific guidance (rendering, input, pixel/DOM asserts). |
| `state-seeding.md` | How tests seed deterministic state. |
| `debugging-with-automation.md` | The strict loop for debugging failing E2E tests. |
| `performance-testing.md` | Performance methodology and how to run perf checks. |
| `debugging-and-maintenance.md` | Ongoing maintenance practices (flake triage, trace usage). |
| `performance-benchmarks.md` | Single source of truth registry for performance metrics, scenarios, thresholds, and run cadence.

## Running Tests

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
npm run test:e2e:debug
```

## Archive

Historical and superseded docs live in `archive/` and are not maintained. They exist only for reference.
