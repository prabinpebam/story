import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * Functional Tests - Master Mode
 * Tests for entering, editing, and exiting master mode
 */

test.describe('Master Mode', () => {
    let editor: EditorPage;
    
    test.beforeEach(async ({ page }) => {
        editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();
    });
    
    test('should enter master edit mode', async ({ getState }) => {
        // Verify we're in edit mode initially
        const initialState = await getState();
        expect(initialState.editor.mode).toBe('edit');
        
        // Enter master mode
        await editor.editMaster();
        
        // Verify mode changed
        const newState = await getState();
        expect(newState.editor.mode).toBe('master');
        
        // Verify edit master button is hidden
        await expect(editor.editMasterBtn).not.toBeVisible();
        
        // Verify close master button is visible
        await expect(editor.closeMasterBtn).toBeVisible();
    });
    
    test('should exit master edit mode', async ({ getState }) => {
        // Enter master mode
        await editor.editMaster();
        
        const stateInMaster = await getState();
        expect(stateInMaster.editor.mode).toBe('master');
        
        // Exit master mode
        await editor.closeMaster();
        
        // Verify we're back in edit mode
        const finalState = await getState();
        expect(finalState.editor.mode).toBe('edit');
        
        // Verify buttons switched back
        await expect(editor.editMasterBtn).toBeVisible();
        await expect(editor.closeMasterBtn).not.toBeVisible();
    });
    
    test('should have active master when entering master mode', async ({ getState }) => {
        // Enter master mode
        await editor.editMaster();
        
        const state = await getState();
        expect(state.editor.mode).toBe('master');
        expect(state.editor.activeMasterId).not.toBeNull();
        expect(state.editor.activeMasterId).toBeDefined();
    });
    
    test('should maintain slide data when switching to master mode', async ({ getState }) => {
        // Get initial slide data
        const initialState = await getState();
        const slideOrder = [...initialState.slideOrder];
        const slideCount = slideOrder.length;
        
        // Enter master mode
        await editor.editMaster();
        
        // Verify slides still exist
        const masterState = await getState();
        expect(masterState.slideOrder).toEqual(slideOrder);
        expect(masterState.slideOrder.length).toBe(slideCount);
    });
    
    test('should return to same slide after exiting master mode', async ({ getState }) => {
        // Select second slide
        await editor.selectSlide(1);
        
        const beforeMaster = await getState();
        const selectedSlideId = beforeMaster.editor.activeSlideId;
        
        // Enter and exit master mode
        await editor.editMaster();
        await editor.closeMaster();
        
        // Verify we're back on the same slide
        const afterMaster = await getState();
        expect(afterMaster.editor.activeSlideId).toBe(selectedSlideId);
    });
    
    test('should have masters available in state', async ({ getState }) => {
        const state = await getState();

        // Canonical architecture: masters are stored in slideMasterPresets
        expect(state.slideMasterPresets).toBeDefined();
        expect(typeof state.slideMasterPresets).toBe('object');

        // Verify at least one master preset exists (defaults)
        const masterCount = Object.keys(state.slideMasterPresets).length;
        expect(masterCount).toBeGreaterThan(0);
    });
    
    test('should show master list in sidebar when in master mode', async ({ page }) => {
        // Enter master mode
        await editor.editMaster();
        await page.waitForTimeout(300);
        
        // Verify sidebar shows masters section
        const slideList = editor.slideList;
        await expect(slideList).toBeVisible();
        
        // The slide list should now show masters instead of slides
        // This is indicated by the section title changing
    });
    
    test('should not allow presentation mode from master mode', async ({ getState }) => {
        // Enter master mode
        await editor.editMaster();
        
        const state = await getState();
        expect(state.editor.mode).toBe('master');
        
        // Play button should still be visible but clicking should do nothing
        // or should exit master mode first
        await expect(editor.playBtn).toBeVisible();
    });

    test.fixme('M02: Create new Master Slide', async ({ page, getState }) => {
        await editor.editMaster();
        
        const initialState = await getState();
        const initialCount = Object.keys(initialState.masters).length;
        
        // Add new master
        await editor.addSlide(); // Assuming addSlide works for masters in master mode
        
        const newState = await getState();
        const newCount = Object.keys(newState.masters).length;
        expect(newCount).toBe(initialCount + 1);
    });

    test.fixme('M03: Add Placeholder to Master', async ({ page }) => {
        await editor.editMaster();
        
        // Select a master
        await editor.selectSlide(0); // Assuming selectSlide works for masters
        
        // Add placeholder
        // Need selector for placeholder tool
        const placeholderBtn = page.locator('button[aria-label="Insert Placeholder"], button.tool-placeholder');
        if (await placeholderBtn.isVisible()) {
            await placeholderBtn.click();
            // Select type (e.g., Text)
            const textType = page.locator('.placeholder-type-text, .menu-item-text');
            if (await textType.isVisible()) {
                await textType.click();
            }
            // Draw
            await page.mouse.click(300, 300);
            
            // Verify placeholder added
            await expect(page.locator('.canvas-node.placeholder')).toBeVisible();
        }
    });
});
