import { test, expect, Page } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

/**
 * Theme Consistency Audit
 * 
 * This test suite implements a robust strategy to scan the UI for color violations.
 * It ensures that when in Light Mode, no Dark Mode colors are visible, and vice versa.
 */

// Dark Mode Colors that should NOT appear in Light Mode
const DARK_MODE_FORBIDDEN_COLORS = [
    'rgb(30, 30, 30)', // #1E1E1E (App Bg)
    'rgb(37, 37, 38)', // #252526 (Canvas Bg)
    'rgb(45, 45, 45)', // #2D2D2D (Panel Bg)
    'rgb(51, 51, 51)', // #333333 (Elevated Bg)
    'rgb(56, 56, 56)', // #383838 (Input Bg)
];

async function auditElementColors(page: Page, contextName: string) {
    const violations = await page.evaluate((forbiddenColors) => {
        console.log('Body classes:', document.body.className);
        console.log('HTML classes:', document.documentElement.className);
        console.log('HTML data-theme:', document.documentElement.getAttribute('data-theme'));
        console.log('--color-bg-elevated on body:', getComputedStyle(document.body).getPropertyValue('--color-bg-elevated'));
        
        const fileInd = document.querySelector('.file-indicator');
        if (fileInd && fileInd.parentElement) {
            console.log('File Indicator Parent:', fileInd.parentElement.tagName, fileInd.parentElement.id);
            console.log('File Indicator --color-bg-elevated:', getComputedStyle(fileInd).getPropertyValue('--color-bg-elevated'));
            
            let parent: HTMLElement | null = fileInd.parentElement;
            while (parent) {
                console.log('Ancestor:', parent.tagName, parent.id, parent.className);
                parent = parent.parentElement;
            }
        }

        const allElements = document.querySelectorAll('*');
        const violations: { tag: string, class: string, color: string, property: string }[] = [];

        allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

            // Check Background Color
            const bg = style.backgroundColor;
            if (forbiddenColors.includes(bg)) {
                // Detailed debug for violations
                if (el.classList.contains('file-indicator') || el.classList.contains('action-btn') || el.classList.contains('layout-trigger-btn')) {
                    console.log(`VIOLATION DEBUG [${el.className}]:`);
                    console.log(`  - Computed Background: ${bg}`);
                    console.log(`  - --color-bg-elevated: ${style.getPropertyValue('--color-bg-elevated')}`);
                    console.log(`  - --color-bg-well: ${style.getPropertyValue('--color-bg-well')}`);
                    console.log(`  - --color-bg-panel: ${style.getPropertyValue('--color-bg-panel')}`);
                    console.log(`  - Matches [data-theme="light"] *: ${el.matches('[data-theme="light"] *')}`);
                    console.log(`  - Matches body.theme-light *: ${el.matches('body.theme-light *')}`);
                }

                violations.push({
                    tag: el.tagName.toLowerCase(),
                    class: el.className,
                    color: bg,
                    property: 'background-color'
                });
            }
        });

        return violations;
    }, DARK_MODE_FORBIDDEN_COLORS);

    if (violations.length > 0) {
        console.error(`[Theme Audit] Violations found in ${contextName}:`);
        console.table(violations);
    }

    return violations;
}

