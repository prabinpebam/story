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

test.describe('UI: Mask drill-in via double-click', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    await expect(editor.propertyInspector).toBeVisible();
  });

  test('double-click enters mask shape edit and Done/Escape exits', async ({ page, dispatchAction, getState }) => {
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

    await dispatchAction('UPDATE_SELECTION', ['mask-shape', 'content']);
    await dispatchAction('CREATE_MASK_FROM_SELECTION', { ids: ['mask-shape', 'content'] });

    const state = await getState();
    const maskId = state?.editor?.selectedElementIds?.[0];
    expect(maskId).toBeTruthy();

    await dblClickElementCenter(page, maskId);

    const entered = await getState();
    expect(entered?.editor?.deepEdit?.kind).toBe('mask');
    expect(entered?.editor?.deepEdit?.elementId).toBe(maskId);
    expect(entered?.editor?.deepEdit?.mode).toBe('shape');

    await expect(page.locator('[data-testid="deep-edit-bar"]')).toBeVisible();

    await page.locator('[data-testid="deep-edit-done"]').click();

    const afterDone = await getState();
    expect(afterDone?.editor?.deepEdit).toBeNull();

    // Re-enter and exit with Escape.
    await dblClickElementCenter(page, maskId);
    await page.keyboard.press('Escape');

    const afterEsc = await getState();
    expect(afterEsc?.editor?.deepEdit).toBeNull();
  });
});
