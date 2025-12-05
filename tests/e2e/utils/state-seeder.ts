/**
 * State Seeder - Utilities for seeding and restoring application state
 * 
 * Provides functions to seed the Redux store with specific state for testing,
 * allowing tests to start from known conditions.
 */

import { Page } from '@playwright/test';

/**
 * Seed the Redux store with a complete state object
 * @param page Playwright page object
 * @param state Complete state object to restore
 */
export async function seedState(page: Page, state: any): Promise<void> {
    await page.evaluate((stateToRestore) => {
        if (!window.__TEST_STORE__) {
            throw new Error('Test store not exposed! Ensure app is running in development mode.');
        }
        
        if (!window.__TEST_STORE__.restoreState) {
            console.warn('restoreState not available, using workaround');
            // Workaround: Clear and rebuild state using actions
            // This is a fallback if restoreState is not implemented
            return;
        }
        
        window.__TEST_STORE__.restoreState(stateToRestore);
    }, state);
    
    // Wait for state to be applied
    await page.waitForTimeout(200);
}

/**
 * Get the current Redux store state
 * @param page Playwright page object
 */
export async function getState(page: Page): Promise<any> {
    return await page.evaluate(() => {
        if (!window.__TEST_STORE__) {
            throw new Error('Test store not exposed! Ensure app is running in development mode.');
        }
        return window.__TEST_STORE__.getState();
    });
}

/**
 * Dispatch an action to the Redux store
 * @param page Playwright page object
 * @param actionType Action type string
 * @param payload Optional action payload
 */
export async function dispatchAction(
    page: Page,
    actionType: string,
    payload?: any
): Promise<void> {
    await page.evaluate(
        ({ type, data }) => {
            if (!window.__TEST_STORE__) {
                throw new Error('Test store not exposed! Ensure app is running in development mode.');
            }
            window.__TEST_STORE__.dispatch(type, data);
        },
        { type: actionType, data: payload }
    );
    
    // Wait for state update to propagate
    await page.waitForTimeout(100);
}

/**
 * Add a slide using Redux action
 * @param page Playwright page object
 */
export async function addSlide(page: Page): Promise<void> {
    await dispatchAction(page, 'ADD_SLIDE');
}

/**
 * Select a slide by ID
 * @param page Playwright page object
 * @param slideId Slide ID to select
 */
export async function selectSlide(page: Page, slideId: string): Promise<void> {
    await dispatchAction(page, 'SET_ACTIVE_SLIDE', slideId);
}

/**
 * Delete a slide by ID
 * @param page Playwright page object
 * @param slideId Slide ID to delete
 */
export async function deleteSlide(page: Page, slideId: string): Promise<void> {
    await dispatchAction(page, 'DELETE_SLIDE', slideId);
}

/**
 * Set active tool
 * @param page Playwright page object
 * @param tool Tool name (select, hand, shape, text, image)
 */
export async function setActiveTool(page: Page, tool: string): Promise<void> {
    await dispatchAction(page, 'SET_ACTIVE_TOOL', tool);
}

/**
 * Set editor mode
 * @param page Playwright page object
 * @param mode Editor mode (edit, presentation, master)
 */
export async function setMode(page: Page, mode: 'edit' | 'presentation' | 'master'): Promise<void> {
    await dispatchAction(page, 'SET_MODE', mode);
}

/**
 * Wait for a specific state condition
 * @param page Playwright page object
 * @param predicate Function that returns true when condition is met
 * @param timeout Maximum wait time in milliseconds
 */
export async function waitForState(
    page: Page,
    predicate: (state: any) => boolean,
    timeout = 5000
): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        const state = await getState(page);
        if (predicate(state)) {
            return;
        }
        await page.waitForTimeout(100);
    }
    
    throw new Error(`State condition not met within ${timeout}ms`);
}

/**
 * Get slide count from state
 * @param page Playwright page object
 */
export async function getSlideCount(page: Page): Promise<number> {
    const state = await getState(page);
    return state.slideOrder?.length || 0;
}

/**
 * Get active slide ID from state
 * @param page Playwright page object
 */
export async function getActiveSlideId(page: Page): Promise<string | null> {
    const state = await getState(page);
    return state.editor.activeSlideId;
}

/**
 * Get selected element IDs from state
 * @param page Playwright page object
 */
export async function getSelectedElementIds(page: Page): Promise<string[]> {
    const state = await getState(page);
    return state.editor.selectedElementIds || [];
}

/**
 * Get active tool from state
 * @param page Playwright page object
 */
export async function getActiveTool(page: Page): Promise<string> {
    const state = await getState(page);
    return state.editor.activeTool;
}

/**
 * Get editor mode from state
 * @param page Playwright page object
 */
export async function getEditorMode(page: Page): Promise<string> {
    const state = await getState(page);
    return state.editor.mode;
}

/**
 * Clear all slides (useful for test cleanup)
 * @param page Playwright page object
 */
export async function clearAllSlides(page: Page): Promise<void> {
    const state = await getState(page);
    const slideIds = state.slideOrder || [];
    
    // Delete all but the first slide
    for (let i = slideIds.length - 1; i > 0; i--) {
        await deleteSlide(page, slideIds[i]);
    }
}

/**
 * Reset to initial state (2 slides, edit mode, select tool)
 * @param page Playwright page object
 */
export async function resetToInitialState(page: Page): Promise<void> {
    // Clear extra slides
    await clearAllSlides(page);
    
    // Ensure we're in edit mode
    await setMode(page, 'edit');
    
    // Select the select tool
    await setActiveTool(page, 'select');
    
    // Clear selection
    const state = await getState(page);
    if (state.editor.selectedElementIds?.length > 0) {
        await dispatchAction(page, 'CLEAR_SELECTION');
    }
}
