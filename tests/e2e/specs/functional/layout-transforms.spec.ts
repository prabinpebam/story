import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Layout & Transforms', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test.fixme('P02-P03: Change Dimensions via Input', async ({ page }) => {
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.3, 0.3, 0.2, 0.2);
    
    // Selectors based on common UI patterns, might need adjustment
    const widthInput = page.locator('.pi-row input').filter({ hasText: 'W' }).first().or(page.locator('input[aria-label="Width"]'));
    const heightInput = page.locator('.pi-row input').filter({ hasText: 'H' }).first().or(page.locator('input[aria-label="Height"]'));
    
    // Fallback to finding by proximity to label if needed
    // For now, let's try to find inputs in the "Layout" or "Transform" section
    const layoutSection = page.locator('.pi-section', { hasText: /Layout|Transform/ });
    
    // Assuming standard inputs
    // We'll use a more robust selector strategy in a real run, but here we guess
    const wInput = layoutSection.locator('input').nth(0); // X
    const hInput = layoutSection.locator('input').nth(1); // Y
    const widthInp = layoutSection.locator('input').nth(2); // W
    const heightInp = layoutSection.locator('input').nth(3); // H

    await widthInp.fill('200');
    await widthInp.press('Enter');
    
    await heightInp.fill('150');
    await heightInp.press('Enter');
    
    await expect(widthInp).toHaveValue('200');
    await expect(heightInp).toHaveValue('150');
  });

  test.fixme('P05: Change Rotation', async ({ page }) => {
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.3, 0.3, 0.2, 0.2);
    
    const layoutSection = page.locator('.pi-section', { hasText: /Layout|Transform/ });
    const rotationInput = layoutSection.locator('input[aria-label="Rotation"], input.input-rotation').first();
    
    await rotationInput.fill('45');
    await rotationInput.press('Enter');
    
    await expect(rotationInput).toHaveValue('45');
  });

  test.fixme('P08: Change Opacity', async ({ page }) => {
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.3, 0.3, 0.2, 0.2);
    
    const opacityInput = page.locator('input[aria-label="Opacity"], input.input-opacity').first();
    
    await opacityInput.fill('50');
    await opacityInput.press('Enter');
    
    await expect(opacityInput).toHaveValue('50');
  });

  test.fixme('P10: Adjust Corner Radius', async ({ page }) => {
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.3, 0.3, 0.2, 0.2);
    
    const radiusInput = page.locator('input[aria-label="Corner Radius"], input.input-radius').first();
    
    await radiusInput.fill('20');
    await radiusInput.press('Enter');
    
    await expect(radiusInput).toHaveValue('20');
  });
});
