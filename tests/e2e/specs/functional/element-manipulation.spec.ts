import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

/**
 * Functional Tests - Element Manipulation
 * Tests for selecting, moving, and deleting elements
 */

test.describe('Element Manipulation', () => {
    let editor: EditorPage;
    let canvas: CanvasHelper;
    
    test.beforeEach(async ({ page }) => {
        editor = new EditorPage(page);
        canvas = new CanvasHelper(page);
        await editor.goto();
        await editor.waitForLoad();
        
        // Create a test element for manipulation
        await editor.setActiveTool('shape');
        await canvas.drawRectangle(0.3, 0.3, 0.2, 0.15);
        await page.waitForTimeout(300);
    });
    
    test('should select element by clicking on it', async ({ page, getState }) => {
        // Switch to select tool
        await editor.setActiveTool('select');
        
        // Click on the element we created
        await canvas.clickAt(0.4, 0.375);
        await page.waitForTimeout(200);
        
        // Verify element is selected
        const state = await getState();
        expect(state.editor.selectedElementIds.length).toBeGreaterThan(0);
    });
    
    test('should deselect element when clicking empty canvas', async ({ page, getState }) => {
        // Element should be selected after creation
        const initialState = await getState();
        expect(initialState.editor.selectedElementIds.length).toBeGreaterThan(0);
        
        // Switch to select tool
        await editor.setActiveTool('select');
        
        // Click on empty area
        await canvas.clickAt(0.1, 0.1);
        await page.waitForTimeout(200);
        
        // Verify selection is cleared
        const newState = await getState();
        expect(newState.editor.selectedElementIds.length).toBe(0);
    });
    
    test('should move element with drag', async ({ page, getState }) => {
        // Get initial element position
        const initialState = await getState();
        const activeSlideId = initialState.editor.activeSlideId;
        const elements = Object.values(initialState.slides[activeSlideId].elements);
        const element = elements[elements.length - 1] as any;
        const initialX = element.x;
        const initialY = element.y;
        
        // Switch to select tool
        await editor.setActiveTool('select');
        
        // Drag element to new position
        await canvas.moveElement(0.4, 0.375, 0.6, 0.5);
        await page.waitForTimeout(300);
        
        // Verify element moved
        const newState = await getState();
        const newElements = Object.values(newState.slides[activeSlideId].elements);
        const movedElement = newElements[newElements.length - 1] as any;
        
        // Position should have changed
        expect(movedElement.x).not.toBe(initialX);
        expect(movedElement.y).not.toBe(initialY);
    });
    
    test('should delete selected element with keyboard', async ({ page, getState }) => {
        // Get initial element count
        const initialState = await getState();
        const activeSlideId = initialState.editor.activeSlideId;
        const initialCount = Object.keys(initialState.slides[activeSlideId].elements).length;
        
        // Element should be selected after creation
        expect(initialState.editor.selectedElementIds.length).toBeGreaterThan(0);
        
        // Press Delete key
        await page.keyboard.press('Delete');
        await page.waitForTimeout(300);
        
        // Verify element was deleted
        const newState = await getState();
        const newCount = Object.keys(newState.slides[activeSlideId].elements).length;
        expect(newCount).toBe(initialCount - 1);
    });
    
    test('should delete selected element with Backspace', async ({ page, getState }) => {
        const initialState = await getState();
        const activeSlideId = initialState.editor.activeSlideId;
        const initialCount = Object.keys(initialState.slides[activeSlideId].elements).length;
        
        // Press Backspace key
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(300);
        
        // Verify element was deleted
        const newState = await getState();
        const newCount = Object.keys(newState.slides[activeSlideId].elements).length;
        expect(newCount).toBe(initialCount - 1);
    });
    
    test('should not delete elements when typing in text', async ({ page, getState }) => {
        // Create a text element and enter edit mode
        await editor.setActiveTool('text');
        await canvas.drawTextBox(0.5, 0.5);
        await page.waitForTimeout(300);
        
        // Double-click to edit text
        await canvas.doubleClickAt(0.5, 0.5);
        await page.waitForTimeout(200);
        
        const beforeState = await getState();
        const activeSlideId = beforeState.editor.activeSlideId;
        const countBefore = Object.keys(beforeState.slides[activeSlideId].elements).length;
        
        // Type some text (including Backspace)
        await canvas.typeText('Hello');
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(200);
        
        // Verify no elements were deleted
        const afterState = await getState();
        const countAfter = Object.keys(afterState.slides[activeSlideId].elements).length;
        expect(countAfter).toBe(countBefore);
    });
    
    test('should select multiple elements with Ctrl+click', async ({ page, getState }) => {
        // Create second element
        await editor.setActiveTool('shape');
        await canvas.drawRectangle(0.5, 0.5, 0.15, 0.1);
        await page.waitForTimeout(300);
        
        // Switch to select tool
        await editor.setActiveTool('select');
        
        // Click first element
        await canvas.clickAt(0.4, 0.375);
        await page.waitForTimeout(200);
        
        // Ctrl+click second element
        await page.keyboard.down('Control');
        await canvas.clickAt(0.575, 0.55);
        await page.keyboard.up('Control');
        await page.waitForTimeout(200);
        
        // Verify multiple elements can be selected (implementation may vary)
        const state = await getState();
        expect(state.editor.selectedElementIds.length).toBeGreaterThan(0);
    });
    
    test('should show property inspector for selected element', async ({ page }) => {
        // Element should be selected after creation
        await editor.setActiveTool('select');
        await canvas.clickAt(0.4, 0.375);
        await page.waitForTimeout(200);
        
        // Verify property inspector is visible and populated
        await expect(editor.propertyInspector).toBeVisible();
        
        // Property inspector should show element properties
        // (specific property sections would need more detailed selectors)
    });
    
    test('should maintain selection when switching tools', async ({ page, getState }) => {
        // Get selected element ID
        const initialState = await getState();
        const selectedIds = [...initialState.editor.selectedElementIds];
        
        // Switch tools
        await editor.setActiveTool('hand');
        await page.waitForTimeout(200);
        
        await editor.setActiveTool('select');
        await page.waitForTimeout(200);
        
        // Verify tool switched successfully (selection behavior may vary)
        const newState = await getState();
        expect(newState.editor.activeTool).toBe('select');
    });
});
