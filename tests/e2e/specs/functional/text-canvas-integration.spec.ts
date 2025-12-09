import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Text Canvas Integration', () => {
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
    test('Zoom and Edit', async () => {
        await editor.setActiveTool('text');
        await canvas.clickAt(0.5, 0.5);
        await canvas.typeText('Zoom Test');
        await canvas.clickAt(0.1, 0.1);

        // Zoom in
        await canvas.zoom(-100); 
        
        // Double click to edit
        await editor.setActiveTool('select');
        // Click once to select, then press Enter to edit (more reliable than double click in tests)
        await canvas.clickAt(0.5, 0.5);
        await editor.page.keyboard.press('Enter');
        
        // Type more (Enter selects all, so this replaces)
        await canvas.typeText('Works');
        await canvas.clickAt(0.1, 0.1);
        
        const state = await editor.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        const elements = Object.values(slide.elements);
        const el = elements.find((e: any) => e.type === 'text' && !e.id.startsWith('placeholder')) as any;
        expect(el.content).toBe('Works');
    });
    */

    test('Pan and Edit', async () => {
        await editor.setActiveTool('text');
        await canvas.clickAt(0.5, 0.5);
        await canvas.typeText('Pan Test');
        await canvas.clickAt(0.1, 0.1);

        // Pan
        await editor.setActiveTool('hand');
        await canvas.drag(0.5, 0.5, 0.4, 0.4); // Drag canvas
        
        // Switch back to select and edit
        await editor.setActiveTool('select');
        // We need to click where the text IS now, not where it was.
        // Since we panned (0.5,0.5) -> (0.4,0.4), the text should be at 0.4, 0.4
        await canvas.clickAt(0.4, 0.4);
        await editor.page.keyboard.press('Enter');
        
        await canvas.typeText('Works');
        await canvas.clickAt(0.1, 0.1);
        
        const state = await editor.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        const elements = Object.values(slide.elements);
        const el = elements.find((e: any) => e.type === 'text' && !e.id.startsWith('placeholder')) as any;
        expect(el.content).toBe('Works');
    });
});
