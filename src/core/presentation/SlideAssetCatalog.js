import { mediaAssetManager } from '../media/MediaAssetManager.js';

function uniq(values) {
    return Array.from(new Set(values.filter(Boolean)));
}

function pushIfString(arr, value) {
    if (typeof value === 'string' && value.trim()) arr.push(value);
}

function collectFillAssetRefs(fill, out) {
    if (!fill || typeof fill !== 'object') return;

    if (fill.type === 'image' || fill.type === 'video') {
        if (typeof fill.assetId === 'string' && fill.assetId) {
            out.assetIds.push(fill.assetId);
        } else if (typeof fill.value === 'string' && fill.value) {
            // Legacy URL
            out.urls.push(fill.value);
        }
    }
}

/**
 * Collect media references for a slide.
 *
 * This is intentionally conservative: it only looks at known media fields
 * used by the renderer (image elements, background fills, shape fills).
 */
export function collectSlideAssetRefs(slideData) {
    const out = { urls: [], assetIds: [] };
    if (!slideData || typeof slideData !== 'object') return out;

    // Background fills (SlideView.applyBackground)
    const bg = slideData.effectiveBackground ?? slideData.background ?? null;
    const bgFills = Array.isArray(bg) ? bg : bg ? [bg] : [];
    for (const fill of bgFills) collectFillAssetRefs(fill, out);

    // Elements
    const elements = slideData.effectiveElements ?? slideData.elements ?? {};
    for (const el of Object.values(elements)) {
        if (!el || typeof el !== 'object') continue;

        // Image element (ImageElement uses el.src)
        if (el.type === 'image') {
            pushIfString(out.urls, el.src);
        }

        // Shape element fills (ShapeElement supports style.fills)
        const fills = el?.style?.fills;
        if (Array.isArray(fills)) {
            for (const fill of fills) collectFillAssetRefs(fill, out);
        }
    }

    out.urls = uniq(out.urls);
    out.assetIds = uniq(out.assetIds);
    return out;
}

export function resolveRefsToUrls(refs) {
    const urls = Array.isArray(refs?.urls) ? refs.urls.slice() : [];
    const assetIds = Array.isArray(refs?.assetIds) ? refs.assetIds : [];

    for (const assetId of assetIds) {
        try {
            const u = mediaAssetManager.getRenderableUrl(assetId);
            if (typeof u === 'string' && u) urls.push(u);
        } catch {
            // Ignore resolution errors; readiness gating will still protect transitions.
        }
    }

    return Array.from(new Set(urls.filter(Boolean)));
}
