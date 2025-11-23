
import { historyManager } from '../../HistoryManager.js';

function remapContent(store, slide, newLayoutId) {
    const state = store.state;
    const oldLayoutId = slide.layoutId;
    const oldLayout = state.masters[oldLayoutId];
    const newLayout = state.masters[newLayoutId];

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

export function handleAddSlide(store) {
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
    store.state.slides[newSlideId] = newSlide;
    store.state.slideOrder.push(newSlideId);
    store.state.editor.activeSlideId = newSlideId;
    store.emit('state-changed', store.state);
}

export function handleDeleteSlide(store, payload) {
    const slideIdToDelete = payload;
    if (store.state.slideOrder.length <= 1) return;

    const indexToDelete = store.state.slideOrder.indexOf(slideIdToDelete);
    if (indexToDelete === -1) return;

    store.state.slideOrder.splice(indexToDelete, 1);
    delete store.state.slides[slideIdToDelete];

    if (store.state.editor.activeSlideId === slideIdToDelete) {
        const newIndex = Math.max(0, indexToDelete - 1);
        store.state.editor.activeSlideId = store.state.slideOrder[newIndex];
    }
    
    store.emit('state-changed', store.state);
}

export function handleDuplicateSlide(store, payload) {
    const sourceId = payload;
    const sourceSlide = store.state.slides[sourceId];
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

    const sourceIndex = store.state.slideOrder.indexOf(sourceId);
    store.state.slides[dupId] = dupSlide;
    store.state.slideOrder.splice(sourceIndex + 1, 0, dupId);
    
    store.state.editor.activeSlideId = dupId;
    store.emit('state-changed', store.state);
}

export function handlePasteSlide(store, payload) {
    const { sourceId: pasteSourceId, targetId: pasteTargetId } = payload;
    const pasteSourceSlide = store.state.slides[pasteSourceId];
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

    const pasteTargetIndex = store.state.slideOrder.indexOf(pasteTargetId);
    store.state.slides[pasteDupId] = pasteDupSlide;
    if (pasteTargetIndex === -1) {
        store.state.slideOrder.push(pasteDupId);
    } else {
        store.state.slideOrder.splice(pasteTargetIndex + 1, 0, pasteDupId);
    }
    
    store.state.editor.activeSlideId = pasteDupId;
    store.emit('state-changed', store.state);
}

export function handleReorderSlides(store, payload) {
    const { fromIndex, toIndex } = payload;
    if (fromIndex < 0 || fromIndex >= store.state.slideOrder.length || 
        toIndex < 0 || toIndex >= store.state.slideOrder.length) return;

    const [movedId] = store.state.slideOrder.splice(fromIndex, 1);
    store.state.slideOrder.splice(toIndex, 0, movedId);
    
    store.emit('state-changed', store.state);
}

export function handleUpdateSlide(store, payload, options = {}) {
    const { fromHistory } = options;
    const slideToUpdate = store.state.slides[payload.id];
    if (slideToUpdate) {
        if (!fromHistory) {
            const undoPayload = { id: payload.id };
            Object.keys(payload).forEach(key => {
                if (key !== 'id') undoPayload[key] = slideToUpdate[key];
            });
            
            historyManager.push({
                undo: { type: 'UPDATE_SLIDE', payload: undoPayload },
                redo: { type: 'UPDATE_SLIDE', payload: payload }
            });
        }

        if (payload.layoutId && payload.layoutId !== slideToUpdate.layoutId) {
            remapContent(store, slideToUpdate, payload.layoutId);
        }

        Object.assign(slideToUpdate, payload);
        store.emit('state-changed', store.state);
    }
}
