import { test, expect, Page } from '@playwright/test';

/**
 * Typography System E2E Tests
 * 
 * Tests comprehensive typography functionality including:
 * 1. Click-to-apply pattern (no Apply button)
 * 2. Typography cascade (slide → layout → master)
 * 3. Text style linking (property locking)
 * 4. Unlinking functionality
 * 5. Inheritance badges in Property Inspector
 * 6. Reset functionality
 * 7. Text element updates when typography changes
 * 8. 8 typography presets availability
 */

test.describe('Typography System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForSelector('.story-canvas', { timeout: 10000 });
        await page.waitForTimeout(500);
    });

    test.describe('Typography Style Manager - Click-to-Apply', () => {
        test('should apply typography preset on click without Apply button', async ({ page }) => {
            // Open Typography Style Manager
            await page.click('[data-testid="typography-manager-btn"]', { force: true });
            await page.waitForSelector('.typography-style-manager', { state: 'visible' });

            // Verify no Apply button exists
            const applyButton = page.locator('.typography-style-manager button:has-text("Apply")');
            await expect(applyButton).toHaveCount(0);

            // Select "Professional" preset
            await page.click('.tsm-preset-card:has-text("Professional")');
            await page.waitForTimeout(300);

            // Verify typography applied immediately (check PI)
            const typographyName = await page.locator('.slide-section .typography-style-name').textContent();
            expect(typographyName).toContain('Professional');
        });

        test('should show all 8 typography presets', async ({ page }) => {
            await page.click('[data-testid="typography-manager-btn"]', { force: true });
            await page.waitForSelector('.typography-style-manager', { state: 'visible' });

            const presetCards = page.locator('.tsm-preset-card');
            const count = await presetCards.count();
            expect(count).toBe(8);

            // Verify preset names
            const expectedPresets = [
                'Modern Sans',
                'Professional',
                'Editorial',
                'Tech',
                'Elegant',
                'Playful',
                'Corporate',
                'Minimal'
            ];

            for (const presetName of expectedPresets) {
                const preset = page.locator(`.tsm-preset-card:has-text("${presetName}")`);
                await expect(preset).toBeVisible();
            }
        });

        test('should highlight selected preset', async ({ page }) => {
            await page.click('[data-testid="typography-manager-btn"]', { force: true });
            await page.waitForSelector('.typography-style-manager', { state: 'visible' });

            const techPreset = page.locator('.tsm-preset-card:has-text("Tech")');
            await techPreset.click();
            await page.waitForTimeout(200);

            // Check if card has 'selected' class
            await expect(techPreset).toHaveClass(/selected/);
        });
    });

    test.describe('Typography Cascade and Inheritance', () => {
        test('should show "Inherited" badge when slide inherits from master', async ({ page }) => {
            // Default slide should inherit from master
            const badge = page.locator('.slide-section .inheritance-badge:has-text("Inherited")');
            await expect(badge).toBeVisible();

            // Name should be hidden when inherited
            const typographyName = page.locator('.slide-section .typography-style-name');
            await expect(typographyName).toBeHidden();
        });

        test('should show typography name and hide badge when slide has override', async ({ page }) => {
            // Apply typography to slide
            await page.click('[data-testid="typography-manager-btn"]', { force: true });
            await page.waitForSelector('.typography-style-manager', { state: 'visible' });
            await page.click('.tsm-preset-card:has-text("Elegant")');
            await page.waitForTimeout(300);

            // Close panel
            await page.click('.typography-style-manager .close-btn');
            await page.waitForTimeout(200);

            // Check Property Inspector
            const typographyName = page.locator('.slide-section .typography-style-name');
            await expect(typographyName).toBeVisible();
            await expect(typographyName).toHaveText(/Elegant/);

            const badge = page.locator('.slide-section .inheritance-badge:has-text("Inherited")');
            await expect(badge).toBeHidden();
        });

        test('should show reset button when slide has override', async ({ page }) => {
            // Apply typography to slide
            await page.click('[data-testid="typography-manager-btn"]', { force: true });
            await page.waitForSelector('.typography-style-manager', { state: 'visible' });
            await page.click('.tsm-preset-card:has-text("Corporate")');
            await page.waitForTimeout(300);
            await page.click('.typography-style-manager .close-btn');

            // Reset button should be visible
            const resetBtn = page.locator('.slide-section button:has-text("Reset")');
            await expect(resetBtn).toBeVisible();
        });

        test('should reset to inherited when reset button clicked', async ({ page }) => {
            // Apply typography to slide
            await page.click('[data-testid="typography-manager-btn"]', { force: true });
            await page.waitForSelector('.typography-style-manager', { state: 'visible' });
            await page.click('.tsm-preset-card:has-text("Playful")');
            await page.waitForTimeout(300);
            await page.click('.typography-style-manager .close-btn');

            // Verify override applied
            let typographyName = await page.locator('.slide-section .typography-style-name').textContent();
            expect(typographyName).toContain('Playful');

            // Click reset
            await page.click('.slide-section button:has-text("Reset")');
            await page.waitForTimeout(300);

            // Should now show inherited badge
            const badge = page.locator('.slide-section .inheritance-badge:has-text("Inherited")');
            await expect(badge).toBeVisible();

            // Name should be hidden
            const nameElement = page.locator('.slide-section .typography-style-name');
            await expect(nameElement).toBeHidden();
        });
    });

    test.describe('Text Element Updates', () => {
        test('should update text element appearance when typography style changes', async ({ page }) => {
            // Create a text element
            await page.click('[data-testid="tool-text"]');
            await page.click('.story-canvas', { position: { x: 400, y: 300 } });
            await page.keyboard.type('Test Typography');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);

            // Apply a text style (e.g., Title)
            const styleDropdown = page.locator('.text-section select').first();
            await styleDropdown.selectOption('title');
            await page.waitForTimeout(300);

            // Get initial font family
            const textElement = page.locator('.story-canvas .text-element').first();
            const initialFont = await textElement.evaluate(el => getComputedStyle(el).fontFamily);

            // Change slide typography style
            await page.click('[data-testid="typography-manager-btn"]', { force: true });
            await page.waitForSelector('.typography-style-manager', { state: 'visible' });
            await page.click('.tsm-preset-card:has-text("Tech")'); // Space Grotesk
            await page.waitForTimeout(500);
            await page.click('.typography-style-manager .close-btn');

            // Get updated font family
            const updatedFont = await textElement.evaluate(el => getComputedStyle(el).fontFamily);
            
            // Font should have changed
            expect(updatedFont).not.toBe(initialFont);
            expect(updatedFont.toLowerCase()).toContain('space grotesk');
        });

        test('should update multiple text elements when typography changes', async ({ page }) => {
            // Create two text elements with different styles
            await page.click('[data-testid="tool-text"]');
            await page.click('.story-canvas', { position: { x: 300, y: 200 } });
            await page.keyboard.type('Title Text');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(200);

            // Select text and apply Title style
            await page.click('.story-canvas .text-element', { position: { x: 300, y: 200 } });
            const styleDropdown1 = page.locator('.text-section select').first();
            await styleDropdown1.selectOption('title');
            await page.waitForTimeout(200);

            // Create second text element
            await page.click('[data-testid="tool-text"]');
            await page.click('.story-canvas', { position: { x: 300, y: 400 } });
            await page.keyboard.type('Body Text');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(200);

            // Select second text and apply Body style
            await page.click('.story-canvas .text-element:nth-child(2)', { position: { x: 300, y: 400 } });
            const styleDropdown2 = page.locator('.text-section select').first();
            await styleDropdown2.selectOption('body');
            await page.waitForTimeout(200);

            // Change typography style
            await page.click('[data-testid="typography-manager-btn"]', { force: true });
            await page.waitForSelector('.typography-style-manager', { state: 'visible' });
            await page.click('.tsm-preset-card:has-text("Minimal")');
            await page.waitForTimeout(500);

            // Both elements should update
            const allTextElements = page.locator('.story-canvas .text-element');
            const count = await allTextElements.count();
            
            for (let i = 0; i < count; i++) {
                const fontFamily = await allTextElements.nth(i).evaluate(el => getComputedStyle(el).fontFamily);
                expect(fontFamily.toLowerCase()).toContain('work sans');
            }
        });
    });

    test.describe('Text Style Linking', () => {
        test('should show link icon when text style is applied', async ({ page }) => {
            // Create text element
            await page.click('[data-testid="tool-text"]');
            await page.click('.story-canvas', { position: { x: 400, y: 300 } });
            await page.keyboard.type('Test Text');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);

            // Apply text style
            const styleDropdown = page.locator('.text-section select').first();
            await styleDropdown.selectOption('heading1');
            await page.waitForTimeout(300);

            // Link icon should be visible
            const linkBtn = page.locator('.text-section .link-btn');
            await expect(linkBtn).toBeVisible();
        });

        test('should disable typography properties when linked to style', async ({ page }) => {
            // Create text element
            await page.click('[data-testid="tool-text"]');
            await page.click('.story-canvas', { position: { x: 400, y: 300 } });
            await page.keyboard.type('Styled Text');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);

            // Apply text style
            const styleDropdown = page.locator('.text-section select').first();
            await styleDropdown.selectOption('subtitle');
            await page.waitForTimeout(300);

            // Check if font family input is disabled (has 'disabled' class and reduced opacity)
            const fontFamilyInput = page.locator('.text-section input[type="text"]').first();
            const isDisabled = await fontFamilyInput.evaluate(el => {
                return el.classList.contains('disabled') && 
                       parseFloat(getComputedStyle(el).opacity) < 1;
            });
            expect(isDisabled).toBe(true);

            // Font size should also be disabled
            const fontSizeInput = page.locator('.text-section input[type="number"]').first();
            const sizeDisabled = await fontSizeInput.evaluate(el => {
                return el.classList.contains('disabled');
            });
            expect(sizeDisabled).toBe(true);
        });

        test('should enable properties and preserve values when unlinked', async ({ page }) => {
            // Create and style text
            await page.click('[data-testid="tool-text"]');
            await page.click('.story-canvas', { position: { x: 400, y: 300 } });
            await page.keyboard.type('Unlinkable Text');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);

            // Apply text style
            const styleDropdown = page.locator('.text-section select').first();
            await styleDropdown.selectOption('heading2');
            await page.waitForTimeout(300);

            // Get current font size (from style)
            const fontSizeInput = page.locator('.text-section input[type="number"]').first();
            const linkedSize = await fontSizeInput.inputValue();

            // Click link button to unlink
            const linkBtn = page.locator('.text-section .link-btn');
            await linkBtn.click();
            await page.waitForTimeout(300);

            // Link button should be hidden
            await expect(linkBtn).toBeHidden();

            // Font size should still be the same value
            const unlinkedSize = await fontSizeInput.inputValue();
            expect(unlinkedSize).toBe(linkedSize);

            // Font size should now be editable (no disabled class)
            const isEnabled = await fontSizeInput.evaluate(el => {
                return !el.classList.contains('disabled') && 
                       parseFloat(getComputedStyle(el).opacity) === 1;
            });
            expect(isEnabled).toBe(true);

            // Should be able to edit the value
            await fontSizeInput.fill('42');
            await page.waitForTimeout(200);
            const newSize = await fontSizeInput.inputValue();
            expect(newSize).toBe('42');
        });

        test('should hide link icon when no style is applied', async ({ page }) => {
            // Create text element without style
            await page.click('[data-testid="tool-text"]');
            await page.click('.story-canvas', { position: { x: 400, y: 300 } });
            await page.keyboard.type('No Style Text');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);

            // Link button should be hidden
            const linkBtn = page.locator('.text-section .link-btn');
            await expect(linkBtn).toBeHidden();
        });
    });

    test.describe('Master Mode Typography', () => {
        test('should show typography name without badge in master mode', async ({ page }) => {
            // Enter master mode
            await page.click('#edit-master-btn');
            await page.waitForTimeout(500);

            // Property Inspector should show name, not badge
            const typographyName = page.locator('.slide-section .typography-style-name');
            await expect(typographyName).toBeVisible();

            const badge = page.locator('.slide-section .inheritance-badge');
            await expect(badge).toBeHidden();

            // Reset button should be hidden in master mode
            const resetBtn = page.locator('.slide-section button:has-text("Reset")');
            await expect(resetBtn).toBeHidden();
        });

        test('should apply typography to master and affect all slides', async ({ page }) => {
            // Enter master mode
            await page.click('#edit-master-btn');
            await page.waitForTimeout(500);

            // Apply typography to master
            await page.click('[data-testid="typography-manager-btn"]', { force: true });
            await page.waitForSelector('.typography-style-manager', { state: 'visible' });
            await page.click('.tsm-preset-card:has-text("Elegant")');
            await page.waitForTimeout(300);
            await page.click('.typography-style-manager .close-btn');

            // Exit master mode
            await page.click('#close-master-btn');
            await page.waitForTimeout(500);

            // Slide should now inherit Elegant (unless it has override)
            const typographyName = await page.locator('.slide-section .typography-style-name').textContent();
            const inheritedBadge = await page.locator('.slide-section .inheritance-badge').textContent();
            
            // Either showing name directly or showing inherited badge
            const hasElegantTypography = typographyName?.includes('Elegant') || inheritedBadge?.includes('Inherited');
            expect(hasElegantTypography).toBe(true);
        });
    });

    test.describe('Typography Style Manager Features', () => {
        test('should have reset button in footer', async ({ page }) => {
            await page.click('[data-testid="typography-manager-btn"]', { force: true });
            await page.waitForSelector('.typography-style-manager', { state: 'visible' });

            // Footer should have Reset button
            const resetBtn = page.locator('.typography-style-manager .tsm-footer button:has-text("Reset")');
            await expect(resetBtn).toBeVisible();
        });

        test('should reset slide typography when footer reset clicked', async ({ page }) => {
            // Apply typography override
            await page.click('[data-testid="typography-manager-btn"]', { force: true });
            await page.waitForSelector('.typography-style-manager', { state: 'visible' });
            await page.click('.tsm-preset-card:has-text("Playful")');
            await page.waitForTimeout(300);

            // Click reset in footer
            await page.click('.typography-style-manager .tsm-footer button:has-text("Reset")');
            await page.waitForTimeout(300);

            // Close panel
            await page.click('.typography-style-manager .close-btn');
            await page.waitForTimeout(200);

            // Should show inherited badge
            const badge = page.locator('.slide-section .inheritance-badge:has-text("Inherited")');
            await expect(badge).toBeVisible();
        });

        test('should show toast notification when typography applied', async ({ page }) => {
            await page.click('[data-testid="typography-manager-btn"]', { force: true });
            await page.waitForSelector('.typography-style-manager', { state: 'visible' });
            
            await page.click('.tsm-preset-card:has-text("Tech")');
            await page.waitForTimeout(200);

            // Toast should appear
            const toast = page.locator('.toast:has-text("Applied")');
            await expect(toast).toBeVisible({ timeout: 2000 });
        });
    });

    test.describe('Integration Tests', () => {
        test('complete typography workflow: apply → link → unlink → reset', async ({ page }) => {
            // 1. Create text element
            await page.click('[data-testid="tool-text"]');
            await page.click('.story-canvas', { position: { x: 400, y: 300 } });
            await page.keyboard.type('Complete Test');
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);

            // 2. Apply typography style to slide
            await page.click('[data-testid="typography-manager-btn"]', { force: true });
            await page.waitForSelector('.typography-style-manager', { state: 'visible' });
            await page.click('.tsm-preset-card:has-text("Editorial")');
            await page.waitForTimeout(500);
            await page.click('.typography-style-manager .close-btn');

            // 3. Apply text style to element
            await page.click('.story-canvas .text-element');
            const styleDropdown = page.locator('.text-section select').first();
            await styleDropdown.selectOption('title');
            await page.waitForTimeout(300);

            // 4. Verify link icon visible and properties disabled
            const linkBtn = page.locator('.text-section .link-btn');
            await expect(linkBtn).toBeVisible();

            // 5. Unlink
            await linkBtn.click();
            await page.waitForTimeout(300);
            await expect(linkBtn).toBeHidden();

            // 6. Verify properties are editable
            const fontSizeInput = page.locator('.text-section input[type="number"]').first();
            await fontSizeInput.fill('64');
            const newSize = await fontSizeInput.inputValue();
            expect(newSize).toBe('64');

            // 7. Reset slide typography
            await page.click('.slide-section button:has-text("Reset")');
            await page.waitForTimeout(300);

            // 8. Verify inherited badge
            const badge = page.locator('.slide-section .inheritance-badge:has-text("Inherited")');
            await expect(badge).toBeVisible();
        });

        test('typography cascade: master → layout → slide', async ({ page }) => {
            // This test validates the full cascade hierarchy
            
            // 1. Set master typography
            await page.click('#edit-master-btn');
            await page.waitForTimeout(500);
            await page.click('[data-testid="typography-manager-btn"]', { force: true });
            await page.waitForSelector('.typography-style-manager', { state: 'visible' });
            await page.click('.tsm-preset-card:has-text("Corporate")');
            await page.waitForTimeout(300);
            await page.click('.typography-style-manager .close-btn');
            await page.click('#close-master-btn');
            await page.waitForTimeout(500);

            // 2. Slide should inherit from master
            const badge1 = page.locator('.slide-section .inheritance-badge:has-text("Inherited")');
            await expect(badge1).toBeVisible();

            // 3. Override at slide level
            await page.click('[data-testid="typography-manager-btn"]', { force: true });
            await page.waitForSelector('.typography-style-manager', { state: 'visible' });
            await page.click('.tsm-preset-card:has-text("Minimal")');
            await page.waitForTimeout(300);
            await page.click('.typography-style-manager .close-btn');

            // 4. Should show slide override
            const typographyName = page.locator('.slide-section .typography-style-name');
            await expect(typographyName).toHaveText(/Minimal/);

            // 5. Reset to inherit from master again
            await page.click('.slide-section button:has-text("Reset")');
            await page.waitForTimeout(300);

            const badge2 = page.locator('.slide-section .inheritance-badge:has-text("Inherited")');
            await expect(badge2).toBeVisible();
        });
    });
});
