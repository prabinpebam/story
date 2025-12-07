import { test, expect } from '@playwright/test';

// Type declarations for test globals
declare global {
  interface Window {
    _storyAppStore: any;
    __TEST_STORE__: any;
    __PANEL_MANAGER__: any;
    __TEST_ERRORS__: any[];
  }
}

test.describe('Layout Picker', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('/');
    await page.waitForSelector('#app');
    await page.waitForFunction(() => !!window._storyAppStore || !!window.__TEST_STORE__);
    
    // Ensure we're in slide mode
    await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      store.dispatch('SET_MODE', 'slide');
    });
    
    await page.waitForTimeout(500);
  });

  test('should open layout picker flyout when clicking layout button', async ({ page }) => {
    // Open property inspector if not visible
    await page.evaluate(() => {
      const panelManager = window.__PANEL_MANAGER__;
      if (panelManager) {
        panelManager.show('propertyInspector');
      }
    });
    
    await page.waitForTimeout(300);
    
    // Find and click the layout trigger button
    const layoutButton = page.locator('.layout-trigger-btn');
    await expect(layoutButton).toBeVisible();
    await layoutButton.click();
    
    // Wait for flyout to appear
    await page.waitForSelector('.layout-flyout-content', { timeout: 5000 });
    
    // Verify flyout structure
    const flyout = page.locator('.layout-flyout-content');
    await expect(flyout).toBeVisible();
    
    const title = flyout.locator('.layout-flyout-title');
    await expect(title).toHaveText('Select Layout');
    
    const grid = flyout.locator('.layout-flyout-grid');
    await expect(grid).toBeVisible();
  });

  test('should display all available layouts in the picker', async ({ page }) => {
    // Open property inspector
    await page.evaluate(() => {
      const panelManager = window.__PANEL_MANAGER__;
      if (panelManager) panelManager.show('propertyInspector');
    });
    
    await page.waitForTimeout(300);
    
    // Get layout count from store
    const layoutCount = await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      const state = store.getState();
      const masters = Object.values(state.slideMasterPresets);
      return masters.filter(m => m.type === 'layout' || m.type === 'layoutMaster').length;
    });
    
    // Open layout picker
    await page.locator('.layout-trigger-btn').click();
    await page.waitForSelector('.layout-flyout-content');
    
    // Count layout thumbnails
    const thumbnails = page.locator('.layout-thumbnail');
    await expect(thumbnails).toHaveCount(layoutCount);
  });

  test('should mark current layout as selected', async ({ page }) => {
    await page.evaluate(() => {
      const panelManager = window.__PANEL_MANAGER__;
      if (panelManager) panelManager.show('propertyInspector');
    });
    
    await page.waitForTimeout(300);
    
    // Get current layout ID
    const currentLayoutId = await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      const state = store.getState();
      const activeSlideId = state.editor.activeSlideId;
      const slide = state.slides[activeSlideId];
      return slide?.layoutId;
    });
    
    // Open layout picker
    await page.locator('.layout-trigger-btn').click();
    await page.waitForSelector('.layout-flyout-content');
    
    // Verify selected layout
    const selectedThumbnail = page.locator('.layout-thumbnail.selected');
    await expect(selectedThumbnail).toHaveCount(1);
    
    const selectedId = await selectedThumbnail.getAttribute('data-layout-id');
    expect(selectedId).toBe(currentLayoutId);
  });

  test('should change layout when clicking a different thumbnail', async ({ page }) => {
    await page.evaluate(() => {
      const panelManager = window.__PANEL_MANAGER__;
      if (panelManager) panelManager.show('propertyInspector');
    });
    
    await page.waitForTimeout(300);
    
    // Get initial layout
    const initialLayout = await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      const state = store.getState();
      const slide = state.slides[state.editor.activeSlideId];
      return {
        id: slide.layoutId,
        name: state.slideMasterPresets[slide.layoutId]?.name
      };
    });
    
    // Open layout picker
    await page.locator('.layout-trigger-btn').click();
    await page.waitForSelector('.layout-flyout-content');
    
    // Find a non-selected thumbnail
    const nonSelectedThumbnail = page.locator('.layout-thumbnail').filter({ 
      hasNotText: initialLayout.name 
    }).first();
    
    const newLayoutId = await nonSelectedThumbnail.getAttribute('data-layout-id');
    await nonSelectedThumbnail.click();
    
    // Wait for update
    await page.waitForTimeout(300);
    
    // Verify layout changed in store
    const updatedLayout = await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      const state = store.getState();
      const slide = state.slides[state.editor.activeSlideId];
      return slide.layoutId;
    });
    
    expect(updatedLayout).toBe(newLayoutId);
    expect(updatedLayout).not.toBe(initialLayout.id);
  });

  test('should close flyout after selecting layout', async ({ page }) => {
    await page.evaluate(() => {
      const panelManager = window.__PANEL_MANAGER__;
      if (panelManager) panelManager.show('propertyInspector');
    });
    
    await page.waitForTimeout(300);
    
    // Open layout picker
    await page.locator('.layout-trigger-btn').click();
    await page.waitForSelector('.layout-flyout-content');
    
    // Click a thumbnail
    const thumbnail = page.locator('.layout-thumbnail').nth(1);
    await thumbnail.click();
    
    // Wait for flyout to close
    await page.waitForTimeout(500);
    
    // Verify flyout is hidden
    await expect(page.locator('.layout-flyout-content')).not.toBeVisible();
  });

  test('should show accurate layout thumbnails with backgrounds', async ({ page }) => {
    await page.evaluate(() => {
      const panelManager = window.__PANEL_MANAGER__;
      if (panelManager) panelManager.show('propertyInspector');
    });
    
    await page.waitForTimeout(300);
    
    // Open layout picker
    await page.locator('.layout-trigger-btn').click();
    await page.waitForSelector('.layout-flyout-content');
    
    // Get all thumbnails
    const thumbnails = page.locator('.layout-thumbnail');
    const count = await thumbnails.count();
    
    // Verify each thumbnail has a preview container
    for (let i = 0; i < count; i++) {
      const thumb = thumbnails.nth(i);
      const preview = thumb.locator('.layout-preview');
      await expect(preview).toBeVisible();
      
      // Verify ThumbnailRenderer created the thumbnail container
      const thumbContainer = preview.locator('.slide-thumbnail-preview');
      await expect(thumbContainer).toBeVisible();
    }
  });

  test('should preserve content when changing layouts', async ({ page }) => {
    // Add some content to a placeholder
    await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      const state = store.getState();
      const slideId = state.editor.activeSlideId;
      const slide = state.slides[slideId];
      const layout = state.slideMasterPresets[slide.layoutId];
      
      // Find first placeholder
      const placeholders = Object.values(layout.elements || {}).filter(el => el.isPlaceholder);
      if (placeholders.length > 0) {
        const ph = placeholders[0];
        // Add content to slide
        store.dispatch('UPDATE_SLIDE', {
          id: slideId,
          elements: {
            ...slide.elements,
            [ph.id]: {
              ...ph,
              content: 'Test Content',
              hasContent: true
            }
          },
          elementOrder: [...slide.elementOrder, ph.id]
        });
      }
    });
    
    await page.waitForTimeout(300);
    
    // Store the content
    const contentBefore = await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      const state = store.getState();
      const slide = state.slides[state.editor.activeSlideId];
      const elements = Object.values(slide.elements);
      return elements.map(el => ({ id: el.id, content: el.content, type: el.type }));
    });
    
    // Open property inspector
    await page.evaluate(() => {
      const panelManager = window.__PANEL_MANAGER__;
      if (panelManager) panelManager.show('propertyInspector');
    });
    
    // Change layout
    await page.locator('.layout-trigger-btn').click();
    await page.waitForSelector('.layout-flyout-content');
    await page.locator('.layout-thumbnail').nth(1).click();
    await page.waitForTimeout(500);
    
    // Check content after
    const contentAfter = await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      const state = store.getState();
      const slide = state.slides[state.editor.activeSlideId];
      return Object.values(slide.elements).filter(el => el.content);
    });
    
    // Content should still exist (either remapped or as overflow)
    expect(contentAfter.length).toBeGreaterThan(0);
    
    // At least one element should have the test content
    const hasTestContent = contentAfter.some(el => el.content === 'Test Content');
    expect(hasTestContent).toBe(true);
  });

  test('should update button label to reflect selected layout', async ({ page }) => {
    await page.evaluate(() => {
      const panelManager = window.__PANEL_MANAGER__;
      if (panelManager) panelManager.show('propertyInspector');
    });
    
    await page.waitForTimeout(300);
    
    const initialLabel = await page.locator('.layout-trigger-btn').textContent();
    
    // Open layout picker and select different layout
    await page.locator('.layout-trigger-btn').click();
    await page.waitForSelector('.layout-flyout-content');
    
    const targetThumbnail = page.locator('.layout-thumbnail').nth(1);
    const targetLabel = await targetThumbnail.locator('.layout-label').textContent();
    
    await targetThumbnail.click();
    await page.waitForTimeout(300);
    
    // Verify button label updated
    const updatedLabel = await page.locator('.layout-trigger-btn').textContent();
    expect(updatedLabel).toBe(targetLabel);
    expect(updatedLabel).not.toBe(initialLabel);
  });

  test('should show thumbnails with inherited theme colors', async ({ page }) => {
    // Set a distinct theme color
    await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      const state = store.getState();
      
      // Find theme master
      const themeMaster = Object.values(state.slideMasterPresets).find(m => m.type === 'themeMaster');
      if (themeMaster) {
        store.dispatch('UPDATE_MASTER', {
          id: themeMaster.id,
          background: { type: 'solid', value: '#3498db' }
        });
      }
    });
    
    await page.waitForTimeout(500);
    
    // Open property inspector and layout picker
    await page.evaluate(() => {
      const panelManager = window.__PANEL_MANAGER__;
      if (panelManager) panelManager.show('propertyInspector');
    });
    
    await page.waitForTimeout(300);
    await page.locator('.layout-trigger-btn').click();
    await page.waitForSelector('.layout-flyout-content');
    
    // Verify thumbnails show backgrounds
    const thumbnails = page.locator('.layout-thumbnail');
    const firstThumb = thumbnails.first();
    const preview = firstThumb.locator('.slide-thumbnail-preview');
    
    // Check that the thumbnail has a background style applied
    const hasBackground = await preview.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== '';
    });
    
    expect(hasBackground).toBe(true);
  });

  test('should handle rapid layout switching without errors', async ({ page }) => {
    await page.evaluate(() => {
      const panelManager = window.__PANEL_MANAGER__;
      if (panelManager) panelManager.show('propertyInspector');
    });
    
    await page.waitForTimeout(300);
    
    // Switch layouts multiple times rapidly
    for (let i = 0; i < 3; i++) {
      await page.locator('.layout-trigger-btn').click();
      await page.waitForSelector('.layout-flyout-content');
      
      const thumbnail = page.locator('.layout-thumbnail').nth((i % 2) + 1);
      await thumbnail.click();
      await page.waitForTimeout(200);
    }
    
    // Verify no errors occurred
    const errors = await page.evaluate(() => window.__TEST_ERRORS__ || []);
    expect(errors.length).toBe(0);
    
    // Verify app is still functional
    await page.locator('.layout-trigger-btn').click();
    await expect(page.locator('.layout-flyout-content')).toBeVisible();
  });

  test('should display layout labels correctly', async ({ page }) => {
    await page.evaluate(() => {
      const panelManager = window.__PANEL_MANAGER__;
      if (panelManager) panelManager.show('propertyInspector');
    });
    
    await page.waitForTimeout(300);
    
    // Get layout names from store
    const layoutNames = await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      const state = store.getState();
      return Object.values(state.slideMasterPresets)
        .filter(m => m.type === 'layout' || m.type === 'layoutMaster')
        .map(m => m.name);
    });
    
    // Open layout picker
    await page.locator('.layout-trigger-btn').click();
    await page.waitForSelector('.layout-flyout-content');
    
    // Verify each label
    for (const name of layoutNames) {
      const label = page.locator('.layout-label', { hasText: name });
      await expect(label).toBeVisible();
    }
  });

  test('should properly integrate with undo/redo system', async ({ page }) => {
    await page.evaluate(() => {
      const panelManager = window.__PANEL_MANAGER__;
      if (panelManager) panelManager.show('propertyInspector');
    });
    
    await page.waitForTimeout(300);
    
    // Get initial layout
    const initialLayoutId = await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      const state = store.getState();
      return state.slides[state.editor.activeSlideId].layoutId;
    });
    
    // Change layout
    await page.locator('.layout-trigger-btn').click();
    await page.waitForSelector('.layout-flyout-content');
    await page.locator('.layout-thumbnail').nth(1).click();
    await page.waitForTimeout(300);
    
    const newLayoutId = await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      const state = store.getState();
      return state.slides[state.editor.activeSlideId].layoutId;
    });
    
    expect(newLayoutId).not.toBe(initialLayoutId);
    
    // Undo
    await page.keyboard.press('Control+Z');
    await page.waitForTimeout(300);
    
    const undoneLayoutId = await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      const state = store.getState();
      return state.slides[state.editor.activeSlideId].layoutId;
    });
    
    expect(undoneLayoutId).toBe(initialLayoutId);
    
    // Redo
    await page.keyboard.press('Control+Y');
    await page.waitForTimeout(300);
    
    const redoneLayoutId = await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      const state = store.getState();
      return state.slides[state.editor.activeSlideId].layoutId;
    });
    
    expect(redoneLayoutId).toBe(newLayoutId);
  });
});
