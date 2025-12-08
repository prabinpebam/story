# 01. Strategy & Goals

## 1. Testing Philosophy

The frontend automation strategy for Story focuses on **End-to-End (E2E) User Journeys**. Unlike unit tests which verify code logic, these tests verify that the application behaves correctly from a user's perspective.

### Core Principles
1.  **User-Centric:** Tests interact with the UI exactly as a user would (clicks, keystrokes), avoiding internal state manipulation where possible during the verification phase.
2.  **Resilient:** Selectors use `data-testid` or user-visible text/roles to withstand refactors.
3.  **Deterministic:** Flakiness is unacceptable. Tests must handle asynchronous UI updates and animations gracefully using Playwright's auto-waiting.
4.  **Fast Feedback:** The suite should run quickly enough to be part of the PR check process.

## 2. Technology Stack

- **Framework:** Playwright (v1.40+)
- **Language:** TypeScript
- **Browser Engine:** Chromium (primary), WebKit, Firefox
- **Assertion Library:** Playwright built-in assertions (`expect`)

## 3. Test Pyramid Strategy

This E2E suite sits at the top of the testing pyramid:

- **E2E (Playwright):** ~10-20% of tests. Focus on critical user flows, integration of systems, and "happy paths".
- **Integration (Vitest):** ~30-40% of tests. Focus on component interactions and store logic.
- **Unit (Vitest):** ~50% of tests. Focus on individual functions, utilities, and isolated components.

## 4. Success Metrics

| Metric | Goal | Current Status |
|--------|------|----------------|
| **Stability** | 0% Flakiness (Pass rate on retry) | ✅ 0% (Validated) |
| **Execution Time** | < 5 minutes for full suite | ✅ ~15s (Current) |
| **Critical Path Coverage** | 100% of P0 flows | ✅ 100% |
| **Feature Coverage** | > 80% of all UI interactions | 🔶 ~30% |

## 5. Test Categories

1.  **Smoke Tests:** Critical "is it alive" checks. Must pass for any build.
2.  **Functional Tests:** Detailed verification of specific features (e.g., "Draw Rectangle", "Change Font").
3.  **Workflow Tests:** Complex multi-step scenarios (e.g., "Create slide, add content, export").
4.  **Visual Regression:** (Future) Pixel-perfect comparison for rendering engine.
