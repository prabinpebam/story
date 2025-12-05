import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import { PresentationPage } from '../../pages/PresentationPage';

/**
 * Functional Tests - Presentation Mode
 * Tests for entering, navigating, and exiting presentation mode
 */

test.describe('Presentation Mode', () => {
    let editor: EditorPage;
    let presentation: PresentationPage;
    
    test.beforeEach(async ({ page }) => {
        editor = new EditorPage(page);
        presentation = new PresentationPage(page);
        await editor.goto();
        await editor.waitForLoad();
    });
    
    test('should enter presentation mode', async () => {
        // Start presentation
        await editor.startPresentation();
        
        // Verify mode changed to presentation
        const mode = await editor.getEditorMode();
        expect(mode).toBe('presentation');
        
        // Verify toolbar and sidebars are hidden
        await expect(editor.toolbar).not.toBeVisible();
        await expect(editor.sidebar).not.toBeVisible();
    });
    
    test('should navigate forward in presentation', async ({ getState }) => {
        await editor.startPresentation();
        
        const initialState = await getState();
        const initialIndex = initialState.presentation.currentSlideIndex;
        
        // Navigate to next slide
        await presentation.next();
        
        const newState = await getState();
        expect(newState.presentation.currentSlideIndex).toBe(initialIndex + 1);
    });
    
    test('should navigate backward in presentation', async ({ getState }) => {
        await editor.startPresentation();
        
        // Navigate forward first
        await presentation.next();
        
        const state = await getState();
        const currentIndex = state.presentation.currentSlideIndex;
        
        // Navigate backward
        await presentation.prev();
        
        const newState = await getState();
        expect(newState.presentation.currentSlideIndex).toBe(currentIndex - 1);
    });
    
    test('should exit presentation mode with HUD button', async () => {
        await editor.startPresentation();
        
        // Verify we're in presentation mode
        let mode = await editor.getEditorMode();
        expect(mode).toBe('presentation');
        
        // Exit using HUD
        await presentation.exit();
        
        // Verify we're back in edit mode
        mode = await editor.getEditorMode();
        expect(mode).toBe('edit');
        
        // Verify toolbar and sidebars are visible again
        await expect(editor.toolbar).toBeVisible();
        await expect(editor.sidebar).toBeVisible();
    });
    
    test('should exit presentation mode with keyboard', async () => {
        await editor.startPresentation();
        
        // Exit using Escape key
        await presentation.exitWithKeyboard();
        
        // Verify we're back in edit mode
        const mode = await editor.getEditorMode();
        expect(mode).toBe('edit');
    });
    
    test('should navigate with keyboard arrows', async ({ getState }) => {
        await editor.startPresentation();
        
        const initialState = await getState();
        const initialIndex = initialState.presentation.currentSlideIndex;
        
        // Navigate forward with keyboard
        await presentation.nextWithKeyboard();
        
        const newState = await getState();
        expect(newState.presentation.currentSlideIndex).toBe(initialIndex + 1);
        
        // Navigate backward with keyboard
        await presentation.prevWithKeyboard();
        
        const finalState = await getState();
        expect(finalState.presentation.currentSlideIndex).toBe(initialIndex);
    });
    
    test('should toggle black screen', async () => {
        await editor.startPresentation();
        
        // Verify black overlay is initially hidden
        await expect(presentation.blackOverlay).not.toBeVisible();
        
        // Toggle black screen on
        await presentation.toggleBlack();
        
        // Verify black overlay is visible
        await expect(presentation.blackOverlay).toBeVisible();
        
        // Toggle black screen off
        await presentation.toggleBlack();
        
        // Verify black overlay is hidden again
        await expect(presentation.blackOverlay).not.toBeVisible();
    });
    
    test('should open and close grid view', async () => {
        await editor.startPresentation();
        
        // Verify grid view is initially hidden
        await expect(presentation.gridView).not.toBeVisible();
        
        // Open grid view
        await presentation.toggleGrid();
        
        // Verify grid view is visible
        await expect(presentation.gridView).toBeVisible();
        
        // Close grid view
        await presentation.toggleGrid();
        
        // Verify grid view is hidden again
        await expect(presentation.gridView).not.toBeVisible();
    });
});
