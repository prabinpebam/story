import { test, expect } from '@playwright/test';

test.describe('Slide Drag and Drop', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate via baseURL
        await page.goto('/');
        
        // Wait for app to be ready
        await page.waitForSelector('[data-testid="slide-list"]');
        
        // Ensure we have at least 3 slides to test with
        const slides = await page.locator('.slide-thumbnail').count();
        if (slides < 3) {
            // Add more slides if needed
            for (let i = slides; i < 3; i++) {
                await page.click('[title="Add Slide"]');
                await page.waitForTimeout(100);
            }
        }
    });

    test('should show drop indicator on top half when hovering above midpoint', async ({ page }) => {
        const slides = page.locator('.slide-thumbnail');
        const firstSlide = slides.nth(0);
        const secondSlide = slides.nth(1);
        
        // Get bounding boxes
        const firstBox = await firstSlide.boundingBox();
        const secondBox = await secondSlide.boundingBox();
        
        expect(firstBox).not.toBeNull();
        expect(secondBox).not.toBeNull();
        
        // Start dragging first slide
        await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
        await page.mouse.down();
        
        // Hover over the TOP half of second slide (above midpoint)
        const targetY = secondBox.y + secondBox.height * 0.25; // 25% from top
        await page.mouse.move(secondBox.x + secondBox.width / 2, targetY, { steps: 10 });
        
        // Wait a bit for the indicator to appear
        await page.waitForTimeout(100);
        
        // Check if drop-before class is applied
        const hasDropBefore = await secondSlide.evaluate(el => el.classList.contains('drop-before'));
        expect(hasDropBefore).toBe(true);
        
        // Check that the pseudo-element exists with correct styling
        const dropIndicatorStyles = await secondSlide.evaluate(el => {
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
        const slides = page.locator('.slide-thumbnail');
        const firstSlide = slides.nth(0);
        const secondSlide = slides.nth(1);
        
        // Get bounding boxes
        const firstBox = await firstSlide.boundingBox();
        const secondBox = await secondSlide.boundingBox();
        
        expect(firstBox).not.toBeNull();
        expect(secondBox).not.toBeNull();
        
        // Start dragging first slide
        await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
        await page.mouse.down();
        
        // Hover over the BOTTOM half of second slide (below midpoint)
        const targetY = secondBox.y + secondBox.height * 0.75; // 75% from top
        await page.mouse.move(secondBox.x + secondBox.width / 2, targetY, { steps: 10 });
        
        // Wait a bit for the indicator to appear
        await page.waitForTimeout(100);
        
        // Check if drop-after class is applied
        const hasDropAfter = await secondSlide.evaluate(el => el.classList.contains('drop-after'));
        expect(hasDropAfter).toBe(true);
        
        // Check that the pseudo-element exists with correct styling
        const dropIndicatorStyles = await secondSlide.evaluate(el => {
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
        const slides = page.locator('.slide-thumbnail');
        const firstSlide = slides.nth(0);
        const secondSlide = slides.nth(1);
        
        // Get bounding boxes
        const firstBox = await firstSlide.boundingBox();
        const secondBox = await secondSlide.boundingBox();
        
        expect(firstBox).not.toBeNull();
        expect(secondBox).not.toBeNull();
        
        // Start dragging first slide
        await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
        await page.mouse.down();
        
        // First hover over TOP half
        const topY = secondBox.y + secondBox.height * 0.25;
        await page.mouse.move(secondBox.x + secondBox.width / 2, topY, { steps: 10 });
        await page.waitForTimeout(100);
        
        let hasDropBefore = await secondSlide.evaluate(el => el.classList.contains('drop-before'));
        expect(hasDropBefore).toBe(true);
        
        // Then move to BOTTOM half
        const bottomY = secondBox.y + secondBox.height * 0.75;
        await page.mouse.move(secondBox.x + secondBox.width / 2, bottomY, { steps: 10 });
        await page.waitForTimeout(100);
        
        hasDropBefore = await secondSlide.evaluate(el => el.classList.contains('drop-before'));
        const hasDropAfter = await secondSlide.evaluate(el => el.classList.contains('drop-after'));
        
        expect(hasDropBefore).toBe(false);
        expect(hasDropAfter).toBe(true);
        
        // Clean up
        await page.mouse.up();
    });

    test('should clear indicator when leaving slide', async ({ page }) => {
        const slides = page.locator('.slide-thumbnail');
        const firstSlide = slides.nth(0);
        const secondSlide = slides.nth(1);
        
        // Get bounding boxes
        const firstBox = await firstSlide.boundingBox();
        const secondBox = await secondSlide.boundingBox();
        
        expect(firstBox).not.toBeNull();
        expect(secondBox).not.toBeNull();
        
        // Start dragging first slide
        await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
        await page.mouse.down();
        
        // Hover over second slide
        await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2, { steps: 10 });
        await page.waitForTimeout(100);
        
        // Verify indicator is shown
        let hasIndicator = await secondSlide.evaluate(el => 
            el.classList.contains('drop-before') || el.classList.contains('drop-after')
        );
        expect(hasIndicator).toBe(true);
        
        // Move away from the slide
        await page.mouse.move(secondBox.x - 100, secondBox.y, { steps: 10 });
        await page.waitForTimeout(100);
        
        // Verify indicator is cleared
        hasIndicator = await secondSlide.evaluate(el => 
            el.classList.contains('drop-before') || el.classList.contains('drop-after')
        );
        expect(hasIndicator).toBe(false);
        
        // Clean up
        await page.mouse.up();
    });

    test('should not show indicator on the dragged slide itself', async ({ page }) => {
        const slides = page.locator('.slide-thumbnail');
        const firstSlide = slides.nth(0);
        
        // Get bounding box
        const firstBox = await firstSlide.boundingBox();
        expect(firstBox).not.toBeNull();
        
        // Start dragging first slide
        await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(100);
        
        // Move slightly within the same slide
        await page.mouse.move(firstBox.x + firstBox.width / 2 + 10, firstBox.y + firstBox.height / 2 + 10, { steps: 5 });
        await page.waitForTimeout(100);
        
        // Verify NO indicator is shown on the dragged item
        const hasIndicator = await firstSlide.evaluate(el => 
            el.classList.contains('drop-before') || el.classList.contains('drop-after')
        );
        expect(hasIndicator).toBe(false);
        
        // Clean up
        await page.mouse.up();
    });

    test('should successfully reorder slides after drop', async ({ page }) => {
        const slides = page.locator('.slide-thumbnail');
        
        // Get initial order
        const initialOrder = await page.evaluate(() => {
            const store = window.__TEST_STORE__ || window._storyAppStore;
            return store.getState().slideOrder.slice();
        });
        
        console.log('Initial order:', initialOrder);
        
        // Get bounding boxes for first two slides
        const firstSlide = slides.nth(0);
        const secondSlide = slides.nth(1);
        const firstBox = await firstSlide.boundingBox();
        const secondBox = await secondSlide.boundingBox();
        
        expect(firstBox).not.toBeNull();
        expect(secondBox).not.toBeNull();
        
        // Use Playwright dragTo to ensure HTML5 DnD dataTransfer is populated (required for REORDER_SLIDES)
        await firstSlide.dragTo(secondSlide, {
            targetPosition: {
                x: Math.floor(secondBox.width / 2),
                y: Math.floor(secondBox.height * 0.75)
            }
        });
        
        // Wait for reorder to complete
        await page.waitForTimeout(300);
        
        // Get new order
        const newOrder = await page.evaluate(() => {
            const store = window.__TEST_STORE__ || window._storyAppStore;
            return store.getState().slideOrder.slice();
        });
        
        console.log('New order:', newOrder);
        
        // Verify first and second slides swapped in state
        expect(newOrder[0]).toBe(initialOrder[1]);
        expect(newOrder[1]).toBe(initialOrder[0]);
    });
});
