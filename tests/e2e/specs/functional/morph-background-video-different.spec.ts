import { test, expect } from '../../fixtures/base-test';
import { EditorPage } from '../../pages/EditorPage';

/**
 * Morph background behavior (different video identity):
 * - Backgrounds crossfade during Morph.
 * - If background video identities differ, Morph MUST NOT reuse/transfer the old <video>.
 * - Both the outgoing and incoming background videos must keep playing during the overlap window.
 */

test.describe('Morph background (video different identity)', () => {
    test('crossfades without stopping playback during overlap', async ({ page, getState, dispatchAction }) => {
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

        // Generate two different deterministic local video URLs.
        const { urlA, urlB } = await page.evaluate(async () => {
            const make = async (seed: number) => {
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
                    videoBitsPerSecond: 220_000,
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
                    // Seeded but deterministic differences.
                    const a = (tick + seed) % 3;
                    ctx.fillStyle = a === 0 ? '#ff0000' : a === 1 ? '#00ff00' : '#0000ff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(((tick * (seed + 3)) % 56), ((tick * (seed + 5)) % 56), 8, 8);
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
            };

            const urlA = await make(1);
            const urlB = await make(9);
            if (urlA === urlB) throw new Error('Expected different blob URLs');
            return { urlA, urlB };
        });

        await dispatchAction('UPDATE_SLIDE', {
            id: slide1Id,
            background: {
                type: 'video',
                value: urlA,
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
                value: urlB,
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
                slideTransition: { type: 'morph', durationMs: 900, easing: 'linear' },
            },
        });

        // Start presentation in windowed mode.
        await page.locator('[data-testid="play-btn"]').click();
        await page.locator('[data-testid="presentation-mode-picker"]').waitFor({ state: 'visible' });
        await page.locator('[data-testid="present-windowed"]').click();

        await expect.poll(async () => (await getState()).editor.mode, { timeout: 5000 }).toBe('presentation');
        await expect.poll(async () => (await getState()).presentation.currentSlideIndex, { timeout: 5000 }).toBe(0);

        const slideContent = page.locator('#slide-content');
        await expect(slideContent).toHaveAttribute('data-pm-transition-status', 'idle');

        // Trigger morph and validate overlap playback + crossfade.
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

            const get = (slideId: string) => {
                const view = document.querySelector(`#slide-content .slide-view[data-slide-id="${slideId}"]`) as HTMLElement | null;
                const bg = view?.querySelector('.slide-background') as HTMLElement | null;
                const video = bg?.querySelector('video') as HTMLVideoElement | null;
                return { view, bg, video };
            };

            // Ensure outgoing video exists and is playing.
            const a0 = get(slide1Id);
            if (!a0.video) throw new Error('Missing slide1 background video');
            try { await a0.video.play(); } catch { /* ignore */ }

            store.dispatch('PRESENTATION_NEXT');

            await waitFor(() => slideContentEl.getAttribute('data-pm-transition-status') === 'transitioning', 3000);
            await waitFor(() => slideContentEl.querySelectorAll('.slide-view').length >= 2, 2500);

            const incoming = get(slide2Id);
            const outgoing = get(slide1Id);
            if (!incoming.view || !incoming.bg || !incoming.video) throw new Error('Missing incoming video/bg');
            if (!outgoing.view || !outgoing.bg || !outgoing.video) throw new Error('Missing outgoing video/bg');

            // No transfer expected for different identity.
            const transferAttr = incoming.view.getAttribute('data-morph-bg-transfer') || '';

            // Make best-effort to ensure incoming attempts to play.
            try { await incoming.video.play(); } catch { /* ignore */ }

            // Sample during transition.
            const samples: Array<{
                outT: number;
                inT: number;
                outPaused: boolean;
                inPaused: boolean;
                outOpacity: number;
                inOpacity: number;
            }> = [];

            const start = performance.now();
            while (slideContentEl.getAttribute('data-pm-transition-status') === 'transitioning') {
                const outOpacity = Number(getComputedStyle(outgoing.bg).opacity);
                const inOpacity = Number(getComputedStyle(incoming.bg).opacity);

                samples.push({
                    outT: Number.isFinite(outgoing.video.currentTime) ? outgoing.video.currentTime : 0,
                    inT: Number.isFinite(incoming.video.currentTime) ? incoming.video.currentTime : 0,
                    outPaused: outgoing.video.paused,
                    inPaused: incoming.video.paused,
                    outOpacity: Number.isFinite(outOpacity) ? outOpacity : 0,
                    inOpacity: Number.isFinite(inOpacity) ? inOpacity : 0,
                });

                if (performance.now() - start > 2500 && samples.length > 30) break;
                await raf();
            }

            await waitFor(() => slideContentEl.getAttribute('data-pm-transition-status') === 'idle', 12000);

            const aDone = get(slide1Id);
            const bDone = get(slide2Id);

            const allVideos = Array.from(document.querySelectorAll('#slide-content .slide-view .slide-background video'));

            const min = (arr: number[]) => (arr.length ? Math.min(...arr) : 0);
            const max = (arr: number[]) => (arr.length ? Math.max(...arr) : 0);

            const outTimes = samples.map(s => s.outT).filter(n => Number.isFinite(n));
            const inTimes = samples.map(s => s.inT).filter(n => Number.isFinite(n));

            const outO = samples.map(s => s.outOpacity).filter(n => Number.isFinite(n));
            const inO = samples.map(s => s.inOpacity).filter(n => Number.isFinite(n));

            return {
                transferAttr,
                sampleCount: samples.length,
                outTimeDelta: max(outTimes) - min(outTimes),
                inTimeDelta: max(inTimes) - min(inTimes),
                anyOutPaused: samples.some(s => s.outPaused),
                anyInPaused: samples.some(s => s.inPaused),
                minIncomingOpacity: inO.length ? min(inO) : null,
                maxIncomingOpacity: inO.length ? max(inO) : null,
                minOutgoingOpacity: outO.length ? min(outO) : null,
                maxOutgoingOpacity: outO.length ? max(outO) : null,
                incomingAnimated: bDone.view?.getAttribute('data-morph-bg-animated') || null,
                doneSlide1HasVideo: Boolean(aDone.video),
                doneSlide2VideoId: bDone.video?.getAttribute('data-bg-video-id') || null,
                videoCountAfter: allVideos.length,
            };
        }, { slide1Id, slide2Id });

        // Crossfade evidence.
        expect(monitor.incomingAnimated, JSON.stringify(monitor)).toBe('1');
        expect(monitor.sampleCount, JSON.stringify(monitor)).toBeGreaterThan(2);
        expect(monitor.maxIncomingOpacity, JSON.stringify(monitor)).not.toBeNull();
        expect(monitor.minIncomingOpacity, JSON.stringify(monitor)).not.toBeNull();
        expect((monitor.minIncomingOpacity as number), JSON.stringify(monitor)).toBeLessThan(0.99);

        // Different identity => no transfer.
        expect(monitor.transferAttr, JSON.stringify(monitor)).not.toBe('video');

        // During overlap, both videos must keep advancing.
        expect(monitor.outTimeDelta, JSON.stringify(monitor)).toBeGreaterThan(0.05);
        expect(monitor.inTimeDelta, JSON.stringify(monitor)).toBeGreaterThan(0.05);

        // Post-condition: only destination video remains.
        expect(monitor.doneSlide1HasVideo, JSON.stringify(monitor)).toBe(false);
        expect(monitor.doneSlide2VideoId, JSON.stringify(monitor)).toBeTruthy();
        expect(monitor.videoCountAfter, JSON.stringify(monitor)).toBe(1);

        // Exit presentation.
        await page.keyboard.press('Escape');
        await expect.poll(async () => (await getState()).editor.mode, { timeout: 5000 }).toBe('edit');
    });
});
