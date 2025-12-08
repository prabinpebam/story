import { test, expect } from '@playwright/test';

test.describe('System Initialization', () => {
    test.beforeEach(async ({ page }) => {
        // Clear localStorage to simulate a fresh/incognito session
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
    });

    test('INIT01: Fresh Load Theme Consistency', async ({ page }) => {
        // Simulate Light Mode OS preference
        await page.emulateMedia({ colorScheme: 'light' });
        
        // 1. Load the app (fresh)
        await page.goto('/');
        // await page.waitForSelector('.app-loaded', { state: 'attached' }); // Wait for boot screen removal
        await page.waitForLoadState('networkidle'); // Wait for network idle instead

        // 2. Check Hydration State (HTML attributes)
        const htmlTheme = await page.getAttribute('html', 'data-theme');
        const bodyClass = await page.getAttribute('body', 'class');
        
        console.log('DEBUG INIT01: html[data-theme]:', htmlTheme);
        console.log('DEBUG INIT01: body[class]:', bodyClass);

        // 3. Check Computed Styles of Key Elements
        // If default is Dark, these should be dark.
        // If OS is Light, hydration might set Light.
        // We need to know what the EXPECTED behavior is.
        // Assuming: If OS is Light, App should be Light (per hydration logic).
        
        const isLightMode = htmlTheme === 'light';
        
        const bgApp = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-bg-app').trim());
        const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        
        console.log('DEBUG INIT01: --color-bg-app:', bgApp);
        console.log('DEBUG INIT01: body bg:', bodyBg);

        if (isLightMode) {
            // Expect Light Mode colors
            expect(bgApp).toBe('#E8E8E8'); // From hydration/variables
            // Check if body has the class
            expect(bodyClass).toContain('theme-light');
        } else {
            // Expect Dark Mode colors
            expect(bgApp).toBe('#1E1E1E');
            expect(bodyClass).not.toContain('theme-light');
        }
    });
});
