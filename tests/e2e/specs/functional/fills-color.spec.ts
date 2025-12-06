import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Fills & Color System', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    
    await editor.goto();
    await editor.waitForLoad();
  });

  test('FL01: Apply Solid Fill color via Hex input', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.1, 0.1, 0.2, 0.2);
    
    // 2. Verify initial fill
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    await expect(fillSection).toBeVisible();
    
    // 3. Find the Hex input
    const hexInput = fillSection.locator('.pi-row input.fill-hex-input');
    await expect(hexInput).toBeVisible();
    
    // 4. Change color to Red (#FF0000)
    await hexInput.click();
    await hexInput.fill('#FF0000');
    await hexInput.press('Enter');
    
    // 5. Verify input value updated
    await expect(hexInput).toHaveValue('#FF0000');
    
    // 6. Verify canvas element updated
    const swatchDiv = fillSection.locator('.color-swatch-trigger > div').first();
    await expect(swatchDiv).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  });

  test('FL04: Change Solid Fill Opacity', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.35, 0.1, 0.2, 0.2);
    
    // 2. Find Opacity input in Fill section
    // Selector: .pi-row .pi-input-group input.pi-input
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    const opacityInput = fillSection.locator('.pi-row .pi-input-group input.pi-input');
    
    await expect(opacityInput).toBeVisible();
    
    // 3. Change opacity to 50%
    await opacityInput.click();
    await opacityInput.fill('50');
    await opacityInput.press('Enter');
    
    // 4. Verify input value
    await expect(opacityInput).toHaveValue('50%');
  });

  test('FL05: Toggle Fill Visibility', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.6, 0.1, 0.2, 0.2);
    
    // 2. Find visibility toggle (eye icon)
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    // Selector: button with title "Hide Fill" (initially visible)
    const visibilityBtn = fillSection.locator('button[title="Hide Fill"]');
    
    await visibilityBtn.click();
    
    // Verify state change - button title should change to "Show Fill"
    const showBtn = fillSection.locator('button[title="Show Fill"]');
    await expect(showBtn).toBeVisible();
    
    // Toggle back
    await showBtn.click();
    await expect(visibilityBtn).toBeVisible();
  });

  test('FL06: Remove Fill Layer', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.1, 0.35, 0.2, 0.2);
    
    // 2. Find remove button (minus icon)
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    const removeBtn = fillSection.locator('button[title="Remove Fill"]');
    
    await removeBtn.click();
    
    // 3. Verify fill row is gone or empty state
    // Should show "No fill" text
    const emptyState = fillSection.locator('text=No fill');
    await expect(emptyState).toBeVisible();
  });
});
