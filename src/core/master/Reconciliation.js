/**
 * Reconciliation.js
 * Pure-ish helpers for preserving slide content when changing layouts.
 *
 * Terminology:
 * - sourceLayout: previous layout master
 * - targetLayout: new layout master
 * - placeholder override: an entry in slide.elements that corresponds to a placeholder id
 *   from the source layout (i.e. slide has user content for that placeholder).
 */

function getPlaceholdersByType(layout) {
    const byType = {};

    const orderedIds = Array.isArray(layout?.elementOrder) ? layout.elementOrder : [];
    const seen = new Set();

    // Prefer layout.elementOrder for determinism
    for (const id of orderedIds) {
        const el = layout?.elements?.[id];
        if (!el?.isPlaceholder) continue;
        const type = el.placeholderType || 'content';
        if (!byType[type]) byType[type] = [];
        byType[type].push(el);
        seen.add(id);
    }

    // Fall back to remaining placeholders
    for (const el of Object.values(layout?.elements || {})) {
        if (!el?.isPlaceholder) continue;
        if (seen.has(el.id)) continue;
        const type = el.placeholderType || 'content';
        if (!byType[type]) byType[type] = [];
        byType[type].push(el);
    }

    return byType;
}

function getPlaceholderTypeForElement(sourceLayout, slideElId, slideEl) {
    const sourceMasterEl = sourceLayout?.elements?.[slideElId];
    if (sourceMasterEl?.isPlaceholder) return sourceMasterEl.placeholderType || 'content';
    if (slideEl?.isPlaceholder) return slideEl.placeholderType || 'content';
    if (slideEl?.origin?.placeholderType) return slideEl.origin.placeholderType;
    return null;
}

function ensureDetachedOrigin(slideEl, { placeholderType, sourceLayoutId, sourceMasterElementId, now }) {
    const origin = {
        placeholderType,
        sourceLayoutId,
        sourceMasterElementId,
        detachedAt: now
    };

    // Preserve any existing origin fields while ensuring required ones exist
    return {
        ...slideEl,
        origin: {
            ...slideEl.origin,
            ...origin
        }
    };
}

function generateDetachedId(slideElId, placeholderType, now) {
    // Keep readable + deterministic-ish; avoid collisions with placeholder ids.
    return `detached-${placeholderType || 'content'}-${slideElId}-${now}`;
}

/**
 * Determine a mapping from source placeholder ids to target placeholder ids.
 *
 * Returns:
 * - mapping: { [sourcePlaceholderId]: targetPlaceholderId | null }
 */
export function mapPlaceholders(sourceLayout, targetLayout, sourceSlide) {
    const mapping = {};

    if (!sourceLayout || !targetLayout || !sourceSlide) {
        return { mapping, unmappedSourceIds: [], unusedTargetIds: [] };
    }

    const targetPlaceholders = {};
    const targetByType = getPlaceholdersByType(targetLayout);

    for (const el of Object.values(targetLayout.elements || {})) {
        if (el?.isPlaceholder) targetPlaceholders[el.id] = el;
    }

    const usedTarget = new Set();

    const sourceByType = getPlaceholdersByType(sourceLayout);

    const sourcePlaceholderIds = Object.keys(sourceSlide.elements || {}).filter(id => {
        return !!sourceLayout.elements?.[id]?.isPlaceholder;
    });

    for (const sourceId of sourcePlaceholderIds) {
        const slideEl = sourceSlide.elements[sourceId];
        const type = getPlaceholderTypeForElement(sourceLayout, sourceId, slideEl) || 'content';

        let targetId = null;

        // 1) Stable identity match: same id exists in target and not already used
        if (targetPlaceholders[sourceId] && !usedTarget.has(sourceId)) {
            targetId = sourceId;
        }

        // 2) Type + index match (index within placeholders of that type)
        if (!targetId) {
            const sourceList = sourceByType[type] || [];
            const targetList = targetByType[type] || [];

            const idx = sourceList.findIndex(p => p.id === sourceId);
            if (idx >= 0 && targetList[idx] && !usedTarget.has(targetList[idx].id)) {
                targetId = targetList[idx].id;
            }
        }

        // 3) Type match: first available unused
        if (!targetId) {
            const targetList = targetByType[type] || [];
            for (const candidate of targetList) {
                if (!usedTarget.has(candidate.id)) {
                    targetId = candidate.id;
                    break;
                }
            }
        }

        if (targetId) usedTarget.add(targetId);
        mapping[sourceId] = targetId;
    }

    const unmappedSourceIds = sourcePlaceholderIds.filter(id => !mapping[id]);

    const allTargetPlaceholderIds = Object.keys(targetPlaceholders);
    const unusedTargetIds = allTargetPlaceholderIds.filter(id => !usedTarget.has(id));

    return { mapping, unmappedSourceIds, unusedTargetIds };
}

