import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('UI: Boolean operands drill-in (Edit operands)', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    await expect(editor.propertyInspector).toBeVisible();
  });

  test('operands are hidden by default and revealed while editing operands', async ({ page, dispatchAction, getState }) => {
    // Seed two operands.
    await dispatchAction('ADD_ELEMENT', {
      id: 'rect-a',
      type: 'rect',
      x: 200,
      y: 200,
      width: 200,
      height: 140,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#ff0000', opacity: 100, visible: true }] }
    });

    await dispatchAction('ADD_ELEMENT', {
      id: 'rect-b',
      type: 'rect',
      x: 280,
      y: 240,
      width: 200,
      height: 140,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#00ff00', opacity: 100, visible: true }] }
    });

    // Create boolean.
    await dispatchAction('UPDATE_SELECTION', ['rect-a', 'rect-b']);
    await dispatchAction('CREATE_BOOLEAN_FROM_SELECTION', { ids: ['rect-a', 'rect-b'], operation: 'subtract' });

    const state = await getState();
    const booleanId = state?.editor?.selectedElementIds?.[0];
    expect(booleanId).toBeTruthy();

    // Scope to the active slide viewport (avoid matching slide thumbnails).
    const viewport = page.locator('#view-slide-1');

    // Operands should be hidden in the viewport by default.
    await expect(viewport.locator('#rect-a')).toHaveCSS('display', 'none');
    await expect(viewport.locator('#rect-b')).toHaveCSS('display', 'none');

    // Inspector exposes the drill-in toggle.
    const toggle = page.locator('[data-testid="boolean-edit-operands"]');
    await expect(toggle).toBeVisible();

    // Enter operand edit mode.
    await toggle.click();

    const stateAfterEnter = await getState();
    expect(stateAfterEnter?.editor?.deepEdit?.kind).toBe('boolean');
    expect(stateAfterEnter?.editor?.deepEdit?.elementId).toBe(booleanId);

    // Operands are revealed while editing.
    await expect(viewport.locator('#rect-a')).not.toHaveCSS('display', 'none');
    await expect(viewport.locator('#rect-b')).not.toHaveCSS('display', 'none');

    // Exit operand edit mode.
    await toggle.click();

    const stateAfterExit = await getState();
    expect(stateAfterExit?.editor?.deepEdit).toBeNull();

    // Operands are hidden again.
    await expect(viewport.locator('#rect-a')).toHaveCSS('display', 'none');
    await expect(viewport.locator('#rect-b')).toHaveCSS('display', 'none');
  });
});
