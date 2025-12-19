import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';
import { dispatchAction, getSelectedElementIds, getState, waitForState } from '../../utils';

test.describe('Export: multi-selection output', () => {
  test.describe.configure({ timeout: 90_000 });

  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);

    await editor.goto();
    await editor.waitForLoad();
  });

  test('EX02: Multi-select export as SVG contains all selected elements', async ({ page }, testInfo) => {
    // Record existing element ids so we can deterministically identify the two rectangles we create.
    const before = await getState(page);
    const slideId = before.editor.activeSlideId;
    const idsBefore = new Set(Object.keys(before.slides?.[slideId!]?.elements || {}));
    const countBefore = idsBefore.size;

    // Create two rectangles
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.10, 0.12, 0.14, 0.16);

    // Some editors auto-return to Select after creating a shape; re-enable Shape tool to ensure a second rectangle is created.
    const mid = await getState(page);
    if (mid.editor?.activeTool !== 'shape') {
      await editor.setActiveTool('shape');
    }

    await canvas.drawRectangle(0.30, 0.12, 0.14, 0.16);

    await waitForState(
      page,
      (state) => {
        const sid = state.editor.activeSlideId;
        const count = Object.keys(state.slides?.[sid]?.elements || {}).length;
        return count >= countBefore + 2;
      },
      5_000
    );

    // Sanity: find the 2 newly created element ids
    const afterCreate = await getState(page);
    const idsAfter = Object.keys(afterCreate.slides?.[afterCreate.editor.activeSlideId!]?.elements || {});
    const createdIds = idsAfter.filter((id) => !idsBefore.has(id));
    expect(createdIds.length).toBe(2);

    // Deterministically select exactly those two rectangles
    await dispatchAction(page, 'UPDATE_SELECTION', createdIds);

    const selectedIds = await getSelectedElementIds(page);
    expect(selectedIds).toEqual(createdIds);

    const exportSection = page.locator('.pi-section', { hasText: 'Export' });
    await expect(exportSection).toBeVisible();

    // Expand section (commonly collapsed when presets are default)
    await exportSection.locator('.pi-section__header').click();

    // Force presets to SVG via state to avoid dropdown flakiness (the dropdown menu is rendered into document.body).
    for (const id of createdIds) {
      await dispatchAction(page, 'UPDATE_ELEMENT', {
        id,
        exportPresets: [{ scale: '1x', format: 'svg', suffix: '' }]
      });
    }

    // Export and capture download
    // Note: the section header uses role="button" too, so target the actual <button>.
    const exportButton = exportSection.locator('button', { hasText: /^Export/i }).first();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportButton.click()
    ]);

    const suggested = download.suggestedFilename();
    expect(suggested.toLowerCase()).toMatch(/selection.*\.svg$/);

    const outPath = testInfo.outputPath(suggested);
    await download.saveAs(outPath);

    const svg = await fs.readFile(outPath, 'utf-8');
    expect(svg).toMatch(/^<svg[\s\S]*<\/svg>$/);

    // For simple rectangles, the SVG exporter emits one <rect> per element.
    const rectCount = (svg.match(/<rect\b/g) || []).length;
    expect(rectCount).toBe(2);
  });
});
