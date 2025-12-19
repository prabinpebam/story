import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

type LayerDropPosition = 'before' | 'after';

async function getVisibleLayerIds(page: any, selector: string): Promise<string[]> {
  return await page.$$eval(selector, (els: Element[]) =>
    els
      .map((el) => el.getAttribute('data-id'))
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
  );
}

async function dragLayer(page: any, fromId: string, toId: string, pos: LayerDropPosition) {
  const from = page.locator(`#layer-tree .layer-item[data-id="${fromId}"]`).first();
  const to = page.locator(`#layer-tree .layer-item[data-id="${toId}"]`).first();

  await expect(from).toBeVisible();
  await expect(to).toBeVisible();

  const toBox = await to.boundingBox();
  expect(toBox).toBeTruthy();

  const targetPosition = {
    x: 10,
    y: pos === 'before' ? 2 : Math.max(2, (toBox as any).height - 2)
  };

  await from.dragTo(to, { targetPosition });
}

function subsetOrder(order: string[], ids: string[]): string[] {
  const idSet = new Set(ids);
  return order.filter((id) => idSet.has(id));
}

test.describe('UI: Layer reordering (shortcuts + layer panel drag)', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    // Ensure layers panel exists
    await expect(page.locator('#layer-tree')).toBeVisible();
  });

  test('keyboard shortcuts reorder top-level shapes (bring to front/back/forward/backward)', async ({ page, dispatchAction, getState }) => {
    await dispatchAction('ADD_ELEMENT', { id: 'rect-back', type: 'rect', x: 80, y: 80, width: 120, height: 90, rotation: 0 });
    await dispatchAction('ADD_ELEMENT', { id: 'rect-mid', type: 'rect', x: 120, y: 120, width: 120, height: 90, rotation: 0 });
    await dispatchAction('ADD_ELEMENT', { id: 'rect-front', type: 'rect', x: 160, y: 160, width: 120, height: 90, rotation: 0 });

    // Select mid
    await dispatchAction('UPDATE_SELECTION', ['rect-mid']);

    // Bring forward one (Ctrl+]) swaps with front
    await page.keyboard.press('Control+BracketRight');

    const state1 = await getState();
    const slideId1 = state1.editor.activeSlideId;
    expect(subsetOrder(state1.slides[slideId1].elementOrder, ['rect-back', 'rect-mid', 'rect-front'])).toEqual(['rect-back', 'rect-front', 'rect-mid']);

    // DOM order (depth=0, front-to-back) should show rect-mid on top
    const topLevel = await getVisibleLayerIds(page, '#layer-tree .layer-item[data-source="slide"][data-depth="0"]');
    expect(topLevel[0]).toBe('rect-mid');

    // Send backward one (Ctrl+[) swaps with front back to original
    await page.keyboard.press('Control+BracketLeft');

    const state2 = await getState();
    const slideId2 = state2.editor.activeSlideId;
    expect(subsetOrder(state2.slides[slideId2].elementOrder, ['rect-back', 'rect-mid', 'rect-front'])).toEqual(['rect-back', 'rect-mid', 'rect-front']);

    // Send to back (Ctrl+Shift+[)
    await page.keyboard.press('Control+Shift+BracketLeft');

    const state3 = await getState();
    const slideId3 = state3.editor.activeSlideId;
    const order3 = state3.slides[slideId3].elementOrder;
    expect(subsetOrder(order3, ['rect-back', 'rect-mid', 'rect-front'])).toEqual(['rect-mid', 'rect-back', 'rect-front']);

    // Bring to front (Ctrl+Shift+])
    await page.keyboard.press('Control+Shift+BracketRight');

    const state4 = await getState();
    const slideId4 = state4.editor.activeSlideId;
    expect(subsetOrder(state4.slides[slideId4].elementOrder, ['rect-back', 'rect-mid', 'rect-front'])).toEqual(['rect-back', 'rect-front', 'rect-mid']);
  });

  test('layer panel drag & drop reorders top-level shapes', async ({ page, dispatchAction, getState }) => {
    await dispatchAction('ADD_ELEMENT', { id: 'a', type: 'rect', x: 60, y: 60, width: 100, height: 80, rotation: 0 });
    await dispatchAction('ADD_ELEMENT', { id: 'b', type: 'rect', x: 80, y: 80, width: 100, height: 80, rotation: 0 });
    await dispatchAction('ADD_ELEMENT', { id: 'c', type: 'rect', x: 100, y: 100, width: 100, height: 80, rotation: 0 });

    // Drag a (back) to visually above b (i.e., in front of b): drop "before" b.
    await dragLayer(page, 'a', 'b', 'before');

    const state = await getState();
    const slideId = state.editor.activeSlideId;
    expect(subsetOrder(state.slides[slideId].elementOrder, ['a', 'b', 'c'])).toEqual(['b', 'a', 'c']);

    const topLevel = await getVisibleLayerIds(page, '#layer-tree .layer-item[data-source="slide"][data-depth="0"]');
    expect(topLevel.slice(0, 3)).toEqual(['c', 'a', 'b']);
  });

  test('layer panel drag can reorder relative to placeholders', async ({ page, dispatchAction, getState }) => {
    // Slide-1 starts with placeholder-title + placeholder-subtitle.
    // Add a slide shape and drag it behind placeholders.
    await dispatchAction('ADD_ELEMENT', { id: 'rect-1', type: 'rect', x: 60, y: 60, width: 100, height: 80, rotation: 0 });

    // Sanity: top-level DOM is front-to-back.
    const beforeDom = await getVisibleLayerIds(page, '#layer-tree .layer-item[data-source="slide"][data-depth="0"]');
    expect(beforeDom.slice(0, 3)).toEqual(['rect-1', 'placeholder-subtitle', 'placeholder-title']);

    // Drag rect-1 behind the title placeholder (to the very back): drop "after" the last item.
    await dragLayer(page, 'rect-1', 'placeholder-title', 'after');

    const state = await getState();
    const slideId = state.editor.activeSlideId;
    expect(subsetOrder(state.slides[slideId].elementOrder, ['rect-1', 'placeholder-title', 'placeholder-subtitle']))
      .toEqual(['rect-1', 'placeholder-title', 'placeholder-subtitle']);

    const afterDom = await getVisibleLayerIds(page, '#layer-tree .layer-item[data-source="slide"][data-depth="0"]');
    expect(afterDom.slice(0, 3)).toEqual(['placeholder-subtitle', 'placeholder-title', 'rect-1']);
  });

  test('drag & drop reorders group children without breaking world positions', async ({ page, dispatchAction, getState }) => {
    await dispatchAction('ADD_ELEMENT', { id: 'g-a', type: 'rect', x: 200, y: 200, width: 80, height: 60, rotation: 0 });
    await dispatchAction('ADD_ELEMENT', { id: 'g-b', type: 'rect', x: 320, y: 200, width: 80, height: 60, rotation: 0 });

    await dispatchAction('UPDATE_SELECTION', ['g-a', 'g-b']);
    await dispatchAction('GROUP_ELEMENTS');

    const state0 = await getState();
    const slideId0 = state0.editor.activeSlideId;
    const groupId = state0.editor.selectedElementIds[0];
    expect(groupId).toBeTruthy();

    // Expand group children exist in layer tree.
    await expect(page.locator(`#layer-tree .layer-item[data-id="${groupId}"]`)).toBeVisible();
    await expect(page.locator('#layer-tree .layer-item[data-id="g-a"]')).toBeVisible();
    await expect(page.locator('#layer-tree .layer-item[data-id="g-b"]')).toBeVisible();

    // Capture world positions before.
    const before = await getState();
    const group = before.slides[slideId0].elements[groupId];
    const a = before.slides[slideId0].elements['g-a'];
    const b = before.slides[slideId0].elements['g-b'];

    const worldAx = (group.x || 0) + (a.x || 0);
    const worldAy = (group.y || 0) + (a.y || 0);
    const worldBx = (group.x || 0) + (b.x || 0);
    const worldBy = (group.y || 0) + (b.y || 0);

    // Drag g-a above g-b within the group list.
    await dragLayer(page, 'g-a', 'g-b', 'before');

    const after = await getState();
    const groupAfter = after.slides[slideId0].elements[groupId];
    expect(groupAfter.children).toEqual(['g-b', 'g-a']);

    const a2 = after.slides[slideId0].elements['g-a'];
    const b2 = after.slides[slideId0].elements['g-b'];

    // World positions should remain unchanged.
    expect((groupAfter.x || 0) + (a2.x || 0)).toBe(worldAx);
    expect((groupAfter.y || 0) + (a2.y || 0)).toBe(worldAy);
    expect((groupAfter.x || 0) + (b2.x || 0)).toBe(worldBx);
    expect((groupAfter.y || 0) + (b2.y || 0)).toBe(worldBy);
  });

  test('drag & drop reorders boolean operands', async ({ page, dispatchAction, getState }) => {
    await dispatchAction('ADD_ELEMENT', { id: 'op-a', type: 'rect', x: 240, y: 260, width: 120, height: 90, rotation: 0 });
    await dispatchAction('ADD_ELEMENT', { id: 'op-b', type: 'rect', x: 300, y: 300, width: 120, height: 90, rotation: 0 });

    await dispatchAction('UPDATE_SELECTION', ['op-a', 'op-b']);
    await dispatchAction('CREATE_BOOLEAN_FROM_SELECTION', { ids: ['op-a', 'op-b'], operation: 'union' });

    const state0 = await getState();
    const slideId = state0.editor.activeSlideId;
    const booleanId = state0.editor.selectedElementIds[0];
    expect(booleanId).toBeTruthy();

    const boolEl = state0.slides[slideId].elements[booleanId];
    expect(boolEl.operands).toEqual(['op-a', 'op-b']);

    await expect(page.locator(`#layer-tree .layer-item[data-id="${booleanId}"]`)).toBeVisible();

    // Drag op-a below op-b within boolean
    await dragLayer(page, 'op-a', 'op-b', 'after');

    const state1 = await getState();
    const boolEl1 = state1.slides[slideId].elements[booleanId];
    expect(boolEl1.operands).toEqual(['op-b', 'op-a']);
  });

  test('drag & drop reorders mask content (mask shape stays fixed)', async ({ page, dispatchAction, getState }) => {
    await dispatchAction('ADD_ELEMENT', { id: 'mask-shape', type: 'rect', x: 420, y: 200, width: 150, height: 110, rotation: 0 });
    await dispatchAction('ADD_ELEMENT', { id: 'mc-a', type: 'rect', x: 400, y: 180, width: 80, height: 60, rotation: 0 });
    await dispatchAction('ADD_ELEMENT', { id: 'mc-b', type: 'rect', x: 520, y: 260, width: 80, height: 60, rotation: 0 });

    await dispatchAction('UPDATE_SELECTION', ['mask-shape', 'mc-a', 'mc-b']);
    await dispatchAction('CREATE_MASK_FROM_SELECTION', { ids: ['mask-shape', 'mc-a', 'mc-b'], maskShapeId: 'mask-shape', contentIds: ['mc-a', 'mc-b'] });

    const state0 = await getState();
    const slideId = state0.editor.activeSlideId;
    const maskId = state0.editor.selectedElementIds[0];
    expect(maskId).toBeTruthy();

    const maskEl = state0.slides[slideId].elements[maskId];
    expect(maskEl.maskShapeId).toBeTruthy();
    expect(maskEl.contentIds.sort()).toEqual(['mc-a', 'mc-b'].sort());

    // Ensure the mask-shape item is present but not draggable; content is draggable.
    await expect(page.locator(`#layer-tree .layer-item[data-id="mask-shape"]`)).toBeVisible();
    await expect(page.locator(`#layer-tree .layer-item[data-id="mc-a"]`)).toBeVisible();
    await expect(page.locator(`#layer-tree .layer-item[data-id="mc-b"]`)).toBeVisible();

    // Drag mc-a below mc-b within mask.
    await dragLayer(page, 'mc-a', 'mc-b', 'after');

    const state1 = await getState();
    const maskEl1 = state1.slides[slideId].elements[maskId];
    expect(maskEl1.contentIds).toEqual(['mc-b', 'mc-a']);
  });
});
