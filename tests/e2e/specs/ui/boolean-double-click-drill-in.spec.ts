import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

async function dblClickElementCenter(page: any, elementId: string) {
  const center = await page.evaluate((id: string) => {
    const win = window as any;
    const app = win.app;
    const cm = app?.canvasManager;
    const store = win.__TEST_STORE__ || win._storyAppStore;
    const st = store?.getState?.();
    const slide = st?.slides?.[st?.editor?.activeSlideId];
    const el = slide?.elements?.[id];
    if (!cm || !el) return null;

    const rect = cm.container.getBoundingClientRect();
    const zoom = st.editor.zoom;
    const pan = st.editor.pan;

    const mouseX = (el.x + el.width / 2) * zoom + pan.x;
    const mouseY = (el.y + el.height / 2) * zoom + pan.y;

    return { x: rect.left + mouseX, y: rect.top + mouseY };
  }, elementId);

  expect(center).toBeTruthy();
  await page.mouse.dblclick(center.x, center.y);
  await page.waitForTimeout(100);
}

test.describe('UI: Boolean drill-in via double-click', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    await expect(editor.propertyInspector).toBeVisible();
  });

  test('double-click enters boolean operand edit', async ({ page, dispatchAction, getState }) => {
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

    await dispatchAction('UPDATE_SELECTION', ['rect-a', 'rect-b']);
    await dispatchAction('CREATE_BOOLEAN_FROM_SELECTION', { ids: ['rect-a', 'rect-b'], operation: 'intersect' });

    const state = await getState();
    const booleanId = state?.editor?.selectedElementIds?.[0];
    expect(booleanId).toBeTruthy();

    await dblClickElementCenter(page, booleanId);

    const entered = await getState();
    expect(entered?.editor?.deepEdit?.kind).toBe('boolean');
    expect(entered?.editor?.deepEdit?.elementId).toBe(booleanId);
    expect(entered?.editor?.deepEdit?.mode).toBe('operands');

    // Breadcrumb UI appears.
    await expect(page.locator('[data-testid="deep-edit-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="deep-edit-done"]')).toBeVisible();
  });

  test('nested double-click pushes and Done/Escape pop', async ({ page, dispatchAction, getState }) => {
    // Base operands.
    await dispatchAction('ADD_ELEMENT', {
      id: 'a',
      type: 'rect',
      x: 140,
      y: 200,
      width: 180,
      height: 140,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#ff0000', opacity: 100, visible: true }] }
    });
    await dispatchAction('ADD_ELEMENT', {
      id: 'b',
      type: 'rect',
      x: 220,
      y: 240,
      width: 180,
      height: 140,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#00ff00', opacity: 100, visible: true }] }
    });
    await dispatchAction('ADD_ELEMENT', {
      id: 'c',
      type: 'rect',
      x: 320,
      y: 220,
      width: 180,
      height: 140,
      rotation: 0,
      style: { fills: [{ type: 'solid', value: '#0000ff', opacity: 100, visible: true }] }
    });

    // Inner boolean = intersect(a,b)
    await dispatchAction('UPDATE_SELECTION', ['a', 'b']);
    await dispatchAction('CREATE_BOOLEAN_FROM_SELECTION', { ids: ['a', 'b'], operation: 'intersect' });
    const stateAfterInner = await getState();
    const innerId = stateAfterInner?.editor?.selectedElementIds?.[0];
    expect(innerId).toBeTruthy();

    // Outer boolean = union(inner, c)
    await dispatchAction('UPDATE_SELECTION', [innerId, 'c']);
    await dispatchAction('CREATE_BOOLEAN_FROM_SELECTION', { ids: [innerId, 'c'], operation: 'union' });
    const stateAfterOuter = await getState();
    const outerId = stateAfterOuter?.editor?.selectedElementIds?.[0];
    expect(outerId).toBeTruthy();

    // Enter outer.
    await dblClickElementCenter(page, outerId);

    const enteredOuter = await getState();
    expect(enteredOuter?.editor?.deepEdit?.kind).toBe('boolean');
    expect(enteredOuter?.editor?.deepEdit?.elementId).toBe(outerId);

    // Enter inner by double-clicking its visible operand boolean.
    await dblClickElementCenter(page, innerId);

    const enteredInner = await getState();
    expect(enteredInner?.editor?.deepEdit?.kind).toBe('boolean');
    expect(enteredInner?.editor?.deepEdit?.elementId).toBe(innerId);

    // Done pops back to outer.
    await page.locator('[data-testid="deep-edit-done"]').click();

    const afterDone = await getState();
    expect(afterDone?.editor?.deepEdit?.kind).toBe('boolean');
    expect(afterDone?.editor?.deepEdit?.elementId).toBe(outerId);

    // Escape exits.
    await page.keyboard.press('Escape');

    const afterEsc = await getState();
    expect(afterEsc?.editor?.deepEdit).toBeNull();
  });
});
