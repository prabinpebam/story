import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('Appearance: corner radius applies only to rectangles', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('radius controls show for legacy rect, hide for legacy circle, and toggle per-corner mode', async ({ dispatchAction, getState, page }) => {
    const current = await getState();
    const baseSlide = Object.values(current.slides)[0];
    expect(baseSlide?.id).toBeTruthy();

    const slideId = 'slide-appearance-radius-test';

    const rectId = 'shape-rect-radius-1';
    const circleId = 'shape-circle-radius-1';

    const slide = {
      ...baseSlide,
      id: slideId,
      name: 'Appearance Radius Test',
      elements: [
        {
          id: rectId,
          type: 'rect',
          x: 120,
          y: 120,
          width: 220,
          height: 140,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#FF0000', opacity: 100, visible: true }] },
          stroke: { type: 'none' },
          borderRadius: 12
        },
        {
          id: circleId,
          type: 'circle',
          x: 420,
          y: 120,
          width: 140,
          height: 140,
          rotation: 0,
          style: { fills: [{ type: 'solid', value: '#00FF00', opacity: 100, visible: true }] },
          stroke: { type: 'none' }
        }
      ],
      elementOrder: [rectId, circleId]
    };

    await dispatchAction('LOAD_PRESENTATION', { slides: [slide] });
    await page.waitForTimeout(150);

    const radiusRow = editor.propertyInspector.locator('[data-testid="appearance-radius-row"]');
    const radiusInput = editor.propertyInspector.locator('[data-testid="appearance-radius-input"]');
    const radiusLink = editor.propertyInspector.locator('[data-testid="appearance-radius-link"]');
    const perCorner = editor.propertyInspector.locator('[data-testid="appearance-radius-per-corner"]');

    // Select rectangle -> radius UI visible.
    await dispatchAction('UPDATE_SELECTION', [rectId]);
    await page.waitForTimeout(150);

    await expect(radiusRow).toBeVisible();
    await expect(radiusLink).toBeVisible();
    await expect(radiusInput).toBeVisible();
    await expect(perCorner).toBeHidden();

    // Toggle to per-corner mode -> uniform input hidden, per-corner grid visible.
    await radiusLink.click();
    await expect(radiusInput).toBeHidden();
    await expect(perCorner).toBeVisible();

    // Toggle back -> per-corner hidden, uniform input visible.
    await radiusLink.click();
    await expect(perCorner).toBeHidden();
    await expect(radiusInput).toBeVisible();

    // Select circle -> entire radius row hidden.
    await dispatchAction('UPDATE_SELECTION', [circleId]);
    await page.waitForTimeout(150);

    await expect(radiusRow).toBeHidden();
    await expect(perCorner).toBeHidden();
  });
});
