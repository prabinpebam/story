import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';
import { getSelectedElementIds } from '../../utils';

test.describe('Export: multi-selection preset edit scope', () => {
  test.describe.configure({ timeout: 90_000 });

  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);

    await editor.goto();
    await editor.waitForLoad();
  });

  test('EX01: Multi-select shows explicit preset edit scope hint', async ({ page }) => {
    // Create two rectangles
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.10, 0.12, 0.14, 0.16);
    await canvas.drawRectangle(0.30, 0.12, 0.14, 0.16);

    // Marquee select both rectangles
    await editor.setActiveTool('select');
    // Start from a known empty area to avoid drag-moving a shape.
    await canvas.selectArea(0.02, 0.02, 0.60, 0.45);

    // Assert selection is actually multi-select before checking UI.
    const selectedIds = await getSelectedElementIds(page);
    expect(selectedIds.length).toBeGreaterThanOrEqual(2);

    const exportSection = page.locator('.pi-section', { hasText: 'Export' });
    await expect(exportSection).toBeVisible();

    // Expand section (it is commonly collapsed when presets are default)
    await exportSection.locator('.pi-section__header').click();

    // DOM/UI validation: hint is visible and truthful
    const scopeHint = exportSection.locator('[data-testid="export-presets-scope-hint"]');
    await expect(scopeHint).toBeVisible();
    await expect(scopeHint).toHaveText(/applies to all selected/i);
  });
});
