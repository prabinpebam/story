import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Effects & Styling', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('ST01: Add Stroke Layer', async ({ page }) => {
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.3, 0.3, 0.2, 0.2);
    
    const strokeSection = page.locator('.pi-section', { hasText: 'Stroke' });
    // Assuming there's an add button or it's initially hidden/collapsed
    const addBtn = strokeSection.locator('button.add-stroke-btn, button[aria-label="Add Stroke"]');
    
    if (await addBtn.isVisible()) {
        await addBtn.click();
    }
    
    await expect(strokeSection.locator('.stroke-row, .pi-row')).toBeVisible();
  });

  test.fixme('ST03: Change Stroke Weight', async ({ page }) => {
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.3, 0.3, 0.2, 0.2);
    
    const strokeSection = page.locator('.pi-section', { hasText: 'Stroke' });
    // Ensure stroke exists
    const addBtn = strokeSection.locator('button.add-stroke-btn');
    if (await addBtn.isVisible()) await addBtn.click();
    
    const weightInput = strokeSection.locator('input.stroke-weight-input');
    await weightInput.fill('5');
    await weightInput.press('Enter');
    
    await expect(weightInput).toHaveValue('5');
  });

  test.fixme('FX01: Add Drop Shadow Effect', async ({ page }) => {
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.3, 0.3, 0.2, 0.2);
    
    const effectsSection = page.locator('.pi-section', { hasText: 'Effects' });
    const addBtn = effectsSection.locator('button.add-effect-btn, button[aria-label="Add Effect"]');
    
    await addBtn.click();
    
    // Verify effect added
    await expect(effectsSection.locator('.effect-row')).toBeVisible();
    // Check if it's Drop Shadow by default or select it
    const typeSelect = effectsSection.locator('.effect-type-select');
    await expect(typeSelect).toHaveText(/Drop Shadow/i);
  });
});
