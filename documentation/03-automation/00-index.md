# Frontend Automation (Playwright)

This folder documents how we build, run, and maintain reliable frontend automation for this repo.

Design goal: keep this documentation “timeless”. Prefer stable workflows and principles over date-stamped status reports.

## Start Here

- If you're (re)wiring E2E infra/CI: `09-implementation-prerequisites.md`
- If you're deciding what to test next: `04-test-scenarios.md`
- If you're fighting flakes: `02-best-practices.md` and `06-automation-driven-debugging.md`

## Canonical Docs

| Document | Purpose |
|----------|---------|
| `01-architecture-spec.md` | How Playwright is structured in this repo (config, folders, patterns). |
| `02-best-practices.md` | Conventions that keep tests stable and fast. |
| `03-implementation-roadmap.md` | Phased plan for expanding coverage without chaos. |
| `04-test-scenarios.md` | What to automate (organized scenarios). |
| `05-canvas-testing-guide.md` | Canvas-specific guidance (rendering, input, pixel/DOM asserts). |
| `06-state-seeding-guide.md` | How tests seed deterministic state.
| `06-automation-driven-debugging.md` | The strict loop for debugging failing E2E tests.
| `07-performance-testing-guide.md` | Performance methodology and how to run perf checks.
| `08-debugging-and-maintenance.md` | Ongoing maintenance practices (flake triage, trace usage).
| `09-implementation-prerequisites.md` | Checklist before scaling the suite/CI.
| `10-comprehensive-performance-audit-plan.md` | Deep performance audit plan and CI gating approach.

## Running Tests

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
npm run test:e2e:debug
```

## Archive

Historical and superseded docs live in `archive/` and are not maintained. They exist only for reference.
