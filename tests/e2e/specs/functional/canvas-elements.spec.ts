import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

/**
 * Functional Tests - Canvas Element Creation
 * Tests for creating shapes, text, and images on the canvas
 */

test.describe('Canvas Element Creation', () => {
    let editor: EditorPage;
    let canvas: CanvasHelper;
    
    test.beforeEach(async ({ page }) => {
        editor = new EditorPage(page);
        canvas = new CanvasHelper(page);
        await editor.goto();
        await editor.waitForLoad();
    });
    
    test('should create a shape on canvas', async ({ getState }) => {
        // Select shape tool
        await editor.setActiveTool('shape');
        
        // Verify tool is active
        const activeTool = await editor.getActiveTool();
        expect(activeTool).toBe('shape');
        
        // Get initial element count
        const initialState = await getState();
        const activeSlide = initialState.slides[initialState.editor.activeSlideId];
        const initialElementCount = Object.keys(activeSlide.elements || {}).length;
        
        // Draw a rectangle on canvas
        await canvas.drawRectangle(0.3, 0.3, 0.3, 0.2);
        
        // Wait for element to be created
        await editor.page.waitForTimeout(300);
        
        // Verify element was created
        const newState = await getState();
        const newSlide = newState.slides[newState.editor.activeSlideId];
        const newElementCount = Object.keys(newSlide.elements || {}).length;
        
        expect(newElementCount).toBe(initialElementCount + 1);
        
        // Verify the new element is a shape
        const elements = Object.values(newSlide.elements);
        const newElement = elements[elements.length - 1] as any;
        expect(newElement.type).toBe('rect');
    });
    
    test('should create a text element on canvas', async ({ getState }) => {
        // Select text tool
        await editor.setActiveTool('text');
        
        const activeTool = await editor.getActiveTool();
        expect(activeTool).toBe('text');
        
        // Get initial element count
        const initialState = await getState();
        const activeSlide = initialState.slides[initialState.editor.activeSlideId];
        const initialElementCount = Object.keys(activeSlide.elements || {}).length;
        
        // Click to create text box
        await canvas.drawTextBox(0.5, 0.4);
        
        // Wait for element to be created
        await editor.page.waitForTimeout(300);
        
        // Verify element was created
        const newState = await getState();
        const newSlide = newState.slides[newState.editor.activeSlideId];
        const newElementCount = Object.keys(newSlide.elements || {}).length;
        
        expect(newElementCount).toBe(initialElementCount + 1);
        
        // Verify the new element is text
        const elements = Object.values(newSlide.elements);
        const newElement = elements[elements.length - 1] as any;
        expect(newElement.type).toBe('text');
    });
    
    test('should create multiple elements on same slide', async ({ getState }) => {
        const initialState = await getState();
        const activeSlideId = initialState.editor.activeSlideId;
        const initialElementCount = Object.keys(initialState.slides[activeSlideId].elements || {}).length;
        
        // Create first shape
        await editor.setActiveTool('shape');
        await canvas.drawRectangle(0.2, 0.2, 0.2, 0.15);
        await editor.page.waitForTimeout(300);
        
        // Create second shape
        await editor.setActiveTool('shape');
        await canvas.drawRectangle(0.5, 0.2, 0.2, 0.15);
        await editor.page.waitForTimeout(300);
        
        // Create text element
        await editor.setActiveTool('text');
        await canvas.drawTextBox(0.35, 0.5);
        await editor.page.waitForTimeout(300);
        
        // Verify elements were created (at least 2 new elements)
        const newState = await getState();
        const newSlide = newState.slides[activeSlideId];
        const newElementCount = Object.keys(newSlide.elements || {}).length;
        
        expect(newElementCount).toBeGreaterThanOrEqual(initialElementCount + 2);
    });
    
    test('should select element after creation', async ({ getState }) => {
        // Create a shape
        await editor.setActiveTool('shape');
        await canvas.drawRectangle(0.3, 0.3, 0.3, 0.2);
        await editor.page.waitForTimeout(300);
        
        // Get the created element ID
        const state = await getState();
        const activeSlide = state.slides[state.editor.activeSlideId];
        const elements = Object.values(activeSlide.elements);
        const newElement = elements[elements.length - 1] as any;
        
        // Verify element is selected
        expect(state.editor.selectedElementIds).toContain(newElement.id);
    });
    
    test('should switch tools and create different element types', async ({ getState }) => {
        const initialState = await getState();
        const activeSlideId = initialState.editor.activeSlideId;
        
        // Create shape
        await editor.setActiveTool('shape');
        await canvas.drawRectangle(0.2, 0.3, 0.2, 0.15);
        await editor.page.waitForTimeout(300);
        
        const stateAfterShape = await getState();
        const slideAfterShape = stateAfterShape.slides[activeSlideId];
        const elementsAfterShape = Object.values(slideAfterShape.elements);
        const shapeElement = elementsAfterShape[elementsAfterShape.length - 1] as any;
        expect(shapeElement.type).toBe('rect');
        
        // Switch to text tool and create text
        await editor.setActiveTool('text');
        await canvas.drawTextBox(0.5, 0.3);
        await editor.page.waitForTimeout(300);
        
        const stateAfterText = await getState();
        const slideAfterText = stateAfterText.slides[activeSlideId];
        const elementsAfterText = Object.values(slideAfterText.elements);
        const textElement = elementsAfterText[elementsAfterText.length - 1] as any;
        expect(textElement.type).toBe('text');
        
        // Verify both elements exist
        expect(elementsAfterText.length).toBe(elementsAfterShape.length + 1);
    });
    
    test('should maintain elements when switching slides', async ({ getState }) => {
        // Create element on first slide
        await editor.setActiveTool('shape');
        await canvas.drawRectangle(0.3, 0.3, 0.2, 0.15);
        await editor.page.waitForTimeout(300);
        
        const state1 = await getState();
        const slide1Id = state1.editor.activeSlideId;
        const slide1Elements = Object.keys(state1.slides[slide1Id].elements || {}).length;
        
        // Switch to second slide
        await editor.selectSlide(1);
        await editor.page.waitForTimeout(200);
        
        // Create element on second slide
        await editor.setActiveTool('shape');
        await canvas.drawRectangle(0.5, 0.5, 0.2, 0.15);
        await editor.page.waitForTimeout(300);
        
        const state2 = await getState();
        const slide2Id = state2.editor.activeSlideId;
        const slide2Elements = Object.keys(state2.slides[slide2Id].elements || {}).length;
        
        // Switch back to first slide
        await editor.selectSlide(0);
        await editor.page.waitForTimeout(200);
        
        // Verify first slide still has its element
        const finalState = await getState();
        const finalSlide1Elements = Object.keys(finalState.slides[slide1Id].elements || {}).length;
        
        expect(finalSlide1Elements).toBe(slide1Elements);
        expect(slide2Elements).toBeGreaterThan(0);
    });
});
