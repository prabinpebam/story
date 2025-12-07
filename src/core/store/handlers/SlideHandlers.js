

/**
 * Intelligently remap content when changing layouts.
 * Priority order:
 * 1. mappingId Match - Exact placeholder ID match
 * 2. Type + Index Match - Same placeholderType with same index
 * 3. Type Match - Same placeholderType (first available)
 * 4. Overflow - Content becomes a free element (no longer tied to placeholder)
 */
function remapContent(draft, slide, newLayoutId) {
    const oldLayoutId = slide.layoutId;
    const oldLayout = draft.slideMasterPresets[oldLayoutId];
    const newLayout = draft.slideMasterPresets[newLayoutId];

    if (!oldLayout || !newLayout) return;

    // Build maps of old and new placeholders
    const oldPlaceholders = {};
    const newPlaceholders = {};
    const newPlaceholdersByType = {};

    // Collect old placeholders with content
    Object.values(oldLayout.elements || {}).forEach(el => {
        if (el.isPlaceholder) {
            oldPlaceholders[el.id] = el;
        }
    });

    // Collect new placeholders
    Object.values(newLayout.elements || {}).forEach(el => {
        if (el.isPlaceholder) {
            newPlaceholders[el.id] = el;
            const type = el.placeholderType || 'content';
            if (!newPlaceholdersByType[type]) {
                newPlaceholdersByType[type] = [];
            }
            newPlaceholdersByType[type].push(el);
        }
    });

    // Track which new placeholders have been mapped
    const usedNewPlaceholders = new Set();
    
    // New elements object
    const newElements = {};
    const newElementOrder = [];

    // Process each slide element
    Object.keys(slide.elements).forEach(elId => {
        const slideEl = slide.elements[elId];
        const oldMasterEl = oldLayout.elements?.[elId];

        // Check if this element was in an old placeholder
        if (oldMasterEl && oldMasterEl.isPlaceholder) {
            const placeholderType = oldMasterEl.placeholderType || 'content';
            let targetPlaceholder = null;

            // Priority 1: Exact ID match
            if (newPlaceholders[elId] && !usedNewPlaceholders.has(elId)) {
                targetPlaceholder = newPlaceholders[elId];
            }

            // Priority 2 & 3: Type match
            if (!targetPlaceholder) {
                const candidates = newPlaceholdersByType[placeholderType] || [];
                for (const candidate of candidates) {
                    if (!usedNewPlaceholders.has(candidate.id)) {
                        targetPlaceholder = candidate;
                        break;
                    }
                }
            }

            if (targetPlaceholder) {
                // Remap to new placeholder
                usedNewPlaceholders.add(targetPlaceholder.id);
                
                // Keep content-related properties, use new placeholder's position
                const remappedEl = {
                    id: targetPlaceholder.id,
                    type: slideEl.type,
                    content: slideEl.content,
                    isPlaceholder: true,
                    placeholderType: targetPlaceholder.placeholderType,
                    x: targetPlaceholder.x,
                    y: targetPlaceholder.y,
                    width: targetPlaceholder.width,
                    height: targetPlaceholder.height,
                    rotation: slideEl.rotation || 0,
                    opacity: slideEl.opacity !== undefined ? slideEl.opacity : 1,
                    style: { ...targetPlaceholder.style, ...slideEl.style }
                };
                
                // Preserve image source if applicable
                if (slideEl.type === 'image' && slideEl.src) {
                    remappedEl.src = slideEl.src;
                }

                newElements[targetPlaceholder.id] = remappedEl;
                newElementOrder.push(targetPlaceholder.id);
            } else {
                // Priority 4: Overflow - becomes free element
                // Keep the element but mark it as no longer a placeholder
                const freeEl = { ...slideEl };
                delete freeEl.isPlaceholder;
                delete freeEl.placeholderType;
                newElements[elId] = freeEl;
                newElementOrder.push(elId);
            }
        } else {
            // Non-placeholder element - keep as-is
            newElements[elId] = { ...slideEl };
            newElementOrder.push(elId);
        }
    });

    // Update slide
    slide.elements = newElements;
    slide.elementOrder = newElementOrder;
}

export function handleAddSlide(draft, payload) {
    const newSlideId = `slide-${Date.now()}`;
    
    // Determine layout - use payload.layoutId if provided, otherwise default
    const layoutId = payload?.layoutId || "layout-blank";
    const layout = draft.slideMasterPresets[layoutId];
    
    // Copy placeholder elements from layout so they can be edited on the slide
    const elements = {};
    const elementOrder = [];
    
    if (layout && layout.elements) {
        Object.keys(layout.elements).forEach(elId => {
            const layoutEl = layout.elements[elId];
            if (layoutEl.isPlaceholder) {
                // Copy placeholder to slide
                elements[elId] = { ...layoutEl };
                elementOrder.push(elId);
            }
        });
    }
    
    const newSlide = {
        id: newSlideId,
        layoutId: layoutId,
        title: "New Slide",
        width: 1920,
        height: 1080,
        background: null,
        // Style Assignments - inherit from parent by default
        styleAssignments: {
            colorTheme: null,      // null = inherit from layout/master
            typographyStyle: null  // null = inherit from layout/master
        },
        elements: elements,
        elementOrder: elementOrder,
        notes: "",
        transition: "magic"
    };
    draft.slides[newSlideId] = newSlide;
    draft.slideOrder.push(newSlideId);
    draft.editor.activeSlideId = newSlideId;
}

