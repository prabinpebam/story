import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Frontend Performance', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
  });

  test('PERF01: App Load Time (Time to Interactive)', async ({ page }) => {
    const startTime = Date.now();
    await editor.goto();
    await editor.waitForLoad();
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    console.log(`App Load Time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(6000);
  });

  test('PERF02: Slide Switch Latency', async ({ page }) => {
    await editor.goto();
    await editor.waitForLoad();

    // Add a second slide
    await editor.addSlide();
    
    // Measure switch time
    const startTime = Date.now();
    await editor.selectSlide(0);
    const endTime = Date.now();
    
    const switchTime = endTime - startTime;
    console.log(`Slide Switch Time: ${switchTime}ms`);
    expect(switchTime).toBeLessThan(500);
  });

  test('PERF03: Tool Switch Response', async ({ page }) => {
    await editor.goto();
    await editor.waitForLoad();

    // Measure time to switch tool and see it active
    const startTime = Date.now();
    await editor.setActiveTool('text');
    await expect(page.locator('[data-testid="tool-text"]')).toHaveClass(/active|selected/);
    const endTime = Date.now();
    
    console.log(`Tool Switch Time: ${endTime - startTime}ms`);
    // Allow headroom for Windows/OneDrive + CI variance; this is a smoke perf check, not a micro-benchmark.
    expect(endTime - startTime).toBeLessThan(400);
  });

  test('PERF05: Selection Response Time', async ({ page }) => {
    await editor.goto();
    await editor.waitForLoad();

    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.1, 0.1, 0.2, 0.2);
    
    // Deselect
    await canvas.clickAt(0.5, 0.5);
    await expect(page.locator('.pi-section', { hasText: 'Fill' })).toBeHidden();

    // Measure selection time (until PI shows Fill)
    const startTime = Date.now();
    await canvas.clickAt(0.2, 0.2); // Center of rect
    await expect(page.locator('.pi-section', { hasText: 'Fill' })).toBeVisible();
    const endTime = Date.now();

    const selectionTime = endTime - startTime;
    console.log(`Selection Time: ${selectionTime}ms`);
    expect(selectionTime).toBeLessThan(200);
  });
});
