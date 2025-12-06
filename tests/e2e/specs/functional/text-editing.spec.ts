import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Text Editing Scenarios', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    
    await editor.goto();
    await editor.waitForLoad();
  });

  test('T01: Create text element via tool', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.clickAt(0.3, 0.3);
    const textInput = page.locator('#slide-content [contenteditable="true"]');
    await expect(textInput).toBeVisible();
    await canvas.typeText('Hello');
    await canvas.clickAt(0.5, 0.5); // Commit
    await expect(page.locator('#slide-content')).toContainText('Hello');
  });

  test('T02: Enter edit mode (Double click)', async ({ page }) => {
    // Setup: Create text
    await editor.setActiveTool('text');
    await canvas.clickAt(0.3, 0.3);
    await canvas.typeText('Original');
    await canvas.clickAt(0.5, 0.5); // Commit
    
    await editor.setActiveTool('select');
    
    // Find and double click
    const originalText = page.locator('#slide-content .slide-element', { hasText: 'Original' });
    const box = await originalText.boundingBox();
    if (box) {
        await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
    }
    
    // Verify input appears
    const textInput = page.locator('#slide-content [contenteditable="true"]');
    await expect(textInput).toBeVisible();
    
    // Verify we can edit
    await canvas.typeText(' Edited');
    await canvas.clickAt(0.1, 0.1);
    await expect(page.locator('#slide-content')).toContainText('Original Edited');
  });

  test('T03: Type text content', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.clickAt(0.4, 0.4);
    await canvas.typeText('Typing Test');
    const textInput = page.locator('#slide-content [contenteditable="true"]');
    await expect(textInput).toBeVisible();
  });

  test('T05: Commit text changes (Click outside)', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.clickAt(0.4, 0.4);
    await canvas.typeText('Commit Click');
    await canvas.clickAt(0.1, 0.1);
    await expect(page.locator('#slide-content [contenteditable="true"]')).not.toBeVisible();
    await expect(page.locator('#slide-content')).toContainText('Commit Click');
  });

  test('T06: Commit text changes (Cmd+Enter)', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.clickAt(0.4, 0.4);
    await canvas.typeText('Commit Shortcut');
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+Enter`);
    await expect(page.locator('#slide-content [contenteditable="true"]')).not.toBeVisible();
    await expect(page.locator('#slide-content')).toContainText('Commit Shortcut');
  });

  test('T07: Cancel text changes (Esc)', async ({ page }) => {
    // Case 1: Cancel creation
    await editor.setActiveTool('text');
    await canvas.clickAt(0.2, 0.2);
    await canvas.typeText('To Be Cancelled');
    await page.keyboard.press('Escape');
    
    // Should revert creation (disappear)
    await expect(page.locator('#slide-content [contenteditable="true"]')).not.toBeVisible();
    await expect(page.locator('#slide-content')).not.toContainText('To Be Cancelled');

    // Case 2: Cancel edit
    await editor.setActiveTool('text');
    await canvas.clickAt(0.5, 0.5);
    await canvas.typeText('Saved');
    await canvas.clickAt(0.1, 0.1); // Commit
    
    // Edit again
    const savedText = page.locator('#slide-content .slide-element', { hasText: 'Saved' });
    const box = await savedText.boundingBox();
    if (box) {
        await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
    }
    
    await canvas.typeText(' Unsaved');
    await page.keyboard.press('Escape');
    
    // Should revert to 'Saved'
    await expect(page.locator('#slide-content')).toContainText('Saved');
    await expect(page.locator('#slide-content')).not.toContainText('Unsaved');
  });

  test('T08: Delete empty text element on commit', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.clickAt(0.6, 0.6);
    // Don't type anything
    await canvas.clickAt(0.1, 0.1); // Commit
    
    // Should not exist (back to initial 2 elements)
    const elements = page.locator('#slide-content .slide-element');
    await expect(elements).toHaveCount(2);
  });

  test('T14-T16: Typography Properties', async ({ page }) => {
    await editor.setActiveTool('text');
    await canvas.clickAt(0.4, 0.4);
    await canvas.typeText('Font Props');
    await canvas.clickAt(0.1, 0.1);
    
    const textElement = page.locator('#slide-content .slide-element').filter({ hasText: 'Font Props' }).first();
    const box = await textElement.boundingBox();
    if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    
    const pi = page.locator('[data-testid="property-inspector"]');
    const typographySection = pi.locator('.pi-section', { has: page.locator('.pi-section-title', { hasText: 'Typography' }) });
    
    // Expand if needed
    const content = typographySection.locator('.pi-section-content');
    if (!await content.isVisible()) {
        await typographySection.locator('.pi-section-header').click();
    }
    
    const fontRow = typographySection.locator('.pi-row:not(.pi-style-row)').first();
    
    // T16: Font Size
    const fontSizeInput = fontRow.locator('input').last();
    await fontSizeInput.fill('48');
    await fontSizeInput.press('Enter');
    await expect(textElement).toHaveCSS('font-size', '48px');

    // T15: Font Weight
    const fontWeightDropdown = fontRow.locator('.dropdown-container').nth(1);
    await fontWeightDropdown.click();
    await page.locator('.dropdown-item').filter({ hasText: 'Bold' }).click();
    await expect(textElement).toHaveCSS('font-weight', '700');

    // T16: Color
    const fillRow = typographySection.locator('.pi-row').nth(2);
    const colorInput = fillRow.locator('input[spellcheck="false"]');
    await colorInput.fill('#00FF00');
    await colorInput.press('Enter');
    await expect(textElement).toHaveCSS('color', 'rgb(0, 255, 0)');
  });
});
