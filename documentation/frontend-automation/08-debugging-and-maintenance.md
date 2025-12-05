# Debugging and Maintenance Guide

## 1. Overview
Even with well-written tests, flakiness and failures happen. This guide provides strategies for debugging issues and maintaining a healthy test suite.

---

## 2. Playwright's Built-in Debugging Tools

### 2.1 Playwright Inspector (Interactive Debugger)
The most powerful debugging tool—pause test execution and step through actions.

**Usage:**
```typescript
test('Debug canvas interaction', async ({ page }) => {
    await page.goto('/editor');
    await page.pause(); // Opens Playwright Inspector
    
    // Execution pauses here, allowing you to:
    // - Step through code
    // - Inspect elements
    // - Try selectors in the console
    // - Take screenshots
});
```

**Run with:**
```bash
npm run test:e2e -- --debug
```

### 2.2 Trace Viewer
Captures a full recording of test execution (screenshots, network, console, actions).

**Enable in config:**
```typescript
// playwright.config.ts
export default {
    use: {
        trace: 'on-first-retry', // Or 'on', 'off', 'retain-on-failure'
    },
};
```

**View traces:**
```bash
npx playwright show-trace playwright-report/trace.zip
```

**What you see:**
- Timeline of all actions
- Screenshots at each step
- Network requests
- Console logs
- DOM snapshots

### 2.3 Headed Mode (Watch the Browser)
Run tests with a visible browser window.

```bash
npm run test:e2e -- --headed
```

**Or slow down execution:**
```bash
npm run test:e2e -- --headed --slow-mo=1000  # 1 second delay between actions
```

---

## 3. Common Flakiness Patterns & Fixes

### 3.1 Race Conditions
**Symptom:** Test sometimes passes, sometimes fails.

**Example (BAD):**
```typescript
await page.click('[data-testid="add-slide-btn"]');
const slideCount = await page.locator('.slide-item').count();
expect(slideCount).toBe(2); // FLAKY: Might not be rendered yet
```

**Fix: Use web-first assertions**
```typescript
await page.click('[data-testid="add-slide-btn"]');
await expect(page.locator('.slide-item')).toHaveCount(2); // Retries automatically
```

### 3.2 Animation/Transition Interference
**Symptom:** Test fails because element is still animating.

**Example (BAD):**
```typescript
await page.click('[data-testid="open-panel"]');
await page.click('[data-testid="close-panel"]'); // Might click too soon
```

**Fix: Wait for animation to complete**
```typescript
await page.click('[data-testid="open-panel"]');
await page.waitForSelector('[data-testid="close-panel"]', { state: 'visible' });
await page.waitForFunction(() => {
    // Check if CSS transition is done
    const panel = document.querySelector('[data-testid="panel"]');
    return window.getComputedStyle(panel).transitionProperty === 'none';
});
await page.click('[data-testid="close-panel"]');
```

### 3.3 Store State Inconsistency
**Symptom:** Test assumes state but store is in a different state.

**Fix: Always verify state before assertions**
```typescript
test('Theme changes are saved', async ({ page, getState }) => {
    await page.click('[data-theme-id="tropical"]');
    
    // Don't assume state changed immediately
    const state = await getState();
    expect(state.slides['slide-1'].styleAssignments.colorTheme).toBe('preset_tropical_paradise');
});
```

### 3.4 Network Requests Not Completed
**Symptom:** Test fails because API data hasn't loaded.

**Fix: Wait for network idle or specific request**
```typescript
// Wait for specific API call
await page.waitForResponse(response => 
    response.url().includes('/api/themes') && response.status() === 200
);

// Or wait for network idle
await page.waitForLoadState('networkidle');
```

---

## 4. Debugging Failed Tests

### 4.1 Screenshot on Failure
Automatically capture screenshots when tests fail.

**Config:**
```typescript
// playwright.config.ts
export default {
    use: {
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
};
```

### 4.2 Console Log Capture
Listen to console messages during tests.

```typescript
test('Debug console errors', async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    page.on('pageerror', error => console.error(`PAGE ERROR: ${error.message}`));
    
    await page.goto('/editor');
    // Any console.log or errors will be printed to terminal
});
```

### 4.3 Store State Dump
Print the Redux store state at any point.

```typescript
test('Debug store state', async ({ page, getState }) => {
    await page.goto('/editor');
    await page.click('[data-testid="add-slide-btn"]');
    
    const state = await getState();
    console.log('Current state:', JSON.stringify(state, null, 2));
    
    // Or save to file
    fs.writeFileSync('debug-state.json', JSON.stringify(state, null, 2));
});
```

### 4.4 Element Visibility Debugging
Check why an element isn't found.

```typescript
test('Debug missing element', async ({ page }) => {
    await page.goto('/editor');
    
    // Check if element exists in DOM
    const exists = await page.locator('[data-testid="mystery-button"]').count();
    console.log('Element count:', exists);
    
    // Check element properties
    if (exists > 0) {
        const box = await page.locator('[data-testid="mystery-button"]').boundingBox();
        console.log('Bounding box:', box);
        
        const isVisible = await page.locator('[data-testid="mystery-button"]').isVisible();
        console.log('Is visible:', isVisible);
    }
    
    // Take a screenshot to see actual UI
    await page.screenshot({ path: 'debug.png', fullPage: true });
});
```

