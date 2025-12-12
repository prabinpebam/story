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

        // Verify a slide was added
        expect(newOrder.length).toBe(initialOrder.length + 1);

        // Verify original slides still exist and preserve relative order
        const initialIndices = initialOrder.map(id => newOrder.indexOf(id));
        initialIndices.forEach(idx => expect(idx).toBeGreaterThanOrEqual(0));
        for (let i = 1; i < initialIndices.length; i++) {
            expect(initialIndices[i]).toBeGreaterThan(initialIndices[i - 1]);
        }
    });

    test.fixme('S02: Delete slide', async ({ page, getState }) => {
        // Ensure we have at least 2 slides
        await editor.addSlide();
        
        const initialState = await getState();
        const initialCount = initialState.slideOrder.length;
        
        // Select the second slide
        await editor.selectSlide(1);
        await page.waitForTimeout(200);
        
        // Delete it
        await page.keyboard.press('Delete');
        await page.waitForTimeout(200);
        
        // If delete didn't work, try Backspace
        const midState = await getState();
        if (midState.slideOrder.length === initialCount) {
             await page.keyboard.press('Backspace');
             await page.waitForTimeout(200);
        }
        
        // Verify count decreased
        const newState = await getState();
        expect(newState.slideOrder.length).toBe(initialCount - 1);
    });

    test('S03: Duplicate slide', async ({ page, getState }) => {
        const initialState = await getState();
        const initialCount = initialState.slideOrder.length;
        
        // Select first slide
        await editor.selectSlide(0);
        
        // Duplicate
        await page.keyboard.press('Control+d');
        
        // Verify count increased
        const newState = await getState();
        expect(newState.slideOrder.length).toBe(initialCount + 1);
    });
});
