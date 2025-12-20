import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

async function installSyncSpy(context: any) {
    await context.addInitScript(() => {
        (window as any).__pwSyncMessages = [];
        const BC = (window as any).BroadcastChannel;
        if (!BC || !BC.prototype) return;
        const original = BC.prototype.postMessage;
        BC.prototype.postMessage = function (msg: any) {
            try { (window as any).__pwSyncMessages.push(msg); } catch {}
            return original.call(this, msg);
        };
    });
}

async function getStateFrom(page: any) {
    return await page.evaluate(() => {
        if (!(window as any).__TEST_STORE__) throw new Error('Test store not exposed');
        return (window as any).__TEST_STORE__.getState();
    });
}

test.describe('Presenter View (Gate 7)', () => {
    test('should open as a popup window and stay in lockstep with audience', async ({ page, context }) => {
        const editor = new EditorPage(page);

        // Install sync spy early so it applies to both audience and popup documents.
        await installSyncSpy(context);

        await editor.goto();
        await editor.waitForLoad();

        // Open app menu → Present submenu → Presenter View.
        await page.locator('.app-menu-trigger').click();
        await page.locator('.app-menu-item:has(.app-menu-item-label:text-is("Present"))').click();

        await expect(page.locator('.app-menu-dropdown.app-menu-submenu')).toBeVisible();

        const popupPromise = page.waitForEvent('popup');
        await page
            .locator('.app-menu-dropdown.app-menu-submenu .app-menu-item:has(.app-menu-item-label:text-is("Presenter View"))')
            .click();
        const presenterPage = await popupPromise;

        // Ensure popup is ready.
        await presenterPage.waitForLoadState('domcontentloaded');

        // Both should be in presentation mode.
        await expect
            .poll(async () => (await getStateFrom(page)).editor.mode, { timeout: 5000 })
            .toBe('presentation');
        await expect
            .poll(async () => (await getStateFrom(presenterPage)).editor.mode, { timeout: 5000 })
            .toBe('presentation');

        // Presenter-only panel must exist in presenter window, not in audience.
        await expect(presenterPage.locator('[data-testid="presenter-view-panel"]')).toBeVisible();
        await expect(page.locator('[data-testid="presenter-view-panel"]')).toHaveCount(0);

        // Navigate in presenter window and ensure audience follows.
        const before = await getStateFrom(page);
        const beforeIndex = before.presentation.currentSlideIndex;

        await presenterPage.keyboard.press('ArrowRight');

        await expect
            .poll(async () => (await getStateFrom(page)).presentation.currentSlideIndex, { timeout: 5000 })
            .toBe(beforeIndex + 1);

        // Privacy boundary: ensure sync messages do not include notes/diagnostics.
        const audienceMsgs = await page.evaluate(() => (window as any).__pwSyncMessages || []);
        const presenterMsgs = await presenterPage.evaluate(() => (window as any).__pwSyncMessages || []);
        const all = [...audienceMsgs, ...presenterMsgs].map((m: any) => {
            try { return JSON.stringify(m); } catch { return String(m); }
        });

        for (const raw of all) {
            expect(raw.includes('notes')).toBe(false);
            expect(raw.includes('diagnostic')).toBe(false);
            expect(raw.includes('speaker')).toBe(false);
        }
    });

    test('should prompt to reopen if presenter window closes during a show', async ({ page, context }) => {
        const editor = new EditorPage(page);

        await installSyncSpy(context);
        await editor.goto();
        await editor.waitForLoad();

        await page.locator('.app-menu-trigger').click();
        await page.locator('.app-menu-item:has(.app-menu-item-label:text-is("Present"))').click();
        await expect(page.locator('.app-menu-dropdown.app-menu-submenu')).toBeVisible();

        const popupPromise = page.waitForEvent('popup');
        await page
            .locator('.app-menu-dropdown.app-menu-submenu .app-menu-item:has(.app-menu-item-label:text-is("Presenter View"))')
            .click();
        const presenterPage = await popupPromise;
        await presenterPage.waitForLoadState('domcontentloaded');

        // Close presenter view.
        await presenterPage.close();

        // Watchdog runs every 1000ms and will confirm() in the audience window.
        page.once('dialog', async dialog => {
            expect(dialog.type()).toBe('confirm');
            await dialog.accept();
        });

        const reopenedPopup = await page.waitForEvent('popup', { timeout: 4000 });
        await reopenedPopup.waitForLoadState('domcontentloaded');

        // Reopened presenter should still be in presentation mode and show panel.
        await expect
            .poll(async () => (await getStateFrom(page)).editor.mode, { timeout: 5000 })
            .toBe('presentation');
        await expect
            .poll(async () => (await getStateFrom(reopenedPopup)).editor.mode, { timeout: 5000 })
            .toBe('presentation');
        await expect(reopenedPopup.locator('[data-testid="presenter-view-panel"]')).toBeVisible();
    });

    test('should ignore malformed sync messages (validation allowlist)', async ({ page }) => {
        const editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();
        await editor.startPresentation();

        const before = await getStateFrom(page);
        const beforeIndex = before.presentation.currentSlideIndex;

        await page.evaluate(() => {
            const ch = new BroadcastChannel('presentation-sync');
            // Malformed: slideIndex is not numeric, should be rejected.
            ch.postMessage({ type: 'navigate', slideIndex: '999', buildIndex: 0, senderId: 'evil' });
            ch.close();
        });

        // Give the message loop a moment.
        await page.waitForTimeout(200);
        const after = await getStateFrom(page);
        expect(after.presentation.currentSlideIndex).toBe(beforeIndex);
    });
});
