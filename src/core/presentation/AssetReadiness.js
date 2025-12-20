function withTimeout(promise, timeoutMs, label) {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise;

    return Promise.race([
        promise,
        new Promise((resolve) => {
            const id = setTimeout(() => {
                clearTimeout(id);
                resolve({ __timeout: true, label });
            }, timeoutMs);
        })
    ]);
}

function once(el, eventName) {
    return new Promise((resolve) => {
        const handler = () => {
            el.removeEventListener(eventName, handler);
            resolve();
        };
        el.addEventListener(eventName, handler, { once: true });
    });
}

function extractUrlsFromCssBackground(value) {
    if (!value || typeof value !== 'string') return [];
    // Handles: url(foo), url("foo"), url('foo')
    const urls = [];
    const re = /url\((?:"([^"]+)"|'([^']+)'|([^\)]+))\)/g;
    let match;
    while ((match = re.exec(value)) !== null) {
        const url = (match[1] || match[2] || match[3] || '').trim();
        if (url) urls.push(url);
    }
    return urls;
}

async function waitForImage(img, perAssetTimeoutMs) {
    try {
        if (!(img instanceof HTMLImageElement)) return;
        if (!img.src) return;

        if (!img.complete || img.naturalWidth === 0) {
            await withTimeout(Promise.race([once(img, 'load'), once(img, 'error')]), perAssetTimeoutMs, 'img-load');
        }

        if (typeof img.decode === 'function') {
            // decode() rejects on error; treat as readiness failure but don't throw.
            await withTimeout(img.decode().catch(() => undefined), perAssetTimeoutMs, 'img-decode');
        }
    } catch {
        // noop: readiness is best-effort, transition gating is enforced by awaiting.
    }
}

async function waitForVideo(video, perAssetTimeoutMs) {
    try {
        if (!(video instanceof HTMLVideoElement)) return;
        if (!video.src) return;

        // HAVE_CURRENT_DATA = 2; ensure at least first frame is available.
        if (video.readyState < 2 || video.videoWidth === 0) {
            // load() may be a no-op in some contexts; safe to call.
            try {
                video.load();
            } catch {
                // ignore
            }
            await withTimeout(Promise.race([once(video, 'loadeddata'), once(video, 'error')]), perAssetTimeoutMs, 'video-loadeddata');
        }
    } catch {
        // noop
    }
}

async function waitForBackgroundUrls(urls, perAssetTimeoutMs) {
    const unique = Array.from(new Set(urls)).filter(Boolean);
    await Promise.all(
        unique.map(async (url) => {
            try {
                const img = new Image();
                img.src = url;
                // Some URLs may be cross-origin; decode can reject.
                if (typeof img.decode === 'function') {
                    await withTimeout(img.decode().catch(() => undefined), perAssetTimeoutMs, 'bg-decode');
                } else {
                    await withTimeout(Promise.race([once(img, 'load'), once(img, 'error')]), perAssetTimeoutMs, 'bg-load');
                }
            } catch {
                // ignore
            }
        })
    );
}

export async function waitForSlideAssetsReady(rootEl, options = {}) {
    const perAssetTimeoutMs = Number.isFinite(options.perAssetTimeoutMs) ? options.perAssetTimeoutMs : 8000;

    // Optional deterministic delay hook for Playwright (kept as a no-op unless explicitly set).
    // This is intentionally not documented as a product feature.
    const forcedDelayMs = Number.isFinite(window.__PM_TEST_READY_DELAY_MS) ? window.__PM_TEST_READY_DELAY_MS : 0;
    if (forcedDelayMs > 0) {
        await new Promise((r) => setTimeout(r, forcedDelayMs));
    }

    // Fonts
    const fontReadyPromise = (document.fonts && typeof document.fonts.ready?.then === 'function')
        ? withTimeout(document.fonts.ready.catch(() => undefined), perAssetTimeoutMs, 'fonts-ready')
        : Promise.resolve();

    if (!(rootEl instanceof Element)) {
        await fontReadyPromise;
        return;
    }

    const imgs = Array.from(rootEl.querySelectorAll('img'));
    const videos = Array.from(rootEl.querySelectorAll('video'));

    // Background-image URLs (focus on elements that commonly host them)
    const bgUrlCandidates = Array.from(
        rootEl.querySelectorAll('.bg-layer,[data-fill-type="image"],.shape-fill-layer')
    );
    bgUrlCandidates.push(rootEl);

    const bgUrls = [];
    for (const el of bgUrlCandidates) {
        const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
        const bg = style?.backgroundImage || el.style?.backgroundImage || el.style?.background || '';
        bgUrls.push(...extractUrlsFromCssBackground(bg));
    }

    await Promise.all([
        fontReadyPromise,
        Promise.all(imgs.map((img) => waitForImage(img, perAssetTimeoutMs))),
        Promise.all(videos.map((v) => waitForVideo(v, perAssetTimeoutMs))),
        waitForBackgroundUrls(bgUrls, perAssetTimeoutMs)
    ]);
}

export const __test__ = {
    extractUrlsFromCssBackground
};
