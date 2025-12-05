# Performance Testing Guide

## 1. Why Performance Testing Matters
Story is a canvas-heavy, real-time rendering application. Performance regressions can severely impact user experience:
- **Slow render times** → Janky animations, unresponsive UI
- **Memory leaks** → Browser crashes with large presentations
- **Excessive repaints** → Battery drain, fan noise

Playwright provides tools to measure and track these metrics.

---

## 2. Performance Testing Strategy

### 2.1 Metrics to Track
| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Initial Load Time | < 2s | 2-3s | > 3s |
| Canvas Render (Simple Slide) | < 100ms | 100-200ms | > 200ms |
| Canvas Render (Complex Slide) | < 300ms | 300-500ms | > 500ms |
| Theme Switch | < 150ms | 150-300ms | > 300ms |
| Add Slide | < 50ms | 50-100ms | > 100ms |
| Memory Usage (100 slides) | < 300MB | 300-500MB | > 500MB |
| FPS (Smooth Animation) | 60 FPS | 45-59 FPS | < 45 FPS |

---

## 3. Measuring Render Performance

### 3.1 Using Performance API
Playwright can execute code in the browser context to measure timing.

```typescript
import { test, expect } from '../fixtures/base-test';

test('Canvas render time is under 100ms', async ({ page }) => {
    await page.goto('/editor');
    
    // Measure render time for a simple slide
    const renderTime = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
            const start = performance.now();
            
            // Trigger a render (e.g., by adding an element)
            window.__TEST_STORE__.dispatch('ADD_ELEMENT', {
                id: 'perf-test-text',
                type: 'text',
                x: 400,
                y: 300,
                width: 600,
                height: 100,
                content: '<p>Test</p>',
            });
            
            // Wait for next frame to ensure render is complete
            requestAnimationFrame(() => {
                const end = performance.now();
                resolve(end - start);
            });
        });
    });
    
    console.log(`Render time: ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(100);
});
```

### 3.2 Measuring Theme Switch Performance
```typescript
test('Theme switch is performant', async ({ page, seedState }) => {
    await page.goto('/editor');
    
    // Seed a slide with multiple elements
    const slide = createSlideWithElements(10); // 10 text elements
    await seedState({ slides: { [slide.id]: slide }, slideOrder: [slide.id] });
    
    const switchTime = await page.evaluate(async () => {
        const start = performance.now();
        
        // Trigger theme change
        window.__TEST_STORE__.dispatch('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
            slideId: 'test-slide',
            styleAssignments: {
                colorTheme: 'preset_tropical_paradise'
            }
        });
        
        // Wait for re-render (observe a specific element's color change)
        await new Promise(resolve => {
            const observer = new MutationObserver(() => {
                const element = document.querySelector('[data-element-id="text-0"]');
                if (element && getComputedStyle(element).color !== 'rgb(0, 0, 0)') {
                    observer.disconnect();
                    resolve(null);
                }
            });
            observer.observe(document.body, { subtree: true, attributes: true });
        });
        
        const end = performance.now();
        return end - start;
    });
    
    console.log(`Theme switch time: ${switchTime.toFixed(2)}ms`);
    expect(switchTime).toBeLessThan(150);
});
```

---

## 4. Memory Leak Detection

### 4.1 Using Chrome DevTools Protocol (CDP)
Playwright has direct access to Chrome DevTools Protocol for memory profiling.

```typescript
import { chromium, test, expect } from '@playwright/test';

