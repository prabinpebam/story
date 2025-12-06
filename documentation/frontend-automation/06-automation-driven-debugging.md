# 06. Automation-Driven Debugging Strategy

This document outlines our strategy for using the Playwright automation suite as a primary tool for **identifying, isolating, and verifying fixes** for bugs in the application.

Since we acknowledge that many features in the [Test Scenarios](./04-test-scenarios.md) may not be working perfectly, we shift from a "Verification" mindset to a **"Discovery & Fix"** mindset.

## 1. The "Test-Fail-Fix-Verify" Loop

We will apply a strict TDD-style workflow to feature validation:

1.  **Select Target:** Pick a specific scenario (e.g., `T03: Type text content`) from the catalog.
2.  **Implement Test:** Write the Playwright test case assuming the feature *should* work.
3.  **Execute (The Discovery):** Run the test.
    *   **Pass:** Mark as ✅ in the catalog.
    *   **Fail:** This confirms a bug or implementation gap. **Do not skip or delete the test.**
4.  **Analyze (The Debugging):** Use Playwright's tools to diagnose the root cause (see Section 2).
5.  **Fix (The Implementation):** Modify the application source code (`src/`) to resolve the issue.
6.  **Verify:** Re-run the test until it passes.
7.  **Regression Check:** Run related tests to ensure the fix didn't break existing functionality.

## 2. Debugging Toolkit

We will leverage specific Playwright features to inspect the application state during failures:

### A. UI Mode (Time Travel)
Use `npx playwright test --ui` to:
*   Step through the test execution action-by-action.
*   Inspect the DOM snapshot at the exact moment of failure.
*   View the browser console logs and network requests for each step.

### B. Trace Viewer
For CI or headless runs, we analyze the `trace.zip`:
*   **Screenshots:** Visual confirmation of the UI state.
*   **Action Timing:** Identify slow operations or race conditions.
*   **Console Output:** Catch JavaScript errors thrown by the application.

### C. Browser Context Logging
We can inject listeners to catch internal app errors:
```typescript
// In base-test.ts or specific test
page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));
```

## 3. Categorizing & Handling Failures

When a test fails, we categorize the issue to determine the fix strategy:

| Failure Type | Symptoms | Strategy |
|--------------|----------|----------|
| **Selector / A11y** | Test can't find element; Element not clickable. | **Fix App:** Add `data-testid` or fix z-index/layout in `src/ui`. |
| **State Logic** | UI action happens, but result (e.g., Redux state) is wrong. | **Fix Core:** Debug Redux reducers or handlers in `src/core`. |
| **Rendering** | State is correct, but Canvas looks wrong. | **Fix Renderer:** Debug `CanvasRenderer` or `Fabric.js` logic. |
| **Race Condition** | Test fails intermittently. | **Fix App/Test:** Add proper `await` logic in app or `waitFor` in test. |
| **Not Implemented** | Feature completely missing. | **Implement:** Treat as new feature development. |

## 4. Execution Plan for "Broken" Features

For complex areas like **Fills** and **Typography** which are known to have issues:

1.  **Batch Implementation:** Write tests for a whole group (e.g., "Solid Fills").
2.  **Triage:** Run the batch. Identify which specific parts fail (e.g., "Opacity works, but Hex Input fails").
3.  **Focused Fix:** Fix the specific broken component (e.g., `ColorPicker.js`).
4.  **Validation:** Verify the whole batch passes.

## 5. Status Tracking

We will update `04-test-scenarios.md` with specific status codes:

*   ✅ **Pass:** Working as expected.
*   🔴 **Fail (Bug):** Implemented but broken. (Requires Fix).
*   ⚠️ **Flaky:** Works sometimes. (Requires Stability Fix).
*   ⬜ **Not Implemented:** Feature missing entirely.
