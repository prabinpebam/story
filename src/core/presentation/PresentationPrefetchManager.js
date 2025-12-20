import { collectSlideAssetRefs, resolveRefsToUrls } from './SlideAssetCatalog.js';

function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
}

function sliceWindow(arr, centerIndex, radius) {
    const start = clamp(centerIndex - radius, 0, Math.max(0, arr.length - 1));
    const end = clamp(centerIndex + radius, 0, Math.max(0, arr.length - 1));
    return arr.slice(start, end + 1);
}

async function preloadImages(urls) {
    const TIMEOUT_MS = 2500;
    const tasks = urls.map((url) => new Promise((resolve) => {
        const img = new Image();
        let settled = false;
        const done = () => {
            if (settled) return;
            settled = true;
            resolve();
        };

        const t = setTimeout(done, TIMEOUT_MS);

        img.onload = () => {
            clearTimeout(t);
            done();
        };
        img.onerror = () => {
            clearTimeout(t);
            done();
        };
        img.src = url;
        if (typeof img.decode === 'function') {
            img.decode().then(() => {
                clearTimeout(t);
                done();
            }).catch(() => {
                clearTimeout(t);
                done();
            });
        }
    }));
    await Promise.all(tasks);
}

async function preloadVideosFirstFrame(urls) {
    const TIMEOUT_MS = 3000;
    const tasks = urls.map((url) => new Promise((resolve) => {
        const v = document.createElement('video');
        v.preload = 'auto';
        v.muted = true;
        v.playsInline = true;
        let settled = false;
        const done = () => {
            if (settled) return;
            settled = true;
            resolve();
        };

        const t = setTimeout(done, TIMEOUT_MS);

        v.addEventListener('loadeddata', () => {
            clearTimeout(t);
            done();
        }, { once: true });
        v.addEventListener('error', () => {
            clearTimeout(t);
            done();
        }, { once: true });
        v.src = url;
        try {
            v.load();
        } catch {
            clearTimeout(t);
            done();
        }
    }));
    await Promise.all(tasks);
}

function splitMediaUrls(urls) {
    const imageUrls = [];
    const videoUrls = [];

    for (const url of urls) {
        if (typeof url !== 'string') continue;
        const lower = url.toLowerCase();
        // Heuristic: prefer explicit video extensions or blob/video hints.
        if (lower.includes('video') || lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg')) {
            videoUrls.push(url);
        } else {
            imageUrls.push(url);
        }
    }

    return { imageUrls, videoUrls };
}

export class PresentationPrefetchManager {
    constructor({ getSlideData }) {
        this.getSlideData = getSlideData;

        this.activeSlideId = null;
        this.hotSlideIds = new Set();
        this.warmSlideIds = new Set();

        this._slidePromises = new Map(); // slideId -> Promise<void>
        this._warmTimer = null;
        this._lastNavAt = 0;

        this.warmRadius = 3;
        this.maxRetainedSlides = 16;
    }

    destroy() {
        if (this._warmTimer) {
            clearTimeout(this._warmTimer);
            this._warmTimer = null;
        }
        this._slidePromises.clear();
        this.hotSlideIds.clear();
        this.warmSlideIds.clear();
        this.activeSlideId = null;
    }

    onNavigation() {
        this._lastNavAt = Date.now();
    }

    getTier(slideId) {
        if (!slideId) return 'cold';
        if (slideId === this.activeSlideId) return 'active';
        if (this.hotSlideIds.has(slideId)) return 'hot';
        if (this.warmSlideIds.has(slideId)) return 'warm';
        return 'cold';
    }

    updateTiers({ slideOrder, currentIndex }) {
        const order = Array.isArray(slideOrder) ? slideOrder : [];
        if (!order.length) return;

        const idx = clamp(Number(currentIndex) || 0, 0, order.length - 1);
        this.activeSlideId = order[idx];

        const hot = new Set([order[idx - 1], order[idx + 1]].filter(Boolean));
        this.hotSlideIds = hot;

        const warm = new Set(sliceWindow(order, idx, this.warmRadius).filter((id) => id !== this.activeSlideId && !hot.has(id)));
        this.warmSlideIds = warm;
    }

    ensurePrefetched(slideId, { tier }) {
        if (!slideId) return Promise.resolve();

        const isOffline = typeof navigator !== 'undefined' && navigator && navigator.onLine === false;
        if (isOffline) return Promise.resolve();

        if (this._slidePromises.has(slideId)) return this._slidePromises.get(slideId);

        const p = (async () => {
            const slideData = this.getSlideData(slideId);
            const refs = collectSlideAssetRefs(slideData);
            const urls = resolveRefsToUrls(refs);
            const { imageUrls, videoUrls } = splitMediaUrls(urls);

            // Font readiness is verified by transition readiness gating (AssetReadiness).

            await preloadImages(imageUrls);
            if (tier === 'hot' || tier === 'active') {
                await preloadVideosFirstFrame(videoUrls);
            }
        })().catch(() => {
            // Best-effort: failures should not break presentation.
        });

        this._slidePromises.set(slideId, p);
        return p;
    }

    _pruneRetained() {
        const keep = new Set();
        if (this.activeSlideId) keep.add(this.activeSlideId);
        for (const id of this.hotSlideIds) keep.add(id);
        for (const id of this.warmSlideIds) keep.add(id);

        // Drop references to COLD tier work so GC can reclaim if possible.
        for (const slideId of this._slidePromises.keys()) {
            if (!keep.has(slideId)) this._slidePromises.delete(slideId);
        }

        // Hard cap to prevent unbounded growth even if slideOrder changes rapidly.
        if (this._slidePromises.size <= this.maxRetainedSlides) return;

        const keepOrdered = new Set(Array.from(this._slidePromises.keys()).filter((id) => keep.has(id)));
        for (const slideId of this._slidePromises.keys()) {
            if (this._slidePromises.size <= this.maxRetainedSlides) break;
            if (keepOrdered.has(slideId)) continue;
            this._slidePromises.delete(slideId);
        }

        for (const slideId of this._slidePromises.keys()) {
            if (this._slidePromises.size <= this.maxRetainedSlides) break;
            this._slidePromises.delete(slideId);
        }
    }

    prefetchHotNow() {
        const tasks = [];
        for (const slideId of this.hotSlideIds) {
            tasks.push(this.ensurePrefetched(slideId, { tier: 'hot' }));
        }
        return Promise.all(tasks);
    }

    scheduleWarmPrefetch() {
        if (this._warmTimer) clearTimeout(this._warmTimer);

        // Deprioritize during active navigation.
        this._warmTimer = setTimeout(() => {
            const now = Date.now();
            if (now - this._lastNavAt < 250) {
                this.scheduleWarmPrefetch();
                return;
            }

            for (const slideId of this.warmSlideIds) {
                this.ensurePrefetched(slideId, { tier: 'warm' });
            }
        }, 350);
    }

    updateFromState(state) {
        const isOffline = typeof navigator !== 'undefined' && navigator && navigator.onLine === false;

        const slideOrder = state?.slideOrder;
        const currentIndex = state?.presentation?.currentSlideIndex;
        this.updateTiers({ slideOrder, currentIndex });

        if (isOffline) {
            this._pruneRetained();
            return;
        }

        // ACTIVE is already on-screen; keep it preloaded for safety.
        if (this.activeSlideId) {
            this.ensurePrefetched(this.activeSlideId, { tier: 'active' });
        }

        // HOT should be immediate.
        this.prefetchHotNow();
        this.scheduleWarmPrefetch();

        this._pruneRetained();
    }
}
