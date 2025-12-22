import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';
import { CanvasHelper } from '../../pages/CanvasHelper';

test.describe('Morph transition - UI workflow', () => {
    test('should morph between duplicated slides created via UI tools (no state injection)', async ({ page }) => {
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

        const editor = new EditorPage(page);
        const canvas = new CanvasHelper(page);

        await editor.goto();
        await editor.waitForLoad();

        expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);

        const slideThumbs = page.locator('[data-testid^="slide-thumbnail-"]');

        const getSlideElementSnapshot = async () => {
            return await page.evaluate(() => {
                const els = Array.from(
                    document.querySelectorAll('#slide-content .slide-element[data-element-id]')
                ) as HTMLElement[];
                return els.map((el) => ({
                    id: el.getAttribute('data-element-id') || '',
                    type: el.getAttribute('data-element-type') || '',
                    shapeKind: el.getAttribute('data-shape-kind') || '',
                    layerName: el.getAttribute('data-layer-name') || ''
                }));
            });
        };

        const waitForNewElementId = async (beforeIds: Set<string>, timeoutMs = 3000) => {
            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
                const now = await getSlideElementSnapshot();
                const newEl = now.find((e) => e.id && !beforeIds.has(e.id));
                if (newEl) return newEl;
                await page.waitForTimeout(50);
            }
            throw new Error('Timed out waiting for new element to appear');
        };

        // -------- Slide A: draw shapes using UI tools --------
        await editor.selectSlide(0);

        // Rectangle (use keyboard shortcut to avoid relying on shape-menu long-press/caret)
        {
            const before = new Set((await getSlideElementSnapshot()).map((e) => e.id));
            await page.keyboard.press('r');
            await canvas.drawRectangle(0.20, 0.22, 0.16, 0.12);
            const created = await waitForNewElementId(before);
            expect(created.type).toBeTruthy();
        }

        // Ellipse
        {
            const before = new Set((await getSlideElementSnapshot()).map((e) => e.id));
            await page.keyboard.press('o');
            await canvas.drawRectangle(0.52, 0.24, 0.12, 0.18);
            const created = await waitForNewElementId(before);
            expect(created.type).toBeTruthy();
        }

        // Capture Slide A ids by type.
        const aSnapshot = await getSlideElementSnapshot();
        const rectA = aSnapshot.find((e) => e.shapeKind === 'rectangle' || e.type === 'rect' || e.type === 'rectangle');
        const circleA = aSnapshot.find((e) => e.shapeKind === 'ellipse' || e.type === 'circle' || e.type === 'ellipse');
        expect(rectA?.id).toBeTruthy();
        expect(circleA?.id).toBeTruthy();

        const rectAId = rectA!.id;
        const circleAId = circleA!.id;

        // -------- Duplicate slide via UI shortcut (Ctrl+D) --------
        const initialSlideCount = await slideThumbs.count();
        await editor.selectSlide(0);
        await page.keyboard.press('Control+d');
        await expect(slideThumbs).toHaveCount(initialSlideCount + 1);

        // Slide B should be the new slide at index 1.
        await editor.selectSlide(1);

        // Capture Slide B ids by type.
        const bSnapshot = await getSlideElementSnapshot();
        const rectB = bSnapshot.find((e) => e.shapeKind === 'rectangle' || e.type === 'rect' || e.type === 'rectangle');
        const circleB = bSnapshot.find((e) => e.shapeKind === 'ellipse' || e.type === 'circle' || e.type === 'ellipse');
        expect(rectB?.id).toBeTruthy();
        expect(circleB?.id).toBeTruthy();

        const rectBId = rectB!.id;
        const circleBId = circleB!.id;

        // Move both shapes on Slide B so Morph has geometry to animate.
        await editor.setActiveTool('select');
        await canvas.moveElement(0.28, 0.28, 0.40, 0.55); // rect
        await canvas.moveElement(0.58, 0.33, 0.68, 0.55); // ellipse

        // Deselect so property inspector shows slide properties.
        await canvas.clickAt(0.05, 0.05);

        // Set transition on destination slide (Slide B) to Morph via UI.
        const transitionTrigger = editor.propertyInspector.locator('[data-testid="transition-picker-trigger"]');
        await expect(transitionTrigger).toBeVisible();
        await transitionTrigger.click();

        const flyout = page.locator('[data-testid="transition-picker-flyout"]');
        await expect(flyout).toBeVisible();

        const morphOption = flyout.locator('[data-testid="transition-picker-option"]').filter({ hasText: /Morph/i });
        await expect(morphOption.first()).toBeVisible();
        await morphOption.first().click();
        await expect(flyout).toBeHidden();

        // Go back to Slide A so presentation starts there.
        await editor.selectSlide(0);

        // -------- Presentation: verify morph evidence & motion --------
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
        await page.locator('[data-testid="present-windowed"]').click();

        const slideContent = page.locator('#slide-content');
        await expect(slideContent).toHaveAttribute('data-pm-transition-status', 'idle');

        const nextBtn = page.locator('[data-testid="hud-next-btn"]');
        await expect(nextBtn).toHaveCount(1);

        // Monitor A -> B transition without relying on slide ids.
        const monitorPromise = page.evaluate(async ({ rectAId, rectBId, circleAId, circleBId }) => {
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

            const beforeId = (slideContentEl.querySelector('.slide-view') as HTMLElement | null)?.getAttribute('data-slide-id') || null;

            // Wait for overlap (two slide views) and non-idle status.
            let incoming: HTMLElement | null = null;
            let outgoing: HTMLElement | null = null;

            await waitFor(() => {
                const status = slideContentEl.getAttribute('data-pm-transition-status');
                const views = Array.from(slideContentEl.querySelectorAll('.slide-view')) as HTMLElement[];
                if (!status || status === 'idle') return false;
                if (views.length < 2) return false;

                outgoing = views.find((v) => (v.getAttribute('data-slide-id') || '') === (beforeId || '')) || null;
                incoming = views.find((v) => (v.getAttribute('data-slide-id') || '') !== (beforeId || '')) || null;
                return !!incoming && !!outgoing;
            }, 2500);

            if (!incoming || !outgoing) {
                return {
                    ok: false,
                    reason: 'missing-incoming-or-outgoing',
                    status: slideContentEl.getAttribute('data-pm-transition-status'),
                    viewCount: slideContentEl.querySelectorAll('.slide-view').length
                };
            }

            const incomingEl = incoming as HTMLElement;
            const outgoingEl = outgoing as HTMLElement;

            // Wait briefly for morph evidence.
            await waitFor(() => incomingEl?.getAttribute('data-morph-match-count') !== null, 1200);

            const matchCountRaw = incomingEl.getAttribute('data-morph-match-count');
            const matchCount = matchCountRaw ? Number(matchCountRaw) : NaN;

            const dstRect = incomingEl.querySelector(`.slide-element[data-element-id="${rectBId}"]`) as HTMLElement | null;
            const dstCircle = incomingEl.querySelector(`.slide-element[data-element-id="${circleBId}"]`) as HTMLElement | null;

            const first = {
                rect: readInlineBox(dstRect),
                circle: readInlineBox(dstCircle)
            };

            await new Promise<void>((resolve) => setTimeout(() => resolve(), 140));

            const later = {
                rect: readInlineBox(dstRect),
                circle: readInlineBox(dstCircle)
            };

            const rectMatchSrcId = dstRect?.getAttribute('data-morph-match-src-id') || null;
            const circleMatchSrcId = dstCircle?.getAttribute('data-morph-match-src-id') || null;

            return {
                ok: true,
                beforeId,
                incomingId: incomingEl.getAttribute('data-slide-id'),
                outgoingId: outgoingEl.getAttribute('data-slide-id'),
                matchCount,
                rectMatchSrcId,
                circleMatchSrcId,
                first,
                later,
                status: slideContentEl.getAttribute('data-pm-transition-status')
            };
        }, { rectAId, rectBId, circleAId, circleBId });

        await nextBtn.click();
        const monitor = await monitorPromise;

        expect(monitor.ok, JSON.stringify(monitor)).toBe(true);
        expect(Number.isFinite(monitor.matchCount), JSON.stringify(monitor)).toBe(true);
        expect(monitor.matchCount).toBeGreaterThanOrEqual(2);

        expect(monitor.rectMatchSrcId, JSON.stringify(monitor)).toBe(rectAId);
        expect(monitor.circleMatchSrcId, JSON.stringify(monitor)).toBe(circleAId);

        const didRectChange =
            monitor.first?.rect?.left !== monitor.later?.rect?.left ||
            monitor.first?.rect?.top !== monitor.later?.rect?.top ||
            monitor.first?.rect?.width !== monitor.later?.rect?.width ||
            monitor.first?.rect?.height !== monitor.later?.rect?.height ||
            monitor.first?.rect?.opacity !== monitor.later?.rect?.opacity;

        const didCircleChange =
            monitor.first?.circle?.left !== monitor.later?.circle?.left ||
            monitor.first?.circle?.top !== monitor.later?.circle?.top ||
            monitor.first?.circle?.width !== monitor.later?.circle?.width ||
            monitor.first?.circle?.height !== monitor.later?.circle?.height ||
            monitor.first?.circle?.opacity !== monitor.later?.circle?.opacity;

        expect(didRectChange, JSON.stringify(monitor)).toBe(true);
        expect(didCircleChange, JSON.stringify(monitor)).toBe(true);

        // End state: transition should settle back to idle.
        await expect(slideContent).toHaveAttribute('data-pm-transition-status', 'idle');
    });
});
