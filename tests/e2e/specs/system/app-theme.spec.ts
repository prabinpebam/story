import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('App Theming & Design System', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('SYS01: Verify Default Dark Theme', async ({ page }) => {
    // 1. Verify Body Class (should NOT have theme-light)
    const body = page.locator('body');
    await expect(body).not.toHaveClass(/theme-light/);

    // 2. Verify Root Variables (Dark Mode Defaults)
    // We check the computed style of the body or a key element
    const appBg = await body.evaluate((el) => {
      return getComputedStyle(el).getPropertyValue('--color-bg-app').trim();
    });
    
    // Default dark bg is #1E1E1E
    expect(appBg.toUpperCase()).toBe('#1E1E1E');

    // 3. Verify Accent Color (Default Blue)
    const accentColor = await body.evaluate((el) => {
      return getComputedStyle(el).getPropertyValue('--color-accent').trim();
    });
    expect(accentColor.toUpperCase()).toBe('#18A0FB');
  });

  test('SYS02: Switch to Light Theme', async ({ page }) => {
    // 1. Open Settings Modal
    // Click App Menu Trigger
    await page.locator('.app-menu-trigger').click();
    // Click Settings
    await page.locator('.app-menu-dropdown .app-menu-item', { hasText: 'Settings...' }).click();

    // 2. Verify Modal Open
    const modal = page.getByTestId('settings-modal');
    await expect(modal).toBeVisible();

    // 3. Switch to Appearance Tab
    await modal.locator('.modal-nav-item', { hasText: 'Appearance' }).click();

    // 4. Switch to Light Mode
    // Find the dropdown for theme
    // Based on SettingsModal.js, it's a Dropdown component.
    // We might need to click the trigger and select the option.
    const themeDropdown = modal.locator('.dropdown-trigger').first(); // Assuming it's the first one
    await themeDropdown.click();
    
    const lightOption = page.locator('.dropdown-item', { hasText: 'Light' });
    await lightOption.click();

    // 4. Verify Body Class
    const body = page.locator('body');
    await expect(body).toHaveClass(/theme-light/);

    // 5. Verify CSS Variable Change
    const appBg = await body.evaluate((el) => {
      return getComputedStyle(el).getPropertyValue('--color-bg-app').trim();
    });
    // Light mode bg is #E8E8E8
    expect(appBg.toUpperCase()).toBe('#E8E8E8');
  });

  test('SYS03: Switch Accent Color', async ({ page }) => {
    // 1. Open Settings Modal
    await page.locator('.app-menu-trigger').click();
    await page.locator('.app-menu-dropdown .app-menu-item', { hasText: 'Settings...' }).click();

    // Switch to Appearance Tab
    const modal = page.getByTestId('settings-modal');
    await modal.locator('.modal-nav-item', { hasText: 'Appearance' }).click();

    // 2. Select Purple Theme
    // The cards have data-theme-id attribute? No, but they are in a grid.
    // SettingsModal.js: card.dataset.themeId = theme.id;
    // But wait, createThemeCard doesn't seem to set dataset in the snippet I read?
    // Let's check SettingsModal.js again or just click by text/color?
    // The snippet showed: card.onclick = () => this.setAccentTheme(theme.id, themesGrid);
    // It didn't explicitly show dataset setting in the snippet, but setAccentTheme reads it:
    // const cardThemeId = card.dataset.themeId;
    // So it MUST be set.
    
    const purpleCard = page.locator('.theme-card').nth(1); // 0 is Blue, 1 is Purple
    await purpleCard.click();

    // 3. Verify HTML Class
    const html = page.locator('html');
    await expect(html).toHaveClass(/theme-purple/);

    // 4. Verify Accent Color Variable
    const body = page.locator('body');
    const accentColor = await body.evaluate((el) => {
      return getComputedStyle(el).getPropertyValue('--color-accent').trim();
    });
    // Purple is #7C3AED
    expect(accentColor.toUpperCase()).toBe('#7C3AED');
  });

  test('SYS04: Verify Theme Persistence', async ({ page }) => {
    // 1. Set to Light Mode
    await page.locator('.app-menu-trigger').click();
    await page.locator('.app-menu-dropdown .app-menu-item', { hasText: 'Settings...' }).click();
    
    const modal = page.getByTestId('settings-modal');
    await modal.locator('.modal-nav-item', { hasText: 'Appearance' }).click();

    const themeDropdown = modal.locator('.dropdown-trigger').first();
    await themeDropdown.click();
    await page.locator('.dropdown-item', { hasText: 'Light' }).click();
    
    // 2. Reload Page
    await page.reload();
    await editor.waitForLoad();

    // 3. Verify still Light Mode
    const body = page.locator('body');
    await expect(body).toHaveClass(/theme-light/);
  });
});
