import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('UI: Boolean inspector (revisit/edit operation)', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    await expect(editor.propertyInspector).toBeVisible();
  });

  test('selecting a boolean shows current operation and allows editing it', async ({ page, dispatchAction, getState }) => {
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

    // Create a boolean and keep it selected.
    await dispatchAction('UPDATE_SELECTION', ['rect-a', 'rect-b']);
    await dispatchAction('CREATE_BOOLEAN_FROM_SELECTION', { ids: ['rect-a', 'rect-b'], operation: 'subtract' });

    const state = await getState();
    const booleanId = state?.editor?.selectedElementIds?.[0];
    expect(booleanId).toBeTruthy();

    const dropdown = page.locator('[data-testid="boolean-operation"]');
    await expect(dropdown).toBeVisible();

    // Dropdown is a custom control; read its trigger text.
    const trigger = dropdown.locator('.dropdown-trigger');
    await expect(trigger).toHaveText('Subtract');

    // Change to Union.
    await dropdown.click();
    await page.locator('.dropdown-menu .dropdown-item', { hasText: 'Union' }).click();

    await expect(trigger).toHaveText('Union');

    const stateAfter = await getState();
    const activeSlideId = stateAfter?.editor?.activeSlideId;
    const el = stateAfter?.slides?.[activeSlideId]?.elements?.[booleanId];
    expect(el?.operation).toBe('union');
  });

  test('unresolvable boolean shows a non-blocking status warning row', async ({ page, dispatchAction }) => {
    await dispatchAction('ADD_ELEMENT', {
      id: 'bool-invalid',
      type: 'shape',
      shapeKind: 'boolean',
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      rotation: 0,
      operation: 'union',
      operands: ['missing-a', 'missing-b'],
      style: { fills: [{ type: 'solid', value: '#000000', opacity: 100, visible: true }] }
    });

    await dispatchAction('UPDATE_SELECTION', ['bool-invalid']);

    await expect(page.locator('[data-testid="boolean-operation"]')).toBeVisible();
    await expect(page.locator('[data-testid="boolean-status-warning"]')).toBeVisible();
  });
});
