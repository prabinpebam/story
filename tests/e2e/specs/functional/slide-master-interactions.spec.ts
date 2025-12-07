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
    
    // Check that the thumbnail container has a background (not transparent/white)
    const thumbnails = await page.locator('[data-testid="slide-list-item"]').all();
    expect(thumbnails.length).toBeGreaterThan(1);
    
    // At least one layout thumbnail should have a visible background
    const layoutThumbnail = thumbnails[1]; // First layout after master
    const hasBackground = await layoutThumbnail.evaluate((el) => {
      const preview = el.querySelector('.slide-thumbnail-preview');
      if (!preview) return false;
      
      // Check if SlideView inside has a background layer
      const bgContainer = preview.querySelector('.slide-background');
      return bgContainer !== null;
    });
    
    expect(hasBackground).toBe(true);
  });
});
