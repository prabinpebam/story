# Best Practices & Standards: Playwright Automation

## 1. Selector Strategy
The stability of automation depends heavily on how we select elements.
*   **Priority 1: User-facing attributes.**
    *   `page.getByRole('button', { name: 'Save' })`
    *   `page.getByText('Welcome')`
    *   `page.getByLabel('Username')`
*   **Priority 2: Explicit Test IDs (Recommended).**
    *   Use `data-testid` attributes in the source code.
    *   Playwright: `page.getByTestId('submit-button')`
    *   *Action:* We need to add `data-testid` props to our React/Vue components.
*   **Avoid:**
    *   XPath (brittle).
    *   Generic CSS classes (`.btn-primary`).
    *   Structure-based selectors (`div > div > span:nth-child(3)`).

## 2. Test Isolation & State
*   **Independent Tests:** Every test must run independently. Do not rely on the state left by a previous test.
*   **Database/State Reset:** Ideally, reset the application state before each test (or suite). Since this is a frontend-heavy app, we might rely on reloading the page or clearing LocalStorage/IndexedDB.
*   **Authentication:**
    *   Do not log in via UI for every test.
    *   Use **Global Setup** to save the "Storage State" (cookies/local storage) into a JSON file.
    *   Inject this state into tests so they start as "Logged In".

## 3. Waiting & Flakiness
*   **No Hard Waits:** NEVER use `page.waitForTimeout(5000)`.
*   **Auto-waiting:** Playwright automatically waits for elements to be actionable. Trust it.
*   **Assertions:** Use "Web-First Assertions" which retry automatically.
    *   ✅ `await expect(locator).toBeVisible();`
    *   ❌ `expect(await locator.isVisible()).toBe(true);` (This doesn't retry).

## 4. Naming Conventions
*   **Files:** `kebab-case.spec.ts` (e.g., `create-slide.spec.ts`).
*   **Test Titles:** Should be descriptive sentences.
    *   ✅ `test('User should see error message when login fails', ...)`
    *   ❌ `test('Login fail', ...)`
*   **Variables:** `camelCase`.

## 5. Accessibility Testing (A11y)
Since "Story" is a visual tool, accessibility is critical.
*   **Tool:** `axe-core` via `@axe-core/playwright`.
*   **Strategy:** Run accessibility checks on key pages/states.
    ```typescript
    import { injectAxe, checkA11y } from 'axe-playwright';
    
    test('Editor should be accessible', async ({ page }) => {
        await page.goto('/editor');
        await injectAxe(page);
        await checkA11y(page);
    });
    ```

## 6. Visual Testing Guidelines
*   **Stability:** Visual tests are sensitive. Ensure animations are disabled or finished before snapshotting.
*   **Thresholds:** Allow a small threshold for anti-aliasing differences (e.g., `maxDiffPixelRatio: 0.01`).
*   **Platform:** Snapshots generated on Windows might differ from Linux (CI).
    *   **Requirement:** Visual tests MUST run in a Docker container or strictly on the CI environment to ensure consistency. Do not commit snapshots generated on a local Mac/Windows machine if CI runs Linux.

## 7. Code Review Checklist
Before merging automation code:
- [ ] Are Page Objects used? (No raw selectors in specs)
- [ ] Are `data-testid` attributes used where possible?
- [ ] Are there any hard-coded waits? (Must be removed)
- [ ] Does the test run successfully 5 times in a row locally?
- [ ] Is the test independent?
