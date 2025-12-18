import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('M5: Booleans + unified masking', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('boolean: union renders derived vector geometry and is undoable', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-m5-boolean-1';
    const aId = 'shape-m5-boolean-a';
    const bId = 'shape-m5-boolean-b';
    const boolId = 'shape-boolean-1';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M5 Boolean',
      width: 260,
      height: 160,
      elements: [
        {
          id: aId,
          type: 'rect',
          x: 30,
          y: 30,
          width: 90,
          height: 70,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#FF0000', opacity: 100, visible: true }] }
        },
        {
          id: bId,
          type: 'rect',
          x: 70,
          y: 50,
          width: 90,
          height: 70,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#00FF00', opacity: 100, visible: true }] }
        }
      ],
      elementOrder: [aId, bId]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);

    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });
    await dispatchAction('UPDATE_SELECTION', [aId, bId]);

    await dispatchAction('CREATE_BOOLEAN_FROM_SELECTION', {
      id: boolId,
      ids: [aId, bId],
      operation: 'union'
    });

    await expect.poll(async () => {
      const st = await getState();
      return (st.slides as any)[slideId].elements[boolId]?.shapeKind;
    }).toBe('boolean');

    const booleanDom = page.locator(`#view-${slideId} [data-element-id="${boolId}"]`);
    await expect(booleanDom).toBeVisible();

    // Geometry layer should exist and contain at least one path.
    await expect(booleanDom.locator('svg.geometry-layer')).toHaveCount(1);
    await expect(booleanDom.locator('svg.geometry-layer path')).toHaveCount(1);

    // Undo should remove the boolean element.
    await dispatchAction('UNDO');
    await expect.poll(async () => {
      const st = await getState();
      return (st.slides as any)[slideId].elements[boolId] ? 'present' : 'missing';
    }).toBe('missing');
  });

  test('mask: clip-path applies to text (and invert is live + undoable)', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-m5-mask-1';
    const maskShapeId = 'shape-m5-mask-shape';
    const textId = 'text-m5-mask-content';
    const maskNodeId = 'shape-mask-1';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M5 Mask',
      width: 320,
      height: 200,
      elements: [
        {
          id: maskShapeId,
          type: 'rect',
          x: 40,
          y: 30,
          width: 120,
          height: 80,
          rotation: 0,
          style: {
            fills: [{ type: 'solid', value: '#000000', opacity: 20, visible: true }],
            borderWidth: 0
          }
        },
        {
          id: textId,
          type: 'text',
          x: 10,
          y: 10,
          width: 260,
          height: 140,
          rotation: 0,
          content: '<div>Masked Text Content</div>',
          style: { fontSize: 32, color: '#000000' }
        }
      ],
      elementOrder: [maskShapeId, textId]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);

    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });

    await dispatchAction('CREATE_MASK_FROM_SELECTION', {
      id: maskNodeId,
      ids: [maskShapeId, textId],
      maskShapeId,
      contentIds: [textId],
      mode: 'clip',
      invert: false
    });

    await expect.poll(async () => {
      const st = await getState();
      return (st.slides as any)[slideId].elements[maskNodeId]?.shapeKind;
    }).toBe('mask');

    const textDom = page.locator(`#view-${slideId} [data-element-id="${textId}"]`);
    await expect(textDom).toBeVisible();

    await expect.poll(async () => {
      return await textDom.evaluate((node) => getComputedStyle(node as HTMLElement).clipPath);
    }).not.toBe('none');

    const before = await textDom.evaluate((node) => getComputedStyle(node as HTMLElement).clipPath);

    // Toggle invert via store action.
    await dispatchAction('SET_MASK_INVERT', { id: maskNodeId, invert: true });

    await expect.poll(async () => {
      const after = await textDom.evaluate((node) => getComputedStyle(node as HTMLElement).clipPath);
      return after !== before;
    }).toBe(true);

    // Undo should restore previous clip-path.
    await dispatchAction('UNDO');
    await expect.poll(async () => {
      const afterUndo = await textDom.evaluate((node) => getComputedStyle(node as HTMLElement).clipPath);
      return afterUndo;
    }).toBe(before);
  });

  test('sidebar header: boolean ops dropdown shows for eligible multi-select and can create boolean + flatten', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;

    const slideId = 'slide-m5-boolean-ui-1';
    const aId = 'shape-m5-boolean-ui-a';
    const bId = 'shape-m5-boolean-ui-b';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M5 Boolean UI',
      width: 260,
      height: 160,
      elements: [
        {
          id: aId,
          type: 'rect',
          x: 30,
          y: 30,
          width: 90,
          height: 70,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#FF0000', opacity: 100, visible: true }] }
        },
        {
          id: bId,
          type: 'rect',
          x: 70,
          y: 50,
          width: 90,
          height: 70,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#00FF00', opacity: 100, visible: true }] }
        }
      ],
      elementOrder: [aId, bId]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);
    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });

    // Multi-select two eligible shapes -> trigger should appear.
    await dispatchAction('UPDATE_SELECTION', [aId, bId]);

    const trigger = page.getByRole('button', { name: 'Boolean operations' });
    await expect(trigger).toBeVisible();

    // Menu structure should contain expected items.
    await trigger.click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Union' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Subtract' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Intersect' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Exclude' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Flatten' })).toBeVisible();

    // Close then re-open via keyboard and activate Union.
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);

    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Enter');

    // Selection becomes a boolean node.
    const booleanId = await expect
      .poll(async () => {
        const st = await getState();
        const sel = (st as any).editor.selectedElementIds;
        if (!Array.isArray(sel) || sel.length !== 1) return null;
        const id = sel[0];
        const el = (st as any).slides[slideId].elements[id];
        return el?.shapeKind === 'boolean' ? id : null;
      })
      .toBeTruthy();

    // Re-select the original operands and Flatten via menu.
    await dispatchAction('UPDATE_SELECTION', [aId, bId]);
    await expect(trigger).toBeVisible();
    await trigger.click();
    await page.getByRole('menuitem', { name: 'Flatten' }).click();

    await expect
      .poll(async () => {
        const st = await getState();
        const sel = (st as any).editor.selectedElementIds;
        if (!Array.isArray(sel) || sel.length !== 1) return null;
        const id = sel[0];
        const el = (st as any).slides[slideId].elements[id];
        return el?.shapeKind === 'vector' ? id : null;
      })
      .toBeTruthy();

    // Operands removed.
    await expect
      .poll(async () => {
        const st = await getState();
        const elements = (st as any).slides[slideId].elements;
        return { a: !!elements[aId], b: !!elements[bId] };
      })
      .toEqual({ a: false, b: false });
  });
});
