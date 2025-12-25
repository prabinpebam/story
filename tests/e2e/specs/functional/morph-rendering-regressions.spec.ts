import { test } from '../../fixtures/base-test';
import { expect } from '@playwright/test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

/**
 * Rendering regressions for Morph that validate what users actually see.
 *
 * Focus:
 * - Stroke appearance should interpolate (not jump) for basic shape strokes.
 * - Element code-fill should preserve animation timebase across morph when the code matches.
 */

test.describe('Morph transition - rendering regressions', () => {
    test.beforeEach(async ({ page }) => {
        // Ensure Morph isn't forced to `none` by reduced-motion heuristics.
        await page.addInitScript(() => {
            const originalMatchMedia = window.matchMedia?.bind(window);
            window.matchMedia = ((query: string) => {
                if (query === '(prefers-reduced-motion: reduce)') {
                    return {
                        matches: false,
                        media: query,
                        onchange: null,
                        addListener: () => {},
                        removeListener: () => {},
                        addEventListener: () => {},
                        removeEventListener: () => {},
                        dispatchEvent: () => false
                    } as any;
                }
                return originalMatchMedia
                    ? originalMatchMedia(query)
                    : ({
                          matches: false,
                          media: query,
                          onchange: null,
                          addListener: () => {},
                          removeListener: () => {},
                          addEventListener: () => {},
                          removeEventListener: () => {},
                          dispatchEvent: () => false
                      } as any);
            }) as any;
        });

        await page.emulateMedia({ reducedMotion: 'no-preference' });
    });

    test('stroke width interpolates during morph (no jump)', async ({ page, getState }) => {
        const editor = new EditorPage(page);
        const canvas = new CanvasHelper(page);

        await editor.goto();
        await editor.waitForLoad();

        // Slide A: create rectangle via UI
        await editor.selectSlide(0);
        await page.keyboard.press('r');
        await canvas.drawRectangle(0.20, 0.22, 0.20, 0.14);

        // Ensure the rectangle is selected before editing properties.
        await canvas.clickAt(0.30, 0.28);
        await expect
            .poll(async () => (await getState())?.editor?.selectedElementIds?.length || 0, { timeout: 3000 })
            .toBeGreaterThan(0);

        const rectIdA = (await getState())?.editor?.selectedElementIds?.[0];
        expect(rectIdA).toBeTruthy();

        // Apply a thick red stroke.
        const strokeSection = page.locator('.pi-section', { hasText: 'Stroke' });
        await strokeSection.locator('button[title="Add Stroke"]').click();

        const strokeRowA = strokeSection.locator('.stroke-row').first();
        await expect(strokeRowA).toBeVisible();

        // Single-selection stroke hex input does not have data-testid; use class selector.
        await strokeRowA.locator('input.stroke-hex-input').fill('#FF0000');
        await strokeRowA.locator('input.stroke-hex-input').press('Enter');

        // Stroke width is edited in the stroke settings flyout (label "W").
        await strokeRowA.locator('.stroke-swatch-trigger').click();
        const strokeFlyoutA = page.locator('.ui-flyout');
        await expect(strokeFlyoutA).toBeVisible();
        const weightInputA = strokeFlyoutA.locator('xpath=.//*[normalize-space()="W"]/following-sibling::input[1]');
        await weightInputA.fill('12');
        await weightInputA.press('Enter');

        // Close flyout.
        await canvas.clickAt(0.05, 0.05);

        // Verify Slide A stroke width applied.
        const slide1Id = (await getState()).slideOrder[0];
        await expect
            .poll(
                async () =>
                    await page.evaluate(({ slideId, elementId }) => {
                        const view = document.querySelector(`.slide-view[data-slide-id="${slideId}"]`);
                        if (!view) return null;
                        const rect = view.querySelector(
                            `.slide-element[data-element-id="${elementId}"] svg.stroke-layer rect`
                        );
                        if (!rect) return null;
                        const v = Number(rect.getAttribute('stroke-width'));
                        return Number.isFinite(v) ? v : null;
                    }, { slideId: slide1Id, elementId: rectIdA }),
                { timeout: 3000 }
            )
            .toBe(12);

        // Duplicate slide via UI shortcut (Ctrl+D). Ensure focus is on the slide list
        // (Ctrl+D can also duplicate selected canvas elements).
        await canvas.clickAt(0.05, 0.05);
        await editor.selectSlide(0);
        const initialSlideCount = (await getState()).slideOrder.length;
        await page.keyboard.press('Control+d');
        await expect
            .poll(async () => (await getState()).slideOrder.length, { timeout: 5000 })
            .toBe(initialSlideCount + 1);
        await editor.selectSlide(1);

        const slide2Id = (await getState()).slideOrder[1];
        expect(slide2Id).toBeTruthy();

        // Move the rect so geometry animates.
        await editor.setActiveTool('select');
        await canvas.moveElement(0.30, 0.28, 0.55, 0.55);

        // Change stroke to thin blue on Slide B.
        await canvas.clickAt(0.58, 0.58);
        await expect
            .poll(async () => (await getState())?.editor?.selectedElementIds?.length || 0, { timeout: 3000 })
            .toBeGreaterThan(0);

        const rectIdB = (await getState())?.editor?.selectedElementIds?.[0];
        expect(rectIdB).toBeTruthy();

        const strokeRowB = strokeSection.locator('.stroke-row').first();
        await expect(strokeRowB).toBeVisible();

        await strokeRowB.locator('input.stroke-hex-input').fill('#0000FF');
        await strokeRowB.locator('input.stroke-hex-input').press('Enter');

        await strokeRowB.locator('.stroke-swatch-trigger').click();
        const strokeFlyoutB = page.locator('.ui-flyout');
        await expect(strokeFlyoutB).toBeVisible();
        const weightInputB = strokeFlyoutB.locator('xpath=.//*[normalize-space()="W"]/following-sibling::input[1]');
        await weightInputB.fill('2');
        await weightInputB.press('Enter');

        // Close flyout.
        await canvas.clickAt(0.05, 0.05);

        // Verify Slide B stroke width applied.
        await expect
            .poll(
                async () =>
                    await page.evaluate(({ slideId, elementId }) => {
                        const view = document.querySelector(`.slide-view[data-slide-id="${slideId}"]`);
                        if (!view) return null;
                        const rect = view.querySelector(
                            `.slide-element[data-element-id="${elementId}"] svg.stroke-layer rect`
                        );
                        if (!rect) return null;
                        const v = Number(rect.getAttribute('stroke-width'));
                        return Number.isFinite(v) ? v : null;
                    }, { slideId: slide2Id, elementId: rectIdB }),
                { timeout: 3000 }
            )
            .toBe(2);

        // Deselect so property inspector shows slide properties.
        await canvas.clickAt(0.05, 0.05);

        // Set Morph transition on destination slide.
        const transitionTrigger = editor.propertyInspector.locator('[data-testid="transition-picker-trigger"]');
        await transitionTrigger.click();
        const flyout = page.locator('[data-testid="transition-picker-flyout"]');
        await flyout.locator('[data-testid="transition-picker-option"]').filter({ hasText: /Morph/i }).first().click();
        await expect(flyout).toBeHidden();

        // Go back to Slide A.
        await editor.selectSlide(0);

        // Start presentation windowed.
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
        await page.locator('[data-testid="present-windowed"]').click();

        const nextBtn = page.locator('[data-testid="hud-next-btn"]');
        await expect(nextBtn).toHaveCount(1);

        const monitor = await page.evaluate(async ({ rectIdB, slide2Id }) => {
            const slideContentEl = document.getElementById('slide-content');
            if (!slideContentEl) throw new Error('Missing #slide-content');

            const win = window as any;
            const store = win.__TEST_STORE__ || win._storyAppStore;
            if (!store) throw new Error('Test store not exposed');

            const raf = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            const waitFor = async (predicate: () => boolean, timeoutMs: number) => {
                const start = performance.now();
                while (performance.now() - start < timeoutMs) {
                    if (predicate()) return true;
                    await raf();
                }
                return false;
            };

            const getObservedRectStrokeWidth = () => {
                const view = slideContentEl.querySelector(
                    `.slide-view[data-slide-id="${slide2Id}"]`
                ) as HTMLElement | null;
                if (!view) return null;

                const rect = view.querySelector(
                    `.slide-element[data-element-id="${rectIdB}"] svg.stroke-layer rect`
                ) as SVGRectElement | null;
                if (!rect) return null;
                const v = Number(rect.getAttribute('stroke-width'));
                return Number.isFinite(v) ? v : null;
            };

            // Trigger transition.
            store.dispatch('PRESENTATION_NEXT');

            await waitFor(() => slideContentEl.getAttribute('data-pm-transition-status') === 'transitioning', 3000);

            // Sample stroke width across the real transition duration (no hard-coded timing).
            /** @type {number[]} */
            const samples: number[] = [];

            // Wait until the destination stroke rect is present.
            await waitFor(() => getObservedRectStrokeWidth() !== null, 2000);

            while (slideContentEl.getAttribute('data-pm-transition-status') === 'transitioning') {
                const w = getObservedRectStrokeWidth();
                if (typeof w === 'number') samples.push(w);
                await raf();
            }

            // One extra sample after idle to capture the settled end state.
            const end = getObservedRectStrokeWidth();
            if (typeof end === 'number') samples.push(end);

            const early = samples.length ? samples[0] : null;
            const final = samples.length ? samples[samples.length - 1] : null;

            return { early, end: final, samples };
        }, { rectIdB, slide2Id });

        // The stroke width should start near 12, progress toward 2, and end near 2.
        if (monitor.early === null || monitor.end === null) {
            throw new Error(`Missing stroke-width samples: ${JSON.stringify(monitor)}`);
        }

        // Allow some tolerance for rounding.
        expect(monitor.early).toBeGreaterThan(8);
        expect(monitor.end).toBeLessThan(4);

        // During the transition we should see at least one intermediate value.
        // (This validates real rendering behavior without assuming a fixed duration.)
        const samples = Array.isArray(monitor.samples) ? monitor.samples : [];
        expect(samples.some((v) => v > 3 && v < 11)).toBeTruthy();

        // Exit presentation.
        await page.keyboard.press('Escape');
    });

    test('stroke missing -> present animates from zero-equivalent', async ({ page, getState }) => {
        const editor = new EditorPage(page);
        const canvas = new CanvasHelper(page);

        await editor.goto();
        await editor.waitForLoad();

        // Slide A: rectangle with no stroke.
        await editor.selectSlide(0);
        await page.keyboard.press('r');
        await canvas.drawRectangle(0.20, 0.22, 0.20, 0.14);
        await canvas.clickAt(0.30, 0.28);

        const rectIdA = (await getState())?.editor?.selectedElementIds?.[0];
        expect(rectIdA).toBeTruthy();

        // Duplicate slide.
        await canvas.clickAt(0.05, 0.05);
        await editor.selectSlide(0);
        const initialSlideCount = (await getState()).slideOrder.length;
        await page.keyboard.press('Control+d');
        await expect.poll(async () => (await getState()).slideOrder.length, { timeout: 5000 }).toBe(initialSlideCount + 1);
        await editor.selectSlide(1);

        // Ensure the rectangle is selected on Slide B (duplication can clear selection).
        await editor.setActiveTool('select');
        await canvas.clickAt(0.30, 0.28);
        await expect
            .poll(async () => (await getState())?.editor?.selectedElementIds?.length || 0, { timeout: 3000 })
            .toBeGreaterThan(0);
        const rectIdB = (await getState())?.editor?.selectedElementIds?.[0];
        expect(rectIdB).toBeTruthy();

        // Slide B: add a stroke.
        const strokeSection = page.locator('.pi-section', { hasText: 'Stroke' });
        await strokeSection.locator('button[title="Add Stroke"]').click();
        const strokeRow = strokeSection.locator('.stroke-row').first();
        await expect(strokeRow).toBeVisible();
        await strokeRow.locator('input.stroke-hex-input').fill('#00AAFF');
        await strokeRow.locator('input.stroke-hex-input').press('Enter');
        await strokeRow.locator('.stroke-swatch-trigger').click();
        const flyout = page.locator('.ui-flyout');
        await expect(flyout).toBeVisible();
        const weightInput = flyout.locator('xpath=.//*[normalize-space()="W"]/following-sibling::input[1]');
        await weightInput.fill('12');
        await weightInput.press('Enter');
        await canvas.clickAt(0.05, 0.05);

        // Morph transition on destination slide.
        await canvas.clickAt(0.05, 0.05);
        const transitionTrigger = editor.propertyInspector.locator('[data-testid="transition-picker-trigger"]');
        await transitionTrigger.click();
        const tFlyout = page.locator('[data-testid="transition-picker-flyout"]');
        await tFlyout.locator('[data-testid="transition-picker-option"]').filter({ hasText: /Morph/i }).first().click();
        await expect(tFlyout).toBeHidden();

        // Back to Slide A.
        await editor.selectSlide(0);

        // Present.
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
        await page.locator('[data-testid="present-windowed"]').click();

        const slide2Id = (await getState()).slideOrder[1];

        const monitor = await page.evaluate(async ({ rectIdB, slide2Id }) => {
            const slideContentEl = document.getElementById('slide-content');
            if (!slideContentEl) throw new Error('Missing #slide-content');
            const win = window as any;
            const store = win.__TEST_STORE__ || win._storyAppStore;
            if (!store) throw new Error('Test store not exposed');

            const raf = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            const waitFor = async (predicate: () => boolean, timeoutMs: number) => {
                const start = performance.now();
                while (performance.now() - start < timeoutMs) {
                    if (predicate()) return true;
                    await raf();
                }
                return false;
            };

            const getStrokeWidth = () => {
                const view = slideContentEl.querySelector(`.slide-view[data-slide-id="${slide2Id}"]`) as HTMLElement | null;
                const rect = view?.querySelector(`.slide-element[data-element-id="${rectIdB}"] svg.stroke-layer rect`) as SVGRectElement | null;
                if (!rect) return 0;
                const v = Number(rect.getAttribute('stroke-width'));
                return Number.isFinite(v) ? v : 0;
            };

            store.dispatch('PRESENTATION_NEXT');
            await waitFor(() => slideContentEl.getAttribute('data-pm-transition-status') === 'transitioning', 3000);
            /** @type {number[]} */
            const samples: number[] = [];
            while (slideContentEl.getAttribute('data-pm-transition-status') === 'transitioning') {
                samples.push(getStrokeWidth());
                await raf();
            }
            samples.push(getStrokeWidth());
            return { samples, early: samples[0] ?? null, end: samples[samples.length - 1] ?? null };
        }, { rectIdB, slide2Id });

        if (monitor.early === null || monitor.end === null) throw new Error(`Missing samples: ${JSON.stringify(monitor)}`);
        expect(monitor.early).toBeLessThan(1);
        expect(monitor.end).toBeGreaterThan(8);
        const samples = Array.isArray(monitor.samples) ? monitor.samples : [];
        expect(samples.some((v) => v > 1 && v < 11)).toBeTruthy();

        await page.keyboard.press('Escape');
    });

    test('stroke present -> missing animates to zero-equivalent', async ({ page, getState }) => {
        const editor = new EditorPage(page);
        const canvas = new CanvasHelper(page);

        await editor.goto();
        await editor.waitForLoad();

        // Slide A: rectangle with stroke.
        await editor.selectSlide(0);
        await page.keyboard.press('r');
        await canvas.drawRectangle(0.20, 0.22, 0.20, 0.14);
        await canvas.clickAt(0.30, 0.28);

        const rectIdA = (await getState())?.editor?.selectedElementIds?.[0];
        expect(rectIdA).toBeTruthy();

        const strokeSection = page.locator('.pi-section', { hasText: 'Stroke' });
        await strokeSection.locator('button[title="Add Stroke"]').click();
        const strokeRowA = strokeSection.locator('.stroke-row').first();
        await expect(strokeRowA).toBeVisible();
        await strokeRowA.locator('input.stroke-hex-input').fill('#FF0000');
        await strokeRowA.locator('input.stroke-hex-input').press('Enter');
        await strokeRowA.locator('.stroke-swatch-trigger').click();
        const flyoutA = page.locator('.ui-flyout');
        await expect(flyoutA).toBeVisible();
        const weightInputA = flyoutA.locator('xpath=.//*[normalize-space()="W"]/following-sibling::input[1]');
        await weightInputA.fill('12');
        await weightInputA.press('Enter');
        await canvas.clickAt(0.05, 0.05);

        // Duplicate slide.
        await canvas.clickAt(0.05, 0.05);
        await editor.selectSlide(0);
        const initialSlideCount = (await getState()).slideOrder.length;
        await page.keyboard.press('Control+d');
        await expect.poll(async () => (await getState()).slideOrder.length, { timeout: 5000 }).toBe(initialSlideCount + 1);
        await editor.selectSlide(1);

        // Ensure the rectangle is selected on Slide B (duplication can clear selection).
        await editor.setActiveTool('select');
        await canvas.clickAt(0.30, 0.28);
        await expect
            .poll(async () => (await getState())?.editor?.selectedElementIds?.length || 0, { timeout: 3000 })
            .toBeGreaterThan(0);
        const rectIdB = (await getState())?.editor?.selectedElementIds?.[0];
        expect(rectIdB).toBeTruthy();

        // Slide B: remove stroke.
        const strokeRowB = strokeSection.locator('.stroke-row').first();
        await expect(strokeRowB).toBeVisible();
        // Stroke rows use the shared PropertyRow delete control.
        await strokeRowB.locator('button.pi-property-row__delete[aria-label="Delete"]').click();

        // Morph transition on destination slide.
        await canvas.clickAt(0.05, 0.05);
        const transitionTrigger = editor.propertyInspector.locator('[data-testid="transition-picker-trigger"]');
        await transitionTrigger.click();
        const tFlyout = page.locator('[data-testid="transition-picker-flyout"]');
        await tFlyout.locator('[data-testid="transition-picker-option"]').filter({ hasText: /Morph/i }).first().click();
        await expect(tFlyout).toBeHidden();

        // Back to Slide A.
        await editor.selectSlide(0);

        // Present.
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
        await page.locator('[data-testid="present-windowed"]').click();

        const slide2Id = (await getState()).slideOrder[1];

        const monitor = await page.evaluate(async ({ rectIdB, slide2Id }) => {
            const slideContentEl = document.getElementById('slide-content');
            if (!slideContentEl) throw new Error('Missing #slide-content');
            const win = window as any;
            const store = win.__TEST_STORE__ || win._storyAppStore;
            if (!store) throw new Error('Test store not exposed');

            const raf = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            const waitFor = async (predicate: () => boolean, timeoutMs: number) => {
                const start = performance.now();
                while (performance.now() - start < timeoutMs) {
                    if (predicate()) return true;
                    await raf();
                }
                return false;
            };

            const getStrokeWidth = () => {
                const view = slideContentEl.querySelector(`.slide-view[data-slide-id="${slide2Id}"]`) as HTMLElement | null;
                const rect = view?.querySelector(`.slide-element[data-element-id="${rectIdB}"] svg.stroke-layer rect`) as SVGRectElement | null;
                if (!rect) return 0;
                const v = Number(rect.getAttribute('stroke-width'));
                return Number.isFinite(v) ? v : 0;
            };

            store.dispatch('PRESENTATION_NEXT');
            await waitFor(() => slideContentEl.getAttribute('data-pm-transition-status') === 'transitioning', 3000);
            /** @type {number[]} */
            const samples: number[] = [];
            while (slideContentEl.getAttribute('data-pm-transition-status') === 'transitioning') {
                samples.push(getStrokeWidth());
                await raf();
            }
            // After completion, destination should have no stroke-layer at all.
            await waitFor(() => slideContentEl.getAttribute('data-pm-transition-status') === 'idle', 10000);
            const view = slideContentEl.querySelector(`.slide-view[data-slide-id="${slide2Id}"]`) as HTMLElement | null;
            const hasStroke = Boolean(view?.querySelector(`.slide-element[data-element-id="${rectIdB}"] svg.stroke-layer rect`));
            return { samples, early: samples[0] ?? null, end: samples[samples.length - 1] ?? null, hasStrokeAfter: hasStroke };
        }, { rectIdB, slide2Id });

        if (monitor.early === null || monitor.end === null) throw new Error(`Missing samples: ${JSON.stringify(monitor)}`);
        expect(monitor.early).toBeGreaterThan(8);
        const samples = Array.isArray(monitor.samples) ? monitor.samples : [];
        expect(samples.some((v) => v > 1 && v < 11)).toBeTruthy();
        expect(monitor.hasStrokeAfter).toBeFalsy();

        await page.keyboard.press('Escape');
    });

    test('stroke + fill stay aligned during morph resize', async ({ page, getState }) => {
        const editor = new EditorPage(page);
        const canvas = new CanvasHelper(page);

        await editor.goto();
        await editor.waitForLoad();

        // Slide A: rectangle with a visible centered stroke.
        await editor.selectSlide(0);
        await page.keyboard.press('r');
        await canvas.drawRectangle(0.20, 0.22, 0.22, 0.16);
        await canvas.clickAt(0.31, 0.30);
        await expect
            .poll(async () => (await getState())?.editor?.selectedElementIds?.length || 0, { timeout: 3000 })
            .toBeGreaterThan(0);
        const rectIdA = (await getState())?.editor?.selectedElementIds?.[0];
        expect(rectIdA).toBeTruthy();

        const strokeSection = page.locator('.pi-section', { hasText: 'Stroke' });
        await strokeSection.locator('button[title="Add Stroke"]').click();
        const strokeRowA = strokeSection.locator('.stroke-row').first();
        await expect(strokeRowA).toBeVisible();
        await strokeRowA.locator('input.stroke-hex-input').fill('#FF0000');
        await strokeRowA.locator('input.stroke-hex-input').press('Enter');
        await strokeRowA.locator('.stroke-swatch-trigger').click();
        const flyoutA = page.locator('.ui-flyout');
        await expect(flyoutA).toBeVisible();
        const weightInputA = flyoutA.locator('xpath=.//*[normalize-space()="W"]/following-sibling::input[1]');
        await weightInputA.fill('12');
        await weightInputA.press('Enter');
        await canvas.clickAt(0.05, 0.05);

        // Duplicate slide.
        await canvas.clickAt(0.05, 0.05);
        await editor.selectSlide(0);
        const initialSlideCount = (await getState()).slideOrder.length;
        await page.keyboard.press('Control+d');
        await expect.poll(async () => (await getState()).slideOrder.length, { timeout: 5000 }).toBe(initialSlideCount + 1);

        // Slide B: resize the element (forces geometry animation).
        await editor.selectSlide(1);
        await editor.setActiveTool('select');
        await canvas.clickAt(0.31, 0.30);
        await expect
            .poll(async () => (await getState())?.editor?.selectedElementIds?.length || 0, { timeout: 3000 })
            .toBeGreaterThan(0);
        const rectIdB = (await getState())?.editor?.selectedElementIds?.[0];
        expect(rectIdB).toBeTruthy();

        // Resize by dragging a corner handle area.
        await canvas.resizeElement(0.42, 0.38, 0.66, 0.64);

        // Deselect so property inspector shows slide properties.
        await canvas.clickAt(0.05, 0.05);

        // Set Morph transition on destination slide.
        const transitionTrigger = editor.propertyInspector.locator('[data-testid="transition-picker-trigger"]');
        await transitionTrigger.click();
        const tf = page.locator('[data-testid="transition-picker-flyout"]');
        await tf.locator('[data-testid="transition-picker-option"]').filter({ hasText: /Morph/i }).first().click();
        await expect(tf).toBeHidden();

        // Back to Slide A.
        await editor.selectSlide(0);

        // Present windowed.
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
        await page.locator('[data-testid="present-windowed"]').click();

        const slide2Id = (await getState()).slideOrder[1];

        const monitor = await page.evaluate(async ({ rectIdB, slide2Id }) => {
            const slideContentEl = document.getElementById('slide-content');
            if (!slideContentEl) throw new Error('Missing #slide-content');
            const win = window as any;
            const store = win.__TEST_STORE__ || win._storyAppStore;
            if (!store) throw new Error('Test store not exposed');

            const raf = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            const waitFor = async (predicate: () => boolean, timeoutMs: number) => {
                const start = performance.now();
                while (performance.now() - start < timeoutMs) {
                    if (predicate()) return true;
                    await raf();
                }
                return false;
            };

            const getNodes = () => {
                const view = slideContentEl.querySelector(`.slide-view[data-slide-id="${slide2Id}"]`) as HTMLElement | null;
                const el = view?.querySelector(`.slide-element[data-element-id="${rectIdB}"]`) as HTMLElement | null;
                const rect = el?.querySelector('svg.stroke-layer rect') as SVGRectElement | null;
                return { el, rect };
            };

            store.dispatch('PRESENTATION_NEXT');
            await waitFor(() => slideContentEl.getAttribute('data-pm-transition-status') === 'transitioning', 3000);
            await waitFor(() => {
                const { el, rect } = getNodes();
                return Boolean(el && rect);
            }, 2000);

            let maxWidthDiff = 0;
            let maxHeightDiff = 0;
            let maxXDiff = 0;
            let maxYDiff = 0;
            let frames = 0;

            while (slideContentEl.getAttribute('data-pm-transition-status') === 'transitioning') {
                const { el, rect } = getNodes();
                if (!el || !rect) break;

                const elBox = el.getBoundingClientRect();
                const rectBox = rect.getBoundingClientRect();
                // In our renderer, the SVG stroke rect is laid out in the same box as the element.
                // (The rect's DOM bounding box here does not include stroke thickness.)
                const expectedW = elBox.width;
                const expectedH = elBox.height;
                const expectedX = elBox.x;
                const expectedY = elBox.y;

                maxWidthDiff = Math.max(maxWidthDiff, Math.abs(rectBox.width - expectedW));
                maxHeightDiff = Math.max(maxHeightDiff, Math.abs(rectBox.height - expectedH));
                maxXDiff = Math.max(maxXDiff, Math.abs(rectBox.x - expectedX));
                maxYDiff = Math.max(maxYDiff, Math.abs(rectBox.y - expectedY));

                frames++;
                await raf();
            }

            await waitFor(() => slideContentEl.getAttribute('data-pm-transition-status') === 'idle', 10000);

            return { maxWidthDiff, maxHeightDiff, maxXDiff, maxYDiff, frames };
        }, { rectIdB, slide2Id });

        // We should have observed multiple frames during a real morph.
        expect(monitor.frames).toBeGreaterThan(5);

        // Tight tolerance: stroke + fill must remain visually aligned (no width/height mismatch).
        expect(monitor.maxWidthDiff).toBeLessThan(2);
        expect(monitor.maxHeightDiff).toBeLessThan(2);
        expect(monitor.maxXDiff).toBeLessThan(2);
        expect(monitor.maxYDiff).toBeLessThan(2);

        await page.keyboard.press('Escape');
    });

    test('element code fill preserves timebase across morph when code matches', async ({ page, getState }) => {
        const editor = new EditorPage(page);
        const canvas = new CanvasHelper(page);

        await editor.goto();
        await editor.waitForLoad();

        // Slide A: create rectangle via UI.
        await editor.selectSlide(0);
        await editor.setActiveTool('shape');
        await canvas.drawRectangle(0.20, 0.20, 0.22, 0.18);

        // Open Fill Flyout and apply a code fill preset.
        await canvas.clickAt(0.30, 0.30);
        const fillSection = page.locator('.pi-section', { hasText: 'Fill' });
        await fillSection.locator('.fill-swatch-trigger').click();
        const fillFlyout = page.locator('.fill-flyout');
        await fillFlyout.locator('.fill-type-selector button[title="Code"]').click();
        await fillFlyout.locator('button[title^="Open Code Fill Panel"]').click();

        const panel = page.locator('.code-fill-panel');
        await expect(panel).toBeVisible();
        await panel.locator('.cfp-preset-card').first().click();

        // Switch to Custom and replace with deterministic code (avoids flaky presets).
        await panel.locator('.segmented-control button', { hasText: /Custom/i }).click();
        const deterministicCode = `// Deterministic time-based fill (alternates every 0.5s)\nfunction draw(time) {\n  const phase = Math.floor(time * 2) % 2;\n  ctx.clearRect(0, 0, width, height);\n  ctx.fillStyle = phase === 0 ? '#ff0000' : '#0000ff';\n  ctx.fillRect(0, 0, width, height);\n}`;
        const cm = panel.locator('.CodeMirror');
        await expect(cm).toBeVisible();
        // Set CodeMirror content atomically to avoid transient compilation errors while typing.
        await page.evaluate((code) => {
            const cmEl = document.querySelector('.code-fill-panel .CodeMirror');
            const cmInstance = cmEl && (cmEl as any).CodeMirror;
            if (!cmInstance) throw new Error('Missing CodeMirror instance');
            cmInstance.setValue(code);
        }, deterministicCode);

        // Give the panel debounce a moment to apply changes.
        await page.waitForTimeout(500);

        // Let the code fill animate for a bit so t is non-zero.
        await page.waitForTimeout(1200);

        // Close the code fill panel so keyboard shortcuts hit the editor, not CodeMirror.
        await panel.getByRole('button', { name: 'Close' }).click();

        // Duplicate slide and move the rectangle. Ensure focus is on the slide list
        // (Ctrl+D can also duplicate selected canvas elements).
        await canvas.clickAt(0.05, 0.05);
        await editor.selectSlide(0);
        const initialSlideCount = (await getState()).slideOrder.length;
        await page.keyboard.press('Control+d');
        await expect
            .poll(async () => (await getState()).slideOrder.length, { timeout: 5000 })
            .toBe(initialSlideCount + 1);

        // Capture slide ids for stable DOM targeting in presentation.
        const stateAfterDup = await getState();
        const slide1Id = (stateAfterDup.slideOrder as string[])[0];
        const slide2Id = (stateAfterDup.slideOrder as string[])[1];

        await editor.selectSlide(1);
        await editor.setActiveTool('select');
        await canvas.moveElement(0.30, 0.30, 0.62, 0.55);

        // Deselect so property inspector shows slide properties.
        await canvas.clickAt(0.05, 0.05);

        // Set Morph transition on destination slide.
        const transitionTrigger = editor.propertyInspector.locator('[data-testid="transition-picker-trigger"]');
        await transitionTrigger.click();
        const flyout = page.locator('[data-testid="transition-picker-flyout"]');
        await flyout.locator('[data-testid="transition-picker-option"]').filter({ hasText: /Morph/i }).first().click();
        await expect(flyout).toBeHidden();

        // Go back to Slide A.
        await editor.selectSlide(0);

        // Start presentation windowed.
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
        await page.locator('[data-testid="present-windowed"]').click();

        const nextBtn = page.locator('[data-testid="hud-next-btn"]');
        await expect(nextBtn).toHaveCount(1);

        const monitor = await page.evaluate(async ({ slide1Id, slide2Id }) => {
            const slideContentEl = document.getElementById('slide-content');
            if (!slideContentEl) throw new Error('Missing #slide-content');

            const win = window as any;
            const store = win.__TEST_STORE__ || win._storyAppStore;
            if (!store) throw new Error('Test store not exposed');

            const raf = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            const waitFor = async (predicate: () => boolean, timeoutMs: number) => {
                const start = performance.now();
                while (performance.now() - start < timeoutMs) {
                    if (predicate()) return true;
                    await raf();
                }
                return false;
            };

            const getView = (slideId: string) =>
                (slideContentEl.querySelector(`.slide-view[data-slide-id="${slideId}"]`) as HTMLElement | null);

            const pickElementCanvas = (view: HTMLElement | null) => {
                if (!view) return null;
                // Prefer explicit element-level code canvas if present, otherwise any element canvas.
                const preferred = view.querySelector('.slide-element canvas.code-canvas') as HTMLCanvasElement | null;
                if (preferred) return preferred;
                const any = view.querySelector('.slide-element canvas') as HTMLCanvasElement | null;
                return any;
            };

            const sampleCanvasCenter = (view: HTMLElement | null) => {
                const canvas = pickElementCanvas(view);
                if (!canvas) return null;
                if (!canvas.width || !canvas.height) return null;
                const ctx = canvas.getContext('2d');
                if (!ctx) return null;
                try {
                    const x = Math.floor(canvas.width / 2);
                    const y = Math.floor(canvas.height / 2);
                    const px = ctx.getImageData(x, y, 1, 1).data;
                    return [px[0], px[1], px[2], px[3]] as const;
                } catch {
                    return null;
                }
            };

            // Ensure we can sample something before starting.
            await waitFor(() => {
                return !!sampleCanvasCenter(getView(slide1Id));
            }, 3000);

            const beforePx = sampleCanvasCenter(getView(slide1Id));

            store.dispatch('PRESENTATION_NEXT');
            await waitFor(() => slideContentEl.getAttribute('data-pm-transition-status') === 'transitioning', 3000);

            // Wait for the incoming slide view to exist and have a code canvas.
            let incomingPx: readonly [number, number, number, number] | null = null;
            await waitFor(() => {
                const px = sampleCanvasCenter(getView(slide2Id));
                if (!px) return false;
                incomingPx = px;
                return true;
            }, 3000);

            const delta = (a: readonly number[], b: readonly number[]) =>
                Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

            return {
                beforePx,
                incomingPx,
                delta: beforePx && incomingPx ? delta(beforePx, incomingPx) : null
            };
        }, { slide1Id, slide2Id });

        expect(monitor.beforePx).not.toBeNull();
        expect(monitor.incomingPx).not.toBeNull();
        expect(monitor.delta).not.toBeNull();

        // If the code runner restarts, the center pixel typically snaps to the t=0 palette.
        // When preserving timebase, the pixel should remain close across the slide handoff.
        expect((monitor.delta as number) < 120).toBe(true);

        // Exit presentation.
        await page.keyboard.press('Escape');
    });
});
