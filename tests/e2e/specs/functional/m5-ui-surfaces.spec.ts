import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('G5: UI surfaces (inspector, layers, feedback)', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('layer panel: boolean node shows operands nested and reorder is undoable', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-g5-layers-boolean-1';
    const aId = 'shape-g5-operand-a';
    const bId = 'shape-g5-operand-b';
    const boolId = 'shape-g5-boolean-1';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'G5 Layers Boolean',
      width: 320,
      height: 200,
      elements: [
        {
          id: aId,
          type: 'rect',
          x: 30,
          y: 30,
          width: 80,
          height: 60,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#FF0000', opacity: 100, visible: true }] }
        },
        {
          id: bId,
          type: 'rect',
          x: 70,
          y: 50,
          width: 80,
          height: 60,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#00FF00', opacity: 100, visible: true }] }
        },
        {
          id: boolId,
          type: 'shape',
          shapeKind: 'boolean',
          x: 30,
          y: 30,
          width: 120,
          height: 80,
          rotation: 0,
          operation: 'union',
          operands: [aId, bId],
          style: { fills: [{ type: 'solid', value: '#000000', opacity: 100, visible: true }] }
        }
      ],
      elementOrder: [aId, bId, boolId]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);

    await dispatchAction('SET_ACTIVE_SLIDE', slideId);
    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });
    await dispatchAction('UPDATE_SELECTION', [boolId]);

    const layerTree = page.locator('#layer-tree');
    await expect(layerTree).toBeVisible();

    const boolItem = layerTree.locator(`.layer-item[data-id="${boolId}"]`);
    await expect(boolItem).toHaveCount(1);

    const aItem = layerTree.locator(`.layer-item[data-id="${aId}"]`);
    const bItem = layerTree.locator(`.layer-item[data-id="${bId}"]`);

    await expect(aItem).toHaveCount(1);
    await expect(bItem).toHaveCount(1);

    await expect(aItem).toHaveAttribute('data-composite-parent-id', boolId);
    await expect(aItem).toHaveAttribute('data-composite-type', 'boolean');

    await expect(bItem).toHaveAttribute('data-composite-parent-id', boolId);
    await expect(bItem).toHaveAttribute('data-composite-type', 'boolean');

    // Reorder operands by dragging B before A.
    await bItem.dragTo(aItem, { targetPosition: { x: 5, y: 2 } });

    await expect.poll(async () => {
      const st = await getState();
      return (st.slides as any)[slideId].elements[boolId].operands;
    }).toEqual([bId, aId]);

    // Undo should restore original order.
    await dispatchAction('UNDO');
    await expect.poll(async () => {
      const st = await getState();
      return (st.slides as any)[slideId].elements[boolId].operands;
    }).toEqual([aId, bId]);
  });

  test('layer panel: mask node shows mask shape + content nested; content reorder is undoable', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-g5-layers-mask-1';
    const maskShapeId = 'shape-g5-mask-shape';
    const c1Id = 'shape-g5-mask-c1';
    const c2Id = 'shape-g5-mask-c2';
    const maskId = 'shape-g5-mask-1';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'G5 Layers Mask',
      width: 360,
      height: 220,
      elements: [
        {
          id: maskShapeId,
          type: 'rect',
          x: 60,
          y: 40,
          width: 140,
          height: 100,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#000000', opacity: 10, visible: true }] }
        },
        {
          id: c1Id,
          type: 'rect',
          x: 20,
          y: 20,
          width: 60,
          height: 50,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#FF0000', opacity: 100, visible: true }] }
        },
        {
          id: c2Id,
          type: 'rect',
          x: 120,
          y: 120,
          width: 60,
          height: 50,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#00FF00', opacity: 100, visible: true }] }
        },
        {
          id: maskId,
          type: 'shape',
          shapeKind: 'mask',
          x: 60,
          y: 40,
          width: 140,
          height: 100,
          rotation: 0,
          maskShapeId,
          contentIds: [c1Id, c2Id],
          mode: 'clip',
          invert: false
        }
      ],
      elementOrder: [maskShapeId, c1Id, c2Id, maskId]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);

    await dispatchAction('SET_ACTIVE_SLIDE', slideId);
    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });
    await dispatchAction('UPDATE_SELECTION', [maskId]);

    const layerTree = page.locator('#layer-tree');
    await expect(layerTree).toBeVisible();

    const maskItem = layerTree.locator(`.layer-item[data-id="${maskId}"]`);
    await expect(maskItem).toHaveCount(1);

    const maskShapeItem = layerTree.locator(`.layer-item[data-id="${maskShapeId}"]`);
    await expect(maskShapeItem).toHaveCount(1);
    await expect(maskShapeItem).toHaveAttribute('data-composite-parent-id', maskId);
    await expect(maskShapeItem).toHaveAttribute('data-composite-type', 'mask');
    await expect(maskShapeItem).toHaveAttribute('data-composite-role', 'mask-shape');

    const c1Item = layerTree.locator(`.layer-item[data-id="${c1Id}"]`);
    const c2Item = layerTree.locator(`.layer-item[data-id="${c2Id}"]`);

    await expect(c1Item).toHaveAttribute('data-composite-parent-id', maskId);
    await expect(c2Item).toHaveAttribute('data-composite-parent-id', maskId);

    // Reorder content by dragging C2 before C1.
    await c2Item.dragTo(c1Item, { targetPosition: { x: 5, y: 2 } });

    await expect.poll(async () => {
      const st = await getState();
      return (st.slides as any)[slideId].elements[maskId].contentIds;
    }).toEqual([c2Id, c1Id]);

    // Undo should restore original order.
    await dispatchAction('UNDO');
    await expect.poll(async () => {
      const st = await getState();
      return (st.slides as any)[slideId].elements[maskId].contentIds;
    }).toEqual([c1Id, c2Id]);
  });

  test('inspector: shows Fill/Stroke/Effects and surfaces boolean fallback warning', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-g5-inspector-1';
    const rectId = 'shape-g5-inspector-rect';
    const boolId = 'shape-g5-inspector-boolean';

    // Boolean references a missing operand to force fallback status.
    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'G5 Inspector',
      width: 300,
      height: 200,
      elements: [
        {
          id: rectId,
          type: 'rect',
          x: 40,
          y: 40,
          width: 60,
          height: 40,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#FF0000', opacity: 100, visible: true }] }
        },
        {
          id: boolId,
          type: 'shape',
          shapeKind: 'boolean',
          x: 10,
          y: 10,
          width: 100,
          height: 80,
          rotation: 0,
          operation: 'union',
          operands: ['missing-operand'],
          style: { fills: [{ type: 'solid', value: '#000000', opacity: 100, visible: true }] }
        }
      ],
      elementOrder: [rectId, boolId]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);

    await dispatchAction('SET_ACTIVE_SLIDE', slideId);
    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });

    const inspector = page.locator('[data-testid="property-inspector"]');
    await expect(inspector).toBeVisible();

    // Rect selection shows styling sections.
    await dispatchAction('UPDATE_SELECTION', [rectId]);
    await expect(inspector.locator('.pi-section__title', { hasText: 'Fill' })).toHaveCount(1);
    await expect(inspector.locator('.pi-section__title', { hasText: 'Stroke' })).toHaveCount(1);
    await expect(inspector.locator('.pi-section__title', { hasText: 'Effects' })).toHaveCount(1);

    // Boolean selection surfaces a non-blocking warning row.
    await dispatchAction('UPDATE_SELECTION', [boolId]);
    await expect(inspector.locator('.pi-section__title', { hasText: 'Boolean' })).toHaveCount(1);

    const warn = inspector.locator('[data-testid="boolean-status-warning"]');
    await expect(warn).toHaveCount(1);
    await expect(warn).toContainText('fallback');
  });
});
