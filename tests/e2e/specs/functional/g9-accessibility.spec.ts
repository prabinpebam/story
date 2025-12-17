import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';
import AxeBuilder from '@axe-core/playwright';

test.describe('G9: Shapes accessibility baseline', () => {
  let editor: EditorPage;
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    canvas = new CanvasHelper(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test('floating toolbar buttons have accessible names (role/name)', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Select tool' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hand tool' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Shape tool/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Text tool' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Image tool' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Resources' })).toBeVisible();
  });

  test('keyboard: arrow keys nudge selected shape (no pointer-only trap)', async ({ page, getState }) => {
    await page.keyboard.press('r');
    await canvas.drag(0.2, 0.2, 0.4, 0.35);

    const before = await getState();
    const slideId = before.editor.activeSlideId;
    const selectedId = before.editor.selectedElementIds?.[0];
    expect(selectedId).toBeTruthy();

    const beforeEl = before.slides[slideId].elements[selectedId];
    const beforeX = Number(beforeEl.x);

    await page.keyboard.press('ArrowRight');

    await expect.poll(async () => {
      const st = await getState();
      const el = st.slides[slideId].elements[selectedId];
      return Number(el.x);
    }).toBeGreaterThan(beforeX);
  });

  test('axe: no serious/critical violations in the Shapes toolbar', async ({ page }) => {
    const toolbarResults = await new AxeBuilder({ page }).include('#floating-toolbar').analyze();
    const seriousToolbar = toolbarResults.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    expect(seriousToolbar).toEqual([]);
  });
});
