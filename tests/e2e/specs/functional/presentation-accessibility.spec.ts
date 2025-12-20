import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

async function getStateFrom(page: any) {
    return await page.evaluate(() => {
        if (!(window as any).__TEST_STORE__) throw new Error('Test store not exposed');
        return (window as any).__TEST_STORE__.getState();
    });
}

async function resolveCssVar(page: any, cssVarName: string, property: 'backgroundColor' | 'color' = 'backgroundColor') {
    return await page.evaluate(
        ({ cssVarName, property }: { cssVarName: string; property: 'backgroundColor' | 'color' }) => {
            const probe = document.createElement('div');
            probe.style.position = 'absolute';
            probe.style.left = '-99999px';
            probe.style.top = '0';
            if (property === 'backgroundColor') probe.style.backgroundColor = `var(${cssVarName})`;
            else probe.style.color = `var(${cssVarName})`;
            document.body.appendChild(probe);
            const computed = getComputedStyle(probe);
            const value = property === 'backgroundColor' ? computed.backgroundColor : computed.color;
            probe.remove();
            return value;
        },
        { cssVarName, property }
    );
}

async function getCssVar(page: any, cssVarName: string) {
    return await page.evaluate(
        ({ cssVarName }: { cssVarName: string }) => {
            return getComputedStyle(document.body).getPropertyValue(cssVarName).trim();
        },
        { cssVarName }
    );
}

async function openSettingsAppearance(page: any) {
    await page.locator('.app-menu-trigger').click();
    await page.locator('.app-menu-dropdown .app-menu-item', { hasText: 'Settings...' }).click();

    const modal = page.getByTestId('settings-modal');
    await expect(modal).toBeVisible();
    await modal.locator('.modal-nav-item', { hasText: 'Appearance' }).click();
    return modal;
}

async function setThemeModeViaSettings(page: any, mode: 'Light' | 'Dark') {
    const modal = await openSettingsAppearance(page);
    const themeDropdown = modal.locator('.dropdown-trigger').first();
    await themeDropdown.click();
    await page.locator('.dropdown-item', { hasText: mode }).click();
    await modal.locator('.close-btn').click();
}

async function setAccentThemeViaSettings(page: any, accentLabel: 'Blue' | 'Purple' | 'Teal' | 'Orange' | 'Pink') {
    const modal = await openSettingsAppearance(page);
    await modal.locator('.theme-card', { hasText: accentLabel }).click();
    await modal.locator('.close-btn').click();
}

