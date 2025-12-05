import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * Functional Tests - Slide Management
 * Tests for creating, selecting, and deleting slides
 */

test.describe('Slide Management', () => {
    let editor: EditorPage;
    
    test.beforeEach(async ({ page }) => {
        editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();
    });
    
    test('should add a new slide', async ({ getState }) => {
        // Get initial slide count
        const initialState = await getState();
        const initialCount = initialState.slideOrder.length;
        
        // Add a new slide
        await editor.addSlide();
        
        // Verify slide count increased
        const newState = await getState();
        expect(newState.slideOrder.length).toBe(initialCount + 1);
        
        // Verify new slide thumbnail is visible
        const newSlideIndex = initialCount;
        const newThumbnail = editor.getSlideThumbnail(newSlideIndex);
        await expect(newThumbnail).toBeVisible();
    });
    
    test('should select a slide when clicked', async ({ getState }) => {
        const state = await getState();
        const firstSlideId = state.slideOrder[0];
        const secondSlideId = state.slideOrder[1];
        
        // Verify first slide is initially active
        expect(state.editor.activeSlideId).toBe(firstSlideId);
        
        // Click second slide
        await editor.selectSlide(1);
        
        // Verify second slide is now active
        const newState = await getState();
        expect(newState.editor.activeSlideId).toBe(secondSlideId);
    });
    
    test('should display correct slide count in UI', async ({ page }) => {
        const initialCount = await editor.getSlideCount();
        expect(initialCount).toBeGreaterThanOrEqual(2);
        
        // Add a slide
        await editor.addSlide();
        
        // Verify UI reflects new count
        const newCount = await editor.getSlideCount();
        expect(newCount).toBe(initialCount + 1);
    });
    
    test('should maintain slide order', async ({ getState }) => {
        const initialState = await getState();
        const initialOrder = [...initialState.slideOrder];
        
        // Add a new slide
        await editor.addSlide();
        
        const newState = await getState();
        const newOrder = newState.slideOrder;
        
        // Verify original slides are still in same order
        expect(newOrder.slice(0, initialOrder.length)).toEqual(initialOrder);
        
        // Verify new slide is at the end
        expect(newOrder.length).toBe(initialOrder.length + 1);
    });
});
