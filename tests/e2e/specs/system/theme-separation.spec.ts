import { test, expect } from '@playwright/test';

test.describe('Theme Separation', () => {
    test('SEP01: App Theme Change Should Not Affect Slide Background', async ({ page }) => {
        // 1. Load App (Default Dark Mode)
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // 2. Check Initial Slide Background (Should be White by default for content)
        // Note: The user wants slide content to be independent. Default slides are usually white.
        const slideBg = page.locator('.slide-background .bg-layer').first();
        
        // Helper to get computed background
        const getBgColor = async () => {
            return await slideBg.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.backgroundColor;
            });
        };

        const initialBg = await getBgColor();
        console.log('DEBUG SEP01: Initial Slide Bg:', initialBg);
        
        // Slide content background is independent of app chrome; assert stability (not a hard-coded color).
        expect(initialBg).toMatch(/^rgb\(\d+, \d+, \d+\)$/);

        // 3. Switch App Theme to Light
        await page.locator('.app-menu-trigger').click();
        await page.locator('.app-menu-dropdown .app-menu-item', { hasText: 'Settings...' }).click();
        const modal = page.getByTestId('settings-modal');
        await modal.locator('.modal-nav-item', { hasText: 'Appearance' }).click();
        const themeDropdown = modal.locator('.dropdown-trigger').first();
        await themeDropdown.click();
        await page.locator('.dropdown-item', { hasText: 'Light' }).click();
        await modal.locator('.close-btn').click();

        // 4. Check Slide Background Again (Should be unchanged)
        const lightModeBg = await getBgColor();
        console.log('DEBUG SEP01: Light Mode Slide Bg:', lightModeBg);
        expect(lightModeBg).toBe(initialBg);

        // 5. Switch App Theme back to Dark
        await page.locator('.app-menu-trigger').click();
        await page.locator('.app-menu-dropdown .app-menu-item', { hasText: 'Settings...' }).click();
        await modal.locator('.modal-nav-item', { hasText: 'Appearance' }).click();
        await themeDropdown.click();
        await page.locator('.dropdown-item', { hasText: 'Dark' }).click();
        await modal.locator('.close-btn').click();

        // 6. Check Slide Background Again (Should be unchanged)
        const darkModeBg = await getBgColor();
        console.log('DEBUG SEP01: Dark Mode Slide Bg:', darkModeBg);
        expect(darkModeBg).toBe(initialBg);
    });
});
