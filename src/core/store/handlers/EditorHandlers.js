
export function handleSelectSlide(store, payload) {
    const { id: selectSlideId, multi } = payload;
    if (multi) {
        const index = store.state.editor.selectedSlideIds.indexOf(selectSlideId);
        if (index === -1) {
            store.state.editor.selectedSlideIds.push(selectSlideId);
        } else {
            store.state.editor.selectedSlideIds.splice(index, 1);
        }
    } else {
        store.state.editor.selectedSlideIds = [selectSlideId];
    }
    store.emit('state-changed', store.state);
}

export function handleDeselectSlides(store) {
    store.state.editor.selectedSlideIds = [];
    store.emit('state-changed', store.state);
}

export function handleSetActiveSlide(store, payload) {
    if (store.state.slides[payload]) {
        store.state.editor.activeSlideId = payload;
        store.emit('state-changed', store.state);
    }
}

export function handleSetActiveMaster(store, payload) {
    if (store.state.masters[payload]) {
        store.state.editor.activeMasterId = payload;
        store.emit('state-changed', store.state);
    }
}

export function handleSetActiveTool(store, payload) {
    store.state.editor.activeTool = payload;
    if (payload !== 'select') {
        store.state.editor.selectedElementIds = [];
        store.state.editor.editingElementId = null;
    }
    store.emit('state-changed', store.state);
}

export function handleSetMode(store, payload) {
    store.state.editor.mode = payload;
    
    if (payload === 'master' && !store.state.editor.activeMasterId) {
        const firstMaster = Object.keys(store.state.masters)[0];
        if (firstMaster) {
            store.state.editor.activeMasterId = firstMaster;
        }
    }

    if (payload === 'presentation') {
        store.state.presentation.isActive = true;
        store.state.presentation.buildIndex = -1;
        store.state.presentation.buildCount = 0;
        const currentIndex = store.state.slideOrder.indexOf(store.state.editor.activeSlideId);
        store.state.presentation.currentSlideIndex = currentIndex !== -1 ? currentIndex : 0;
    } else {
        store.state.presentation.isActive = false;
        store.state.presentation.laserPointer = false;
        store.state.presentation.blackScreen = false;
        store.state.presentation.whiteScreen = false;
        store.state.presentation.gridView = false;
    }

    store.emit('state-changed', store.state);
    store.emit('mode-changed', payload);
}

export function handleSetEditingElement(store, payload) {
    store.state.editor.editingElementId = payload;
    store.emit('state-changed', store.state);
}

export function handleUpdateViewport(store, payload) {
    store.state.editor.pan = payload.pan || store.state.editor.pan;
    store.state.editor.zoom = payload.zoom || store.state.editor.zoom;
    store.emit('viewport-changed', { pan: store.state.editor.pan, zoom: store.state.editor.zoom });
}

export function handleUpdateSelection(store, payload) {
    store.state.editor.selectedElementIds = payload;
    store.emit('state-changed', store.state);
    store.emit('selection-changed', store.state.editor.selectedElementIds);
}

export function handleToggleTheme(store) {
    store.state.theme = store.state.theme === 'light' ? 'dark' : 'light';
    store.emit('theme-change', store.state.theme);
}
