# Frontend Automation Strategy & Plan

This directory contains the comprehensive strategy, status, and implementation plan for the Frontend E2E Automation suite using Playwright.

## Documentation Structure

| Document | Description |
|----------|-------------|
| **[01-strategy-and-goals.md](./01-strategy-and-goals.md)** | High-level strategy, testing philosophy, and success metrics. |
| **[02-current-status.md](./02-current-status.md)** | Analysis of the current test suite, infrastructure, and coverage. |
| **[03-feature-catalog.md](./03-feature-catalog.md)** | Comprehensive catalog of frontend features derived from specifications. |
| **[04-test-scenarios.md](./04-test-scenarios.md)** | Detailed list of testable user interactions organized by category. |
| **[05-implementation-plan.md](./05-implementation-plan.md)** | Phased roadmap for achieving complete test coverage. |

## Quick Links

- **Framework:** Playwright
- **Location:** `tests/e2e/`
- **Current Coverage:** ~30% (Core Critical Paths)
- **Stability Goal:** 0% Flakiness

## Execution

To run the current suite:
```bash
# Run all E2E tests
npx playwright test

# Run specific category
npx playwright test --grep "@smoke"
```
