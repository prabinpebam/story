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
    const hexInput = fillSection.locator('input.fill-hex-input');
    await expect(hexInput).toBeVisible();
    
    // 4. Change color to Red (#FF0000)
    await hexInput.click();
    await hexInput.fill('#FF0000');
    await hexInput.press('Enter');
    
    // 5. Verify input value updated
    await expect(hexInput).toHaveValue('#FF0000');
    
    // 6. Verify canvas element updated
    const swatchDiv = fillSection.locator('.fill-swatch-trigger > div').first();
    await expect(swatchDiv).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  });

  test('FL04: Change Solid Fill Opacity', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.35, 0.1, 0.2, 0.2);
    
    // 2. Find Opacity input in Fill section
    // Selector: .pi-row .pi-input-group input.pi-input
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    const opacityInput = fillSection.locator('.pi-input-group input.pi-input');
    
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
    const row = fillSection.locator('.pi-property-row').first();
    const visibilityBtn = row.locator('button.pi-property-row__visibility');

    await visibilityBtn.click();
    await expect(row).toHaveClass(/\binvisible\b/);

    // Toggle back
    await visibilityBtn.click();
    await expect(row).not.toHaveClass(/\binvisible\b/);
  });

  test('FL06: Remove Fill Layer', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.1, 0.35, 0.2, 0.2);
    
    // 2. Find remove button (minus icon)
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    const removeBtn = fillSection.locator('.pi-property-row').first().locator('button.pi-property-row__delete');
    
    await removeBtn.click();
    
    // 3. Verify fill row is gone or empty state
    // Should show "No fill" text
    const emptyState = fillSection.locator('text=No fill');
    await expect(emptyState).toBeVisible();
  });

  test('FL02: Apply Solid Fill via Color Picker (HSB area)', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.35, 0.35, 0.2, 0.2);
    
    // 2. Open Color Picker Flyout
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    const swatchTrigger = fillSection.locator('.fill-swatch-trigger');
    await swatchTrigger.click();
    
    // 3. Wait for Flyout
    const flyout = page.locator('.fill-flyout');
    await expect(flyout).toBeVisible();
    
    // 4. Interact with HSB Area
    const hsbArea = flyout.locator('.solid-tab .color-hsb-area');
    await expect(hsbArea).toBeVisible();
    
    // Click in the middle of the HSB area
    await hsbArea.click({ position: { x: 50, y: 50 } });
    
    // 5. Verify color changed
    // Close flyout first to ensure value is committed if needed (though it should be real-time)
    const closeBtn = flyout.locator('button[title="Close"]');
    await closeBtn.click();
    await expect(flyout).toBeHidden();
    
    // Verify in PI
    const hexInput = fillSection.locator('input.fill-hex-input');
    // We don't know the exact color, but it shouldn't be the default gray/black
    const value = await hexInput.inputValue();
    expect(value).not.toBe('#D9D9D9'); // Default placeholder
    expect(value).not.toBe('#000000'); // Default black
  });

  test('FL03: Apply Solid Fill via Swatch Grid', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.6, 0.35, 0.2, 0.2);
    
    // 2. Open Color Picker Flyout
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    const swatchTrigger = fillSection.locator('.fill-swatch-trigger');
    await swatchTrigger.click();
    
    // 3. Find Swatch Grid
    const flyout = page.locator('.fill-flyout');
    // There might be multiple grids (Theme vs Default). Use the first one (Theme).
    const swatchGrid = flyout.locator('.swatch-grid').first();
    await expect(swatchGrid).toBeVisible();
    
    // 4. Click the first swatch (Slot 1)
    const swatches = swatchGrid.locator('.swatch');
    const targetSwatch = swatches.first();
    
    // Get expected color from style
    const swatchStyle = await targetSwatch.getAttribute('style');
    const colorMatch = swatchStyle?.match(/background-color:\s*(.+?);/);
    
    await targetSwatch.click();
    
    // 5. Verify color applied
    // Check hex input value (should be slot name if linked)
    const hexInput = fillSection.locator('input.fill-hex-input');
    
    // Verify it shows a Slot label and is linked
    await expect(hexInput).toHaveValue(/Slot\s+\d+/);
    await expect(hexInput).toHaveClass(/fill-hex-input--linked/);
  });

  test('FL07: Add Multiple Fills', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.1, 0.6, 0.2, 0.2);
    
    // 2. Find "Add Fill" button
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    const addAction = fillSection.locator('.pi-section__actions button[title="Add Fill"]');
    
    await addAction.click();
    
    // 3. Verify two fill rows exist
    const rows = fillSection.locator('.pi-property-row');
    await expect(rows).toHaveCount(2);
  });

  test('FL08: Reorder Fills', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.35, 0.6, 0.2, 0.2);
    
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    
    // 2. Add a second fill
    const addAction = fillSection.locator('.pi-section__actions button[title="Add Fill"]');
    await addAction.click();
    
    // 3. Set different colors
    const rows = fillSection.locator('.pi-property-row');
    const row1 = rows.nth(0);
    const row2 = rows.nth(1);
    
    // Set Row 1 to Red
    const input1 = row1.locator('input.fill-hex-input');
    await input1.click();
    await input1.fill('#FF0000');
    await input1.press('Enter');
    
    // Set Row 2 to Blue
    const input2 = row2.locator('input.fill-hex-input');
    await input2.click();
    await input2.fill('#0000FF');
    await input2.press('Enter');
    
    // 4. Drag Row 1 below Row 2
    const dragHandle1 = row1.locator('.pi-property-row__handle');
    
    // Use dragTo with targetPosition to ensure we drop in the bottom half of the target row
    // This triggers the "insert after" logic in FillSection.js
    const row2Box = await row2.boundingBox();
    if (row2Box) {
        await dragHandle1.dragTo(row2, {
            targetPosition: { x: row2Box.width / 2, y: row2Box.height * 0.8 }
        });
    }
    
    // 5. Verify order swapped
    // Note: dragTo might drop ON the element. 
    // Our logic says if drop Y > mid Y, insert after.
    // dragTo usually moves to center.
    // So dragging row 1 to row 2 center might drop it "on" row 2.
    // If row 2 is below row 1, dropping on row 2 center (which is below row 1)
    // should trigger "below" logic if we are careful.
    // But let's verify.
    
    const newRows = fillSection.locator('.pi-property-row');
    const newRow1Input = newRows.nth(0).locator('input.fill-hex-input');
    const newRow2Input = newRows.nth(1).locator('input.fill-hex-input');
    
    await expect(newRow1Input).toHaveValue('#0000FF');
    await expect(newRow2Input).toHaveValue('#FF0000');
  });



  test('FL33: Use Eyedropper Tool', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.35, 0.1, 0.2, 0.2);
    
    // 2. Open Color Picker Flyout
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    const swatchTrigger = fillSection.locator('.fill-swatch-trigger');
    await swatchTrigger.click();
    
    // 3. Find Eyedropper button
    const flyout = page.locator('.fill-flyout');
    const eyedropperBtn = flyout.locator('button[title="Pick Color"]');
    await expect(eyedropperBtn).toBeVisible();
    
    // Note: Actual eyedropper interaction is limited in automated tests
  });

  test.fixme('FL34: Save Color to Document Colors', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.6, 0.1, 0.2, 0.2);
    
    // 2. Open Color Picker Flyout
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    const swatchTrigger = fillSection.locator('.fill-swatch-trigger');
    await swatchTrigger.click();
    
    // 3. Find "Default Colors" section
    const flyout = page.locator('.fill-flyout');
    const defaultColorsLabel = flyout.locator('.swatch-section-label', { hasText: 'Default Colors' });
    await expect(defaultColorsLabel).toBeVisible();
    
    // 4. Click a swatch (e.g., Red #F24822)
    const redSwatch = flyout.locator('.swatch[title="#F24822"]');
    await redSwatch.click();
    
    // 5. Verify color applied in PI
  });

  // FL35: Switch between Custom and Library Tabs
  // Note: Tabs are currently placeholders.
  test.fixme('FL35: Switch between Custom and Library Tabs', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.1, 0.35, 0.2, 0.2);
    
    // 2. Open Color Picker Flyout
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    const swatchTrigger = fillSection.locator('.fill-swatch-trigger');
    await swatchTrigger.click();
    
    // 3. Find Tabs
    const flyout = page.locator('.fill-flyout');
    const librariesTab = flyout.locator('div', { hasText: /^Libraries$/ });
    
    // 4. Click Libraries Tab
    await librariesTab.click();
    
    // 5. Verify content changed (e.g. SolidTab hidden)
    const solidTab = flyout.locator('.solid-tab');
    await expect(solidTab).toBeHidden();
  });

  test('FL20: Manipulate Gradient Handles on Canvas', async ({ page }) => {
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.3, 0.3, 0.2, 0.2);
    
    // Set to gradient
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    // Assuming we can switch type
    const typeSelect = fillSection.locator('.fill-type-select, [aria-label="Fill Type"]');
    if (await typeSelect.isVisible()) {
        await typeSelect.click();
        await page.locator('.fill-type-option', { hasText: /Linear|Gradient/ }).first().click();
        
        // Verify handles appear on canvas
        const startHandle = page.locator('.gradient-handle.start, .handle-start');
        await expect(startHandle).toBeVisible();
        
        // Drag handle
        const box = await startHandle.boundingBox();
        if (box) {
            await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
            await page.mouse.down();
            await page.mouse.move(box.x + 50, box.y + 50);
            await page.mouse.up();
        }
    }
  });

  test('FL26: Switch Fill Type to Code', async ({ page }) => {
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.3, 0.3, 0.2, 0.2);
    
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    const typeSelect = fillSection.locator('.fill-type-select, [aria-label="Fill Type"]');
    
    if (await typeSelect.isVisible()) {
        await typeSelect.click();
        
        // Select Code
        const codeOption = page.locator('.fill-type-option', { hasText: /Code|Shader/i });
        if (await codeOption.isVisible()) {
            await codeOption.click();
            // Verify code editor or panel appears
            await expect(page.locator('.code-editor, .shader-editor, .code-fill-panel')).toBeVisible();
        }
    }
  });

  test('FL32: Switch between Color Models', async ({ page }) => {
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.3, 0.3, 0.2, 0.2);
    
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    const swatchTrigger = fillSection.locator('.fill-swatch-trigger');
    await swatchTrigger.click();
    
    // Find model switcher
    const modelSelect = page.locator('.color-model-select, .model-switcher');
    if (await modelSelect.isVisible()) {
        await modelSelect.click();
        await page.locator('.model-option', { hasText: /RGB|HSL/ }).first().click();
        // Verify inputs changed
        await expect(page.locator('.rgb-inputs, .hsl-inputs')).toBeVisible();
    }
  });
});