test.describe('Presentation Mode (Gate 8) — Accessibility', () => {
    test('should announce slide/build changes via live region', async ({ page }) => {
        const editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();

        // Enter presentation in windowed mode (avoid fullscreen dependencies).
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="present-windowed"]').click();

        await expect
            .poll(async () => (await getStateFrom(page)).editor.mode, { timeout: 5000 })
            .toBe('presentation');

        const region = page.locator('#presentation-live-region');
        await expect(region).toHaveAttribute('role', 'status');
        await expect(region).toHaveAttribute('aria-live', 'polite');
        await expect(region).toHaveAttribute('aria-atomic', 'true');

        const initial = await region.textContent();
        await page.keyboard.press('ArrowRight');

        await expect
            .poll(async () => (await region.textContent()) || '', { timeout: 5000 })
            .not.toBe(initial || '');

        const next = await region.textContent();
        expect(next || '').toContain('Slide');
        expect(next || '').toContain('of');
    });

    test('should expose accessible HUD controls and toggle semantics', async ({ page }) => {
        const editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();

        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="present-windowed"]').click();

        const controls = page.locator('#presentation-hud .hud-controls');
        await expect(controls).toHaveAttribute('role', 'toolbar');
        await expect(controls).toHaveAttribute('aria-label', 'Presentation controls');

        const buttons = [
            page.locator('[data-testid="hud-prev-btn"]'),
            page.locator('[data-testid="hud-next-btn"]'),
            page.locator('[data-testid="hud-exit-btn"]'),
            page.locator('[data-testid="hud-grid-btn"]'),
            page.locator('[data-testid="hud-laser-btn"]'),
            page.locator('[data-testid="hud-black-btn"]')
        ];

        for (const btn of buttons) {
            await expect(btn).toHaveAttribute('aria-label', /.+/);
        }

        const togglePairs: Array<[string, any]> = [
            ['hud-laser-btn', page.locator('[data-testid="hud-laser-btn"]')],
            ['hud-grid-btn', page.locator('[data-testid="hud-grid-btn"]')],
            ['hud-black-btn', page.locator('[data-testid="hud-black-btn"]')]
        ];

        for (const [, toggle] of togglePairs) {
            await expect(toggle).toHaveAttribute('aria-pressed', 'false');
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-pressed', 'true');
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        }

        await expect(page.locator('[data-testid="hud-counter"]')).toHaveAttribute('role', 'status');
        await expect(page.locator('[data-testid="hud-counter"]')).toHaveAttribute('aria-live', 'polite');
    });

    test('should allow keyboard-only exit (no focus trap)', async ({ page }) => {
        const editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();

        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="present-windowed"]').click();

        await expect
            .poll(async () => (await getStateFrom(page)).editor.mode, { timeout: 5000 })
            .toBe('presentation');

        // Tab through HUD controls until Exit is focused.
        for (let i = 0; i < 20; i++) {
            await page.keyboard.press('Tab');
            const activeId = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.id || '');
            if (activeId === 'hud-exit') break;
        }

        await expect
            .poll(async () => await page.evaluate(() => (document.activeElement as HTMLElement | null)?.id || ''), {
                timeout: 2000
            })
            .toBe('hud-exit');

        await page.keyboard.press('Enter');

        await expect
            .poll(async () => (await getStateFrom(page)).editor.mode, { timeout: 5000 })
            .toBe('edit');
    });

    test('should disable slide transitions when prefers-reduced-motion is set', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });

        const editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();

        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="present-windowed"]').click();

        // Navigate once and ensure we return to idle quickly (fade is 400ms; reduced motion uses transitionType=none).
        await page.keyboard.press('ArrowRight');
        await expect(page.locator('#slide-content')).toHaveAttribute('data-pm-transition-status', 'idle', { timeout: 500 });
    });

    test('should remain usable under forced-colors and higher contrast', async ({ page }) => {
        // Avoid TS type drift across Playwright versions.
        await page.emulateMedia({ forcedColors: 'active', contrast: 'more' } as any);

        const editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();

        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="present-windowed"]').click();

        await expect
            .poll(async () => (await getStateFrom(page)).editor.mode, { timeout: 5000 })
            .toBe('presentation');

        await expect(page.locator('#app')).toBeVisible();
        await expect(page.locator('#presentation-hud')).toBeVisible();
        await expect(page.locator('[data-testid="hud-exit-btn"]')).toBeVisible();
    });

    test('should apply presentation stage/HUD colors via tokens (no hardcoded overrides)', async ({ page }) => {
        const editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();

        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="present-windowed"]').click();

        const stage = page.locator('#app');
        await expect(stage).toBeVisible();

        const expectedStageBg = await resolveCssVar(page, '--color-presentation-stage-bg', 'backgroundColor');
        const expectedHudBg = await resolveCssVar(page, '--color-presentation-hud-bg', 'backgroundColor');

        const actualStageBg = await stage.evaluate(el => getComputedStyle(el).backgroundColor);
        const actualHudBg = await page.locator('#presentation-hud .hud-controls').evaluate(el => getComputedStyle(el).backgroundColor);

        expect(actualStageBg).toBe(expectedStageBg);
        expect(actualHudBg).toBe(expectedHudBg);
    });

    test('should apply light/dark theme changes to presentation tokens', async ({ page }) => {
        const editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();

        const darkStageBgToken = await getCssVar(page, '--color-presentation-stage-bg');

        await setThemeModeViaSettings(page, 'Light');
        await expect(page.locator('body')).toHaveClass(/theme-light/);

        const lightStageBgToken = await getCssVar(page, '--color-presentation-stage-bg');
        expect(lightStageBgToken).not.toBe(darkStageBgToken);

        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="present-windowed"]').click();

        const stage = page.locator('#app');
        await expect(stage).toBeVisible();

        const expectedStageBg = await resolveCssVar(page, '--color-presentation-stage-bg', 'backgroundColor');
        const actualStageBg = await stage.evaluate(el => getComputedStyle(el).backgroundColor);
        expect(actualStageBg).toBe(expectedStageBg);
    });

    test('should apply accent theme to presentation grid active indicator', async ({ page }) => {
        const editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();

        const defaultAccent = await getCssVar(page, '--color-accent');

        await setAccentThemeViaSettings(page, 'Purple');
        const updatedAccent = await getCssVar(page, '--color-accent');
        expect(updatedAccent).not.toBe(defaultAccent);

        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="present-windowed"]').click();

        await expect
            .poll(async () => (await getStateFrom(page)).editor.mode, { timeout: 5000 })
            .toBe('presentation');

        await page.locator('[data-testid="hud-grid-btn"]').click();
        await expect(page.locator('#presentation-grid-view')).toBeVisible();

        const expectedBorderColor = await resolveCssVar(page, '--color-accent', 'color');
        const activePreview = page.locator('.grid-slide-item.active .slide-preview');
        await expect(activePreview).toBeVisible();

        const actualBorderColor = await activePreview.evaluate(el => getComputedStyle(el).borderColor);
        expect(actualBorderColor).toBe(expectedBorderColor);
    });
});
