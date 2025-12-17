import { test, expect } from '../../fixtures/base-test';

/**
 * Smoke Tests - Critical functionality that must work for the app to be usable
 * These tests run first and gate all other test execution
 */

test.describe('Application Load', () => {
  test('should load the application without errors', async ({ page }) => {
    // Note: Console errors and page errors are now caught by the base fixture
    // and will cause the test to fail automatically.

    // Navigate to the app
    await page.goto('/');

    // Wait for the app to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page).toHaveTitle(/Story/i);
  });

  test('should initialize with correct Phase 1 architecture', async ({ page, getState }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const state = await getState();
    
    // Verify Phase 1 architecture presets exist
    expect(state.slideMasterPresets).toBeDefined();
    expect(state.colorThemePresets).toBeDefined();
    expect(state.typographyStylePresets).toBeDefined();
    
    // Verify deprecated properties are GONE
    expect(state.masters).toBeUndefined();
    expect(state.themeSettings).toBeUndefined();
    
    // Verify slides use references
    const firstSlideId = state.slideOrder[0];
    const firstSlide = state.slides[firstSlideId];
    
    expect(firstSlide.colorThemeId).toBeDefined();
    expect(firstSlide.typographyStyleId).toBeDefined();
    // Slides may omit styleAssignments when fully inherited; if present, it must only contain references.
    if (firstSlide.styleAssignments) {
      expect(firstSlide.styleAssignments).toHaveProperty('colorTheme');
    }
  });

  test('should render the main editor interface', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check for main UI components using actual DOM structure
    
    // Toolbar should be visible
    const toolbar = page.locator('#floating-toolbar');
    await expect(toolbar).toBeVisible({ timeout: 5000 });

    // Slide list/sidebar should be visible
    const sidebar = page.locator('#sidebar-left');
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    // Main canvas/editor area should be visible
    const canvas = page.locator('#canvas-container');
    await expect(canvas).toBeVisible({ timeout: 5000 });
  });

  test('should expose test store in development mode', async ({ page, getState }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify test store is exposed
    const storeExists = await page.evaluate(() => {
      return typeof window.__TEST_STORE__ !== 'undefined';
    });
    expect(storeExists).toBe(true);

    // Verify we can get state
    const state = await getState();
    expect(state).toBeDefined();
    expect(state).toHaveProperty('slides');
    expect(state).toHaveProperty('editor');
  });

  test('should have at least 2 initial slides', async ({ page, getState }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const state = await getState();
    
    // Based on your recent commit, initial state has 2 slides
    expect(state.slideOrder).toBeDefined();
    expect(state.slideOrder.length).toBeGreaterThanOrEqual(2);
    
    // Verify slides object exists
    expect(state.slides).toBeDefined();
    expect(Object.keys(state.slides).length).toBeGreaterThanOrEqual(2);
  });
});
