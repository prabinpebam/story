import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('UI: Layers duplicate-name conflict indicator (Morph)', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    await expect(page.locator('#layer-tree')).toBeVisible();
  });

  test('shows a warning when L0 morph match keys are duplicated, and clears when resolved', async ({ page, dispatchAction }) => {
    await dispatchAction('ADD_ELEMENT', { id: 'dup-a', type: 'rect', x: 80, y: 80, width: 140, height: 100, rotation: 0 });
    await dispatchAction('ADD_ELEMENT', { id: 'dup-b', type: 'rect', x: 260, y: 120, width: 140, height: 100, rotation: 0 });

    // Force both to share the same Morph match key (name).
    // Use an intentionally unique string so we don't accidentally collide with any default slide elements.
    const dupName = '__e2e__morph_name_conflict__0b17f4d7__';
    await dispatchAction('UPDATE_ELEMENT', { id: 'dup-a', name: dupName });
    await dispatchAction('UPDATE_ELEMENT', { id: 'dup-b', name: dupName });

    const warningTitle = 'Duplicate layer name (Morph will match top-most only)';

    const warnA = page.locator(`#layer-tree .layer-item[data-id="dup-a"] .layer-item-warning-icon[title="${warningTitle}"]`);
    const warnB = page.locator(`#layer-tree .layer-item[data-id="dup-b"] .layer-item-warning-icon[title="${warningTitle}"]`);

    await expect(warnA).toBeVisible();
    await expect(warnB).toBeVisible();

    // Resolve the conflict by renaming one layer.
    await dispatchAction('UPDATE_ELEMENT', { id: 'dup-b', name: 'Hero 2' });

    await expect(warnA).toHaveCount(0);
    await expect(warnB).toHaveCount(0);
  });
});
