import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Rich Text Editing & Formatting', () => {
    let editor: EditorPage;
    let canvas: CanvasHelper;

    test.beforeEach(async ({ page }) => {
        editor = new EditorPage(page);
        canvas = new CanvasHelper(page);
        await editor.goto();
        await editor.waitForLoad();
        await editor.waitForFonts();
    });

    test('Apply Mixed Styles (Bold one word)', async ({ page }) => {
        // 1. Create text
        await editor.setActiveTool('text');
        await canvas.clickAt(0.5, 0.5);
        await canvas.typeText('Hello World');
        
        // 2. Select "World" (last 5 chars)
        // Caret is at end. Shift+Left 5 times.
        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Shift+ArrowLeft');
        }
        
        // 3. Apply Bold via Shortcut
        const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
        await page.keyboard.press(`${modifier}+b`);
        
        // 4. Commit
        await canvas.clickAt(0.1, 0.1);
        
        // 5. Verify HTML content
        const state = await editor.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        const elements = Object.values(slide.elements);
        const textElement = elements.find((el: any) => el.type === 'text' && !el.id.startsWith('placeholder')) as any;
        
        // Expect "Hello " to be normal and "World" to be bold
        // The implementation might use <b>, <strong>, or <span style="font-weight: bold">
        // We'll check for the presence of bold markup around World
        expect(textElement.content).toMatch(/Hello\s*(<b>|<strong>|<span[^>]*font-weight:\s*(bold|700)[^>]*>)World/);
    });

    test('Keyboard Shortcuts (Bold, Italic, Underline)', async ({ page }) => {
        // 1. Create text
        await editor.setActiveTool('text');
        await canvas.clickAt(0.5, 0.5);
        await canvas.typeText('Formatting Test');
        
        // 2. Select All
        const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
        await page.keyboard.press(`${modifier}+a`);
        
        // 3. Apply Bold
        await page.keyboard.press(`${modifier}+b`);
        
        // 4. Apply Italic
        await page.keyboard.press(`${modifier}+i`);
        
        // 5. Apply Underline
        await page.keyboard.press(`${modifier}+u`);
        
        // 6. Commit
        await canvas.clickAt(0.1, 0.1);
        
        // 7. Verify
        const state = await editor.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        const elements = Object.values(slide.elements);
        const textElement = elements.find((el: any) => el.type === 'text' && !el.id.startsWith('placeholder')) as any;
        
        const content = textElement.content;
        expect(content).toMatch(/<b>|<strong>|font-weight:\s*bold/);
        expect(content).toMatch(/<i>|<em>|font-style:\s*italic/);
        expect(content).toMatch(/<u>|text-decoration:\s*underline/);
    });

    test('Auto-Sizing: Box grows with text', async ({ page }) => {
        // 1. Create text (Auto size is default for click-to-create)
        await editor.setActiveTool('text');
        await canvas.clickAt(0.5, 0.5);
        
        // Get initial state (empty or small)
        // We need to type at least one char to have a box
        await canvas.typeText('A');
        
        // Wait for resize observer
        await page.waitForTimeout(100);
        
        // Check DOM width directly since store only updates on commit
        const getDomWidth = async () => {
            const box = await page.locator('#slide-content [contenteditable="true"]').boundingBox();
            return box ? box.width : 0;
        };
        
        const width1 = await getDomWidth();
        
        // 2. Type more
        await canvas.typeText(' long string of text that should make the box wider');
        await page.waitForTimeout(100);
        
        const width2 = await getDomWidth();
        
        expect(width2).toBeGreaterThan(width1);
    });

    test.fixme('Fixed Width: Text wraps, height grows', async ({ page }) => {
        // 1. Create text by DRAGGING (creates fixed size by default)
        await editor.setActiveTool('text');
        await canvas.drag(0.5, 0.5, 0.6, 0.55); // Drag to create box
        
        // 2. Switch to Fixed Width mode via Property Inspector
        // We need to ensure the PI is open and we can click the button
        const fixedWidthBtn = page.locator('[data-testid="resize-fixedWidth"]');
        await expect(fixedWidthBtn).toBeVisible();
        await fixedWidthBtn.click();
        
        // 3. Type text
        await canvas.typeText('Start');
        
        const getDomDimensions = async () => {
            const box = await page.locator('#slide-content [contenteditable="true"]').boundingBox();
            return box ? { width: box.width, height: box.height } : { width: 0, height: 0 };
        };
        
        const dim1 = await getDomDimensions();
        
        // 3. Type a LOT of text to force wrap
        // Assuming the box is relatively narrow from the drag
        await canvas.typeText(' This is a very long sentence that should definitely wrap to the next line because the box is fixed width.');
        await page.waitForTimeout(500); // Wait for resize observer
        
        const dim2 = await getDomDimensions();
        
        // Width should be roughly the same (allow small pixel diffs due to subpixel rendering)
        expect(Math.abs(dim2.width - dim1.width)).toBeLessThan(5);
        
        // Height should increase
        expect(dim2.height).toBeGreaterThan(dim1.height);
    });
});