test('No memory leaks when creating 100 slides', async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Enable CDP
    const client = await context.newCDPSession(page);
    
    await page.goto('/editor');
    
    // Measure initial memory
    await client.send('HeapProfiler.enable');
    await client.send('HeapProfiler.collectGarbage');
    
    const initialMemory = await client.send('Runtime.getHeapUsage');
    console.log(`Initial heap: ${(initialMemory.usedSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Create 100 slides
    for (let i = 0; i < 100; i++) {
        await page.evaluate(() => {
            window.__TEST_STORE__.dispatch('ADD_SLIDE');
        });
    }
    
    // Force garbage collection
    await client.send('HeapProfiler.collectGarbage');
    
    // Measure final memory
    const finalMemory = await client.send('Runtime.getHeapUsage');
    console.log(`Final heap: ${(finalMemory.usedSize / 1024 / 1024).toFixed(2)} MB`);
    
    const memoryIncrease = (finalMemory.usedSize - initialMemory.usedSize) / 1024 / 1024;
    console.log(`Memory increase: ${memoryIncrease.toFixed(2)} MB`);
    
    // Allow reasonable memory growth (100 slides should not exceed 300MB)
    expect(memoryIncrease).toBeLessThan(300);
    
    await browser.close();
});
```

### 4.2 Detecting Memory Leaks in Event Listeners
```typescript
test('Event listeners are properly cleaned up', async ({ page }) => {
    await page.goto('/editor');
    
    const initialListeners = await page.evaluate(() => {
        // Access internal listener count (if exposed in dev mode)
        return window.__TEST_STORE__._eventListenerCount || 0;
    });
    
    // Add and remove a component 10 times
    for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="open-color-theme-manager"]');
        await page.click('[data-testid="close-panel"]');
    }
    
    const finalListeners = await page.evaluate(() => {
        return window.__TEST_STORE__._eventListenerCount || 0;
    });
    
    // Listener count should not grow significantly
    expect(finalListeners - initialListeners).toBeLessThan(5);
});
```

---

## 5. Frame Rate (FPS) Monitoring

### 5.1 Measuring Animation Smoothness
```typescript
test('Dragging an element maintains 60 FPS', async ({ page, canvas }) => {
    await page.goto('/editor');
    await seedState(page, { /* slide with element */ });
    
    const fps = await page.evaluate(async () => {
        let frameCount = 0;
        let lastTime = performance.now();
        
        // Start dragging
        const element = document.querySelector('[data-element-id="text-123"]');
        const box = element.getBoundingClientRect();
        
        // Simulate drag
        const mouseMoveEvent = new MouseEvent('mousemove', {
            clientX: box.x + 50,
            clientY: box.y + 50,
        });
        
        // Count frames for 1 second during drag
        const countFrames = () => {
            return new Promise<number>((resolve) => {
                const startTime = performance.now();
                const checkFrame = () => {
                    frameCount++;
                    if (performance.now() - startTime < 1000) {
                        requestAnimationFrame(checkFrame);
                    } else {
                        resolve(frameCount);
                    }
                };
                requestAnimationFrame(checkFrame);
                
                // Trigger continuous mousemove
                const interval = setInterval(() => {
                    document.dispatchEvent(mouseMoveEvent);
                }, 16); // ~60 FPS
                
                setTimeout(() => clearInterval(interval), 1000);
            });
        };
        
        return await countFrames();
    });
    
    console.log(`FPS: ${fps}`);
    expect(fps).toBeGreaterThanOrEqual(55); // Allow some variance
});
```

---

## 6. Load Testing

### 6.1 Large Presentation Performance
```typescript
test('App remains responsive with 100 slides', async ({ page, seedState }) => {
    await page.goto('/editor');
    
    // Create a large presentation
    const { slides, slideOrder } = createPresentation(100);
    await seedState({ slides, slideOrder });
    
    // Measure navigation responsiveness
    const navigationTime = await page.evaluate(async () => {
        const start = performance.now();
        
        // Navigate to slide 50
        window.__TEST_STORE__.dispatch('SET_ACTIVE_SLIDE', { slideId: 'slide-50' });
        
        // Wait for render
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        return performance.now() - start;
    });
    
    console.log(`Navigation to slide 50: ${navigationTime.toFixed(2)}ms`);
    expect(navigationTime).toBeLessThan(200);
});
```

---

## 7. Continuous Performance Monitoring

### 7.1 Performance Baseline Tracking
Store performance baselines in a JSON file and compare against them in CI.

**`tests/e2e/fixtures/performance-baselines.json`**
```json
{
    "canvasRenderSimple": 100,
    "canvasRenderComplex": 300,
    "themeSwitch": 150,
    "addSlide": 50,
    "memoryUsage100Slides": 300
}
```

**Performance Test Helper:**
```typescript
import baselines from '../fixtures/performance-baselines.json';

export function assertPerformance(metric: string, actualValue: number, tolerance: number = 0.1) {
    const baseline = baselines[metric];
    if (!baseline) {
        console.warn(`No baseline for ${metric}, recording ${actualValue}`);
        return;
    }
    
    const maxAllowed = baseline * (1 + tolerance); // Allow 10% variance
    expect(actualValue).toBeLessThan(maxAllowed, 
        `Performance regression detected! ${metric}: ${actualValue}ms (baseline: ${baseline}ms)`
    );
}
```

**Usage:**
```typescript
test('Canvas render meets baseline', async ({ page }) => {
    const renderTime = await measureRenderTime(page);
    assertPerformance('canvasRenderSimple', renderTime);
});
```

### 7.2 CI Performance Report
Generate a performance report after each test run.

**`tests/e2e/utils/performance-reporter.ts`**
```typescript
import fs from 'fs';

export class PerformanceReporter {
    private metrics: Record<string, number[]> = {};
    
    record(metric: string, value: number) {
        if (!this.metrics[metric]) {
            this.metrics[metric] = [];
        }
        this.metrics[metric].push(value);
    }
    
    generateReport(outputPath: string) {
        const report = Object.entries(this.metrics).map(([metric, values]) => ({
            metric,
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            p95: this.percentile(values, 0.95),
        }));
        
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.table(report);
    }
    
    private percentile(arr: number[], p: number): number {
        const sorted = arr.slice().sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * p) - 1;
        return sorted[index];
    }
}

export const perfReporter = new PerformanceReporter();
```

---

## 8. Best Practices

### ✅ Do: Run performance tests separately
```bash
npm run test:e2e:performance  # Separate from functional tests
```

### ✅ Do: Use consistent hardware
Run performance tests on dedicated CI runners (not shared with other jobs).

### ✅ Do: Warm up the app
```typescript
test.beforeEach(async ({ page }) => {
    await page.goto('/editor');
    // Perform a dummy action to warm up
    await page.click('[data-testid="add-slide-btn"]');
    await page.waitForTimeout(100);
});
```

### ❌ Don't: Run on developer machines
Local performance varies too much (CPU throttling, background apps).

### ❌ Don't: Test everything in one suite
Separate functional tests from performance tests to get fast feedback.

---

## 9. Integration with CI

**`.github/workflows/performance.yml`**
```yaml
name: Performance Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Run performance tests
        run: npm run test:e2e:performance
      - name: Upload performance report
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: playwright-report/performance.json
      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            const report = require('./playwright-report/performance.json');
            const comment = report.map(r => 
              `| ${r.metric} | ${r.avg.toFixed(2)}ms | ${r.p95.toFixed(2)}ms |`
            ).join('\\n');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Performance Report\\n| Metric | Avg | P95 |\\n|--------|-----|-----|\\n${comment}`
            });
```

---

## Next Steps
1. Create `tests/e2e/specs/performance/` directory.
2. Write baseline performance tests for critical operations.
3. Set up CI job for performance monitoring.
4. Establish alerting for regressions (> 20% slowdown).
