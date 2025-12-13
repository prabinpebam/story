export const DEFAULT_LAYOUT_GUIDE = {
    enabled: true,
    margins: { top: 40, right: 40, bottom: 40, left: 40 },
    marginsLinked: true,
    columns: { count: 3, gutter: 20 },
    appearance: { color: '#FF0000', opacity: 10 }
};

function mergeGuide(base, override) {
    if (!override) return base;

    return {
        ...base,
        ...override,
        margins: { ...(base.margins || {}), ...(override.margins || {}) },
        columns: { ...(base.columns || {}), ...(override.columns || {}) },
        appearance: { ...(base.appearance || {}), ...(override.appearance || {}) }
    };
}

/**
 * Resolves the effective layout guide for the current editor context.
 *
 * Inheritance order (highest -> lowest):
 * - Slide override (normal slide record)
 * - Layout master override (slide.layoutId)
 * - Master default (layout.parentMasterId)
 * - System defaults
 */
export function getEffectiveLayoutGuideForState(state) {
    const fallback = { ...DEFAULT_LAYOUT_GUIDE };

    if (!state || !state.editor) return fallback;

    if (state.editor.mode === 'master') {
        const active = state.slideMasterPresets?.[state.editor.activeMasterId] || null;
        if (!active) return fallback;

        // Direct guide on the active master/layout
        if (active.layoutGuide) {
            return mergeGuide(fallback, active.layoutGuide);
        }

        // If we are editing a layout master, inherit from its parent master
        if (active.type === 'layoutMaster' && active.parentMasterId) {
            const parent = state.slideMasterPresets?.[active.parentMasterId] || null;
            if (parent?.layoutGuide) {
                return mergeGuide(fallback, parent.layoutGuide);
            }
        }

        return fallback;
    }

    const slideId = state.editor.activeSlideId;
    const slide = state.slides?.[slideId] || null;
    if (!slide) return fallback;

    const layout = slide.layoutId ? (state.slideMasterPresets?.[slide.layoutId] || null) : null;
    const master = layout?.parentMasterId ? (state.slideMasterPresets?.[layout.parentMasterId] || null) : null;

    let guide = fallback;
    guide = mergeGuide(guide, master?.layoutGuide || null);
    guide = mergeGuide(guide, layout?.layoutGuide || null);
    guide = mergeGuide(guide, slide.layoutGuide || null);

    return guide;
}

export function getContentBounds(slideWidth, slideHeight, margins) {
    const safeMargins = {
        left: Number(margins?.left ?? 0),
        right: Number(margins?.right ?? 0),
        top: Number(margins?.top ?? 0),
        bottom: Number(margins?.bottom ?? 0)
    };

    const x = safeMargins.left;
    const y = safeMargins.top;
    const width = Math.max(0, slideWidth - safeMargins.left - safeMargins.right);
    const height = Math.max(0, slideHeight - safeMargins.top - safeMargins.bottom);

    return { x, y, width, height };
}

export function getColumnRects(contentBounds, count, gutter) {
    const columnCount = Math.max(1, Math.floor(Number(count ?? 1)));
    const gutterWidth = Math.max(0, Number(gutter ?? 0));

    const totalGutter = gutterWidth * Math.max(0, columnCount - 1);
    const usable = Math.max(0, contentBounds.width - totalGutter);
    const colW = columnCount === 0 ? 0 : usable / columnCount;

    const rects = [];
    let x = contentBounds.x;

    for (let i = 0; i < columnCount; i++) {
        rects.push({
            x,
            y: contentBounds.y,
            width: colW,
            height: contentBounds.height
        });
        x += colW + gutterWidth;
    }

    return rects;
}

export function getColumnEdgesX(contentBounds, count, gutter) {
    const rects = getColumnRects(contentBounds, count, gutter);
    const edges = [];

    for (const r of rects) {
        edges.push(r.x);
        edges.push(r.x + r.width);
    }

    return edges;
}
