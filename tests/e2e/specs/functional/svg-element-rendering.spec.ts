import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('SVG element rendering + PI', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('renders inline SVG and respects fit mode', async ({ dispatchAction, page }) => {
    const svgId = 'svg-e2e-1';

    await dispatchAction('ADD_ELEMENT', {
      id: svgId,
      type: 'svg',
      x: 200,
      y: 200,
      width: 300,
      height: 200,
      rotation: 0,
      fitMode: 'fit',
      svgHash: 'testhash',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>',
    });

    await dispatchAction('UPDATE_SELECTION', [svgId]);

    const el = page.locator(`#slide-content .slide-element[data-element-id="${svgId}"]`).first();
    await expect(el).toBeVisible();

    const svg = el.locator('svg');
    await expect(svg).toBeVisible();
    await expect(svg).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Change fit mode via store and verify DOM updates
    await dispatchAction('UPDATE_ELEMENT', { id: svgId, fitMode: 'stretch' });
    await expect(svg).toHaveAttribute('preserveAspectRatio', 'none');

    // PI shows SVG section
    await expect(page.locator('[data-testid="svg-fit-mode"]')).toBeVisible();
  });

  test('pastes SVG markup from clipboard into the slide', async ({ page }) => {
    // Put SVG markup onto the clipboard as text (common case when copying from design tools/editors)
    await page.evaluate(async () => {
      await navigator.clipboard.writeText(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>'
      );
    });

    // Trigger paste
    await page.keyboard.press('Control+V');

    // Verify an SVG element appeared in the slide DOM
    const svgInSlide = page.locator('#slide-content .slide-element[data-element-type="svg"] svg').first();
    await expect(svgInSlide).toBeVisible();
  });
});
