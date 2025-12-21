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

        // Presenter Tools DOM contract (minimum required hooks).
        await expect(presenterPage.locator('[data-testid="presenter-current-slide"]')).toBeVisible();
        await expect(presenterPage.locator('[data-testid="presenter-next-preview"]')).toBeVisible();
        await expect(presenterPage.locator('[data-testid="presenter-notes"]')).toBeVisible();
        await expect(presenterPage.locator('[data-testid="presenter-elapsed"]')).toBeVisible();
        await expect(presenterPage.locator('[data-testid="presenter-clock"]')).toBeVisible();
        await expect(presenterPage.locator('[data-testid="presenter-swap-displays"]')).toBeVisible();

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

    test('should allow pausing and resetting the presenter timer', async ({ page, context }) => {
        const editor = new EditorPage(page);

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
        await presenterPage.waitForLoadState('domcontentloaded');

        await expect(presenterPage.locator('[data-testid="presenter-view-panel"]')).toBeVisible();

        const elapsed = presenterPage.locator('[data-testid="presenter-elapsed"]');
        const pause = presenterPage.locator('[data-testid="presenter-pause"]');
        const reset = presenterPage.locator('[data-testid="presenter-reset"]');

        // Wait until the timer ticks at least once.
        await expect
            .poll(async () => (await elapsed.textContent()) || '', { timeout: 5000 })
            .not.toBe('00:00:00');

        await pause.click();
        const frozen = (await elapsed.textContent()) || '';
        await presenterPage.waitForTimeout(1500);
        await expect(elapsed).toHaveText(frozen);

        // Resume and verify it advances again.
        await pause.click();
        await expect
            .poll(async () => (await elapsed.textContent()) || '', { timeout: 5000 })
            .not.toBe(frozen);

        // Reset should return to 00:00:00.
        await reset.click();
        await expect(elapsed).toHaveText('00:00:00');
    });

    test('should support rehearsal timings (per-slide + total) in presenter view', async ({ page, context }) => {
        const editor = new EditorPage(page);

        await installSyncSpy(context);
        await editor.goto();
        await editor.waitForLoad();

        // Ensure we have at least 2 slides to navigate.
        await editor.addSlideBtn.click();

        // Open app menu → Present submenu → Presenter View.
        await page.locator('.app-menu-trigger').click();
        await page.locator('.app-menu-item:has(.app-menu-item-label:text-is("Present"))').click();
        await expect(page.locator('.app-menu-dropdown.app-menu-submenu')).toBeVisible();

        const popupPromise = page.waitForEvent('popup');
        await page
            .locator('.app-menu-dropdown.app-menu-submenu .app-menu-item:has(.app-menu-item-label:text-is("Presenter View"))')
            .click();
        const presenterPage = await popupPromise;
        await presenterPage.waitForLoadState('domcontentloaded');

        await expect(presenterPage.locator('[data-testid="presenter-view-panel"]')).toBeVisible();

        const rehearse = presenterPage.locator('[data-testid="presenter-rehearse"]');
        const pause = presenterPage.locator('[data-testid="presenter-pause"]');
        const summary = presenterPage.locator('[data-testid="presenter-rehearsal"]');
        const next = presenterPage.locator('[data-testid="presenter-next"]');
        const progress = presenterPage.locator('[data-testid="presenter-progress"]');

        // Enable rehearsal.
        await rehearse.click();
        await expect(rehearse).toHaveAttribute('aria-pressed', 'true');

        // Wait until it ticks to at least 1s total.
        await expect
            .poll(async () => (await summary.textContent()) || '', { timeout: 5000 })
            .toContain('Total 00:00:01');

        // Slide change should reset per-slide timer (total continues).
        await next.click();
        await expect(progress).toContainText('Slide 2/2');
        await expect
            .poll(async () => (await summary.textContent()) || '', { timeout: 5000 })
            .toMatch(/Slide 00:00:0[01]/);

        // Pause should freeze rehearsal timing as well.
        await pause.click();
        const frozen = (await summary.textContent()) || '';
        await presenterPage.waitForTimeout(1500);
        await expect(summary).toHaveText(frozen);

        // Resume should allow it to advance again.
        await pause.click();
        await expect
            .poll(async () => (await summary.textContent()) || '', { timeout: 5000 })
            .not.toBe(frozen);
    });

    test('should swap presenter role between windows (Swap Displays)', async ({ page, context }) => {
        const editor = new EditorPage(page);

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
        await presenterPage.waitForLoadState('domcontentloaded');

        await expect(presenterPage.locator('[data-testid="presenter-view-panel"]')).toBeVisible();
        await expect(page.locator('[data-testid="presenter-view-panel"]')).toHaveCount(0);

        // Trigger swap from the presenter window.
        await presenterPage.locator('[data-testid="presenter-swap-displays"]').click();

        // After swap: audience becomes presenter.
        await expect(page.locator('[data-testid="presenter-view-panel"]')).toBeVisible();
        await expect(presenterPage.locator('[data-testid="presenter-view-panel"]')).toHaveCount(0);
    });

    test('should keep buildIndex in lockstep across presenter and audience', async ({ page, context }) => {
        const editor = new EditorPage(page);

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
        await presenterPage.waitForLoadState('domcontentloaded');

        await expect
            .poll(async () => (await getStateFrom(page)).editor.mode, { timeout: 5000 })
            .toBe('presentation');
        await expect
            .poll(async () => (await getStateFrom(presenterPage)).editor.mode, { timeout: 5000 })
            .toBe('presentation');

        const forceBuildCountForActiveSlide = async (p: any, buildCount: number) => {
            await p.evaluate((bc: number) => {
                const store = (window as any).__TEST_STORE__;
                if (!store) throw new Error('Test store not exposed');

                const state = store.getState();
                const slideIndex = state?.presentation?.currentSlideIndex;
                const slideId = state?.editor?.activeSlideId;
                if (typeof slideIndex !== 'number') throw new Error('No current slide index');
                if (typeof slideId !== 'string') throw new Error('No active slide');

                store.dispatch('SET_BUILD_COUNT_FOR_SLIDE', { slideId, buildCount: bc });
                store.dispatch('PRESENTATION_GOTO', { index: slideIndex, buildIndex: -1 });
            }, buildCount);
        };

        // Ensure both windows compute the same build count for the active slide.
        await forceBuildCountForActiveSlide(page, 2);
        await forceBuildCountForActiveSlide(presenterPage, 2);

        await expect
            .poll(async () => (await getStateFrom(page)).presentation.buildIndex, { timeout: 5000 })
            .toBe(-1);
        await expect
            .poll(async () => (await getStateFrom(presenterPage)).presentation.buildIndex, { timeout: 5000 })
            .toBe(-1);

        // Advance a build in presenter window and ensure audience follows.
        await presenterPage.keyboard.press('ArrowRight');
        await expect
            .poll(async () => (await getStateFrom(presenterPage)).presentation.buildIndex, { timeout: 5000 })
            .toBe(0);
        await expect
            .poll(async () => (await getStateFrom(page)).presentation.buildIndex, { timeout: 5000 })
            .toBe(0);

        // Avoid key repeat throttle (INPUT_THROTTLE_MS).
        await presenterPage.waitForTimeout(150);
        await presenterPage.keyboard.press('ArrowRight');
        await expect
            .poll(async () => (await getStateFrom(presenterPage)).presentation.buildIndex, { timeout: 5000 })
            .toBe(1);
        await expect
            .poll(async () => (await getStateFrom(page)).presentation.buildIndex, { timeout: 5000 })
            .toBe(1);
    });

    test('should sanitize speaker notes in the presenter panel', async ({ page, context }) => {
        const editor = new EditorPage(page);

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
        await presenterPage.waitForLoadState('domcontentloaded');

        await expect(presenterPage.locator('[data-testid="presenter-view-panel"]')).toBeVisible();
        const notesEl = presenterPage.locator('[data-testid="presenter-notes"]');
        await expect(notesEl).toBeVisible();

        // Inject legacy HTML into presenter window state to validate NotesDoc import + sanitization.
        await presenterPage.evaluate(() => {
            const store = (window as any).__TEST_STORE__;
            if (!store) throw new Error('Test store not exposed');

            const state = store.getState();
            const slideId = state?.editor?.activeSlideId;
            if (!slideId) throw new Error('No active slide');

            store.dispatch('UPDATE_SLIDE', {
                id: slideId,
                notesDoc: null,
                notes: '<p>Hello<img src=x onerror=alert(1)></p><p><a href="javascript:alert(1)">bad</a></p><p><a href="https://example.com">good</a></p>'
            });
        });

        await expect
            .poll(async () => (await notesEl.innerHTML()).toLowerCase(), { timeout: 5000 })
            .toContain('hello');

        const html = await notesEl.innerHTML();
        expect(html.includes('<img')).toBe(false);
        expect(html.toLowerCase().includes('onerror')).toBe(false);
        expect(html.toLowerCase().includes('javascript:')).toBe(false);
        expect(html).toContain('bad');
        expect(html).toContain('good');
        expect(html).toContain('href="https://example.com"');
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
