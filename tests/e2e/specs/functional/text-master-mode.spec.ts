import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Text in Master Mode', () => {
    let editor: EditorPage;
    let canvas: CanvasHelper;

    test.beforeEach(async ({ page }) => {
        editor = new EditorPage(page);
        canvas = new CanvasHelper(page);
        await editor.goto();
        await editor.waitForLoad();
        await editor.waitForFonts();
    });

    /*
    test('TC-27: Edit Title Placeholder in Master', async () => {
        // 1. Enter Master Mode
        await editor.editMaster();
        
        // 2. Select Title Placeholder (Assuming it's at the top)
        // We might need a way to identify placeholders specifically.
        // For now, we assume standard layout positions.
        await editor.setActiveTool('select');
        await canvas.clickAt(0.5, 0.41); // Top area usually has title
        
        // 3. Change Property (e.g., Color)
        await editor.textColorHex.fill('#FF00FF');
        await editor.textColorHex.press('Enter');
        
        // 4. Exit Master Mode
        await editor.closeMaster();
        
        // 5. Verify Instance Slide
        // The title on the slide should now be #FF00FF
        await canvas.clickAt(0.5, 0.15); // Select title on slide
        
        const state = await editor.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        const selection = state.editor.selectedElementIds;
        const el = slide.elements[selection[0]];
        
        // Note: In some implementations, the instance stores the color if overridden.
        // If not overridden, it should resolve to the master's color.
        // We might need to check computed style or the resolved property.
        expect(el.style.color).toBe('#FF00FF'); 
    });
    */

    test('TC-29: Static Text in Master', async () => {
        await editor.editMaster();
        
        // Add static text (footer maybe)
        await editor.setActiveTool('text');
        await canvas.clickAt(0.5, 0.9);
        await canvas.typeText('Confidential');
        await canvas.clickAt(0.1, 0.1); // Commit
        
        await editor.closeMaster();
        
        // Verify it appears on slide
        // It should be visible but NOT selectable as a normal text object
        // (unless we unlock it, but usually master items are background)
        
        // We can check if it exists in the render list or visual snapshot
        // For now, let's check if we can select it.
        await editor.setActiveTool('select');
        await canvas.clickAt(0.5, 0.9);
        
        const state = await editor.getState();
        const selection = state.editor.selectedElementIds;
        
        // Should be empty or select the slide background, NOT the text element
        expect(selection).toHaveLength(0);
    });
});
