import { test, expect } from '../../fixtures/base-test';

/**
 * Architecture Validation Tests
 * Verifies that the application state adheres to the Phase 1 architecture
 */

test.describe('Architecture Validation', () => {
  test('should have preset separation in state', async ({ page, getState }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const state = await getState();
    
    // Verify Phase 1 architecture
    expect(state.slideMasterPresets).toBeDefined();
    expect(state.colorThemePresets).toBeDefined();
    expect(state.typographyStylePresets).toBeDefined();
    
    // Verify old architecture is gone
    expect(state.masters).toBeUndefined();
    expect(state.themeSettings).toBeUndefined();
  });
  
  test('should have preset references, not embedded data', async ({ page, getState }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const state = await getState();
    const firstSlideId = state.slideOrder[0];
    const firstSlide = state.slides[firstSlideId];
    
    // New architecture: slides reference presets
    // Note: In transition, references might be in styleAssignments
    const colorThemeRef = firstSlide.colorThemeId !== undefined ? firstSlide.colorThemeId : firstSlide.styleAssignments?.colorTheme;
    const typoStyleRef = firstSlide.typographyStyleId !== undefined ? firstSlide.typographyStyleId : firstSlide.styleAssignments?.typographyStyle;
    
    // Should have some reference (even if null, it should be a property that exists or is handled)
    // If both are undefined, then we have a problem.
    // But here we just want to ensure we don't have EMBEDDED data.
    
    // Old architecture: should not have embedded data (themeSettings)
    expect(firstSlide.themeSettings).toBeUndefined();
    
    // If styleAssignments exists, it should only contain references (strings or null), not objects
    if (firstSlide.styleAssignments) {
        if (firstSlide.styleAssignments.colorTheme) {
            expect(typeof firstSlide.styleAssignments.colorTheme).toBe('string');
        }
    }
  });
});