/**
 * Detach the given placeholder elements into free elements and add origin metadata.
 *
 * This mutates the passed slide object.
 */
export function detachUnmappedPlaceholderContent(slide, { sourceLayoutId, idsToDetach = [], now = Date.now() } = {}) {
    if (!slide?.elements || !Array.isArray(idsToDetach) || idsToDetach.length === 0) return;

    for (const sourceId of idsToDetach) {
        const el = slide.elements[sourceId];
        if (!el) continue;

        const placeholderType = el.placeholderType || el.origin?.placeholderType || 'content';

        const detached = ensureDetachedOrigin(
            {
                ...el,
                id: generateDetachedId(sourceId, placeholderType, now)
            },
            {
                placeholderType,
                sourceLayoutId,
                sourceMasterElementId: sourceId,
                now
            }
        );

        delete detached.isPlaceholder;
        delete detached.placeholderType;

        // Replace the original id key with the detached id key
        delete slide.elements[sourceId];
        slide.elements[detached.id] = detached;

        if (Array.isArray(slide.elementOrder)) {
            const idx = slide.elementOrder.indexOf(sourceId);
            if (idx !== -1) slide.elementOrder[idx] = detached.id;
        }
    }
}

/**
 * Attempt to restore detached elements (with `origin.placeholderType`) into placeholders
 * in the target layout.
 *
 * This mutates the passed slide object.
 */
export function restoreDetachedContent(slide, targetLayout) {
    if (!slide?.elements || !targetLayout) return;

    const targetByType = getPlaceholdersByType(targetLayout);

    // Track placeholders already overridden by slide elements
    const usedPlaceholderIds = new Set();
    for (const [id, el] of Object.entries(slide.elements)) {
        if (el?.isPlaceholder) usedPlaceholderIds.add(id);
    }

    const detachedEntries = Object.entries(slide.elements).filter(([, el]) => {
        return !el?.isPlaceholder && !!el?.origin?.placeholderType;
    });

    for (const [detachedId, detachedEl] of detachedEntries) {
        const type = detachedEl.origin.placeholderType;
        const candidates = targetByType[type] || [];

        let target = null;
        for (const ph of candidates) {
            if (!usedPlaceholderIds.has(ph.id)) {
                target = ph;
                break;
            }
        }

        if (!target) continue;

        // Create/overwrite placeholder override with detached content
        slide.elements[target.id] = {
            id: target.id,
            type: detachedEl.type,
            content: detachedEl.content,
            isPlaceholder: true,
            placeholderType: target.placeholderType,
            x: target.x,
            y: target.y,
            width: target.width,
            height: target.height,
            rotation: detachedEl.rotation || 0,
            opacity: detachedEl.opacity !== undefined ? detachedEl.opacity : 1,
            style: { ...target.style, ...detachedEl.style }
        };

        // Preserve image source if applicable
        if (detachedEl.type === 'image' && detachedEl.src) {
            slide.elements[target.id].src = detachedEl.src;
        }

        usedPlaceholderIds.add(target.id);

        // Remove detached element
        delete slide.elements[detachedId];
        if (Array.isArray(slide.elementOrder)) {
            const idx = slide.elementOrder.indexOf(detachedId);
            if (idx !== -1) slide.elementOrder.splice(idx, 1);
        }
    }
}
