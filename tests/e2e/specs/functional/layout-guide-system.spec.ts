import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * Layout Guide System (TDD)
 *
 * Validates:
 * - PI section visibility rules (Master mode only)
 * - Margin link/unlink behavior
 * - Overlay DOM rendering + viewport toggle
 * - Snapping options flyout toggles
 */

test.describe('Layout Guide System', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('shows Layout Guides section only in master mode (master root + layout)', async ({ page, getState }) => {
    const section = editor.propertyInspector.locator('[data-testid="layout-guide-section"]');

    const initial = await getState();
    expect(initial.editor.mode).toBe('edit');
    await expect(section).not.toBeVisible();

    await editor.editMaster();
    const inMaster = await getState();
    expect(inMaster.editor.mode).toBe('master');

    // Master root
    const masterRootItem = page.locator('[data-testid="slide-list-item"]').first();
    await masterRootItem.click();
    await expect(section).toBeVisible();

    // First layout under that master
    const layoutItem = page.locator('[data-testid="slide-list-item"]').nth(1);
    await layoutItem.click();
    await expect(section).toBeVisible();
  });

  test('hides Layout Guides section when an element is selected (master mode)', async ({ page }) => {
    await editor.editMaster();

    // Select a layout (so we have elements to click)
    const layoutItem = page.locator('[data-testid="slide-list-item"]').nth(1);
    await layoutItem.click();

    const section = editor.propertyInspector.locator('[data-testid="layout-guide-section"]');
    await expect(section).toBeVisible();

    // Select an element via the Layer Tree (updates store selection reliably)
    await page.locator('.layer-item').first().click();
    await expect(section).not.toBeVisible();
  });

  test('linked margins: changing one side updates all sides', async ({ page, getState }) => {
    await editor.editMaster();

    // Select a layout (so we are editing a layout master)
    const layoutItem = page.locator('[data-testid="slide-list-item"]').nth(1);
    await layoutItem.click();

    const section = editor.propertyInspector.locator('[data-testid="layout-guide-section"]');
    await expect(section).toBeVisible();

    // Ensure margins are linked
    const linkToggle = section.locator('[data-testid="layout-guide-margin-link-toggle"]');
    await expect(linkToggle).toBeVisible();

    // When linked, a single Margin input controls all sides
    const marginAllInput = section.locator('[data-testid="layout-guide-margin-all"] input');
    await marginAllInput.click();
    await marginAllInput.fill('120');
    await marginAllInput.press('Enter');

    const state = await getState();
    const activeMasterId = state.editor.activeMasterId;
    const activeMaster = state.slideMasterPresets[activeMasterId];
    expect(activeMaster).toBeTruthy();

    const lg = activeMaster.layoutGuide;
    expect(lg).toBeTruthy();
    expect(lg.margins.top).toBe(120);
    expect(lg.margins.right).toBe(120);
    expect(lg.margins.bottom).toBe(120);
    expect(lg.margins.left).toBe(120);
  });

  test('overlay renders columns and toggles via viewport control', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="btn-layout-guides"]');
    await expect(toggleBtn).toBeVisible();

    // Overlay is OFF by default
    const overlay = page.locator('[data-testid="layout-guide-overlay"]');
    await expect(overlay).not.toBeVisible();

    // Toggle ON
    await toggleBtn.click();
    await expect(overlay).toBeVisible();

    // Default columns should render at least one column element
    const columns = overlay.locator('[data-testid="layout-guide-column"]');
    await expect(columns.first()).toBeVisible();

    // Toggle visibility via viewport controls
    await toggleBtn.click();
    await expect(overlay).not.toBeVisible();

    await toggleBtn.click();
    await expect(overlay).toBeVisible();
  });

  test('margin overlay uses exact 5/5 dash pattern', async ({ page }) => {
    // Overlay is OFF by default; toggle ON for assertion.
    const toggleBtn = page.locator('[data-testid="btn-layout-guides"]');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    const overlay = page.locator('[data-testid="layout-guide-overlay"]');
    await expect(overlay).toBeVisible();

    const marginRect = page.locator('[data-testid="layout-guide-margin-rect"]');
    await expect(marginRect).toBeVisible();
    await expect(marginRect).toHaveAttribute('stroke-dasharray', '5 5');
  });

  test('snapping options flyout toggles store flags', async ({ page, getState }) => {
    const btn = page.locator('[data-testid="btn-snapping-options"]');
    await expect(btn).toBeVisible();

    await btn.click();

    const flyout = page.locator('[data-testid="snapping-options-flyout"]');
    await expect(flyout).toBeVisible();

    const toggles = [
      { testId: 'snap-to-object-toggle', key: 'snapToObject' },
      { testId: 'snap-to-slide-toggle', key: 'snapToSlide' },
      { testId: 'snap-to-columns-toggle', key: 'snapToColumns' },
    ] as const;

    for (const t of toggles) {
      const row = flyout.locator(`[data-testid="${t.testId}"]`);
      await expect(row).toBeVisible();

      const before = await getState();
      const beforeVal = !!(before.editor as any)[t.key];
      await row.click();
      const after = await getState();
      expect(!!(after.editor as any)[t.key]).toBe(!beforeVal);
    }
  });
});
