

function remapContent(draft, slide, newLayoutId) {
    const oldLayoutId = slide.layoutId;
    const oldLayout = draft.masters[oldLayoutId];
    const newLayout = draft.masters[newLayoutId];

    if (!oldLayout || !newLayout) return;

    Object.keys(slide.elements).forEach(elId => {
        const slideEl = slide.elements[elId];
        const oldMasterEl = oldLayout.elements[elId];

        if (oldMasterEl && oldMasterEl.isPlaceholder) {
            const newMasterEl = newLayout.elements[elId];
            
            if (newMasterEl && newMasterEl.isPlaceholder) {
                const keptProps = ['id', 'type', 'content'];
                if (slideEl.type === 'image') keptProps.push('src');
                
                const newSlideEl = {};
                keptProps.forEach(prop => {
                    if (slideEl[prop] !== undefined) newSlideEl[prop] = slideEl[prop];
                });
                
                slide.elements[elId] = newSlideEl;
            }
        }
    });
}

export function handleAddSlide(draft) {
    const newSlideId = `slide-${Date.now()}`;
    const newSlide = {
        id: newSlideId,
        layoutId: "layout-blank",
        title: "New Slide",
        width: 1920,
        height: 1080,
        background: null,
        elements: {},
        elementOrder: [],
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
        elementOrder: [...sourceSlide.elementOrder]
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
        elementOrder: [...pasteSourceSlide.elementOrder]
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

