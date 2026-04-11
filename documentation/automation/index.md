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
