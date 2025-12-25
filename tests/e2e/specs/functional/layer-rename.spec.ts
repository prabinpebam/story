import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

/**
 * Layer rename UX (true DOM validation):
 * - Create an element via real canvas interactions
 * - Right-click the layer row to open the context menu
 * - Click Rename, type a new name, press Enter
 * - Assert DOM label updates and store state persists
 */

test.describe('Layer rename', () => {
    test('renames a layer via context menu (persists + updates DOM)', async ({ page, getState }) => {
        const editor = new EditorPage(page);
        const canvas = new CanvasHelper(page);
        await editor.goto();
        await editor.waitForLoad();

        // Create a shape via true UI gestures.
        await editor.setActiveTool('shape');
        await canvas.drawRectangle(0.3, 0.3, 0.25, 0.18);
        await page.waitForTimeout(200);

        // Use the store only to find which element was created/selected (not to rename).
        const state = await getState();
        const selectedId = state.editor?.selectedElementIds?.[0];
        expect(typeof selectedId).toBe('string');

        const layerItem = page.locator(`#layer-tree .layer-item[data-id="${selectedId}"]`);
        await expect(layerItem).toBeVisible();

        // Open context menu on the layer row.
        await layerItem.click({ button: 'right' });

        // Click Rename.
        const menu = page.locator('.context-menu');
        await expect(menu).toBeVisible();
        await menu.locator('.context-menu-item', { hasText: 'Rename' }).click();

        // The layer name should become an input.
        const nameInput = layerItem.locator('.layer-item-name input.layer-item-input');
        await expect(nameInput).toBeVisible();

        const newName = 'Renamed Layer';
        await nameInput.fill(newName);
        await nameInput.press('Enter');

        // Assert the DOM label updates (input removed).
        await expect(layerItem.locator('.layer-item-name')).toHaveText(newName);

        // Assert the store persisted the rename.
        await expect.poll(async () => {
            const next = await getState();
            const slideId = next.editor.activeSlideId;
            return next.slides?.[slideId]?.elements?.[selectedId]?.name || '';
        }, { timeout: 2000 }).toBe(newName);
    });
});
