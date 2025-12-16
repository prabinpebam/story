import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('Shapes: shapeKind enrichment on load', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('LOAD_PRESENTATION enriches legacy rect/circle elements with shapeKind (without changing type)', async ({ dispatchAction, getState }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0];
    expect(baseSlide?.id).toBeTruthy();

    const slideId = 'slide-shape-kind-enrichment-test';

    const legacyRect = {
      id: 'shape-legacy-rect-1',
      type: 'rect',
      x: 100,
      y: 100,
      width: 200,
      height: 120,
      rotation: 0,
      style: {
        fills: [
          {
            type: 'solid',
            value: '#FF0000',
            opacity: 100,
            visible: true
          }
        ]
      },
      stroke: { type: 'none' }
    };

    const legacyCircle = {
      id: 'shape-legacy-circle-1',
      type: 'circle',
      x: 380,
      y: 100,
      width: 120,
      height: 120,
      rotation: 0,
      style: {
        fills: [
          {
            type: 'solid',
            value: '#00FF00',
            opacity: 100,
            visible: true
          }
        ]
      },
      stroke: { type: 'none' }
    };

    const text = {
      id: 'text-1',
      type: 'text',
      x: 100,
      y: 260,
      width: 400,
      height: 80,
      rotation: 0,
      content: 'shapeKind enrichment test',
      style: {
        fontSize: 24,
        color: '#111111'
      }
    };

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'ShapeKind Enrichment Test',
      // Use array form to exercise LOAD_PRESENTATION array->map conversion.
      elements: [legacyRect, legacyCircle, text],
      elementOrder: ['shape-legacy-rect-1', 'shape-legacy-circle-1', 'text-1']
    };

    await dispatchAction('LOAD_PRESENTATION', {
      slides: [slide]
    });

    await expect.poll(async () => {
      const state = await getState();
      return state.slides?.[slideId]?.elements?.['shape-legacy-rect-1']?.shapeKind;
    }, { timeout: 2000 }).toBe('rectangle');

    const after = await getState();
    const loadedSlide = after.slides[slideId];

    expect(loadedSlide).toBeTruthy();
    expect(Array.isArray(loadedSlide.elements)).toBe(false);

    const rectAfter = loadedSlide.elements['shape-legacy-rect-1'];
    const circleAfter = loadedSlide.elements['shape-legacy-circle-1'];
    const textAfter = loadedSlide.elements['text-1'];

    expect(rectAfter.type).toBe('rect');
    expect(rectAfter.shapeKind).toBe('rectangle');

    expect(circleAfter.type).toBe('circle');
    expect(circleAfter.shapeKind).toBe('ellipse');

    // Non-shape element should not get shapeKind metadata.
    expect(textAfter.type).toBe('text');
    expect('shapeKind' in textAfter).toBe(false);

    // DOM validation: renderer exposes canonical `data-shape-kind` for Playwright.
    const slideView = editor.canvas.locator('[data-testid="slide-view"]').first();
    await expect(slideView).toBeVisible();

    const rectEl = slideView.locator('[data-element-id="shape-legacy-rect-1"]').first();
    await expect(rectEl).toBeVisible();
    await expect(rectEl).toHaveAttribute('data-shape-kind', 'rectangle');

    const circleEl = slideView.locator('[data-element-id="shape-legacy-circle-1"]').first();
    await expect(circleEl).toBeVisible();
    await expect(circleEl).toHaveAttribute('data-shape-kind', 'ellipse');

    const textEl = slideView.locator('[data-element-id="text-1"]').first();
    await expect(textEl).toBeVisible();
    await expect(textEl).not.toHaveAttribute('data-shape-kind', /.+/);
  });
});
