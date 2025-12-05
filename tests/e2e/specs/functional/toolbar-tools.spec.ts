import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * Functional Tests - Toolbar Tool Selection
 * Tests for selecting and switching between different tools
 */

test.describe('Toolbar Tool Selection', () => {
    let editor: EditorPage;
    
    test.beforeEach(async ({ page }) => {
        editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();
    });
    
    test('should switch to hand tool', async () => {
        // Select hand tool
        await editor.setActiveTool('hand');
        
        // Verify hand tool is active in UI
        const isActive = await editor.isToolActive('hand');
        expect(isActive).toBe(true);
        
        // Verify state reflects the change
        const activeTool = await editor.getActiveTool();
        expect(activeTool).toBe('hand');
    });
    
    test('should switch to shape tool', async () => {
        await editor.setActiveTool('shape');
        
        const isActive = await editor.isToolActive('shape');
        expect(isActive).toBe(true);
        
        const activeTool = await editor.getActiveTool();
        expect(activeTool).toBe('shape');
    });
    
    test('should switch to text tool', async () => {
        await editor.setActiveTool('text');
        
        const isActive = await editor.isToolActive('text');
        expect(isActive).toBe(true);
        
        const activeTool = await editor.getActiveTool();
        expect(activeTool).toBe('text');
    });
    
    test('should switch to image tool', async () => {
        await editor.setActiveTool('image');
        
        const isActive = await editor.isToolActive('image');
        expect(isActive).toBe(true);
        
        const activeTool = await editor.getActiveTool();
        expect(activeTool).toBe('image');
    });
    
    test('should switch back to select tool', async () => {
        // Start with a different tool
        await editor.setActiveTool('hand');
        
        // Switch to select
        await editor.setActiveTool('select');
        
        const isActive = await editor.isToolActive('select');
        expect(isActive).toBe(true);
        
        const activeTool = await editor.getActiveTool();
        expect(activeTool).toBe('select');
    });
    
    test('should maintain tool selection when switching slides', async ({ getState }) => {
        // Select text tool
        await editor.setActiveTool('text');
        
        // Switch to second slide
        await editor.selectSlide(1);
        
        // Verify text tool is still active
        const activeTool = await editor.getActiveTool();
        expect(activeTool).toBe('text');
        
        const isActive = await editor.isToolActive('text');
        expect(isActive).toBe(true);
    });
    
    test('should deactivate previous tool when selecting new tool', async () => {
        // Select hand tool
        await editor.setActiveTool('hand');
        
        // Verify hand is active
        let isHandActive = await editor.isToolActive('hand');
        expect(isHandActive).toBe(true);
        
        // Select text tool
        await editor.setActiveTool('text');
        
        // Verify hand is no longer active
        isHandActive = await editor.isToolActive('hand');
        expect(isHandActive).toBe(false);
        
        // Verify text is now active
        const isTextActive = await editor.isToolActive('text');
        expect(isTextActive).toBe(true);
    });
});
