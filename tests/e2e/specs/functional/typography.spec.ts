import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Typography', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test.fixme('T17: Change Font Size (Keyboard shortcuts)', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.drawTextBox(0.3, 0.3);
    await page.keyboard.type('Hello World');
    
    // Select all text
    await page.keyboard.press('Control+a');
    
    // Get initial size
    const sizeInput = page.locator('.pi-section', { hasText: 'Text' }).locator('input.font-size-input');
    const initialSize = await sizeInput.inputValue();
    
    // Increase font size
    await page.keyboard.press('Control+Shift+>');
    await page.waitForTimeout(200);
    
    const newSize = await sizeInput.inputValue();
    expect(parseInt(newSize)).toBeGreaterThan(parseInt(initialSize));
  });

  test.fixme('T21: Change Text Alignment', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.drawTextBox(0.3, 0.3);
    await page.keyboard.type('Alignment Test');
    
    const textSection = page.locator('.pi-section', { hasText: 'Text' });
    
    // Center align
    const centerBtn = textSection.locator('button[aria-label="Align Center"], button.align-center');
    await centerBtn.click();
    await expect(centerBtn).toHaveClass(/active|selected/);
    
    // Right align
    const rightBtn = textSection.locator('button[aria-label="Align Right"], button.align-right');
    await rightBtn.click();
    await expect(rightBtn).toHaveClass(/active|selected/);
  });

  test.fixme('T23: Toggle Text Decoration', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.drawTextBox(0.3, 0.3);
    await page.keyboard.type('Decoration Test');
    
    const textSection = page.locator('.pi-section', { hasText: 'Text' });
    
    // Underline
    const underlineBtn = textSection.locator('button[aria-label="Underline"], button.format-underline');
    await underlineBtn.click();
    await expect(underlineBtn).toHaveClass(/active|selected/);
  });
});
