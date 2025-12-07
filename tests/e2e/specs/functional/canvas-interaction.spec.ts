import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Canvas & Selection', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test.fixme('C04: Marquee selection (drag to select multiple)', async ({ page }) => {
    // 1. Create two rectangles
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.2, 0.2, 0.1, 0.1);
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.4, 0.2, 0.1, 0.1);
    
    // 2. Deselect
    await canvas.clickAt(0.1, 0.1);
    
    // 3. Marquee drag covering both
    await canvas.drag(0.15, 0.15, 0.55, 0.35);
    
    // 4. Verify multiple selection
    // Check Property Inspector for "Multiple" or count
    const piHeader = page.locator('.pi-header-title');
    await expect(piHeader).toContainText(/Multiple|2 objects/i);
  });

  test.fixme('C06: Resize element using corner handles', async ({ page }) => {
    // 1. Create rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.3, 0.3, 0.2, 0.2);
    
    // 2. Select it (should be selected after draw, but ensure)
    await canvas.clickAt(0.4, 0.4);
    
    // 3. Find resize handle (e.g., bottom-right)
    // Handles are usually children of the selection box
    const handle = page.locator('.resize-handle.se, .resize-handle.br'); 
    await expect(handle).toBeVisible();
    
    // 4. Drag handle
    const box = await handle.boundingBox();
    if (!box) throw new Error('Handle not found');
    
    await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.up();
    
    // 5. Verify size changed
    // We can check the width/height inputs in PI
    const widthInput = page.locator('input[data-testid="width-input"], input.input-width');
    // Or just check that it's larger
    // For now, let's assume we can check the PI values
  });

  test.fixme('C12: Duplicate element (Ctrl+D)', async ({ page }) => {
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.3, 0.3, 0.1, 0.1);
    
    // Duplicate
    await page.keyboard.press('Control+d');
    
    // Verify we have 2 elements
    // Move the top one to see the one below? 
    // Usually duplicate offsets slightly
    
    // Check PI count? No, only 1 selected usually.
    // Check DOM count of shapes
    const shapes = page.locator('.canvas-node.shape'); // Hypothetical selector
    await expect(shapes).toHaveCount(2);
  });

  test.fixme('C13: Group multiple elements (Ctrl+G)', async ({ page }) => {
    // Create two shapes
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.2, 0.2, 0.1, 0.1);
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.4, 0.2, 0.1, 0.1);
    
    // Select both
    await canvas.drag(0.15, 0.15, 0.55, 0.35);
    
    // Group
    await page.keyboard.press('Control+g');
    
    // Verify grouping
    // PI should say "Group"
    const piHeader = page.locator('.pi-header-title');
    await expect(piHeader).toHaveText(/Group/i);
  });
});
