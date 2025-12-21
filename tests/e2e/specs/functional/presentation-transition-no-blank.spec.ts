import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * Regression: slide transitions must not show a blank stage frame.
 *
 * We set two slides with non-white solid backgrounds and force a transform-based
 * transition. During the transition we sample the top-most non-transparent
 * background color at the center of #slide-content on every animation frame.
 * The sample must always be one of the slide colors (never the stage/background).
 */

test.describe('Presentation transitions', () => {
    test('should never show a blank stage frame during cover transition', async ({ page, getState, dispatchAction }) => {
        const editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();

        // Ensure we have at least 2 slides and start on slide 0.
        let state = await getState();
        while ((state.slideOrder?.length || 0) < 2) {
            await dispatchAction('ADD_SLIDE');
            state = await getState();
        }

        // Always use slide indices 0 -> 1 for a deterministic "Next".
        const slide1Id = (state.slideOrder as string[])[0];
        const slide2Id = (state.slideOrder as string[])[1];

        await dispatchAction('SET_ACTIVE_SLIDE', slide1Id);
        await expect
            .poll(async () => (await getState()).editor.activeSlideId, { timeout: 3000 })
            .toBe(slide1Id);

        // Make slide backgrounds deterministic (non-white) so a blank frame is detectable.
        await dispatchAction('UPDATE_SLIDE', { id: slide1Id, background: { type: 'solid', value: '#ff0000' } });
        await dispatchAction('UPDATE_SLIDE', { id: slide2Id, background: { type: 'solid', value: '#0000ff' } });

        // Force a transform-based transition (covers are where the white flash was reported).
        await dispatchAction('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
            slideId: slide2Id,
            styleAssignments: {
                slideTransition: { type: 'cover', direction: 'right', durationMs: 900, easing: 'linear' }
            }
        });

        // Start presentation in windowed mode.
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
        await page.locator('[data-testid="present-windowed"]').click();

        await expect
            .poll(async () => (await getState()).editor.mode, { timeout: 5000 })
            .toBe('presentation');

        const slideContent = page.locator('#slide-content');

        // Some runs can enter presentation on a non-zero slide index (e.g., last active slide).
        // Force presentation to start at index 0 so "Next" produces a transition.
        const currentIndex = (await getState()).presentation.currentSlideIndex;
        if (currentIndex !== 0) {
            await dispatchAction('PRESENTATION_GOTO', 0);
        }
        await expect
            .poll(async () => (await getState()).presentation.currentSlideIndex, { timeout: 5000 })
            .toBe(0);

        await expect(slideContent).toHaveAttribute('data-pm-transition-status', 'idle');

        // Ensure the first slide is mounted.
        await expect(page.locator(`#slide-content .slide-view[data-slide-id="${slide1Id}"]`)).toHaveCount(1);

        // Run navigation + monitoring in a single page.evaluate.
        // Playwright serializes page.evaluate calls, so a long-running monitor would
        // otherwise block the dispatch that triggers the transition.
        const monitor = await page.evaluate(async () => {
            const slideContentEl = document.getElementById('slide-content');
            if (!slideContentEl) throw new Error('Missing #slide-content');

            const win = window as any;
            const store = win.__TEST_STORE__ || win._storyAppStore;
            if (!store) throw new Error('Test store not exposed');

            const expected = new Set(['rgb(255,0,0)', 'rgb(0,0,255)']);

            const normalize = (c: string) => c.replace(/\s+/g, '').toLowerCase();

            const raf = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

            const backgroundAtPointFromSlides = (x: number, y: number) => {
                const views = Array.from(slideContentEl.querySelectorAll('.slide-view')) as HTMLElement[];

                // Collect slide views that geometrically cover the sample point.
                const covering = views
                    .map((view) => {
                        const rect = view.getBoundingClientRect();
                        const style = getComputedStyle(view);
                        const opacity = Number(style.opacity);
                        const z = Number(style.zIndex);

                        const isVisible =
                            style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            !(Number.isFinite(opacity) && opacity <= 0);

                        const covers = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

                        return {
                            view,
                            covers: isVisible && covers,
                            zIndex: Number.isFinite(z) ? z : 0
                        };
                    })
                    .filter((item) => item.covers);

                if (covering.length === 0) {
                    return { bg: 'blank', viewCount: views.length };
                }

                // Pick the top-most slide by z-index; if equal, later in DOM wins.
                covering.sort((a, b) => {
                    if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
                    return 0;
                });
                const top = covering[covering.length - 1].view;

                const bgLayer = top.querySelector('.bg-layer') as HTMLElement | null;
                const bg = bgLayer ? getComputedStyle(bgLayer).backgroundColor : 'missing-bg-layer';
                return { bg, viewCount: views.length };
            };

            let sawStatusNonIdle = false;
            const statusChanges: Array<{ t: number; status: string | null }> = [];
            const observer = new MutationObserver(() => {
                const status = slideContentEl.getAttribute('data-pm-transition-status');
                statusChanges.push({ t: performance.now(), status });
                if (status && status !== 'idle') sawStatusNonIdle = true;
            });
            observer.observe(slideContentEl, { attributes: true, attributeFilter: ['data-pm-transition-status'] });

            let minSlideViews = Number.POSITIVE_INFINITY;
            let maxSlideViews = 0;
            let sawUnexpectedBackground = false;
            const unexpectedSamples: Array<{ t: number; bg: string }>
                = [];
            const debugFrames: Array<{
                t: number;
                bg: string;
                center: { x: number; y: number };
                views: Array<{ id: string | null; z: string; visibility: string; display: string; opacity: string; transform: string; rect: { l: number; t: number; r: number; b: number; w: number; h: number } }>;
            }> = [];

            // Trigger the slide navigation.
            store.dispatch('PRESENTATION_NEXT');

            // Sample for ~2 seconds (120 frames at 60hz) after navigation dispatch.
            // This window should include the transition period if any, and will still
            // catch single-frame flashes.
            for (let i = 0; i < 120; i++) {
                const rect = slideContentEl.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;

                const sample = backgroundAtPointFromSlides(x, y);
                const bg = sample.bg;
                const n = normalize(bg);

                const viewCount = sample.viewCount;
                minSlideViews = Math.min(minSlideViews, viewCount);
                maxSlideViews = Math.max(maxSlideViews, viewCount);

                // 'blank' means no slide covered the sample point.
                if (bg === 'blank' || !expected.has(n)) {
                    sawUnexpectedBackground = true;
                    if (unexpectedSamples.length < 6) {
                        unexpectedSamples.push({ t: performance.now(), bg });
                    }

                    if (debugFrames.length < 2) {
                        const views = Array.from(slideContentEl.querySelectorAll('.slide-view')) as HTMLElement[];
                        debugFrames.push({
                            t: performance.now(),
                            bg,
                            center: { x, y },
                            views: views.map((view) => {
                                const rect = view.getBoundingClientRect();
                                const style = getComputedStyle(view);
                                return {
                                    id: view.getAttribute('data-slide-id'),
                                    z: style.zIndex,
                                    visibility: style.visibility,
                                    display: style.display,
                                    opacity: style.opacity,
                                    transform: style.transform,
                                    rect: {
                                        l: rect.left,
                                        t: rect.top,
                                        r: rect.right,
                                        b: rect.bottom,
                                        w: rect.width,
                                        h: rect.height
                                    }
                                };
                            })
                        });
                    }
                }

                await raf();
            }

            observer.disconnect();

            if (!Number.isFinite(minSlideViews)) minSlideViews = 0;

            return {
                sawStatusNonIdle,
                statusChanges,
                sawUnexpectedBackground,
                minSlideViews,
                maxSlideViews,
                unexpectedSamples
                ,
                debugFrames
            };
        });

        // For transform transitions we expect both outgoing and incoming slide views
        // to exist at some point during the sampled window.
        expect(monitor.maxSlideViews).toBeGreaterThanOrEqual(2);
        expect(
            monitor.sawUnexpectedBackground,
            JSON.stringify({ unexpectedSamples: monitor.unexpectedSamples, debugFrames: monitor.debugFrames })
        ).toBe(false);

        // Sanity: we should end on slide2.
        await expect
            .poll(async () => (await getState()).presentation.currentSlideIndex, { timeout: 5000 })
            .toBe(1);
    });

    test('should never show a blank stage frame during morph transition', async ({ page, getState, dispatchAction }) => {
        const editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();

        // Ensure we have at least 2 slides and start on slide 0.
        let state = await getState();
        while ((state.slideOrder?.length || 0) < 2) {
            await dispatchAction('ADD_SLIDE');
            state = await getState();
        }

        // Always use slide indices 0 -> 1 for a deterministic "Next".
        const slide1Id = (state.slideOrder as string[])[0];
        const slide2Id = (state.slideOrder as string[])[1];

        await dispatchAction('SET_ACTIVE_SLIDE', slide1Id);
        await expect
            .poll(async () => (await getState()).editor.activeSlideId, { timeout: 3000 })
            .toBe(slide1Id);

        // Make slide backgrounds deterministic (non-white) so a blank frame is detectable.
        await dispatchAction('UPDATE_SLIDE', { id: slide1Id, background: { type: 'solid', value: '#ff0000' } });
        await dispatchAction('UPDATE_SLIDE', { id: slide2Id, background: { type: 'solid', value: '#0000ff' } });

        // Add a named L0 element to both slides so morph can deterministically match.
        // (VisualElement exposes this as data-layer-name for runtime + DOM validation.)
        const ensureMorphElement = async (slideId: string, x: number, y: number) => {
            const current = await getState();
            const slide = current.slides?.[slideId];
            const existing = slide?.elements || {};
            const order: string[] = Array.isArray(slide?.elementOrder) ? slide.elementOrder : [];

            await dispatchAction('UPDATE_SLIDE', {
                id: slideId,
                elements: {
                    ...existing,
                    __pw_morph_box: {
                        id: '__pw_morph_box',
                        name: 'Box',
                        type: 'rect',
                        x,
                        y,
                        width: 120,
                        height: 80,
                        rotation: 0,
                        style: { fills: [{ type: 'solid', value: '#00ff00', opacity: 100, visible: true }] }
                    }
                },
                elementOrder: Array.from(new Set([...order, '__pw_morph_box']))
            });
        };

        await ensureMorphElement(slide1Id, 40, 40);
        await ensureMorphElement(slide2Id, 120, 80);

        // Configure morph on the target slide.
        await dispatchAction('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
            slideId: slide2Id,
            styleAssignments: {
                slideTransition: { type: 'morph', durationMs: 900, easing: 'linear' }
            }
        });

        // Start presentation in windowed mode.
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
        await page.locator('[data-testid="present-windowed"]').click();

        await expect
            .poll(async () => (await getState()).editor.mode, { timeout: 5000 })
            .toBe('presentation');

        const slideContent = page.locator('#slide-content');

        // Some runs can enter presentation on a non-zero slide index (e.g., last active slide).
        // Force presentation to start at index 0 so "Next" produces a transition.
        const currentIndex = (await getState()).presentation.currentSlideIndex;
        if (currentIndex !== 0) {
            await dispatchAction('PRESENTATION_GOTO', 0);
        }
        await expect
            .poll(async () => (await getState()).presentation.currentSlideIndex, { timeout: 5000 })
            .toBe(0);

        await expect(slideContent).toHaveAttribute('data-pm-transition-status', 'idle');
        await expect(page.locator(`#slide-content .slide-view[data-slide-id="${slide1Id}"]`)).toHaveCount(1);

        // Run navigation + monitoring in a single page.evaluate.
        const monitor = await page.evaluate(async () => {
            const slideContentEl = document.getElementById('slide-content');
            if (!slideContentEl) throw new Error('Missing #slide-content');

            const win = window as any;
            const store = win.__TEST_STORE__ || win._storyAppStore;
            if (!store) throw new Error('Test store not exposed');

            const expected = new Set(['rgb(255,0,0)', 'rgb(0,0,255)']);
            const normalize = (c: string) => c.replace(/\s+/g, '').toLowerCase();
            const raf = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

            const backgroundAtPointFromSlides = (x: number, y: number) => {
                const views = Array.from(slideContentEl.querySelectorAll('.slide-view')) as HTMLElement[];

                const covering = views
                    .map((view) => {
                        const rect = view.getBoundingClientRect();
                        const style = getComputedStyle(view);
                        const opacity = Number(style.opacity);
                        const z = Number(style.zIndex);

                        const isVisible =
                            style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            !(Number.isFinite(opacity) && opacity <= 0);

                        const covers = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

                        return {
                            view,
                            covers: isVisible && covers,
                            zIndex: Number.isFinite(z) ? z : 0
                        };
                    })
                    .filter((item) => item.covers);

                if (covering.length === 0) {
                    return { bg: 'blank', viewCount: views.length };
                }

                covering.sort((a, b) => {
                    if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
                    return 0;
                });
                const top = covering[covering.length - 1].view;

                const bgLayer = top.querySelector('.bg-layer') as HTMLElement | null;
                const bg = bgLayer ? getComputedStyle(bgLayer).backgroundColor : 'missing-bg-layer';
                return { bg, viewCount: views.length };
            };

            let minSlideViews = Number.POSITIVE_INFINITY;
            let maxSlideViews = 0;
            let sawUnexpectedBackground = false;
            const unexpectedSamples: Array<{ t: number; bg: string }> = [];
            const debugFrames: Array<{
                t: number;
                bg: string;
                center: { x: number; y: number };
                views: Array<{ id: string | null; z: string; visibility: string; display: string; opacity: string; transform: string; rect: { l: number; t: number; r: number; b: number; w: number; h: number } }>;
            }> = [];

            // Trigger the slide navigation.
            store.dispatch('PRESENTATION_NEXT');

            for (let i = 0; i < 120; i++) {
                const rect = slideContentEl.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;

                const sample = backgroundAtPointFromSlides(x, y);
                const bg = sample.bg;
                const n = normalize(bg);

                const viewCount = sample.viewCount;
                minSlideViews = Math.min(minSlideViews, viewCount);
                maxSlideViews = Math.max(maxSlideViews, viewCount);

                if (bg === 'blank' || !expected.has(n)) {
                    sawUnexpectedBackground = true;
                    if (unexpectedSamples.length < 6) {
                        unexpectedSamples.push({ t: performance.now(), bg });
                    }

                    if (debugFrames.length < 2) {
                        const views = Array.from(slideContentEl.querySelectorAll('.slide-view')) as HTMLElement[];
                        debugFrames.push({
                            t: performance.now(),
                            bg,
                            center: { x, y },
                            views: views.map((view) => {
                                const rect = view.getBoundingClientRect();
                                const style = getComputedStyle(view);
                                return {
                                    id: view.getAttribute('data-slide-id'),
                                    z: style.zIndex,
                                    visibility: style.visibility,
                                    display: style.display,
                                    opacity: style.opacity,
                                    transform: style.transform,
                                    rect: {
                                        l: rect.left,
                                        t: rect.top,
                                        r: rect.right,
                                        b: rect.bottom,
                                        w: rect.width,
                                        h: rect.height
                                    }
                                };
                            })
                        });
                    }
                }

                await raf();
            }

            if (!Number.isFinite(minSlideViews)) minSlideViews = 0;

            return {
                sawUnexpectedBackground,
                minSlideViews,
                maxSlideViews,
                unexpectedSamples,
                debugFrames
            };
        });

        expect(monitor.maxSlideViews).toBeGreaterThanOrEqual(2);
        expect(
            monitor.sawUnexpectedBackground,
            JSON.stringify({ unexpectedSamples: monitor.unexpectedSamples, debugFrames: monitor.debugFrames })
        ).toBe(false);

        // Sanity: we should end on slide2.
        await expect
            .poll(async () => (await getState()).presentation.currentSlideIndex, { timeout: 5000 })
            .toBe(1);

        // Morph evidence: the incoming slide view should expose match count and layer-name hooks.
        const slide2View = page.locator(`#slide-content .slide-view[data-slide-id="${slide2Id}"]`);
        await expect(slide2View).toHaveCount(1);
        await expect(slide2View).toHaveAttribute('data-morph-match-count', '1');
        await expect(
            slide2View.locator(`.slide-element[data-element-id="__pw_morph_box"][data-layer-name="Box"]`)
        ).toHaveCount(1);
    });

    test('should deterministically match top-most duplicate names during morph transition', async ({ page, getState, dispatchAction }) => {
        const editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();

        // Ensure we have at least 2 slides and start on slide 0.
        let state = await getState();
        while ((state.slideOrder?.length || 0) < 2) {
            await dispatchAction('ADD_SLIDE');
            state = await getState();
        }

        const slide1Id = (state.slideOrder as string[])[0];
        const slide2Id = (state.slideOrder as string[])[1];

        await dispatchAction('SET_ACTIVE_SLIDE', slide1Id);
        await expect
            .poll(async () => (await getState()).editor.activeSlideId, { timeout: 3000 })
            .toBe(slide1Id);

        // Deterministic backgrounds (also keeps this spec aligned with the no-blank regression suite intent).
        await dispatchAction('UPDATE_SLIDE', { id: slide1Id, background: { type: 'solid', value: '#ff0000' } });
        await dispatchAction('UPDATE_SLIDE', { id: slide2Id, background: { type: 'solid', value: '#0000ff' } });

        // Add two L0 elements with the same name on each slide.
        // The higher index in elementOrder is considered top-most by the matching algorithm.
        const ensureMorphDuplicateElements = async (slideId: string, ax: number, ay: number, bx: number, by: number) => {
            const current = await getState();
            const slide = current.slides?.[slideId];
            const existing = slide?.elements || {};
            const order: string[] = Array.isArray(slide?.elementOrder) ? slide.elementOrder : [];

            await dispatchAction('UPDATE_SLIDE', {
                id: slideId,
                elements: {
                    ...existing,
                    __pw_morph_box_a: {
                        id: '__pw_morph_box_a',
                        name: 'Box',
                        type: 'rect',
                        x: ax,
                        y: ay,
                        width: 120,
                        height: 80,
                        rotation: 0,
                        style: { fills: [{ type: 'solid', value: '#00ff00', opacity: 100, visible: true }] }
                    },
                    __pw_morph_box_b: {
                        id: '__pw_morph_box_b',
                        name: 'Box',
                        type: 'rect',
                        x: bx,
                        y: by,
                        width: 120,
                        height: 80,
                        rotation: 0,
                        style: { fills: [{ type: 'solid', value: '#00ff00', opacity: 100, visible: true }] }
                    }
                },
                // Ensure both ids exist, with _b last so it is top-most.
                elementOrder: Array.from(new Set([...order.filter((id) => id !== '__pw_morph_box_a' && id !== '__pw_morph_box_b'), '__pw_morph_box_a', '__pw_morph_box_b']))
            });
        };

        await ensureMorphDuplicateElements(slide1Id, 40, 40, 220, 60);
        await ensureMorphDuplicateElements(slide2Id, 120, 80, 260, 120);

        await dispatchAction('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
            slideId: slide2Id,
            styleAssignments: {
                slideTransition: { type: 'morph', durationMs: 900, easing: 'linear' }
            }
        });

        // Start presentation in windowed mode.
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
        await page.locator('[data-testid="present-windowed"]').click();

        await expect
            .poll(async () => (await getState()).editor.mode, { timeout: 5000 })
            .toBe('presentation');

        // Force presentation to start at index 0 so "Next" produces a transition.
        const currentIndex = (await getState()).presentation.currentSlideIndex;
        if (currentIndex !== 0) {
            await dispatchAction('PRESENTATION_GOTO', 0);
        }
        await expect
            .poll(async () => (await getState()).presentation.currentSlideIndex, { timeout: 5000 })
            .toBe(0);

        // Trigger navigation.
        await page.evaluate(async () => {
            const win = window as any;
            const store = win.__TEST_STORE__ || win._storyAppStore;
            if (!store) throw new Error('Test store not exposed');
            store.dispatch('PRESENTATION_NEXT');
        });

        await expect
            .poll(async () => (await getState()).presentation.currentSlideIndex, { timeout: 5000 })
            .toBe(1);

        const slide2View = page.locator(`#slide-content .slide-view[data-slide-id="${slide2Id}"]`);
        await expect(slide2View).toHaveCount(1);

        // Only one match should be selected for the duplicate name.
        await expect(slide2View).toHaveAttribute('data-morph-match-count', '1');

        // Deterministic rule: top-most duplicate ("_b") is selected on both sides.
        const matchedDst = slide2View.locator(`.slide-element[data-element-id="__pw_morph_box_b"][data-layer-name="Box"][data-morph-match-key="Box"]`);
        await expect(matchedDst).toHaveCount(1);
        await expect(matchedDst).toHaveAttribute('data-morph-match-src-id', '__pw_morph_box_b');
        await expect(matchedDst).toHaveAttribute('data-morph-match-dst-id', '__pw_morph_box_b');
        await expect(matchedDst).toHaveAttribute('data-morph-match-src-dup', '1');
        await expect(matchedDst).toHaveAttribute('data-morph-match-dst-dup', '1');

        // The non-top-most duplicate should not be marked as the chosen match.
        await expect(
            slide2View.locator(`.slide-element[data-element-id="__pw_morph_box_a"][data-morph-match-key="Box"]`)
        ).toHaveCount(0);
    });
});
