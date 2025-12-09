import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Placeholder Lifecycle', () => {
    let editor: EditorPage;
    let canvas: CanvasHelper;

    test.beforeEach(async ({ page }) => {
        editor = new EditorPage(page);
        canvas = new CanvasHelper(page);
        await editor.goto();
        await editor.waitForLoad();
        await editor.waitForFonts();
    });

    test('Placeholder: Fill, Commit, Edit, Clear, Reset', async ({ page }) => {
        // 1. Find a placeholder (Title)
        const state = await editor.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        const placeholderId = Object.keys(slide.elements).find(id => id.includes('placeholder'));
        
        if (!placeholderId) throw new Error('No placeholder found');
        
        const placeholderLocator = page.locator(`#slide-content [data-element-id="${placeholderId}"]`);
        
        // Verify initial state
        await expect(placeholderLocator).toHaveClass(/story-placeholder-empty/);
        
        // 2. Double click to edit
        const box = await placeholderLocator.boundingBox();
        if (box) {
            await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
        }
        
        // Verify prompt text is cleared/hidden (or we are just in empty edit state)
        // Type content
        await canvas.typeText('My Custom Title');
        
        // 3. Commit
        await canvas.clickAt(0.1, 0.1);
        
        // Verify content and class
        await expect(placeholderLocator).not.toHaveClass(/story-placeholder-empty/);
        await expect(placeholderLocator).toContainText('My Custom Title');
        
        // 4. Edit again
        await page.mouse.dblclick(box!.x + box!.width / 2, box!.y + box!.height / 2);
        
        // 5. Select All and Delete
        const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
        await page.keyboard.press(`${modifier}+a`);
        await page.keyboard.press('Backspace');
        
        // 6. Commit
        await canvas.clickAt(0.1, 0.1);
        
        // 7. Verify Reset
        // Should have the empty class again
        await expect(placeholderLocator).toHaveClass(/story-placeholder-empty/);
        // Should show prompt text (implementation dependent, usually via CSS ::before or actual text)
        // If it's actual text, we check for it. If it's CSS, we check class.
        // Assuming class is the primary indicator.
    });
});
