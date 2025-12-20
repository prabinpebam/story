import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('Keyboard Shortcuts Overlay', () => {
  test('opens with ? and closes with Escape', async ({ page }) => {
    const editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    const overlay = page.locator('[data-testid="keyboard-shortcuts-overlay"]');
    await expect(overlay).toHaveCount(1);
    await expect(overlay).toBeHidden();

    await page.keyboard.press('Shift+/');

    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute('data-open', 'true');

    const dialog = overlay.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    await expect(overlay.locator('[data-testid="keyboard-shortcuts-title"]')).toHaveText('Keyboard Shortcuts');
    await expect(overlay.locator('[data-testid="keyboard-shortcuts-search"]')).toBeVisible();
    await expect(overlay.locator('[data-testid="keyboard-shortcuts-list"]')).toBeVisible();

    // Must render at least some shortcut rows.
    const rows = overlay.locator('[data-testid^="keyboard-shortcut-row-"]');
    await expect
      .poll(async () => rows.count())
      .toBeGreaterThan(5);

    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
    await expect(overlay).toHaveAttribute('data-open', 'false');
  });

  test('opens from Help menu', async ({ page }) => {
    const editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    const overlay = page.locator('[data-testid="keyboard-shortcuts-overlay"]');
    await expect(overlay).toHaveCount(1);
    await expect(overlay).toBeHidden();

    await page.getByRole('button', { name: 'Story application menu' }).click();
    const appMenu = page.getByRole('menu', { name: 'Application menu' });
    await expect(appMenu).toBeVisible();

    await appMenu.getByRole('menuitem', { name: 'Help' }).click();
    const submenu = page.getByRole('menu', { name: 'Submenu' });
    await expect(submenu).toBeVisible();

    await submenu.getByRole('menuitem', { name: 'Keyboard Shortcuts' }).click();

    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute('data-open', 'true');

    // Menu should close after selecting an action.
    await expect
      .poll(async () => page.locator('.app-menu-dropdown').count())
      .toBe(0);

    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
  });

  test('toggles with Cmd/Ctrl+/', async ({ page }) => {
    const editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    const overlay = page.locator('[data-testid="keyboard-shortcuts-overlay"]');
    await expect(overlay).toHaveCount(1);

    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';

    await page.keyboard.press(`${modifier}+/`);
    await expect(overlay).toBeVisible();

    await page.keyboard.press(`${modifier}+/`);
    await expect(overlay).toBeHidden();
  });

  test('filters list via search input', async ({ page }) => {
    const editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();

    const overlay = page.locator('[data-testid="keyboard-shortcuts-overlay"]');
    await page.keyboard.press('Shift+/');
    await expect(overlay).toBeVisible();

    const search = overlay.locator('[data-testid="keyboard-shortcuts-search"]');
    await search.fill('Duplicate');

    const rows = overlay.locator('[data-testid^="keyboard-shortcut-row-"]');
    await expect
      .poll(async () => rows.count())
      .toBeGreaterThan(0);

    // After filtering, the list is re-rendered to include only matching rows.
    const renderedTexts = await rows.evaluateAll((els) => els.map((el) => (el.textContent || '').trim()));

    expect(renderedTexts.length).toBeGreaterThan(0);
    for (const text of renderedTexts) {
      expect(text.toLowerCase()).toContain('duplicate');
    }
  });
});
