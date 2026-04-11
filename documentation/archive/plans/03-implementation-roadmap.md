# Implementation Roadmap: Frontend Automation

This roadmap breaks automation work into manageable phases. Phases are ordered by dependency (foundation first), not by calendar time.

## Phase 1: Foundation & Setup

**Goal:** The suite runs locally and in CI with good diagnostics.

1. **Confirm baseline runs**
   - `npm run test:e2e -- --list` works
   - `npm run test:e2e` produces a report (even if only a few tests exist)
2. **Align structure with the architecture**
   - Keep `playwright.config.ts` and folder structure consistent with `01-architecture-spec.md`
3. **Create/standardize a smoke test**
   - App loads
   - Editor/canvas surface is visible
   - Core UI shell renders without errors

## Phase 2: Critical Path Automation

**Goal:** Automate the highest-value user flows first.

1. **Choose flows from the scenario catalog**
   - Use `04-test-scenarios.md` and pick the smallest set that protects core functionality
2. **Add stable selectors**
   - Add `data-testid` to key UI elements as needed
3. **Write functional tests**
   - Implement tests for the selected flows, keeping them deterministic and fast

## Phase 3: Visual Regression (Optional)

**Goal:** Catch styling regressions with stable snapshots.

1. **Define the minimum snapshot surface area**
2. **Run visual tests in a consistent environment**
   - Prefer Docker in CI for deterministic fonts/rendering

## Phase 4: CI/CD Integration

**Goal:** Run E2E automatically on every pull request.

1. **Add a GitHub Actions workflow**
   - Install dependencies
   - Install Playwright browsers
   - Run `npm run test:e2e`
   - Upload artifacts (HTML report, traces/videos on failure)
2. **Require the workflow for merge**

## Phase 5: Maintenance & Scaling

- Triage flakes (root-cause; don’t just add timeouts)
- Keep selectors stable and resilient
- Refactor page objects/helpers when patterns repeat
