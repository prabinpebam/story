import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('UI: Mask drill-in (Edit mask shape)', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    await expect(editor.propertyInspector).toBeVisible();
  });

  test('mask shape is hidden by default and revealed while editing mask shape', async ({ page, dispatchAction, getState }) => {
    // Seed a mask shape and content element.
    await dispatchAction('ADD_ELEMENT', {
      id: 'content',
      type: 'rect',
      x: 160,
      y: 160,
      width: 360,
      height: 260,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#00aaff', opacity: 100, visible: true }] }
    });

    // Mask shape must be topmost by stacking order.
    await dispatchAction('ADD_ELEMENT', {
      id: 'mask-shape',
      type: 'rect',
      x: 220,
      y: 200,
      width: 220,
      height: 160,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#000000', opacity: 100, visible: true }] }
    });

    // Create mask from selection.
    await dispatchAction('UPDATE_SELECTION', ['mask-shape', 'content']);
    await dispatchAction('CREATE_MASK_FROM_SELECTION', { ids: ['mask-shape', 'content'] });

    const state = await getState();
    const maskId = state?.editor?.selectedElementIds?.[0];
    expect(maskId).toBeTruthy();

    // Scope to active slide viewport (avoid matching slide thumbnails).
    const viewport = page.locator('#view-slide-1');

    // Mask shape should be hidden in viewport by default.
    await expect(viewport.locator('#mask-shape')).toHaveCSS('display', 'none');

    // Content remains visible and is clipped.
    await expect(viewport.locator('#content')).not.toHaveCSS('display', 'none');
    await expect(viewport.locator('#content')).toHaveAttribute('data-mask-count', '1');

    const toggle = page.locator('[data-testid="mask-edit-shape"]');
    await expect(toggle).toBeVisible();

    // Enter mask shape edit mode.
    await toggle.click();

    const stateAfterEnter = await getState();
    expect(stateAfterEnter?.editor?.deepEdit?.kind).toBe('mask');
    expect(stateAfterEnter?.editor?.deepEdit?.elementId).toBe(maskId);

    // Mask shape is revealed while editing.
    await expect(viewport.locator('#mask-shape')).not.toHaveCSS('display', 'none');

    // Exit.
    await toggle.click();

    const stateAfterExit = await getState();
    expect(stateAfterExit?.editor?.deepEdit).toBeNull();

    // Mask shape hidden again.
    await expect(viewport.locator('#mask-shape')).toHaveCSS('display', 'none');
  });
});
