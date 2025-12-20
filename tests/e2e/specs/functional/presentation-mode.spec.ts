import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import { PresentationPage } from '../../pages/PresentationPage';

/**
 * Functional Tests - Presentation Mode
 * Tests for entering, navigating, and exiting presentation mode
 */

test.describe('Presentation Mode', () => {
    let editor: EditorPage;
    let presentation: PresentationPage;
    
    test.beforeEach(async ({ page }) => {
        editor = new EditorPage(page);
        presentation = new PresentationPage(page);
        await editor.goto();
        await editor.waitForLoad();
    });

    test('should satisfy presentation DOM contract (required IDs exist)', async ({ page }) => {
        // These nodes are a compatibility surface used by PresentationManager/HUD/GridView.
        const requiredIds = [
            '#viewport',
            '#slide-content',
            '#slide-background',
            '#presentation-hud',
            '#presentation-grid-view',
            '#grid-content',
            '#laser-canvas',
            '#overlay-black',
            '#overlay-white'
        ];

        for (const selector of requiredIds) {
            await expect(page.locator(selector), `Missing ${selector}`).toHaveCount(1);
        }
    });
    
    test('should enter presentation mode', async () => {
        // Start presentation
        await editor.startPresentation();
        
        // Verify mode changed to presentation
        const mode = await editor.getEditorMode();
        expect(mode).toBe('presentation');
        
        // Verify toolbar and sidebars are hidden
        await expect(editor.toolbar).not.toBeVisible();
        await expect(editor.sidebar).not.toBeVisible();
    });

    test('should expose a mode picker (fullscreen vs windowed) from Play button', async ({ page }) => {
        await expect(page.locator('[data-testid="presentation-mode-picker"]')).toHaveCount(0);
        await page.locator('[data-testid="play-btn"]').click();
        await expect(page.locator('[data-testid="presentation-mode-picker"]')).toBeVisible();

        // Choose windowed start (does not require fullscreen)
        await page.locator('[data-testid="present-windowed"]').click();
        const mode = await editor.getEditorMode();
        expect(mode).toBe('presentation');
    });

    test('should show fullscreen re-request button in HUD when not fullscreen', async ({ page }) => {
        // Start in windowed mode
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="present-windowed"]').click();

        // When not fullscreen, the HUD should offer a re-request button.
        await expect(page.locator('[data-testid="hud-fullscreen-btn"]')).toBeVisible();
    });

    test('should hide editor-only chrome and placeholder affordances in presentation', async ({ page }) => {
        // Inject deterministic fixtures so this test does not depend on deck content.
        await page.evaluate(() => {
            const placeholder = document.createElement('div');
            placeholder.id = '__pw_placeholder_empty';
            placeholder.className = 'story-placeholder-empty';
            placeholder.textContent = 'Click to add title';
            placeholder.style.width = '20px';
            placeholder.style.height = '20px';
            placeholder.style.position = 'fixed';
            placeholder.style.top = '0';
            placeholder.style.left = '0';
            document.body.appendChild(placeholder);

            const icon = document.createElement('div');
            icon.id = '__pw_placeholder_icon';
            icon.className = 'placeholder-icon-container';
            icon.textContent = 'ICON';
            icon.style.width = '20px';
            icon.style.height = '20px';
            icon.style.position = 'fixed';
            icon.style.top = '25px';
            icon.style.left = '0';
            document.body.appendChild(icon);
        });

        await expect(page.locator('#__pw_placeholder_empty')).toBeVisible();
        await expect(page.locator('#__pw_placeholder_icon')).toBeVisible();

        await editor.startPresentation();

        // Container is part of the DOM contract; must be hidden for audience safety.
        await expect(page.locator('#file-indicator-container')).toHaveCount(1);
        await expect(page.locator('#file-indicator-container')).toHaveCSS('display', 'none');

        // Placeholder authoring affordances must not be visible in presentation.
        await expect(page.locator('#__pw_placeholder_empty')).toBeHidden();
        await expect(page.locator('#__pw_placeholder_icon')).toBeHidden();

        // Cleanup
        await page.evaluate(() => {
            document.getElementById('__pw_placeholder_empty')?.remove();
            document.getElementById('__pw_placeholder_icon')?.remove();
        });
    });

    test('should scale using offset translate + scale (no -50% centering)', async ({ page }) => {
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="present-windowed"]').click();

        const scaleInfo = await page.evaluate(() => {
            const viewport = document.getElementById('viewport');
            if (!viewport) return null;
            const style = getComputedStyle(viewport);
            return {
                top: style.top,
                left: style.left,
                transformOrigin: style.transformOrigin,
                inlineTransform: viewport.style.transform
            };
        });

        expect(scaleInfo).toBeTruthy();
        expect(scaleInfo?.top).toBe('0px');
        expect(scaleInfo?.left).toBe('0px');
        expect(scaleInfo?.transformOrigin).toBe('0px 0px');
        expect(scaleInfo?.inlineTransform).toContain('translate(');
        expect(scaleInfo?.inlineTransform).toContain('scale(');
        expect(scaleInfo?.inlineTransform).not.toContain('translate(-50%');
    });

    test('should use token-based presentation stage background', async ({ page }) => {
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="present-windowed"]').click();

        const colors = await page.evaluate(() => {
            const stage = document.getElementById('main-stage');
            if (!stage) return null;

            const probe = document.createElement('div');
            probe.style.position = 'fixed';
            probe.style.left = '-9999px';
            probe.style.top = '-9999px';
            probe.style.backgroundColor = 'var(--color-presentation-stage-bg)';
            document.body.appendChild(probe);

            const stageBg = getComputedStyle(stage).backgroundColor;
            const tokenBg = getComputedStyle(probe).backgroundColor;

            probe.remove();
            return { stageBg, tokenBg };
        });

        expect(colors).toBeTruthy();
        expect(colors?.stageBg).toBe(colors?.tokenBg);
    });

    test('should never render presenter-only loading indicator in audience view', async ({ page }) => {
        // Audience view must never include presenter-only diagnostics UI.
        await expect(page.locator('[data-testid="pm-presenter-loading"]')).toHaveCount(0);

        await editor.startPresentation();

        await expect(page.locator('[data-testid="pm-presenter-loading"]')).toHaveCount(0);

        // Navigate once to ensure we don't accidentally render it during nav.
        await presentation.next();
        await expect(page.locator('[data-testid="pm-presenter-loading"]')).toHaveCount(0);
    });

    test('should show presenter-only loading indicator while navigation is gated (and hide after ready)', async ({ page, getState }) => {
        // Presenter view is identified via query param.
        await page.goto('/?presenter=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await editor.waitForLoad();

        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="present-windowed"]').click();

        // Stall HOT prefetch deterministically, then release it.
        await page.evaluate(() => {
            const win = window as any;
            if (!win.__presentationPrefetch) {
                win.__presentationPrefetch = {};
            }

            let resolveGate: (() => void) | null = null;
            const gate = new Promise<void>((resolve) => {
                resolveGate = resolve;
            });

            win.__pwResolveHotPrefetch = () => resolveGate?.();

            win.__presentationPrefetch.ensurePrefetched = () => gate;
        });

        // Trigger slide navigation (not build navigation).
        await page.locator('[data-testid="hud-next-btn"]').click();

        // Presenter-only loader should appear and presentation should pause while gated.
        await expect(page.locator('[data-testid="pm-presenter-loading"]')).toBeVisible();
        await expect
            .poll(async () => (await getState()).presentation.isPaused, { timeout: 3000 })
            .toBe(true);
        await expect
            .poll(async () => (await getState()).presentation.navLoading, { timeout: 3000 })
            .toBe(true);

        // Release prefetch gate and ensure loader clears and navigation completes.
        const before = await getState();
        const beforeIndex = before.presentation.currentSlideIndex;

        await page.evaluate(() => (window as any).__pwResolveHotPrefetch?.());

        await expect
            .poll(async () => (await getState()).presentation.isPaused, { timeout: 3000 })
            .toBe(false);
        await expect
            .poll(async () => (await getState()).presentation.navLoading, { timeout: 3000 })
            .toBe(false);
        await expect
            .poll(async () => (await getState()).presentation.currentSlideIndex, { timeout: 3000 })
            .toBe(beforeIndex + 1);

        // Element exists in presenter view but should be hidden when not loading.
        await expect(page.locator('[data-testid="pm-presenter-loading"]')).toHaveClass(/hidden/);
    });

    test('should bypass prefetch gating when offline (navigator.onLine=false)', async ({ page, getState }) => {
        await editor.startPresentation();

        // Force offline signal without actually breaking the dev server network.
        await page.evaluate(() => {
            try {
                Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
            } catch {
                // Fallback for engines that reject defineProperty on navigator.
                (navigator as any).__defineGetter__('onLine', () => false);
            }
        });

        // If prefetch is incorrectly invoked while offline, record it.
        await page.evaluate(() => {
            const win = window as any;
            win.__pwPrefetchCalled = 0;
            if (!win.__presentationPrefetch) {
                win.__presentationPrefetch = {};
            }
            win.__presentationPrefetch.ensurePrefetched = () => {
                win.__pwPrefetchCalled++;
                return Promise.resolve();
            };
        });

        const before = await getState();
        const beforeIndex = before.presentation.currentSlideIndex;

        await page.locator('[data-testid="hud-next-btn"]').click();

        await expect
            .poll(async () => (await getState()).presentation.currentSlideIndex, { timeout: 3000 })
            .toBe(beforeIndex + 1);

        const called = await page.evaluate(() => (window as any).__pwPrefetchCalled);
        expect(called).toBe(0);
    });

    test('should enforce forbidden selector checklist in presentation (DOM audit)', async ({ page }) => {
        const forbiddenCoreIds = [
            '#sidebar-left',
            '#sidebar-right',
            '#top-controls',
            '#floating-toolbar',
            '#floating-panels',
            '#viewport-controls',
            '#file-indicator-container'
        ];

        // These are often created dynamically; inject fixtures so the audit is deterministic.
        const forbiddenDynamic = [
            { selector: '.story-placeholder-empty', className: 'story-placeholder-empty' },
            { selector: '.placeholder-icon-container', className: 'placeholder-icon-container' },
            { selector: '.layout-guide-overlay', className: 'layout-guide-overlay' },
            { selector: '.context-menu', className: 'context-menu visible' },
            { selector: '.snapping-options-flyout', className: 'snapping-options-flyout' },
            { selector: '.modal-overlay', className: 'modal-overlay' },
            { selector: '.alert-modal-overlay', className: 'alert-modal-overlay visible' },
            { selector: '.sign-in-modal-overlay', className: 'sign-in-modal-overlay' },
            { selector: '.share-modal-overlay', className: 'share-modal-overlay' },
            { selector: '.panel-modal-overlay', className: 'panel-modal-overlay' },
            { selector: '.code-modal-overlay', className: 'code-modal-overlay' },
            { selector: '.notification-popover-container', className: 'notification-popover-container' },
            { selector: '.file-toast', className: 'file-toast visible' },
            { selector: '.panel-toast', className: 'panel-toast visible' },
            { selector: '.tsm-toast', className: 'tsm-toast' },
            { selector: '.file-indicator', className: 'file-indicator' }
        ];

        await page.evaluate((items) => {
            const makeBox = (id, className, top) => {
                const el = document.createElement('div');
                el.id = id;
                el.className = className;
                el.textContent = id;
                el.style.position = 'fixed';
                el.style.top = `${top}px`;
                el.style.left = '0px';
                el.style.width = '40px';
                el.style.height = '20px';
                el.style.background = 'magenta';
                el.style.display = 'block';
                el.style.opacity = '1';
                el.style.visibility = 'visible';
                el.setAttribute('data-pw-fixture', 'true');
                document.body.appendChild(el);
            };

            let top = 0;
            items.forEach((item) => {
                // Avoid duplicating fixtures if a previous test run leaked nodes.
                const id = `__pw_forbidden_${item.className.replace(/\s+/g, '_')}`;
                if (!document.getElementById(id)) {
                    makeBox(id, item.className, top);
                    top += 22;
                }
            });
        }, forbiddenDynamic);

        // Sanity: core DOM surfaces exist.
        for (const selector of forbiddenCoreIds) {
            await expect(page.locator(selector)).toHaveCount(1);
        }

        // Sanity: at least one injected dynamic element is visible pre-presentation.
        await expect(page.locator('[data-pw-fixture="true"]').first()).toBeVisible();

        await editor.startPresentation();

        // Core chrome must be hidden.
        for (const selector of forbiddenCoreIds) {
            const loc = page.locator(selector);
            await expect(loc, `${selector} must not be visible in presentation`).toBeHidden();
        }

        // Dynamic surfaces (menus/modals/toasts/etc.) must be hidden.
        for (const item of forbiddenDynamic) {
            const loc = page.locator(item.selector);
            const count = await loc.count();
            expect(count, `Expected ${item.selector} to exist for audit`).toBeGreaterThan(0);
            for (let i = 0; i < count; i++) {
                await expect(loc.nth(i), `${item.selector} must not be visible in presentation`).toBeHidden();
            }
        }

        // Cleanup injected fixtures
        await page.evaluate(() => {
            document.querySelectorAll('[data-pw-fixture="true"]').forEach((el) => el.remove());
        });
    });

    test('should enter presentation mode via menu action', async ({ page }) => {
        await page.evaluate(() => {
            window.dispatchEvent(
                new CustomEvent('story:menu-action', {
                    detail: { action: 'present-start' }
                })
            );
        });

        const mode = await editor.getEditorMode();
        expect(mode).toBe('presentation');
    });
    
    test('should navigate forward in presentation', async ({ getState }) => {
        await editor.startPresentation();
        
        const initialState = await getState();
        const initialIndex = initialState.presentation.currentSlideIndex;
        
        // Navigate to next slide
        await presentation.next();
        
        const newState = await getState();
        expect(newState.presentation.currentSlideIndex).toBe(initialIndex + 1);
    });
    
    test('should navigate backward in presentation', async ({ getState }) => {
        await editor.startPresentation();
        
        // Navigate forward first
        await presentation.next();
        
        const state = await getState();
        const currentIndex = state.presentation.currentSlideIndex;
        
        // Navigate backward
        await presentation.prev();
        
        const newState = await getState();
        expect(newState.presentation.currentSlideIndex).toBe(currentIndex - 1);
    });
    
    test('should exit presentation mode with HUD button', async () => {
        await editor.startPresentation();
        
        // Verify we're in presentation mode
        let mode = await editor.getEditorMode();
        expect(mode).toBe('presentation');
        
        // Exit using HUD
        await presentation.exit();
        
        // Verify we're back in edit mode
        mode = await editor.getEditorMode();
        expect(mode).toBe('edit');
        
        // Verify toolbar and sidebars are visible again
        await expect(editor.toolbar).toBeVisible();
        await expect(editor.sidebar).toBeVisible();
    });
    
    test('should exit presentation mode with keyboard', async () => {
        await editor.startPresentation();
        
        // Exit using Escape key
        await presentation.exitWithKeyboard();
        
        // Verify we're back in edit mode
        const mode = await editor.getEditorMode();
        expect(mode).toBe('edit');
    });
    
    test('should navigate with keyboard arrows', async ({ getState }) => {
        await editor.startPresentation();
        
        const initialState = await getState();
        const initialIndex = initialState.presentation.currentSlideIndex;
        
        // Navigate forward with keyboard
        await presentation.nextWithKeyboard();
        
        const newState = await getState();
        expect(newState.presentation.currentSlideIndex).toBe(initialIndex + 1);
        
        // Navigate backward with keyboard
        await presentation.prevWithKeyboard();
        
        const finalState = await getState();
        expect(finalState.presentation.currentSlideIndex).toBe(initialIndex);
    });

    test('should ignore shortcuts when modifier keys are held', async ({ page, getState }) => {
        await editor.startPresentation();

        const initialState = await getState();
        const initialIndex = initialState.presentation.currentSlideIndex;

        await page.keyboard.down('Control');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.up('Control');

        const afterState = await getState();
        expect(afterState.presentation.currentSlideIndex).toBe(initialIndex);
    });

    test('should jump to slide by number with digits + Enter', async ({ page, getState }) => {
        await editor.startPresentation();

        const initialState = await getState();
        test.skip(initialState.slideOrder.length < 3, 'Need at least 3 slides to test numeric jump');

        // Jump to slide 3 (1-based)
        await page.keyboard.press('3');
        await page.keyboard.press('Enter');

        const state = await getState();
        expect(state.presentation.currentSlideIndex).toBe(2);
    });

    test('should cancel numeric entry with Escape (without exiting presentation)', async ({ page, getState }) => {
        await editor.startPresentation();

        const initialState = await getState();
        const initialIndex = initialState.presentation.currentSlideIndex;

        await page.keyboard.press('2');
        await page.keyboard.press('Escape');

        const mode = await editor.getEditorMode();
        expect(mode).toBe('presentation');

        const state = await getState();
        expect(state.presentation.currentSlideIndex).toBe(initialIndex);
    });

    test('should prioritize focused HUD controls over global navigation shortcuts', async ({ page, getState }) => {
        await editor.startPresentation();

        // Reveal HUD and focus a control.
        await page.mouse.move(10, 10);
        const hudGridBtn = page.getByTestId('hud-grid-btn');
        await hudGridBtn.focus();

        const before = await getState();

        // Enter should activate the focused button (open grid), not advance slide/build.
        await page.keyboard.press('Enter');
        await expect(presentation.gridView).toBeVisible();

        const after = await getState();
        expect(after.presentation.currentSlideIndex).toBe(before.presentation.currentSlideIndex);
        expect(after.presentation.buildIndex).toBe(before.presentation.buildIndex);
    });

    test('should advance on click-to-advance when clicking the slide area', async ({ page, getState }) => {
        await editor.startPresentation();

        const before = await getState();

        // Click center of the slide viewport to avoid UI overlays intercepting clicks.
        await page.locator('#viewport').click();

        const after = await getState();

        const advancedSlide = after.presentation.currentSlideIndex !== before.presentation.currentSlideIndex;
        const advancedBuild = after.presentation.buildIndex !== before.presentation.buildIndex;
        expect(advancedSlide || advancedBuild).toBe(true);
    });

    test('should not advance when clicking inside the HUD (excluded region)', async ({ page, getState }) => {
        await editor.startPresentation();

        const before = await getState();

        // Ensure HUD is visible and then click within it.
        await page.mouse.move(10, 10);
        await expect(page.locator('#presentation-hud')).toBeVisible();
        await page.locator('#presentation-hud').click({ position: { x: 5, y: 5 } });

        const after = await getState();
        expect(after.presentation.currentSlideIndex).toBe(before.presentation.currentSlideIndex);
        expect(after.presentation.buildIndex).toBe(before.presentation.buildIndex);
    });
    
    test('should toggle black screen', async () => {
        await editor.startPresentation();
        
        // Verify black overlay is initially hidden
        await expect(presentation.blackOverlay).not.toBeVisible();
        
        // Toggle black screen on
        await presentation.toggleBlack();
        
        // Verify black overlay is visible
        await expect(presentation.blackOverlay).toBeVisible();
        
        // Toggle black screen off
        await presentation.toggleBlack();
        
        // Verify black overlay is hidden again
        await expect(presentation.blackOverlay).not.toBeVisible();
    });
    
    test('should open and close grid view', async () => {
        await editor.startPresentation();
        
        // Verify grid view is initially hidden
        await expect(presentation.gridView).not.toBeVisible();
        
        // Open grid view
        await presentation.toggleGrid();
        
        // Verify grid view is visible
        await expect(presentation.gridView).toBeVisible();
        
        // Close grid view
        await presentation.toggleGrid();
        
        // Verify grid view is hidden again
        await expect(presentation.gridView).not.toBeVisible();
    });

    test('should jump via grid and support back-stack (Alt+Backspace)', async ({ page, getState }) => {
        await editor.startPresentation();

        const before = await getState();
        test.skip((before.slideOrder?.length ?? 0) < 2, 'Need at least 2 slides');

        // Open grid.
        await presentation.toggleGrid();
        await expect(presentation.gridView).toBeVisible();

        // Jump to slide 2.
        await page.locator('.grid-slide-item').nth(1).click();

        const afterJump = await getState();
        expect(afterJump.presentation.currentSlideIndex).toBe(1);

        // Go back to previous position.
        await page.keyboard.down('Alt');
        await page.keyboard.press('Backspace');
        await page.keyboard.up('Alt');

        const afterBack = await getState();
        expect(afterBack.presentation.currentSlideIndex).toBe(before.presentation.currentSlideIndex);
    });

    test('should not start slide transition until assets are decoded (readiness gate)', async ({ page, dispatchAction, getState }) => {
        await editor.startPresentation();

        // Patch decode() to be controllably delayed.
        await page.evaluate(() => {
            const original = HTMLImageElement.prototype.decode;
            let resolver: null | (() => void) = null;
            const gate = new Promise<void>((resolve) => {
                resolver = resolve;
            });

            // Expose resolver for the test to release.
            (window as any).__pwResolveDecode = () => resolver?.();
            (window as any).__pwRestoreDecode = () => {
                HTMLImageElement.prototype.decode = original;
            };

            HTMLImageElement.prototype.decode = function () {
                return gate;
            };
        });

        const state = await getState();
        const slide2 = state.slideOrder?.[1];
        if (!slide2) throw new Error('Expected at least 2 slides');

        // Inject an image into slide 2 to force decode gating.
        await dispatchAction('UPDATE_SLIDE', {
            id: slide2,
            elements: {
                ...(state.slides?.[slide2]?.elements || {}),
                __pw_gate_img: {
                    id: '__pw_gate_img',
                    type: 'image',
                    x: 0,
                    y: 0,
                    width: 200,
                    height: 200,
                    rotation: 0,
                    src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
                }
            },
            elementOrder: Array.from(new Set([...(state.slides?.[slide2]?.elementOrder || []), '__pw_gate_img']))
        });

        // Navigate to slide 2.
        await presentation.next();

        // We should enter loading status and NOT start transitioning until decode resolves.
        await expect(page.locator('#slide-content')).toHaveAttribute('data-pm-transition-status', 'loading');
        await expect(page.locator('#slide-content')).toHaveAttribute('data-pm-transition-target', slide2);

        // Release decode, then transition should proceed and settle back to idle.
        await page.evaluate(() => (window as any).__pwResolveDecode?.());
        await expect
            .poll(async () => await page.locator('#slide-content').getAttribute('data-pm-transition-status'))
            .not.toBe('loading');
        await expect(page.locator('#slide-content')).toHaveAttribute('data-pm-transition-status', 'idle');

        // Cleanup
        await page.evaluate(() => {
            (window as any).__pwRestoreDecode?.();
            delete (window as any).__pwResolveDecode;
            delete (window as any).__pwRestoreDecode;
        });
    });

    test('should clear overlays when exiting presentation mode', async ({ getState }) => {
        await editor.startPresentation();

        // Turn on black screen overlay
        await presentation.toggleBlack();
        await expect(presentation.blackOverlay).toBeVisible();

        // Exit presentation (Esc)
        await presentation.exitWithKeyboard();

        // Back in edit mode
        const mode = await editor.getEditorMode();
        expect(mode).toBe('edit');

        // Overlays must be cleared/hidden after exit
        await expect(presentation.blackOverlay).not.toBeVisible();
        await expect(presentation.whiteOverlay).not.toBeVisible();
        await expect(presentation.gridView).not.toBeVisible();

        const state = await getState();
        expect(state.presentation.blackScreen).toBe(false);
        expect(state.presentation.whiteScreen).toBe(false);
        expect(state.presentation.laserPointer).toBe(false);
        expect(state.presentation.gridView).toBe(false);
    });

    test('should reset presentation classes and viewport styles on exit', async ({ page }) => {
        await editor.startPresentation();

        // Force presentation-specific state for teardown verification
        await presentation.toggleLaser();
        await presentation.toggleBlack();
        await presentation.toggleGrid();
        await expect(presentation.blackOverlay).toBeVisible();
        await expect(presentation.gridView).toBeVisible();

        // Exit
        await presentation.exitWithKeyboard();

        // Body classes must be cleared
        await page.waitForFunction(() => {
            return !document.body.classList.contains('mode-presentation') && !document.body.classList.contains('laser-active');
        });

        // Viewport inline transforms/positioning must be reset
        const viewportInline = await page.locator('#viewport').evaluate((el) => {
            const style = (el as HTMLElement).style;
            return {
                transform: style.transform,
                width: style.width,
                height: style.height,
                position: style.position,
                top: style.top,
                left: style.left
            };
        });

        expect(viewportInline.transform || '').toBe('');
        expect(viewportInline.position || '').toBe('');
        expect(viewportInline.top || '').toBe('');
        expect(viewportInline.left || '').toBe('');
        // width/height can be empty-string when reset
        expect(viewportInline.width || '').toBe('');
        expect(viewportInline.height || '').toBe('');

        // Overlays/grid must be hidden
        await expect(presentation.blackOverlay).not.toBeVisible();
        await expect(presentation.whiteOverlay).not.toBeVisible();
        await expect(presentation.gridView).not.toBeVisible();
    });

    test('should continue presenting when fullscreen is denied', async ({ page }) => {
        await page.evaluate(() => {
            const app = document.getElementById('app');
            if (!app) throw new Error('Missing #app');
            // Force fullscreen request to fail.
            (app as any).requestFullscreen = async () => {
                throw new Error('Fullscreen denied (test)');
            };
        });

        await editor.startPresentation();

        const mode = await editor.getEditorMode();
        expect(mode).toBe('presentation');

        await expect(page.locator('body')).toHaveClass(/mode-presentation/);
    });

    test('should remain in presentation mode when fullscreen exits externally', async ({ page }) => {
        await editor.startPresentation();

        // Stub fullscreenElement so we can simulate an external fullscreen exit
        await page.evaluate(() => {
            // Create an overridable fullscreenElement getter
            Object.defineProperty(document, 'fullscreenElement', {
                configurable: true,
                get() {
                    return (window as any).__fakeFullscreenElement || null;
                }
            });

            (window as any).__fakeFullscreenElement = document.getElementById('app');
            document.dispatchEvent(new Event('fullscreenchange'));

            // Simulate external fullscreen exit (e.g. user presses Esc at browser level)
            (window as any).__fakeFullscreenElement = null;
            document.dispatchEvent(new Event('fullscreenchange'));
        });

        const mode = await editor.getEditorMode();
        expect(mode).toBe('presentation');
    });
});
