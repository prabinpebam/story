# Implementation Roadmap: Frontend Automation

This roadmap breaks down the implementation into manageable phases.

## Phase 1: Foundation & Setup (Week 1)
**Goal:** Get Playwright installed and running a simple "Smoke Test".

1.  **Install Playwright:**
    ```bash
    npm init playwright@latest
    ```
2.  **Configure Project:**
    *   Set up `playwright.config.ts` according to the Architecture Spec.
    *   Create directory structure (`tests/e2e/pages`, `tests/e2e/specs`).
3.  **Create Base Page Object:**
    *   Implement `tests/e2e/pages/base.page.ts`.
4.  **Write Smoke Test:**
    *   Create `tests/e2e/specs/smoke.spec.ts`.
    *   Scenario: App loads, title is correct, main editor canvas is visible.
5.  **Add NPM Scripts:**
    *   Add `"test:e2e": "playwright test"` to `package.json`.

## Phase 2: Critical Path Automation (Week 2-3)
**Goal:** Automate the most important user flows.

1.  **Identify Critical Flows:** (See `04-test-scenarios.md` - *To be created*).
    *   Example: Create Slide, Add Text, Change Background Color.
2.  **Implement Page Objects:**
    *   `EditorPage`, `ToolbarPage`, `SidebarPage`.
3.  **Add `data-testid`:**
    *   Go through the source code (`src/ui/...`) and add `data-testid` to key interactive elements.
4.  **Write Functional Tests:**
    *   Implement tests for the identified flows.

## Phase 3: Visual Regression (Week 4)
**Goal:** Catch styling regressions.

1.  **Baseline Creation:**
    *   Create a suite `tests/e2e/specs/visual/theme.spec.ts`.
    *   Capture snapshots of the editor with different themes applied.
2.  **CI Integration:**
    *   Ensure visual tests run in a consistent environment (CI container).

## Phase 4: CI/CD Integration (Week 5)
**Goal:** Run tests automatically on every Pull Request.

1.  **GitHub Actions Workflow:**
    *   Create `.github/workflows/playwright.yml`.
    *   Configure it to install dependencies, run tests, and upload the HTML report as an artifact.
2.  **Branch Protection:**
    *   Require E2E tests to pass before merging to `main`.

## Phase 5: Maintenance & Scaling (Ongoing)
*   Regularly review flaky tests.
*   Expand coverage to edge cases.
*   Refactor Page Objects as the UI evolves.
