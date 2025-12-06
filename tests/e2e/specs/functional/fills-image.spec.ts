import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';
import path from 'path';

test.describe('Fills - Image System', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    
    await editor.goto();
    await editor.waitForLoad();
  });

  test('FL21: Switch Fill Type to Image', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.1, 0.1, 0.2, 0.2);
    
    // 2. Open Fill Flyout
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    await fillSection.locator('.fill-swatch-trigger').click();
    
    // 3. Switch to Image Tab
    const flyout = page.locator('.fill-flyout');
    await flyout.locator('.fill-type-selector button[title="Image"]').click();
    
    // 4. Verify Image Tab UI
    const previewArea = flyout.locator('.media-preview-area');
    await expect(previewArea).toBeVisible();
    
    const emptyState = previewArea.locator('.media-empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('Drop image here');
  });

  test('FL22: Upload Image file', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.35, 0.1, 0.2, 0.2);
    
    // 2. Open Fill Flyout & Switch to Image
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    await fillSection.locator('.fill-swatch-trigger').click();
    
    const flyout = page.locator('.fill-flyout');
    await flyout.locator('.fill-type-selector button[title="Image"]').click();
    
    // 3. Upload Image
    // We need to target the hidden file input
    // The input is inside the flyout-content, appended after previewArea
    const fileInput = flyout.locator('input[type="file"]');
    
    // Create a dummy image buffer
    const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'); // 1x1 transparent GIF
    
    await fileInput.setInputFiles({
      name: 'test-image.gif',
      mimeType: 'image/gif',
      buffer: buffer
    });
    
    // 4. Verify Image Loaded
    const previewArea = flyout.locator('.media-preview-area');
    const img = previewArea.locator('img');
    await expect(img).toBeVisible();
    
    // Verify empty state is gone
    const emptyState = previewArea.locator('.media-empty-state');
    await expect(emptyState).not.toBeVisible();
    
    // 5. Verify PI Swatch update
    // Close flyout
    await flyout.locator('button[title="Close"]').click();
    
    const piSwatch = fillSection.locator('.fill-swatch-trigger > .fill-preview').first();
    const style = await piSwatch.getAttribute('style');
    // The swatch should have a background image (blob url)
    expect(style).toContain('url("blob:');
  });

  test('FL23: Change Image Scale Mode', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.6, 0.1, 0.2, 0.2);
    
    // 2. Open Fill Flyout & Switch to Image
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    await fillSection.locator('.fill-swatch-trigger').click();
    
    const flyout = page.locator('.fill-flyout');
    await flyout.locator('.fill-type-selector button[title="Image"]').click();
    
    // 3. Upload Image (Required to see scale modes? No, buttons are rendered always in ImageTab.js)
    // "this.element.appendChild(scaleModeRow);" is outside the "if (this.fill.assetId)" block?
    // Let's check ImageTab.js again.
    // Yes, scaleModeRow is appended after previewArea and fileInput, unconditionally.
    
    // 4. Verify Default Scale Mode (Fill)
    const fillBtn = flyout.locator('.scale-mode-btn', { hasText: 'Fill' });
    await expect(fillBtn).toHaveClass(/active/); // Assuming Button component adds 'active' class
    
    // 5. Switch to Fit
    const fitBtn = flyout.locator('.scale-mode-btn', { hasText: 'Fit' });
    await fitBtn.click();
    
    await expect(fitBtn).toHaveClass(/active/);
    await expect(fillBtn).not.toHaveClass(/active/);
    
    // 6. Switch to Tile
    const tileBtn = flyout.locator('.scale-mode-btn', { hasText: 'Tile' });
    await tileBtn.click();
    
    await expect(tileBtn).toHaveClass(/active/);
    await expect(fitBtn).not.toHaveClass(/active/);
  });
});
