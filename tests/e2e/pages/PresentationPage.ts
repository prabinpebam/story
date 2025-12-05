import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the presentation HUD (Heads-Up Display)
 * 
 * Provides methods for interacting with the presentation mode controls.
 */
export class PresentationPage {
    readonly page: Page;
    
    // HUD buttons
    readonly prevBtn: Locator;
    readonly nextBtn: Locator;
    readonly laserBtn: Locator;
    readonly gridBtn: Locator;
    readonly blackBtn: Locator;
    readonly exitBtn: Locator;
    
    // Presentation overlays
    readonly blackOverlay: Locator;
    readonly whiteOverlay: Locator;
    readonly gridView: Locator;
    readonly laserCanvas: Locator;
    
    constructor(page: Page) {
        this.page = page;
        
        // HUD buttons
        this.prevBtn = page.locator('[data-testid="hud-prev-btn"]');
        this.nextBtn = page.locator('[data-testid="hud-next-btn"]');
        this.laserBtn = page.locator('[data-testid="hud-laser-btn"]');
        this.gridBtn = page.locator('[data-testid="hud-grid-btn"]');
        this.blackBtn = page.locator('[data-testid="hud-black-btn"]');
        this.exitBtn = page.locator('[data-testid="hud-exit-btn"]');
        
        // Overlays
        this.blackOverlay = page.locator('#overlay-black');
        this.whiteOverlay = page.locator('#overlay-white');
        this.gridView = page.locator('#presentation-grid-view');
        this.laserCanvas = page.locator('#laser-canvas');
    }
    
    /**
     * Navigate to next slide/build
     */
    async next() {
        await this.nextBtn.click();
        await this.page.waitForTimeout(300); // Wait for animation
    }
    
    /**
     * Navigate to previous slide/build
     */
    async prev() {
        await this.prevBtn.click();
        await this.page.waitForTimeout(300);
    }
    
    /**
     * Toggle laser pointer
     */
    async toggleLaser() {
        await this.laserBtn.click();
    }
    
    /**
     * Toggle grid view (slide navigator)
     */
    async toggleGrid() {
        await this.gridBtn.click();
        await this.page.waitForTimeout(300);
    }
    
    /**
     * Toggle black screen
     */
    async toggleBlack() {
        await this.blackBtn.click();
    }
    
    /**
     * Exit presentation mode
     */
    async exit() {
        await this.exitBtn.click();
        await this.page.waitForTimeout(500); // Wait for mode transition
    }
    
    /**
     * Check if HUD is visible
     */
    async isHudVisible(): Promise<boolean> {
        const hud = this.page.locator('#presentation-hud');
        return await hud.isVisible();
    }
    
    /**
     * Check if black screen is active
     */
    async isBlackScreenActive(): Promise<boolean> {
        return await this.blackOverlay.isVisible();
    }
    
    /**
     * Check if grid view is open
     */
    async isGridViewOpen(): Promise<boolean> {
        return await this.gridView.isVisible();
    }
    
    /**
     * Use keyboard navigation
     */
    async pressKey(key: 'ArrowLeft' | 'ArrowRight' | 'Escape' | 'b' | 'g' | 'l') {
        await this.page.keyboard.press(key);
        await this.page.waitForTimeout(300);
    }
    
    /**
     * Navigate to next slide using keyboard
     */
    async nextWithKeyboard() {
        await this.pressKey('ArrowRight');
    }
    
    /**
     * Navigate to previous slide using keyboard
     */
    async prevWithKeyboard() {
        await this.pressKey('ArrowLeft');
    }
    
    /**
     * Exit with keyboard
     */
    async exitWithKeyboard() {
        await this.pressKey('Escape');
    }
}
