import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

test.describe('Slide Notes (Editor)', () => {
    let editor: EditorPage;

    test.beforeEach(async ({ page }) => {
        editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();
    });

    test('SN01: toggles notes panel and persists across slide changes', async ({ page, getState, dispatchAction }) => {
        // Ensure we have at least 2 slides to test switching.
        const state = await getState();
        expect(state.slideOrder.length).toBeGreaterThanOrEqual(2);

        const slide1Id = state.slideOrder[0];
        const slide2Id = state.slideOrder[1];

        const notesBtn = page.locator('[data-testid="sidebar-notes-btn"]');
        await expect(notesBtn).toBeVisible();

        // Open panel.
        await notesBtn.click();
        const panel = page.locator('[data-testid="slide-notes-panel"]');
        const editorEl = page.locator('[data-testid="slide-notes-editor"]');
        await expect(panel).toBeVisible();
        await expect(editorEl).toBeVisible();

        // Type notes for slide 1.
        await editorEl.click();
        await page.keyboard.type('Slide 1 notes');

        // Switch to slide 2 via store (avoids click occlusion by the floating panel).
        await dispatchAction('SET_ACTIVE_SLIDE', slide2Id);
        await dispatchAction('SELECT_SLIDE', { id: slide2Id, multi: false });

        await expect(panel).toBeVisible();
        await expect(editorEl).toBeVisible();

        // Slide 2 should not inherit slide 1 notes.
        await expect(editorEl).not.toContainText('Slide 1 notes');

        // Type notes for slide 2.
        await editorEl.click();
        await page.keyboard.type('Slide 2 notes');

        // Switch back to slide 1 and verify content restored.
        await dispatchAction('SET_ACTIVE_SLIDE', slide1Id);
        await dispatchAction('SELECT_SLIDE', { id: slide1Id, multi: false });
        await expect(panel).toBeVisible();
        await expect(editorEl).toContainText('Slide 1 notes');
    });

    test('SN02: sanitizes unsafe HTML on save/reload', async ({ page }) => {
        const notesBtn = page.locator('[data-testid="sidebar-notes-btn"]');
        await notesBtn.click();

        const panel = page.locator('[data-testid="slide-notes-panel"]');
        const editorEl = page.locator('[data-testid="slide-notes-editor"]');
        await expect(editorEl).toBeVisible();

        // Inject unsafe HTML directly (simulates pasted rich content).
        await page.evaluate(() => {
            const el = document.querySelector('[data-testid="slide-notes-editor"]') as HTMLElement | null;
            if (!el) throw new Error('notes editor not found');
            el.innerHTML = '<p>Hello<img src=x onerror=alert(1)></p><a href="javascript:alert(1)">bad</a>';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        });

        // Wait for debounce save.
        await page.waitForTimeout(350);

        // Close and reopen to force render-from-NotesDoc.
        await notesBtn.click();
        await expect(panel).toBeHidden();

        await notesBtn.click();
        await expect(panel).toBeVisible();

        const html = await editorEl.innerHTML();
        expect(html.includes('<img')).toBe(false);
        expect(html.toLowerCase().includes('javascript:')).toBe(false);
        await expect(editorEl).toContainText('Hello');
        await expect(editorEl).toContainText('bad');
    });
});
