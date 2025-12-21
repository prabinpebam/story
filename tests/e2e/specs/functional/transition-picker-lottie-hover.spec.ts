import { test, expect } from '@playwright/test';

// Type declarations for test globals
declare global {
  interface Window {
    _storyAppStore: any;
    __TEST_STORE__: any;
    __PANEL_MANAGER__: any;
  }
}

test.describe('Transition Picker Preview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');
    await page.waitForFunction(() => !!window._storyAppStore || !!window.__TEST_STORE__);

    // Ensure we're in slide mode
    await page.evaluate(() => {
      const store = window._storyAppStore || window.__TEST_STORE__;
      store.dispatch('SET_MODE', 'slide');
    });

    // Open property inspector
    await page.evaluate(() => {
      const panelManager = window.__PANEL_MANAGER__;
      if (panelManager) panelManager.show('propertyInspector');
    });

    await page.waitForTimeout(300);
  });

  test('should animate only on hover and reset on mouse out', async ({ page }) => {
    const trigger = page.locator('[data-testid="transition-picker-trigger"]');
    await expect(trigger).toBeVisible();
    await trigger.click();

    const flyout = page.locator('[data-testid="transition-picker-flyout"]');
    await expect(flyout).toBeVisible();

    // Validate Wipe specifically (it previously appeared broken).
    const transitionType = 'wipe';

    const previewSelector = `[data-testid="transition-picker-flyout"] .transition-preview[data-transition-type="${transitionType}"]`;
    const preview = page.locator(previewSelector);
    await expect(preview).toBeVisible();

    const newLayerSelector = `${previewSelector} .transition-preview__layer--new`;
    const newLayer = page.locator(newLayerSelector);
    await expect(newLayer).toHaveCount(1);

    const readTransform = async () => {
      return page.evaluate((sel) => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          transform: cs.transform,
          opacity: cs.opacity
        };
      }, newLayerSelector);
    };

    const initial = await readTransform();
    expect(initial).not.toBeNull();

    // Confirm it stays idle without hover.
    await page.waitForTimeout(200);
    const stillIdle = await readTransform();
    expect(stillIdle).toEqual(initial);

    // Hover should change the computed transform (wipe reveals incoming layer).
    await preview.hover();
    await page.waitForTimeout(250);
    const during = await readTransform();
    expect(during).not.toBeNull();
    expect(during!.transform).not.toBe(initial!.transform);

    // Leaving hover should reset back to initial transform.
    await flyout.locator('.layout-flyout-title').hover();
    await page.waitForTimeout(350);
    const reset = await readTransform();
    expect(reset).toEqual(initial);
  });
});
