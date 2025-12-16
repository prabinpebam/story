import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('M2: Rendering mode + viewport parity', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('edit mode: pan/zoom transforms content and preserves paint stack', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;
    expect(baseSlide?.id).toBeTruthy();

    const slideId = 'slide-m2-edit-viewport-parity';
    const elIdA = 'shape-m2-edit-rect-a';
    const elIdB = 'shape-m2-edit-rect-b';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M2 Edit Viewport Parity',
      width: 200,
      height: 100,
      elements: [
        {
          id: elIdA,
          type: 'rect',
          x: 40,
          y: 20,
          width: 20,
          height: 10,
          rotation: 0,
          style: {
            fills: [{ type: 'solid', value: '#FF0000', color: '#FF0000', opacity: 100, visible: true }],
            strokes: [{ type: 'solid', color: '#000000', width: 4, opacity: 100, position: 'center', visible: true }],
            dropShadow: { x: 2, y: 3, blur: 4, spread: 0, color: 'rgba(0, 0, 0, 0.5)', visible: true },
            blur: { radius: 1, visible: true }
          }
        },
        {
          id: elIdB,
          type: 'rect',
          x: 100,
          y: 20,
          width: 20,
          height: 10,
          rotation: 0,
          style: {
            fills: [{ type: 'solid', value: '#FF0000', color: '#FF0000', opacity: 100, visible: true }],
            strokes: [{ type: 'solid', color: '#000000', width: 4, opacity: 100, position: 'center', visible: true }]
          }
        }
      ],
      elementOrder: [elIdA, elIdB]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);

    // Start from a known viewport.
    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 1 });
    await page.waitForTimeout(150);

    const slideContent = page.locator('#slide-content');
    await expect(slideContent).toBeVisible();

    // Sanity: the app's edit-mode contract is translate(pan) scale(zoom).
    await expect(slideContent).toHaveCSS('transform-origin', '0px 0px');

    const elA = slideContent.locator(`[data-element-id="${elIdA}"]`).first();
    const elB = slideContent.locator(`[data-element-id="${elIdB}"]`).first();
    await expect(elA).toBeVisible();
    await expect(elB).toBeVisible();

    const centerX = (r: { x: number; width: number }) => r.x + r.width / 2;
    const centerY = (r: { y: number; height: number }) => r.y + r.height / 2;

    const a0 = await elA.boundingBox();
    const b0 = await elB.boundingBox();
    if (!a0 || !b0) throw new Error('Expected element bounding boxes');
    const dist0 = centerX(b0) - centerX(a0);

    // Zoom should scale screen-space distances.
    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 0, y: 0 }, zoom: 2 });
    await expect.poll(async () => slideContent.evaluate((n) => getComputedStyle(n).transform)).not.toBe('none');

    const a1 = await elA.boundingBox();
    const b1 = await elB.boundingBox();
    if (!a1 || !b1) throw new Error('Expected element bounding boxes');
    const dist1 = centerX(b1) - centerX(a1);
    expect(dist1).toBeCloseTo(dist0 * 2, 0);

    // Pan should shift screen-space by pan because CSS applies transforms right-to-left:
    // `translate(pan) scale(zoom)` means scale first, then translate.
    const aCenterX1 = centerX(a1);
    const aCenterY1 = centerY(a1);
    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 30, y: 40 }, zoom: 2 });
    await page.waitForTimeout(50);
    const a2 = await elA.boundingBox();
    if (!a2) throw new Error('Expected element bounding box');
    const aCenterX2 = centerX(a2);
    const aCenterY2 = centerY(a2);
    expect(aCenterX2 - aCenterX1).toBeCloseTo(30, 0);
    expect(aCenterY2 - aCenterY1).toBeCloseTo(40, 0);

    // Paint stack: one fill layer and one stroke layer should exist.
    const fillBg = await elA.evaluate((node) => {
      const fillLayer = node.querySelector('.fill-layer') as HTMLElement | null;
      if (!fillLayer) return null;
      return getComputedStyle(fillLayer).backgroundColor;
    });
    expect(fillBg).toContain('rgb(255, 0, 0)');

    const strokeAttrs = await elA.evaluate((node) => {
      const rect = node.querySelector('svg.stroke-layer rect');
      if (!rect) return null;
      return {
        stroke: rect.getAttribute('stroke'),
        strokeWidth: rect.getAttribute('stroke-width')
      };
    });
    expect(strokeAttrs).toEqual({ stroke: '#000000', strokeWidth: '4' });

    const effects = await elA.evaluate((node) => {
      const style = (node as HTMLElement).style;
      return { boxShadow: style.boxShadow, filter: style.filter };
    });
    expect(effects.boxShadow).toContain('2px 3px 4px 0px');
    expect(effects.filter).toBe('blur(1px)');
  });

  test('presentation mode: pan/zoom is neutral and viewport scaling maps world coords deterministically', async ({ dispatchAction, getState, page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });

    const current = await getState();
    const baseSlide = Object.values(current.slides)[0] as any;
    expect(baseSlide?.id).toBeTruthy();

    const slideId = 'slide-m2-presentation-viewport-parity';
    const elId = 'shape-m2-pres-rect-1';

    const slideWidth = 200;
    const slideHeight = 100;

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'M2 Presentation Viewport Parity',
      width: slideWidth,
      height: slideHeight,
      elements: [
        {
          id: elId,
          type: 'rect',
          x: 10,
          y: 5,
          width: 20,
          height: 10,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#00FF00', opacity: 100, visible: true }] }
        }
      ],
      elementOrder: [elId]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);

    // Set a non-default viewport to prove it gets neutralized in presentation.
    await dispatchAction('UPDATE_VIEWPORT', { pan: { x: 30, y: 40 }, zoom: 2 });
    await page.waitForTimeout(150);

    // Enter presentation mode.
    await dispatchAction('SET_MODE', 'presentation');

    await expect.poll(async () => page.evaluate(() => document.body.classList.contains('mode-presentation'))).toBe(true);

    // Wait for PresentationManager.updateScale() to apply.
    const viewport = page.locator('#viewport');
    const slideContent = page.locator('#slide-content');

    await expect(viewport).toBeVisible();
    await expect(slideContent).toBeVisible();

    await expect.poll(async () => slideContent.evaluate((n) => getComputedStyle(n).transform)).toBe('none');

    // In presentation, the #viewport gets a scale() transform.
    await expect.poll(async () => {
      return await viewport.evaluate((n) => (n as HTMLElement).style.transform);
    }).toContain('scale(');

    const el = viewport.locator(`[data-element-id="${elId}"]`).first();
    await expect(el).toBeVisible();

    const { dx, dy, expectedScale } = await page.evaluate(({ elId, slideWidth, slideHeight }) => {
      const vp = document.getElementById('viewport');
      const el = document.querySelector(`#viewport [data-element-id="${elId}"]`) as HTMLElement | null;
      if (!vp || !el) throw new Error('missing elements');

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const scale = Math.min(windowWidth / slideWidth, windowHeight / slideHeight);

      const a = vp.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      return { dx: b.left - a.left, dy: b.top - a.top, expectedScale: scale };
    }, { elId, slideWidth, slideHeight });

    // x=10,y=5 should scale by the presentation fit-to-view scale.
    expect(dx).toBeCloseTo(10 * expectedScale, 0);
    expect(dy).toBeCloseTo(5 * expectedScale, 0);
  });
});
