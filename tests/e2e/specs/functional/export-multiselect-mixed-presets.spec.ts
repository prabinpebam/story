import { test, expect, type Download } from '@playwright/test';
import { promises as fs } from 'fs';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';
import { dispatchAction, getState, waitForState } from '../../utils';

test.describe('Export: multi-selection mixed preset stacks', () => {
  test.describe.configure({ timeout: 90_000 });

  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);

    await editor.goto();
    await editor.waitForLoad();
  });

  test('EX03: Mixed preset stacks show Mixed UI and export uses merged presets', async ({ page }, testInfo) => {
    const before = await getState(page);
    const slideId = before.editor.activeSlideId;
    const idsBefore = new Set(Object.keys(before.slides?.[slideId!]?.elements || {}));
    const countBefore = idsBefore.size;

    // Create two rectangles
    await editor.setActiveTool('shape');
    await canvas.drawRectangle(0.10, 0.12, 0.14, 0.16);

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

    const afterCreate = await getState(page);
    const sid = afterCreate.editor.activeSlideId;
    const idsAfter = Object.keys(afterCreate.slides?.[sid!]?.elements || {});
    const createdIds = idsAfter.filter((id) => !idsBefore.has(id));
    expect(createdIds.length).toBe(2);

    // Seed mismatched preset stacks
    await dispatchAction(page, 'UPDATE_ELEMENT', {
      id: createdIds[0],
      exportPresets: [{ scale: '1x', format: 'svg', suffix: '' }],
    });

    await dispatchAction(page, 'UPDATE_ELEMENT', {
      id: createdIds[1],
      exportPresets: [
        { scale: '1x', format: 'png', suffix: '' },
        { scale: '2x', format: 'svg', suffix: '@2x' },
      ],
    });

    await dispatchAction(page, 'UPDATE_SELECTION', createdIds);

    const exportSection = page.locator('.pi-section', { hasText: 'Export' });
    await expect(exportSection).toBeVisible();

    // Expand section (commonly collapsed when presets are default)
    await exportSection.locator('.pi-section__header').click();

    // UI should be non-destructive and indicate Mixed
    await expect(exportSection.locator('.empty-state-row', { hasText: 'Mixed' })).toBeVisible();

    // Export should use merged effective presets across selection.
    const downloads: Download[] = [];
    page.on('download', (d) => downloads.push(d));

    const exportButton = exportSection.locator('button', { hasText: /^Export/i }).first();
    await exportButton.click();

    await expect.poll(() => downloads.length, { timeout: 30_000 }).toBe(3);

    // Save and smoke-check the SVG outputs exist and look like SVG.
    for (const d of downloads) {
      const suggested = d.suggestedFilename();
      const outPath = testInfo.outputPath(suggested);
      await d.saveAs(outPath);
      if (suggested.toLowerCase().endsWith('.svg')) {
        const svg = await fs.readFile(outPath, 'utf-8');
        expect(svg).toMatch(/^<svg[\s\S]*<\/svg>$/);
      }
    }
  });
});
