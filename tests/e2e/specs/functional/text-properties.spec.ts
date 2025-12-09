import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Text Properties', () => {
    let editor: EditorPage;
    let canvas: CanvasHelper;

    test.beforeEach(async ({ page }) => {
        editor = new EditorPage(page);
        canvas = new CanvasHelper(page);
        await editor.goto();
        await editor.waitForLoad();
        await editor.waitForFonts();
        
        // Create a text element for testing
        await editor.setActiveTool('text');
        await canvas.clickAt(0.5, 0.5);
        await canvas.typeText('Test Text');
        await canvas.clickAt(0.1, 0.1);
        
        // Select it
        await editor.setActiveTool('select');
        await canvas.clickAt(0.5, 0.5);
    });

    /*
    test('TC-17: Change Font Family', async () => {
        await editor.fontFamilySelect.click();
        // Assuming dropdown opens and we can click an option. 
        // We'll try to select the second option if specific text isn't reliable
        await editor.page.keyboard.press('ArrowDown');
        await editor.page.keyboard.press('Enter');
        
        const state = await editor.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        const elements = Object.values(slide.elements);
        const el = elements.find((e: any) => e.type === 'text' && !e.id.startsWith('placeholder')) as any;
        expect(el.fontFamily).not.toBe('Inter'); // Assuming Inter is default
    });
    */

    /*
    test('TC-22: Shortcut Bold (Cmd+B)', async () => {
        const isMac = process.platform === 'darwin';
        const modifier = isMac ? 'Meta' : 'Control';
        await editor.page.keyboard.press(`${modifier}+b`);
        
        const state = await editor.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        const elements = Object.values(slide.elements);
        const el = elements.find((e: any) => e.type === 'text' && !e.id.startsWith('placeholder')) as any;
        // Bold via shortcut applies inline style (<b> or <strong> or span with style)
        expect(el.content).toMatch(/<b>|<strong>|font-weight:\s*bold|font-weight:\s*700/);
    });
    */
    
    test('TC-20: Change Text Color', async () => {
        await editor.textColorHex.fill('#FF0000');
        await editor.textColorHex.press('Enter');
        
        const state = await editor.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        const elements = Object.values(slide.elements);
        const el = elements.find((e: any) => e.type === 'text' && !e.id.startsWith('placeholder')) as any;
        expect(el.textFill.value).toBe('#FF0000');
    });

    test('TC-21: Alignment', async () => {
        await editor.alignCenterBtn.click();
        
        const state = await editor.getState();
        const activeSlideId = state.editor.activeSlideId;
        const slide = state.slides[activeSlideId];
        const elements = Object.values(slide.elements);
        const el = elements.find((e: any) => e.type === 'text' && !e.id.startsWith('placeholder')) as any;
        expect(el.textAlign).toBe('center');
    });
});