---

## 5. Flakiness Detection

### 5.1 Retry Flaky Tests Locally
```bash
# Run a test 10 times to detect flakiness
npm run test:e2e -- --repeat-each=10 tests/e2e/specs/editor/slide-creation.spec.ts
```

### 5.2 Flakiness Tracking in CI
Create a GitHub Action to track flaky tests over time.

**Script:**
```typescript
// tests/e2e/utils/flakiness-tracker.ts
import fs from 'fs';

export function trackFlakiness(testName: string, passed: boolean) {
    const logFile = 'flakiness-log.json';
    let log = {};
    
    if (fs.existsSync(logFile)) {
        log = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
    }
    
    if (!log[testName]) {
        log[testName] = { passes: 0, failures: 0 };
    }
    
    if (passed) {
        log[testName].passes++;
    } else {
        log[testName].failures++;
    }
    
    fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
}
```

---

## 6. Test Maintenance Strategies

### 6.1 Regular Cleanup
- **Weekly:** Review and remove obsolete tests.
- **Monthly:** Refactor Page Objects to reduce duplication.
- **Quarterly:** Update selectors if UI has changed significantly.

### 6.2 Avoiding Brittle Selectors
**BAD (Brittle):**
```typescript
page.locator('div > div > span:nth-child(3)'); // Breaks on minor HTML changes
page.locator('.btn-primary'); // Generic class, used everywhere
```

**GOOD (Resilient):**
```typescript
page.getByTestId('save-button');
page.getByRole('button', { name: 'Save' });
page.getByText('Save Presentation');
```

### 6.3 Handling API Changes
When backend APIs change, use **API mocking** to keep tests stable.

```typescript
test('Handle API schema change', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/themes', route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                themes: [
                    { id: 'theme-1', name: 'Tropical', colors: [...] },
                ],
            }),
        });
    });
    
    await page.goto('/editor');
    // Test continues with mocked data
});
```

### 6.4 Dependency Updates
- **Playwright:** Update monthly to get latest features and bug fixes.
- **Browser Binaries:** `npx playwright install` after Playwright updates.

```bash
npm update @playwright/test
npx playwright install chromium
```

---

## 7. Performance Debugging

### 7.1 Slow Test Identification
```bash
# Generate HTML report with timing
npm run test:e2e -- --reporter=html

# Open report
npx playwright show-report
```

The report shows:
- Test duration
- Slowest tests
- Screenshots/videos

### 7.2 Optimize Slow Tests
**Common causes:**
- Too many `waitForTimeout()` calls → Replace with `waitForSelector()`.
- Loading full page unnecessarily → Use `page.goto(..., { waitUntil: 'domcontentloaded' })`.
- Not using parallelism → Enable `fullyParallel: true` in config.

---

## 8. Common Pitfalls & Solutions

### ❌ Pitfall: Hard-coded waits
```typescript
await page.waitForTimeout(5000); // BAD
```
**Solution:** Use condition-based waits
```typescript
await page.waitForSelector('[data-testid="loaded"]');
```

### ❌ Pitfall: Overusing `page.evaluate()`
```typescript
const isVisible = await page.evaluate(() => {
    return document.querySelector('#element').offsetHeight > 0;
}); // BAD: Doesn't auto-retry
```
**Solution:** Use Playwright's built-in methods
```typescript
await expect(page.locator('#element')).toBeVisible(); // Auto-retries
```

### ❌ Pitfall: Not cleaning up state
```typescript
test('Test 1', async ({ page }) => {
    await page.goto('/editor');
    localStorage.setItem('theme', 'dark'); // Pollutes next test
});
```
**Solution:** Use `test.afterEach` or isolated context
```typescript
test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
});
```

---

## 9. Debugging Checklist

When a test fails, go through this checklist:

- [ ] **Run locally:** Does it fail on your machine?
- [ ] **Check screenshot/video:** What does the UI look like at failure point?
- [ ] **Check console logs:** Any JavaScript errors?
- [ ] **Check network:** Did API requests succeed?
- [ ] **Check store state:** Is the Redux store in the expected state?
- [ ] **Run with `--headed`:** Watch the browser execute the test.
- [ ] **Run with `--debug`:** Step through actions in Playwright Inspector.
- [ ] **Check trace:** Use Trace Viewer to see full timeline.
- [ ] **Run 10 times:** Is it consistently failing or flaky?

---

## 10. Getting Help

### Internal Resources
1. Check this documentation.
2. Review recent commits for related changes.
3. Ask team members if similar tests are also failing.

### External Resources
1. [Playwright Documentation](https://playwright.dev)
2. [Playwright Discord](https://aka.ms/playwright/discord)
3. [Stack Overflow](https://stackoverflow.com/questions/tagged/playwright)

### Reporting Bugs
If you suspect a Playwright bug:
1. Create a minimal reproduction.
2. File an issue on [GitHub](https://github.com/microsoft/playwright/issues).

---

## Next Steps
1. Bookmark this guide for quick reference.
2. Set up trace viewer in your config.
3. Create a "Debugging Tips" section in your team wiki.
