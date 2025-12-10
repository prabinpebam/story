import { test, expect } from '@playwright/test';

test.describe('Master Slide Drag and Drop', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app
        await page.goto('http://localhost:5175');
        
        // Wait for app to be ready
        await page.waitForSelector('#slide-list');
        await page.waitForTimeout(500);
        
        // Switch to Master mode by directly dispatching the action
        await page.evaluate(() => {
            window.store.dispatch('SET_EDITOR_MODE', { mode: 'master' });
        });
        
        await page.waitForTimeout(500);
        
        // Verify we're in master mode by checking for data-master-id attributes
        const masterCount = await page.locator('[data-master-id]').count();
        expect(masterCount).toBeGreaterThan(0);
    });

    test('should show drop indicator on top half when hovering above midpoint', async ({ page }) => {
        const masters = page.locator('.slide-thumbnail[data-master-id]');
        const firstMaster = masters.nth(0);
        const secondMaster = masters.nth(1);
        
        // Get bounding boxes
        const firstBox = await firstMaster.boundingBox();
        const secondBox = await secondMaster.boundingBox();
        
        if (!firstBox || !secondBox) {
            test.skip();
            return;
        }
        
        // Start dragging first master
        await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
        await page.mouse.down();
        
        // Hover over the TOP half of second master (above midpoint)
        const targetY = secondBox.y + secondBox.height * 0.25; // 25% from top
        await page.mouse.move(secondBox.x + secondBox.width / 2, targetY, { steps: 10 });
        
        // Wait a bit for the indicator to appear
        await page.waitForTimeout(100);
        
        // Check if drop-before class is applied
        const hasDropBefore = await secondMaster.evaluate(el => el.classList.contains('drop-before'));
        expect(hasDropBefore).toBe(true);
        
        // Check that the pseudo-element exists with correct styling
        const dropIndicatorStyles = await secondMaster.evaluate(el => {
            const styles = window.getComputedStyle(el, '::before');
            return {
                content: styles.content,
                position: styles.position,
                background: styles.background,
                height: styles.height,
                top: styles.top,
                zIndex: styles.zIndex
            };
        });
        
        console.log('Drop indicator (before) styles:', dropIndicatorStyles);
        
        // Verify the indicator has content (not "none")
        expect(dropIndicatorStyles.content).not.toBe('none');
        expect(dropIndicatorStyles.position).toBe('absolute');
        expect(dropIndicatorStyles.height).toBe('3px');
        expect(dropIndicatorStyles.top).toBe('-5px');
        expect(dropIndicatorStyles.zIndex).toBe('1000');
        
        // Clean up
        await page.mouse.up();
    });

    test('should show drop indicator on bottom half when hovering below midpoint', async ({ page }) => {
        const masters = page.locator('.slide-thumbnail[data-master-id]');
        const firstMaster = masters.nth(0);
        const secondMaster = masters.nth(1);
        
        // Get bounding boxes
        const firstBox = await firstMaster.boundingBox();
        const secondBox = await secondMaster.boundingBox();
        
        if (!firstBox || !secondBox) {
            test.skip();
            return;
        }
        
        // Start dragging first master
        await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
        await page.mouse.down();
        
        // Hover over the BOTTOM half of second master (below midpoint)
        const targetY = secondBox.y + secondBox.height * 0.75; // 75% from top
        await page.mouse.move(secondBox.x + secondBox.width / 2, targetY, { steps: 10 });
        
        // Wait a bit for the indicator to appear
        await page.waitForTimeout(100);
        
        // Check if drop-after class is applied
        const hasDropAfter = await secondMaster.evaluate(el => el.classList.contains('drop-after'));
        expect(hasDropAfter).toBe(true);
        
        // Check that the pseudo-element exists with correct styling
        const dropIndicatorStyles = await secondMaster.evaluate(el => {
            const styles = window.getComputedStyle(el, '::after');
            return {
                content: styles.content,
                position: styles.position,
                background: styles.background,
                height: styles.height,
                bottom: styles.bottom,
                zIndex: styles.zIndex
            };
        });
        
        console.log('Drop indicator (after) styles:', dropIndicatorStyles);
        
        // Verify the indicator has content (not "none")
        expect(dropIndicatorStyles.content).not.toBe('none');
        expect(dropIndicatorStyles.position).toBe('absolute');
        expect(dropIndicatorStyles.height).toBe('3px');
        expect(dropIndicatorStyles.bottom).toBe('-5px');
        expect(dropIndicatorStyles.zIndex).toBe('1000');
        
        // Clean up
        await page.mouse.up();
    });

    test('should switch indicator position when crossing midpoint', async ({ page }) => {
        const masters = page.locator('.slide-thumbnail[data-master-id]');
        const firstMaster = masters.nth(0);
        const secondMaster = masters.nth(1);
        
        // Get bounding boxes
        const firstBox = await firstMaster.boundingBox();
        const secondBox = await secondMaster.boundingBox();
        
        if (!firstBox || !secondBox) {
            test.skip();
            return;
        }
        
        // Start dragging first master
        await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
        await page.mouse.down();
        
        // First hover over TOP half
        const topY = secondBox.y + secondBox.height * 0.25;
        await page.mouse.move(secondBox.x + secondBox.width / 2, topY, { steps: 10 });
        await page.waitForTimeout(100);
        
        let hasDropBefore = await secondMaster.evaluate(el => el.classList.contains('drop-before'));
        expect(hasDropBefore).toBe(true);
        
        // Then move to BOTTOM half
        const bottomY = secondBox.y + secondBox.height * 0.75;
        await page.mouse.move(secondBox.x + secondBox.width / 2, bottomY, { steps: 10 });
        await page.waitForTimeout(100);
        
        hasDropBefore = await secondMaster.evaluate(el => el.classList.contains('drop-before'));
        const hasDropAfter = await secondMaster.evaluate(el => el.classList.contains('drop-after'));
        
        expect(hasDropBefore).toBe(false);
        expect(hasDropAfter).toBe(true);
        
        // Clean up
        await page.mouse.up();
    });

    test('should clear indicator when leaving master', async ({ page }) => {
        const masters = page.locator('.slide-thumbnail[data-master-id]');
        const firstMaster = masters.nth(0);
        const secondMaster = masters.nth(1);
        
        // Get bounding boxes
        const firstBox = await firstMaster.boundingBox();
        const secondBox = await secondMaster.boundingBox();
        
        if (!firstBox || !secondBox) {
            test.skip();
            return;
        }
        
        // Start dragging first master
        await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
        await page.mouse.down();
        
        // Hover over second master
        await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2, { steps: 10 });
        await page.waitForTimeout(100);
        
        // Verify indicator is shown
        let hasIndicator = await secondMaster.evaluate(el => 
            el.classList.contains('drop-before') || el.classList.contains('drop-after')
        );
        expect(hasIndicator).toBe(true);
        
        // Move away from the master
        await page.mouse.move(secondBox.x - 100, secondBox.y, { steps: 10 });
        await page.waitForTimeout(100);
        
        // Verify indicator is cleared
        hasIndicator = await secondMaster.evaluate(el => 
            el.classList.contains('drop-before') || el.classList.contains('drop-after')
        );
        expect(hasIndicator).toBe(false);
        
        // Clean up
        await page.mouse.up();
    });

    test('should not show indicator on the dragged master itself', async ({ page }) => {
        const masters = page.locator('.slide-thumbnail[data-master-id]');
        const firstMaster = masters.nth(0);
        
        // Get bounding box
        const firstBox = await firstMaster.boundingBox();
        if (!firstBox) {
            test.skip();
            return;
        }
        
        // Start dragging first master
        await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(100);
        
        // Move slightly within the same master
        await page.mouse.move(firstBox.x + firstBox.width / 2 + 10, firstBox.y + firstBox.height / 2 + 10, { steps: 5 });
        await page.waitForTimeout(100);
        
        // Verify NO indicator is shown on the dragged item
        const hasIndicator = await firstMaster.evaluate(el => 
            el.classList.contains('drop-before') || el.classList.contains('drop-after')
        );
        expect(hasIndicator).toBe(false);
        
        // Clean up
        await page.mouse.up();
    });

    test('should successfully reorder masters after drop', async ({ page }) => {
        const masters = page.locator('.slide-thumbnail[data-master-id]');
        
        // Get initial order
        const initialOrder = await masters.evaluateAll(items => 
            items.map(item => item.getAttribute('data-master-id'))
        );
        
        console.log('Initial order:', initialOrder);
        
        if (initialOrder.length < 2) {
            test.skip();
            return;
        }
        
        // Get bounding boxes for first two masters
        const firstMaster = masters.nth(0);
        const secondMaster = masters.nth(1);
        const firstBox = await firstMaster.boundingBox();
        const secondBox = await secondMaster.boundingBox();
        
        if (!firstBox || !secondBox) {
            test.skip();
            return;
        }
        
        // Drag first master to after second master (bottom half of second)
        await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
        await page.mouse.down();
        
        const dropY = secondBox.y + secondBox.height * 0.75; // Bottom half
        await page.mouse.move(secondBox.x + secondBox.width / 2, dropY, { steps: 10 });
        await page.waitForTimeout(100);
        
        await page.mouse.up();
        
        // Wait for reorder to complete
        await page.waitForTimeout(300);
        
        // Get new order
        const newOrder = await page.locator('.slide-thumbnail[data-master-id]').evaluateAll(items => 
            items.map(item => item.getAttribute('data-master-id'))
        );
        
        console.log('New order:', newOrder);
        
        // Verify first and second masters swapped
        expect(newOrder[0]).toBe(initialOrder[1]);
        expect(newOrder[1]).toBe(initialOrder[0]);
    });

    test('should maintain order after page reload', async ({ page }) => {
        const masters = page.locator('.slide-thumbnail[data-master-id]');
        
        // Get initial order
        const initialOrder = await masters.evaluateAll(items => 
            items.map(item => item.getAttribute('data-master-id'))
        );
        
        if (initialOrder.length < 2) {
            test.skip();
            return;
        }
        
        // Perform a reorder
        const firstMaster = masters.nth(0);
        const secondMaster = masters.nth(1);
        const firstBox = await firstMaster.boundingBox();
        const secondBox = await secondMaster.boundingBox();
        
        if (!firstBox || !secondBox) {
            test.skip();
            return;
        }
        
        await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
        await page.mouse.down();
        const dropY = secondBox.y + secondBox.height * 0.75;
        await page.mouse.move(secondBox.x + secondBox.width / 2, dropY, { steps: 10 });
        await page.waitForTimeout(100);
        await page.mouse.up();
        await page.waitForTimeout(300);
        
        // Get order after reorder
        const reorderedList = await page.locator('.slide-thumbnail[data-master-id]').evaluateAll(items => 
            items.map(item => item.getAttribute('data-master-id'))
        );
        
        // Reload page
        await page.reload();
        await page.waitForSelector('#slide-list');
        await page.waitForTimeout(500);
        
        // Switch back to Master mode
        await page.evaluate(() => {
            window.store.dispatch('SET_EDITOR_MODE', { mode: 'master' });
        });
        await page.waitForTimeout(500);
        
        // Get order after reload
        const orderAfterReload = await page.locator('.slide-thumbnail[data-master-id]').evaluateAll(items => 
            items.map(item => item.getAttribute('data-master-id'))
        );
        
        // Verify order is maintained
        expect(orderAfterReload).toEqual(reorderedList);
    });
});
