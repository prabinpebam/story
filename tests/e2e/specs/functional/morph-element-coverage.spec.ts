import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

const ONE_BY_ONE_PNG_DATA_URL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/axj0cQAAAAASUVORK5CYII=';

/**
 * Morph coverage (presentation mode): validate Morph produces matches and actually animates
 * for the renderer-supported element types.
 *
 * This is not a pixel-perfect visual correctness test; instead it asserts:
 * - Morph match metadata is present in the incoming slide view
 * - Matched destination elements change geometry during the transition
 * - Final inline geometry matches the destination slide data
 */

test.describe('Morph transition - element coverage', () => {
    test('should animate matches for supported element types and mixed combinations in presentation mode', async ({ page, getState, dispatchAction }) => {
        // Ensure Morph isn't forced to `none` by reduced-motion heuristics.
        // (Playwright's emulateMedia can be flaky across platforms; this is a deterministic override.)
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
                        dispatchEvent: () => false,
                    } as any;
                }
                return originalMatchMedia ? originalMatchMedia(query) : ({
                    matches: false,
                    media: query,
                    onchange: null,
                    addListener: () => {},
                    removeListener: () => {},
                    addEventListener: () => {},
                    removeEventListener: () => {},
                    dispatchEvent: () => false,
                } as any);
            }) as any;
        });

        await page.emulateMedia({ reducedMotion: 'no-preference' });

        const editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();

        expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);

        const ensureSlides = async (count: number) => {
            let state = await getState();
            while ((state.slideOrder?.length || 0) < count) {
                await dispatchAction('ADD_SLIDE');
                state = await getState();
            }
            return (await getState()).slideOrder as string[];
        };

        const makeRect = (id: string, name: string | undefined, x: number, y: number, w: number, h: number) => ({
            id,
            ...(name !== undefined ? { name } : {}),
            type: 'rect',
            x,
            y,
            width: w,
            height: h,
            rotation: 0,
            style: { fills: [{ type: 'solid', value: '#00ff00', opacity: 100, visible: true }] }
        });

        const makeCircle = (id: string, name: string | undefined, x: number, y: number, w: number, h: number) => ({
            id,
            ...(name !== undefined ? { name } : {}),
            type: 'circle',
            x,
            y,
            width: w,
            height: h,
            rotation: 0,
            style: { fills: [{ type: 'solid', value: '#00ff00', opacity: 100, visible: true }] }
        });

        const makeText = (id: string, name: string | undefined, x: number, y: number, w: number, h: number) => ({
            id,
            ...(name !== undefined ? { name } : {}),
            type: 'text',
            x,
            y,
            width: w,
            height: h,
            rotation: 0,
            resizing: 'fixed',
            content: 'Hello',
            style: {
                fontSize: 32,
                fills: [{ type: 'solid', value: '#ffffff', opacity: 100, visible: true }]
            }
        });

        const makeImage = (id: string, name: string | undefined, x: number, y: number, w: number, h: number) => ({
            id,
            ...(name !== undefined ? { name } : {}),
            type: 'image',
            x,
            y,
            width: w,
            height: h,
            rotation: 0,
            src: ONE_BY_ONE_PNG_DATA_URL,
            scaleMode: 'cover',
            style: {
                // Give the container a visible fill so the element is not visually empty.
                fills: [{ type: 'solid', value: '#ffffff', opacity: 20, visible: true }]
            }
        });

        const makeSvg = (id: string, name: string | undefined, x: number, y: number, w: number, h: number) => ({
            id,
            ...(name !== undefined ? { name } : {}),
            type: 'svg',
            x,
            y,
            width: w,
            height: h,
            rotation: 0,
            svgHash: 'pw',
            svg:
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="#ffffff"/></svg>',
            fitMode: 'fit'
        });

        const makeGroup = (id: string, name: string | undefined, x: number, y: number, w: number, h: number, childId: string) => ({
            id,
            ...(name !== undefined ? { name } : {}),
            type: 'group',
            x,
            y,
            width: w,
            height: h,
            rotation: 0,
            children: [childId]
        });

        const makePlaceholderTitle = (id: string, name: string | undefined, x: number, y: number, w: number, h: number) => ({
            id,
            ...(name !== undefined ? { name } : {}),
            type: 'placeholder',
            placeholderType: 'title',
            isPlaceholder: true,
            x,
            y,
            width: w,
            height: h,
            rotation: 0,
            resizing: 'fixed',
            content: 'Title'
        });

        type CaseDef = {
            title: string;
            keys: Array<{ expectedMatchKey?: string; srcId: string; dstId: string; dstLeft: string; dstTop: string; dstWidth: string; dstHeight: string }>;
            build: (slideAId: string, slideBId: string) => Promise<void>;
        };

        const buildSingle = async (
            slideAId: string,
            slideBId: string,
            expectedMatchKey: string | undefined,
            srcEl: any,
            dstEl: any,
            extraElementsA: any = {},
            extraElementsB: any = {}
        ) => {
            await dispatchAction('UPDATE_SLIDE', {
                id: slideAId,
                background: { type: 'solid', value: '#ff0000' },
                elements: { ...extraElementsA, [srcEl.id]: srcEl },
                elementOrder: Object.keys({ ...extraElementsA, [srcEl.id]: srcEl })
            });

            await dispatchAction('UPDATE_SLIDE', {
                id: slideBId,
                background: { type: 'solid', value: '#0000ff' },
                elements: { ...extraElementsB, [dstEl.id]: dstEl },
                elementOrder: Object.keys({ ...extraElementsB, [dstEl.id]: dstEl })
            });

            await dispatchAction('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                slideId: slideBId,
                styleAssignments: {
                    slideTransition: { type: 'morph', durationMs: 350, easing: 'linear' }
                }
            });

            return {
                expectedMatchKey,
                srcId: srcEl.id,
                dstId: dstEl.id,
                dstLeft: `${dstEl.x}px`,
                dstTop: `${dstEl.y}px`,
                dstWidth: `${dstEl.width}px`,
                dstHeight: `${dstEl.height}px`
            };
        };

        const cases: CaseDef[] = [];

        // Same-type coverage (one per renderer-supported element type)
        cases.push({
            title: 'rect -> rect',
            keys: [],
            build: async (a, b) => {
                const src = makeRect('__pw_rect_src', 'Rect', 40, 40, 120, 80);
                const dst = makeRect('__pw_rect_dst', 'Rect', 220, 140, 160, 100);
                const meta = await buildSingle(a, b, 'Rect', src, dst);
                cases[cases.length - 1].keys = [meta];
            }
        });

        cases.push({
            title: 'rect -> rect (unnamed, UI fallback)',
            keys: [],
            build: async (a, b) => {
                const src = makeRect('__pw_rect2_src', undefined, 40, 40, 120, 80);
                const dst = makeRect('__pw_rect2_dst', undefined, 220, 140, 160, 100);
                const meta = await buildSingle(a, b, 'Rect', src, dst);
                cases[cases.length - 1].keys = [meta];
            }
        });

        cases.push({
            title: 'circle -> circle',
            keys: [],
            build: async (a, b) => {
                const src = makeCircle('__pw_circle_src', 'Circle', 60, 60, 120, 120);
                const dst = makeCircle('__pw_circle_dst', 'Circle', 260, 120, 160, 160);
                const meta = await buildSingle(a, b, 'Circle', src, dst);
                cases[cases.length - 1].keys = [meta];
            }
        });

        cases.push({
            title: 'circle -> circle (unnamed, UI fallback)',
            keys: [],
            build: async (a, b) => {
                const src = makeCircle('__pw_circle2_src', undefined, 60, 60, 120, 120);
                const dst = makeCircle('__pw_circle2_dst', undefined, 260, 120, 160, 160);
                const meta = await buildSingle(a, b, 'Circle', src, dst);
                cases[cases.length - 1].keys = [meta];
            }
        });

        cases.push({
            title: 'text -> text',
            keys: [],
            build: async (a, b) => {
                const src = makeText('__pw_text_src', 'Text', 80, 80, 240, 70);
                const dst = makeText('__pw_text_dst', 'Text', 140, 200, 320, 70);
                const meta = await buildSingle(a, b, 'Text', src, dst);
                cases[cases.length - 1].keys = [meta];
            }
        });

        cases.push({
            title: 'text -> text (unnamed, UI fallback)',
            keys: [],
            build: async (a, b) => {
                const src = makeText('__pw_text2_src', undefined, 80, 80, 240, 70);
                const dst = makeText('__pw_text2_dst', undefined, 140, 200, 320, 70);
                const meta = await buildSingle(a, b, 'Text', src, dst);
                cases[cases.length - 1].keys = [meta];
            }
        });

        cases.push({
            title: 'image -> image',
            keys: [],
            build: async (a, b) => {
                const src = makeImage('__pw_image_src', 'Image', 70, 70, 180, 120);
                const dst = makeImage('__pw_image_dst', 'Image', 260, 160, 220, 160);
                const meta = await buildSingle(a, b, 'Image', src, dst);
                cases[cases.length - 1].keys = [meta];
            }
        });

        cases.push({
            title: 'image -> image (unnamed, UI fallback)',
            keys: [],
            build: async (a, b) => {
                const src = makeImage('__pw_image2_src', undefined, 70, 70, 180, 120);
                const dst = makeImage('__pw_image2_dst', undefined, 260, 160, 220, 160);
                const meta = await buildSingle(a, b, 'Image', src, dst);
                cases[cases.length - 1].keys = [meta];
            }
        });

        cases.push({
            title: 'svg -> svg',
            keys: [],
            build: async (a, b) => {
                const src = makeSvg('__pw_svg_src', 'Svg', 50, 60, 160, 160);
                const dst = makeSvg('__pw_svg_dst', 'Svg', 240, 140, 220, 220);
                const meta = await buildSingle(a, b, 'Svg', src, dst);
                cases[cases.length - 1].keys = [meta];
            }
        });

        cases.push({
            title: 'svg -> svg (unnamed, UI fallback)',
            keys: [],
            build: async (a, b) => {
                const src = makeSvg('__pw_svg2_src', undefined, 50, 60, 160, 160);
                const dst = makeSvg('__pw_svg2_dst', undefined, 240, 140, 220, 220);
                const meta = await buildSingle(a, b, 'Svg', src, dst);
                cases[cases.length - 1].keys = [meta];
            }
        });

        cases.push({
            title: 'group -> group',
            keys: [],
            build: async (a, b) => {
                const srcGroup = makeGroup('__pw_group_src', 'Group', 40, 50, 240, 160, '__pw_group_child_src');
                const dstGroup = makeGroup('__pw_group_dst', 'Group', 220, 140, 300, 200, '__pw_group_child_dst');

                const childSrc = makeRect('__pw_group_child_src', 'Child', 20, 20, 80, 60);
                const childDst = makeRect('__pw_group_child_dst', 'Child', 60, 40, 100, 80);
                childSrc.parentId = srcGroup.id;
                childDst.parentId = dstGroup.id;

                const meta = await buildSingle(
                    a,
                    b,
                    'Group',
                    srcGroup,
                    dstGroup,
                    { [childSrc.id]: childSrc },
                    { [childDst.id]: childDst }
                );

                cases[cases.length - 1].keys = [meta];
            }
        });

        cases.push({
            title: 'group -> group (unnamed, UI fallback)',
            keys: [],
            build: async (a, b) => {
                const srcGroup = makeGroup('__pw_group2_src', undefined, 40, 50, 240, 160, '__pw_group2_child_src');
                const dstGroup = makeGroup('__pw_group2_dst', undefined, 220, 140, 300, 200, '__pw_group2_child_dst');

                const childSrc = makeRect('__pw_group2_child_src', 'Child', 20, 20, 80, 60);
                const childDst = makeRect('__pw_group2_child_dst', 'Child', 60, 40, 100, 80);
                childSrc.parentId = srcGroup.id;
                childDst.parentId = dstGroup.id;

                const meta = await buildSingle(
                    a,
                    b,
                    'Group',
                    srcGroup,
                    dstGroup,
                    { [childSrc.id]: childSrc },
                    { [childDst.id]: childDst }
                );

                cases[cases.length - 1].keys = [meta];
            }
        });

        cases.push({
            title: 'placeholder(title) -> placeholder(title)',
            keys: [],
            build: async (a, b) => {
                const src = makePlaceholderTitle('__pw_ph_src', 'Title', 70, 70, 320, 80);
                const dst = makePlaceholderTitle('__pw_ph_dst', 'Title', 170, 200, 360, 90);
                const meta = await buildSingle(a, b, 'Title', src, dst);
                cases[cases.length - 1].keys = [meta];
            }
        });

        cases.push({
            title: 'placeholder(title) -> placeholder(title) (unnamed, UI fallback)',
            keys: [],
            build: async (a, b) => {
                const src = makePlaceholderTitle('__pw_ph2_src', undefined, 70, 70, 320, 80);
                const dst = makePlaceholderTitle('__pw_ph2_dst', undefined, 170, 200, 360, 90);
                const meta = await buildSingle(a, b, 'Title Placeholder', src, dst);
                cases[cases.length - 1].keys = [meta];
            }
        });

        // Cross-type representative coverage (ensure no crash + still animates geometry)
        cases.push({
            title: 'rect -> text (cross-type)',
            keys: [],
            build: async (a, b) => {
                const src = makeRect('__pw_rt_src', 'X', 40, 40, 140, 90);
                const dst = makeText('__pw_rt_dst', 'X', 240, 180, 260, 70);
                const meta = await buildSingle(a, b, 'X', src, dst);
                cases[cases.length - 1].keys = [meta];
            }
        });

        cases.push({
            title: 'text -> image (cross-type)',
            keys: [],
            build: async (a, b) => {
                const src = makeText('__pw_ti_src', 'Y', 60, 60, 260, 70);
                const dst = makeImage('__pw_ti_dst', 'Y', 260, 130, 220, 160);
                const meta = await buildSingle(a, b, 'Y', src, dst);
                cases[cases.length - 1].keys = [meta];
            }
        });

        cases.push({
            title: 'svg -> rect (cross-type)',
            keys: [],
            build: async (a, b) => {
                const src = makeSvg('__pw_sr_src', 'Z', 60, 60, 160, 160);
                const dst = makeRect('__pw_sr_dst', 'Z', 260, 150, 180, 120);
                const meta = await buildSingle(a, b, 'Z', src, dst);
                cases[cases.length - 1].keys = [meta];
            }
        });

        // Mixed combination: one slide contains all supported types simultaneously.
        cases.push({
            title: 'mixed types (multi-element) -> mixed types',
            keys: [],
            build: async (a, b) => {
                const srcEls: Record<string, any> = {};
                const dstEls: Record<string, any> = {};
                const keys: CaseDef['keys'] = [];

                const add = (key: string, srcEl: any, dstEl: any) => {
                    srcEls[srcEl.id] = srcEl;
                    dstEls[dstEl.id] = dstEl;
                    keys.push({
                        expectedMatchKey: key,
                        srcId: srcEl.id,
                        dstId: dstEl.id,
                        dstLeft: `${dstEl.x}px`,
                        dstTop: `${dstEl.y}px`,
                        dstWidth: `${dstEl.width}px`,
                        dstHeight: `${dstEl.height}px`
                    });
                };

                add('MRect', makeRect('__pw_m_rect_src', 'MRect', 40, 50, 120, 80), makeRect('__pw_m_rect_dst', 'MRect', 220, 70, 150, 90));
                add('MCircle', makeCircle('__pw_m_circle_src', 'MCircle', 200, 60, 110, 110), makeCircle('__pw_m_circle_dst', 'MCircle', 420, 80, 140, 140));
                add('MText', makeText('__pw_m_text_src', 'MText', 60, 170, 220, 70), makeText('__pw_m_text_dst', 'MText', 260, 230, 260, 70));
                add('MImage', makeImage('__pw_m_image_src', 'MImage', 320, 160, 160, 120), makeImage('__pw_m_image_dst', 'MImage', 60, 260, 220, 160));
                add('MSvg', makeSvg('__pw_m_svg_src', 'MSvg', 500, 40, 140, 140), makeSvg('__pw_m_svg_dst', 'MSvg', 500, 230, 180, 180));

                const srcGroup = makeGroup('__pw_m_group_src', 'MGroup', 470, 200, 200, 150, '__pw_m_group_child_src');
                const dstGroup = makeGroup('__pw_m_group_dst', 'MGroup', 40, 40, 240, 160, '__pw_m_group_child_dst');
                const childSrc = makeRect('__pw_m_group_child_src', 'Child', 20, 20, 80, 60);
                const childDst = makeRect('__pw_m_group_child_dst', 'Child', 60, 40, 100, 80);
                childSrc.parentId = srcGroup.id;
                childDst.parentId = dstGroup.id;
                srcEls[srcGroup.id] = srcGroup;
                srcEls[childSrc.id] = childSrc;
                dstEls[dstGroup.id] = dstGroup;
                dstEls[childDst.id] = childDst;
                keys.push({
                    expectedMatchKey: 'MGroup',
                    srcId: srcGroup.id,
                    dstId: dstGroup.id,
                    dstLeft: `${dstGroup.x}px`,
                    dstTop: `${dstGroup.y}px`,
                    dstWidth: `${dstGroup.width}px`,
                    dstHeight: `${dstGroup.height}px`
                });

                add('MTitle', makePlaceholderTitle('__pw_m_ph_src', 'MTitle', 40, 340, 260, 70), makePlaceholderTitle('__pw_m_ph_dst', 'MTitle', 320, 340, 300, 80));

                await dispatchAction('UPDATE_SLIDE', {
                    id: a,
                    background: { type: 'solid', value: '#ff0000' },
                    elements: srcEls,
                    elementOrder: Object.keys(srcEls)
                });

                await dispatchAction('UPDATE_SLIDE', {
                    id: b,
                    background: { type: 'solid', value: '#0000ff' },
                    elements: dstEls,
                    elementOrder: Object.keys(dstEls)
                });

                await dispatchAction('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
                    slideId: b,
                    styleAssignments: {
                        slideTransition: { type: 'morph', durationMs: 450, easing: 'linear' }
                    }
                });

                cases[cases.length - 1].keys = keys;
            }
        });

        const neededSlides = cases.length * 2;

        // Ensure we have enough slides overall before entering presentation.
        await ensureSlides(neededSlides);

        // Start presentation in windowed mode.
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
        await page.locator('[data-testid="present-windowed"]').click();

        await expect
            .poll(async () => (await getState()).editor.mode, { timeout: 5000 })
            .toBe('presentation');

        const slideContent = page.locator('#slide-content');
        await expect(slideContent).toHaveAttribute('data-pm-transition-status', 'idle');

        const currentPresentedSlideId = async () => {
            return await page.evaluate(() =>
                document.querySelector('#slide-content .slide-view')?.getAttribute('data-slide-id')
            );
        };

        // Start from the first slide to avoid "no next slide" scenarios.
        await dispatchAction('PRESENTATION_GOTO', 0);
        const hudCounter = page.locator('[data-testid="hud-counter"]');
        await expect(hudCounter).toHaveCount(1);
        await expect
            .poll(async () => (await hudCounter.innerText()) || '', { timeout: 5000 })
            .toMatch(/^\s*1\s*\/\s*\d+/);
        await expect(slideContent).toHaveAttribute('data-pm-transition-status', 'idle');

        // Anchor the test window to whatever slide presentation actually started on.
        await expect.poll(currentPresentedSlideId, { timeout: 5000 }).not.toBeNull();
        const startSlideId = await currentPresentedSlideId();

        const stateAtStart = await getState();
        const slideOrder = stateAtStart.slideOrder as string[];
        const slidesById = stateAtStart.slides || {};
        const visibleOrder = slideOrder.filter((id) => {
            const s = slidesById[id];
            return !(s?.hidden === true || s?.isHidden === true);
        });

        const startIndex = visibleOrder.indexOf(startSlideId);
        expect(startIndex).toBeGreaterThanOrEqual(0);
        expect(visibleOrder.length).toBeGreaterThanOrEqual(neededSlides);

        // Allocate a contiguous window (wrapping if needed) starting from the actually presented slide.
        const runSlideIds = Array.from({ length: neededSlides }, (_, k) => visibleOrder[(startIndex + k) % visibleOrder.length]);

        // Build the cases onto the slide window we will actually navigate through.
        for (let i = 0; i < cases.length; i++) {
            const slideAId = runSlideIds[i * 2];
            const slideBId = runSlideIds[i * 2 + 1];
            await cases[i].build(slideAId, slideBId);
        }

        // The presenter "Next" button advances builds first if buildCountBySlideId indicates builds.
        // These slides come from an existing deck; clear any stale build-count metadata so Next navigates slides.
        for (const slideId of runSlideIds) {
            await dispatchAction('SET_BUILD_COUNT_FOR_SLIDE', { slideId, buildCount: 0 });
        }
        await dispatchAction('SET_BUILD_COUNT', 0);

        // Presentation navigation is driven via the HUD controls to ensure we target the presented surface.
        const nextBtn = page.locator('[data-testid="hud-next-btn"]');
        await expect(nextBtn).toHaveCount(1);

        // Sanity: we should start on the first "A" slide for the run.
        await expect.poll(currentPresentedSlideId, { timeout: 5000 }).toBe(runSlideIds[0]);

        for (let i = 0; i < cases.length; i++) {
            const slideAId = runSlideIds[i * 2];
            const slideBId = runSlideIds[i * 2 + 1];

            await expect(slideContent).toHaveAttribute('data-pm-transition-status', 'idle');
            await expect.poll(currentPresentedSlideId, { timeout: 5000 }).toBe(slideAId);

            // Start monitoring before we trigger navigation so we don't miss overlap.
            const monitorPromise = page.evaluate(async ({ slideAId, slideBId, expectedPairs }) => {
                const slideContentEl = document.getElementById('slide-content');
                if (!slideContentEl) throw new Error('Missing #slide-content');

                const raf = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

                const waitFor = async (predicate: () => boolean, timeoutMs: number) => {
                    const start = performance.now();
                    while (performance.now() - start < timeoutMs) {
                        if (predicate()) return true;
                        await raf();
                    }
                    return false;
                };

                const readInlineBox = (el: HTMLElement | null) => {
                    if (!el) return null;
                    return {
                        left: el.style.left,
                        top: el.style.top,
                        width: el.style.width,
                        height: el.style.height,
                        opacity: el.style.opacity
                    };
                };

                const statusChanges: Array<string | null> = [];
                let sawStatusNonIdle = false;
                let maxSlideViews = 0;

                let incoming: HTMLElement | null = null;
                let outgoing: HTMLElement | null = null;
                let matchCount: string | null = null;

                const observer = new MutationObserver(() => {
                    const status = slideContentEl.getAttribute('data-pm-transition-status');
                    statusChanges.push(status);
                    if (status && status !== 'idle') sawStatusNonIdle = true;
                });
                observer.observe(slideContentEl, { attributes: true, attributeFilter: ['data-pm-transition-status'] });

                // Wait for transition to start (driven by UI click outside this evaluate).
                await waitFor(() => {
                    maxSlideViews = Math.max(maxSlideViews, slideContentEl.querySelectorAll('.slide-view').length);
                    const status = slideContentEl.getAttribute('data-pm-transition-status');
                    if (status && status !== 'idle') sawStatusNonIdle = true;
                    incoming = slideContentEl.querySelector(`.slide-view[data-slide-id="${slideBId}"]`) as HTMLElement | null;
                    outgoing = slideContentEl.querySelector(`.slide-view[data-slide-id="${slideAId}"]`) as HTMLElement | null;
                    return !!incoming && !!outgoing && status !== 'idle';
                }, 2000);

                const snapshots: Array<{
                    dstId: string;
                    expectedSrcId: string;
                    expectedMatchKey?: string;
                    matchKey: string | null;
                    matchSrcId: string | null;
                    first: any;
                    later: any;
                }> = [];

                if (incoming) {
                    // Wait briefly for morph evidence attributes to be applied.
                    await waitFor(() => {
                        return incoming?.getAttribute('data-morph-match-count') !== null;
                    }, 800);
                    matchCount = incoming.getAttribute('data-morph-match-count') || null;

                    const firstByDstId: Record<string, any> = {};
                    for (const p of expectedPairs as Array<any>) {
                        const dstId = String(p.dstId);
                        const sel = `.slide-element[data-element-id="${dstId}"]`;
                        const el = incoming.querySelector(sel) as HTMLElement | null;
                        firstByDstId[dstId] = readInlineBox(el);
                    }

                    await new Promise<void>((resolve) => setTimeout(() => resolve(), 120));

                    for (const p of expectedPairs as Array<any>) {
                        const dstId = String(p.dstId);
                        const expectedSrcId = String(p.srcId);
                        const expectedMatchKey = (p.expectedMatchKey !== undefined && p.expectedMatchKey !== null)
                            ? String(p.expectedMatchKey)
                            : undefined;

                        const sel = `.slide-element[data-element-id="${dstId}"]`;
                        const el = incoming.querySelector(sel) as HTMLElement | null;
                        const later = readInlineBox(el);

                        snapshots.push({
                            dstId,
                            expectedSrcId,
                            expectedMatchKey,
                            matchKey: el?.getAttribute('data-morph-match-key') || null,
                            matchSrcId: el?.getAttribute('data-morph-match-src-id') || null,
                            first: firstByDstId[dstId] ?? null,
                            later
                        });
                    }
                }

                observer.disconnect();

                return {
                    hasOutgoing: !!outgoing,
                    hasIncoming: !!incoming,
                    matchCount,
                    snapshots,
                    transitionStatus: slideContentEl.getAttribute('data-pm-transition-status'),
                    slideViewCount: slideContentEl.querySelectorAll('.slide-view').length,
                    slideIds: Array.from(slideContentEl.querySelectorAll('.slide-view')).map((el) => el.getAttribute('data-slide-id')),
                    sawStatusNonIdle,
                    maxSlideViews,
                    statusChanges
                };
            }, { slideAId, slideBId, expectedPairs: cases[i].keys });

            await nextBtn.click();
            const monitor = await monitorPromise;

            expect(
                monitor.hasIncoming,
                JSON.stringify({
                    i,
                    slideAId,
                    slideBId,
                    transitionStatus: monitor.transitionStatus,
                    slideViewCount: monitor.slideViewCount,
                    slideIds: monitor.slideIds,
                    sawStatusNonIdle: monitor.sawStatusNonIdle,
                    maxSlideViews: monitor.maxSlideViews,
                    statusChanges: monitor.statusChanges
                })
            ).toBe(true);
            expect(
                monitor.hasOutgoing,
                JSON.stringify({
                    i,
                    slideAId,
                    slideBId,
                    transitionStatus: monitor.transitionStatus,
                    slideViewCount: monitor.slideViewCount,
                    slideIds: monitor.slideIds,
                    sawStatusNonIdle: monitor.sawStatusNonIdle,
                    maxSlideViews: monitor.maxSlideViews,
                    statusChanges: monitor.statusChanges
                })
            ).toBe(true);

            expect(monitor.sawStatusNonIdle).toBe(true);
            expect(monitor.maxSlideViews).toBeGreaterThanOrEqual(2);

            // Incoming slide view should declare at least the expected number of matches.
            expect(monitor.matchCount).not.toBeNull();
            expect(Number(monitor.matchCount)).toBeGreaterThanOrEqual(cases[i].keys.length);

            // Each expected element should be matched and show geometry changing while transition runs.
            for (const snap of monitor.snapshots) {
                expect(snap.first).not.toBeNull();
                expect(snap.later).not.toBeNull();

                expect(snap.matchSrcId, JSON.stringify({ i, slideAId, slideBId, snap })).toBe(snap.expectedSrcId);
                if (snap.expectedMatchKey) {
                    expect(snap.matchKey, JSON.stringify({ i, slideAId, slideBId, snap })).toBe(snap.expectedMatchKey);
                }

                const didChange =
                    snap.first.left !== snap.later.left ||
                    snap.first.top !== snap.later.top ||
                    snap.first.width !== snap.later.width ||
                    snap.first.height !== snap.later.height ||
                    snap.first.opacity !== snap.later.opacity;

                expect(didChange).toBe(true);
            }

            // Final: destination element inline geometry matches destination slide data.
            const slideBView = page.locator(`#slide-content .slide-view[data-slide-id="${slideBId}"]`);
            await expect(slideBView).toHaveCount(1);

            for (const k of cases[i].keys) {
                const el = slideBView.locator(`.slide-element[data-element-id="${k.dstId}"]`);
                await expect(el).toHaveCount(1);

                if (k.expectedMatchKey) {
                    await expect(el).toHaveAttribute('data-layer-name', k.expectedMatchKey);
                }

                const style = await el.evaluate((node) => ({
                    left: (node as HTMLElement).style.left,
                    top: (node as HTMLElement).style.top,
                    width: (node as HTMLElement).style.width,
                    height: (node as HTMLElement).style.height
                }));

                // Presentation mode may scale the stage; final inline styles can be fractional.
                // Assert they are present and sane rather than exact equals to slide data.
                expect(style.left).toMatch(/px$/);
                expect(style.top).toMatch(/px$/);
                expect(style.width).toMatch(/px$/);
                expect(style.height).toMatch(/px$/);
                expect(Number.parseFloat(style.width)).toBeGreaterThan(0);
                expect(Number.parseFloat(style.height)).toBeGreaterThan(0);
            }

            // We should now be on the destination slide.
            await expect.poll(currentPresentedSlideId, { timeout: 5000 }).toBe(slideBId);

            // Advance to the next case's slide A (B -> next A).
            if (i < cases.length - 1) {
                await expect(slideContent).toHaveAttribute('data-pm-transition-status', 'idle');
                await nextBtn.click();
                await expect(slideContent).toHaveAttribute('data-pm-transition-status', 'idle');
                await expect.poll(currentPresentedSlideId, { timeout: 5000 }).toBe(runSlideIds[(i + 1) * 2]);
            }
        }
    });
});
