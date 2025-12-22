import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * Morph background behavior (video continuity):
 * - Background crossfades during Morph.
 * - If background video identity matches, the underlying <video> is preserved (no reset).
 *
 * This test generates a deterministic local blob: URL video via canvas.captureStream + MediaRecorder
 * (avoids relying on external assets/files).
 *
 * DOM evidence:
 * - SlideView video: data-bg-video-id
 * - PresentationRenderer transfer: data-morph-bg-transfer="video"
 * - AnimationManager crossfade: data-morph-bg-animated="1"
 */

test.describe('Morph background (video continuity)', () => {
    test('preserves same-identity background video playback state', async ({ page, getState, dispatchAction }) => {
        const editor = new EditorPage(page);
        await editor.goto();
        await editor.waitForLoad();

        // Ensure we have at least 2 slides and deterministic indices.
        let state = await getState();
        while ((state.slideOrder?.length || 0) < 2) {
            await dispatchAction('ADD_SLIDE');
            state = await getState();
        }

        const slide1Id = (state.slideOrder as string[])[0];
        const slide2Id = (state.slideOrder as string[])[1];

        // Generate a deterministic local video URL.
        const blobUrl = await page.evaluate(async () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Missing 2d context');

            const stream = canvas.captureStream(30);

            const preferred = 'video/webm;codecs=vp8';
            const fallback = 'video/webm';
            const mimeType = (typeof MediaRecorder !== 'undefined' && (MediaRecorder as any).isTypeSupported?.(preferred))
                ? preferred
                : fallback;

            const recorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: 200_000,
            });

            const chunks: BlobPart[] = [];
            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };

            const stopped = new Promise<void>((resolve, reject) => {
                recorder.onstop = () => resolve();
                recorder.onerror = () => reject(new Error('MediaRecorder error'));
            });

            let tick = 0;
            const paint = () => {
                tick++;
                ctx.fillStyle = tick % 2 === 0 ? '#ff0000' : '#0000ff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect((tick % 32), 0, 4, 64);
            };

            recorder.start(100);
            const interval = window.setInterval(paint, 33);
            paint();

            await new Promise<void>((resolve) => window.setTimeout(() => resolve(), 900));
            window.clearInterval(interval);

            try {
                recorder.stop();
            } catch {
                // ignore
            }
            await stopped;

            for (const t of stream.getTracks()) {
                try { t.stop(); } catch { /* ignore */ }
            }

            const blob = new Blob(chunks, { type: 'video/webm' });
            if (!blob.size) throw new Error('Generated blob video is empty');
            return URL.createObjectURL(blob);
        });

        // Same video URL on both slides => should transfer/reuse video element.
        await dispatchAction('UPDATE_SLIDE', {
            id: slide1Id,
            background: {
                type: 'video',
                value: blobUrl,
                muted: true,
                loop: true,
                autoplay: true,
                volume: 0,
                scaleMode: 'cover',
            },
        });
        await dispatchAction('UPDATE_SLIDE', {
            id: slide2Id,
            background: {
                type: 'video',
                value: blobUrl,
                muted: true,
                loop: true,
                autoplay: true,
                volume: 0,
                scaleMode: 'cover',
            },
        });

        // Destination slide defines the transition.
        await dispatchAction('UPDATE_SLIDE_STYLE_ASSIGNMENTS', {
            slideId: slide2Id,
            styleAssignments: {
                slideTransition: { type: 'morph', durationMs: 700, easing: 'linear' },
            },
        });

        // Start presentation in windowed mode.
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
        await page.locator('[data-testid="present-windowed"]').click();

        await expect.poll(async () => (await getState()).editor.mode, { timeout: 5000 }).toBe('presentation');

        // Force slide index 0.
        const idx = (await getState()).presentation.currentSlideIndex;
        if (idx !== 0) {
            await dispatchAction('PRESENTATION_GOTO', 0);
        }
        await expect.poll(async () => (await getState()).presentation.currentSlideIndex, { timeout: 5000 }).toBe(0);

        const slideContent = page.locator('#slide-content');
        await expect(slideContent).toHaveAttribute('data-pm-transition-status', 'idle');

        // Ensure the background video is present and playing.
        const before = await page.evaluate(async ({ slide1Id }) => {
            const view = document.querySelector(`#slide-content .slide-view[data-slide-id="${slide1Id}"]`) as HTMLElement | null;
            if (!view) throw new Error('Missing slide1 view');
            const video = view.querySelector('.slide-background video') as HTMLVideoElement | null;
            if (!video) throw new Error('Missing background video');

            const ensureCanPlay = async () => {
                if (video.readyState >= 2) return;
                await new Promise<void>((resolve) => {
                    const onReady = () => {
                        video.removeEventListener('loadeddata', onReady);
                        resolve();
                    };
                    video.addEventListener('loadeddata', onReady);
                });
            };

            const tryPlay = async () => {
                try {
                    await video.play();
                } catch {
                    // ignore
                }
            };

            await ensureCanPlay();
            await tryPlay();

            const start = performance.now();
            let t0 = Number.isFinite(video.currentTime) ? video.currentTime : 0;
            while (performance.now() - start < 1500) {
                await new Promise<void>((r) => requestAnimationFrame(() => r()));
                const t1 = Number.isFinite(video.currentTime) ? video.currentTime : 0;
                if (t1 > t0 + 0.05) break;
            }

            return {
                videoId: video.getAttribute('data-bg-video-id') || null,
                currentTime: Number.isFinite(video.currentTime) ? video.currentTime : 0,
                paused: video.paused,
            };
        }, { slide1Id });

        expect(before.videoId).toBeTruthy();
        expect(before.paused).toBe(false);
        expect(before.currentTime).toBeGreaterThan(0);

        // Trigger slide 1 -> slide 2 morph and verify continuity.
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

            const getVideo = (slideId: string) => {
                const view = document.querySelector(`#slide-content .slide-view[data-slide-id="${slideId}"]`) as HTMLElement | null;
                const video = view?.querySelector('.slide-background video') as HTMLVideoElement | null;
                return { view, video };
            };

            const a = getVideo(slide1Id);
            if (!a.video) throw new Error('Missing slide1 video');

            const beforeId = a.video.getAttribute('data-bg-video-id') || null;
            const beforeTime = Number.isFinite(a.video.currentTime) ? a.video.currentTime : 0;
            const beforePaused = a.video.paused;

            store.dispatch('PRESENTATION_NEXT');

            await waitFor(() => slideContentEl.getAttribute('data-pm-transition-status') === 'transitioning', 3000);

            // Transfer evidence should be applied to the incoming view.
            await waitFor(() => {
                const b = getVideo(slide2Id);
                return (b.view?.getAttribute('data-morph-bg-transfer') || '') === 'video';
            }, 2500);

            // Wait for transition completion.
            await waitFor(() => slideContentEl.getAttribute('data-pm-transition-status') === 'idle', 12000);

            const b = getVideo(slide2Id);
            if (!b.view || !b.video) {
                return { ok: false, reason: 'missing-slide2-video-or-view' };
            }

            const afterId = b.video.getAttribute('data-bg-video-id') || null;
            const afterTime = Number.isFinite(b.video.currentTime) ? b.video.currentTime : 0;
            const afterPaused = b.video.paused;
            const animated = b.view.getAttribute('data-morph-bg-animated') || null;

            const allVideos = Array.from(document.querySelectorAll('#slide-content .slide-view .slide-background video'));

            return {
                ok: true,
                beforeId,
                afterId,
                beforeTime,
                afterTime,
                beforePaused,
                afterPaused,
                animated,
                videoCount: allVideos.length,
            };
        }, { slide1Id, slide2Id });

        expect(monitor.ok, JSON.stringify(monitor)).toBe(true);
        expect(monitor.animated, JSON.stringify(monitor)).toBe('1');
        expect(monitor.beforeId, JSON.stringify(monitor)).toBeTruthy();
        expect(monitor.afterId, JSON.stringify(monitor)).toBe(monitor.beforeId);
        expect(monitor.beforePaused, JSON.stringify(monitor)).toBe(false);
        expect(monitor.afterPaused, JSON.stringify(monitor)).toBe(false);
        expect(monitor.afterTime, JSON.stringify(monitor)).toBeGreaterThanOrEqual(monitor.beforeTime - 0.05);
        expect(monitor.afterTime, JSON.stringify(monitor)).toBeGreaterThan(monitor.beforeTime);
        expect(monitor.videoCount, JSON.stringify(monitor)).toBe(1);

        // Exit presentation.
        await page.keyboard.press('Escape');
        await expect.poll(async () => (await getState()).editor.mode, { timeout: 5000 }).toBe('edit');
    });
});
