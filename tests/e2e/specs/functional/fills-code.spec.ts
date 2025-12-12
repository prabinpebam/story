import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Fills - Code Fill System', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    
    await editor.goto();
    await editor.waitForLoad();
  });

  test('FL26: Open Code Fill Panel', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.1, 0.1, 0.2, 0.2);
    
    // 2. Open Fill Flyout
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    await fillSection.locator('.fill-swatch-trigger').click();
    
    // 3. Switch to Code Tab
    const flyout = page.locator('.fill-flyout');
    await flyout.locator('.fill-type-selector button[title="Code"]').click();
    
    // 4. Click the icon-only "Open Code Fill Panel" button (only shown in Code mode)
    await flyout.locator('button[title^="Open Code Fill Panel"]').click();
    
    // 5. Verify Panel is Open
    const panel = page.locator('.code-fill-panel');
    await expect(panel).toBeVisible();
    
    // Verify Header
    await expect(panel).toContainText('Code Fill');
  });

  test('FL27: Apply Code Fill Preset', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.4, 0.1, 0.2, 0.2);
    
    // 2. Open Code Fill Panel from the Fill flyout
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    await fillSection.locator('.fill-swatch-trigger').click();
    const flyout = page.locator('.fill-flyout');
    await flyout.locator('.fill-type-selector button[title="Code"]').click();
    await flyout.locator('button[title^="Open Code Fill Panel"]').click();
    
    const panel = page.locator('.code-fill-panel');
    await expect(panel).toBeVisible();
    
    // 3. Select a preset (panel starts in Presets tab)
    await panel.locator('.cfp-preset-card').first().click();

    // 4. Verify a code fill is applied to the selected element via store state
    const hasCodeFill = await page.evaluate(() => {
      const win = window as any;
      const store = win.__TEST_STORE__;
      if (!store) return false;
      const state = store.getState();
      const selectedId = state?.editor?.selectedElementIds?.[0];
      const slideId = state?.editor?.activeSlideId;
      const slide = state?.slides?.[slideId];
      const el = slide?.elements?.[selectedId];
      const fills = el?.style?.fills;
      return Array.isArray(fills) && fills.some((f: any) => f?.type === 'code');
    });
    expect(hasCodeFill).toBe(true);
  });
});
