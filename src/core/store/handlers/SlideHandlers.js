import {
    mapPlaceholders,
    detachUnmappedPlaceholderContent,
    restoreDetachedContent
} from '../../master/Reconciliation.js';

function reconcileLayoutChange(draft, slide, newLayoutId) {
    const sourceLayoutId = slide.layoutId;
    const sourceLayout = draft.slideMasterPresets[sourceLayoutId];
    const targetLayout = draft.slideMasterPresets[newLayoutId];

    if (!sourceLayout || !targetLayout) return;

    // 1) Try to restore previously detached content into placeholders on the target layout
    restoreDetachedContent(slide, targetLayout);

    // 2) Map placeholder overrides from source layout to target layout
    const { mapping } = mapPlaceholders(sourceLayout, targetLayout, slide);

    const newElements = {};
    const newElementOrder = [];
    const idsToDetach = [];

    for (const elId of Object.keys(slide.elements || {})) {
        const slideEl = slide.elements[elId];
        const isSourcePlaceholder = !!sourceLayout.elements?.[elId]?.isPlaceholder;

        if (isSourcePlaceholder) {
            const targetId = mapping[elId];

            if (targetId) {
                const targetPh = targetLayout.elements?.[targetId];
                if (!targetPh) continue;

                const remappedEl = {
                    id: targetId,
                    type: slideEl.type,
                    content: slideEl.content,
                    isPlaceholder: true,
                    placeholderType: targetPh.placeholderType,
                    x: targetPh.x,
                    y: targetPh.y,
                    width: targetPh.width,
                    height: targetPh.height,
                    rotation: slideEl.rotation || 0,
                    opacity: slideEl.opacity !== undefined ? slideEl.opacity : 1,
                    style: { ...targetPh.style, ...slideEl.style }
                };

                if (slideEl.type === 'image' && slideEl.src) {
                    remappedEl.src = slideEl.src;
                }

                newElements[targetId] = remappedEl;
                newElementOrder.push(targetId);
            } else {
                idsToDetach.push(elId);
                newElements[elId] = { ...slideEl };
                newElementOrder.push(elId);
            }
        } else {
            newElements[elId] = { ...slideEl };
            newElementOrder.push(elId);
        }
    }

    slide.elements = newElements;
    slide.elementOrder = newElementOrder;

    // 3) Detach any unmapped placeholder-origin content and add provenance metadata
    detachUnmappedPlaceholderContent(slide, { sourceLayoutId, idsToDetach });
}

function cloneNotesDoc(notesDoc) {
    if (!notesDoc || typeof notesDoc !== 'object') return { version: 1, blocks: [] };
    try {
        if (typeof structuredClone === 'function') return structuredClone(notesDoc);
    } catch {
        // ignore
    }

    try {
        return JSON.parse(JSON.stringify(notesDoc));
    } catch {
        return { version: 1, blocks: [] };
    }
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
            typographyStyle: null, // null = inherit from layout/master
            slideTransition: null  // null = inherit from layout/master/system
        },
        elements: elements,
        elementOrder: elementOrder,
        notes: "",
        notesDoc: { version: 1, blocks: [] },
        // Legacy field retained for backward compatibility; Phase 1 must not default to morph-like transitions.
        transition: "fade"
    };
    draft.slides[newSlideId] = newSlide;
    
    // Smart insertion: insert at specified index or append at end
    const insertIndex = payload?.insertIndex;
    if (insertIndex !== undefined && insertIndex !== -1 && insertIndex <= draft.slideOrder.length) {
        draft.slideOrder.splice(insertIndex, 0, newSlideId);
    } else {
        draft.slideOrder.push(newSlideId);
    }
    
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
        notesDoc: cloneNotesDoc(sourceSlide.notesDoc),
        // Copy styleAssignments (or initialize if missing)
        styleAssignments: sourceSlide.styleAssignments 
            ? { ...sourceSlide.styleAssignments }
            : { colorTheme: null, typographyStyle: null, slideTransition: null }
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
        notesDoc: cloneNotesDoc(pasteSourceSlide.notesDoc),
        // Copy styleAssignments (or initialize if missing)
        styleAssignments: pasteSourceSlide.styleAssignments 
            ? { ...pasteSourceSlide.styleAssignments }
            : { colorTheme: null, typographyStyle: null, slideTransition: null }
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
            reconcileLayoutChange(draft, slideToUpdate, payload.layoutId);
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
            typographyStyle: null,
            slideTransition: null
        };
    }
    
    // Merge the new style assignments
    Object.assign(slide.styleAssignments, styleAssignments);
}

/**
 * Bulk update style assignments for multiple slides.
 * Used for multi-slide operations that must remain a single undo step.
 *
 * @param {Object} draft - Immer draft
 * @param {Object} payload - { slideIds: string[], styleAssignments: Object }
 */
export function handleUpdateSlidesStyleAssignments(draft, payload) {
    const slideIds = Array.isArray(payload?.slideIds) ? payload.slideIds : [];
    const styleAssignments = payload?.styleAssignments || {};

    slideIds.forEach((slideId) => {
        handleUpdateSlideStyleAssignments(draft, { slideId, styleAssignments });
    });
}
