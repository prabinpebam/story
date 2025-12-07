import { test, expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('File Operations', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.goto();
    await editor.waitForLoad();
  });

  test.fixme('F05: Change Document Title', async ({ page }) => {
    const titleInput = page.locator('input.document-title-input, input[aria-label="Document Title"]');
    
    // If title is text that becomes input on click
    if (await titleInput.count() === 0) {
        const titleText = page.locator('.document-title');
        await titleText.click();
    }
    
    await titleInput.fill('My New Presentation');
    await titleInput.press('Enter');
    
    await expect(titleInput).toHaveValue('My New Presentation');
    // Or check title element text
  });
});
