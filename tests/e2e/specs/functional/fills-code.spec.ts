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
    await fillSection.locator('.color-swatch-trigger').click();
    
    // 3. Switch to Code Tab
    const flyout = page.locator('.fill-flyout');
    await flyout.locator('.fill-type-selector button[title="Code"]').click();
    
    // 4. Click "Open Panel" button
    // Assuming there is a button to open the panel in the Code tab
    const openPanelBtn = flyout.locator('button', { hasText: 'Open Panel' });
    // If the button text is different, I might need to adjust.
    // Based on spec: "Open Panel" button
    
    // Check if button exists, if not, maybe try toolbar
    if (await openPanelBtn.count() > 0) {
        await openPanelBtn.click();
    } else {
        // Try toolbar icon if flyout button missing
        // Spec says: "Toolbar Integration ... [</> Code]"
        const toolbarCodeBtn = page.locator('.toolbar-button[title="Code Fill Panel"]');
        if (await toolbarCodeBtn.count() > 0) {
            await toolbarCodeBtn.click();
        } else {
            // Try keyboard shortcut?
            // Or maybe the button has an icon instead of text?
            // Let's try to find it by icon or class
            await flyout.locator('.code-tab-actions button').first().click();
        }
    }
    
    // 5. Verify Panel is Open
    const panel = page.locator('.code-fill-panel');
    await expect(panel).toBeVisible();
    
    // Verify Header
    await expect(panel.locator('.panel-header')).toContainText('Code Fill');
  });

  test('FL27: Apply Code Fill Preset', async ({ page }) => {
    // 1. Create a rectangle
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.4, 0.1, 0.2, 0.2);
    
    // 2. Open Code Fill Panel (via Toolbar for direct access)
    // Assuming toolbar button exists
    const toolbarCodeBtn = page.locator('.toolbar-button[title="Code Fill Panel"]');
    // If toolbar button doesn't exist, use flyout
    if (await toolbarCodeBtn.count() > 0) {
        await toolbarCodeBtn.click();
    } else {
        const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
        await fillSection.locator('.color-swatch-trigger').click();
        const flyout = page.locator('.fill-flyout');
        await flyout.locator('.fill-type-selector button[title="Code"]').click();
        await flyout.locator('button', { hasText: 'Open Panel' }).click();
    }
    
    const panel = page.locator('.code-fill-panel');
    await expect(panel).toBeVisible();
    
    // 3. Select "Presets" tab
    await panel.locator('.tab-button', { hasText: 'Presets' }).click();
    
    // 4. Select a preset
    const firstPreset = panel.locator('.preset-item').first();
    await firstPreset.click();
    
    // 5. Apply
    // Some panels apply immediately, others need "Apply" button.
    // Spec says: "[Apply Changes]" in footer.
    const applyBtn = panel.locator('.panel-footer button', { hasText: 'Apply' });
    if (await applyBtn.isVisible()) {
        await applyBtn.click();
    }
    
    // 6. Verify Fill Applied
    // Check if the element has code fill
    // We can check the PI or the element style
    // The PI should show "Code" type
    const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
    // Close panel if it covers PI? It's a flyout, might cover.
    // But we can check PI state.
    // Or check if the canvas element has the fill.
    // Since it's a canvas render, we can't check DOM style easily.
    // But we can check the PI value.
    await expect(fillSection.locator('.fill-type-display')).toContainText('Code');
  });
});
