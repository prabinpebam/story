import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Text Property Persistence', () => {
    let editor: EditorPage;
    let canvas: CanvasHelper;
    
    test.beforeEach(async ({ page }) => {
        editor = new EditorPage(page);
        canvas = new CanvasHelper(page);
        await editor.goto();
        await editor.waitForLoad();
        
        // Create a text element
        await editor.setActiveTool('text');
        await canvas.clickAt(0.5, 0.5);
        await page.keyboard.type('Persistence Test');
        await page.keyboard.press('Escape'); // Exit edit mode, but keep selected? 
        // Usually Escape exits edit mode but keeps selection. 
        // If not, we select it explicitly.
    });
    
    test('should maintain selection when clicking alignment buttons', async ({ page, getState }) => {
        // Ensure element is selected
        await editor.setActiveTool('select');
        await canvas.clickAt(0.5, 0.5);
        
        // Verify initial selection
        let state = await getState();
        expect(state.editor.selectedElementIds.length).toBe(1);
        const elementId = state.editor.selectedElementIds[0];
        
        // Find the Property Inspector
        const pi = page.locator('[data-testid="property-inspector"]');
        await expect(pi).toBeVisible();
        
        // Find the Typography Section
        const typographySection = pi.locator('.pi-section', { hasText: 'Typography' });
        await expect(typographySection).toBeVisible();
        
        // Find buttons within the Typography section
        const buttons = typographySection.locator('button');
        
        const count = await buttons.count();
        
        if (count > 0) {
            // Click the last button (likely an alignment or settings button)
            await buttons.last().click();
            
            // Wait a bit for any potential side effects
            await page.waitForTimeout(200);
            
            // Verify selection persists
            state = await getState();
            expect(state.editor.selectedElementIds).toContain(elementId);
        } else {
            throw new Error('No buttons found in Typography section');
        }
    });
});