export function handleDeleteSlide(draft, payload) {
    const slideIdToDelete = payload;
    if (draft.slideOrder.length <= 1) return;

    const indexToDelete = draft.slideOrder.indexOf(slideIdToDelete);
    if (indexToDelete === -1) return;

    draft.slideOrder.splice(indexToDelete, 1);
    delete draft.slides[slideIdToDelete];

    if (draft.editor.activeSlideId === slideIdToDelete) {
        const newIndex = Math.max(0, indexToDelete - 1);
        draft.editor.activeSlideId = draft.slideOrder[newIndex];
    }
}

export function handleDuplicateSlide(draft, payload) {
    const sourceId = payload;
    const sourceSlide = draft.slides[sourceId];
    if (!sourceSlide) return;

    const dupId = `slide-${Date.now()}`;
    const newElements = {};
    Object.keys(sourceSlide.elements).forEach(key => {
        newElements[key] = { ...sourceSlide.elements[key] };
    });

    const dupSlide = {
        ...sourceSlide,
        id: dupId,
        title: `${sourceSlide.title} (Copy)`,
        elements: newElements,
        elementOrder: [...sourceSlide.elementOrder],
        // Copy styleAssignments (or initialize if missing)
        styleAssignments: sourceSlide.styleAssignments 
            ? { ...sourceSlide.styleAssignments }
            : { colorTheme: null, typographyStyle: null }
    };

    const sourceIndex = draft.slideOrder.indexOf(sourceId);
    draft.slides[dupId] = dupSlide;
    draft.slideOrder.splice(sourceIndex + 1, 0, dupId);
    
    draft.editor.activeSlideId = dupId;
}

export function handlePasteSlide(draft, payload) {
    const { sourceId: pasteSourceId, targetId: pasteTargetId } = payload;
    const pasteSourceSlide = draft.slides[pasteSourceId];
    if (!pasteSourceSlide) return;

    const pasteDupId = `slide-${Date.now()}`;
    const pasteNewElements = {};
    Object.keys(pasteSourceSlide.elements).forEach(key => {
        pasteNewElements[key] = { ...pasteSourceSlide.elements[key] };
    });

    const pasteDupSlide = {
        ...pasteSourceSlide,
        id: pasteDupId,
        title: `${pasteSourceSlide.title} (Copy)`,
        elements: pasteNewElements,
        elementOrder: [...pasteSourceSlide.elementOrder],
        // Copy styleAssignments (or initialize if missing)
        styleAssignments: pasteSourceSlide.styleAssignments 
            ? { ...pasteSourceSlide.styleAssignments }
            : { colorTheme: null, typographyStyle: null }
    };

    const pasteTargetIndex = draft.slideOrder.indexOf(pasteTargetId);
    draft.slides[pasteDupId] = pasteDupSlide;
    if (pasteTargetIndex === -1) {
        draft.slideOrder.push(pasteDupId);
    } else {
        draft.slideOrder.splice(pasteTargetIndex + 1, 0, pasteDupId);
    }
    
    draft.editor.activeSlideId = pasteDupId;
}

export function handleReorderSlides(draft, payload) {
    const { fromIndex, toIndex } = payload;
    if (fromIndex < 0 || fromIndex >= draft.slideOrder.length || 
        toIndex < 0 || toIndex >= draft.slideOrder.length) return;

    const [movedId] = draft.slideOrder.splice(fromIndex, 1);
    draft.slideOrder.splice(toIndex, 0, movedId);
}

export function handleUpdateSlide(draft, payload) {
    const slideToUpdate = draft.slides[payload.id];
    if (slideToUpdate) {
        if (payload.layoutId && payload.layoutId !== slideToUpdate.layoutId) {
            remapContent(draft, slideToUpdate, payload.layoutId);
        }

        Object.assign(slideToUpdate, payload);
    }
}

/**
 * Update style assignments for a slide.
 * Used to override or clear theme/typography assignments at the slide level.
 * 
 * @param {Object} draft - Immer draft
 * @param {Object} payload - { slideId, styleAssignments: { colorTheme?, typographyStyle? }}
 */
export function handleUpdateSlideStyleAssignments(draft, payload) {
    const { slideId, styleAssignments } = payload;
    const slide = draft.slides[slideId];
    
    if (!slide) return;
    
    // Initialize styleAssignments if not present (for legacy slides)
    if (!slide.styleAssignments) {
        slide.styleAssignments = {
            colorTheme: null,
            typographyStyle: null
        };
    }
    
    // Merge the new style assignments
    Object.assign(slide.styleAssignments, styleAssignments);
}