test.describe('Theme Consistency Audit', () => {
    let editor: EditorPage;
    let canvas: CanvasHelper;

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
        editor = new EditorPage(page);
        canvas = new CanvasHelper(page);
        await editor.goto();
        await editor.waitForLoad();
    });

    test('AUDIT01: Verify Blend Mode Menu Background in Light Mode', async ({ page }) => {
        // 1. Switch to Light Mode
        await page.locator('.app-menu-trigger').click();
        await page.locator('.app-menu-dropdown .app-menu-item', { hasText: 'Settings...' }).click();
        
        const modal = page.getByTestId('settings-modal');
        await modal.locator('.modal-nav-item', { hasText: 'Appearance' }).click();

        const themeDropdown = modal.locator('.dropdown-trigger').first();
        await themeDropdown.click();
        await page.locator('.dropdown-item', { hasText: 'Light' }).click();
        
        // Close modal
        await modal.locator('.close-btn').click();

        // 2. Create Object and Open Fill Flyout
        await editor.setActiveTool('shape');
        await canvas.drawRectangle(0.1, 0.1, 0.2, 0.2);
        
        const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
        
        // 3. Open Blend Mode Menu
        // The blend mode button is the one with the icon (usually 'normal' text or icon)
        // It has a title attribute starting with "Blend Mode:"
        const blendModeBtn = page.locator('button[title^="Blend Mode:"]').first();
        await blendModeBtn.click();

        // 4. Verify Menu Exists
        const menu = page.locator('.blend-mode-menu');
        await expect(menu).toBeVisible();

        // 5. Check Background Color
        const bgColor = await menu.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
        });

        console.log('Blend Mode Menu Background:', bgColor);

        // Should be white (rgb(255, 255, 255))
        // Should NOT be dark (rgb(51, 51, 51) or similar)
        expect(bgColor).toBe('rgb(255, 255, 255)');
    });

    test('AUDIT02: Full UI Scan in Light Mode', async ({ page }) => {
        // 1. Switch to Light Mode
        await page.locator('.app-menu-trigger').click();
        await page.locator('.app-menu-dropdown .app-menu-item', { hasText: 'Settings...' }).click();
        
        const modal = page.getByTestId('settings-modal');
        await modal.locator('.modal-nav-item', { hasText: 'Appearance' }).click();

        const themeDropdown = modal.locator('.dropdown-trigger').first();
        await themeDropdown.click();
        await page.locator('.dropdown-item', { hasText: 'Light' }).click();
        await modal.locator('.close-btn').click();

        // 2. Run Audit on Main Interface
        const violations = await auditElementColors(page, 'Main Interface');
        
        // We expect 0 violations
        // Note: Some elements might legitimately be dark (e.g., black text, specific dark UI elements like video player controls)
        // But "Backgrounds" of panels should not be.
        // The audit function checks exact matches with the forbidden list.
        
        expect(violations.length).toBe(0);
    });

    test('AUDIT03: Full UI Scan in Dark Mode', async ({ page }) => {
        // 1. Switch to Dark Mode (Default)
        await page.locator('.app-menu-trigger').click();
        await page.locator('.app-menu-dropdown .app-menu-item', { hasText: 'Settings...' }).click();
        
        const modal = page.getByTestId('settings-modal');
        await modal.locator('.modal-nav-item', { hasText: 'Appearance' }).click();

        const themeDropdown = modal.locator('.dropdown-trigger').first();
        await themeDropdown.click();
        await page.locator('.dropdown-item', { hasText: 'Dark' }).click();
        await modal.locator('.close-btn').click();

        // 2. Run Audit on Main Interface
        // Light Mode Colors that should NOT appear in Dark Mode
        const LIGHT_MODE_FORBIDDEN_COLORS = [
            // 'rgb(232, 232, 232)', // #E8E8E8 (App Bg) - Valid in Dark Mode as Text Primary
            'rgb(255, 255, 255)', // #FFFFFF (Canvas/Elevated/Input Bg)
            'rgb(245, 245, 245)', // #F5F5F5 (Panel Bg)
        ];

        const violations = await page.evaluate((forbiddenColors) => {
            const allElements = document.querySelectorAll('*');
            const violations: { tag: string, class: string, color: string, property: string }[] = [];

            allElements.forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

                // Check Background Color
                const bg = style.backgroundColor;
                if (forbiddenColors.includes(bg)) {
                    violations.push({
                        tag: el.tagName.toLowerCase(),
                        class: el.className,
                        color: bg,
                        property: 'background-color'
                    });
                }
            });

            return violations;
        }, LIGHT_MODE_FORBIDDEN_COLORS);

        if (violations.length > 0) {
            console.error(`[Theme Audit] Violations found in Dark Mode:`);
            console.table(violations);
        }

        expect(violations.length).toBe(0);
    });
});
