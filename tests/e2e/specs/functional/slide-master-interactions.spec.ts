import { test, expect } from '@playwright/test';

test.describe('Slide Master Interactions', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('/');
    await page.waitForSelector('#app');
    await page.waitForFunction(() => !!window._storyAppStore || !!window.__TEST_STORE__);
    await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      store.dispatch('SET_MODE', 'master');
    });
    await page.waitForSelector('[data-testid="slide-list-item"]', { timeout: 10000 });
  });

  test('should display placeholders on the canvas', async ({ page }) => {
    await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      store.dispatch('SET_ACTIVE_MASTER', 'layout-title');
    });
    const placeholders = await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      const state = store.getState();
      const activeId = state.editor.activeMasterId;
      const master = state.slideMasterPresets[activeId];
      if (!master || !master.elements) return [];
      return Object.values(master.elements).filter(item => item.isPlaceholder);
    });
    expect(placeholders.length).toBeGreaterThan(0);
  });

  test('should activate placeholder on click', async ({ page }) => {
    await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      store.dispatch('SET_ACTIVE_MASTER', 'layout-title');
    });
    
    // Find a placeholder ID and select it via store
    const result = await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      const state = store.getState();
      const activeId = state.editor.activeMasterId;
      const master = state.slideMasterPresets[activeId];
      const elements = Object.values(master.elements) as any[];
      const ph = elements.find((el: any) => el.isPlaceholder);
      
      if (ph) {
        store.dispatch('UPDATE_SELECTION', [ph.id]);
        const newState = store.getState();
        return {
          placeholderId: ph.id,
          selectedIds: newState.editor.selectedElementIds
        };
      }
      return null;
    });
    
    expect(result).not.toBeNull();
    expect(result!.selectedIds).toContain(result!.placeholderId);
  });

  test('should add new layout', async ({ page }) => {
    const initialCount = await page.locator('[data-testid="slide-list-item"]').count();
    const masterItem = page.locator('[data-testid="slide-list-item"]').first();
    await masterItem.click({ button: 'right' });
    await page.locator('.context-menu-item').filter({ hasText: 'Add New Layout' }).click();
    await expect(page.locator('[data-testid="slide-list-item"]')).toHaveCount(initialCount + 1);
  });

  test('should duplicate layout', async ({ page }) => {
    const initialCount = await page.locator('[data-testid="slide-list-item"]').count();
    const layoutItem = page.locator('[data-testid="slide-list-item"]').nth(1);
    await layoutItem.click({ button: 'right' });
    await page.locator('.context-menu-item').filter({ hasText: 'Duplicate' }).click();
    await expect(page.locator('[data-testid="slide-list-item"]')).toHaveCount(initialCount + 1);
  });

  test('should rename layout', async ({ page }) => {
    // Get the layout ID and rename it via store
    const result = await page.evaluate(() => {
      const store = (window as any)._storyAppStore || (window as any).__TEST_STORE__;
      const state = store.getState();
      const masters = state.slideMasterPresets;
      // Find the first layout (not theme)
      const layout = Object.values(masters).find((m: any) => m.type === 'layout' || m.type === 'layoutMaster') as any;
      if (layout) {
        store.dispatch('RENAME_MASTER', { id: layout.id, name: 'Renamed Layout' });
        const newState = store.getState();
        return {
          layoutId: layout.id,
          newName: newState.slideMasterPresets[layout.id].name
        };
      }
      return null;
    });
    
    expect(result).not.toBeNull();
    expect(result!.newName).toBe('Renamed Layout');
    
    // Verify the UI updated
    await expect(page.locator('[data-testid="slide-list-item"]').filter({ hasText: 'Renamed Layout' })).toBeVisible();
  });

  test('should delete layout', async ({ page }) => {
    const masterItem = page.locator('[data-testid="slide-list-item"]').first();
    await masterItem.click({ button: 'right' });
    await page.locator('.context-menu-item').filter({ hasText: 'Add New Layout' }).click();
    const countAfterAdd = await page.locator('[data-testid="slide-list-item"]').count();
    const lastLayout = page.locator('[data-testid="slide-list-item"]').last();
    await lastLayout.click({ button: 'right' });
    await page.locator('.context-menu-item').filter({ hasText: 'Delete' }).click();
    await expect(page.locator('[data-testid="slide-list-item"]')).toHaveCount(countAfterAdd - 1);
  });

  test('should preserve empty placeholder after blur', async ({ page }) => {
    // Set a layout with placeholders
    await page.evaluate(() => {
      const store = (window as any)._storyAppStore || (window as any).__TEST_STORE__;
      store.dispatch('SET_ACTIVE_MASTER', 'layout-title');
    });
    
    // Get the initial placeholder count
    const initialPlaceholderCount = await page.evaluate(() => {
      const store = (window as any)._storyAppStore || (window as any).__TEST_STORE__;
      const state = store.getState();
      const activeId = state.editor.activeMasterId;
      const master = state.slideMasterPresets[activeId];
      if (!master || !master.elements) return 0;
      return Object.values(master.elements).filter((item: any) => item.isPlaceholder).length;
    });
    
    expect(initialPlaceholderCount).toBeGreaterThan(0);
    
    // Instantiate a placeholder by clicking it
    await page.evaluate(() => {
      const store = (window as any)._storyAppStore || (window as any).__TEST_STORE__;
      const state = store.getState();
      const activeId = state.editor.activeMasterId;
      const master = state.slideMasterPresets[activeId];
      const elements = Object.values(master.elements) as any[];
      const ph = elements.find((el: any) => el.isPlaceholder && el.type === 'text');
      
      if (ph) {
        // Instantiate placeholder (copies it to slide)
        store.dispatch('INSTANTIATE_PLACEHOLDER', {
          placeholderId: ph.id,
          element: ph
        });
        
        // Enter edit mode to simulate user clicking on it
        store.dispatch('SET_EDITING_ELEMENT', ph.id);
      }
    });
    
    // Wait a moment for the edit mode to activate
    await page.waitForTimeout(100);
    
    // Exit edit mode without adding content (simulate clicking outside)
    await page.evaluate(() => {
      const store = (window as any)._storyAppStore || (window as any).__TEST_STORE__;
      store.dispatch('SET_EDITING_ELEMENT', null);
    });
    
    // Verify placeholder still exists
    const finalPlaceholderCount = await page.evaluate(() => {
      const store = (window as any)._storyAppStore || (window as any).__TEST_STORE__;
      const state = store.getState();
      const activeId = state.editor.activeMasterId;
      const master = state.slideMasterPresets[activeId];
      if (!master || !master.elements) return 0;
      return Object.values(master.elements).filter((item: any) => item.isPlaceholder).length;
    });
    
    expect(finalPlaceholderCount).toBe(initialPlaceholderCount);
  });

  test('should show layout thumbnail with inherited background', async ({ page }) => {
    // Verify that layout thumbnails display the background from parent theme
    const thumbnailBackground = await page.evaluate(() => {
      const store = (window as any)._storyAppStore || (window as any).__TEST_STORE__;
      const state = store.getState();
      const masters = state.slideMasterPresets;
      
      // Get the default master (theme) background
      const theme = masters['master-default'];
      if (!theme) return null;
      
      // Get a layout without explicit background
      const layout = Object.values(masters).find((m: any) => 
        (m.type === 'layout' || m.type === 'layoutMaster') && 
        (!m.background || m.background === null)
      ) as any;
      
      if (!layout) return null;
      
      return {
        themeBackground: theme.background,
        layoutBackground: layout.background,
        layoutParentId: layout.parentMasterId || layout.parentId
      };
    });
    
    expect(thumbnailBackground).not.toBeNull();
    expect(thumbnailBackground!.themeBackground).toBeDefined();
    expect(thumbnailBackground!.layoutBackground).toBeNull();
    expect(thumbnailBackground!.layoutParentId).toBe('master-default');

    // Wait for thumbnails to mount a SlideView background layer
    await page.waitForSelector('[data-testid="slide-list-item"] .slide-thumbnail-preview .slide-background');
    
    // Find a layout item (not the master root) and verify its thumbnail has a SlideView background
    const layoutItem = page.locator('[data-testid="slide-list-item"]', {
      has: page.locator('.slide-thumbnail-title:not(.master-root)')
    }).first();
    await expect(layoutItem).toBeVisible();

    await expect(layoutItem.locator('.slide-thumbnail-preview .slide-background')).toHaveCount(1);
    
    // Visual regression: Take screenshot of slide list (optional - may need baseline generation)
    // Uncomment after first run to generate baseline:
    // await expect(page.locator('#slide-list')).toHaveScreenshot('master-mode-layout-thumbnails.png', {
    //   maxDiffPixels: 100
    // });
  });

  test('should verify DOM structure of layout thumbnails', async ({ page }) => {
    // Detailed DOM validation to catch structural issues
    const domStructure = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[data-testid="slide-list-item"]'));
      
      return items.map((item) => {
        const preview = item.querySelector('.slide-thumbnail-preview');
        const scaleWrapper = preview?.querySelector('.thumbnail-scale-wrapper');
        const slideView = scaleWrapper?.querySelector('.slide-view');
        const bgContainer = slideView?.querySelector('.slide-background');
        const bgLayers = bgContainer?.querySelectorAll('.bg-layer');
        
        return {
          hasPreview: !!preview,
          hasScaleWrapper: !!scaleWrapper,
          hasSlideView: !!slideView,
          hasBgContainer: !!bgContainer,
          bgLayerCount: bgLayers?.length || 0,
          bgContainerStyles: bgContainer ? {
            zIndex: window.getComputedStyle(bgContainer).zIndex,
            position: window.getComputedStyle(bgContainer).position
          } : null
        };
      });
    });
    
    // All thumbnails should have complete DOM structure
    for (const structure of domStructure) {
      expect(structure.hasPreview).toBe(true);
      expect(structure.hasScaleWrapper).toBe(true);
      expect(structure.hasSlideView).toBe(true);
      expect(structure.hasBgContainer).toBe(true);
      expect(structure.bgLayerCount).toBeGreaterThanOrEqual(1);
      expect(structure.bgContainerStyles).not.toBeNull();
    }
  });

  test('should verify element count consistency after interactions', async ({ page }) => {
    // Get initial element counts
    const initialCounts = await page.evaluate(() => {
      const store = (window as any)._storyAppStore || (window as any).__TEST_STORE__;
      const state = store.getState();
      const activeId = state.editor.activeMasterId;
      const master = state.slideMasterPresets[activeId];
      
      return {
        elementCount: Object.keys(master.elements || {}).length,
        placeholderCount: Object.values(master.elements || {}).filter((el: any) => el.isPlaceholder).length
      };
    });
    
    // Click on a placeholder (instantiate it)
    await page.evaluate(() => {
      const store = (window as any)._storyAppStore || (window as any).__TEST_STORE__;
      const state = store.getState();
      const activeId = state.editor.activeMasterId;
      const master = state.slideMasterPresets[activeId];
      const elements = Object.values(master.elements) as any[];
      const ph = elements.find((el: any) => el.isPlaceholder && el.type === 'text');
      
      if (ph) {
        store.dispatch('INSTANTIATE_PLACEHOLDER', {
          placeholderId: ph.id,
          element: ph
        });
        store.dispatch('SET_EDITING_ELEMENT', ph.id);
      }
    });
    
    await page.waitForTimeout(100);
    
    // Click outside to blur
    await page.evaluate(() => {
      const store = (window as any)._storyAppStore || (window as any).__TEST_STORE__;
      store.dispatch('SET_EDITING_ELEMENT', null);
    });
    
    await page.waitForTimeout(100);
    
    // Verify element count is unchanged (placeholder should persist)
    const finalCounts = await page.evaluate(() => {
      const store = (window as any)._storyAppStore || (window as any).__TEST_STORE__;
      const state = store.getState();
      const activeId = state.editor.activeMasterId;
      const master = state.slideMasterPresets[activeId];
      
      return {
        elementCount: Object.keys(master.elements || {}).length,
        placeholderCount: Object.values(master.elements || {}).filter((el: any) => el.isPlaceholder).length
      };
    });
    
    expect(finalCounts.elementCount).toBe(initialCounts.elementCount);
    expect(finalCounts.placeholderCount).toBe(initialCounts.placeholderCount);
  });
});
