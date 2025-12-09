import { Page, Locator } from '@playwright/test';

/**
 * Canvas Helper for coordinate-based interactions
 * 
 * Provides utilities for interacting with the canvas using coordinates,
 * including drawing shapes, dragging elements, and creating selections.
 */
export class CanvasHelper {
    readonly page: Page;
    readonly canvas: Locator;
    readonly viewport: Locator;
    
    constructor(page: Page) {
        this.page = page;
        this.canvas = page.locator('#interaction-canvas');
        this.viewport = page.locator('#viewport');
    }
    
    /**
     * Get the canvas bounding box for coordinate calculations
     */
    async getCanvasBounds() {
        return await this.canvas.boundingBox();
    }
    
    /**
     * Convert normalized coordinates (0-1) to absolute canvas coordinates
     * @param x Normalized X coordinate (0 = left, 1 = right)
     * @param y Normalized Y coordinate (0 = top, 1 = bottom)
     */
    async normalizedToAbsolute(x: number, y: number): Promise<{ x: number; y: number }> {
        const bounds = await this.getCanvasBounds();
        if (!bounds) throw new Error('Canvas bounds not available');
        
        return {
            x: bounds.x + bounds.width * x,
            y: bounds.y + bounds.height * y,
        };
    }
    
    /**
     * Click at normalized canvas coordinates
     * @param x Normalized X (0-1)
     * @param y Normalized Y (0-1)
     */
    async clickAt(x: number, y: number) {
        const coords = await this.normalizedToAbsolute(x, y);
        await this.page.mouse.click(coords.x, coords.y);
        await this.page.waitForTimeout(100);
    }

    /**
     * Triple click at normalized canvas coordinates
     */
    async tripleClickAt(x: number, y: number) {
        const coords = await this.normalizedToAbsolute(x, y);
        await this.page.mouse.click(coords.x, coords.y, { clickCount: 3 });
        await this.page.waitForTimeout(100);
    }
    
    /**
     * Drag from one normalized position to another
     * @param fromX Start X (0-1)
     * @param fromY Start Y (0-1)
     * @param toX End X (0-1)
     * @param toY End Y (0-1)
     */
    async drag(fromX: number, fromY: number, toX: number, toY: number) {
        const from = await this.normalizedToAbsolute(fromX, fromY);
        const to = await this.normalizedToAbsolute(toX, toY);
        
        await this.page.mouse.move(from.x, from.y);
        await this.page.mouse.down();
        await this.page.waitForTimeout(50);
        
        // Smooth drag with multiple steps
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
            const progress = i / steps;
            const x = from.x + (to.x - from.x) * progress;
            const y = from.y + (to.y - from.y) * progress;
            await this.page.mouse.move(x, y);
            await this.page.waitForTimeout(20);
        }
        
        await this.page.mouse.up();
        await this.page.waitForTimeout(100);
    }
    
    /**
     * Draw a rectangle on the canvas
     * @param x Start X (0-1)
     * @param y Start Y (0-1)
     * @param width Width (0-1, relative to canvas)
     * @param height Height (0-1, relative to canvas)
     */
    async drawRectangle(x: number, y: number, width: number, height: number) {
        await this.drag(x, y, x + width, y + height);
    }
    
    /**
     * Draw a text box at specified position
     * @param x Click position X (0-1)
     * @param y Click position Y (0-1)
     */
    async drawTextBox(x: number, y: number) {
        await this.clickAt(x, y);
    }
    
    /**
     * Double-click to enter text editing mode
     * @param x Position X (0-1)
     * @param y Position Y (0-1)
     */
    async doubleClickAt(x: number, y: number) {
        const coords = await this.normalizedToAbsolute(x, y);
        await this.page.mouse.dblclick(coords.x, coords.y);
        await this.page.waitForTimeout(100);
    }
    
    /**
     * Type text (assumes text element is already focused)
     * @param text Text to type
     */
    async typeText(text: string) {
        await this.page.keyboard.type(text, { delay: 50 });
    }
    
    /**
     * Pan the canvas using hand tool
     * @param deltaX Horizontal pan distance (pixels)
     * @param deltaY Vertical pan distance (pixels)
     */
    async pan(deltaX: number, deltaY: number) {
        const bounds = await this.getCanvasBounds();
        if (!bounds) throw new Error('Canvas bounds not available');
        
        const startX = bounds.x + bounds.width / 2;
        const startY = bounds.y + bounds.height / 2;
        
        await this.page.mouse.move(startX, startY);
        await this.page.mouse.down();
        await this.page.waitForTimeout(50);
        await this.page.mouse.move(startX + deltaX, startY + deltaY, { steps: 10 });
        await this.page.mouse.up();
        await this.page.waitForTimeout(100);
    }
    
    /**
     * Zoom using mouse wheel
     * @param deltaY Wheel delta (negative = zoom in, positive = zoom out)
     */
    async zoom(deltaY: number) {
        const bounds = await this.getCanvasBounds();
        if (!bounds) throw new Error('Canvas bounds not available');
        
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        
        await this.page.mouse.move(centerX, centerY);
        await this.page.mouse.wheel(0, deltaY);
        await this.page.waitForTimeout(100);
    }
    
    /**
     * Get element at normalized coordinates from canvas
     * This requires the element to have been rendered
     */
    async getElementAt(x: number, y: number) {
        const coords = await this.normalizedToAbsolute(x, y);
        return await this.page.evaluate(
            ({ x, y }) => {
                const element = document.elementFromPoint(x, y);
                return element?.id || element?.className || null;
            },
            coords
        );
    }
    
    /**
     * Wait for canvas to be stable (no rendering activity)
     */
    async waitForStable(timeout = 500) {
        await this.page.waitForTimeout(timeout);
    }
    
    /**
     * Create a selection box (marquee selection)
     * @param x Start X (0-1)
     * @param y Start Y (0-1)
     * @param width Width (0-1)
     * @param height Height (0-1)
     */
    async selectArea(x: number, y: number, width: number, height: number) {
        await this.drag(x, y, x + width, y + height);
    }
    
    /**
     * Click and drag to move an element
     * @param fromX Current element center X (0-1)
     * @param fromY Current element center Y (0-1)
     * @param toX Target X (0-1)
     * @param toY Target Y (0-1)
     */
    async moveElement(fromX: number, fromY: number, toX: number, toY: number) {
        await this.drag(fromX, fromY, toX, toY);
    }
    
    /**
     * Resize element using corner drag
     * @param handleX Handle position X (0-1)
     * @param handleY Handle position Y (0-1)
     * @param toX New handle position X (0-1)
     * @param toY New handle position Y (0-1)
     */
    async resizeElement(handleX: number, handleY: number, toX: number, toY: number) {
        await this.drag(handleX, handleY, toX, toY);
    }
}
